import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApprovalStatus,
  CourierAvailabilityStatus,
  OperationalStatus,
  Prisma,
  RoleScope,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { OtpService } from '../otp/otp.service';
import { ROLE } from '../common/constants/role.constants';
import {
  AUTH_MESSAGES,
  COURIER_MESSAGES,
  RESOURCE_MESSAGES,
} from '../common/constants/messages.constant';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';
import {
  COURIER_APPROVAL_STATUS,
  COURIER_AVAILABILITY_STATUS,
  COURIER_OPERATIONAL_STATUS,
  COURIER_REGISTRATION_OTP,
} from '../common/constants/courier.constant';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { CreateCourierDto } from './dto/create-courier.dto';
import {
  CourierListResponse,
  CourierQueryDto,
  CourierStatistics,
} from './dto/courier-query.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';
import { UpdateCourierApprovalDto } from './dto/update-courier-approval.dto';
import { UpdateCourierAvailabilityDto } from './dto/update-courier-availability.dto';
import { CourierQueryBuilder } from './builders/courier-query.builder';
import { CourierEntity } from './entities/courier.entity';

@Injectable()
export class CourierService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otpService: OtpService
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    return this.otpService.requestOtp(dto);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto, COURIER_REGISTRATION_OTP);
  }

  async create(userId: number, dto: CreateCourierDto): Promise<CourierEntity> {
    let payload: { phone: string; type: string };
    try {
      payload = this.jwtService.verify(dto.verificationToken);
    } catch {
      throw new UnauthorizedException(
        AUTH_MESSAGES.INVALID_OR_EXPIRED_VERIFICATION_TOKEN
      );
    }

    if (payload.type !== COURIER_REGISTRATION_OTP) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN_TYPE);
    }

    if (payload.phone !== dto.phone) {
      throw new UnauthorizedException(AUTH_MESSAGES.PHONE_NUMBER_MISMATCH);
    }

    const existingCourier = await this.prisma.courier.findUnique({
      where: { userId },
    });

    if (existingCourier) {
      throw new ConflictException(COURIER_MESSAGES.ALREADY_REGISTERED);
    }

    const currentLocation = this.mapLocation(dto.currentLocation);

    const courier = await this.prisma.courier.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        vehicleType: dto.vehicleType,
        currentLocation: currentLocation ?? Prisma.JsonNull,
        approvalStatus: COURIER_APPROVAL_STATUS.PENDING as ApprovalStatus,
        operationalStatus:
          COURIER_OPERATIONAL_STATUS.INACTIVE as OperationalStatus,
        status:
          COURIER_AVAILABILITY_STATUS.OFFLINE as CourierAvailabilityStatus,
      },
      include: {
        user: true,
      },
    });

    return new CourierEntity(courier, { user: courier.user });
  }

  async findAll(
    query: CourierQueryDto
  ): Promise<CourierListResponse<CourierEntity>> {
    const take = query.limit ?? 10;
    const skip = query.skip;

    const where = new CourierQueryBuilder()
      .withApprovalStatus(query.approvalStatus)
      .withOperationalStatus(query.operationalStatus)
      .withAvailabilityStatus(query.status)
      .withSearch(query.search)
      .build();

    const [items, total] = await this.prisma.$transaction([
      this.prisma.courier.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              externalId: true,
              email: true,
              username: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.courier.count({ where }),
    ]);

    const response: CourierListResponse<CourierEntity> = {
      data: items.map((item) => new CourierEntity(item, { user: item.user })),
      total,
      page: query.page ?? 1,
      limit: take,
    };

    if (query.shouldIncludeStatistics) {
      response.statistics = await this.getStatistics();
    }

    return response;
  }

  private async getStatistics(): Promise<CourierStatistics> {
    const [totalApproved, totalPending, totalOnline] =
      await this.prisma.$transaction([
        this.prisma.courier.count({
          where: {
            approvalStatus: COURIER_APPROVAL_STATUS.APPROVED as ApprovalStatus,
          },
        }),
        this.prisma.courier.count({
          where: {
            approvalStatus: COURIER_APPROVAL_STATUS.PENDING as ApprovalStatus,
          },
        }),
        this.prisma.courier.count({
          where: {
            approvalStatus: COURIER_APPROVAL_STATUS.APPROVED as ApprovalStatus,
            status:
              COURIER_AVAILABILITY_STATUS.ONLINE as CourierAvailabilityStatus,
          },
        }),
      ]);

    return { totalApproved, totalPending, totalOnline };
  }

  async findByExternalId(externalId: string): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
      include: {
        user: {
          select: {
            externalId: true,
            email: true,
            username: true,
            phone: true,
          },
        },
      },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    return new CourierEntity(courier, { user: courier.user });
  }

  async findMe(userId: number): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            externalId: true,
            email: true,
            username: true,
            phone: true,
          },
        },
      },
    });

    if (!courier) {
      throw new NotFoundException(COURIER_MESSAGES.NOT_FOUND);
    }

    return new CourierEntity(courier, { user: courier.user });
  }

  async update(
    externalId: string,
    dto: UpdateCourierDto
  ): Promise<CourierEntity> {
    await this.findByExternalId(externalId);

    const currentLocation = this.mapLocation(dto.currentLocation);

    const courier = await this.prisma.courier.update({
      where: { externalId },
      data: {
        name: dto.name,
        phone: dto.phone,
        vehicleType: dto.vehicleType,
        operationalStatus: dto.operationalStatus as
          | OperationalStatus
          | undefined,
        status: dto.status as CourierAvailabilityStatus | undefined,
        currentLocation,
      },
      include: {
        user: {
          select: {
            externalId: true,
            email: true,
            username: true,
            phone: true,
          },
        },
      },
    });

    return new CourierEntity(courier, { user: courier.user });
  }

  async updateMyAvailability(
    userId: number,
    dto: UpdateCourierAvailabilityDto
  ): Promise<CourierEntity> {
    const current = await this.findMe(userId);

    if (current.approvalStatus !== COURIER_APPROVAL_STATUS.APPROVED) {
      throw new ForbiddenException(COURIER_MESSAGES.APPROVAL_REQUIRED);
    }

    if (current.operationalStatus !== COURIER_OPERATIONAL_STATUS.ACTIVE) {
      throw new ForbiddenException(
        RESOURCE_MESSAGES.OPERATION_DENIED(
          RESOURCE_TARGETS.COURIER,
          current.operationalStatus
        )
      );
    }

    const currentLocation = this.mapLocation(dto.currentLocation);

    const courier = await this.prisma.courier.update({
      where: { userId },
      data: {
        status: dto.status as CourierAvailabilityStatus,
        currentLocation,
      },
      include: {
        user: {
          select: {
            externalId: true,
            email: true,
            username: true,
            phone: true,
          },
        },
      },
    });

    return new CourierEntity(courier, { user: courier.user });
  }

  async updateApproval(
    externalId: string,
    adminUserId: number,
    dto: UpdateCourierApprovalDto
  ): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
      include: {
        user: {
          select: {
            externalId: true,
            email: true,
            username: true,
            phone: true,
          },
        },
      },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    if (
      dto.status === COURIER_APPROVAL_STATUS.REJECTED &&
      !dto.rejectionReason?.trim()
    ) {
      throw new BadRequestException(COURIER_MESSAGES.REJECTION_REASON_REQUIRED);
    }

    if (
      courier.approvalStatus === dto.status &&
      (dto.status !== COURIER_APPROVAL_STATUS.REJECTED ||
        courier.rejectionReason === dto.rejectionReason)
    ) {
      return new CourierEntity(courier, { user: courier.user });
    }

    const now = new Date();
    const courierRole =
      dto.status === COURIER_APPROVAL_STATUS.APPROVED
        ? await this.ensureCourierRole()
        : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedCourier = await tx.courier.update({
        where: { externalId },
        data:
          dto.status === COURIER_APPROVAL_STATUS.APPROVED
            ? {
                approvalStatus:
                  COURIER_APPROVAL_STATUS.APPROVED as ApprovalStatus,
                approvedAt: courier.approvedAt ?? now,
                approvedBy: adminUserId,
                rejectedAt: null,
                rejectedBy: null,
                rejectionReason: null,
                operationalStatus:
                  COURIER_OPERATIONAL_STATUS.ACTIVE as OperationalStatus,
                statusChangedAt: now,
                statusChangedBy: adminUserId,
                statusReason: dto.statusReason ?? 'Approved by admin',
              }
            : {
                approvalStatus:
                  COURIER_APPROVAL_STATUS.REJECTED as ApprovalStatus,
                rejectedAt: now,
                rejectedBy: adminUserId,
                rejectionReason: dto.rejectionReason,
                operationalStatus:
                  COURIER_OPERATIONAL_STATUS.INACTIVE as OperationalStatus,
                status:
                  COURIER_AVAILABILITY_STATUS.OFFLINE as CourierAvailabilityStatus,
                statusChangedAt: now,
                statusChangedBy: adminUserId,
                statusReason: dto.statusReason ?? dto.rejectionReason,
              },
        include: {
          user: {
            select: {
              externalId: true,
              email: true,
              username: true,
              phone: true,
            },
          },
        },
      });

      if (dto.status === COURIER_APPROVAL_STATUS.APPROVED && courierRole) {
        const existingRole = await tx.userRole.findFirst({
          where: {
            userId: courier.userId,
            roleId: courierRole.id,
            merchantId: null,
            agencyId: null,
            brandId: null,
          },
        });

        if (!existingRole) {
          await tx.userRole.create({
            data: {
              userId: courier.userId,
              roleId: courierRole.id,
            },
          });
        }
      }

      if (dto.status === COURIER_APPROVAL_STATUS.REJECTED) {
        await tx.userRole.deleteMany({
          where: {
            userId: courier.userId,
            merchantId: null,
            agencyId: null,
            brandId: null,
            role: {
              name: ROLE.COURIER,
            },
          },
        });
      }

      return updatedCourier;
    });

    return new CourierEntity(updated, { user: updated.user });
  }

  async remove(externalId: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
      select: {
        userId: true,
      },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({
        where: {
          userId: courier.userId,
          merchantId: null,
          agencyId: null,
          brandId: null,
          role: { name: ROLE.COURIER },
        },
      });

      await tx.courier.delete({
        where: { externalId },
      });
    });

    return { message: 'Courier deleted successfully' };
  }

  private async ensureCourierRole() {
    let role = await this.prisma.role.findUnique({
      where: { name: ROLE.COURIER },
    });

    if (!role) {
      role = await this.prisma.role.create({
        data: {
          name: ROLE.COURIER,
          scope: RoleScope.PLATFORM,
        },
      });
    }

    return role;
  }

  private mapLocation(location?: {
    lat: number;
    lng: number;
  }): Prisma.InputJsonValue | undefined {
    if (!location) {
      return undefined;
    }

    return {
      lat: location.lat,
      lng: location.lng,
    } as Prisma.InputJsonValue;
  }
}
