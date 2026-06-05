import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CourierListResponse,
  CourierQueryParams,
  CourierResponse,
  RejectCourierRequest,
} from '../interfaces/courier.interface';

@Injectable({ providedIn: 'root' })
export class CourierService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/couriers';

  findAll(params: CourierQueryParams = {}): Observable<CourierListResponse> {
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
    if (params.operationalStatus) {
      httpParams = httpParams.set('operationalStatus', params.operationalStatus);
    }
    if (params.availabilityStatus) {
      httpParams = httpParams.set('availabilityStatus', params.availabilityStatus);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.startDate) {
      httpParams = httpParams.set('startDate', params.startDate);
    }
    if (params.endDate) {
      httpParams = httpParams.set('endDate', params.endDate);
    }

    return this.http.get<CourierListResponse>(this.baseUrl, {
      params: httpParams,
      withCredentials: true,
    });
  }

  findByExternalId(externalId: string): Observable<CourierResponse> {
    return this.http.get<CourierResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }

  approve(externalId: string): Observable<CourierResponse> {
    return this.http.patch<CourierResponse>(
      `${this.baseUrl}/${externalId}/approve`,
      {},
      { withCredentials: true }
    );
  }

  reject(
    externalId: string,
    payload: RejectCourierRequest
  ): Observable<CourierResponse> {
    return this.http.patch<CourierResponse>(
      `${this.baseUrl}/${externalId}/reject`,
      payload,
      { withCredentials: true }
    );
  }

  remove(externalId: string): Observable<CourierResponse> {
    return this.http.delete<CourierResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }
}
