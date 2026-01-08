import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import {
  MERCHANT_REGISTRATION_OTP,
  MERCHANT_STATUS,
} from '../common/constants/merchant.constant';
import {
  AUTH_MESSAGES,
  RESOURCE_MESSAGES,
} from '../common/constants/messages.constant';
import { OtpService } from '../otp/otp.service';
import { ROLE } from '../common/constants/role.constants';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';
import { PaginationDto } from '../common/dto/pagination.dto';

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

  async findAll(pagination: PaginationDto) {
    const take = pagination.limit ?? 10;
    const skip = pagination.skip;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.merchant.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.merchant.count(),
    ]);

    return {
      data: items,
      total,
      page: pagination.page ?? 1,
      limit: take,
    };
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

  async updateStatus(externalId: string, status: string) {
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
      data: { status },
    });

    // If status is ACTIVE, assign MERCHANT_OWNER role and link merchantId
    if (status === MERCHANT_STATUS.ACTIVE) {
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
    } catch (e) {
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
        status: MERCHANT_STATUS.PENDING,
      },
    });

    return merchant;
  }
}
