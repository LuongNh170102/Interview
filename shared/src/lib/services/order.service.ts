import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AddCartItemRequest,
  CartResponse,
  CreateOrderRequest,
  OrderListResponse,
  OrderManageQueryParams,
  OrderResponse,
} from '../interfaces/order.interface';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);

  getCart(merchantId: string): Observable<CartResponse> {
    return this.http.get<CartResponse>('/api/cart', {
      params: new HttpParams().set('merchantId', merchantId),
      withCredentials: true,
    });
  }

  addCartItem(payload: AddCartItemRequest): Observable<CartResponse> {
    return this.http.post<CartResponse>('/api/cart/items', payload, {
      withCredentials: true,
    });
  }

  updateCartItem(
    merchantId: string,
    productId: string,
    quantity: number
  ): Observable<CartResponse> {
    return this.http.patch<CartResponse>(`/api/cart/items/${productId}`, {
      quantity,
    }, {
      params: new HttpParams().set('merchantId', merchantId),
      withCredentials: true,
    });
  }

  removeCartItem(
    merchantId: string,
    productId: string
  ): Observable<CartResponse> {
    return this.http.delete<CartResponse>(`/api/cart/items/${productId}`, {
      params: new HttpParams().set('merchantId', merchantId),
      withCredentials: true,
    });
  }

  clearCart(merchantId: string): Observable<CartResponse> {
    return this.http.delete<CartResponse>('/api/cart', {
      params: new HttpParams().set('merchantId', merchantId),
      withCredentials: true,
    });
  }

  createOrder(payload: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>('/api/orders', payload, {
      withCredentials: true,
    });
  }

  findUserOrders(): Observable<OrderResponse[]> {
    return this.http.get<OrderResponse[]>('/api/orders', {
      withCredentials: true,
    });
  }

  findManageOrders(
    params: OrderManageQueryParams = {}
  ): Observable<OrderListResponse> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.merchantId) {
      httpParams = httpParams.set('merchantId', params.merchantId);
    }
    return this.http.get<OrderListResponse>('/api/orders/manage/list', {
      params: httpParams,
      withCredentials: true,
    });
  }

  findOne(externalId: string): Observable<OrderResponse> {
    return this.http.get<OrderResponse>(`/api/orders/${externalId}`, {
      withCredentials: true,
    });
  }
}
