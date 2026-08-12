import { Lead, LeadPayload } from "../../services/leadsService";

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

export function leadToForm(row: Lead): LeadPayload {
  return {
    nombre: row.nombre ?? "",
    aPaterno: row.aPaterno ?? "",
    aMaterno: row.aMaterno ?? "",
    telefono: row.telefono ?? "",
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
      row.idGrupo != null && Number(row.idGrupo) > 0 ? Number(row.idGrupo) : null,
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
    telefono: trim(form.telefono),
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

export const prospectoInputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";

export const prospectoLabelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";
