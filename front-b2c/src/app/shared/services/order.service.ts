import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CartService } from './cart.service';

export interface CreateOrderRequest {
  items: {
    productId: string;
    quantity: number;
  }[];
  shippingAddress: string;
  phone: string;
  note?: string;
}

export interface OrderResponse {
  orderId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private cartService = inject(CartService);

  createOrder(dto: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>('/api/orders', dto);
  }

  // Helper để tạo order từ cart
  createOrderFromCart(address: string, phone: string, note?: string) {
    const items = this.cartService.items().map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const request: CreateOrderRequest = {
      items,
      shippingAddress: address,
      phone,
      note,
    };

    return this.createOrder(request);
  }
}
