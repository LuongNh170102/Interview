import { BaseEntity } from '../../common/entities/base.entity';
import { Order, OrderItem, Product, Courier } from '@prisma/client';

export interface OrderItemRelations {
  product?: Partial<Product> | null;
}

export class OrderItemEntity {
  productId: string;
  productName: unknown;
  quantity: number;
  price: number;
  total: number;

  constructor(
    partial: Partial<OrderItem>,
    relations?: OrderItemRelations & { productExternalId?: string }
  ) {
    this.productId = relations?.productExternalId ?? '';
    this.productName = relations?.product?.name ?? '';
    this.quantity = Number(partial.quantity ?? 0);
    this.price = Number(partial.price ?? 0);
    this.total = Number(partial.total ?? 0);
  }
}

export interface OrderRelations {
  courier?: Partial<Courier> | null;
  items?: Array<
    Partial<OrderItem> & {
      product?: Partial<Product> | null;
      externalProductId?: string;
    }
  >;
}

export class OrderEntity extends BaseEntity {
  externalId: string;
  totalAmount: number;
  currency: string | null;
  status: string | null;
  paymentStatus: string | null;
  deliveryAddress: unknown;
  createdAt: Date;
  updatedAt: Date | null;
  courierExternalId: string | null;
  items: OrderItemEntity[];

  constructor(partial: Partial<Order>, relations?: OrderRelations) {
    super(partial);
    Object.assign(this, partial);

    this.totalAmount = Number(partial.totalAmount ?? 0);
    this.courierExternalId = relations?.courier?.externalId ?? null;
    this.items = (relations?.items ?? []).map(
      (item) =>
        new OrderItemEntity(item, {
          product: item.product,
          productExternalId: item.externalProductId,
        })
    );
  }
}
