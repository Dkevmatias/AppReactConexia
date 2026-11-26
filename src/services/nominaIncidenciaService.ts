/* NOMCONEXIA-UNIFY */
import { api, asArray } from "./apiServices";

export interface Incidencia {
  idIncidencia: number;
  idEmpleado: number;
  idEmpresa: number;
  empleadoNombre: string;
  empresaNombre: string;
  tipoIncidencia: string;
  tipoIncidenciaDescripcion?: string | null;
  fechaInicio: string;
  fechaFin: string | null;
  cantidad: number | null;
  monto: number | null;
  afectaNomina: boolean;
  tipoMovimiento: string;
  descripcion: string | null;
  estatus: string;
  fechaCreacion: string;
  creadoPor: string | null;
  fechaAplicacion: string | null;
}

export interface IncidenciaCreate {
  idEmpleado: number;
  idEmpresa: number;
  tipoIncidencia: string;
  fechaInicio: string;
  fechaFin?: string | null;
  cantidad?: number | null;
  monto?: number | null;
  afectaNomina: boolean;
  tipoMovimiento: string;
  descripcion?: string | null;
}

export interface IncidenciaUpdate extends IncidenciaCreate {
  idIncidencia: number;
}

export interface TipoIncidencia {
  idTipoIncidencia: number;
  clave: string | null;
  descripcion: string | null;
  tipoMovimiento: string | null;
  requiereCantidad: boolean | null;
  requiereMonto: boolean | null;
  activo: boolean | null;
}

export interface IncidenciaFilters {
  idEmpresa?: number;
  idEmpleado?: number;
  estatus?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface IncidenciaMasivaResult {
  creados: number;
  errores: number;
  message: string;
  mensajes: string[];
}

export function esIncidenciaPendiente(estatus?: string | null) {
  return (estatus || "").toUpperCase() === "PENDIENTE";
}

export function impactoIncidencia(tipo: string, afectaNomina: boolean): string {
  if (!afectaNomina) return "Informativa (no entra a nómina)";
  const t = (tipo || "").toUpperCase();
  if (t === "RETARDO") return "Quita bono de puntualidad si rebasa el máximo";
  if (t === "FALTA" || t === "PERMISO") return "Descuenta sueldo, días IMSS y bono de asistencia";
  if (t === "INCAPACIDAD" || t === "INCAP") return "Marca días de incapacidad (no corta sueldo)";
  if (t === "HORAS_EXTRA" || t === "HE") return "Suma el monto a horas extra al generar renglones";
  if (t === "VAC") return "Vacaciones: usar la pestaña del empleado";
  if (t === "PRIMA") return "Prima vacacional si el empleado no trae prima capturada";
  return "Entra al cálculo si está aplicada";
}

export const nominaIncidenciaService = {
  getIncidencias: async (filters?: IncidenciaFilters): Promise<Incidencia[]> => {
    const params: Record<string, string> = {};
    if (filters?.idEmpresa) params.idEmpresa = filters.idEmpresa.toString();
    if (filters?.idEmpleado) params.idEmpleado = filters.idEmpleado.toString();
    if (filters?.estatus) params.estatus = filters.estatus;
    if (filters?.fechaInicio) params.fechaInicio = filters.fechaInicio;
    if (filters?.fechaFin) params.fechaFin = filters.fechaFin;

    const res = await api.get("/api/NominaIncidencias", { params });
    return asArray<Incidencia>(res.data);
  },

  getIncidencia: async (id: number): Promise<Incidencia> => {
    const res = await api.get<Incidencia>(`/api/NominaIncidencias/${id}`);
    return res.data;
  },

  createIncidencia: async (incidencia: IncidenciaCreate): Promise<Incidencia> => {
    const res = await api.post<Incidencia>("/api/NominaIncidencias", incidencia);
    return res.data;
  },

  createMasiva: async (items: IncidenciaCreate[]): Promise<IncidenciaMasivaResult> => {
    const res = await api.post<IncidenciaMasivaResult>("/api/NominaIncidencias/masiva", items);
    return res.data;
  },

  updateIncidencia: async (incidencia: IncidenciaUpdate): Promise<void> => {
    await api.put("/api/NominaIncidencias", incidencia);
  },

  deleteIncidencia: async (id: number): Promise<void> => {
    await api.delete(`/api/NominaIncidencias/${id}`);
  },

  aplicarIncidencia: async (id: number): Promise<void> => {
    await api.put(`/api/NominaIncidencias/Aplicar/${id}`);
  },

  cancelarIncidencia: async (id: number): Promise<void> => {
    await api.put(`/api/NominaIncidencias/Cancelar/${id}`);
  },

  getTiposIncidencia: async (): Promise<TipoIncidencia[]> => {
    const res = await api.get("/api/NominaIncidencias/tipos");
    return asArray<TipoIncidencia>(res.data);
  },
};

export const incidenciaService = nominaIncidenciaService;
