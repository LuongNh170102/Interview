import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ApprovalStatus, OperationalStatus, Prisma } from '@prisma/client';
import { COURIER_AVAILABILITY_STATUS } from '../common/constants/courier.constant';
import { MERCHANT_STATUS } from '../common/constants/merchant.constant';
import { PaginationDto } from '../common/dto/pagination.dto';
import { PaginatedResult } from '../common/interfaces/paginated-result.interface';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

type GeoPoint = { latitude: number; longitude: number };
type AuthUser = { userId: number; roles?: string[] };

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    user: AuthUser,
    paginationDto: PaginationDto
  ): Promise<PaginatedResult<any>> {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;
    const where = this.buildOrderVisibilityWhere(user);

    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: true,
          merchant: true,
          courier: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };
  }

  async create(userId: number, dto: CreateOrderDto) {
    const orderItems = this.mergeItemsByProduct(dto.items);
    const merchant = await this.prisma.merchant.findUnique({
      where: { externalId: dto.merchantId },
      select: { id: true, approvalStatus: true, isAcceptingOrders: true },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    if (
      merchant.approvalStatus !== MERCHANT_STATUS.APPROVED ||
      !merchant.isAcceptingOrders
    ) {
      throw new BadRequestException('Merchant is not accepting orders');
    }

    const productIds = orderItems.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        externalId: { in: productIds },
        merchantId: merchant.id,
        isActive: true,
      },
      select: {
        id: true,
        externalId: true,
        price: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Invalid product in order');
    }

    const productMap = new Map(
      products.map((product) => [product.externalId, product])
    );
    const productsWithoutPrice = products.filter((product) => product.price === null);
    if (productsWithoutPrice.length > 0) {
      throw new BadRequestException('Product price is required');
    }

    const totalAmount = orderItems.reduce((total, item) => {
      const product = productMap.get(item.productId);
      return total + Number(product?.price) * item.quantity;
    }, 0);

    const courier = await this.findEligibleCourier(dto.customerLocation);
    if (!courier) {
      throw new BadRequestException('No eligible courier available');
    }

    return this.prisma.order.create({
      data: {
        userId,
        merchantId: merchant.id,
        courierId: courier?.id,
        totalAmount: new Prisma.Decimal(totalAmount),
        status: 'pending',
        paymentStatus: 'pending',
        deliveryAddress:
          (dto.deliveryAddress as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        orderItems: {
          create: orderItems.map((item) => {
            const product = productMap.get(item.productId);
            const price = Number(product?.price);

            return {
              productId: product?.id as number,
              quantity: item.quantity,
              price: new Prisma.Decimal(price),
              total: new Prisma.Decimal(price * item.quantity),
            };
          }),
        },
      },
      include: {
        courier: true,
        orderItems: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  async findEligibleCourier(customerLocation?: GeoPoint) {
    const couriers = await this.prisma.courier.findMany({
      where: {
        approvalStatus: ApprovalStatus.APPROVED,
        operationalStatus: OperationalStatus.ACTIVE,
        status: COURIER_AVAILABILITY_STATUS.ONLINE,
      },
    });

    if (couriers.length === 0) {
      return null;
    }

    if (!customerLocation) {
      return couriers[0];
    }

    const rankedCouriers = couriers
      .map((courier) => ({
        courier,
        distance: this.calculateDistance(
          customerLocation,
          this.parseCourierLocation(courier.currentLocation)
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    const courierWithLocation = rankedCouriers.find((item) =>
      Number.isFinite(item.distance)
    );

    return courierWithLocation?.courier ?? couriers[0];
  }

  private mergeItemsByProduct(items: CreateOrderDto['items']) {
    const itemMap = new Map<string, { productId: string; quantity: number }>();

    for (const item of items) {
      const existing = itemMap.get(item.productId);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        itemMap.set(item.productId, { ...item });
      }
    }

    return Array.from(itemMap.values());
  }

  private parseCourierLocation(location: Prisma.JsonValue): GeoPoint | null {
    if (!location || typeof location !== 'object' || Array.isArray(location)) {
      return null;
    }

    const data = location as Record<string, unknown>;
    const latitude = Number(data['latitude'] ?? data['lat']);
    const longitude = Number(data['longitude'] ?? data['lng']);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  }

  private calculateDistance(from: GeoPoint, to: GeoPoint | null): number {
    if (!to) {
      return Number.POSITIVE_INFINITY;
    }

    const radiusKm = 6371;
    const latDelta = this.toRadians(to.latitude - from.latitude);
    const lngDelta = this.toRadians(to.longitude - from.longitude);
    const startLat = this.toRadians(from.latitude);
    const endLat = this.toRadians(to.latitude);

    const haversine =
      Math.sin(latDelta / 2) ** 2 +
      Math.cos(startLat) * Math.cos(endLat) * Math.sin(lngDelta / 2) ** 2;

    return 2 * radiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private buildOrderVisibilityWhere(user: AuthUser): Prisma.OrderWhereInput {
    if (user.roles?.includes('PLATFORM_ADMIN')) {
      return {};
    }

    return {
      merchant: {
        userRoles: {
          some: {
            userId: user.userId,
            role: {
              name: 'MERCHANT_OWNER',
            },
          },
        },
      },
    };
  }
}
