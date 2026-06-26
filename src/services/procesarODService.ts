import { api } from "./apiServices";

export interface ProcesarODPayload {
  idODistribucion: number;
  idUsuarioCreacion: number;
  idEmpresa: number;
  idSucursal: number;
  observaciones: string;
  estatus: string;
  activo: boolean;
}

export const OBSERVACIONES_SIN_INCIDENCIAS_RUTA = "Sin Incidencias en Ruta";
export const ESTATUS_PROCESADO = "T";
export const ESTATUS_PENDIENTE = "P";

function errorDesdeRespuesta(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.mensaje === "string" && o.mensaje) return o.mensaje;
  }
  return fallback;
}

function assertOk<T>(
  response: { status: number; data: T },
  fallback: string,
): T {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(errorDesdeRespuesta(response.data, fallback));
  }
  return response.data;
}

export const procesarODService = {
  crear: async (payload: ProcesarODPayload): Promise<unknown> => {
    const response = await api.post<unknown>("/api/ProcesarOD", payload);
    return assertOk(response, "No se pudo registrar la orden sin incidencias.");
  },
};
