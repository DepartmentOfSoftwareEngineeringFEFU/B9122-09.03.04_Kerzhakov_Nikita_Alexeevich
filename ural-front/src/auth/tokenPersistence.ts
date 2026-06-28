import { AuthDto } from "../types/auth";

const LS_ACCESS = "accessToken";
const LS_REFRESH = "refreshToken";
const COOKIE_ACCESS = "accessToken";
const COOKIE_REFRESH = "refreshToken";

function cookieFlags(maxAgeSeconds: number): string {
  const parts = [`path=/`, `SameSite=Lax`, `max-age=${maxAgeSeconds}`];
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    parts.push("Secure");
  }
  return parts.join(";");
}

function setClientCookie(name: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${name}=${encodeURIComponent(value)};${cookieFlags(maxAgeSeconds)}`;
}

function removeClientCookie(name: string): void {
  document.cookie = `${name}=;path=/;max-age=0`;
}

/** Сохраняет токены в localStorage и дублирует их в cookie (доступны скрипту на клиенте). */
export function persistAuthTokens(dto: AuthDto): void {
  localStorage.setItem(LS_ACCESS, dto.accessToken);
  localStorage.setItem(LS_REFRESH, dto.refreshToken);
  setClientCookie(COOKIE_ACCESS, dto.accessToken, 60 * 15);
  setClientCookie(COOKIE_REFRESH, dto.refreshToken, 60 * 60 * 24 * 7);
}

export function clearAuthTokens(): void {
  localStorage.removeItem(LS_ACCESS);
  localStorage.removeItem(LS_REFRESH);
  removeClientCookie(COOKIE_ACCESS);
  removeClientCookie(COOKIE_REFRESH);
}

export function readStoredAccessToken(): string | null {
  return localStorage.getItem(LS_ACCESS);
}

export function readStoredRefreshToken(): string | null {
  return localStorage.getItem(LS_REFRESH);
}
