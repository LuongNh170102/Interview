import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CourierListResponse,
  CourierResponse,
} from '../shared/interfaces/courier.interface';

export interface CourierQueryParams {
  page?: number;
  limit?: number;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  search?: string;
  include?: string;
}

export interface RejectCourierPayload {
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class CourierManagementService {
  private readonly baseUrl = '/api/couriers';

  constructor(private http: HttpClient) {}

  /**
   * Fetch paginated couriers — defaults to PENDING to show the approval queue.
   */
  findAll(params: CourierQueryParams = {}): Observable<CourierListResponse> {
    let httpParams = new HttpParams();

    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.approvalStatus)
      httpParams = httpParams.set('approvalStatus', params.approvalStatus);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.include) httpParams = httpParams.set('include', params.include);

    return this.http.get<CourierListResponse>(this.baseUrl, {
      params: httpParams,
    });
  }

  /** Approve a courier — idempotent on the server side. */
  approve(externalId: string): Observable<CourierResponse> {
    return this.http.patch<CourierResponse>(
      `${this.baseUrl}/${externalId}/approve`,
      {},
    );
  }

  /** Reject a courier — reason is mandatory (enforced by server DTO). */
  reject(
    externalId: string,
    payload: RejectCourierPayload,
  ): Observable<CourierResponse> {
    return this.http.patch<CourierResponse>(
      `${this.baseUrl}/${externalId}/reject`,
      payload,
    );
  }
}
