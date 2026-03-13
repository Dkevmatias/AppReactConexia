import axios, { AxiosInstance } from "axios";
import { isSafariIOS, getTokenFallback, clearTokenFallback } from "../utils/tokenFallback";

const API_URL = import.meta.env.VITE_API_URL;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: unknown) => void; reject: (reason?: unknown) => void }> = [];

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 15000, 
  validateStatus: () => true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (isSafariIOS()) {
    const fallbackToken = getTokenFallback();
    if (fallbackToken) {
      config.headers.Authorization = `Bearer ${fallbackToken}`;
    }
  }
  return config;
});

const processQueue = (error: any = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(null);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // No interceptar refresh ni login
    if (
      originalRequest.url?.includes("/api/Acceso/RefreshToken") ||
      originalRequest.url?.includes("/api/Acceso/Login")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post("/api/Acceso/RefreshToken", {}, { withCredentials: true });
        processQueue();
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      } finally { 
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);