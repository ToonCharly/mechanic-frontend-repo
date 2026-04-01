import axios, { InternalAxiosRequestConfig } from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api/v1",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let accessToken: string | null = null;
let isRefreshing = false;
let refreshPromise: Promise<string> | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request interceptor - add access token to headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Don't try to refresh if the error came from the refresh endpoint itself
      if (originalRequest.url?.includes('/auth/refresh')) {
        isRefreshing = false;
        refreshPromise = null;
        setAccessToken(null);
        localStorage.removeItem("refresh_token");
        // Only redirect to login if we're not already there
        if (!window.location.pathname.includes('/login') && 
            !window.location.pathname.includes('/register')) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      // If already refreshing, wait for that refresh to complete
      if (isRefreshing && refreshPromise) {
        try {
          const newAccessToken = await refreshPromise;
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // Start a new refresh
      isRefreshing = true;
      
      refreshPromise = (async () => {
        try {
          const refreshToken = localStorage.getItem("refresh_token");
          
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          // Call refresh endpoint using fetch to avoid interceptor loop
          const response = await fetch("http://localhost:8080/api/v1/auth/refresh", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ refresh_token: refreshToken })
          });

          if (!response.ok) {
            throw new Error("Refresh failed");
          }

          const data = await response.json();
          const newAccessToken = data.data.access_token;
          const newRefreshToken = data.data.refresh_token;

          // Update tokens
          setAccessToken(newAccessToken);
          localStorage.setItem("refresh_token", newRefreshToken);

          isRefreshing = false;
          return newAccessToken;
        } catch (refreshError) {
          // Refresh failed - clear everything
          isRefreshing = false;
          refreshPromise = null;
          setAccessToken(null);
          localStorage.removeItem("refresh_token");
          
          if (!window.location.pathname.includes('/login') && 
              !window.location.pathname.includes('/register')) {
            window.location.href = "/login";
          }
          throw refreshError;
        }
      })();

      try {
        const newAccessToken = await refreshPromise;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);
