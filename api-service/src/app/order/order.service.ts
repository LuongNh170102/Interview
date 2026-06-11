import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CART_MESSAGES, ORDER_MESSAGES } from '../common/constants/messages.constant';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateOrderDto) {
    // 1. Get user's active cart
    const cart = await this.prisma.cart.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        cartItems: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.cartItems.length === 0) {
      throw new BadRequestException(CART_MESSAGES.CART_EMPTY);
    }

    // 2. Calculate total
    const totalAmount = cart.cartItems.reduce((sum, item) => {
      return sum + Number(item.price || 0) * (item.quantity || 0);
    }, 0);

    // 3. Find nearest available courier
    const courierId = await this.findNearestCourier(dto.coordinates);

    // 4. Create the order
    const order = await this.prisma.order.create({
      data: {
        userId,
        merchantId: cart.merchantId,
        totalAmount,
        status: courierId ? 'confirmed' : 'pending',
        deliveryAddress: dto.deliveryAddress,
        courierId,
        shippingFee: courierId ? 15000 : 0, // Default shipping fee
        orderItems: {
          create: cart.cartItems.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            total: Number(item.price || 0) * (item.quantity || 0),
          })),
        },
      },
      include: {
        orderItems: {
          include: { product: true },
        },
        courier: {
          select: { id: true, name: true, phone: true, vehicleType: true },
        },
      },
    });

    // 5. Clear the cart
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { totalAmount: 0 },
    });

    return {
      message: ORDER_MESSAGES.ORDER_CREATED,
      order,
      courierAssigned: !!courierId,
      courierMessage: courierId
        ? ORDER_MESSAGES.COURIER_ASSIGNED
        : ORDER_MESSAGES.NO_COURIER_AVAILABLE,
    };
  }

  async getUserOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                externalId: true,
                name: true,
                price: true,
                metadata: true,
              },
            },
          },
        },
        merchant: {
          select: { externalId: true, name: true, logoUrl: true },
        },
        courier: {
          select: { id: true, name: true, phone: true, vehicleType: true },
        },
      },
    });
  }

  async findById(externalId: string) {
    const order = await this.prisma.order.findUnique({
      where: { externalId },
      include: {
        orderItems: {
          include: { product: true },
        },
        merchant: {
          select: { externalId: true, name: true, phone: true, address: true },
        },
        courier: {
          select: { id: true, name: true, phone: true, vehicleType: true, vehicleNumber: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(ORDER_MESSAGES.ORDER_NOT_FOUND);
    }

    return order;
  }

  /**
   * Find nearest available courier based on user's delivery coordinates.
   * Falls back to any available courier if no coordinates provided.
   */
  private async findNearestCourier(coordinates?: { lat: number; lng: number }): Promise<number | null> {
    const availableCouriers = await this.prisma.courier.findMany({
      where: {
        status: 'available',
        approvalStatus: 'APPROVED',
        operationalStatus: 'ACTIVE',
      },
      select: {
        id: true,
        currentLocation: true,
      },
    });

    if (availableCouriers.length === 0) {
      return null;
    }

    if (!coordinates || availableCouriers.length === 1) {
      return availableCouriers[0].id;
    }

    // Find nearest courier by Euclidean distance
    let nearestCourier = availableCouriers[0];
    let minDistance = Number.MAX_VALUE;

    for (const courier of availableCouriers) {
      const location = courier.currentLocation as { lat: number; lng: number } | null;
      if (!location) continue;

      const distance = Math.sqrt(
        Math.pow(location.lat - coordinates.lat, 2) +
        Math.pow(location.lng - coordinates.lng, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestCourier = courier;
      }
    }

    return nearestCourier.id;
  }
}
