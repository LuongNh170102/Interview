import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CourierListResponse,
  CourierQueryParams,
  CourierResponse,
  RegisterCourierRequest,
  UpdateCourierApprovalRequest,
  UpdateCourierAvailabilityRequest,
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
      httpParams = httpParams.set(
        'operationalStatus',
        params.operationalStatus
      );
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.userId) {
      httpParams = httpParams.set('userId', params.userId.toString());
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

  getMyProfile(): Observable<CourierResponse> {
    return this.http.get<CourierResponse>(`${this.baseUrl}/me`, {
      withCredentials: true,
    });
  }

  register(payload: RegisterCourierRequest): Observable<CourierResponse> {
    return this.http.post<CourierResponse>(
      `${this.baseUrl}/register`,
      payload,
      {
        withCredentials: true,
      }
    );
  }

  updateApproval(
    externalId: string,
    payload: UpdateCourierApprovalRequest
  ): Observable<CourierResponse> {
    return this.http.patch<CourierResponse>(
      `${this.baseUrl}/${externalId}/approval`,
      payload,
      { withCredentials: true }
    );
  }

  updateAvailability(
    payload: UpdateCourierAvailabilityRequest
  ): Observable<CourierResponse> {
    return this.http.patch<CourierResponse>(
      `${this.baseUrl}/me/availability`,
      payload,
      { withCredentials: true }
    );
  }

  requestOtp(phone: string): Observable<RequestOtpResponse> {
    const payload: RequestOtpRequest = { phone };
    return this.http.post<RequestOtpResponse>(
      `${this.baseUrl}/otp/request`,
      payload
    );
  }

  verifyOtp(phone: string, code: string): Observable<VerifyOtpResponse> {
    const payload: VerifyOtpRequest = { phone, code };
    return this.http.post<VerifyOtpResponse>(
      `${this.baseUrl}/otp/verify`,
      payload
    );
  }
}
