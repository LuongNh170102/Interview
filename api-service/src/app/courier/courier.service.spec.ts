import { ApprovalStatus, OperationalStatus, RoleScope } from '@prisma/client';
import { CourierService } from './courier.service';
import { COURIER_STATUS } from '../common/constants/courier.constant';
import { ROLE } from '../common/constants/role.constants';

describe('CourierService', () => {
  const courier = {
    id: 1,
    externalId: '8e1c43d8-3dc4-4f83-8ff3-1e6a08db2839',
    userId: 10,
    name: 'Courier One',
    phone: '0900000000',
    email: 'courier@example.com',
    status: null,
    vehicleType: 'motorbike',
    currentLocation: null,
    approvalStatus: ApprovalStatus.PENDING,
    approvedAt: null,
    approvedBy: null,
    rejectedAt: null,
    rejectedBy: null,
    rejectionReason: null,
    operationalStatus: OperationalStatus.ACTIVE,
    statusChangedAt: null,
    statusChangedBy: null,
    statusReason: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: null,
  };

  function createService(prismaOverrides: Record<string, unknown> = {}) {
    const tx = {
      courier: {
        update: vi.fn().mockResolvedValue({
          ...courier,
          approvalStatus: ApprovalStatus.APPROVED,
          approvedAt: new Date('2026-01-02T00:00:00.000Z'),
          approvedBy: 99,
        }),
      },
      role: {
        findUnique: vi.fn().mockResolvedValue({
          id: 4,
          name: ROLE.COURIER,
          scope: RoleScope.PLATFORM,
        }),
        create: vi.fn(),
      },
      userRole: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: 22 }),
      },
    };

    const prisma = {
      courier: {
        findUnique: vi.fn().mockResolvedValue(courier),
        update: vi.fn().mockResolvedValue({
          ...courier,
          approvalStatus: ApprovalStatus.REJECTED,
          rejectedAt: new Date('2026-01-03T00:00:00.000Z'),
          rejectedBy: 99,
          rejectionReason: 'Missing vehicle documents',
        }),
      },
      $transaction: vi.fn((callback) => callback(tx)),
      ...prismaOverrides,
    } as any;

    const service = new CourierService(prisma, {} as any, {} as any);
    return { service, prisma, tx };
  }

  it('approves a pending courier and assigns courier role once', async () => {
    const { service, tx } = createService();

    const result = await service.approve(courier.externalId, 99);

    expect(result.approvalStatus).toBe(COURIER_STATUS.APPROVED);
    expect(tx.courier.update).toHaveBeenCalledWith({
      where: { externalId: courier.externalId },
      data: expect.objectContaining({
        approvalStatus: ApprovalStatus.APPROVED,
        approvedBy: 99,
        rejectedAt: null,
        rejectedBy: null,
        rejectionReason: null,
      }),
    });
    expect(tx.userRole.create).toHaveBeenCalledWith({
      data: {
        userId: courier.userId,
        roleId: 4,
      },
    });
  });

  it('does not duplicate courier role when approval is repeated', async () => {
    const approvedCourier = {
      ...courier,
      approvalStatus: ApprovalStatus.APPROVED,
    };
    const { service, prisma } = createService({
      courier: {
        findUnique: vi.fn().mockResolvedValue(approvedCourier),
      },
      $transaction: vi.fn(),
    });

    const result = await service.approve(courier.externalId, 99);

    expect(result.approvalStatus).toBe(COURIER_STATUS.APPROVED);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a courier with a required rejection reason', async () => {
    const { service, prisma } = createService();

    const result = await service.reject(
      courier.externalId,
      'Missing vehicle documents',
      99
    );

    expect(result.approvalStatus).toBe(COURIER_STATUS.REJECTED);
    expect(result.rejectionReason).toBe('Missing vehicle documents');
    expect(prisma.courier.update).toHaveBeenCalledWith({
      where: { externalId: courier.externalId },
      data: expect.objectContaining({
        approvalStatus: ApprovalStatus.REJECTED,
        rejectedBy: 99,
        rejectionReason: 'Missing vehicle documents',
      }),
    });
  });
});
