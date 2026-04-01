import { useState, ReactNode, useEffect, useRef } from "react";
import { loginRequest, logoutRequest, logoutAllDevices } from "./authService";
import { User } from "../types/auth";
import { getAccessToken, setAccessToken } from "../services/api";
import { isTokenExpired, decodeJWT } from "../utils/jwt";
import { AuthContext } from "./AuthContext";

// Helper function to extract user data from JWT token
const getUserFromToken = (token: string): User | null => {
  const payload = decodeJWT(token);
  if (!payload) return null;

  return {
    id: payload.user_id,
    email: payload.email || '',
    name: payload.name || payload.email?.split('@')[0] || '', 
    role: (payload.role as 'admin' | 'mechanic') || 'mechanic',
    created_at: new Date().toISOString(), 
    updated_at: new Date().toISOString(), 
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasAttemptedRefresh = useRef(false);
  const refreshInProgress = useRef<Promise<void> | null>(null);

  // Check if user has refresh token on mount and restore session
  useEffect(() => {
    // Only attempt refresh once on initial mount (persists through React.StrictMode double-mounting)
    if (hasAttemptedRefresh.current) {
      return;
    }
    
    const restoreSession = async () => {
      hasAttemptedRefresh.current = true;
      
      // If a refresh is already in progress, wait for it
      if (refreshInProgress.current) {
        await refreshInProgress.current;
        return;
      }
      
      // First, check if we have a valid access token in memory
      const currentAccessToken = getAccessToken();
      
      if (currentAccessToken && !isTokenExpired(currentAccessToken)) {
        // Access token is still valid, extract user data from it
        const userData = getUserFromToken(currentAccessToken);
        if (userData) {
          setUser(userData);
          setIsLoading(false);
          return;
        }
      }
      
      // Access token expired or not present, try to refresh
      const refreshToken = localStorage.getItem("refresh_token");
      
      if (!refreshToken) {
        // No refresh token available, user needs to login
        setIsLoading(false);
        return;
      }
      
      // Start refresh and store the promise
      refreshInProgress.current = (async () => {
        try {
          // Try to refresh the access token to restore the session
          const response = await fetch('http://localhost:8080/api/v1/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          
          if (response.ok) {
            const data = await response.json();
            const newAccessToken = data.data.access_token;
            setAccessToken(newAccessToken);
            localStorage.setItem('refresh_token', data.data.refresh_token);
            
            // Extract real user data from the new access token
            const userData = getUserFromToken(newAccessToken);
            if (userData) {
              setUser(userData);
            }
          } else {
            // Refresh failed (expired or invalid token), clear and don't show error
            localStorage.removeItem('refresh_token');
            setAccessToken(null);
          }
        } catch (error) {
          // Silent fail - just clear tokens without bothering the user
          localStorage.removeItem('refresh_token');
          setAccessToken(null);
        } finally {
          setIsLoading(false);
          refreshInProgress.current = null;
        }
      })();
      
      await refreshInProgress.current;
    };
    
    restoreSession();
  }, []); // Empty dependency array - should only run once on mount

  const login = async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    setUser(data.user);
  };

  const logout = async () => {
    await logoutRequest();
    setUser(null);
  };

  const logoutAll = async () => {
    await logoutAllDevices();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        logoutAll,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
