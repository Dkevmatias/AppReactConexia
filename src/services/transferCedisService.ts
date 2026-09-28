import { api } from "./apiServices";

export interface CodigoBarraItem {
  /** Código de barras (sin el múltiplo). */
  codigo: string;
  /** Piezas por escaneo de este código (caja/pieza UoM). */
  multiplo: number;
}

export interface InventarioCedisItem {
  sociedad: string;
  cliente: string;
  almacen: string;
  folio: string;
  fecha: string;
  codigoProveedor: string;
  itemCode: string;
  /** Uno o más códigos válidos para escanear el artículo. */
  codigoBarra: CodigoBarraItem[];
  descripcion: string;
  solicitado: number;
  /** @deprecated El múltiplo ahora viene por cada código en codigoBarra (`codigo|multiplo`). */
  multiplo?: number;
}

export interface InventarioCedisDetallePayload {
  itemCode: string;
  dscription: string;
  almacen: string;
  solicitado: number;
  surtido: number;
  diferencia: number;
  estatus: string;
  //idUsuarioCreacion: number;
}

export interface InventarioCedisPayload {
  docNum?: number | null;
  cardName: string;
  docDate?: string;
  estatus: string;
  idEmpresa: number;
  idSucursal: number;
  idUsuarioCreacion: number;
  detalles: InventarioCedisDetallePayload[];
}

export interface InventarioHistoryPayload {
  docNum: string;
  itemCode: string;
  motivo: string | null;
  idUsuario: number;
  solicitado: number;
  escaneado: number;
}

export interface InventarioGuardado {
  idInventario: number;
  docNum: number | null;
  cardName: string;
  docDate: string | null;
  estatus: string | null;
}

export interface InventarioDetalleApi {
  idTraspasoDetalle: number;
  idTraspaso: number | null;
  itemCode: string;
  dscription: string;
  almacen: string;
  solicitado: number;
  surtido: number;
  multiplo: number;
  diferencia: number;
  estatus: string;
  idUsuario: number | null;
}

export interface InventarioApi {
  idInventario: number;
  docNum: number;
  cardName: string;
  docDate: string | null;
  docStatus: string | null;
  estatus: string | null;
  idUsuario: number | null;
  fechaCreacion?: string | null;
  detalles: InventarioDetalleApi[];
}

function normalizeDetalle(raw: unknown): InventarioDetalleApi | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  return {
    idTraspasoDetalle: pickNumber(
      o,
      "idInventarioDetalle",
      "IdInventarioDetalle",
    ),
    idTraspaso: pickNumber(o, "idTraspaso", "IdInventario") || null,
    itemCode: pickString(o, "itemCode", "ItemCode"),
    dscription: pickString(o, "descripcion", "Descripcion"),
    almacen: pickString(o, "almacen", "Almacen"),
    solicitado: pickNumber(o, "solicitado", "Solicitado"),
    surtido: pickNumber(o, "surtido", "Surtido"),
    multiplo: pickNumber(o, "multiplo", "Multiplo"),
    diferencia: pickNumber(o, "diferencia", "Diferencia"),
    estatus: pickString(o, "estatus", "Estatus"),
    idUsuario: pickNumber(o, "idUsuario", "IdUsuario") || null,
  };
}

function normalizeTraspaso(raw: unknown): InventarioApi | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const idInventario = pickNumber(o, "idInventario", "IdInventario") || 0;
  if (idInventario <= 0) return null;
  const detallesRaw = o.detalles ?? o.Detalles;
  return {
    idInventario,
    docNum: pickNumber(o, "docNum", "DocNum") || 0,
    cardName: pickString(o, "cardName", "CardName", "cliente", "Cliente"),
    docDate: pickString(o, "docDate", "DocDate") || null,
    docStatus: pickString(o, "docStatus", "DocStatus") || null,
    estatus: pickString(o, "estatus", "Estatus") || null,
    idUsuario: pickNumber(o, "idUsuario", "IdUsuario") || null,
    fechaCreacion: pickString(o, "fechaCreacion", "FechaCreacion") || null,
    detalles: Array.isArray(detallesRaw)
      ? detallesRaw
          .map(normalizeDetalle)
          .filter((d): d is InventarioDetalleApi => d != null)
      : [],
  };
}

function pickString(o: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string") return v;
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return "";
}

function pickNumber(o: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return 0;
}

/** Parsea "7501390506897|12.000000" → { codigo, multiplo }. */
export function parseCodigoConMultiplo(raw: string): CodigoBarraItem | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;

  const sep = trimmed.indexOf("|");
  if (sep < 0) {
    return { codigo: trimmed, multiplo: 1 };
  }

  const codigo = trimmed.slice(0, sep).trim();
  if (!codigo) return null;

  const multiploRaw = trimmed
    .slice(sep + 1)
    .trim()
    .replace(",", ".");
  const multiplo = Number(multiploRaw);
  return {
    codigo,
    multiplo: Number.isFinite(multiplo) && multiplo > 0 ? multiplo : 1,
  };
}

/** Normaliza codigoBarra: array de objetos, array de strings, o string único. */
function normalizeCodigoBarra(raw: unknown): CodigoBarraItem[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === "string") {
          return parseCodigoConMultiplo(item);
        }
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          const codigoRaw = pickString(
            o,
            "codigo",
            "Codigo",
            "code",
            "Code",
          ).trim();
          if (!codigoRaw) return null;

          // Preferir formato "codigo|multiplo" en el string.
          if (codigoRaw.includes("|")) {
            return parseCodigoConMultiplo(codigoRaw);
          }

          const multiploCampo = pickNumber(o, "multiplo", "Multiplo");
          return {
            codigo: codigoRaw,
            multiplo:
              Number.isFinite(multiploCampo) && multiploCampo > 0
                ? multiploCampo
                : 1,
          };
        }
        return null;
      })
      .filter((x): x is CodigoBarraItem => x != null);
  }
  if (typeof raw === "string" && raw.trim()) {
    const parsed = parseCodigoConMultiplo(raw);
    return parsed ? [parsed] : [];
  }
  return [];
}

function normalizeTransferItem(raw: unknown): InventarioCedisItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const itemCode = pickString(o, "itemCode", "ItemCode").trim();
  if (!itemCode) return null;

  return {
    sociedad: pickString(o, "sociedad", "Sociedad"),
    cliente: pickString(o, "cliente", "Cliente", "cardName", "CardName"),
    almacen: pickString(o, "almacen", "Almacen"),
    folio: pickString(o, "folio", "Folio", "folioRetail", "FolioRetail"),
    fecha: pickString(o, "fecha", "Fecha", "docDate", "DocDate"),
    codigoProveedor: pickString(o, "codigoProveedor", "CodigoProveedor"),
    itemCode,
    codigoBarra: normalizeCodigoBarra(
      o.codigoBarra ?? o.CodigoBarra ?? o.codeBars ?? o.CodeBars,
    ),
    descripcion: pickString(
      o,
      "descripcion",
      "Descripcion",
      "dscription",
      "Dscription",
    ),
    solicitado: pickNumber(o, "solicitado", "Solicitado"),
  };
}

export const inventarioCedisService = {
  getByFolioRetail: async (folio: string): Promise<InventarioCedisItem[]> => {
    try {
      const response = await api.get(
        `/api/ValidateSalidas?folio=${encodeURIComponent(folio)}`,
      );
      const data = response.data;
      let lista: unknown[] = [];
      if (Array.isArray(data)) {
        lista = data;
      } else if (data?.data && Array.isArray(data.data)) {
        lista = data.data;
      }
      return lista
        .map(normalizeTransferItem)
        .filter((x): x is InventarioCedisItem => x != null);
    } catch (error) {
      console.error("Error fetching TransferCedis:", error);
      return [];
    }
  },

  listarTraspasos: async (opts?: {
    docNum?: number | null;
    docStatus?: string | null;
    estatus?: string | null;
    idUsuarioCreacion?: number | null;
  }): Promise<InventarioApi[]> => {
    const params: Record<string, string | number> = {};
    if (opts?.docNum != null && opts.docNum > 0) params.docNum = opts.docNum;
    if (opts?.estatus?.trim()) params.estatus = opts.estatus.trim();
    if (opts?.idUsuarioCreacion != null && opts.idUsuarioCreacion > 0) {
      params.idUsuarioCreacion = opts.idUsuarioCreacion;
    }

    const response = await api.get("/api/InventarioDocumentos", { params });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        response.data?.message ||
          response.data?.title ||
          "No se pudieron cargar las entregas de mercancía.",
      );
    }
    const data = response.data;
    const lista = Array.isArray(data)
      ? data
      : Array.isArray(data?.data)
        ? data.data
        : [];
    return lista
      .map(normalizeTraspaso)
      .filter((t: InventarioApi | null): t is InventarioApi => t != null);
  },

  getTraspasoById: async (idInventario: number): Promise<InventarioApi> => {
    const response = await api.get(`/api/InventarioDocumentos/${idInventario}`);
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        response.data?.message ||
          response.data?.title ||
          "No se pudo cargar el traspaso.",
      );
    }
    const normalized = normalizeTraspaso(response.data);
    if (!normalized) {
      throw new Error("Respuesta de traspaso inválida.");
    }
    return normalized;
  },

  guardarInventario: async (
    payload: InventarioCedisPayload,
  ): Promise<InventarioGuardado> => {
    const response = await api.post("/api/InventarioDocumentos", payload);
    if (response.status >= 200 && response.status < 300) {
      const o = (
        response.data && typeof response.data === "object" ? response.data : {}
      ) as Record<string, unknown>;
      return {
        idInventario: pickNumber(o, "IdInventario") || 0,
        docNum: pickNumber(o, "docNum", "DocNum") || null,
        cardName: pickString(o, "cardName", "CardName"),
        docDate: pickString(o, "docDate", "DocDate") || null,
        estatus: pickString(o, "estatus", "Estatus") || null,
      };
    }
    const message =
      response.data?.message ||
      response.data?.title ||
      `Error al guardar el traspaso (${response.status})`;
    throw new Error(message);
  },

  /** Guarda uno o varios registros de historial en lote. */
  guardarHistorialLote: async (
    payload: InventarioHistoryPayload[],
  ): Promise<unknown> => {
    const response = await api.post("/api/InventarioHistory/lote", payload);
    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }
    const message =
      response.data?.message ||
      response.data?.title ||
      `Error al guardar el historial (${response.status})`;
    throw new Error(message);
  },
};
