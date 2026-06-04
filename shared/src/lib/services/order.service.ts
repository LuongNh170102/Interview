import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateOrderRequest,
  OrderListResponse,
  OrderQueryParams,
  OrderResponse,
} from '../interfaces/order.interface';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/orders';

  findAll(params: OrderQueryParams = {}): Observable<OrderListResponse> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<OrderListResponse>(this.baseUrl, {
      params: httpParams,
      withCredentials: true,
    });
  }

  create(payload: CreateOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(this.baseUrl, payload, {
      withCredentials: true,
    });
  }
}
