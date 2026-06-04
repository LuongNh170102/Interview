export interface CreateOrderItemRequest {
  productId: string;
  quantity: number;
}

export interface CustomerLocationRequest {
  latitude: number;
  longitude: number;
}

export interface DeliveryAddressRequest {
  fullName: string;
  phone: string;
  addressLine: string;
  note?: string;
  [key: string]: unknown;
}

export interface CreateOrderRequest {
  merchantId: string;
  items: CreateOrderItemRequest[];
  deliveryAddress?: DeliveryAddressRequest;
  customerLocation?: CustomerLocationRequest;
}

export interface OrderUserSummary {
  id: number;
  externalId?: string;
  email?: string | null;
  username?: string | null;
  phone?: string | null;
}

export interface OrderMerchantSummary {
  id: number;
  externalId: string;
  name?: string | Record<string, string> | null;
  phone?: string | null;
}

export interface OrderCourierSummary {
  id: number;
  externalId?: string;
  name?: string | null;
  phone?: string | null;
  status?: string | null;
}

export interface OrderProductSummary {
  id: number;
  externalId: string;
  name?: string | Record<string, string> | null;
  sku?: string | null;
}

export interface OrderItemResponse {
  productId: number;
  quantity: number;
  price: string | number;
  total: string | number;
  product?: OrderProductSummary;
}

export interface OrderResponse {
  id: number;
  externalId?: string;
  user?: OrderUserSummary;
  merchant?: OrderMerchantSummary;
  courier?: OrderCourierSummary | null;
  totalAmount: string | number;
  currency?: string | null;
  status: string;
  paymentStatus: string;
  deliveryAddress?: DeliveryAddressRequest | null;
  createdAt?: string | Date;
  orderItems?: OrderItemResponse[];
}

export interface OrderListResponse {
  data: OrderResponse[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
}
