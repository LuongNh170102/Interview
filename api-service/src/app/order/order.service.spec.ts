import { BadRequestException } from '@nestjs/common';
import { vi } from 'vitest';
import {
  ApprovalStatus,
  CourierAvailabilityStatus,
  OperationalStatus,
} from '@prisma/client';
import { OrderService } from './order.service';

describe('OrderService - courier selection', () => {
  let service: OrderService;
  let prisma: {
    courier: { findMany: ReturnType<typeof vi.fn> };
  };

  beforeEach(() => {
    prisma = {
      courier: {
        findMany: vi.fn(),
      },
    };
    service = new OrderService(prisma as never);
  });

  it('should pick nearest APPROVED + ONLINE courier', async () => {
    prisma.courier.findMany.mockResolvedValue([
      {
        id: 1,
        approvalStatus: ApprovalStatus.APPROVED,
        operationalStatus: OperationalStatus.ACTIVE,
        availabilityStatus: CourierAvailabilityStatus.ONLINE,
        latitude: 10.8,
        longitude: 106.7,
      },
      {
        id: 2,
        approvalStatus: ApprovalStatus.APPROVED,
        operationalStatus: OperationalStatus.ACTIVE,
        availabilityStatus: CourierAvailabilityStatus.ONLINE,
        latitude: 10.77,
        longitude: 106.69,
      },
    ]);

    const nearest = await service.findNearestEligibleCourier(10.7769, 106.7009);

    expect(nearest?.id).toBe(2);
    expect(prisma.courier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          approvalStatus: ApprovalStatus.APPROVED,
          availabilityStatus: CourierAvailabilityStatus.ONLINE,
        }),
      })
    );
  });

  it('should return null when no eligible courier', async () => {
    prisma.courier.findMany.mockResolvedValue([]);
    const nearest = await service.findNearestEligibleCourier(10.77, 106.69);
    expect(nearest).toBeNull();
  });
});

describe('OrderService - createOrder validation', () => {
  it('should reject missing delivery coordinates', async () => {
    const prisma = {} as never;
    const service = new OrderService(prisma);

    await expect(
      service.createOrder(1, {
        merchantId: 'merchant-uuid',
        deliveryAddress: {
          address: 'HCM',
          latitude: undefined as unknown as number,
          longitude: 106.7,
        },
      })
    ).rejects.toThrow(BadRequestException);
  });
});
