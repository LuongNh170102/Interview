import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CourierListResponse,
  CourierQueryParams,
  CourierApiResponse,
} from '../interfaces/courier.interface';
import { RequestOtpRequest, RequestOtpResponse, VerifyOtpRequest, VerifyOtpResponse } from '../interfaces/otp.interface';

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
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<CourierListResponse>(this.baseUrl, {
      params: httpParams,
      withCredentials: true,
    });
  }

  findById(id: string): Observable<CourierApiResponse> {
    return this.http.get<CourierApiResponse>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  approve(id: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/approve`, { status: 'APPROVED' }, { withCredentials: true });
  }

  reject(id: string, rejectionReason?: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/reject`, { status: 'REJECTED', rejectionReason }, { withCredentials: true });
  }
}
