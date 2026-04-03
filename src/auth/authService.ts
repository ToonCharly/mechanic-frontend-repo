import { api, setAccessToken, getAccessToken } from "../services/api";
import { LoginRequest, AuthResponse, User, RegisterRequest } from "../types/auth";
import { isTokenExpired } from "../utils/jwt";

export const registerRequest = async (
  name: string,
  email: string,
  password: string,
  role: "admin" | "mechanic"
): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  const response = await api.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
    role,
  } as RegisterRequest);

  const { access_token, refresh_token, user } = response.data.data;

  // Set access token in memory
  setAccessToken(access_token);
  
  // Store refresh token in localStorage
  localStorage.setItem("refresh_token", refresh_token);

  return {
    user,
    accessToken: access_token,
    refreshToken: refresh_token,
  };
};

export const loginRequest = async (
  email: string,
  password: string
): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  const response = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  } as LoginRequest);

  const { access_token, refresh_token, user } = response.data.data;

  // Set access token in memory
  setAccessToken(access_token);
  
  // Store refresh token in localStorage
  localStorage.setItem("refresh_token", refresh_token);

  return {
    user,
    accessToken: access_token,
    refreshToken: refresh_token,
  };
};

export const logoutRequest = async (): Promise<void> => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    const accessToken = getAccessToken();
    
    // Only notify backend if we have a valid (non-expired) access token
    if (refreshToken && accessToken && !isTokenExpired(accessToken)) {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
      // Use fetch to avoid Axios interceptors that might fail with expired tokens
      await fetch(`${baseUrl}/auth/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include',
        body: JSON.stringify({ refresh_token: refreshToken })
      });
    }
  } catch (error) {
    // Silent fail - logout should always succeed locally
    console.log("Backend logout notification failed, clearing local tokens anyway");
  } finally {
    // Clear tokens regardless of API call success
    setAccessToken(null);
    localStorage.removeItem("refresh_token");
  }
};

export const logoutAllDevices = async (): Promise<void> => {
  try {
    const accessToken = getAccessToken();
    
    // Only notify backend if we have a valid (non-expired) access token
    if (accessToken && !isTokenExpired(accessToken)) {
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1";
      // Use fetch to avoid Axios interceptors that might fail with expired tokens
      await fetch(`${baseUrl}/auth/logout-all`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        credentials: 'include'
      });
    }
  } catch (error) {
    // Silent fail - logout should always succeed locally
    console.log("Backend logout-all notification failed, clearing local tokens anyway");
  } finally {
    setAccessToken(null);
    localStorage.removeItem("refresh_token");
  }
};
