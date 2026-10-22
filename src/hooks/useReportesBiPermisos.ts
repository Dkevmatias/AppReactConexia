import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { permisoActivo } from "../utils/permisosModulo";

export const CLAVE_MODULO_REPORTES_BI = "Dashboard.Reportes";
export const PERMISO_BI_VENDEDORES = "Reporte.BIVendedores";
export const PERMISO_BI_POR_SURTIR = "Reporte.BIPorSurtir";
export const PERMISO_BI_TENDENCIA_COMPRA = "Reporte.BITendenciaCompraCliente";

const PERMISOS_TAB_ESPECIFICOS = [
  PERMISO_BI_VENDEDORES,
  PERMISO_BI_POR_SURTIR,
  PERMISO_BI_TENDENCIA_COMPRA,
] as const;

function claveNorm(clave: string | null | undefined): string {
  return (clave ?? "").trim().toLowerCase();
}

export function useReportesBiPermisos() {
  const { menu, menuLoading } = useAuth();

  return useMemo(() => {
    const puede = (clave: string) =>
      menu.some((m) => m.activo && permisoActivo(m.permisos, clave));

    const modulo = menu.find(
      (m) => m.activo && claveNorm(m.clave) === claveNorm(CLAVE_MODULO_REPORTES_BI),
    );
    const especificos = new Set(
      PERMISOS_TAB_ESPECIFICOS.map((c) => claveNorm(c)),
    );
    const tieneAccesoCompleto = (modulo?.permisos ?? []).some((p) => {
      if (!p.activo) return false;
      return !especificos.has(claveNorm(p.clave));
    });

    const puedeVendedores = puede(PERMISO_BI_VENDEDORES) || tieneAccesoCompleto;
    const puedePorSurtir = puede(PERMISO_BI_POR_SURTIR) || tieneAccesoCompleto;
    const puedeTendenciaCompra =
      puede(PERMISO_BI_TENDENCIA_COMPRA) || tieneAccesoCompleto;

    return {
      menuLoading,
      tieneAccesoCompleto,
      puedeVendedores,
      puedePorSurtir,
      puedeTendenciaCompra,
      puedeVerTab: (tabId: string) => {
        if (tabId === "vendedores") return puedeVendedores;
        if (tabId === "por-surtir") return puedePorSurtir;
        if (tabId === "tendencia-compra") return puedeTendenciaCompra;
        return tieneAccesoCompleto;
      },
    };
  }, [menu, menuLoading]);
}
