import { describe, expect, it, vi, beforeEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { CourierService } from './courier.service';
import { COURIER_APPROVAL_STATUS } from '../common/constants/courier.constant';
import { ROLE } from '../common/constants/role.constants';

describe('CourierService approval flow', () => {
  const prisma = {
    courier: {
      findUnique: vi.fn(),
    },
    role: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  } as any;

  const jwtService = {} as any;
  const otpService = {} as any;

  let service: CourierService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new CourierService(prisma, jwtService, otpService);
  });

  it('throws when rejecting without a reason', async () => {
    prisma.courier.findUnique.mockResolvedValue({
      externalId: 'courier-1',
      userId: 10,
      approvalStatus: COURIER_APPROVAL_STATUS.PENDING,
      rejectionReason: null,
      user: {
        externalId: 'user-1',
        email: 'courier@example.com',
        username: 'Courier',
        phone: '0123',
      },
    });

    await expect(
      service.updateApproval('courier-1', 1, {
        status: COURIER_APPROVAL_STATUS.REJECTED,
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns current courier when approval request is idempotent', async () => {
    const courier = {
      externalId: 'courier-1',
      userId: 10,
      approvalStatus: COURIER_APPROVAL_STATUS.APPROVED,
      rejectionReason: null,
      user: {
        externalId: 'user-1',
        email: 'courier@example.com',
        username: 'Courier',
        phone: '0123',
      },
    };

    prisma.courier.findUnique.mockResolvedValue(courier);

    const result = await service.updateApproval('courier-1', 1, {
      status: COURIER_APPROVAL_STATUS.APPROVED,
    });

    expect(result.externalId).toBe('courier-1');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('assigns courier role when approving a pending courier', async () => {
    prisma.courier.findUnique.mockResolvedValue({
      externalId: 'courier-1',
      userId: 10,
      approvalStatus: COURIER_APPROVAL_STATUS.PENDING,
      approvedAt: null,
      rejectionReason: null,
      user: {
        externalId: 'user-1',
        email: 'courier@example.com',
        username: 'Courier',
        phone: '0123',
      },
    });

    prisma.role.findUnique.mockResolvedValue({ id: 99, name: ROLE.COURIER });
    prisma.$transaction.mockImplementation(async (handler: any) => {
      const tx = {
        courier: {
          update: vi.fn().mockResolvedValue({
            externalId: 'courier-1',
            userId: 10,
            approvalStatus: COURIER_APPROVAL_STATUS.APPROVED,
            user: {
              externalId: 'user-1',
              email: 'courier@example.com',
              username: 'Courier',
              phone: '0123',
            },
          }),
        },
        userRole: {
          findFirst: vi.fn().mockResolvedValue(null),
          create: vi.fn().mockResolvedValue({ id: 1 }),
          deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      };

      const result = await handler(tx);
      expect(tx.userRole.create).toHaveBeenCalledWith({
        data: {
          userId: 10,
          roleId: 99,
        },
      });
      return result;
    });

    const result = await service.updateApproval('courier-1', 1, {
      status: COURIER_APPROVAL_STATUS.APPROVED,
    });

    expect(result.approvalStatus).toBe(COURIER_APPROVAL_STATUS.APPROVED);
  });
});
