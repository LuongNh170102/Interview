import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Product,
  ProductListResponse,
  ProductQueryParams,
} from '../interfaces/product.interface';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/products';

  findAll(params: ProductQueryParams = {}): Observable<ProductListResponse> {
    let httpParams = new HttpParams();

    if (params.page !== undefined)
      httpParams = httpParams.set('page', params.page.toString());
    if (params.limit !== undefined)
      httpParams = httpParams.set('limit', params.limit.toString());
    if (params.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<ProductListResponse>(this.baseUrl, {
      params: httpParams,
    });
  }

  findByExternalId(externalId: string): Observable<Product> {
    return this.http.get<Product>(`${this.baseUrl}/${externalId}`);
  }
}
