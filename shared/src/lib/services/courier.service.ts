import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CourierListResponse,
  CourierQueryParams,
  CourierResponse,
  CreateCourierRequest,
  UpdateCourierStatus
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
    if (params.activeStatus) {
      httpParams = httpParams.set('activeStatus', params.activeStatus);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.startDate && params.endDate) {
      httpParams = httpParams.set('startDate', params.startDate);
      httpParams = httpParams.set('endDate', params.endDate);
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
   * Create new courier
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
    const payload: RequestOtpRequest = { phone };
    return this.http.post<RequestOtpResponse>(
      `${this.baseUrl}/otp/request`,
      payload
    );
  }

  /**
   * Verify OTP code
   */
  verifyOtp(phone: string, code: string): Observable<VerifyOtpResponse> {
    const payload: VerifyOtpRequest = { phone, code };
    return this.http.post<VerifyOtpResponse>(
      `${this.baseUrl}/otp/verify`,
      payload
    );
  }

  /**
    * Approve OR Reject courier with reason
    */
  updateStatus(externalId: string, dto: UpdateCourierStatus): Observable<CourierResponse> {
    return this.http.patch<CourierResponse>(
      `${this.baseUrl}/${externalId}/status`,
      dto
    );
  }

  /**
    * soft delete a courier by external ID
    */
  delete(externalId: string): Observable<CourierResponse> {
    return this.http.delete<CourierResponse>(
      `${this.baseUrl}/${externalId}`,
    );
  }
}