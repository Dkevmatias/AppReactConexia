/* NOMCONEXIA-UNIFY */
import { api, asArray, apiError } from "./apiServices";

export interface SolicitudAusencia {
  idSolicitud: number;
  idEmpresa: number;
  empresaNombre?: string | null;
  idEmpleado: number;
  empleadoNombre?: string | null;
  idJefe?: number | null;
  jefeNombre?: string | null;
  tipo: string;
  fechaInicio: string;
  fechaFin?: string | null;
  dias: number;
  comentario?: string | null;
  estatus: string;
  origen: string;
  idIncidencia?: number | null;
  autorizadoPor?: string | null;
  fechaAutorizacion?: string | null;
  rechazoMotivo?: string | null;
  creadoPor?: string | null;
  fechaCreacion: string;
}

export interface SolicitudAusenciaCreate {
  idEmpresa: number;
  idEmpleado: number;
  tipo: "VAC" | "PERMISO";
  fechaInicio: string;
  fechaFin?: string | null;
  dias?: number | null;
  comentario?: string | null;
  origen: "EMPLEADO" | "RH";
  creadoPor?: string | null;
}

export interface SolicitudAusenciaFilters {
  idEmpresa?: number;
  idEmpleado?: number;
  idJefe?: number;
  estatus?: string;
  tipo?: string;
}

export function esSolicitudPendiente(estatus?: string | null) {
  return (estatus || "").toUpperCase() === "SOLICITADA";
}

export function etiquetaTipoSolicitud(tipo?: string | null) {
  const t = (tipo || "").toUpperCase();
  if (t === "VAC") return "Vacaciones";
  if (t === "PERMISO") return "Permiso sin goce";
  return tipo || "";
}

export function etiquetaEstatusSolicitud(estatus?: string | null) {
  const e = (estatus || "").toUpperCase();
  if (e === "SOLICITADA") return "Por autorizar";
  if (e === "AUTORIZADA") return "Autorizada";
  if (e === "RECHAZADA") return "Rechazada";
  if (e === "CANCELADA") return "Cancelada";
  return estatus || "";
}

export const solicitudAusenciaService = {
  getSolicitudes: async (filters?: SolicitudAusenciaFilters): Promise<SolicitudAusencia[]> => {
    const params: Record<string, string> = {};
    if (filters?.idEmpresa) params.idEmpresa = String(filters.idEmpresa);
    if (filters?.idEmpleado) params.idEmpleado = String(filters.idEmpleado);
    if (filters?.idJefe) params.idJefe = String(filters.idJefe);
    if (filters?.estatus) params.estatus = filters.estatus;
    if (filters?.tipo) params.tipo = filters.tipo;
    const res = await api.get("/api/SolicitudesAusencia", { params });
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudieron cargar las solicitudes"));
    return asArray<SolicitudAusencia>(res.data);
  },

  create: async (dto: SolicitudAusenciaCreate): Promise<SolicitudAusencia> => {
    const res = await api.post<SolicitudAusencia>("/api/SolicitudesAusencia", dto);
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo registrar la solicitud"));
    return res.data;
  },

  autorizar: async (id: number, usuario?: string): Promise<SolicitudAusencia> => {
    const res = await api.put<SolicitudAusencia>(`/api/SolicitudesAusencia/${id}/autorizar`, { usuario });
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo autorizar"));
    return res.data;
  },

  rechazar: async (id: number, motivo: string, usuario?: string): Promise<SolicitudAusencia> => {
    const res = await api.put<SolicitudAusencia>(`/api/SolicitudesAusencia/${id}/rechazar`, { motivo, usuario });
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo rechazar"));
    return res.data;
  },

  cancelar: async (id: number, usuario?: string): Promise<SolicitudAusencia> => {
    const res = await api.put<SolicitudAusencia>(`/api/SolicitudesAusencia/${id}/cancelar`, { usuario });
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo cancelar"));
    return res.data;
  },
};
