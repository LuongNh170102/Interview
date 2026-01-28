import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import {
  MerchantQueryDto,
  MerchantStatistics,
  MerchantListResponse,
} from './dto/merchant-query.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import {
  MERCHANT_REGISTRATION_OTP,
  MERCHANT_STATUS,
  MERCHANT_OPERATIONAL_STATUS,
} from '../common/constants/merchant.constant';
import {
  AUTH_MESSAGES,
  RESOURCE_MESSAGES,
} from '../common/constants/messages.constant';
import { OtpService } from '../otp/otp.service';
import { ROLE } from '../common/constants/role.constants';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';
import { ApprovalStatus } from '@prisma/client';
import { MerchantEntity } from './entities/merchant.entity';
import { MerchantQueryBuilder } from './builders/merchant-query.builder';

@Injectable()
export class MerchantService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpService: OtpService
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    return this.otpService.requestOtp(dto);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto, MERCHANT_REGISTRATION_OTP);
  }

  async findAll(
    query: MerchantQueryDto
  ): Promise<MerchantListResponse<MerchantEntity>> {
    const take = query.limit ?? 10;
    const skip = query.skip;

    // Build where clause using Query Builder pattern
    const where = new MerchantQueryBuilder()
      .withApprovalStatus(query.approvalStatus)
      .withOperationalStatus(query.operationalStatus)
      .withSearch(query.search)
      .withAgencyId(query.agencyId)
      .withBusinessCategory(query.businessCategory)
      .build();

    const [items, total] = await this.prisma.$transaction([
      this.prisma.merchant.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          agency: {
            select: {
              name: true,
              externalId: true,
              phone: true,
            },
          },
          brand: {
            select: {
              name: true,
              externalId: true,
              slug: true,
            },
          },
          owner: {
            select: {
              email: true,
              phone: true,
              username: true,
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
          _count: {
            select: {
              products: true,
              orders: true,
            },
          },
        },
      }),
      this.prisma.merchant.count({ where }),
    ]);

    const response: MerchantListResponse<MerchantEntity> = {
      data: items.map(
        (item) =>
          new MerchantEntity(item, {
            agency: item.agency,
            brand: item.brand,
            owner: item.owner,
            tags: item.tags,
            _count: item._count,
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

  private async getStatistics(): Promise<MerchantStatistics> {
    const [totalApproved, totalPending, totalActive] =
      await this.prisma.$transaction([
        this.prisma.merchant.count({
          where: { approvalStatus: MERCHANT_STATUS.APPROVED as ApprovalStatus },
        }),
        this.prisma.merchant.count({
          where: { approvalStatus: MERCHANT_STATUS.PENDING as ApprovalStatus },
        }),
        this.prisma.merchant.count({
          where: {
            approvalStatus: MERCHANT_STATUS.APPROVED as ApprovalStatus,
            operationalStatus: MERCHANT_OPERATIONAL_STATUS.ACTIVE,
          },
        }),
      ]);

    return { totalApproved, totalPending, totalActive };
  }

  async findByExternalId(externalId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId },
    });

    if (!merchant) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.MERCHANT)
      );
    }

    return merchant;
  }

  async updateStatus(externalId: string, status: MERCHANT_STATUS) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId },
    });

    if (!merchant) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.MERCHANT)
      );
    }

    const updatedMerchant = await this.prisma.merchant.update({
      where: { externalId },
      data: { approvalStatus: status as ApprovalStatus },
    });

    // If status is APPROVED, assign MERCHANT_OWNER role and link merchantId
    if (status === MERCHANT_STATUS.APPROVED) {
      const merchantOwnerRole = await this.prisma.role.findUnique({
        where: { name: ROLE.MERCHANT_OWNER },
      });
      const customerRole = await this.prisma.role.findUnique({
        where: { name: ROLE.CUSTOMER },
      });

      if (merchantOwnerRole) {
        // 1. Check if user already has MERCHANT_OWNER role
        const existingMerchantRole = await this.prisma.userRole.findFirst({
          where: {
            userId: merchant.ownerId,
            roleId: merchantOwnerRole.id,
          },
        });

        if (existingMerchantRole) {
          // Update existing merchant role with merchantId if missing
          await this.prisma.userRole.update({
            where: { id: existingMerchantRole.id },
            data: { merchantId: merchant.id },
          });
        } else {
          // 2. If not, check if user has CUSTOMER role to switch
          const existingCustomerRole = customerRole
            ? await this.prisma.userRole.findFirst({
                where: {
                  userId: merchant.ownerId,
                  roleId: customerRole.id,
                },
              })
            : null;

          if (existingCustomerRole) {
            // Switch from CUSTOMER to MERCHANT_OWNER
            await this.prisma.userRole.update({
              where: { id: existingCustomerRole.id },
              data: {
                roleId: merchantOwnerRole.id,
                merchantId: merchant.id,
              },
            });
          } else {
            // 3. If no Customer role either, create new MERCHANT_OWNER role
            await this.prisma.userRole.create({
              data: {
                userId: merchant.ownerId,
                roleId: merchantOwnerRole.id,
                merchantId: merchant.id,
              },
            });
          }
        }
      }
    }

    return updatedMerchant;
  }

  async create(userId: number, dto: CreateMerchantDto) {
    // Verify the verification token
    let payload;
    try {
      payload = this.jwtService.verify(dto.verificationToken);
    } catch {
      throw new UnauthorizedException(
        AUTH_MESSAGES.INVALID_OR_EXPIRED_VERIFICATION_TOKEN
      );
    }

    if (payload.type !== MERCHANT_REGISTRATION_OTP) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN_TYPE);
    }

    if (payload.phone !== dto.phone) {
      throw new UnauthorizedException(AUTH_MESSAGES.PHONE_NUMBER_MISMATCH);
    }

    const merchant = await this.prisma.merchant.create({
      data: {
        name: dto.name,
        address: dto.address,
        city: dto.city,
        contactName: dto.contactName,
        businessType: dto.businessType,
        businessCategory: dto.businessCategory,
        referralSource: dto.referralSource,
        hasBusinessLicense: dto.hasBusinessLicense,
        metadata: dto.socialLinks ? { socialLinks: dto.socialLinks } : {},
        phone: dto.phone,
        ownerId: userId,
        approvalStatus: MERCHANT_STATUS.PENDING as ApprovalStatus,
      },
    });

    return merchant;
  }
}
