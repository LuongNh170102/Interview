import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CourierListResponse,
  CourierQueryParams,
  CourierResponse,
  CreateCourierRequest,
  RejectCourierRequest,
  UpdateCourierRequest,
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

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });

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

  create(dto: CreateCourierRequest): Observable<CourierResponse> {
    return this.http.post<CourierResponse>(`${this.baseUrl}/register`, dto, {
      withCredentials: true,
    });
  }

  update(
    externalId: string,
    dto: UpdateCourierRequest
  ): Observable<CourierResponse> {
    return this.http.patch<CourierResponse>(`${this.baseUrl}/${externalId}`, dto, {
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
    dto: RejectCourierRequest
  ): Observable<CourierResponse> {
    return this.http.patch<CourierResponse>(
      `${this.baseUrl}/${externalId}/reject`,
      dto,
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
