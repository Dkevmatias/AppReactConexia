import { Lead, LeadPayload } from "../../services/leadsService";

import {
  EstatusCatalogo,
  Etapa,
  EtapaConfiguracion,
} from "../../services/crmService";

export const TABS_CREACION_CLIENTE = [
  { id: "general", label: "General" },
  { id: "direcciones", label: "Direcciones" },
  { id: "condicion-pago", label: "Condición Pago" },
  { id: "campos-usuario", label: "Campos de Usuario" },
  { id: "descuentos", label: "Descuentos" },
] as const;

export type TabCreacionClienteId = (typeof TABS_CREACION_CLIENTE)[number]["id"];

function normalizarNombreCatalogo(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function buscarEtapaPorNombre(etapas: Etapa[], nombre: string): number | null {
  const target = normalizarNombreCatalogo(nombre);
  const etapa = etapas.find(
    (e) => normalizarNombreCatalogo(e.nombre) === target,
  );
  return etapa?.idEtapa ?? null;
}

function buscarEstatusPorNombre(
  estatusLista: EstatusCatalogo[],
  nombre: string,
): number | null {
  const target = normalizarNombreCatalogo(nombre);
  const estatus = estatusLista.find(
    (e) => normalizarNombreCatalogo(e.nombre) === target,
  );
  return estatus?.idEstatus ?? null;
}

/** Etapas del funnel (orden). Si no hay funnel, se usan todas las del catálogo. */
export function etapasDelFunnel(
  etapas: Etapa[],
  funnel: EtapaConfiguracion[],
  idEtapaActual?: number | null,
): Etapa[] {
  const activos = funnel
    .filter((c) => {
      const e = (c.estatus ?? "").trim().toLowerCase();
      return e !== "i" && e !== "inactivo";
    })
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

  if (activos.length === 0) return etapas;

  const byId = new Map(etapas.map((e) => [e.idEtapa, e]));
  const ordered: Etapa[] = [];
  const seen = new Set<number>();

  for (const c of activos) {
    const etapa = byId.get(c.idEtapa);
    if (etapa && !seen.has(etapa.idEtapa)) {
      ordered.push(etapa);
      seen.add(etapa.idEtapa);
    }
  }

  if (idEtapaActual && !seen.has(idEtapaActual)) {
    const extra = byId.get(idEtapaActual);
    if (extra) ordered.push(extra);
  }

  return ordered.length > 0 ? ordered : etapas;
}
export function esEtapaCliente(
  idEtapa: number | null | undefined,
  etapas: Etapa[],
): boolean {
  if (idEtapa == null || idEtapa <= 0) return false;
  const etapa = etapas.find((e) => e.idEtapa === idEtapa);
  if (!etapa?.nombre?.trim()) return false;
  return normalizarNombreCatalogo(etapa.nombre) === "cliente";
}

export function leadVacio(): LeadPayload {
  return {
    nombre: "",
    aPaterno: "",
    aMaterno: "",
    telefono: "",
    correo: "",
    observaciones: "",
    unidad: "",
    campaign: "",
    idEntidadServicio: null,
    idUnidad: null,
    idEntidadCampaign: null,
    idFuente: null,
    idEstatus: null,
    idEtapa: null,
    idGrupo: null,
    idTemperatura: null,
    idUsuarioCreacion: null,
    idUsuarioAsignado: null,
    idUsuarioActualizacion: null,
    idEmpresa: null,
    idDependencia: null,
    idDependenciaAsignada: null,
    presupuesto: null,
    estado: "",
    ciudad: "",
    municipio: "",
    fechallegada: null,
  };
}

/** Valores iniciales al crear un prospecto nuevo. */
export function valoresDefectoNuevoProspecto(
  base: LeadPayload,
  etapas: Etapa[],
  estatusLista: EstatusCatalogo[],
): LeadPayload {
  return {
    ...base,
    idEtapa: buscarEtapaPorNombre(etapas, "Contacto") ?? base.idEtapa,
    idEstatus: buscarEstatusPorNombre(estatusLista, "Nuevo") ?? base.idEstatus,
    fechallegada: new Date().toISOString(),
  };
}

export function leadToForm(row: Lead): LeadPayload {
  return {
    nombre: row.nombre ?? "",
    aPaterno: row.aPaterno ?? "",
    aMaterno: row.aMaterno ?? "",
    telefono: soloDigitosTelefono(row.telefono ?? ""),
    correo: row.correo ?? "",
    observaciones: row.observaciones ?? "",
    unidad: row.unidad ?? "",
    campaign: row.campaign ?? "",
    idEntidadServicio: row.idEntidadServicio,
    idUnidad: row.idUnidad,
    idEntidadCampaign: row.idEntidadCampaign,
    idFuente: row.idFuente,
    idEstatus: row.idEstatus,
    idEtapa: row.idEtapa,
    idGrupo:
      row.idGrupo != null && Number(row.idGrupo) > 0
        ? Number(row.idGrupo)
        : null,
    idTemperatura: row.idTemperatura,
    idUsuarioCreacion: row.idUsuarioCreacion,
    idUsuarioAsignado: row.idUsuarioAsignado,
    idUsuarioActualizacion: row.idUsuarioActualizacion,
    idEmpresa: row.idEmpresa,
    idDependencia: row.idDependencia,
    idDependenciaAsignada: row.idDependenciaAsignada,
    presupuesto: row.presupuesto,
    estado: row.estado ?? "",
    ciudad: row.ciudad ?? "",
    municipio: row.municipio ?? "",
    fechallegada: row.fechallegada,
  };
}

export function prepararPayload(
  form: LeadPayload,
  idUsuario?: number,
): LeadPayload {
  const trim = (s: string | null) => {
    const t = (s ?? "").trim();
    return t || null;
  };
  return {
    ...form,
    nombre: trim(form.nombre),
    aPaterno: trim(form.aPaterno),
    aMaterno: trim(form.aMaterno),
    telefono: soloDigitosTelefono(form.telefono ?? ""),
    correo: trim(form.correo),
    observaciones: trim(form.observaciones),
    unidad: trim(form.unidad),
    campaign: trim(form.campaign),
    estado: trim(form.estado),
    ciudad: trim(form.ciudad),
    municipio: trim(form.municipio),
    idUsuarioActualizacion: idUsuario ?? form.idUsuarioActualizacion,
  };
}

export function fechaParaInput(valor: string | null): string {
  if (!valor) return "";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

/** Solo dígitos, máximo 10 (teléfonos de prospecto/cliente). */
export function soloDigitosTelefono(valor: string, max = 10): string {
  return (valor ?? "").replace(/\D/g, "").slice(0, max);
}

/** Correo vacío = válido (opcional); si hay texto, debe tener formato de email. */
export function esCorreoValido(valor: string | null | undefined): boolean {
  const t = (valor ?? "").trim();
  if (!t) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(t);
}

export const prospectoInputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";

export const prospectoLabelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

/** Borde/fondo ámbar cuando falta un dato obligatorio tras intentar guardar. */
export function prospectoInputClassError(invalido: boolean): string {
  if (!invalido) return prospectoInputClass;
  return `${prospectoInputClass} border-amber-500 bg-amber-50 ring-1 ring-amber-400 focus:border-amber-500 focus:ring-amber-400 dark:border-amber-500 dark:bg-amber-950/40 dark:focus:border-amber-400`;
}

export function prospectoLabelClassError(invalido: boolean): string {
  if (!invalido) return prospectoLabelClass;
  return `${prospectoLabelClass} text-amber-800 dark:text-amber-300`;
}
