import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import {
  getTokenFallback,
  getRefreshFallback,
  clearTokenFallback,
  applyMobileAuthHeaders,
  persistTokensFromAuthResponse,
} from "../utils/tokenFallback";

const API_URL = import.meta.env.VITE_API_URL;
const REFRESH_PATH = "/api/Acceso/refresh";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000,
  validateStatus: () => true,
  headers: {
    "Content-Type": "application/json",
  },
});

const isAuthBypassUrl = (url?: string) => {
  if (!url) return false;
  const u = url.toLowerCase();
  return (
    u.includes("/api/acceso/login") ||
    u.includes("/api/acceso/refresh") ||
    u.includes("/api/acceso/checkauth")
  );
};

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.request.use((config) => {
  const fallbackToken = getTokenFallback();
  if (fallbackToken) {
    config.headers.Authorization = `Bearer ${fallbackToken}`;
  }

  const fallbackRefresh = getRefreshFallback();
  if (fallbackRefresh && config.url?.toLowerCase().includes("/api/acceso/refresh")) {
    config.headers["X-Refresh-Token"] = fallbackRefresh;
  }

  return config;
});

const processQueue = (error: unknown = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(null);
  });
  failedQueue = [];
};

async function callRefreshEndpoint(): Promise<boolean> {
  const headers: Record<string, string> = {};
  applyMobileAuthHeaders({ headers });

  const fallbackRefresh = getRefreshFallback();
  if (fallbackRefresh) {
    headers["X-Refresh-Token"] = fallbackRefresh;
  }

  const body = fallbackRefresh ? { refreshToken: fallbackRefresh } : {};

  const res = await api.post<{ isSuccess?: boolean; accessToken?: string; refreshToken?: string }>(
    REFRESH_PATH,
    body,
    {
      withCredentials: true,
      headers,
      validateStatus: (status) => status < 500,
    },
  );

  if (res.status !== 200 || !res.data?.isSuccess) return false;

  persistTokensFromAuthResponse(res.data);
  return true;
}

async function handleUnauthorized(
  originalRequest: RetryableConfig,
): Promise<unknown> {
  if (isAuthBypassUrl(originalRequest.url) || originalRequest._retry) {
    return api(originalRequest);
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(() => api(originalRequest));
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const ok = await callRefreshEndpoint();
    if (!ok) {
      processQueue(new Error("Refresh failed"));
      clearTokenFallback();
      window.location.href = "/signin";
      return Promise.reject(new Error("Sesión expirada"));
    }
    processQueue();
    return api(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError);
    clearTokenFallback();
    window.location.href = "/signin";
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

api.interceptors.response.use(
  async (response) => {
    if (response.status !== 401) return response;

    const originalRequest = response.config as RetryableConfig;
    return handleUnauthorized(originalRequest);
  },
  async (error) => {
    const originalRequest = error.config as RetryableConfig | undefined;
    if (error.response?.status === 401 && originalRequest) {
      return handleUnauthorized(originalRequest);
    }
    return Promise.reject(error);
  },
);
