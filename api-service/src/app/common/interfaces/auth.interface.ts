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
