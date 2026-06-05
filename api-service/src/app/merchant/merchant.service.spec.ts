import { ApprovalStatus, OperationalStatus } from '@prisma/client';
import { MerchantService } from './merchant.service';

describe('MerchantService', () => {
  function createService(merchants: any[]) {
    const prisma = {
      merchant: {
        findMany: vi.fn().mockResolvedValue(merchants),
      },
    } as any;

    return {
      service: new MerchantService(prisma, {} as any, {} as any),
      prisma,
    };
  }

  it('returns merchants managed by the current merchant owner', async () => {
    const merchant = {
      id: 10,
      externalId: 'merchant-external-id',
      name: 'Store A',
      approvalStatus: ApprovalStatus.APPROVED,
      operationalStatus: OperationalStatus.ACTIVE,
      isAcceptingOrders: true,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    };
    const { service, prisma } = createService([merchant]);

    const result = await service.findMine(5);

    expect(prisma.merchant.findMany).toHaveBeenCalledWith({
      where: {
        userRoles: {
          some: {
            userId: 5,
            role: { name: 'MERCHANT_OWNER' },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    expect(result.data).toEqual([
      {
        id: 10,
        externalId: 'merchant-external-id',
        name: 'Store A',
        approvalStatus: ApprovalStatus.APPROVED,
        operationalStatus: OperationalStatus.ACTIVE,
        isAcceptingOrders: true,
        createdAt: merchant.createdAt,
      },
    ]);
  });

  it('returns an empty list when user manages no merchants', async () => {
    const { service } = createService([]);

    await expect(service.findMine(5)).resolves.toEqual({ data: [] });
  });
});
