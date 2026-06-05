import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApprovalStatus,
  OperationalStatus,
  Prisma,
  RoleScope,
} from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma.service';
import { OtpService } from '../otp/otp.service';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { ROLE } from '../common/constants/role.constants';
import {
  AUTH_MESSAGES,
  RESOURCE_MESSAGES,
} from '../common/constants/messages.constant';
import {
  COURIER_OPERATIONAL_STATUS,
  COURIER_REGISTRATION_OTP,
  COURIER_STATUS,
} from '../common/constants/courier.constant';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';
import {
  CourierListResponse,
  CourierQueryDto,
  CourierStatistics,
} from './dto/courier-query.dto';
import { CourierQueryBuilder } from './builders/courier-query.builder';
import { CourierEntity } from './entities/courier.entity';

@Injectable()
export class CourierService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpService: OtpService
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    return this.otpService.requestOtp(dto);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto, COURIER_REGISTRATION_OTP);
  }

  async create(userId: number, dto: CreateCourierDto): Promise<CourierEntity> {
    let payload;
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
      throw new ConflictException('Courier registration already exists');
    }

    const courier = await this.prisma.courier.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        vehicleType: dto.vehicleType,
        approvalStatus: COURIER_STATUS.PENDING as ApprovalStatus,
        operationalStatus:
          COURIER_OPERATIONAL_STATUS.ACTIVE as OperationalStatus,
      },
    });

    return new CourierEntity(courier);
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
      }),
      this.prisma.courier.count({ where }),
    ]);

    const response: CourierListResponse<CourierEntity> = {
      data: items.map((item) => new CourierEntity(item)),
      total,
      page: query.page ?? 1,
      limit: take,
    };

    if (query.shouldIncludeStatistics) {
      response.statistics = await this.getStatistics();
    }

    return response;
  }

  async findByExternalId(externalId: string): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
    });

    if (!courier) {
      throw new NotFoundException(RESOURCE_MESSAGES.NOT_FOUND('COURIER'));
    }

    return new CourierEntity(courier);
  }

  async update(
    externalId: string,
    dto: UpdateCourierDto,
    adminUserId?: number
  ): Promise<CourierEntity> {
    await this.findByExternalId(externalId);
    const { currentLocation, operationalStatus, ...rest } = dto;
    const data: Prisma.CourierUpdateInput = {
      ...rest,
    };

    if (currentLocation !== undefined) {
      data.currentLocation = currentLocation as Prisma.InputJsonValue;
    }

    if (operationalStatus) {
      data.operationalStatus = operationalStatus as OperationalStatus;
      data.statusChangedAt = new Date();
      data.statusChangedBy = adminUserId;
    }

    const courier = await this.prisma.courier.update({
      where: { externalId },
      data,
    });

    return new CourierEntity(courier);
  }

  async approve(externalId: string, adminUserId: number): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
    });

    if (!courier) {
      throw new NotFoundException(RESOURCE_MESSAGES.NOT_FOUND('COURIER'));
    }

    if (courier.approvalStatus === COURIER_STATUS.APPROVED) {
      return new CourierEntity(courier);
    }

    const updatedCourier = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.courier.update({
        where: { externalId },
        data: {
          approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus,
          approvedAt: new Date(),
          approvedBy: adminUserId,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
        },
      });

      let courierRole = await tx.role.findUnique({
        where: { name: ROLE.COURIER },
      });

      if (!courierRole) {
        courierRole = await tx.role.create({
          data: { name: ROLE.COURIER, scope: RoleScope.PLATFORM },
        });
      }

      const existingRole = await tx.userRole.findFirst({
        where: {
          userId: updated.userId,
          roleId: courierRole.id,
        },
      });

      if (!existingRole) {
        await tx.userRole.create({
          data: {
            userId: updated.userId,
            roleId: courierRole.id,
          },
        });
      }

      return updated;
    });

    return new CourierEntity(updatedCourier);
  }

  async reject(
    externalId: string,
    rejectionReason: string,
    adminUserId: number
  ): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
    });

    if (!courier) {
      throw new NotFoundException(RESOURCE_MESSAGES.NOT_FOUND('COURIER'));
    }

    const updatedCourier = await this.prisma.courier.update({
      where: { externalId },
      data: {
        approvalStatus: COURIER_STATUS.REJECTED as ApprovalStatus,
        rejectedAt: new Date(),
        rejectedBy: adminUserId,
        rejectionReason,
      },
    });

    return new CourierEntity(updatedCourier);
  }

  async remove(externalId: string): Promise<CourierEntity> {
    await this.findByExternalId(externalId);
    const courier = await this.prisma.courier.delete({ where: { externalId } });
    return new CourierEntity(courier);
  }

  private async getStatistics(): Promise<CourierStatistics> {
    const [totalApproved, totalPending, totalActive] =
      await this.prisma.$transaction([
        this.prisma.courier.count({
          where: { approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus },
        }),
        this.prisma.courier.count({
          where: { approvalStatus: COURIER_STATUS.PENDING as ApprovalStatus },
        }),
        this.prisma.courier.count({
          where: {
            approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus,
            operationalStatus:
              COURIER_OPERATIONAL_STATUS.ACTIVE as OperationalStatus,
          },
        }),
      ]);

    return { totalApproved, totalPending, totalActive };
  }
}
