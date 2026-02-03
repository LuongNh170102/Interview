import { Request as ExpressRequest } from 'express';

// Interface for authenticated request with JWT user info
export interface AuthenticatedRequest extends ExpressRequest {
  user: {
    userId: number;
    username: string;
    roles: string[];
  };
}

// Interface for request with refresh token cookie
export interface RequestWithCookies extends ExpressRequest {
  cookies: {
    refresh_token?: string;
  };
}

export interface GoogleProfile {
  provider: 'google';
  providerId: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  accessToken: string;
  refreshToken?: string;
}

export interface KakaoProfile {
  provider: 'kakao';
  providerId: string;
  email: string;
  displayName: string;
  avatarUrl: string;
  accessToken: string;
  refreshToken?: string;
}

export interface AuthSuccessResponse {
  requiresLinking: false;
  access_token: string;
  refresh_token: string;
  user: {
    externalId: string;
    email: string;
    username: string | null;
    avatarUrl: string | null;
    roles: string[];
  };
  permissions: string[];
}

// Kakao returns http link sometimes, ensure https if possible or use as is
export interface KakaoAccount {
  profile?: {
    nickname?: string;
    thumbnail_image_url?: string;
    profile_image_url?: string;
  };
  email?: string;
  has_email?: boolean;
  is_email_valid?: boolean;
  is_email_verified?: boolean;
}

export interface KakaoStrategyProfile {
  id: string | number;
  username?: string;
  displayName?: string;
  provider: string;
  _json: {
    id: number;
    kakao_account?: KakaoAccount;
  };
}
