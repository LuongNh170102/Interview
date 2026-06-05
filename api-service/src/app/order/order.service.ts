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
} from '@prisma/client';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEntity } from './entities/order.entity';
import { ORDER_MESSAGES } from '../common/constants/messages.constant';
import {
  COURIER_APPROVAL_STATUS,
  COURIER_AVAILABILITY_STATUS,
  COURIER_OPERATIONAL_STATUS,
} from '../common/constants/courier.constant';
import { PRODUCT_MESSAGES } from '../common/constants/messages.constant';

const publicProductInclude = Prisma.validator<Prisma.ProductInclude>()({
  merchant: {
    select: {
      id: true,
      approvalStatus: true,
      latitude: true,
      longitude: true,
    },
  },
});

type ProductForOrder = Prisma.ProductGetPayload<{
  include: typeof publicProductInclude;
}>;

type CourierCandidate = {
  id: number;
  currentLocation: Prisma.JsonValue | null;
  updatedAt: Date | null;
  createdAt: Date;
};

type GeoPoint = {
  lat: number;
  lng: number;
};

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: number, dto: CreateOrderDto): Promise<OrderEntity> {
    if (!dto.items.length) {
      throw new BadRequestException(ORDER_MESSAGES.EMPTY_ITEMS);
    }

    const groupedItems = new Map<string, number>();
    for (const item of dto.items) {
      groupedItems.set(
        item.productId,
        (groupedItems.get(item.productId) ?? 0) + item.quantity
      );
    }

    const products = await this.prisma.product.findMany({
      where: {
        externalId: { in: [...groupedItems.keys()] },
      },
      include: publicProductInclude,
    });

    if (products.length !== groupedItems.size) {
      throw new NotFoundException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
    }

    this.ensureProductsAreOrderable(products);

    const [firstProduct] = products;
    const merchantId = firstProduct.merchantId;

    if (products.some((product) => product.merchantId !== merchantId)) {
      throw new BadRequestException(ORDER_MESSAGES.MIXED_MERCHANTS);
    }

    const eligibleCouriers = await this.prisma.courier.findMany({
      where: {
        approvalStatus: COURIER_APPROVAL_STATUS.APPROVED as ApprovalStatus,
        operationalStatus:
          COURIER_OPERATIONAL_STATUS.ACTIVE as OperationalStatus,
        status: COURIER_AVAILABILITY_STATUS.ONLINE as CourierAvailabilityStatus,
      },
      orderBy: [{ updatedAt: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        currentLocation: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    const courier = this.selectCourierForMerchant(
      eligibleCouriers,
      firstProduct.merchant.latitude,
      firstProduct.merchant.longitude
    );

    const lineItems = products.map((product) => {
      const quantity = groupedItems.get(product.externalId) ?? 0;
      const price = Number(product.price ?? 0);
      return {
        productId: product.id,
        productExternalId: product.externalId,
        productName: product.name,
        quantity,
        price,
        total: price * quantity,
      };
    });

    const totalAmount = lineItems.reduce((sum, item) => sum + item.total, 0);

    const order = await this.prisma.order.create({
      data: {
        userId,
        merchantId,
        totalAmount,
        currency: firstProduct.currency ?? 'VND',
        status: courier ? 'confirmed' : 'pending',
        paymentStatus: 'pending',
        deliveryAddress:
          dto.deliveryAddress as unknown as Prisma.InputJsonValue,
        courierId: courier?.id,
        orderItems: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        },
      },
      include: {
        courier: {
          select: {
            externalId: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                externalId: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return new OrderEntity(order, {
      courier: order.courier,
      items: order.orderItems.map((item) => ({
        ...item,
        product: item.product,
        externalProductId: item.product.externalId,
      })),
    });
  }

  private ensureProductsAreOrderable(products: ProductForOrder[]): void {
    const hasUnavailableProduct = products.some(
      (product) =>
        product.status !== 'PUBLISHED' ||
        product.isActive !== true ||
        product.merchant.approvalStatus !== 'APPROVED' ||
        Number(product.stock ?? 0) <= 0
    );

    if (hasUnavailableProduct) {
      throw new BadRequestException(ORDER_MESSAGES.PRODUCT_NOT_AVAILABLE);
    }
  }

  private selectCourierForMerchant(
    couriers: CourierCandidate[],
    merchantLatitude: number | null | undefined,
    merchantLongitude: number | null | undefined
  ): CourierCandidate | null {
    if (!couriers.length) {
      return null;
    }

    const merchantLocation = this.normalizeLocation({
      lat: merchantLatitude,
      lng: merchantLongitude,
    });

    if (!merchantLocation) {
      return couriers[0];
    }

    let nearestCourier: CourierCandidate | null = null;
    let shortestDistance = Number.POSITIVE_INFINITY;

    for (const courier of couriers) {
      const courierLocation = this.parseCourierLocation(
        courier.currentLocation
      );

      if (!courierLocation) {
        continue;
      }

      const distance = this.calculateDistanceInKm(
        merchantLocation,
        courierLocation
      );

      if (distance < shortestDistance) {
        shortestDistance = distance;
        nearestCourier = courier;
      }
    }

    return nearestCourier ?? couriers[0];
  }

  private parseCourierLocation(
    location: Prisma.JsonValue | null
  ): GeoPoint | null {
    if (!location || typeof location !== 'object' || Array.isArray(location)) {
      return null;
    }

    const value = location as Record<string, unknown>;

    return this.normalizeLocation({
      lat: value['lat'],
      lng: value['lng'],
    });
  }

  private normalizeLocation(location: {
    lat: unknown;
    lng: unknown;
  }): GeoPoint | null {
    const lat = this.toFiniteNumber(location.lat);
    const lng = this.toFiniteNumber(location.lng);

    if (lat === null || lng === null) {
      return null;
    }

    return { lat, lng };
  }

  private toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string' && value.trim() !== '') {
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : null;
    }

    return null;
  }

  private calculateDistanceInKm(from: GeoPoint, to: GeoPoint): number {
    const earthRadiusKm = 6371;
    const deltaLat = this.toRadians(to.lat - from.lat);
    const deltaLng = this.toRadians(to.lng - from.lng);
    const fromLat = this.toRadians(from.lat);
    const toLat = this.toRadians(to.lat);

    const haversine =
      Math.sin(deltaLat / 2) ** 2 +
      Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2;

    return (
      2 *
      earthRadiusKm *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
    );
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
