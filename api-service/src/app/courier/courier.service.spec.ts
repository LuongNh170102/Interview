import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { CourierService } from './courier.service';
import { PrismaService } from '../prisma.service';
import { OtpService } from '../otp/otp.service';
import { JwtService } from '@nestjs/jwt';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import {
  COURIER_APPROVAL_STATUS,
  COURIER_OPERATIONAL_STATUS,
  COURIER_REGISTRATION_OTP,
} from '../common/constants/courier.constant';

describe('CourierService', () => {
  let service: CourierService;
  let prisma: PrismaService;
  let otpService: OtpService;
  let jwtService: JwtService;

  const mockPrismaService = {
    courier: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
    },
    userRole: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(async (cb) => {
      if (typeof cb === 'function') {
        return cb(mockPrismaService);
      }
      return cb;
    }),
  };

  const mockOtpService = {
    requestOtp: vi.fn(),
    verifyOtp: vi.fn(),
  };

  const mockJwtService = {
    verify: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: OtpService,
          useValue: mockOtpService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    otpService = module.get<OtpService>(OtpService);
    jwtService = module.get<JwtService>(JwtService);

    service = new CourierService(
      prisma,
      jwtService,
      otpService
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('requestOtp', () => {
    it('should delegate to OtpService.requestOtp', async () => {
      const dto = { phone: '0901234567' };
      mockOtpService.requestOtp.mockResolvedValue({ message: 'OTP sent' });

      const result = await service.requestOtp(dto);
      expect(result).toEqual({ message: 'OTP sent' });
      expect(otpService.requestOtp).toHaveBeenCalledWith(dto);
    });
  });

  describe('verifyOtp', () => {
    it('should delegate to OtpService.verifyOtp', async () => {
      const dto = { phone: '0901234567', code: '123456' };
      mockOtpService.verifyOtp.mockResolvedValue({ token: 'verify-token' });

      const result = await service.verifyOtp(dto);
      expect(result).toEqual({ token: 'verify-token' });
      expect(otpService.verifyOtp).toHaveBeenCalledWith(dto, COURIER_REGISTRATION_OTP);
    });
  });

  describe('create (register)', () => {
    it('should throw UnauthorizedException if verification token is invalid', async () => {
      const dto = {
        name: 'John Doe',
        phone: '0901234567',
        verificationToken: 'invalid-token',
        vehicleType: 'motorbike',
      };
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.create(1, dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should register a new courier and set status to PENDING', async () => {
      const dto = {
        name: 'John Doe',
        phone: '0901234567',
        verificationToken: 'valid-token',
        vehicleType: 'motorbike',
      };

      mockJwtService.verify.mockReturnValue({
        type: COURIER_REGISTRATION_OTP,
        phone: '0901234567',
      });

      mockPrismaService.courier.findUnique.mockResolvedValue(null);
      mockPrismaService.courier.create.mockResolvedValue({
        id: 1,
        userId: 1,
        name: 'John Doe',
        phone: '0901234567',
        status: COURIER_OPERATIONAL_STATUS.OFFLINE,
        vehicleType: 'motorbike',
        approvalStatus: COURIER_APPROVAL_STATUS.PENDING,
      });

      const result = await service.create(1, dto);
      expect(result).toBeDefined();
      expect(result.name).toBe('John Doe');
      expect(result.approvalStatus).toBe(COURIER_APPROVAL_STATUS.PENDING);
    });
  });

  describe('updateStatus', () => {
    it('should throw NotFoundException if courier not found', async () => {
      mockPrismaService.courier.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStatus(999, 1, COURIER_APPROVAL_STATUS.APPROVED)
      ).rejects.toThrow(NotFoundException);
    });

    it('should approve courier and grant COURIER role', async () => {
      const courierRecord = {
        id: 1,
        userId: 100,
        name: 'John Doe',
        approvalStatus: COURIER_APPROVAL_STATUS.PENDING,
      };

      mockPrismaService.courier.findFirst.mockResolvedValue(courierRecord);
      mockPrismaService.courier.update.mockResolvedValue({
        ...courierRecord,
        approvalStatus: COURIER_APPROVAL_STATUS.APPROVED,
        status: COURIER_OPERATIONAL_STATUS.AVAILABLE,
      });
      mockPrismaService.role.findUnique.mockResolvedValue({
        id: 5,
        name: 'COURIER',
      });
      mockPrismaService.userRole.findFirst.mockResolvedValue(null);
      mockPrismaService.userRole.create.mockResolvedValue({
        id: 1,
        userId: 100,
        roleId: 5,
      });

      const result = await service.updateStatus(
        1,
        2,
        COURIER_APPROVAL_STATUS.APPROVED
      );
      expect(result).toBeDefined();
      expect(result.approvalStatus).toBe(COURIER_APPROVAL_STATUS.APPROVED);
      expect(prisma.courier.update).toHaveBeenCalled();
    });

    it('should reject courier and save rejection reason', async () => {
      const courierRecord = {
        id: 1,
        userId: 100,
        name: 'John Doe',
        approvalStatus: COURIER_APPROVAL_STATUS.PENDING,
      };

      mockPrismaService.courier.findFirst.mockResolvedValue(courierRecord);
      mockPrismaService.courier.update.mockResolvedValue({
        ...courierRecord,
        approvalStatus: COURIER_APPROVAL_STATUS.REJECTED,
        rejectionReason: 'Invalid documents',
      });

      const result = await service.updateStatus(
        1,
        2,
        COURIER_APPROVAL_STATUS.REJECTED,
        'Invalid documents'
      );
      expect(result).toBeDefined();
      expect(result.approvalStatus).toBe(COURIER_APPROVAL_STATUS.REJECTED);
      expect(prisma.courier.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            approvalStatus: COURIER_APPROVAL_STATUS.REJECTED,
            rejectionReason: 'Invalid documents',
          }),
        })
      );
    });
  });
});

