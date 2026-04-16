import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Order, Prisma } from '@prisma/client';

export interface OrderRelations {
  merchant?: Merchant | null;
  courier?: Courier | null;
}

export interface Merchant {
  name: string;
  externalId: string;
  logoUrl: string | null;
}

export interface Courier {
  name: string | null;
  phone: string | null;
  vehicleType: string;
}

export class OrderEntity extends BaseEntity {
  externalId!: string;
  totalAmount!: number;
  currency!: string | null;
  status!: string | null;
  paymentStatus!: string | null;
  deliveryAddress!: any | null;
  shippingFee!: number | null;
  createdAt!: Date;
  updatedAt?: Date | null;
  merchant!: Merchant | null;
  courier!: Courier | null;

  @Exclude()
  userId!: number;

  @Exclude()
  merchantId!: number;

  @Exclude()
  courierId?: number | null;

  @Exclude()
  promotionId?: number | null;

  constructor(partial: Partial<Order>, relations?: OrderRelations) {
    super(partial);
    Object.assign(this, partial);

    this.totalAmount =
      partial.totalAmount instanceof Prisma.Decimal
        ? partial.totalAmount.toNumber()
        : Number(partial.totalAmount ?? 0);

    this.shippingFee =
      partial.shippingFee instanceof Prisma.Decimal
        ? partial.shippingFee.toNumber()
        : partial.shippingFee
          ? Number(partial.shippingFee)
          : null;

    this.merchant = relations?.merchant
      ? {
        name: relations.merchant.name,
        externalId: relations.merchant.externalId,
        logoUrl: relations.merchant.logoUrl,
      }
      : null;

    this.courier = relations?.courier
      ? {
        name: relations.courier.name,
        phone: relations.courier.phone,
        vehicleType: relations.courier.vehicleType,
      }
      : null;
  }
}