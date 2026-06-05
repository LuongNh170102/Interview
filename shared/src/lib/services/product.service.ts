import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateProductRequest,
  ProductListResponse,
  ProductQueryParams,
  ProductResponse,
  PublicProductFilters,
  UpdateProductRequest,
} from '../interfaces/product.interface';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/products';

  findPublic(params: ProductQueryParams = {}): Observable<ProductListResponse> {
    return this.http.get<ProductListResponse>(`${this.baseUrl}/public`, {
      params: this.toParams(params),
    });
  }

  findPublicOne(externalId: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/public/${externalId}`);
  }

  findPublicFilters(): Observable<PublicProductFilters> {
    return this.http.get<PublicProductFilters>(`${this.baseUrl}/public/filters`);
  }

  findAll(params: ProductQueryParams = {}): Observable<ProductListResponse> {
    return this.http.get<ProductListResponse>(this.baseUrl, {
      params: this.toParams(params),
      withCredentials: true,
    });
  }

  findByMerchant(
    merchantId: string,
    params: ProductQueryParams = {}
  ): Observable<ProductListResponse> {
    return this.http.get<ProductListResponse>(
      `${this.baseUrl}/merchant/${merchantId}`,
      {
        params: this.toParams(params),
        withCredentials: true,
      }
    );
  }

  findOne(externalId: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }

  create(
    merchantId: string,
    payload: CreateProductRequest,
    images?: File[]
  ): Observable<ProductResponse> {
    const formData = this.toFormData(payload, images);
    return this.http.post<ProductResponse>(`${this.baseUrl}`, formData, {
      params: new HttpParams().set('merchantId', merchantId),
      withCredentials: true,
    });
  }

  update(
    externalId: string,
    payload: UpdateProductRequest,
    images?: File[]
  ): Observable<ProductResponse> {
    if (images?.length) {
      const formData = this.toFormData(payload, images);
      return this.http.patch<ProductResponse>(
        `${this.baseUrl}/${externalId}`,
        formData,
        { withCredentials: true }
      );
    }
    return this.http.patch<ProductResponse>(
      `${this.baseUrl}/${externalId}`,
      payload,
      { withCredentials: true }
    );
  }

  delete(externalId: string): Observable<ProductResponse> {
    return this.http.delete<ProductResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }

  private toParams(params: ProductQueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.merchantId) {
      httpParams = httpParams.set('merchantId', params.merchantId);
    }
    if (params.merchantIds) {
      httpParams = httpParams.set('merchantIds', params.merchantIds);
    }
    if (params.categoryIds) {
      httpParams = httpParams.set('categoryIds', params.categoryIds);
    }
    if (params.minPrice != null) {
      httpParams = httpParams.set('minPrice', params.minPrice);
    }
    if (params.maxPrice != null) {
      httpParams = httpParams.set('maxPrice', params.maxPrice);
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    return httpParams;
  }

  private toFormData(
    payload: CreateProductRequest | UpdateProductRequest,
    images?: File[]
  ): FormData {
    const formData = new FormData();
    if (payload.name) {
      formData.append('name', JSON.stringify(payload.name));
    }
    if (payload.description) {
      formData.append('description', JSON.stringify(payload.description));
    }
    if (payload.price != null) {
      formData.append('price', String(payload.price));
    }
    if (payload.sku) {
      formData.append('sku', payload.sku);
    }
    if (payload.stock != null) {
      formData.append('stock', String(payload.stock));
    }
    if (payload.categoryId) {
      formData.append('categoryId', payload.categoryId);
    }
    if (payload.isActive !== undefined) {
      formData.append('isActive', String(payload.isActive));
    }
    if (payload.publishStatus) {
      formData.append('publishStatus', payload.publishStatus);
    }
    images?.forEach((file) => formData.append('images', file));
    return formData;
  }
}
