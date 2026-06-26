import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CourierListResponse,
  CourierQueryParams,
  CourierResponse,
  CreateCourierRequest,
} from '../interfaces/courier.interface';
import {
  RequestOtpResponse,
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

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.shouldIncludeStatistics !== undefined) {
      httpParams = httpParams.set('shouldIncludeStatistics', params.shouldIncludeStatistics.toString());
    }
    if (params.approvalStatus) {
      httpParams = httpParams.set('approvalStatus', params.approvalStatus);
    }
    if (params.operationalStatus) {
      httpParams = httpParams.set('operationalStatus', params.operationalStatus);
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
   * Get single courier by ID
   */
  findById(id: number): Observable<CourierResponse> {
    return this.http.get<CourierResponse>(`${this.baseUrl}/${id}`, {
      withCredentials: true,
    });
  }

  /**
   * Register a new courier
   */
  create(dto: CreateCourierRequest): Observable<CourierResponse> {
    return this.http.post<CourierResponse>(`${this.baseUrl}/register`, dto, {
      withCredentials: true,
    });
  }

  /**
   * Request OTP for phone verification
   */
  requestOtp(phone: string): Observable<RequestOtpResponse> {
    return this.http.post<RequestOtpResponse>(
      `${this.baseUrl}/otp/request`,
      { phone }
    );
  }

  /**
   * Verify OTP code
   */
  verifyOtp(phone: string, code: string): Observable<VerifyOtpResponse> {
    return this.http.post<VerifyOtpResponse>(
      `${this.baseUrl}/otp/verify`,
      { phone, code }
    );
  }

  /**
   * Update courier approval status
   */
  updateStatus(
    id: number,
    status: string,
    rejectionReason?: string
  ): Observable<CourierResponse> {
    return this.http.patch<CourierResponse>(
      `${this.baseUrl}/${id}/status`,
      { status, rejectionReason },
      { withCredentials: true }
    );
  }
}
