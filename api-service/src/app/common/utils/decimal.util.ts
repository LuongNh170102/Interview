import { Prisma } from '@prisma/client';

type DecimalLike = Prisma.Decimal | number | string | null | undefined;

export function toNumber(value: DecimalLike): number {
  if (value == null) return 0;
  return Number(value);
}

export function toNullableNumber(value: DecimalLike): number | null {
  if (value == null) return null;
  return Number(value);
}

export function serializeProduct<T extends { price?: DecimalLike }>(product: T) {
  return {
    ...product,
    price: toNullableNumber(product.price),
  };
}

export function serializeCart<
  T extends {
    totalAmount?: DecimalLike;
    cartItems?: Array<{
      price?: DecimalLike;
      total?: DecimalLike;
      product?: { price?: DecimalLike } | null;
    }>;
  },
>(cart: T) {
  return {
    ...cart,
    totalAmount: toNumber(cart.totalAmount),
    cartItems: (cart.cartItems ?? []).map((item) => ({
      ...item,
      price: toNullableNumber(item.price),
      total: toNullableNumber(item.total),
      product: item.product ? serializeProduct(item.product) : item.product,
    })),
  };
}

export function serializeOrder<
  T extends {
    totalAmount?: DecimalLike;
    orderItems?: Array<{
      price?: DecimalLike;
      total?: DecimalLike;
      product?: { price?: DecimalLike } | null;
    }>;
  },
>(order: T) {
  return {
    ...order,
    totalAmount: toNumber(order.totalAmount),
    orderItems: (order.orderItems ?? []).map((item) => ({
      ...item,
      price: toNullableNumber(item.price),
      total: toNullableNumber(item.total),
      product: item.product ? serializeProduct(item.product) : item.product,
    })),
  };
}
