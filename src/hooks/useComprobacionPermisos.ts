import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { permisoActivo } from "../utils/permisosModulo";

const PERMISO_VER = "Comprobacion.ver";
const PERMISO_OPERAR = "Comprobacion.Operar";
/** Clave exacta a crear en BD para ver montos/totales cobrados. */
const PERMISO_VER_TOTALES = "Ver.Totales";
/** Botones del modal detalle de orden. */
const PERMISO_BTN_REVISAR = "Comprobacion.Btn.Revisar";
const PERMISO_BTN_FINALIZAR = "Comprobacion.Btn.Finalizar";
const PERMISO_BTN_GENERAR = "Comprobacion.Btn.Generar";

function esModuloOperaciones(clave: string | null | undefined): boolean {
  const c = (clave ?? "").trim().toLowerCase();
  return c === "bitacora" || c === "bitacora.cobranza" || c === "operaciones";
}

export function useComprobacionPermisos() {
  const { menu, menuLoading } = useAuth();

  return useMemo(() => {
    const modulo = menu.find((m) => esModuloOperaciones(m.clave));
    const permisos = modulo?.permisos;
    const moduloActivo = Boolean(modulo?.activo);

    const tieneVer = permisoActivo(permisos, PERMISO_VER);
    const tieneOperar = permisoActivo(permisos, PERMISO_OPERAR);
    const tieneVerTotales = permisoActivo(permisos, PERMISO_VER_TOTALES);
    const tieneBtnRevisar = permisoActivo(permisos, PERMISO_BTN_REVISAR);
    const tieneBtnFinalizar = permisoActivo(permisos, PERMISO_BTN_FINALIZAR);
    const tieneBtnGenerar = permisoActivo(permisos, PERMISO_BTN_GENERAR);

    return {
      menuLoading,
      puedeVer: Boolean(moduloActivo && (tieneVer || tieneOperar)),
      puedeOperar: Boolean(moduloActivo && tieneOperar),
      /** Totales / montos cobrados en detalle de orden. */
      puedeVerTotales: Boolean(moduloActivo && tieneVerTotales),
      /** Botón R. Cobranza (revisión cobranza). */
      puedeBtnRevisar: Boolean(moduloActivo && tieneBtnRevisar),
      /** Botón Finalizado. */
      puedeBtnFinalizar: Boolean(moduloActivo && tieneBtnFinalizar),
      /** Botón Generar Corte. */
      puedeBtnGenerar: Boolean(moduloActivo && tieneBtnGenerar),
    };
  }, [menu, menuLoading]);
}
