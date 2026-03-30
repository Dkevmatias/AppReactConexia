/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL pública del sitio, sin barra final (ej: https://tudominio.com). Mejora enlaces Open Graph / WhatsApp. */
  readonly VITE_SITE_URL?: string;
  /** ID del video de YouTube (Short o normal): solo el ID, ej. abc123 del enlace youtube.com/shorts/abc123 */
  readonly VITE_YOUTUBE_VIDEO_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
