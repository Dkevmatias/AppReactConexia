import { api } from "./apiServices";

export interface ItemEntrega {
  sociedad: string;
  folio: number;
  origen: string;
  item: string;
  descripcion: string;
  cantidad: number;
  almacen: string;
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
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return null;
}

function normalizeItemEntrega(raw: unknown): ItemEntrega | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const item = pickString(o, "item", "Item", "itemCode", "ItemCode");
  if (!item) return null;

  return {
    sociedad: pickString(o, "sociedad", "Sociedad") ?? "",
    folio: pickNumber(o, "folio", "Folio") ?? 0,
    origen: pickString(o, "origen", "Origen") ?? "",
    item,
    descripcion:
      pickString(o, "descripcion", "Descripcion", "itemName", "ItemName") ??
      "",
    cantidad: pickNumber(o, "cantidad", "Cantidad") ?? 0,
    almacen: pickString(o, "almacen", "Almacen") ?? "",
  };
}

function normalizeItemEntregaList(raw: unknown): ItemEntrega[] {
  if (Array.isArray(raw)) {
    return raw
      .map(normalizeItemEntrega)
      .filter((item): item is ItemEntrega => item !== null);
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["data", "items", "resultado"]) {
      const list = o[key];
      if (Array.isArray(list)) {
        return list
          .map(normalizeItemEntrega)
          .filter((item): item is ItemEntrega => item !== null);
      }
    }
  }
  return [];
}

export const itemEntregaService = {
  getByOrdenEntrega: async (
    idOrdenEntrega: number,
  ): Promise<ItemEntrega[]> => {
    const response = await api.get<unknown>("/api/ItemEntrega", {
      params: { idOrdenEntrega },
    });
    return normalizeItemEntregaList(
      assertOk(response, "No se pudieron cargar los artículos de la entrega."),
    );
  },
};
