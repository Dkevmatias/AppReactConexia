const TOKEN_KEY = 'auth_token_fallback';

export const isSafariIOS = (): boolean => {
  const ua = navigator.userAgent;
  
  // Detectar cualquier dispositivo iOS
  const isIOS = /iPad|iPhone|iPod/.test(ua) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  
  // Detectar Safari (incluye iPhone 15 Pro)
  const isSafari = /Safari/i.test(ua) && !/Chrome/i.test(ua);
  
  // Detectar si es WebKit en iOS (todos los navegadores en iOS usan WebKit)
  const isWebKit = /WebKit/i.test(ua) && !/Chrome/i.test(ua);
  
  // En iOS, todos los navegadores (Chrome, Firefox, etc) usan WebKit y tienen las mismas restricciones
  const isIOSBrowser = isIOS && (isSafari || isWebKit);
  
  console.log('[TokenFallback] Detección - ua:', ua);
  console.log('[TokenFallback] isIOS:', isIOS, 'isSafari:', isSafari, 'isWebKit:', isWebKit);
  
  return isIOSBrowser;
};

export const saveTokenFallback = (token: string) => {
  console.log('[TokenFallback] Intentando guardar token para Safari iOS:', isSafariIOS());
  if (isSafariIOS()) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      console.log('[TokenFallback] Token guardado exitosamente, longitud:', token.length);
    } catch (e) {
      console.warn('[TokenFallback] No se pudo guardar token en localStorage', e);
    }
  } else {
    console.log('[TokenFallback] No es iOS, no se guarda fallback');
  }
};

export const getTokenFallback = (): string | null => {
  if (isSafariIOS()) {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      console.log('[TokenFallback] Token obtenido:', token ? `EXISTE (${token.length} chars)` : 'NULO');
      return token;
    } catch (e) {
      console.warn('[TokenFallback] Error al obtener token', e);
      return null;
    }
  }
  console.log('[TokenFallback] No es iOS, retornando null');
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
