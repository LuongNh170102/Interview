import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { COURIER_APPROVAL_STATUS, COURIER_ONLINE_STATUS } from '../common/constants/courier.constant';
import { Prisma } from '@prisma/client';

export const ORDER_MESSAGES = {
  MERCHANT_NOT_FOUND: 'Merchant not found',
  MERCHANT_NOT_ACTIVE: 'This merchant is currently not accepting orders',
  PRODUCT_NOT_FOUND: (id: string) => `Product not found: ${id}`,
  PRODUCT_NOT_AVAILABLE: (name: string) => `Product "${name}" is not available`,
  INSUFFICIENT_STOCK: (name: string) => `Insufficient stock for "${name}"`,
  NO_COURIER_AVAILABLE:
    'No available courier at the moment. Please try again shortly.',
  ORDER_NOT_FOUND: 'Order not found',
};

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // CREATE ORDER
  // ---------------------------------------------------------------------------

  /**
   * POST /orders
   * Flow:
   * 1. Validate merchant exists and is APPROVED
   * 2. Resolve product internal IDs and validate availability (PUBLISHED + stock)
   * 3. Calculate totals
   * 4. Select an APPROVED + ONLINE courier (nearest based on lat/lng or fallback to any)
   * 5. Create Order + OrderItems in a single transaction
   */
  async create(userId: number, dto: CreateOrderDto) {
    // ── Step 1: Resolve merchant ──────────────────────────────────────────────
    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId: dto.merchantId },
      select: { id: true, approvalStatus: true, name: true, city: true },
    });

    if (!merchant) {
      throw new NotFoundException(ORDER_MESSAGES.MERCHANT_NOT_FOUND);
    }

    if (merchant.approvalStatus !== 'APPROVED') {
      throw new UnprocessableEntityException(ORDER_MESSAGES.MERCHANT_NOT_ACTIVE);
    }

    // ── Step 2: Resolve products and validate ────────────────────────────────
    const resolvedItems: {
      productId: number;
      variantId?: number;
      quantity: number;
      unitPrice: Prisma.Decimal;
      name: unknown;
    }[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { externalId: item.productId },
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          status: true,
          merchantId: true,
        },
      });

      if (!product) {
        throw new NotFoundException(ORDER_MESSAGES.PRODUCT_NOT_FOUND(item.productId));
      }

      // must be PUBLISHED
      if ((product.status as unknown as string) !== 'PUBLISHED') {
        throw new UnprocessableEntityException(
          ORDER_MESSAGES.PRODUCT_NOT_AVAILABLE(JSON.stringify(product.name)),
        );
      }

      // must belong to the same merchant
      if (product.merchantId !== merchant.id) {
        throw new BadRequestException(
          `Product ${item.productId} does not belong to this merchant`,
        );
      }

      // stock check
      if (product.stock !== null && product.stock < item.quantity) {
        throw new UnprocessableEntityException(
          ORDER_MESSAGES.INSUFFICIENT_STOCK(JSON.stringify(product.name)),
        );
      }

      resolvedItems.push({
        productId: product.id,
        quantity: item.quantity,
        unitPrice: product.price ?? new Prisma.Decimal(0),
        name: product.name,
      });
    }

    // ── Step 3: Calculate total ───────────────────────────────────────────────
    const subtotal = resolvedItems.reduce(
      (sum, i) => sum + i.unitPrice.toNumber() * i.quantity,
      0,
    );

    // ── Step 4: Select courier (APPROVED + ONLINE) ────────────────────────────
    /**
     * Strategy: nearest-first using Haversine distance approximation.
     * Since currentLocation is stored as JSON { lat, lng }, we filter by
     * APPROVED + ONLINE in Prisma and then sort in application memory.
     *
     * NOTE: In a production system with thousands of couriers, this would use
     * a PostGIS spatial extension or a Redis geospatial index. For this
     * assignment, the application-layer sort is sufficient to demonstrate the logic.
     */
    const availableCouriers = await this.prisma.courier.findMany({
      where: {
        approvalStatus: COURIER_APPROVAL_STATUS.APPROVED as any,
        onlineStatus: COURIER_ONLINE_STATUS.ONLINE,
        deletedAt: null,
      },
      select: { id: true, currentLocation: true, name: true },
    });

    if (availableCouriers.length === 0) {
      throw new UnprocessableEntityException(ORDER_MESSAGES.NO_COURIER_AVAILABLE);
    }

    // Sort by Haversine distance from delivery address
    const { lat: destLat, lng: destLng } = dto.deliveryAddress;
    const withDistance = availableCouriers.map((c) => {
      const loc = c.currentLocation as { lat?: number; lng?: number } | null;
      const dist =
        loc?.lat != null && loc?.lng != null
          ? this.haversineDistance(loc.lat, loc.lng, destLat, destLng)
          : Infinity; // no location = sort last
      return { ...c, dist };
    });

    withDistance.sort((a, b) => a.dist - b.dist);
    const selectedCourier = withDistance[0];

    // ── Step 5: Persist in a transaction ─────────────────────────────────────
    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId,
          merchantId: merchant.id,
          courierId: selectedCourier.id,
          totalAmount: subtotal,
          currency: 'VND',
          status: 'PENDING' as any,
          paymentStatus: 'pending',
          deliveryAddress: dto.deliveryAddress as unknown as Prisma.InputJsonValue,
          notes: dto.notes,
          orderItems: {
            create: resolvedItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.unitPrice,
              total: new Prisma.Decimal(item.unitPrice.toNumber() * item.quantity),
            })),
          },
        },
        include: {
          orderItems: true,
        },
      });

      // Decrement stock for each product
      for (const item of resolvedItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    return {
      externalId: order.externalId,
      status: order.status,
      totalAmount: order.totalAmount,
      courierId: selectedCourier.name,
      itemCount: order.orderItems.length,
      message: 'Order placed successfully',
    };
  }

  // ---------------------------------------------------------------------------
  // LIST — customer's own orders
  // ---------------------------------------------------------------------------

  async findMyOrders(
    userId: number,
    paginationDto: PaginationDto,
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          externalId: true,
          status: true,
          totalAmount: true,
          currency: true,
          createdAt: true,
          merchant: { select: { name: true, externalId: true } },
          orderItems: {
            select: {
              quantity: true,
              price: true,
              product: { select: { name: true, externalId: true } },
            },
          },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);

    return {
      data,
      meta: { total, page, limit, lastPage: Math.ceil(total / limit) },
    };
  }

  // ---------------------------------------------------------------------------
  // SINGLE ORDER DETAIL
  // ---------------------------------------------------------------------------

  async findOne(userId: number, externalId: string) {
    const order = await this.prisma.order.findUnique({
      where: { externalId },
      include: {
        merchant: { select: { name: true, externalId: true, logoUrl: true } },
        courier: { select: { name: true, phone: true, vehicleType: true } },
        orderItems: {
          include: {
            product: { select: { name: true, externalId: true, images: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(ORDER_MESSAGES.ORDER_NOT_FOUND);
    }

    // Ensure the customer can only see their own orders
    if (order.userId !== userId) {
      throw new NotFoundException(ORDER_MESSAGES.ORDER_NOT_FOUND);
    }

    return order;
  }

  // ---------------------------------------------------------------------------
  // HAVERSINE distance formula (km)
  // ---------------------------------------------------------------------------

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
