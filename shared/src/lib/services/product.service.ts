import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateProductRequest,
  ProductListResponse,
  ProductQueryParams,
  ProductResponse,
  UpdateProductRequest,
} from '../interfaces/product.interface';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/products';

  findAll(params: ProductQueryParams = {}): Observable<ProductListResponse> {
    return this.http.get<ProductListResponse>(this.baseUrl, {
      params: this.buildParams(params),
      withCredentials: true,
    });
  }

  findAdminList(
    params: ProductQueryParams = {}
  ): Observable<ProductListResponse> {
    return this.http.get<ProductListResponse>(`${this.baseUrl}/admin`, {
      params: this.buildParams(params),
      withCredentials: true,
    });
  }

  findByExternalId(externalId: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }

  findAdminByExternalId(externalId: string): Observable<ProductResponse> {
    return this.http.get<ProductResponse>(
      `${this.baseUrl}/admin/${externalId}`,
      {
        withCredentials: true,
      }
    );
  }

  findByMerchant(
    merchantExternalId: string,
    params: ProductQueryParams = {}
  ): Observable<ProductListResponse> {
    return this.http.get<ProductListResponse>(
      `${this.baseUrl}/merchant/${merchantExternalId}`,
      {
        params: this.buildParams(params),
        withCredentials: true,
      }
    );
  }

  create(payload: CreateProductRequest): Observable<ProductResponse> {
    const imageFiles = payload.imageFiles ?? [];

    if (imageFiles.length === 0) {
      return this.http.post<ProductResponse>(this.baseUrl, payload, {
        withCredentials: true,
      });
    }

    const formData = new FormData();
    formData.set('merchantId', payload.merchantId);
    formData.set('name', JSON.stringify(payload.name));
    formData.set('price', payload.price.toString());
    formData.set('sku', payload.sku);
    formData.set('stock', payload.stock.toString());

    if (payload.categoryId) {
      formData.set('categoryId', payload.categoryId);
    }
    if (payload.sectionId) {
      formData.set('sectionId', payload.sectionId);
    }
    if (payload.description) {
      formData.set('description', JSON.stringify(payload.description));
    }
    if (payload.currency) {
      formData.set('currency', payload.currency);
    }
    if (payload.status) {
      formData.set('status', payload.status);
    }
    if (typeof payload.isActive === 'boolean') {
      formData.set('isActive', String(payload.isActive));
    }
    if (payload.metadata) {
      formData.set('metadata', JSON.stringify(payload.metadata));
    }

    imageFiles.forEach((file) => formData.append('images', file, file.name));

    return this.http.post<ProductResponse>(this.baseUrl, formData, {
      withCredentials: true,
    });
  }

  update(
    externalId: string,
    payload: UpdateProductRequest
  ): Observable<ProductResponse> {
    const imageFiles = payload.imageFiles ?? [];

    if (imageFiles.length === 0) {
      const { imageFiles: _imageFiles, ...updatePayload } = payload;

      return this.http.patch<ProductResponse>(
        `${this.baseUrl}/${externalId}`,
        updatePayload,
        {
          withCredentials: true,
        }
      );
    }

    const formData = new FormData();

    if (payload.merchantId) {
      formData.set('merchantId', payload.merchantId);
    }
    if (payload.categoryId) {
      formData.set('categoryId', payload.categoryId);
    }
    if (payload.sectionId) {
      formData.set('sectionId', payload.sectionId);
    }
    if (payload.name) {
      formData.set('name', JSON.stringify(payload.name));
    }
    if (payload.description) {
      formData.set('description', JSON.stringify(payload.description));
    }
    if (typeof payload.price !== 'undefined') {
      formData.set('price', payload.price.toString());
    }
    if (payload.sku) {
      formData.set('sku', payload.sku);
    }
    if (typeof payload.stock !== 'undefined') {
      formData.set('stock', payload.stock.toString());
    }
    if (payload.currency) {
      formData.set('currency', payload.currency);
    }
    if (payload.status) {
      formData.set('status', payload.status);
    }
    if (typeof payload.isActive === 'boolean') {
      formData.set('isActive', String(payload.isActive));
    }
    if (payload.metadata) {
      formData.set('metadata', JSON.stringify(payload.metadata));
    }

    imageFiles.forEach((file) => formData.append('images', file, file.name));

    return this.http.patch<ProductResponse>(
      `${this.baseUrl}/${externalId}`,
      formData,
      {
        withCredentials: true,
      }
    );
  }

  remove(externalId: string): Observable<ProductResponse> {
    return this.http.delete<ProductResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }

  private buildParams(params: ProductQueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.include) {
      httpParams = httpParams.set('include', params.include);
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.merchantId) {
      httpParams = httpParams.set('merchantId', params.merchantId);
    }
    if (params.categoryId) {
      httpParams = httpParams.set('categoryId', params.categoryId);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (typeof params.isActive === 'boolean') {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    if (params.sectionId) {
      httpParams = httpParams.set('sectionId', params.sectionId.toString());
    }

    return httpParams;
  }
}
