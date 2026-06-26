import { api } from "./apiServices";

export interface TipoIncidencia {
  idTipoIncidencia: number;
  nombre: string;
  activo?: boolean;
}

export interface IncidenciaCreatePayload {
  idTipoIncidencia: number;
  idOrdenEntrega: number;
  idODistribucion: number;
  idUsuarioCreacion: number;
  idEmpresa: number;
  idSucursal: number;
  observaciones: string;
  estatus: string;
  activo: boolean;
}

export interface IncidenciaDetalleLineaPayload {
  articulo: string;
  descripcion: string;
  cantidad: number;
  estado: string;
  observaciones: string;
}

/** Tipo sin detalle de artículos (estatus D al crear). */
export const TIPO_INCIDENCIA_SIN_DETALLE = 1;

export function resolverEstatusIncidencia(idTipoIncidencia: number): string {
  if (idTipoIncidencia === TIPO_INCIDENCIA_SIN_DETALLE) return "D";
  return "P";
}

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

function pickNumber(
  o: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return null;
}

function pickString(
  o: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickBool(
  o: Record<string, unknown>,
  ...keys: string[]
): boolean | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "boolean") return v;
  }
  return undefined;
}

function normalizeTipoIncidencia(raw: unknown): TipoIncidencia {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    idTipoIncidencia:
      pickNumber(
        o,
        "idTipoIncidencia",
        "IdTipoIncidencia",
        "id",
        "Id",
      ) ?? 0,
    nombre:
      pickString(o, "nombre", "Nombre", "descripcion", "Descripcion") ?? "",
    activo: pickBool(o, "activo", "Activo"),
  };
}

function normalizeTipoIncidenciaList(raw: unknown): TipoIncidencia[] {
  if (Array.isArray(raw)) {
    return raw.map(normalizeTipoIncidencia).filter((t) => t.idTipoIncidencia > 0);
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["data", "items", "tipos", "resultado"]) {
      const list = o[key];
      if (Array.isArray(list)) {
        return list
          .map(normalizeTipoIncidencia)
          .filter((t) => t.idTipoIncidencia > 0);
      }
    }
  }
  return [];
}

export const ESTADOS_ARTICULO_INCIDENCIA = [
  "Pendiente",
  "Dañado",
  "Faltante",
  "Sobrante",
  "Rechazado",
  "Correcto",
] as const;

export type EstadoArticuloIncidencia =
  (typeof ESTADOS_ARTICULO_INCIDENCIA)[number];

export const incidenciaService = {
  getTiposActivos: async (): Promise<TipoIncidencia[]> => {
    const response = await api.get<unknown>(
      "/api/TipoIncidencia?soloActivos=true",
    );
    return normalizeTipoIncidenciaList(
      assertOk(response, "No se pudieron cargar los tipos de incidencia."),
    );
  },

  crearIncidencia: async (
    payload: IncidenciaCreatePayload,
  ): Promise<unknown> => {
    const response = await api.post<unknown>("/api/Incidencias", payload);
    return assertOk(response, "No se pudo guardar la incidencia.");
  },
};
