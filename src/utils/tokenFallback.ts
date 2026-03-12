const TOKEN_KEY = 'auth_token_fallback';

export const isSafariIOS = (): boolean => {
  const ua = navigator.userAgent;
  
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  const isWebKit = /WebKit/i.test(ua) && !/Chrome/i.test(ua);
  
  return isIOS && (isSafari || isWebKit);
};

export const saveTokenFallback = (token: string) => {
  if (isSafariIOS()) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('No se pudo guardar token en localStorage');
    }
  }
};

export const getTokenFallback = (): string | null => {
  if (isSafariIOS()) {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const clearTokenFallback = () => {
  if (isSafariIOS()) {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.warn('No se pudo eliminar token de localStorage');
    }
  }
};
