/** Ruta por defecto cuando el rol no tiene entrada explícita ni ruta desde API */
export const DEFAULT_POST_LOGIN_PATH = "/dashboard/Home";

/**
 * Destino inicial de respaldo según idRol (solo si `defaultRoute` del rol no viene en Login/CheckAuth).
 */
const POST_LOGIN_BY_ROLE: Record<number, string> = {
  6: "/configPage/Respuesta",
  2: "/ventas/articulos",
};

function getPostLoginPath(role: number): string {
  return POST_LOGIN_BY_ROLE[role] ?? DEFAULT_POST_LOGIN_PATH;
}

/** Evita open redirect si el API devolviera algo raro */
function normalizeServerRoute(route: string | null | undefined): string | null {
  if (route == null || typeof route !== "string") return null;
  const t = route.trim();
  if (!t || !t.startsWith("/")) return null;
  if (t.includes("..") || t.includes("//")) return null;
  return t;
}

/**
 * Prioridad: columna del rol en API → mapa local por idRol → home genérico.
 */
export function resolvePostLoginPath(
  role: number,
  serverRoute?: string | null,
): string {
  const fromApi = normalizeServerRoute(serverRoute ?? undefined);
  if (fromApi) return fromApi;
  return getPostLoginPath(role);
}
