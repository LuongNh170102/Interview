import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import { MERCHANT_REGISTRATION_OTP, MERCHANT_STATUS } from '../common/constants/merchant.constant';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';
import { OtpService } from '../otp/otp.service';

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

  async create(userId: number, dto: CreateMerchantDto) {
    // Verify the verification token
    let payload;
    try {
      payload = this.jwtService.verify(dto.verificationToken);
    } catch (e) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_OR_EXPIRED_VERIFICATION_TOKEN);
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
