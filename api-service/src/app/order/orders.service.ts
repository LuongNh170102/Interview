import {
    Injectable,
    UnauthorizedException,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
    OrderQueryDto,
    OrderStatistics,
    OrderListResponse,
} from './dto/order-query.dto';
import {
    COURIER_STATUS,
    COURIER_REGISTRATION_OTP,
    COURIER_ACTIVE_STATUS,
} from '../common/constants/courier.constant';
import { AUTH_MESSAGES, COMMON_MESSAGES, COURIER_MESSAGES, ORDER_MESSAGES, PRODUCT_MESSAGES } from '../common/constants/messages.constant';
import { OrderEntity } from './entities/orders.entity';
import { OrderQueryBuilder } from './builders/order-query.builder';
import { ApprovalStatus, Prisma } from '@prisma/client';
import { AuthenticatedRequest } from '../common/interfaces/auth.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { PRODUCT_STATUS } from '../common/constants/product.constant';
import { instanceToPlain } from 'class-transformer';
import { CourierEntity } from '../courier/entities';

@Injectable()
export class OrderService {
    constructor(
        private prisma: PrismaService,
    ) { }

    async findAll(
        query: OrderQueryDto
    ): Promise<OrderListResponse<OrderEntity>> {
        const take = query.limit ?? 10;
        const skip = query.skip;

        const where = new OrderQueryBuilder()
            .withStatus(query.status)
            .withPaymentStatus(query.paymentStatus)
            .withDateRange(query.startDate, query.endDate)
            .withUser(query.userId)
            .withMerchant(query.merchantId)
            .build();

        const [items, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({
                include: { merchant: true, courier: true },
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.order.count({ where }),
        ]);

        const response: OrderListResponse<OrderEntity> = {
            data: items.map((item) => new OrderEntity(item, {
                merchant: item.merchant,
                courier: item.courier
            })),
            total,
            page: query.page ?? 1,
            limit: take,
        };

        if (query.shouldIncludeStatistics) {
            response.statistics = await this.getStatistics();
        }

        return response;
    }

    private async getStatistics(): Promise<OrderStatistics> {
        const [totalCompleted, totalPending, totalCancelled] =
            await this.prisma.$transaction([
                this.prisma.order.count({
                    where: { status: 'completed' },
                }),
                this.prisma.order.count({
                    where: { status: 'pending' },
                }),
                this.prisma.order.count({
                    where: { status: 'cancelled' },
                })
            ]);

        return { totalCompleted, totalPending, totalCancelled };
    }

    async findByExternalId(externalId: string): Promise<OrderEntity> {
        const order = await this.prisma.order.findUnique({
            where: { externalId },
        });

        if (!order) {
            throw new NotFoundException(COURIER_MESSAGES.NOT_FOUND);
        }

        return new OrderEntity(order);
    }

    async findNearestCourier(lng: number, lat: number): Promise<CourierEntity[]> {
        const nearestCouriers = await this.prisma.$queryRawUnsafe(`
            SELECT *, 
                ST_Distance(
                    location,
                    ST_SetSRID(ST_MakePoint($1, $2), 4326)
                ) AS distance
            FROM couriers
            WHERE approval_status = 'APPROVED'
                AND active_status = 'AVAILABLE'
                AND deleted_at IS NULL
            ORDER BY location <-> ST_SetSRID(ST_MakePoint($1, $2), 4326)
            LIMIT 1
        `, lng, lat);
        return nearestCouriers as CourierEntity[]
    }

    async create(userId: number, dto: CreateOrderDto) {

        const { products, merchantId, deliveryAddress } = dto;

        const order = await this.prisma.$transaction(async (tx) => {

            const ids = products.map((p) => p.productId);
            if (ids.length !== new Set(ids).size) {
                throw new BadRequestException(ORDER_MESSAGES.NO_DUPLICATE_ALLOWED);
            }

            const dbProducts = await tx.product.findMany({
                where: {
                    id: { in: ids },
                    merchantId,
                    status: PRODUCT_STATUS.PUBLISHED
                }
            });

            if (dbProducts.length !== products.length) {
                throw new BadRequestException(ORDER_MESSAGES.INVALID_PRODUCT);
            }

            const productMap = new Map(dbProducts.map((p) => [p.id, p]));

            // calculate total 
            let totalAmount = new Prisma.Decimal(0);

            const orderItems = await Promise.all(products.map(async (item) => {
                const product = productMap.get(item.productId);

                if (!product) {
                    throw new BadRequestException(PRODUCT_MESSAGES.PRODUCT_NOT_FOUND);
                }

                const quantity = item.quantity;

                if (product.stock! < quantity) {
                    throw new BadRequestException(ORDER_MESSAGES.NO_STOCK);
                }

                await tx.product.update({
                    where: { id: product.id },
                    data: {
                        stock: { decrement: quantity },
                    },
                });

                const price = new Prisma.Decimal(product.price ?? 0);

                const total = price.mul(quantity);

                totalAmount = totalAmount.add(total);

                return {
                    productId: product.id,
                    quantity,
                    price,
                    total,
                };
            }))

            const order = await tx.order.create({
                data: {
                    userId,
                    merchantId,
                    totalAmount,
                    currency: 'VND',
                    status: 'pending',
                    paymentStatus: 'pending',
                    ...(deliveryAddress && { deliveryAddress: instanceToPlain(deliveryAddress) }),
                    deliveryLat: deliveryAddress?.latitude,
                    deliveryLng: deliveryAddress?.longitude,
                },
            });

            await tx.orderItem.createMany({
                data: orderItems.map((item) => ({
                    ...item,
                    orderId: order.id,
                })),
            });

            return order;
        });

        if (order.deliveryLat && order.deliveryLng) {
            const [courier] = await this.findNearestCourier(order.deliveryLat, order.deliveryLng);
            if (courier) {
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: { courierId: courier.id },
                })
            }
        }
        return order
    }
}