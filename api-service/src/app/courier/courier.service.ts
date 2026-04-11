import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApprovalStatus, OperationalStatus } from '@prisma/client';
import {
  AUTH_MESSAGES,
  RESOURCE_MESSAGES,
} from '../common/constants/messages.constant';
import { ROLE } from '../common/constants/role.constants';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma.service';
import { CourierQueryBuilder } from './builders/courier-query.builder';
import {
  COURIER_REGISTRATION_OTP,
  COURIER_STATUS,
} from './constants/courier.constant';
import { CourierListResponse, CourierQueryDto } from './dto/courier-query.dto';
import { CreateCourierDto } from './dto/create-courier.dto';
import { UpdateCourierStatusDto } from './dto/update-courier-status.dto';
import { CourierEntity } from './entities/courier.entity';

@Injectable()
export class CourierService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpService: OtpService
  ) {}

  async requestOtp(dto: { phone: string }) {
    return this.otpService.requestOtp(dto);
  }

  async verifyOtp(dto: { phone: string; code: string }) {
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

    if (
      payload.type !== COURIER_REGISTRATION_OTP ||
      payload.phone !== dto.phone
    ) {
      throw new UnauthorizedException(AUTH_MESSAGES.PHONE_NUMBER_MISMATCH);
    }

    const courier = await this.prisma.courier.create({
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        email: dto.email,
        vehicleType: dto.vehicleType,
        vehiclePlate: dto.vehiclePlate,
        identityCard: dto.identityCard,
        userId,
        approvalStatus: ApprovalStatus.PENDING,
        operationalStatus: OperationalStatus.ACTIVE,
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

    return {
      data: items.map((item) => new CourierEntity(item)),
      total,
      page: query.page ?? 1,
      limit: take,
    };
  }

  async updateStatus(
    externalId: string,
    dto: UpdateCourierStatusDto,
    adminUserId: number
  ) {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
    });

    if (!courier) {
      throw new NotFoundException(RESOURCE_MESSAGES.NOT_FOUND('Courier'));
    }

    if (dto.status === COURIER_STATUS.REJECTED && !dto.rejectionReason) {
      throw new ConflictException(
        'Rejection reason is required when rejecting a courier'
      );
    }

    const updated = await this.prisma.courier.update({
      where: { externalId },
      data: {
        approvalStatus: dto.status as ApprovalStatus,
        rejectionReason: dto.rejectionReason,
        approvedAt:
          dto.status === COURIER_STATUS.APPROVED ? new Date() : undefined,
        approvedBy:
          dto.status === COURIER_STATUS.APPROVED ? adminUserId : undefined,
        rejectedAt:
          dto.status === COURIER_STATUS.REJECTED ? new Date() : undefined,
        rejectedBy:
          dto.status === COURIER_STATUS.REJECTED ? adminUserId : undefined,
      },
    });

    if (dto.status === COURIER_STATUS.APPROVED && courier.userId) {
      await this.assignCourierRole(courier.userId, updated.id);
    }

    return updated;
  }

  private async assignCourierRole(userId: number, courierId: number) {
    let courierRole = await this.prisma.role.findUnique({
      where: { name: ROLE.COURIER },
    });

    if (!courierRole) {
      courierRole = await this.prisma.role.create({
        data: { name: ROLE.COURIER, scope: 'PLATFORM' },
      });
    }

    await this.prisma.userRole.upsert({
      where: {
        userId_roleId: { userId, roleId: courierRole.id },
      },
      update: {},
      create: {
        userId,
        roleId: courierRole.id,
      },
    });
  }
}
