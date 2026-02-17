import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CategoryQueryParams,
  CategoryResponse,
} from '../interfaces/category.interface';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/categories';

  /**
   * Get all categories with optional pagination
   */
  findAll(params: CategoryQueryParams = {}): Observable<CategoryResponse[]> {
    let httpParams = new HttpParams();

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.includeChildren !== undefined) {
      httpParams = httpParams.set(
        'includeChildren',
        params.includeChildren.toString()
      );
    }

    return this.http.get<CategoryResponse[]>(this.baseUrl, {
      params: httpParams,
      withCredentials: true,
    });
  }

  /**
   * Get single category by external ID
   */
  findByExternalId(externalId: string): Observable<CategoryResponse> {
    return this.http.get<CategoryResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }
}
