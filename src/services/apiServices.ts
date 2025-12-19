import axios, { AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_API_URL;
let isRefreshing = false;
let failedQueue: any[] = [];

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Necesario para enviar cookie HttpOnly
   timeout: 15000, 
  validateStatus: () => true 
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
      originalRequest.url?.includes("/Acceso/RefreshToken") ||
      originalRequest.url?.includes("/Acceso/Login")
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
        await api.post("/Acceso/RefreshToken", {}, { withCredentials: true });
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