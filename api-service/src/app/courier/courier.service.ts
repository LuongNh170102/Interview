import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCourierDto } from './dto/create-courier.dto';
import { CourierQueryDto } from './dto/courier-query.dto';
import { RejectCourierDto } from './dto/approve-courier.dto';
import { RequestOtpDto, VerifyOtpDto } from '../otp/dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from '../otp/otp.service';
import { CourierEntity } from './entities/courier.entity';
import { CourierQueryBuilder } from './builders/courier-query.builder';

const COURIER_REGISTRATION_OTP = 'COURIER_REGISTRATION';

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

  async findAll(query: CourierQueryDto) {
    const take = query.limit ?? 10;
    const skip = query.skip;

    const where = new CourierQueryBuilder()
      .withApprovalStatus(query.approvalStatus)
      .withStatus(query.status)
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

  async findByExternalId(externalId: string): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
    });

    if (!courier) {
      throw new NotFoundException('Courier not found');
    }

    return new CourierEntity(courier);
  }

  async create(userId: number, dto: CreateCourierDto): Promise<CourierEntity> {
    let payload;
    try {
      payload = this.jwtService.verify(dto.verificationToken);
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired verification token');
    }

    if (payload.type !== COURIER_REGISTRATION_OTP) {
      throw new UnauthorizedException('Invalid token type');
    }

    if (payload.phone !== dto.phone) {
      throw new UnauthorizedException('Phone number mismatch');
    }

    const existing = await this.prisma.courier.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException('User already registered as courier');
    }

    const courier = await this.prisma.courier.create({
      data: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        vehicleType: dto.vehicleType as any,
        userId,
        approvalStatus: 'PENDING',
      },
    });

    return new CourierEntity(courier);
  }

  async approve(externalId: string, adminId: number): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
    });

    if (!courier) {
      throw new NotFoundException('Courier not found');
    }

    if (courier.approvalStatus !== 'PENDING') {
      throw new BadRequestException('Courier is not in PENDING status');
    }

    const updated = await this.prisma.courier.update({
      where: { externalId },
      data: {
        approvalStatus: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: adminId,
      },
    });

    return new CourierEntity(updated);
  }

  async reject(
    externalId: string,
    adminId: number,
    dto: RejectCourierDto
  ): Promise<CourierEntity> {
    const courier = await this.prisma.courier.findUnique({
      where: { externalId },
    });

    if (!courier) {
      throw new NotFoundException('Courier not found');
    }

    if (courier.approvalStatus !== 'PENDING') {
      throw new BadRequestException('Courier is not in PENDING status');
    }

    const updated = await this.prisma.courier.update({
      where: { externalId },
      data: {
        approvalStatus: 'REJECTED',
        rejectedAt: new Date(),
        rejectedBy: adminId,
        rejectionReason: dto.rejectionReason,
      },
    });

    return new CourierEntity(updated);
  }
}