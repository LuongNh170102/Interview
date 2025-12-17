import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import { AGENCY_STATUS, AGENCY_REGISTRATION_OTP } from '../common/constants/agency.constant';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';
import { OtpService } from '../otp/otp.service';

@Injectable()
export class AgencyService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private otpService: OtpService
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    return this.otpService.requestOtp(dto);
  }

  async verifyOtp(dto: VerifyOtpDto) {
    return this.otpService.verifyOtp(dto, AGENCY_REGISTRATION_OTP);
  }

  async create(userId: number, dto: CreateAgencyDto) {
    let payload;
    try {
      payload = this.jwtService.verify(dto.verificationToken);
    } catch (e) {
      throw new UnauthorizedException(AUTH_MESSAGES.INVALID_OR_EXPIRED_VERIFICATION_TOKEN);
    }

    if (payload.type !== AGENCY_REGISTRATION_OTP) {
       throw new UnauthorizedException(AUTH_MESSAGES.INVALID_TOKEN_TYPE);
    }

    if (payload.phone !== dto.phone) {
      throw new UnauthorizedException(AUTH_MESSAGES.PHONE_NUMBER_MISMATCH);
    }

    const agency = await this.prisma.agency.create({
      data: {
        name: dto.name,
        taxCode: dto.taxCode,
        bankAccount: dto.bankAccount,
        address: dto.address,
        phone: dto.phone,
        email: dto.email,
        logo: dto.logo,
        businessLicenseUrl: dto.businessLicenseUrl,
        ownerId: userId,
        status: AGENCY_STATUS.PENDING,
      },
    });

    return agency;
  }
}
