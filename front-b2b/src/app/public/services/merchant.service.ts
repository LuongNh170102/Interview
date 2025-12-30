import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateMerchantRequest,
  MerchantResponse,
  RequestOtpRequest,
  RequestOtpResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
} from '@vhandelivery/shared-ui';

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private baseUrl = '/api/merchants';

  constructor(private http: HttpClient) {}

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

  registerMerchant(
    payload: CreateMerchantRequest,
    access_token: string
  ): Observable<MerchantResponse> {
    return this.http.post<MerchantResponse>(
      `${this.baseUrl}/register`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
  }
}
