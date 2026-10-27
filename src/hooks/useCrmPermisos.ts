import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { permisoActivo } from "../utils/permisosModulo";
import type { Modulo } from "../types";

export const PERMISO_CRM_TOTAL = "CRM.TOTAL";
export const PERMISO_CRM_VER = "CRM.Ver";
export const PERMISO_CRM_VER_PROSPECTOS = "CRM.Ver.Prospectos";
export const PERMISO_CRM_VER_SEGUIMIENTOS = "CRM.Ver.Seguimientos";
export const PERMISO_CRM_VER_CLIENTES = "CRM.Ver.Clientes";
/** Clave tal como se registra en backend (typo Catalagos). */
export const PERMISO_CRM_VER_CATALOGOS = "CRM.Ver.Catalagos";
export const PERMISO_CRM_VER_CATALOGOS_ALT = "CRM.Ver.Catalogos";
export const PERMISO_CRM_OPERAR_CONFIGURACION = "CRM.Operar.Configuracion";
export const PERMISO_CRM_OPERAR_PROSPECTOS = "CRM.Operar.Prospectos";
export const PERMISO_CRM_OPERAR_SEGUIMIENTOS = "CRM.Operar.Seguimientos";
export const PERMISO_CRM_OPERAR_CLIENTES = "CRM.Operar.Clientes";
export const PERMISO_CRM_OPERAR_CATALOGOS = "CRM.Operar.Catalagos";
export const PERMISO_CRM_OPERAR_CATALOGOS_ALT = "CRM.Operar.Catalogos";
export const PERMISO_CRM_CREAR_PROSPECTO = "CRM.Crear.Prospecto";
export const PERMISO_CRM_CREAR_CLIENTE = "CRM.Crear.Cliente";
export const PERMISO_CRM_EDITAR_CLIENTE = "CRM.Editar.Cliente";
export const PERMISO_CRM_CREAR_DESCUENTOS = "CRM.Crear.Descuentos";
export const PERMISO_CRM_ENVIAR_CLIENTE = "CRM.Enviar.Cliente";
export const PERMISO_CRM_ENVIAR_DESCUENTO = "CRM.Enviar.Descuento";
export const PERMISO_CRM_ASIGNAR_PROSPECTO = "CRM.Asignar.Prospecto";
export const PERMISO_CRM_REASIGNAR_PROSPECTO = "CRM.ReAsignar.Prospecto";

function claveNorm(clave: string | null | undefined): string {
  return (clave ?? "").trim().toLowerCase();
}

type MenuModulo = Pick<Modulo, "activo" | "clave" | "permisos">;

/**
 * Permisos del módulo CRM.
 * `CRM.TOTAL` (admin) equivale a todos los permisos CRM.* .
 * Ver = consultar el submenu. Operar = crear/editar/eliminar en ese submenu.
 */
export function crmPermisosDesdeMenu(menu: MenuModulo[]) {
  const tieneTotal = menu.some(
    (m) => m.activo && permisoActivo(m.permisos, PERMISO_CRM_TOTAL),
  );
  const puede = (clave: string) =>
    tieneTotal ||
    menu.some((m) => m.activo && permisoActivo(m.permisos, clave));
  const puedeAlguna = (...claves: string[]) => claves.some((c) => puede(c));

  const verGeneral = puede(PERMISO_CRM_VER);

  const puedeOperarProspectos = puede(PERMISO_CRM_OPERAR_PROSPECTOS);
  const puedeOperarSeguimientos = puede(PERMISO_CRM_OPERAR_SEGUIMIENTOS);
  const puedeOperarClientes = puede(PERMISO_CRM_OPERAR_CLIENTES);
  const puedeOperarCatalogos = puedeAlguna(
    PERMISO_CRM_OPERAR_CATALOGOS,
    PERMISO_CRM_OPERAR_CATALOGOS_ALT,
  );
  const puedeOperarConfiguracion = puede(PERMISO_CRM_OPERAR_CONFIGURACION);

  const puedeCrearProspecto =
    puede(PERMISO_CRM_CREAR_PROSPECTO) || puedeOperarProspectos;
  const puedeCrearCliente =
    puede(PERMISO_CRM_CREAR_CLIENTE) ||
    puedeOperarClientes ||
    puedeOperarProspectos;
  /** Corregir datos de un cliente aún no enviado a SAP (p. ej. jefatura). */
  const puedeEditarCliente =
    puede(PERMISO_CRM_EDITAR_CLIENTE) || puedeCrearCliente;
  const puedeCrearDescuentos =
    puede(PERMISO_CRM_CREAR_DESCUENTOS) ||
    puedeOperarClientes ||
    puedeOperarProspectos;
  const puedeEnviarCliente = puede(PERMISO_CRM_ENVIAR_CLIENTE);
  const puedeEnviarDescuento = puede(PERMISO_CRM_ENVIAR_DESCUENTO);
  const puedeAsignarProspecto = puede(PERMISO_CRM_ASIGNAR_PROSPECTO);
  const puedeReasignarProspecto = puede(PERMISO_CRM_REASIGNAR_PROSPECTO);

  const puedeVerProspectos =
    puede(PERMISO_CRM_VER_PROSPECTOS) ||
    puedeOperarProspectos ||
    puedeCrearProspecto ||
    puedeCrearCliente ||
    puedeEditarCliente ||
    puedeCrearDescuentos ||
    puedeEnviarCliente ||
    puedeEnviarDescuento ||
    puedeAsignarProspecto ||
    puedeReasignarProspecto;

  const puedeVerSeguimientos =
    puede(PERMISO_CRM_VER_SEGUIMIENTOS) || puedeOperarSeguimientos;

  const puedeVerClientes =
    puede(PERMISO_CRM_VER_CLIENTES) ||
    puedeOperarClientes ||
    puedeCrearCliente ||
    puedeEditarCliente ||
    puedeEnviarCliente ||
    puedeEnviarDescuento;

  const puedeVerCatalogos =
    puedeAlguna(PERMISO_CRM_VER_CATALOGOS, PERMISO_CRM_VER_CATALOGOS_ALT) ||
    puedeOperarCatalogos;

  const puedeVerConfiguracion = puedeOperarConfiguracion;

  const puedeRegistrarSeguimiento =
    puedeOperarSeguimientos ||
    puedeOperarProspectos ||
    puede(PERMISO_CRM_CREAR_PROSPECTO);

  const puedeEliminarProspecto = puedeOperarProspectos;

  const puedeUsarCrm =
    tieneTotal ||
    puedeVerProspectos ||
    puedeVerSeguimientos ||
    puedeVerClientes ||
    puedeVerCatalogos ||
    puedeVerConfiguracion ||
    menu.some(
      (m) =>
        m.activo &&
        claveNorm(m.clave) === "crm" &&
        (m.permisos ?? []).some((p) => p.activo),
    );

  return {
    tieneTotal,
    puede,
    puedeVer: verGeneral,
    puedeVerProspectos,
    puedeVerSeguimientos,
    puedeVerClientes,
    puedeVerCatalogos,
    puedeVerConfiguracion,
    puedeOperarProspectos,
    puedeOperarSeguimientos,
    puedeOperarClientes,
    puedeOperarCatalogos,
    puedeOperarConfiguracion,
    puedeCrearProspecto,
    puedeCrearCliente,
    puedeEditarCliente,
    puedeCrearDescuentos,
    puedeEnviarCliente,
    puedeEnviarDescuento,
    puedeAsignarProspecto,
    puedeReasignarProspecto,
    puedeRegistrarSeguimiento,
    puedeEliminarProspecto,
    puedeUsarCrm,
  };
}

export function useCrmPermisos() {
  const { menu, menuLoading } = useAuth();

  return useMemo(
    () => ({ menuLoading, ...crmPermisosDesdeMenu(menu) }),
    [menu, menuLoading],
  );
}
