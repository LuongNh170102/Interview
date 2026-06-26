import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import {
  CourierQueryDto,
  CourierStatistics,
  CourierListResponse,
} from './dto/courier-query.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import {
  COURIER_APPROVAL_STATUS,
  COURIER_OPERATIONAL_STATUS,
  COURIER_REGISTRATION_OTP,
} from '../common/constants/courier.constant';
import { AUTH_MESSAGES, RESOURCE_MESSAGES } from '../common/constants/messages.constant';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';
import { OtpService } from '../otp/otp.service';
import { CourierEntity } from './entities/courier.entity';
import { CourierQueryBuilder } from './builders/courier-query.builder';
import { ROLE } from '../common/constants/role.constants';

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
      .withApprovalStatus(query.approvalStatus)
      .withOperationalStatus(query.operationalStatus)
      .withSearch(query.search)
      .excludeDeleted()
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

    if (query.hasStatistics) {
      response.statistics = await this.getStatistics();
    }

    return response;
  }

  private async getStatistics(): Promise<CourierStatistics> {
    const [totalApproved, totalPending, totalActive] =
      await this.prisma.$transaction([
        this.prisma.courier.count({
          where: { approvalStatus: COURIER_APPROVAL_STATUS.APPROVED, deletedAt: null },
        }),
        this.prisma.courier.count({
          where: { approvalStatus: COURIER_APPROVAL_STATUS.PENDING, deletedAt: null },
        }),
        this.prisma.courier.count({
          where: {
            approvalStatus: COURIER_APPROVAL_STATUS.APPROVED,
            status: COURIER_OPERATIONAL_STATUS.AVAILABLE,
            deletedAt: null,
          },
        }),
      ]);

    return { totalApproved, totalPending, totalActive };
  }

  async findById(id: number): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findFirst({
      where: { id, deletedAt: null },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    return new CourierEntity(courier);
  }

  async create(userId: number, dto: CreateCourierDto): Promise<CourierEntity> {
    let payload;
    try {
      payload = this.jwtService.verify(dto.verificationToken);
    } catch (e) {
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

    // Check if user already has a courier profile
    const existing = await this.prisma.courier.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('Courier profile already exists for this user.');
    }

    const existingPhone = await this.prisma.courier.findFirst({
      where: { phone: dto.phone, deletedAt: null },
    });

    if (existingPhone) {
      throw new BadRequestException('Phone number is already registered to another courier.');
    }

    const courier = await this.prisma.courier.create({
      data: {
        userId,
        name: dto.name,
        phone: dto.phone,
        status: COURIER_OPERATIONAL_STATUS.OFFLINE,
        vehicleType: dto.vehicleType || 'motorbike',
        approvalStatus: COURIER_APPROVAL_STATUS.PENDING,
      },
    });

    return new CourierEntity(courier);
  }

  async updateStatus(
    id: number,
    adminUserId: number,
    status: COURIER_APPROVAL_STATUS,
    rejectionReason?: string
  ): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findFirst({
      where: { id, deletedAt: null },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    // Idempotency check: if status is already the same, do nothing
    if (courier.approvalStatus === status) {
      return new CourierEntity(courier);
    }

    const updateData: any = { approvalStatus: status };

    if (status === COURIER_APPROVAL_STATUS.APPROVED) {
      updateData.approvedAt = new Date();
      updateData.approvedBy = adminUserId;
      updateData.status = COURIER_OPERATIONAL_STATUS.AVAILABLE; // set status to available on approval
    } else if (status === COURIER_APPROVAL_STATUS.REJECTED) {
      if (!rejectionReason) {
        throw new BadRequestException('Rejection reason is required.');
      }
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = adminUserId;
      updateData.rejectionReason = rejectionReason;
      updateData.status = COURIER_OPERATIONAL_STATUS.OFFLINE;
    }

    const updated = await this.prisma.courier.update({
      where: { id },
      data: updateData,
    });

    // If status is APPROVED, assign COURIER role
    if (status === COURIER_APPROVAL_STATUS.APPROVED) {
      const courierRole = await this.prisma.role.findUnique({
        where: { name: ROLE.COURIER },
      });

      if (courierRole) {
        const existingRole = await this.prisma.userRole.findFirst({
          where: {
            userId: courier.userId,
            roleId: courierRole.id,
          },
        });

        if (!existingRole) {
          await this.prisma.userRole.create({
            data: {
              userId: courier.userId,
              roleId: courierRole.id,
            },
          });
        }
      }
    }

    return new CourierEntity(updated);
  }
}
