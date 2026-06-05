export interface OrderItemRequest {
  productId: string;
  quantity: number;
}

export interface DeliveryAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  note?: string;
}

export interface CreateOrderRequest {
  items: OrderItemRequest[];
  deliveryAddress: DeliveryAddress;
}

export interface OrderItemResponse {
  productId: string;
  productName: unknown;
  quantity: number;
  price: number;
  total: number;
}

export interface OrderResponse {
  externalId: string;
  totalAmount: number;
  currency: string | null;
  status: string | null;
  paymentStatus: string | null;
  deliveryAddress: unknown;
  courierExternalId: string | null;
  createdAt: string;
  updatedAt: string | null;
  items: OrderItemResponse[];
}
