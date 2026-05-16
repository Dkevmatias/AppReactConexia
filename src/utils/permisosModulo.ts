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
