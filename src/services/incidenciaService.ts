import { api } from "./apiServices";

export interface TipoIncidencia {
  idTipoIncidencia: number;
  nombre: string;
  activo?: boolean;
}

export interface IncidenciaDetallePayload {
  idOrdenEntrega: number;
  itemCode: string;
  itemName: string;
  cantidad: number;
  idEstado: number;
  vendedor: string;
  observaciones: string;
  estatus: string;
  activo: boolean;
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
  detalles?: IncidenciaDetallePayload[];
}

/** Tipo sin detalle de artículos (estatus D al crear). */
export const TIPO_INCIDENCIA_SIN_DETALLE = 1;

/** Tipos que requieren detalle con artículos de la entrega. */
export const TIPOS_INCIDENCIA_CON_DETALLE = [2, 3, 4, 6] as const;

export function tipoIncidenciaConDetalleArticulos(
  idTipoIncidencia: number,
): boolean {
  return (TIPOS_INCIDENCIA_CON_DETALLE as readonly number[]).includes(
    idTipoIncidencia,
  );
}

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
      pickNumber(o, "idTipoIncidencia", "IdTipoIncidencia", "id", "Id") ?? 0,
    nombre:
      pickString(o, "nombre", "Nombre", "descripcion", "Descripcion") ?? "",
    activo: pickBool(o, "activo", "Activo"),
  };
}

function normalizeTipoIncidenciaList(raw: unknown): TipoIncidencia[] {
  if (Array.isArray(raw)) {
    return raw
      .map(normalizeTipoIncidencia)
      .filter((t) => t.idTipoIncidencia > 0);
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

export interface IncidenciaResumen {
  idIncidencia: number;
  idTipoIncidencia: number;
  tipoIncidencia: string;
  observaciones: string;
  estatus: string;
}

function normalizeIncidenciaResumen(raw: unknown): IncidenciaResumen | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const idIncidencia =
    pickNumber(o, "idIncidencia", "IdIncidencia", "id", "Id") ?? 0;
  if (idIncidencia <= 0) return null;

  const tipoAnidado =
    o.tipoIncidencia && typeof o.tipoIncidencia === "object"
      ? (o.tipoIncidencia as Record<string, unknown>)
      : null;

  const idTipoIncidencia =
    pickNumber(o, "idTipoIncidencia", "IdTipoIncidencia") ??
    (tipoAnidado
      ? pickNumber(tipoAnidado, "idTipoIncidencia", "IdTipoIncidencia", "id")
      : null) ??
    0;

  const tipoIncidencia =
    pickString(
      o,
      "tipoIncidenciaNombre",
      "TipoIncidenciaNombre",
      "nombreTipoIncidencia",
      "NombreTipoIncidencia",
      "tipoIncidencia",
      "TipoIncidencia",
    ) ??
    (tipoAnidado
      ? pickString(tipoAnidado, "nombre", "Nombre", "descripcion", "Descripcion")
      : null) ??
    (idTipoIncidencia > 0 ? `Tipo ${idTipoIncidencia}` : "—");

  return {
    idIncidencia,
    idTipoIncidencia,
    tipoIncidencia,
    observaciones:
      pickString(o, "observaciones", "Observaciones") ?? "",
    estatus: pickString(o, "estatus", "Estatus") ?? "—",
  };
}

export interface IncidenciaDetalleItem {
  itemCode: string;
  itemName: string;
  cantidad: number;
  idEstado: number;
  observaciones: string;
  vendedor: string;
  estatus: string;
}

export interface IncidenciaCompleta extends IncidenciaResumen {
  detalles: IncidenciaDetalleItem[];
}

function normalizeIncidenciaDetalleItem(
  raw: unknown,
): IncidenciaDetalleItem | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const itemCode =
    pickString(o, "itemCode", "ItemCode", "articulo", "Articulo", "item") ?? "";
  if (!itemCode) return null;

  const idEstadoDirecto = pickNumber(o, "idEstado", "IdEstado");
  const legacyEstado = pickString(o, "estado", "Estado");
  const idEstado =
    idEstadoDirecto ??
    (legacyEstado && /^\d+$/.test(legacyEstado.trim())
      ? Number(legacyEstado.trim())
      : null) ??
    0;

  return {
    itemCode,
    itemName:
      pickString(o, "itemName", "ItemName", "descripcion", "Descripcion") ?? "",
    cantidad: pickNumber(o, "cantidad", "Cantidad") ?? 0,
    idEstado,
    observaciones:
      pickString(o, "observaciones", "Observaciones") ?? "",
    vendedor: pickString(o, "vendedor", "Vendedor") ?? "",
    estatus: pickString(o, "estatus", "Estatus") ?? "",
  };
}

function normalizeIncidenciaDetalleList(raw: unknown): IncidenciaDetalleItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeIncidenciaDetalleItem)
    .filter((item): item is IncidenciaDetalleItem => item !== null);
}

function normalizeIncidenciaCompleta(raw: unknown): IncidenciaCompleta | null {
  const resumen = normalizeIncidenciaResumen(raw);
  if (!resumen) return null;

  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  let detalles: IncidenciaDetalleItem[] = [];

  for (const key of ["detalles", "Detalles", "incidenciaDetalle", "IncidenciaDetalle"]) {
    const list = o[key];
    if (Array.isArray(list)) {
      detalles = normalizeIncidenciaDetalleList(list);
      break;
    }
  }

  return { ...resumen, detalles };
}

function normalizeIncidenciaCompletaList(raw: unknown): IncidenciaCompleta[] {
  if (Array.isArray(raw)) {
    return raw
      .map(normalizeIncidenciaCompleta)
      .filter((item): item is IncidenciaCompleta => item !== null);
  }
  if (raw && typeof raw === "object") {
    const item = normalizeIncidenciaCompleta(raw);
    if (item) return [item];
    const o = raw as Record<string, unknown>;
    for (const key of ["data", "items", "resultado", "incidencias"]) {
      const list = o[key];
      if (Array.isArray(list)) {
        return list
          .map(normalizeIncidenciaCompleta)
          .filter((i): i is IncidenciaCompleta => i !== null);
      }
    }
  }
  return [];
}

export interface EstadoItem {
  idEstado: number;
  nombre: string;
  activo?: boolean;
}

/** Valor del option en el combo (idEstado como string). */
export function valorEstadoItem(estado: EstadoItem): string {
  return String(estado.idEstado);
}

export function etiquetaEstadoItem(
  idEstadoValor: string | number,
  estados: EstadoItem[],
): string {
  const valor = String(idEstadoValor).trim();
  if (!valor) return "—";

  const porId = estados.find((e) => String(e.idEstado) === valor);
  if (porId) return porId.nombre;

  return valor;
}

function normalizeEstadoItem(raw: unknown): EstadoItem | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const idEstado =
    pickNumber(
      o,
      "idEstado",
      "IdEstado",
      "idEstadoItem",
      "IdEstadoItem",
      "id",
      "Id",
    ) ?? 0;
  if (idEstado <= 0) return null;

  const nombre =
    pickString(o, "nombre", "Nombre", "descripcion", "Descripcion") ??
    String(idEstado);

  return {
    idEstado,
    nombre,
    activo: pickBool(o, "activo", "Activo"),
  };
}

function normalizeEstadoItemList(raw: unknown): EstadoItem[] {
  if (Array.isArray(raw)) {
    return raw
      .map(normalizeEstadoItem)
      .filter((item): item is EstadoItem => item !== null);
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["data", "items", "estados", "resultado"]) {
      const list = o[key];
      if (Array.isArray(list)) {
        return list
          .map(normalizeEstadoItem)
          .filter((item): item is EstadoItem => item !== null);
      }
    }
  }
  return [];
}

function normalizeIncidenciaList(raw: unknown): IncidenciaResumen[] {
  return normalizeIncidenciaCompletaList(raw);
}

export const incidenciaService = {
  getTiposActivos: async (): Promise<TipoIncidencia[]> => {
    const response = await api.get<unknown>(
      "/api/TipoIncidencia?soloActivos=true",
    );
    return normalizeTipoIncidenciaList(
      assertOk(response, "No se pudieron cargar los tipos de incidencia."),
    );
  },

  getEstadosItemsActivos: async (): Promise<EstadoItem[]> => {
    const response = await api.get<unknown>(
      "/api/EstadoItems?soloActivos=true",
    );
    return normalizeEstadoItemList(
      assertOk(response, "No se pudieron cargar los estados de artículo."),
    );
  },

  getById: async (idIncidencia: number): Promise<IncidenciaCompleta> => {
    const response = await api.get<unknown>(
      `/api/Incidencias/${Math.trunc(idIncidencia)}`,
    );
    const list = normalizeIncidenciaCompletaList(
      assertOk(response, "No se pudo cargar la incidencia."),
    );
    const item = list[0];
    if (!item) {
      throw new Error("No se encontró la incidencia solicitada.");
    }
    return item;
  },

  getByIds: async (ids: number[]): Promise<IncidenciaResumen[]> => {
    const unicos = [...new Set(ids.filter((id) => id > 0))];
    if (unicos.length === 0) return [];

    const resultados = await Promise.all(
      unicos.map(async (id) => {
        try {
          return await incidenciaService.getById(id);
        } catch (err) {
          console.error(`Error cargando incidencia ${id}`, err);
          return null;
        }
      }),
    );

    return resultados.filter((item): item is IncidenciaResumen => item !== null);
  },

  crearIncidencia: async (
    payload: IncidenciaCreatePayload,
  ): Promise<unknown> => {
    console.log("[Incidencias] POST /api/Incidencias — payload:", payload);
    console.log(
      "[Incidencias] POST /api/Incidencias — payload (JSON):",
      JSON.stringify(payload, null, 2),
    );

    const response = await api.post<unknown>("/api/Incidencias", payload);

    console.log("[Incidencias] POST /api/Incidencias — status:", response.status);
    console.log("[Incidencias] POST /api/Incidencias — response:", response.data);

    return assertOk(response, "No se pudo guardar la incidencia.");
  },
};
