import axios from "axios";
import { API_BASE_URL } from "../config/apiBaseUrl";
import { AuthDto } from "../types/auth";
import {
  clearAuthTokens,
  persistAuthTokens,
  readStoredAccessToken,
  readStoredRefreshToken,
} from "../auth/tokenPersistence";

export const api = axios.create({
  baseURL: API_BASE_URL,
});

let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const clearAccessToken = () => {
  accessToken = null;
};

export const getAccessToken = () => accessToken;

/** Восстанавливает access token в памяти после перезагрузки страницы. */
export const initApiAuthFromStorage = () => {
  const stored = readStoredAccessToken();
  if (stored) {
    accessToken = stored;
  }
};

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      const headers = config.headers ?? {}

      headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );

      config.headers = headers;
    }

    return config;
  }
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(Promise.reject);
      }

      isRefreshing = true;

      try {
        const refreshToken = readStoredRefreshToken();

        const res = await axios.post(
          `${API_BASE_URL}/auth/refresh-tokens`,
          { refreshToken }
        );

        const body = res.data as AuthDto;
        const newAccessToken = body.accessToken;

        setAccessToken(newAccessToken);
        persistAuthTokens(body);

        processQueue(null, newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearAccessToken();
        clearAuthTokens();
        window.location.href = "/login";
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);