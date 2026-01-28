import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  MerchantListResponse,
  MerchantQueryParams,
  MerchantApiResponse,
} from '../interfaces/merchant.interface';

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/merchants';

  /**
   * Get paginated list of merchants with optional statistics
   */
  findAll(params: MerchantQueryParams = {}): Observable<MerchantListResponse> {
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
    if (params.approvalStatus) {
      httpParams = httpParams.set('approvalStatus', params.approvalStatus);
    }

    return this.http.get<MerchantListResponse>(this.baseUrl, {
      params: httpParams,
      withCredentials: true,
    });
  }

  /**
   * Get single merchant by external ID
   */
  findByExternalId(externalId: string): Observable<MerchantApiResponse> {
    return this.http.get<MerchantApiResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }
}
