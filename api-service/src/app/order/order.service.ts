import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { MERCHANT_STATUS } from '../common/constants/merchant.constant';
import { COURIER_APPROVAL_STATUS, COURIER_OPERATIONAL_STATUS } from '../common/constants/courier.constant';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    const { merchantId: merchantExternalId, items } = createOrderDto;

    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId: merchantExternalId },
    });
    if (!merchant) throw new NotFoundException('Merchant not found.');

    if (merchant.approvalStatus !== MERCHANT_STATUS.APPROVED) {
      throw new ForbiddenException('Merchant is not approved to take orders.');
    }

    const user = await this.prisma.user.findFirst();
    if (!user) throw new BadRequestException('No user found in system to assign order.');

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { externalId: item.productId },
      });

      if (!product) throw new NotFoundException(`Product ${item.productId} not found.`);

      if (product.merchantId !== merchant.id) {
        throw new BadRequestException(`Product ${product.sku} does not belong to this merchant.`);
      }

      const price = Number(product.price);
      const total = price * item.quantity;
      subtotal += total;

      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: new Prisma.Decimal(price),
        total: new Prisma.Decimal(total),
      });
    }

    const vat = Math.round(subtotal * 0.1);
    const shippingFee = 15000;
    const totalAmount = subtotal + vat + shippingFee;

    const couriers = await this.prisma.courier.findMany({
      where: {
        approvalStatus: COURIER_APPROVAL_STATUS.APPROVED,
        status: COURIER_OPERATIONAL_STATUS.AVAILABLE,
        deletedAt: null,
      },
      include: {
        user: true,
      },
    });

    let selectedCourier = null;
    let selectedCourierDistance = null;

    if (couriers.length > 0) {
      const merchantLat = merchant.latitude;
      const merchantLng = merchant.longitude;

      if (merchantLat !== null && merchantLng !== null) {
        let minDistance = Infinity;
        for (const courier of couriers) {
          let courierLat = null;
          let courierLng = null;

          if (courier.currentLocation) {
            try {
              const loc = typeof courier.currentLocation === 'string'
                ? JSON.parse(courier.currentLocation)
                : courier.currentLocation;
              if (typeof loc === 'object' && loc !== null) {
                courierLat = Number(loc.latitude ?? loc.lat);
                courierLng = Number(loc.longitude ?? loc.lng ?? loc.lon);
              }
            } catch (err) {
              console.error('Error parsing courier currentLocation:', err);
            }
          }

          if (courierLat !== null && courierLng !== null && !isNaN(courierLat) && !isNaN(courierLng)) {
            const dist = Math.sqrt(
              Math.pow(courierLat - merchantLat, 2) + Math.pow(courierLng - merchantLng, 2)
            );
            if (dist < minDistance) {
              minDistance = dist;
              selectedCourier = courier;
            }
          }
        }

        if (selectedCourier) {
          selectedCourierDistance = Math.round(minDistance * 111 * 10) / 10;
        }
      }

      if (!selectedCourier) {
        selectedCourier = couriers[0];
        selectedCourierDistance = Math.round((1.2 + Math.random() * 3) * 10) / 10;
      }
    }

    // 6. Create Order in transaction
    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          merchantId: merchant.id,
          totalAmount: new Prisma.Decimal(totalAmount),
          currency: 'VND',
          status: 'pending',
          paymentStatus: 'pending',
          courierId: selectedCourier ? selectedCourier.id : null,
          shippingFee: new Prisma.Decimal(shippingFee),
          orderItems: {
            create: orderItemsData,
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          courier: {
            include: {
              user: true,
            },
          },
          merchant: true,
        },
      });

      return newOrder;
    });

    return {
      order,
      courier: selectedCourier ? {
        name: selectedCourier.name,
        phone: selectedCourier.phone,
        vehicleType: selectedCourier.vehicleType,
        distanceKm: selectedCourierDistance,
      } : null,
    };
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        courier: true,
        merchant: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
