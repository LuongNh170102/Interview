import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap, finalize } from 'rxjs/operators';
import {
  AuthResponse,
  GoogleLinkRequest,
  KakaoLinkRequest,
  LinkedAccount,
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
  readonly permissions = signal<string[]>([]);

  // Google OAuth linking state
  readonly googleLinkingData = signal<{
    email: string;
    googleId: string;
    displayName: string;
    avatarUrl: string;
  } | null>(null);

  /** Check if user has a specific permission (format: 'resource:action') */
  readonly hasPermission = (permission: string): boolean => {
    return this.permissions().includes(permission);
  };

  /** Check if user has any of the given permissions */
  readonly hasAnyPermission = (...permissions: string[]): boolean => {
    const userPermissions = this.permissions();
    return permissions.some((p) => userPermissions.includes(p));
  };

  /** Check if user has all of the given permissions */
  readonly hasAllPermissions = (...permissions: string[]): boolean => {
    const userPermissions = this.permissions();
    return permissions.every((p) => userPermissions.includes(p));
  };

  /** Check if user can access a resource (has any action on that resource) */
  readonly canAccessResource = (resource: string): boolean => {
    const userPermissions = this.permissions();
    return userPermissions.some((p) => p.startsWith(`${resource}:`));
  };

  /** Computed: Is the user authenticated */
  readonly isAuthenticated = computed(
    () => this.accessToken() !== null && this.currentUser() !== null
  );

  login(payload: LoginRequest) {
    return this.http
      .post<AuthResponse>('/api/auth/login', payload, { withCredentials: true })
      .pipe(
        tap((res) => this.persist(res.access_token, res.user, res.permissions))
      );
  }

  register(payload: RegisterRequest) {
    return this.http
      .post<AuthResponse>('/api/auth/register', payload, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => this.persist(res.access_token, res.user, res.permissions))
      );
  }

  refreshToken() {
    return this.http
      .post<AuthResponse>('/api/auth/refresh', {}, { withCredentials: true })
      .pipe(
        tap((res) => this.persist(res.access_token, res.user, res.permissions))
      );
  }

  logout() {
    return this.http
      .post<void>('/api/auth/logout', {}, { withCredentials: true })
      .pipe(
        finalize(() => {
          this.accessToken.set(null);
          this.currentUser.set(null);
          this.permissions.set([]);
        })
      );
  }

  // =====================
  // Google OAuth Methods
  // =====================

  /**
   * Redirect to Google OAuth login
   * Backend uses Host header to determine which frontend to redirect back to
   */
  loginWithGoogle() {
    window.location.href = '/api/auth/google';
  }

  /** Link Google account after password confirmation */
  linkGoogleAccount(payload: GoogleLinkRequest) {
    return this.http
      .post<AuthResponse>('/api/auth/google/link', payload, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this.persist(res.access_token, res.user, res.permissions);
          this.googleLinkingData.set(null);
        })
      );
  }

  /** Unlink Google account */
  unlinkGoogleAccount() {
    return this.http.delete<{ message: string }>('/api/auth/google/unlink', {
      withCredentials: true,
    });
  }

  /** Get linked OAuth accounts */
  getLinkedAccounts() {
    return this.http.get<LinkedAccount[]>('/api/auth/linked-accounts', {
      withCredentials: true,
    });
  }

  /** Set password for OAuth-only user */
  setPassword(password: string) {
    return this.http.post<{ message: string }>(
      '/api/auth/set-password',
      { password },
      { withCredentials: true }
    );
  }

  /** Check if current user has password set */
  hasPassword() {
    return this.http.get<{ hasPassword: boolean }>('/api/auth/has-password', {
      withCredentials: true,
    });
  }

  /** Set Google linking data from callback */
  setGoogleLinkingData(data: {
    email: string;
    googleId: string;
    displayName: string;
    avatarUrl: string;
  }) {
    this.googleLinkingData.set(data);
  }

  /** Clear Google linking data */
  clearGoogleLinkingData() {
    this.googleLinkingData.set(null);
  }

  /** Persist Google OAuth response (used after callback redirect) */
  persistGoogleAuth(token: string, user: UserProfile, permissions: string[]) {
    this.persist(token, user, permissions);
  }

  // =====================
  // Kakao OAuth Methods
  // =====================

  /**
   * Redirect to Kakao OAuth login
   * Backend uses Host header to determine which frontend to redirect back to
   */
  loginWithKakao() {
    window.location.href = '/api/auth/kakao';
  }

  /** Link Kakao account after password confirmation */
  linkKakaoAccount(payload: KakaoLinkRequest) {
    return this.http
      .post<AuthResponse>('/api/auth/kakao/link', payload, {
        withCredentials: true,
      })
      .pipe(
        tap((res) => {
          this.persist(res.access_token, res.user, res.permissions);
        })
      );
  }

  /** Unlink Kakao account */
  unlinkKakaoAccount() {
    return this.http.delete<{ message: string }>('/api/auth/kakao/unlink', {
      withCredentials: true,
    });
  }

  /** Persist OAuth response (used after callback redirect for both Google and Kakao) */
  persistOAuthAuth(token: string, user: UserProfile, permissions: string[]) {
    this.persist(token, user, permissions);
  }

  private persist(token: string, user: UserProfile, permissions: string[]) {
    this.accessToken.set(token);
    this.currentUser.set(user);
    this.permissions.set(permissions ?? []);
  }
}
