import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ApprovalStatus,
  CourierAvailabilityStatus,
  OperationalStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { OtpService } from '../otp/otp.service';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UpdateCourierDto } from './dto/update-courier.dto';
import { RejectCourierDto } from './dto/reject-courier.dto';
import {
  CourierListResponse,
  CourierQueryDto,
  CourierStatistics,
} from './dto/courier-query.dto';
import {
  COURIER_AVAILABILITY_STATUS,
  COURIER_OPERATIONAL_STATUS,
  COURIER_REGISTRATION_OTP,
  COURIER_STATUS,
} from '../common/constants/courier.constant';
import {
  AUTH_MESSAGES,
  COURIER_MESSAGES,
  RESOURCE_MESSAGES,
} from '../common/constants/messages.constant';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';
import { ROLE } from '../common/constants/role.constants';
import { CourierEntity } from './entities/courier.entity';
import { CourierQueryBuilder } from './builders/courier-query.builder';
import { COURIER_AUDIT_ACTION } from '../common/constants/otp.constant';

const courierUserSelect = {
  select: { email: true, username: true, phone: true },
} as const;

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

  async findAll(
    query: CourierQueryDto
  ): Promise<CourierListResponse<CourierEntity>> {
    const take = query.limit ?? 10;
    const skip = query.skip;

    const where = new CourierQueryBuilder()
      .withNotDeleted()
      .withApprovalStatus(query.approvalStatus)
      .withOperationalStatus(query.operationalStatus)
      .withAvailabilityStatus(query.availabilityStatus)
      .withSearch(query.search)
      .withDateRange(query.startDate, query.endDate)
      .build();

    const [items, total] = await this.prisma.$transaction([
      this.prisma.courier.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: courierUserSelect,
        },
      }),
      this.prisma.courier.count({ where }),
    ]);

    const response: CourierListResponse<CourierEntity> = {
      data: items.map(
        (item) =>
          new CourierEntity(item, {
            user: item.user,
          })
      ),
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
    const [totalApproved, totalPending, totalActive] =
      await this.prisma.$transaction([
        this.prisma.courier.count({
          where: {
            deletedAt: null,
            approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus,
          },
        }),
        this.prisma.courier.count({
          where: {
            deletedAt: null,
            approvalStatus: COURIER_STATUS.PENDING as ApprovalStatus,
          },
        }),
        this.prisma.courier.count({
          where: {
            deletedAt: null,
            approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus,
            operationalStatus:
              COURIER_OPERATIONAL_STATUS.ACTIVE as OperationalStatus,
          },
        }),
      ]);

    return { totalApproved, totalPending, totalActive };
  }

  async findByExternalId(externalId: string): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findFirst({
      where: { externalId, deletedAt: null },
      include: {
        user: courierUserSelect,
      },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    return new CourierEntity(courier, { user: courier.user });
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

    const existingCourier = await this.prisma.courier.findFirst({
      where: { userId, deletedAt: null },
    });
    if (existingCourier) {
      throw new ConflictException(COURIER_MESSAGES.ALREADY_REGISTERED);
    }

    const existingPhone = await this.prisma.courier.findFirst({
      where: { phone: dto.phone, deletedAt: null },
    });
    if (existingPhone) {
      throw new ConflictException(COURIER_MESSAGES.PHONE_ALREADY_USED);
    }

    if (dto.email) {
      const existingEmail = await this.prisma.courier.findFirst({
        where: { email: dto.email, deletedAt: null },
      });
      if (existingEmail) {
        throw new ConflictException(COURIER_MESSAGES.EMAIL_ALREADY_USED);
      }
    }

    const courier = await this.prisma.courier.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        address: dto.address,
        vehicleType: dto.vehicleType,
        approvalStatus: COURIER_STATUS.PENDING as ApprovalStatus,
        availabilityStatus:
          COURIER_AVAILABILITY_STATUS.OFFLINE as CourierAvailabilityStatus,
      },
      include: {
        user: {
          select: { email: true, username: true, phone: true },
        },
      },
    });

    return new CourierEntity(courier, { user: courier.user });
  }

  async update(
    externalId: string,
    userId: number,
    dto: UpdateCourierDto
  ): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findFirst({
      where: { externalId, deletedAt: null },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    if (courier.userId !== userId) {
      throw new UnauthorizedException(AUTH_MESSAGES.ACCESS_DENIED);
    }

    if (courier.approvalStatus !== (COURIER_STATUS.APPROVED as ApprovalStatus)) {
      throw new BadRequestException(COURIER_MESSAGES.NOT_APPROVED);
    }

    const updated = await this.prisma.courier.update({
      where: { externalId },
      data: dto,
      include: {
        user: {
          select: { email: true, username: true, phone: true },
        },
      },
    });

    return new CourierEntity(updated, { user: updated.user });
  }

  async approve(
    externalId: string,
    adminUserId: number
  ): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findFirst({
      where: { externalId, deletedAt: null },
      include: { user: true },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    if (courier.approvalStatus === (COURIER_STATUS.APPROVED as ApprovalStatus)) {
      return new CourierEntity(courier, { user: courier.user });
    }

    if (courier.approvalStatus === (COURIER_STATUS.REJECTED as ApprovalStatus)) {
      throw new BadRequestException(COURIER_MESSAGES.CANNOT_APPROVE_REJECTED);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.courier.update({
        where: { externalId },
        data: {
          approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus,
          approvedAt: new Date(),
          approvedBy: adminUserId,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
        },
        include: {
          user: courierUserSelect,
        },
      });

      await this.assignCourierRole(tx, courier.userId);
      await this.logApprovalAction(
        tx,
        courier.id,
        COURIER_AUDIT_ACTION.APPROVE,
        adminUserId
      );

      return result;
    });

    return new CourierEntity(updated, { user: updated.user });
  }

  async reject(
    externalId: string,
    adminUserId: number,
    dto: RejectCourierDto
  ): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findFirst({
      where: { externalId, deletedAt: null },
      include: {
        user: courierUserSelect,
      },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    if (courier.approvalStatus === (COURIER_STATUS.REJECTED as ApprovalStatus)) {
      return new CourierEntity(courier, { user: courier.user });
    }

    if (courier.approvalStatus === (COURIER_STATUS.APPROVED as ApprovalStatus)) {
      throw new BadRequestException(COURIER_MESSAGES.CANNOT_REJECT_APPROVED);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.courier.update({
        where: { externalId },
        data: {
          approvalStatus: COURIER_STATUS.REJECTED as ApprovalStatus,
          rejectedAt: new Date(),
          rejectedBy: adminUserId,
          rejectionReason: dto.rejectionReason,
        },
        include: {
          user: courierUserSelect,
        },
      });

      await this.logApprovalAction(
        tx,
        courier.id,
        COURIER_AUDIT_ACTION.REJECT,
        adminUserId,
        dto.rejectionReason
      );

      return result;
    });

    return new CourierEntity(updated, { user: updated.user });
  }

  async remove(
    externalId: string,
    adminUserId: number
  ): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findFirst({
      where: { externalId, deletedAt: null },
      include: {
        user: courierUserSelect,
      },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.courier.update({
        where: { externalId },
        data: { deletedAt: new Date() },
        include: {
          user: courierUserSelect,
        },
      });

      await this.logApprovalAction(
        tx,
        courier.id,
        COURIER_AUDIT_ACTION.DELETE,
        adminUserId
      );

      return result;
    });

    return new CourierEntity(updated, { user: updated.user });
  }

  private async logApprovalAction(
    tx: Prisma.TransactionClient,
    courierId: number,
    action: string,
    performedBy: number,
    reason?: string
  ): Promise<void> {
    await tx.courierApprovalAudit.create({
      data: {
        courierId,
        action,
        performedBy,
        reason,
      },
    });
  }

  private async assignCourierRole(tx: Prisma.TransactionClient, userId: number) {
    const courierRole = await tx.role.findUnique({
      where: { name: ROLE.COURIER },
    });
    const customerRole = await tx.role.findUnique({
      where: { name: ROLE.CUSTOMER },
    });

    if (!courierRole) {
      return;
    }

    const existingCourierRole = await tx.userRole.findFirst({
      where: {
        userId,
        roleId: courierRole.id,
      },
    });

    if (existingCourierRole) {
      return;
    }

    const existingCustomerRole = customerRole
      ? await tx.userRole.findFirst({
          where: {
            userId,
            roleId: customerRole.id,
          },
        })
      : null;

    if (existingCustomerRole) {
      await tx.userRole.update({
        where: { id: existingCustomerRole.id },
        data: { roleId: courierRole.id },
      });
      return;
    }

    await tx.userRole.create({
      data: {
        userId,
        roleId: courierRole.id,
      },
    });
  }
}
