import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import {
  AgencyQueryDto,
  AgencyStatistics,
  AgencyListResponse,
} from './dto/agency-query.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import {
  AGENCY_STATUS,
  AGENCY_REGISTRATION_OTP,
  AGENCY_OPERATIONAL_STATUS,
} from '../common/constants/agency.constant';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';
import { OtpService } from '../otp/otp.service';
import { RESOURCE_MESSAGES } from '../common/constants/messages.constant';
import { RESOURCE_TARGETS } from '../common/constants/resource.constant';
import { AgencyEntity } from './entities/agency.entity';
import { AgencyQueryBuilder } from './builders/agency-query.builder';

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

  async findAll(
    query: AgencyQueryDto
  ): Promise<AgencyListResponse<AgencyEntity>> {
    const take = query.limit ?? 10;
    const skip = query.skip;

    const where = new AgencyQueryBuilder()
      .withApprovalStatus(query.approvalStatus)
      .withOperationalStatus(query.operationalStatus)
      .withSearch(query.search)
      .build();

    const [items, total] = await this.prisma.$transaction([
      this.prisma.agency.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.agency.count({ where }),
    ]);

    const response: AgencyListResponse<AgencyEntity> = {
      data: items.map((item) => new AgencyEntity(item)),
      total,
      page: query.page ?? 1,
      limit: take,
    };

    if (query.shouldIncludeStatistics) {
      response.statistics = await this.getStatistics();
    }

    return response;
  }

  private async getStatistics(): Promise<AgencyStatistics> {
    const [totalApproved, totalPending, totalActive] =
      await this.prisma.$transaction([
        this.prisma.agency.count({
          where: { approvalStatus: AGENCY_STATUS.APPROVED },
        }),
        this.prisma.agency.count({
          where: { approvalStatus: AGENCY_STATUS.PENDING },
        }),
        this.prisma.agency.count({
          where: {
            approvalStatus: AGENCY_STATUS.APPROVED,
            operationalStatus: AGENCY_OPERATIONAL_STATUS.ACTIVE,
          },
        }),
      ]);

    return { totalApproved, totalPending, totalActive };
  }

  async findByExternalId(externalId: string): Promise<AgencyEntity> {
    const agency = await this.prisma.agency.findUnique({
      where: { externalId },
    });

    if (!agency) {
      throw new NotFoundException(
        RESOURCE_MESSAGES.NOT_FOUND(RESOURCE_TARGETS.AGENCY)
      );
    }

    return new AgencyEntity(agency);
  }

  async create(userId: number, dto: CreateAgencyDto): Promise<AgencyEntity> {
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
        approvalStatus: AGENCY_STATUS.PENDING,
      },
    });

    return new AgencyEntity(agency);
  }
}
