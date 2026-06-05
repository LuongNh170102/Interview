import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateOrderRequest,
  OrderResponse,
} from '../interfaces/order.interface';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/orders';

  create(payload: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseUrl, payload, {
      withCredentials: true,
    });
  }
}
