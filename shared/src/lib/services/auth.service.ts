import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UserProfile,
} from '../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  // Security: In-memory storage only to prevent XSS attacks.
  // Session persistence is handled via HTTP-only cookies (Refresh Token).
  readonly accessToken = signal<string | null>(null);
  readonly currentUser = signal<UserProfile | null>(null);

  login(payload: LoginRequest) {
    return this.http
      .post<AuthResponse>('/api/auth/login', payload, { withCredentials: true })
      .pipe(tap((res) => this.persist(res.access_token, res.user)));
  }

  register(payload: RegisterRequest) {
    return this.http
      .post<AuthResponse>('/api/auth/register', payload, {
        withCredentials: true,
      })
      .pipe(tap((res) => this.persist(res.access_token, res.user)));
  }

  refreshToken() {
    return this.http
      .post<AuthResponse>('/api/auth/refresh', {}, { withCredentials: true })
      .pipe(tap((res) => this.persist(res.access_token, res.user)));
  }

  logout() {
    return this.http
      .post<void>('/api/auth/logout', {}, { withCredentials: true })
      .pipe(
        finalize(() => {
          this.accessToken.set(null);
          this.currentUser.set(null);
        })
      );
  }

  private persist(token: string, user: UserProfile) {
    this.accessToken.set(token);
    this.currentUser.set(user);
  }
}
