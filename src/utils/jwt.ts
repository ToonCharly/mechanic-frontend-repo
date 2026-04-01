// Utility functions for JWT handling

export interface JWTPayload {
  exp: number;
  iat: number;
  user_id: string;
  email?: string;
  name?: string;
  role?: string;
}

/**
 * Decode a JWT token without verifying signature (client-side only)
 */
export const decodeJWT = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if a JWT token is expired
 * @param token - The JWT token to check
 * @param bufferSeconds - Optional buffer time in seconds (default: 60)
 * @returns true if expired or about to expire within buffer time
 */
export const isTokenExpired = (token: string, bufferSeconds: number = 60): boolean => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = payload.exp;
  
  // Consider token expired if it expires within the buffer time
  return now >= (expiresAt - bufferSeconds);
};

/**
 * Get the expiration time of a token in seconds from now
 */
export const getTokenExpiresIn = (token: string): number => {
  const payload = decodeJWT(token);
  if (!payload || !payload.exp) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  return Math.max(0, payload.exp - now);
};
