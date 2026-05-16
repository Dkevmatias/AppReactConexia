import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { permisoActivo } from "../utils/permisosModulo";

const CLAVE_MODULO = "Entrega";
const PERMISO_VER = "Entrega.Ver";
const PERMISO_DESCARGAR = "Entrega.Descargar";
const PERMISO_OPERAR = "Entrega.Operar";

export function useEntregaPremisos() {
  const { menu, menuLoading } = useAuth();

  return useMemo(() => {
    const modulo = menu.find(
      (m) => (m.clave ?? "").trim().toLowerCase() === CLAVE_MODULO.toLowerCase(),
    );
    const permisos = modulo?.permisos;

    const tieneVer = permisoActivo(permisos, PERMISO_VER);
    const tieneDescargar = permisoActivo(permisos, PERMISO_DESCARGAR);
    const tieneOperar = permisoActivo(permisos, PERMISO_OPERAR);

    const puedeOperar = tieneOperar;
    const puedeDescargar = tieneOperar || tieneDescargar;
    const puedeAccederModulo = Boolean(
      modulo?.activo && (tieneVer || tieneDescargar || tieneOperar),
    );

    return {
      menuLoading,
      puedeAccederModulo,
      puedeOperar,
      puedeDescargar,
      /** Ver, descargar u operar pueden refrescar datos desde el servidor. */
      puedeRefrescarListado: puedeAccederModulo,
    };
  }, [menu, menuLoading]);
}
