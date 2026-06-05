import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApprovalStatus,
  CourierAvailabilityStatus,
  OperationalStatus,
  Prisma,
  ProductStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  ORDER_MESSAGES,
  PRODUCT_MESSAGES,
  COMMON_MESSAGES,
} from '../common/constants/messages.constant';
import {
  ORDER_STATUS,
  PAYMENT_STATUS,
} from '../common/constants/order.constant';
import { haversineDistanceKm } from '../common/utils/geo.util';
import { serializeCart, serializeOrder } from '../common/utils/decimal.util';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import {
  getAccessibleMerchantIds,
  resolveMerchantId,
} from '../common/utils/merchant-access.util';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: number, merchantExternalId: string) {
    const merchant = await this.findMerchant(merchantExternalId);
    const cart = await this.prisma.cart.findFirst({
      where: { userId, merchantId: merchant.id },
      include: {
        cartItems: {
          include: {
            product: true,
          },
        },
        merchant: {
          select: { externalId: true, name: true },
        },
      },
    });
    if (!cart) {
      return { cartItems: [], merchant, totalAmount: 0 };
    }
    return serializeCart(cart);
  }

  async addCartItem(userId: number, dto: AddCartItemDto) {
    const merchant = await this.findMerchant(dto.merchantId);
    const product = await this.prisma.product.findFirst({
      where: {
        externalId: dto.productId,
        merchantId: merchant.id,
        publishStatus: ProductStatus.PUBLISHED,
      },
    });
    if (!product) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    let cart = await this.prisma.cart.findFirst({
      where: { userId, merchantId: merchant.id },
    });
    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, merchantId: merchant.id, totalAmount: 0 },
      });
    }

    const unitPrice = product.price ?? new Prisma.Decimal(0);
    const lineTotal = unitPrice.mul(dto.quantity);

    const existingItem = await this.prisma.cartItem.findFirst({
      where: { cartId: cart.id, productId: product.id },
    });

    if (existingItem) {
      const newQty = (existingItem.quantity ?? 0) + dto.quantity;
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
          price: unitPrice,
          total: unitPrice.mul(newQty),
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: product.id,
          quantity: dto.quantity,
          price: unitPrice,
          total: lineTotal,
        },
      });
    }

    await this.recalculateCartTotal(cart.id);
    return this.getCart(userId, dto.merchantId);
  }

  async updateCartItem(
    userId: number,
    merchantExternalId: string,
    productExternalId: string,
    quantity: number
  ) {
    const cart = await this.getCartWithItems(userId, merchantExternalId);
    const item = cart.cartItems.find(
      (i) => i.product.externalId === productExternalId
    );
    if (!item) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    const unitPrice = item.price ?? new Prisma.Decimal(0);
    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: {
        quantity,
        total: unitPrice.mul(quantity),
      },
    });

    await this.recalculateCartTotal(cart.id);
    return this.getCart(userId, merchantExternalId);
  }

  async removeCartItem(
    userId: number,
    merchantExternalId: string,
    productExternalId: string
  ) {
    const cart = await this.getCartWithItems(userId, merchantExternalId);
    const item = cart.cartItems.find(
      (i) => i.product.externalId === productExternalId
    );
    if (!item) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    await this.prisma.cartItem.delete({ where: { id: item.id } });
    await this.recalculateCartTotal(cart.id);
    return this.getCart(userId, merchantExternalId);
  }

  async clearCart(userId: number, merchantExternalId: string) {
    const cart = await this.getCartWithItems(userId, merchantExternalId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.recalculateCartTotal(cart.id);
    return this.getCart(userId, merchantExternalId);
  }

  async createOrder(userId: number, dto: CreateOrderDto) {
    const { latitude, longitude } = dto.deliveryAddress;
    if (latitude == null || longitude == null) {
      throw new BadRequestException(ORDER_MESSAGES.INVALID_DELIVERY_ADDRESS);
    }

    const cart = await this.getCartWithItems(userId, dto.merchantId);
    if (!cart.cartItems.length) {
      throw new BadRequestException(ORDER_MESSAGES.CART_EMPTY);
    }

    for (const item of cart.cartItems) {
      if (item.product.publishStatus !== ProductStatus.PUBLISHED) {
        throw new BadRequestException(ORDER_MESSAGES.PRODUCT_UNAVAILABLE);
      }
    }

    const courier = await this.findNearestEligibleCourier(latitude, longitude);
    if (!courier) {
      throw new BadRequestException(ORDER_MESSAGES.NO_COURIER_AVAILABLE);
    }

    const totalAmount = cart.cartItems.reduce(
      (sum, item) => sum.add(item.total ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0)
    );

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          merchantId: cart.merchantId,
          totalAmount,
          status: ORDER_STATUS.PENDING,
          paymentStatus: PAYMENT_STATUS.PENDING,
          deliveryAddress: dto.deliveryAddress as unknown as Prisma.InputJsonValue,
          courierId: courier.id,
          orderItems: {
            create: cart.cartItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              total: item.total,
            })),
          },
        },
        include: {
          orderItems: { include: { product: true } },
          courier: { select: { externalId: true, name: true, phone: true } },
          merchant: { select: { externalId: true, name: true } },
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      await tx.cart.update({
        where: { id: cart.id },
        data: { totalAmount: 0 },
      });

      await tx.courier.update({
        where: { id: courier.id },
        data: { availabilityStatus: CourierAvailabilityStatus.BUSY },
      });

      return created;
    });

    return serializeOrder(order);
  }

  async findUserOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: { include: { product: true } },
        courier: { select: { externalId: true, name: true } },
        merchant: { select: { externalId: true, name: true } },
      },
    });
    return orders.map(serializeOrder);
  }

  async findAllForManagement(
    userId: number,
    query: PaginationDto & { merchantId?: string }
  ): Promise<PaginatedResult<unknown>> {
    const { page = 1, limit = 10, merchantId } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {};

    const accessible = await getAccessibleMerchantIds(this.prisma, userId);
    if (accessible !== 'all') {
      if (!accessible.length) {
        return {
          data: [],
          meta: { total: 0, page, lastPage: 0, limit },
        };
      }
      where.merchantId = { in: accessible };
    }

    if (merchantId) {
      const merchantInternalId = await resolveMerchantId(
        this.prisma,
        merchantId
      );
      if (!merchantInternalId) {
        throw new NotFoundException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
      }
      if (
        accessible !== 'all' &&
        !accessible.includes(merchantInternalId)
      ) {
        throw new NotFoundException(ORDER_MESSAGES.ORDER_NOT_FOUND);
      }
      where.merchantId = merchantInternalId;
    }

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          orderItems: { include: { product: true } },
          courier: { select: { externalId: true, name: true, phone: true } },
          merchant: { select: { externalId: true, name: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: data.map(serializeOrder),
      meta: { total, page, lastPage: Math.ceil(total / limit), limit },
    };
  }

  async findOrderByExternalId(userId: number, externalId: string) {
    const order = await this.prisma.order.findFirst({
      where: { externalId, userId },
      include: {
        orderItems: { include: { product: true } },
        courier: { select: { externalId: true, name: true, phone: true } },
        merchant: { select: { externalId: true, name: true } },
      },
    });
    if (!order) {
      throw new NotFoundException(ORDER_MESSAGES.ORDER_NOT_FOUND);
    }
    return serializeOrder(order);
  }

  async findNearestEligibleCourier(latitude: number, longitude: number) {
    try {
      const rows = await this.prisma.$queryRaw<Array<{ id: number }>>`
        SELECT c.id
        FROM couriers c
        WHERE c.deleted_at IS NULL
          AND c.approval_status = 'APPROVED'
          AND c.operational_status = 'ACTIVE'
          AND c.availability_status = 'ONLINE'
          AND c.latitude IS NOT NULL
          AND c.longitude IS NOT NULL
        ORDER BY ST_Distance(
          ST_SetSRID(ST_MakePoint(c.longitude, c.latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        ) ASC
        LIMIT 1
      `;

      if (rows[0]?.id) {
        return this.prisma.courier.findUnique({ where: { id: rows[0].id } });
      }
    } catch {
      // Fall back to in-memory Haversine when PostGIS is unavailable.
    }

    const couriers = await this.prisma.courier.findMany({
      where: {
        deletedAt: null,
        approvalStatus: ApprovalStatus.APPROVED,
        operationalStatus: OperationalStatus.ACTIVE,
        availabilityStatus: CourierAvailabilityStatus.ONLINE,
        latitude: { not: null },
        longitude: { not: null },
      },
    });

    let nearest: (typeof couriers)[number] | null = null;
    let minDistance = Infinity;

    for (const courier of couriers) {
      const distance = haversineDistanceKm(
        latitude,
        longitude,
        courier.latitude!,
        courier.longitude!
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = courier;
      }
    }

    return nearest;
  }

  private async findMerchant(externalId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId },
    });
    if (!merchant) {
      throw new NotFoundException(COMMON_MESSAGES.INVALID_MERCHANT_ID);
    }
    return merchant;
  }

  private async getCartWithItems(userId: number, merchantExternalId: string) {
    const merchant = await this.findMerchant(merchantExternalId);
    const cart = await this.prisma.cart.findFirst({
      where: { userId, merchantId: merchant.id },
      include: {
        cartItems: { include: { product: true } },
      },
    });
    if (!cart) {
      throw new BadRequestException(ORDER_MESSAGES.CART_EMPTY);
    }
    return cart;
  }

  private async recalculateCartTotal(cartId: number) {
    const items = await this.prisma.cartItem.findMany({ where: { cartId } });
    const total = items.reduce(
      (sum, item) => sum.add(item.total ?? new Prisma.Decimal(0)),
      new Prisma.Decimal(0)
    );
    await this.prisma.cart.update({
      where: { id: cartId },
      data: { totalAmount: total },
    });
  }
}
