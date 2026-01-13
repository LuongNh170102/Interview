import { inject, Injectable } from '@angular/core';
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
  private readonly baseUrl = '/api/merchants';
  private readonly http = inject(HttpClient);

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
    payload: CreateMerchantRequest
  ): Observable<MerchantResponse> {
    return this.http.post<MerchantResponse>(
      `${this.baseUrl}/register`,
      payload
    );
  }
}
