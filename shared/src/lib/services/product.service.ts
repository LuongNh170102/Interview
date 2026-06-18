import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ProductResponse {
  externalId: string;
  name: any;
  description: any;
  price: number | null;
  currency: string | null;
  sku: string | null;
  stock: number | null;
  isActive: boolean | null;
  metadata: any;
  merchantId: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface ProductListResponse {
  data: ProductResponse[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
    limit: number;
  };
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price?: number;
  sku?: string;
  stock?: number;
  merchantId: string;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  sku?: string;
  stock?: number;
  isActive?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/products';

  findAllByMerchant(merchantId: string, page = 1, limit = 10): Observable<ProductListResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    return this.http.get<ProductListResponse>(`${this.baseUrl}/merchant/${merchantId}`, {
      params,
      withCredentials: true,
    });
  }

  findOne(externalId: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }

  create(merchantId: string, data: CreateProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(`${this.baseUrl}?merchantId=${merchantId}`, data, {
      withCredentials: true,
    });
  }

  update(externalId: string, data: UpdateProductRequest): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(`${this.baseUrl}/${externalId}`, data, {
      withCredentials: true,
    });
  }

  remove(externalId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }
}