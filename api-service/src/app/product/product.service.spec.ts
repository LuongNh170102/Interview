import { ApprovalStatus } from '@prisma/client';
import { ProductService } from './product.service';

describe('ProductService', () => {
  function createService() {
    const prisma = {
      product: {
        findMany: vi.fn().mockResolvedValue([{ id: 1 }]),
        count: vi.fn().mockResolvedValue(1),
      },
    } as any;

    return {
      service: new ProductService(prisma, {} as any),
      prisma,
    };
  }

  it('returns paginated public products from approved merchants only', async () => {
    const { service, prisma } = createService();

    const result = await service.findAll({ page: 2, limit: 5 });

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        isActive: true,
        merchant: {
          approvalStatus: ApprovalStatus.APPROVED,
          isAcceptingOrders: true,
        },
      },
      skip: 5,
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        merchant: true,
      },
    });
    expect(result.meta).toEqual({
      total: 1,
      page: 2,
      lastPage: 1,
      limit: 5,
    });
  });
});
