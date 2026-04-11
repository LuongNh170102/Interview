import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ProductListResponse,
  ProductQueryParams,
  ProductResponse,
  CreateProductRequest,
  UpdateProductRequest,
} from '../interfaces/product.interface';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/products';

  /**
   * Get paginated list of products with optional filters
   */
  findAll(params: ProductQueryParams = {}): Observable<ProductListResponse> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.merchantId) {
      httpParams = httpParams.set('merchantId', params.merchantId);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }

    return this.http.get<ProductListResponse>(this.baseUrl, {
      params: httpParams,
      withCredentials: true,
    });
  }

  /**
   * Get products by merchant (for Merchant Owner)
   */
  findAllByMerchant(
    merchantId: string,
    params: ProductQueryParams = {}
  ): Observable<ProductListResponse> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit !== undefined) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<ProductListResponse>(
      `${this.baseUrl}/merchant/${merchantId}`,
      {
        params: httpParams,
        withCredentials: true,
      }
    );
  }

  /**
   * Get single product by external ID
   */
  findByExternalId(externalId: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }

  /**
   * Create new product (Merchant Owner only)
   */
  create(dto: CreateProductRequest): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.baseUrl, dto, {
      withCredentials: true,
    });
  }

  /**
   * Update existing product
   */
  update(
    externalId: string,
    dto: UpdateProductRequest
  ): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(
      `${this.baseUrl}/${externalId}`,
      dto,
      {
        withCredentials: true,
      }
    );
  }

  /**
   * Delete product
   */
  delete(externalId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }
}
