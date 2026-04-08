import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    // Generate 6 digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // TODO: Integrate with an SMS provider (Twilio / AWS SNS) to deliver the OTP.
    // SECURITY: Never log the OTP code itself. Only log a masked phone for diagnostics.
    this.logger.debug(
      `OTP requested for phone ending in ...${dto.phone.slice(-4)}`,
    );

    await this.prisma.otpVerification.create({
      data: {
        phone: dto.phone,
        code,
        expiresAt,
      },
    });

    return { message: AUTH_MESSAGES.OTP_SENT_SUCCESSFULLY };
  }

  async verifyOtp(dto: VerifyOtpDto, type: string) {
    const record = await this.prisma.otpVerification.findFirst({
      where: {
        phone: dto.phone,
        code: dto.code,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!record) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }

    // Mark as verified
    await this.prisma.otpVerification.update({
      where: { id: record.id },
      data: { verified: true },
    });

    const payload = { phone: dto.phone, type };
    const token = this.jwtService.sign(payload, { expiresIn: '15m' });

    return {
      message: AUTH_MESSAGES.OTP_VERIFIED_SUCCESSFULLY,
      verificationToken: token,
    };
  }
}
