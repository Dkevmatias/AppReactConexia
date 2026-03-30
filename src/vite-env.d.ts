/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL pública del sitio, sin barra final (ej: https://tudominio.com). Mejora enlaces Open Graph / WhatsApp. */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
