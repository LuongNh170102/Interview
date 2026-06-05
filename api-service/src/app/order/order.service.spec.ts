import { ApprovalStatus, OperationalStatus, Prisma } from '@prisma/client';
import { COURIER_AVAILABILITY_STATUS } from '../common/constants/courier.constant';
import { MERCHANT_STATUS } from '../common/constants/merchant.constant';
import { OrderService } from './order.service';

describe('OrderService', () => {
  const approvedOnlineCourier = {
    id: 1,
    approvalStatus: ApprovalStatus.APPROVED,
    operationalStatus: OperationalStatus.ACTIVE,
    status: COURIER_AVAILABILITY_STATUS.ONLINE,
    currentLocation: { latitude: 10.78, longitude: 106.7 },
  };

  function createService(couriers: any[]) {
    const prisma = {
      courier: {
        findMany: vi.fn().mockResolvedValue(couriers),
      },
    } as any;

    return {
      service: new OrderService(prisma),
      prisma,
    };
  }

  function createOrderService(overrides: Record<string, unknown> = {}) {
    const merchant = {
      id: 10,
      externalId: 'merchant-external-id',
      approvalStatus: MERCHANT_STATUS.APPROVED,
      isAcceptingOrders: true,
    };
    const product = {
      id: 20,
      externalId: 'product-external-id',
      price: new Prisma.Decimal(12000),
    };
    const courier = {
      ...approvedOnlineCourier,
      id: 30,
    };

    const prisma = {
      merchant: {
        findUnique: vi.fn().mockResolvedValue(merchant),
      },
      product: {
        findMany: vi.fn().mockResolvedValue([product]),
      },
      courier: {
        findMany: vi.fn().mockResolvedValue([courier]),
      },
      order: {
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockResolvedValue({ id: 99 }),
        findMany: vi.fn().mockResolvedValue([{ id: 99 }]),
      },
      ...overrides,
    } as any;

    return {
      service: new OrderService(prisma),
      prisma,
      merchant,
      product,
      courier,
    };
  }

  it('only queries approved, active and online couriers', async () => {
    const { service, prisma } = createService([approvedOnlineCourier]);

    const result = await service.findEligibleCourier();

    expect(result).toEqual(approvedOnlineCourier);
    expect(prisma.courier.findMany).toHaveBeenCalledWith({
      where: {
        approvalStatus: ApprovalStatus.APPROVED,
        operationalStatus: OperationalStatus.ACTIVE,
        status: COURIER_AVAILABILITY_STATUS.ONLINE,
      },
    });
  });

  it('selects the nearest eligible courier when customer location is provided', async () => {
    const fartherCourier = {
      ...approvedOnlineCourier,
      id: 2,
      currentLocation: { latitude: 21.02, longitude: 105.85 },
    };
    const nearestCourier = {
      ...approvedOnlineCourier,
      id: 3,
      currentLocation: { latitude: 10.775, longitude: 106.701 },
    };
    const { service } = createService([fartherCourier, nearestCourier]);

    const result = await service.findEligibleCourier({
      latitude: 10.776,
      longitude: 106.702,
    });

    expect(result).toEqual(nearestCourier);
  });

  it('rejects order creation when no eligible courier is available', async () => {
    const { service, prisma } = createOrderService({
      courier: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    });

    await expect(
      service.create(5, {
        merchantId: 'merchant-external-id',
        items: [{ productId: 'product-external-id', quantity: 1 }],
      })
    ).rejects.toThrow('No eligible courier available');
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('merges duplicate product lines before creating order items', async () => {
    const { service, prisma } = createOrderService();

    await service.create(5, {
      merchantId: 'merchant-external-id',
      items: [
        { productId: 'product-external-id', quantity: 1 },
        { productId: 'product-external-id', quantity: 2 },
      ],
    });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          externalId: { in: ['product-external-id'] },
        }),
      })
    );
    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          totalAmount: new Prisma.Decimal(36000),
          orderItems: {
            create: [
              expect.objectContaining({
                productId: 20,
                quantity: 3,
                total: new Prisma.Decimal(36000),
              }),
            ],
          },
        }),
      })
    );
  });

  it('rejects products without price to avoid zero-value orders', async () => {
    const { service, prisma } = createOrderService({
      product: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 20,
            externalId: 'product-external-id',
            price: null,
          },
        ]),
      },
    });

    await expect(
      service.create(5, {
        merchantId: 'merchant-external-id',
        items: [{ productId: 'product-external-id', quantity: 1 }],
      })
    ).rejects.toThrow('Product price is required');
    expect(prisma.order.create).not.toHaveBeenCalled();
  });

  it('lists all orders for platform admins', async () => {
    const { service, prisma } = createOrderService();

    const result = await service.findAll(
      { userId: 1, roles: ['PLATFORM_ADMIN'] },
      { page: 1, limit: 10 }
    );

    expect(result.meta.total).toBe(1);
    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {},
        skip: 0,
        take: 10,
      })
    );
    expect(prisma.order.count).toHaveBeenCalledWith({ where: {} });
  });

  it('limits order list to merchants managed by merchant owners', async () => {
    const { service, prisma } = createOrderService();

    await service.findAll({ userId: 5, roles: ['MERCHANT_OWNER'] }, { page: 2, limit: 5 });

    const expectedWhere = {
      merchant: {
        userRoles: {
          some: {
            userId: 5,
            role: {
              name: 'MERCHANT_OWNER',
            },
          },
        },
      },
    };

    expect(prisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expectedWhere,
        skip: 5,
        take: 5,
      })
    );
    expect(prisma.order.count).toHaveBeenCalledWith({ where: expectedWhere });
  });
});
