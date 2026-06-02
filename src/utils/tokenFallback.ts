import type { AxiosHeaders, InternalAxiosRequestConfig } from "axios";

const TOKEN_KEY = "auth_token_fallback";
const REFRESH_KEY = "auth_refresh_fallback";

export const isSafariIOS = (): boolean => {
  const ua = navigator.userAgent;

  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isWebKit = /WebKit/i.test(ua) && !/Chrome/i.test(ua);

  return isIOS && (isSafari || isWebKit);
};

/** Headers para que el API devuelva tokens en body (Safari / iOS / macOS WebKit). */
export function applyMobileAuthHeaders(
  config: InternalAxiosRequestConfig | { headers?: AxiosHeaders | Record<string, string> },
): void {
  if (!isSafariIOS()) return;

  const headers = config.headers ?? {};
  if (typeof (headers as AxiosHeaders).set === "function") {
    (headers as AxiosHeaders).set("X-Client-Platform", "mobile");
    (headers as AxiosHeaders).set("X-Include-Access-Token", "true");
  } else {
    const h = headers as Record<string, string>;
    h["X-Client-Platform"] = "mobile";
    h["X-Include-Access-Token"] = "true";
  }
}

export const saveTokenFallback = (token: string) => {
  if (!isSafariIOS()) return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    console.warn("No se pudo guardar access token en localStorage");
  }
};

export const saveRefreshFallback = (token: string) => {
  if (!isSafariIOS()) return;
  try {
    localStorage.setItem(REFRESH_KEY, token);
  } catch {
    console.warn("No se pudo guardar refresh token en localStorage");
  }
};

export const getTokenFallback = (): string | null => {
  if (!isSafariIOS()) return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const getRefreshFallback = (): string | null => {
  if (!isSafariIOS()) return null;
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
};

export const clearTokenFallback = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    console.warn("No se pudo limpiar tokens en localStorage");
  }
};

export const persistTokensFromAuthResponse = (data: {
  accessToken?: string;
  refreshToken?: string;
}) => {
  if (data.accessToken) saveTokenFallback(data.accessToken);
  if (data.refreshToken) saveRefreshFallback(data.refreshToken);
};
