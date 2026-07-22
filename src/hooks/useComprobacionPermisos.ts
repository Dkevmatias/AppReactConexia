import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { permisoActivo } from "../utils/permisosModulo";

const PERMISO_VER = "Comprobacion.ver";
const PERMISO_OPERAR = "Comprobacion.Operar";
/** Clave exacta a crear en BD para ver montos/totales cobrados. */
const PERMISO_VER_TOTALES = "Ver.Totales";

function esModuloOperaciones(clave: string | null | undefined): boolean {
  const c = (clave ?? "").trim().toLowerCase();
  return c === "bitacora" || c === "bitacora.cobranza" || c === "operaciones";
}

export function useComprobacionPermisos() {
  const { menu, menuLoading } = useAuth();

  return useMemo(() => {
    const modulo = menu.find((m) => esModuloOperaciones(m.clave));
    const permisos = modulo?.permisos;

    const tieneVer = permisoActivo(permisos, PERMISO_VER);
    const tieneOperar = permisoActivo(permisos, PERMISO_OPERAR);
    const tieneVerTotales = permisoActivo(permisos, PERMISO_VER_TOTALES);

    return {
      menuLoading,
      puedeVer: Boolean(modulo?.activo && (tieneVer || tieneOperar)),
      puedeOperar: Boolean(modulo?.activo && tieneOperar),
      /** Totales / montos cobrados en detalle de orden. */
      puedeVerTotales: Boolean(modulo?.activo && tieneVerTotales),
    };
  }, [menu, menuLoading]);
}
