export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'mechanic';
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'mechanic';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    user: User;
  };
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface RefreshTokenResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}
