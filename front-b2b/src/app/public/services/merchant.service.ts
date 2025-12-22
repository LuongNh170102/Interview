import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MerchantService {
  private baseUrl = '/api/merchants';

  constructor(private http: HttpClient) {}

  requestOtp(phone: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/otp/request`, { phone });
  }

  verifyOtp(phone: string, code: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/otp/verify`, { phone, code });
  }

  registerMerchant(payload: any, access_token: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, payload,
      {
        headers: {
          Authorization: `Bearer ${access_token}`
        }
      }
    ); 
  }
}
