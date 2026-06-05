import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderService } from './order.service';

type PrismaMock = {
  product: {
    findMany: ReturnType<typeof vi.fn>;
  };
  courier: {
    findMany: ReturnType<typeof vi.fn>;
  };
  order: {
    create: ReturnType<typeof vi.fn>;
  };
};

type OrderCreateArgs = {
  data: {
    totalAmount: number;
    currency: string | null | undefined;
    status: string | null;
    paymentStatus: string | null;
    deliveryAddress: unknown;
    courierId?: number | null;
  };
};

type CreatedOrderMock = {
  id: number;
  externalId: string;
  totalAmount: number;
  currency: string | null | undefined;
  status: string | null;
  paymentStatus: string | null;
  deliveryAddress: unknown;
  createdAt: Date;
  updatedAt: null;
  courier: { externalId: string } | null;
  orderItems: Array<{
    quantity: number;
    price: number;
    total: number;
    product: {
      externalId: string;
      name: string;
    };
  }>;
};

describe('OrderService courier assignment', () => {
  const prisma: PrismaMock = {
    product: {
      findMany: vi.fn(),
    },
    courier: {
      findMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
    },
  };

  const dto: CreateOrderDto = {
    items: [{ productId: 'product-1', quantity: 2 }],
    deliveryAddress: {
      fullName: 'Test User',
      phone: '0900000000',
      addressLine1: '123 Main St',
      city: 'Ho Chi Minh City',
    },
  };

  let service: OrderService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OrderService(prisma as unknown as PrismaService);

    prisma.order.create.mockImplementation(
      async ({ data }: OrderCreateArgs): Promise<CreatedOrderMock> => ({
        id: 500,
        externalId: 'order-1',
        totalAmount: data.totalAmount,
        currency: data.currency,
        status: data.status,
        paymentStatus: data.paymentStatus,
        deliveryAddress: data.deliveryAddress,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: null,
        courier: data.courierId
          ? { externalId: `courier-${data.courierId}` }
          : null,
        orderItems: [
          {
            quantity: 2,
            price: 50000,
            total: 100000,
            product: {
              externalId: 'product-1',
              name: 'Pho Bo',
            },
          },
        ],
      })
    );
  });

  it('assigns the nearest eligible courier when merchant coordinates are available', async (): Promise<void> => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 10,
        externalId: 'product-1',
        merchantId: 20,
        name: 'Pho Bo',
        price: 50000,
        stock: 10,
        status: 'PUBLISHED',
        isActive: true,
        currency: 'VND',
        merchant: {
          id: 20,
          approvalStatus: 'APPROVED',
          latitude: 10.77584,
          longitude: 106.70098,
        },
      },
    ]);

    prisma.courier.findMany.mockResolvedValue([
      {
        id: 1,
        currentLocation: { lat: 10.845, lng: 106.76 },
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2025-12-31T00:00:00.000Z'),
      },
      {
        id: 2,
        currentLocation: { lat: 10.776, lng: 106.701 },
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    await service.create(99, dto);

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          courierId: 2,
          status: 'confirmed',
        }),
      })
    );
  });

  it('falls back to the first eligible courier when merchant coordinates are unavailable', async (): Promise<void> => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 10,
        externalId: 'product-1',
        merchantId: 20,
        name: 'Pho Bo',
        price: 50000,
        stock: 10,
        status: 'PUBLISHED',
        isActive: true,
        currency: 'VND',
        merchant: {
          id: 20,
          approvalStatus: 'APPROVED',
          latitude: null,
          longitude: null,
        },
      },
    ]);

    prisma.courier.findMany.mockResolvedValue([
      {
        id: 5,
        currentLocation: null,
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        createdAt: new Date('2025-12-31T00:00:00.000Z'),
      },
      {
        id: 6,
        currentLocation: { lat: 10.776, lng: 106.701 },
        updatedAt: new Date('2026-01-02T00:00:00.000Z'),
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    await service.create(99, dto);

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          courierId: 5,
          status: 'confirmed',
        }),
      })
    );
  });
});
