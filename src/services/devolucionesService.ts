import { api } from "./apiServices";

export interface DevolucionLinea {
  sociedad: string | null;
  docNum: number;
  cardName: string | null;
  itemCode: string;
  codigoProveedor: string | null;
  descripcion: string;
  quantity: number;
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
    if (typeof v === "string" && v.trim()) {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
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
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return null;
}

function normalizeDevolucionLinea(raw: unknown): DevolucionLinea | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const itemCode = pickString(o, "itemCode", "ItemCode", "item", "Item") ?? "";
  if (!itemCode) return null;

  return {
    sociedad: pickString(o, "sociedad", "Sociedad"),
    docNum: pickNumber(o, "docNum", "DocNum") ?? 0,
    cardName: pickString(o, "cardName", "CardName"),
    itemCode,
    codigoProveedor:
      pickString(
        o,
        "codigoProveedor",
        "CodigoProveedor",
        "codigoProv",
        "CodigoProv",
      ) ?? null,
    descripcion:
      pickString(o, "descripcion", "Descripcion", "itemName", "ItemName") ?? "",
    quantity:
      pickNumber(o, "quantity", "Quantity", "cantidad", "Cantidad") ?? 0,
  };
}

function normalizeDevolucionList(raw: unknown): DevolucionLinea[] {
  if (Array.isArray(raw)) {
    return raw
      .map(normalizeDevolucionLinea)
      .filter((item): item is DevolucionLinea => item !== null);
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["data", "Data", "items", "Items", "resultado"]) {
      const list = o[key];
      if (Array.isArray(list)) {
        return list
          .map(normalizeDevolucionLinea)
          .filter((item): item is DevolucionLinea => item !== null);
      }
    }
  }
  return [];
}

export const devolucionesService = {
  /** GET /api/Devoluciones?docNum={docNum} */
  getByDocNum: async (docNum: number): Promise<DevolucionLinea[]> => {
    const num = Math.trunc(docNum);
    if (!num || num <= 0) {
      throw new Error("El número de devolución no es válido.");
    }
    const response = await api.get<unknown>(`/api/Devoluciones?docNum=${num}`);
    return normalizeDevolucionList(
      assertOk(response, "No se pudieron consultar las líneas de devolución."),
    );
  },
};
