import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import { CourierQueryDto, CourierListResponse, CourierStatistics } from './dto/courier-query.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import {
  COURIER_STATUS,
  COURIER_REGISTRATION_OTP,
} from '../common/constants/courier.constant';
import {
  AUTH_MESSAGES,
  COURIER_MESSAGES,
  RESOURCE_MESSAGES,
} from '../common/constants/messages.constant';
import { OtpService } from '../otp/otp.service';
import { ROLE } from '../common/constants/role.constants';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';
import { CourierEntity } from './entities/courier.entity';
import { CourierQueryBuilder } from './builders/courier-query.builder';
import { ApprovalStatus, OperationalStatus, RoleScope } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

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

    // Build where clause using Query Builder pattern
    const where = new CourierQueryBuilder()
      .withApprovalStatus(query.approvalStatus)
      .withOperationalStatus(query.operationalStatus)
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
              email: true,
              username: true,
              phone: true,
            },
          },
          approvedByUser: {
            select: {
              email: true,
              username: true,
            },
          },
          rejectedByUser: {
            select: {
              email: true,
              username: true,
            },
          },
        },
      }),
      this.prisma.courier.count({ where }),
    ]);

    const response: CourierListResponse<CourierEntity> = {
      data: items.map(
        (item) =>
          new CourierEntity(item, {
            user: item.user,
            approvedByUser: item.approvedByUser,
            rejectedByUser: item.rejectedByUser,
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
    const [totalApproved, totalPending, totalRejected, totalActive] =
      await this.prisma.$transaction([
        this.prisma.courier.count({
          where: { approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus },
        }),
        this.prisma.courier.count({
          where: { approvalStatus: COURIER_STATUS.PENDING as ApprovalStatus },
        }),
        this.prisma.courier.count({
          where: { approvalStatus: COURIER_STATUS.REJECTED as ApprovalStatus },
        }),
        this.prisma.courier.count({
          where: {
            approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus,
            operationalStatus: 'ACTIVE' as OperationalStatus,
          },
        }),
      ]);

    return { totalApproved, totalPending, totalRejected, totalActive };
  }

  async findByExternalId(externalId: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            phone: true,
          },
        },
        approvedByUser: {
          select: {
            email: true,
            username: true,
          },
        },
        rejectedByUser: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    return new CourierEntity(courier, {
      user: courier.user,
      approvedByUser: courier.approvedByUser,
      rejectedByUser: courier.rejectedByUser,
    });
  }

  async register(dto: CreateCourierDto) {
    // Verify the verification token
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

    // Check if phone already has a courier profile
    const existingCourier = await this.prisma.courier.findFirst({
      where: { phone: dto.phone },
    });

    if (existingCourier) {
      throw new BadRequestException('Phone number already has a courier profile');
    }

    // Find or create user by phone
    let user = await this.prisma.user.findFirst({
      where: { phone: dto.phone },
    });

    if (!user) {
      // Create a new user with temp email and random password
      const tempEmail = `${dto.phone.replace(/[^0-9]/g, '')}@courier.vhandelivery.com`;
      const tempPassword = crypto.randomBytes(16).toString('hex');
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(tempPassword, salt);

      // Ensure CUSTOMER role exists
      let customerRole = await this.prisma.role.findUnique({
        where: { name: ROLE.CUSTOMER },
      });
      if (!customerRole) {
        customerRole = await this.prisma.role.create({
          data: {
            name: ROLE.CUSTOMER,
            scope: RoleScope.PLATFORM,
          },
        });
      }

      user = await this.prisma.user.create({
        data: {
          email: tempEmail,
          phone: dto.phone,
          username: dto.name,
          passwordHash,
          userRoles: {
            create: {
              roleId: customerRole.id,
            },
          },
        },
      });
    }

    // Check if user already has a courier profile (via userId)
    const existingCourierByUser = await this.prisma.courier.findUnique({
      where: { userId: user.id },
    });

    if (existingCourierByUser) {
      throw new BadRequestException('User already has a courier profile');
    }

    // Parse dateOfBirth if provided
    let dateOfBirth: Date | undefined;
    if (dto.dateOfBirth) {
      dateOfBirth = new Date(dto.dateOfBirth);
    }

    const courier = await this.prisma.courier.create({
      data: {
        userId: user.id,
        name: dto.name,
        phone: dto.phone,
        vehicleType: dto.vehicleType,
        vehicleNumber: dto.vehicleNumber,
        idCardNumber: dto.idCardNumber,
        dateOfBirth,
        approvalStatus: COURIER_STATUS.PENDING as ApprovalStatus,
        status: 'offline',
      },
    });

    return {
      message: COURIER_MESSAGES.REGISTRATION_SUCCESS,
      externalId: courier.externalId,
      approvalStatus: courier.approvalStatus,
    };
  }

  async approve(adminUserId: number, externalId: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    if (courier.approvalStatus !== 'PENDING') {
      throw new BadRequestException(
        COURIER_MESSAGES.INVALID_STATUS_TRANSITION
      );
    }

    const updated = await this.prisma.courier.update({
      where: { externalId },
      data: {
        approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus,
        approvedAt: new Date(),
        approvedBy: adminUserId,
        operationalStatus: 'ACTIVE' as OperationalStatus,
        status: 'available',
      },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            phone: true,
          },
        },
        approvedByUser: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });

    // Assign COURIER role on approval (consistent with Merchant pattern)
    const courierRole = await this.prisma.role.findUnique({
      where: { name: ROLE.COURIER },
    });

    if (courierRole && courier.userId) {
      const existingRole = await this.prisma.userRole.findFirst({
        where: {
          userId: courier.userId,
          roleId: courierRole.id,
          merchantId: null,
          agencyId: null,
          brandId: null,
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

    return {
      message: COURIER_MESSAGES.APPROVED,
      courier: new CourierEntity(updated, {
        user: updated.user,
        approvedByUser: updated.approvedByUser,
        rejectedByUser: null,
      }),
    };
  }

  async reject(adminUserId: number, externalId: string, reason?: string) {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
    });

    if (!courier) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.COURIER)
      );
    }

    if (courier.approvalStatus !== 'PENDING') {
      throw new BadRequestException(
        COURIER_MESSAGES.INVALID_STATUS_TRANSITION
      );
    }

    const updated = await this.prisma.courier.update({
      where: { externalId },
      data: {
        approvalStatus: COURIER_STATUS.REJECTED as ApprovalStatus,
        rejectedAt: new Date(),
        rejectedBy: adminUserId,
        rejectionReason: reason || null,
        operationalStatus: 'INACTIVE' as OperationalStatus,
        status: 'offline',
      },
      include: {
        user: {
          select: {
            email: true,
            username: true,
            phone: true,
          },
        },
        rejectedByUser: {
          select: {
            email: true,
            username: true,
          },
        },
      },
    });

    return {
      message: COURIER_MESSAGES.REJECTED,
      courier: new CourierEntity(updated, {
        user: updated.user,
        approvedByUser: null,
        rejectedByUser: updated.rejectedByUser,
      }),
    };
  }
}
