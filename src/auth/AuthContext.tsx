import { createContext } from "react";
import { User } from "../types/auth";

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);
