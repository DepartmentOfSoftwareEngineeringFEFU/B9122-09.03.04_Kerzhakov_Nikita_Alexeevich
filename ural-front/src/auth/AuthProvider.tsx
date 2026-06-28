import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as authApi from "../api/auth.api";
import { clearAccessToken, setAccessToken } from "../api/client";
import type { RegisterPayload } from "../types/auth";
import { clearAuthTokens, persistAuthTokens } from "./tokenPersistence";

type LoginCredentials = { login: string; password: string };

type AuthContextValue = {
  user: null;
  login: (data: LoginCredentials) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user] = useState<null>(null);

  const login = useCallback(async (data: LoginCredentials) => {
    const res = await authApi.login(data);
    setAccessToken(res.accessToken);
    persistAuthTokens(res);
  }, []);

  const register = useCallback(async (data: RegisterPayload) => {
    const res = await authApi.register(data);
    setAccessToken(res.accessToken);
    persistAuthTokens(res);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* сеть / 401 — всё равно чистим клиент */
    }
    clearAccessToken();
    clearAuthTokens();
    window.location.href = "/login";
  }, []);

  const value = useMemo(
    () => ({ user, login, register, logout }),
    [user, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
