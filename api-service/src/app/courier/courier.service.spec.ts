import { BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApprovalStatus } from '@prisma/client';
import { vi } from 'vitest';
import { CourierService } from './courier.service';
import { PrismaService } from '../prisma.service';
import { OtpService } from '../otp/otp.service';
import { COURIER_STATUS } from '../common/constants/courier.constant';
import { ROLE } from '../common/constants/role.constants';

describe('CourierService - approval flow', () => {
  let service: CourierService;
  let prisma: {
    courier: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
    role: { findUnique: ReturnType<typeof vi.fn> };
    userRole: {
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
    courierApprovalAudit: { create: ReturnType<typeof vi.fn> };
  };
  let jwtService: { verify: ReturnType<typeof vi.fn> };
  let otpService: {
    requestOtp: ReturnType<typeof vi.fn>;
    verifyOtp: ReturnType<typeof vi.fn>;
  };

  const pendingCourier = {
    id: 1,
    externalId: 'courier-uuid',
    userId: 10,
    name: 'Test Courier',
    phone: '0901234567',
    email: null,
    address: null,
    vehicleType: 'motorbike',
    latitude: null,
    longitude: null,
    currentLocation: null,
    approvalStatus: COURIER_STATUS.PENDING as ApprovalStatus,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    operationalStatus: 'ACTIVE',
    availabilityStatus: 'OFFLINE',
    createdAt: new Date(),
    updatedAt: null,
    user: {
      email: 'courier@test.com',
      username: 'courier1',
      phone: '0901234567',
    },
  };

  beforeEach(() => {
    prisma = {
      courier: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
      },
      $transaction: vi.fn(),
      role: { findUnique: vi.fn() },
      userRole: {
        findFirst: vi.fn(),
        update: vi.fn(),
        create: vi.fn(),
      },
      courierApprovalAudit: { create: vi.fn() },
    };

    jwtService = { verify: vi.fn() };
    otpService = { requestOtp: vi.fn(), verifyOtp: vi.fn() };

    service = new CourierService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      otpService as unknown as OtpService
    );
  });

  describe('approve', () => {
    it('should approve a pending courier and assign COURIER role', async () => {
      const approvedCourier = {
        ...pendingCourier,
        approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus,
        approvedAt: new Date(),
        approvedBy: 99,
      };

      prisma.courier.findFirst.mockResolvedValue(pendingCourier);
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          courier: {
            update: vi.fn().mockResolvedValue(approvedCourier),
          },
          role: {
            findUnique: vi
              .fn()
              .mockResolvedValueOnce({ id: 5, name: ROLE.COURIER })
              .mockResolvedValueOnce({ id: 2, name: ROLE.CUSTOMER }),
          },
          userRole: {
            findFirst: vi
              .fn()
              .mockResolvedValueOnce(null)
              .mockResolvedValueOnce({ id: 20, userId: 10, roleId: 2 }),
            update: vi.fn(),
            create: vi.fn(),
          },
          courierApprovalAudit: { create: vi.fn() },
        };
        return callback(tx);
      });

      const result = await service.approve('courier-uuid', 99);

      expect(result.approvalStatus).toBe(COURIER_STATUS.APPROVED);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should be idempotent when courier is already approved', async () => {
      const approvedCourier = {
        ...pendingCourier,
        approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus,
      };

      prisma.courier.findFirst.mockResolvedValue(approvedCourier);

      const result = await service.approve('courier-uuid', 99);

      expect(result.approvalStatus).toBe(COURIER_STATUS.APPROVED);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw when courier is not found', async () => {
      prisma.courier.findFirst.mockResolvedValue(null);

      await expect(service.approve('missing', 99)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw when trying to approve a rejected courier', async () => {
      prisma.courier.findFirst.mockResolvedValue({
        ...pendingCourier,
        approvalStatus: COURIER_STATUS.REJECTED as ApprovalStatus,
      });

      await expect(service.approve('courier-uuid', 99)).rejects.toThrow(
        BadRequestException
      );
    });
  });

  describe('reject', () => {
    it('should reject a pending courier with reason', async () => {
      const rejectedCourier = {
        ...pendingCourier,
        approvalStatus: COURIER_STATUS.REJECTED as ApprovalStatus,
        rejectedAt: new Date(),
        rejectedBy: 99,
        rejectionReason: 'Invalid documents',
      };

      prisma.courier.findFirst.mockResolvedValue(pendingCourier);
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          courier: {
            update: vi.fn().mockResolvedValue(rejectedCourier),
          },
          courierApprovalAudit: {
            create: vi.fn(),
          },
        };
        return callback(tx);
      });

      const result = await service.reject('courier-uuid', 99, {
        rejectionReason: 'Invalid documents',
      });

      expect(result.approvalStatus).toBe(COURIER_STATUS.REJECTED);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw when trying to reject an approved courier', async () => {
      prisma.courier.findFirst.mockResolvedValue({
        ...pendingCourier,
        approvalStatus: COURIER_STATUS.APPROVED as ApprovalStatus,
      });

      await expect(
        service.reject('courier-uuid', 99, {
          rejectionReason: 'Too late',
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove', () => {
    it('should soft delete courier and write audit log', async () => {
      const deletedCourier = {
        ...pendingCourier,
        deletedAt: new Date(),
      };

      prisma.courier.findFirst.mockResolvedValue({
        ...pendingCourier,
        user: pendingCourier.user,
      });
      prisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          courier: {
            update: vi.fn().mockResolvedValue(deletedCourier),
          },
          courierApprovalAudit: {
            create: vi.fn(),
          },
        };
        return callback(tx);
      });

      const result = await service.remove('courier-uuid', 99);

      expect(result).toBeDefined();
      expect(prisma.$transaction).toHaveBeenCalled();
    });
  });
});
