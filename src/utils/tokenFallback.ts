const IS_SAFARI_IOS = /^((?!chrome|android).)*safari/i.test(navigator.userAgent) && 
  /iPad|iPhone|iPod/.test(navigator.userAgent);

const TOKEN_KEY = 'auth_token_fallback';

export const isSafariIOS = () => IS_SAFARI_IOS;

export const saveTokenFallback = (token: string) => {
  if (IS_SAFARI_IOS) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.warn('No se pudo guardar token en localStorage');
    }
  }
};

export const getTokenFallback = (): string | null => {
  if (IS_SAFARI_IOS) {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const clearTokenFallback = () => {
  if (IS_SAFARI_IOS) {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.warn('No se pudo eliminar token de localStorage');
    }
  }
};
