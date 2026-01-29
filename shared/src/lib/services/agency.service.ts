import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AgencyListResponse,
  AgencyQueryParams,
  AgencyResponse,
  CreateAgencyRequest,
} from '../interfaces/agency.interface';
import {
  RequestOtpRequest,
  RequestOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '../interfaces/otp.interface';

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
    return this.http.post<AgencyResponse>(`${this.baseUrl}/register`, dto, {
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
}
