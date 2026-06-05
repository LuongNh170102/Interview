import { ProductResponse } from './product.interface';

export interface DeliveryAddress {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  phone?: string;
}

export interface CartItemResponse {
  id: number;
  productId: number;
  quantity: number | null;
  price: string | number | null;
  total: string | number | null;
  product: ProductResponse;
}

export interface CartResponse {
  id?: number;
  totalAmount?: string | number | null;
  cartItems: CartItemResponse[];
  merchant?: { externalId: string; name?: string | null };
}

export interface AddCartItemRequest {
  productId: string;
  merchantId: string;
  quantity: number;
}

export interface CreateOrderRequest {
  merchantId: string;
  deliveryAddress: DeliveryAddress;
}

export interface OrderItemResponse {
  id: number;
  productId: number;
  quantity: number | null;
  price: string | number | null;
  total: string | number | null;
  product: ProductResponse;
}

export interface OrderListMeta {
  total: number;
  page: number;
  lastPage: number;
  limit: number;
}

export interface OrderListResponse {
  data: OrderResponse[];
  meta: OrderListMeta;
}

export interface OrderManageQueryParams {
  page?: number;
  limit?: number;
  merchantId?: string;
}

export interface OrderResponse {
  id: number;
  externalId: string;
  totalAmount: string | number | null;
  status: string | null;
  paymentStatus: string | null;
  deliveryAddress: DeliveryAddress | null;
  createdAt: string;
  orderItems: OrderItemResponse[];
  courier?: { externalId: string; name?: string | null; phone?: string | null };
  merchant?: { externalId: string; name?: string | null };
}
