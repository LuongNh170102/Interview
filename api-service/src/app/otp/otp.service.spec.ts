import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { vi } from 'vitest';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma.service';
import { AUTH_MESSAGES } from '../common/constants/messages.constant';
import { OTP_LIMITS } from '../common/constants/otp.constant';

describe('OtpService', () => {
  let service: OtpService;
  let prisma: {
    otpVerification: {
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let jwtService: { sign: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    prisma = {
      otpVerification: {
        count: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    };
    jwtService = { sign: vi.fn(() => 'verification-token') };

    service = new OtpService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService
    );
  });

  describe('requestOtp', () => {
    it('should reject when rate limit exceeded', async () => {
      prisma.otpVerification.count.mockResolvedValue(
        OTP_LIMITS.REQUEST_MAX_PER_WINDOW
      );

      await expect(service.requestOtp({ phone: '0901234567' })).rejects.toThrow(
        BadRequestException
      );
      await expect(service.requestOtp({ phone: '0901234567' })).rejects.toThrow(
        AUTH_MESSAGES.OTP_RATE_LIMIT_EXCEEDED
      );
      expect(prisma.otpVerification.create).not.toHaveBeenCalled();
    });

    it('should create OTP when under rate limit', async () => {
      prisma.otpVerification.count.mockResolvedValue(0);
      prisma.otpVerification.create.mockResolvedValue({ id: 1 });

      const result = await service.requestOtp({ phone: '0901234567' });

      expect(result.message).toBe(AUTH_MESSAGES.OTP_SENT_SUCCESSFULLY);
      expect(prisma.otpVerification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '0901234567',
            expiresAt: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('verifyOtp', () => {
    const activeRecord = {
      id: 10,
      phone: '0901234567',
      code: '123456',
      verified: false,
      failedAttempts: 0,
      expiresAt: new Date(Date.now() + OTP_LIMITS.EXPIRES_IN_MS),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should reject expired OTP when no active record exists', async () => {
      prisma.otpVerification.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyOtp({ phone: '0901234567', code: '123456' }, 'TEST')
      ).rejects.toThrow(AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);
    });

    it('should reject when failed attempts exceeded', async () => {
      prisma.otpVerification.findFirst.mockResolvedValue({
        ...activeRecord,
        failedAttempts: OTP_LIMITS.VERIFY_MAX_ATTEMPTS,
      });

      await expect(
        service.verifyOtp({ phone: '0901234567', code: '123456' }, 'TEST')
      ).rejects.toThrow(AUTH_MESSAGES.OTP_VERIFY_ATTEMPTS_EXCEEDED);
    });

    it('should increment failed attempts on wrong code', async () => {
      prisma.otpVerification.findFirst.mockResolvedValue(activeRecord);
      prisma.otpVerification.update.mockResolvedValue({
        ...activeRecord,
        failedAttempts: 1,
      });

      await expect(
        service.verifyOtp({ phone: '0901234567', code: '000000' }, 'TEST')
      ).rejects.toThrow(AUTH_MESSAGES.INVALID_OR_EXPIRED_OTP);

      expect(prisma.otpVerification.update).toHaveBeenCalledWith({
        where: { id: activeRecord.id },
        data: { failedAttempts: { increment: 1 } },
      });
    });

    it('should verify valid OTP before expiration', async () => {
      prisma.otpVerification.findFirst.mockResolvedValue(activeRecord);
      prisma.otpVerification.update.mockResolvedValue({
        ...activeRecord,
        verified: true,
      });

      const result = await service.verifyOtp(
        { phone: '0901234567', code: '123456' },
        'COURIER_REGISTRATION_OTP'
      );

      expect(result.verificationToken).toBe('verification-token');
      expect(jwtService.sign).toHaveBeenCalledWith(
        { phone: '0901234567', type: 'COURIER_REGISTRATION_OTP' },
        { expiresIn: '15m' }
      );
    });
  });
});
