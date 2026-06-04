import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProductListResponse,
  ProductQueryParams,
  ProductResponse,
  UpdateProductRequest,
} from '../interfaces/product.interface';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/products';

  findPublic(params: ProductQueryParams = {}): Observable<ProductListResponse> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ProductListResponse>(this.baseUrl, {
      params: httpParams,
    });
  }

  findByMerchant(
    merchantExternalId: string,
    params: ProductQueryParams = {}
  ): Observable<ProductListResponse> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }

    return this.http.get<ProductListResponse>(
      `${this.baseUrl}/merchant/${merchantExternalId}`,
      {
        params: httpParams,
        withCredentials: true,
      }
    );
  }

  findOne(productExternalId: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/${productExternalId}`);
  }

  create(
    merchantExternalId: string,
    payload: FormData
  ): Observable<ProductResponse> {
    return this.http.post<ProductResponse>(this.baseUrl, payload, {
      params: new HttpParams().set('merchantId', merchantExternalId),
      withCredentials: true,
    });
  }

  update(
    productExternalId: string,
    payload: UpdateProductRequest
  ): Observable<ProductResponse> {
    return this.http.patch<ProductResponse>(
      `${this.baseUrl}/${productExternalId}`,
      payload,
      { withCredentials: true }
    );
  }

  delete(productExternalId: string): Observable<ProductResponse> {
    return this.http.delete<ProductResponse>(`${this.baseUrl}/${productExternalId}`, {
      withCredentials: true,
    });
  }
}
