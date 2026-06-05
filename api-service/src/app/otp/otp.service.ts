import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { RequestOtpDto, VerifyOtpDto } from './dto/otp.dto';
import { JwtService } from '@nestjs/jwt';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';
import { OTP_LIMITS } from '../common/constants/otp.constant';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async requestOtp(dto: RequestOtpDto) {
    const windowStart = new Date(Date.now() - OTP_LIMITS.REQUEST_WINDOW_MS);
    const recentCount = await this.prisma.otpVerification.count({
      where: {
        phone: dto.phone,
        createdAt: { gte: windowStart },
      },
    });

    if (recentCount >= OTP_LIMITS.REQUEST_MAX_PER_WINDOW) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_RATE_LIMIT_EXCEEDED);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + OTP_LIMITS.EXPIRES_IN_MS);

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
    const latest = await this.prisma.otpVerification.findFirst({
      where: {
        phone: dto.phone,
        verified: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      throw new BadRequestException(AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }

    if (latest.failedAttempts >= OTP_LIMITS.VERIFY_MAX_ATTEMPTS) {
      throw new BadRequestException(AUTH_MESSAGES.OTP_VERIFY_ATTEMPTS_EXCEEDED);
    }

    if (latest.code !== dto.code) {
      await this.prisma.otpVerification.update({
        where: { id: latest.id },
        data: { failedAttempts: { increment: 1 } },
      });
      throw new BadRequestException(AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    }

    await this.prisma.otpVerification.update({
      where: { id: latest.id },
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
