import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  CourierListResponse,
  CourierQueryParams,
  CourierResponse,
  CreateCourierRequest,
  UpdateCourierStatusRequest,
} from '../interfaces/courier.interface';

import {
  RequestOtpRequest,
  RequestOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../interfaces/otp.interface';

@Injectable({ providedIn: 'root' })
export class CourierService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/couriers';

  /**
   * Get paginated list of couriers with optional statistics
   */
  findAll(params: CourierQueryParams = {}): Observable<CourierListResponse> {
    let httpParams = new HttpParams();

    if (params.page !== undefined) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit !== undefined) {
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

  /**
   * Get single courier by external ID
   */
  findByExternalId(externalId: string): Observable<CourierResponse> {
    return this.http.get<CourierResponse>(`${this.baseUrl}/${externalId}`, {
      withCredentials: true,
    });
  }

  /**
   * Request OTP for courier registration
   */
  requestOtp(phone: string): Observable<RequestOtpResponse> {
    const payload: RequestOtpRequest = { phone };
    return this.http.post<RequestOtpResponse>(
      `${this.baseUrl}/otp/request`,
      payload,
      { withCredentials: true }
    );
  }

  /**
   * Verify OTP for courier registration
   */
  verifyOtp(phone: string, code: string): Observable<VerifyOtpResponse> {
    const payload: VerifyOtpRequest = { phone, code };
    return this.http.post<VerifyOtpResponse>(
      `${this.baseUrl}/otp/verify`,
      payload,
      { withCredentials: true }
    );
  }

  /**
   * Register new courier (after OTP verification)
   */
  register(dto: CreateCourierRequest): Observable<CourierResponse> {
    return this.http.post<CourierResponse>(`${this.baseUrl}/register`, dto, {
      withCredentials: true,
    });
  }

  /**
   * Approve a courier (Admin only)
   */
  approve(externalId: string): Observable<CourierResponse> {
    return this.http.post<CourierResponse>(
      `${this.baseUrl}/${externalId}/approve`,
      {},
      { withCredentials: true }
    );
  }

  /**
   * Reject a courier with reason (Admin only)
   */
  reject(externalId: string, reason: string): Observable<CourierResponse> {
    const payload: UpdateCourierStatusRequest = {
      status: 'REJECTED',
      rejectionReason: reason,
    };

    return this.http.post<CourierResponse>(
      `${this.baseUrl}/${externalId}/reject`,
      payload,
      { withCredentials: true }
    );
  }

  /**
   * Update courier status (approve/reject)
   */
  updateStatus(
    externalId: string,
    dto: UpdateCourierStatusRequest
  ): Observable<CourierResponse> {
    return this.http.patch<CourierResponse>(
      `${this.baseUrl}/${externalId}/status`,
      dto,
      { withCredentials: true }
    );
  }
}
