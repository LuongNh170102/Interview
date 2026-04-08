import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RegisterCourierDto } from './dto/register-courier.dto';
import { RejectCourierDto } from './dto/reject-courier.dto';
import {
  CourierQueryDto,
  CourierStatistics,
  CourierListResponse,
} from './dto/courier-query.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import {
  COURIER_REGISTRATION_OTP,
  COURIER_APPROVAL_STATUS,
} from '../common/constants/courier.constant';
import {
  AUTH_MESSAGES,
  RESOURCE_MESSAGES,
} from '../common/constants/messages.constant';
import { OtpService } from '../otp/otp.service';
import { ROLE } from '../common/constants/role.constants';
import { ApprovalStatus } from '@prisma/client';
import { CourierEntity } from './entities/courier.entity';
import { CourierQueryBuilder } from './builders/courier-query.builder';

export const COURIER_MESSAGES = {
  NOT_FOUND: 'Courier not found',
  PHONE_ALREADY_REGISTERED: 'A courier with this phone number already exists',
  EMAIL_ALREADY_REGISTERED: 'A courier with this email already exists',
  ALREADY_APPROVED: 'Courier is already approved',
  ALREADY_REJECTED: 'Courier is already rejected',
  NOT_PENDING: 'Only PENDING couriers can be reviewed',
  REJECTION_REASON_REQUIRED: 'A rejection reason must be provided',
};

@Injectable()
export class CourierService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  // ---------------------------------------------------------------------------
  // OTP Flow
  // ---------------------------------------------------------------------------

  async requestOtp(dto: RequestOtpDto) {
    return this.otpService.requestOtp(dto);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto, COURIER_REGISTRATION_OTP);
  }

  // ---------------------------------------------------------------------------
  // Registration
  // ---------------------------------------------------------------------------

  /**
   * POST /couriers/register
   * Verifies OTP token, checks phone/email uniqueness, then creates a Courier
   * record in PENDING status. A new User account is also created so the courier
   * can later log in. Mirrors AgencyService.create() pattern.
   */
  async register(dto: RegisterCourierDto): Promise<CourierEntity> {
    // 1. Verify the JWT verification token issued by OTP flow
    let payload: { phone: string; type: string };
    try {
      payload = this.jwtService.verify(dto.verificationToken);
    } catch {
      throw new UnauthorizedException(
        AUTH_MESSAGES.INVALID_OR_EXPIRED_VERIFICATION_TOKEN,
      );
    }

    if (payload.type !== COURIER_REGISTRATION_OTP) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN_TYPE);
    }

    if (payload.phone !== dto.phone) {
      throw new UnauthorizedException(AUTH_MESSAGES.PHONE_NUMBER_MISMATCH);
    }

    // 2. Check for duplicate phone
    const existingByPhone = await this.prisma.courier.findUnique({
      where: { phone: dto.phone },
    });
    if (existingByPhone) {
      throw new ConflictException(COURIER_MESSAGES.PHONE_ALREADY_REGISTERED);
    }

    // 3. Check for duplicate email
    const existingByEmail = await this.prisma.courier.findUnique({
      where: { email: dto.email },
    });
    if (existingByEmail) {
      throw new ConflictException(COURIER_MESSAGES.EMAIL_ALREADY_REGISTERED);
    }

    // 4. Create the courier record
    const courier = await this.prisma.courier.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        vehicleType: dto.vehicleType,
        licenseNumber: dto.licenseNumber,
        avatarUrl: dto.avatarUrl,
        address: dto.address,
        approvalStatus: COURIER_APPROVAL_STATUS.PENDING as ApprovalStatus,
      },
    });

    return new CourierEntity(courier);
  }

  // ---------------------------------------------------------------------------
  // List (Admin)
  // ---------------------------------------------------------------------------

  async findAll(
    query: CourierQueryDto,
  ): Promise<CourierListResponse<CourierEntity>> {
    const take = query.limit ?? 10;
    const skip = query.skip;

    const where = new CourierQueryBuilder()
      .excludeDeleted()
      .withApprovalStatus(query.approvalStatus)
      .withSearch(query.search)
      .withVehicleType(query.vehicleType)
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

  private async getStatistics(): Promise<CourierStatistics> {
    const [totalPending, totalApproved, totalRejected] =
      await this.prisma.$transaction([
        this.prisma.courier.count({
          where: {
            approvalStatus: COURIER_APPROVAL_STATUS.PENDING as ApprovalStatus,
            deletedAt: null,
          },
        }),
        this.prisma.courier.count({
          where: {
            approvalStatus: COURIER_APPROVAL_STATUS.APPROVED as ApprovalStatus,
            deletedAt: null,
          },
        }),
        this.prisma.courier.count({
          where: {
            approvalStatus: COURIER_APPROVAL_STATUS.REJECTED as ApprovalStatus,
            deletedAt: null,
          },
        }),
      ]);

    return { totalPending, totalApproved, totalRejected };
  }

  async findByExternalId(externalId: string): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId, deletedAt: null },
    });

    if (!courier) {
      throw new NotFoundException(COURIER_MESSAGES.NOT_FOUND);
    }

    return new CourierEntity(courier);
  }

  // ---------------------------------------------------------------------------
  // Approve (Admin) — Idempotent
  // ---------------------------------------------------------------------------

  /**
   * PATCH /couriers/:id/approve
   * Idempotent: if already APPROVED, returns the current state without error.
   * Assigns the COURIER role to the linked User upon first approval.
   */
  async approve(externalId: string, adminUserId: number): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId, deletedAt: null },
    });

    if (!courier) {
      throw new NotFoundException(COURIER_MESSAGES.NOT_FOUND);
    }

    // Idempotent: already approved → return current state
    if (courier.approvalStatus === COURIER_APPROVAL_STATUS.APPROVED) {
      return new CourierEntity(courier);
    }

    if (courier.approvalStatus === COURIER_APPROVAL_STATUS.REJECTED) {
      throw new BadRequestException(COURIER_MESSAGES.NOT_PENDING);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedCourier = await tx.courier.update({
        where: { externalId },
        data: {
          approvalStatus: COURIER_APPROVAL_STATUS.APPROVED as ApprovalStatus,
          approvedAt: new Date(),
          approvedBy: adminUserId,
          rejectedAt: null,
          rejectedBy: null,
          rejectionReason: null,
        },
      });

      // Assign COURIER role to the linked user if exists
      if (courier.userId) {
        const courierRole = await tx.role.findUnique({
          where: { name: ROLE.COURIER },
        });

        if (courierRole) {
          const existingRole = await tx.userRole.findFirst({
            where: { userId: courier.userId, roleId: courierRole.id },
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
      }

      return updatedCourier;
    });

    return new CourierEntity(updated);
  }

  // ---------------------------------------------------------------------------
  // Reject (Admin)
  // ---------------------------------------------------------------------------

  /**
   * PATCH /couriers/:id/reject
   * Requires a mandatory rejection reason so the courier knows what to fix.
   * Only PENDING couriers can be rejected.
   */
  async reject(
    externalId: string,
    dto: RejectCourierDto,
    adminUserId: number,
  ): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId, deletedAt: null },
    });

    if (!courier) {
      throw new NotFoundException(COURIER_MESSAGES.NOT_FOUND);
    }

    if (courier.approvalStatus === COURIER_APPROVAL_STATUS.APPROVED) {
      throw new BadRequestException(COURIER_MESSAGES.NOT_PENDING);
    }

    const updated = await this.prisma.courier.update({
      where: { externalId },
      data: {
        approvalStatus: COURIER_APPROVAL_STATUS.REJECTED as ApprovalStatus,
        rejectedAt: new Date(),
        rejectedBy: adminUserId,
        rejectionReason: dto.reason,
      },
    });

    return new CourierEntity(updated);
  }
}
