import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import {
  AGENCY_STATUS,
  AGENCY_REGISTRATION_OTP,
} from '../common/constants/agency.constant';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';
import { OtpService } from '../otp/otp.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { RESOURCE_MESSAGES } from '../common/constants/messages.constant';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';

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

  async findAll(pagination: PaginationDto) {
    const take = pagination.limit ?? 10;
    const skip = pagination.skip;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.agency.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agency.count(),
    ]);

    return {
      data: items,
      total,
      page: pagination.page ?? 1,
      limit: take,
    };
  }

  async findByExternalId(externalId: string) {
    const agency = await this.prisma.agency.findUnique({
      where: { externalId },
    });

    if (!agency) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.AGENCY)
      );
    }

    return agency;
  }

  async create(userId: number, dto: CreateAgencyDto) {
    let payload;
    try {
      payload = this.jwtService.verify(dto.verificationToken);
    } catch (e) {
      throw new UnauthorizedException(
        AUTH_MESSAGES.INVALID_OR_EXPIRED_VERIFICATION_TOKEN
      );
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
