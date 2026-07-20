import type { Permiso } from "../types";

/** Misma semántica que el sidebar: compara claves en minúsculas. */
export function permisoActivo(
  permisos: Pick<Permiso, "clave" | "activo">[] | undefined,
  clavePermiso: string,
): boolean {
  const target = clavePermiso.trim().toLowerCase();
  return (permisos ?? []).some((p) => {
    const c = (p.clave ?? "").trim().toLowerCase();
    return p.activo && c === target;
  });
}

/** True si hay permiso activo por clave o por ruta del permiso. */
export function permisoActivoPorClaveORuta(
  permisos:
    | Pick<Permiso, "clave" | "activo" | "ruta">[]
    | undefined,
  opciones: {
    claves?: string[];
    ruta?: string;
  },
): boolean {
  const claves = (opciones.claves ?? []).map((c) => c.trim().toLowerCase());
  const rutaObjetivo = (opciones.ruta ?? "").trim().toLowerCase();

  return (permisos ?? []).some((p) => {
    if (!p.activo) return false;
    const clave = (p.clave ?? "").trim().toLowerCase();
    if (clave && claves.includes(clave)) return true;
    const rutaPermiso = (p.ruta ?? "").trim().toLowerCase();
    if (rutaObjetivo && rutaPermiso && rutaPermiso === rutaObjetivo) {
      return true;
    }
    return false;
  });
}
