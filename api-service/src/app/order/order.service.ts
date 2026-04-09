import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CourierService } from '../courier/courier.service';

@Injectable()
export class OrderService {
  constructor(
    private prisma: PrismaService,
    private courierService: CourierService
  ) {}

  //* Task 3: Implement logic for selecting the nearest courier during order creation
  async createOrder(createOrderDto: any) {
    const { merchantId, customerId, items, ...orderData } = createOrderDto;

    // Find Merchant to get coordinates
    const merchant = await this.prisma.merchant.findUnique({
      where: { id: merchantId },
    });

    if (!merchant || merchant.status !== 'APPROVED') {
      throw new BadRequestException(
        'This merchant is unavailable'
      );
    }

    // Find nearest courier (Logic "During Order Creation")
    const nearestCourier = await this.courierService.findNearestCourier(
      (merchant as any).lat || 10.762622, // Tọa độ mặc định nếu DB trống
      (merchant as any).lng || 106.660172
    );

    if (!nearestCourier) {
      throw new BadRequestException(
        'There are currently no accounts available in this region'
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          ...orderData,
          merchantId,
          customerId,
          courierId: nearestCourier.id,
          status: 'preparing',
          orderItems: {
            create: items.map((item: any) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity,
              metadata: item.metadata || {},
            })),
          },
          include: {
            orderItems: true,
          },
        },
      });

      return newOrder;
    });
  }
}
