import { Test, TestingModule } from '@nestjs/testing';
import { CourierService, COURIER_MESSAGES } from './courier.service';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from '../otp/otp.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { COURIER_APPROVAL_STATUS } from '../common/constants/courier.constant';

// ---------------------------------------------------------------------------
// Minimal mocks
// ---------------------------------------------------------------------------
const mockPrisma = {
  courier: {
    findUnique: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  },
  role: { findUnique: jest.fn() },
  userRole: { findFirst: jest.fn(), create: jest.fn() },
  $transaction: jest.fn(),
};

const mockJwt = {
  verify: jest.fn(),
  sign: jest.fn(),
};

const mockOtp = {
  requestOtp: jest.fn(),
  verifyOtp: jest.fn(),
};

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------
describe('CourierService', () => {
  let service: CourierService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourierService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: OtpService, useValue: mockOtp },
      ],
    }).compile();

    service = module.get<CourierService>(CourierService);
    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // register()
  // -------------------------------------------------------------------------
  describe('register()', () => {
    const validDto = {
      name: 'Nguyen Van A',
      phone: '0901234567',
      email: 'courier@test.com',
      vehicleType: 'motorbike',
      verificationToken: 'valid.jwt.token',
    };

    it('should throw UnauthorizedException for invalid token', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.register(validDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException for wrong token type', async () => {
      mockJwt.verify.mockReturnValue({
        phone: validDto.phone,
        type: 'WRONG_TYPE',
      });

      await expect(service.register(validDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when phone mismatch', async () => {
      mockJwt.verify.mockReturnValue({
        phone: '0999999999',
        type: 'COURIER_REGISTRATION_OTP',
      });

      await expect(service.register(validDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw ConflictException when phone already registered', async () => {
      mockJwt.verify.mockReturnValue({
        phone: validDto.phone,
        type: 'COURIER_REGISTRATION_OTP',
      });
      mockPrisma.courier.findUnique.mockResolvedValueOnce({ id: 1 }); // phone exists

      await expect(service.register(validDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException when email already registered', async () => {
      mockJwt.verify.mockReturnValue({
        phone: validDto.phone,
        type: 'COURIER_REGISTRATION_OTP',
      });
      mockPrisma.courier.findUnique
        .mockResolvedValueOnce(null)       // phone OK
        .mockResolvedValueOnce({ id: 1 }); // email exists

      await expect(service.register(validDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should create courier with PENDING status on valid registration', async () => {
      mockJwt.verify.mockReturnValue({
        phone: validDto.phone,
        type: 'COURIER_REGISTRATION_OTP',
      });
      mockPrisma.courier.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const createdCourier = {
        id: 1,
        externalId: 'uuid-here',
        name: validDto.name,
        phone: validDto.phone,
        email: validDto.email,
        approvalStatus: 'PENDING',
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: null,
      };
      mockPrisma.courier.create.mockResolvedValue(createdCourier);

      const result = await service.register(validDto);

      expect(mockPrisma.courier.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: validDto.phone,
            email: validDto.email,
            approvalStatus: 'PENDING',
          }),
        }),
      );
      expect(result.approvalStatus).toBe('PENDING');
    });
  });

  // -------------------------------------------------------------------------
  // approve() — idempotency
  // -------------------------------------------------------------------------
  describe('approve()', () => {
    const externalId = 'courier-uuid';

    it('should throw NotFoundException when courier does not exist', async () => {
      mockPrisma.courier.findUnique.mockResolvedValue(null);

      await expect(service.approve(externalId, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should be idempotent — return existing entity if already APPROVED', async () => {
      const approvedCourier = {
        id: 1,
        externalId,
        approvalStatus: COURIER_APPROVAL_STATUS.APPROVED,
        deletedAt: null,
      };
      mockPrisma.courier.findUnique.mockResolvedValue(approvedCourier);

      const result = await service.approve(externalId, 1);

      // Should NOT call update — idempotent return
      expect(mockPrisma.courier.update).not.toHaveBeenCalled();
      expect(result.approvalStatus).toBe(COURIER_APPROVAL_STATUS.APPROVED);
    });

    it('should throw BadRequestException when trying to approve a REJECTED courier', async () => {
      mockPrisma.courier.findUnique.mockResolvedValue({
        id: 1,
        externalId,
        approvalStatus: COURIER_APPROVAL_STATUS.REJECTED,
        deletedAt: null,
      });

      await expect(service.approve(externalId, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should update status to APPROVED for PENDING courier', async () => {
      const pendingCourier = {
        id: 1,
        externalId,
        approvalStatus: COURIER_APPROVAL_STATUS.PENDING,
        userId: null,
        deletedAt: null,
      };
      const approvedCourier = { ...pendingCourier, approvalStatus: COURIER_APPROVAL_STATUS.APPROVED };

      mockPrisma.courier.findUnique.mockResolvedValue(pendingCourier);
      mockPrisma.$transaction.mockImplementation(async (fn: any) =>
        fn(mockPrisma),
      );
      mockPrisma.courier.update.mockResolvedValue(approvedCourier);

      const result = await service.approve(externalId, 99);

      expect(mockPrisma.courier.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            approvalStatus: COURIER_APPROVAL_STATUS.APPROVED,
            approvedBy: 99,
          }),
        }),
      );
      expect(result.approvalStatus).toBe(COURIER_APPROVAL_STATUS.APPROVED);
    });
  });

  // -------------------------------------------------------------------------
  // reject()
  // -------------------------------------------------------------------------
  describe('reject()', () => {
    const externalId = 'courier-uuid';
    const rejectDto = { reason: 'License plate image is blurry and unreadable.' };

    it('should throw NotFoundException when courier does not exist', async () => {
      mockPrisma.courier.findUnique.mockResolvedValue(null);

      await expect(service.reject(externalId, rejectDto, 1)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when courier is already APPROVED', async () => {
      mockPrisma.courier.findUnique.mockResolvedValue({
        id: 1,
        externalId,
        approvalStatus: COURIER_APPROVAL_STATUS.APPROVED,
        deletedAt: null,
      });

      await expect(service.reject(externalId, rejectDto, 1)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should persist rejection reason in database', async () => {
      const pendingCourier = {
        id: 1,
        externalId,
        approvalStatus: COURIER_APPROVAL_STATUS.PENDING,
        deletedAt: null,
      };
      mockPrisma.courier.findUnique.mockResolvedValue(pendingCourier);
      mockPrisma.courier.update.mockResolvedValue({
        ...pendingCourier,
        approvalStatus: COURIER_APPROVAL_STATUS.REJECTED,
        rejectionReason: rejectDto.reason,
      });

      const result = await service.reject(externalId, rejectDto, 5);

      expect(mockPrisma.courier.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            approvalStatus: COURIER_APPROVAL_STATUS.REJECTED,
            rejectedBy: 5,
            rejectionReason: rejectDto.reason,
          }),
        }),
      );
      expect(result.rejectionReason).toBe(rejectDto.reason);
    });
  });
});
