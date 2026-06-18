import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface B2CProduct {
  externalId: string;
  name: any;
  description: any;
  price: number | null;
  currency: string | null;
  sku: string | null;
  stock: number | null;
  isActive: boolean | null;
  metadata: any;
  merchant?: any;
  createdAt: string;
}

export interface B2CProductListResponse {
  data: B2CProduct[];
  meta: { total: number; page: number; lastPage: number; limit: number };
}

@Injectable({ providedIn: 'root' })
export class B2CProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/products';

  findAll(): Observable<B2CProduct[]> {
    return this.http.get<B2CProduct[]>(this.baseUrl);
  }

  findOne(externalId: string): Observable<B2CProduct> {
    return this.http.get<B2CProduct>(`${this.baseUrl}/${externalId}`);
  }
}