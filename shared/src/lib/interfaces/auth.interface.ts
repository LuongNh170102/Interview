export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string;
  phone?: string;
}

export interface UserProfile {
  id: number;
  email: string;
  username?: string | null;
  roles: string[];
}

export interface AuthResponse {
  access_token: string;
  user: UserProfile;
  permissions: string[];
}
