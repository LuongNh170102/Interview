import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AgencyListResponse,
  AgencyQueryParams,
  AgencyResponse,
  CreateAgencyRequest,
} from '../interfaces/agency.interface';

@Injectable({ providedIn: 'root' })
export class AgencyService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/agencies';

  /**
   * Get paginated list of agencies with optional statistics
   */
  findAll(params: AgencyQueryParams = {}): Observable<AgencyListResponse> {
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

    return this.http.get<AgencyListResponse>(this.baseUrl, {
      params: httpParams,
      withCredentials: true,
    });
  }

  /**
   * Get single agency by external ID
   */
  findByExternalId(externalId: string): Observable<AgencyResponse> {
    return this.http.get<AgencyResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }

  /**
   * Create new agency
   */
  create(dto: CreateAgencyRequest): Observable<AgencyResponse> {
    return this.http.post<AgencyResponse>(this.baseUrl, dto, {
      withCredentials: true,
    });
  }
}
