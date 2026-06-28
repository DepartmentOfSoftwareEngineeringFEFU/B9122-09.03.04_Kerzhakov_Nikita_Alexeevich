const DEFAULT_API_BASE_URL = "http://localhost:10902";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function readRuntimeApiBaseUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.__RUNTIME_CONFIG__?.API_BASE_URL;
  if (typeof raw !== "string") return undefined;
  const t = raw.trim();
  return t.length > 0 ? normalizeBaseUrl(t) : undefined;
}

/**
 * 1) `window.__RUNTIME_CONFIG__.API_BASE_URL` из `runtime-config.js` (рантайм).
 * 2) `REACT_APP_API_BASE_URL` при `npm start` / `npm run build`.
 * 3) Дефолт localhost.
 */
export const API_BASE_URL = normalizeBaseUrl(
  readRuntimeApiBaseUrl() ??
    (process.env.REACT_APP_API_BASE_URL
      ? normalizeBaseUrl(process.env.REACT_APP_API_BASE_URL)
      : DEFAULT_API_BASE_URL)
);
