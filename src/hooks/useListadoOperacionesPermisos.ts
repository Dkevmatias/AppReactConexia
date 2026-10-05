import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { permisoActivo } from "../utils/permisosModulo";

const PERMISO_LISTADO_COBRANZA = "ListadoCobranza.Btn.Ver";
const PERMISO_LISTADO_INCIDENCIA = "ListadoIncidencia.Btn.Ver";

export function useListadoOperacionesPermisos() {
  const { menu, menuLoading } = useAuth();

  return useMemo(() => {
    const puede = (clave: string) =>
      menu.some((m) => m.activo && permisoActivo(m.permisos, clave));

    return {
      menuLoading,
      puedeVerSucursalCobranza: puede(PERMISO_LISTADO_COBRANZA),
      puedeVerSucursalIncidencia: puede(PERMISO_LISTADO_INCIDENCIA),
    };
  }, [menu, menuLoading]);
}
