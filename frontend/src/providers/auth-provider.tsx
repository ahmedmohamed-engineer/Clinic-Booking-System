"use client";

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { UserRecord } from "@/types/models/user";
import * as authApi from "@/features/auth/api/auth.api";
import { refreshAccessToken } from "@/lib/axios";
import { setAccessToken, setRefreshToken, getRefreshToken, clearTokens } from "@/lib/token-store";
import { showToast } from "@/lib/toast-store";

export interface AuthContextValue {
  user: UserRecord | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (patch: Partial<UserRecord>) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedRefresh = getRefreshToken();
    const boot = storedRefresh
      ? refreshAccessToken()
          .then(() => authApi.getCurrentUser())
          .then(setUser)
      : Promise.resolve(null);
    boot
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authApi.loginUser({ email, password });
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    const currentUser = await authApi.getCurrentUser();
    setUser(currentUser);
    showToast("Logged in successfully", "success");
  }, []);

  const register = useCallback(async (email: string, password: string, fullName: string) => {
    const tokens = await authApi.registerUser({ email, password, fullName });
    setAccessToken(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    const currentUser = await authApi.getCurrentUser();
    setUser(currentUser);
    showToast("Account created successfully", "success");
  }, []);

  const logout = useCallback(async () => {
    const storedRefresh = getRefreshToken();
    try {
      if (storedRefresh) {
        await authApi.logoutUser({ refreshToken: storedRefresh });
      }
    } catch {
    } finally {
      clearTokens();
      setUser(null);
      showToast("Logged out", "info");
    }
  }, []);

  const updateUser = useCallback((patch: Partial<UserRecord>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
