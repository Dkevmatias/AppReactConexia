import { api } from "./apiServices";

export interface Almacen {
  idAlmacen: number;
  idSucursal: number;
  idEmpresa: number;
  nombre: string;
  /** Código SAP de origen; es el que usa la vista Por surtir (`?sucursal=`). */
  origen: string;
  destino: string;
  direccion: string;
  activo: boolean;
}

export type AlmacenGrupoSucursal = {
  idSucursal: number;
  etiqueta: string;
  almacenes: Almacen[];
};

function pickNumber(
  o: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const parsed = Number(v);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}

function pickString(
  o: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return undefined;
}

function pickBool(o: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v === 1;
    if (typeof v === "string") {
      const t = v.trim().toLowerCase();
      if (t === "true" || t === "1" || t === "s") return true;
      if (t === "false" || t === "0" || t === "n") return false;
    }
  }
  return true;
}

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  for (const key of ["data", "Data", "items", "Items", "resultado", "Resultado"]) {
    const v = o[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function normalizeAlmacen(raw: unknown): Almacen | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const origen = pickString(o, "origen", "Origen") ?? "";
  const idAlmacen = pickNumber(o, "idAlmacen", "IdAlmacen") ?? 0;
  if (!origen && idAlmacen <= 0) return null;
  return {
    idAlmacen,
    idSucursal: pickNumber(o, "idSucursal", "IdSucursal") ?? 0,
    idEmpresa: pickNumber(o, "idEmpresa", "IdEmpresa") ?? 0,
    nombre: pickString(o, "nombre", "Nombre") ?? "",
    origen,
    destino: pickString(o, "destino", "Destino") ?? "",
    direccion: pickString(o, "direccion", "Direccion") ?? "",
    activo: pickBool(o, "activo", "Activo"),
  };
}

export function agruparAlmacenesPorSucursal(
  almacenes: Almacen[],
): AlmacenGrupoSucursal[] {
  const map = new Map<number, Almacen[]>();
  for (const item of almacenes) {
    if (!item.origen.trim()) continue;
    const list = map.get(item.idSucursal) ?? [];
    list.push(item);
    map.set(item.idSucursal, list);
  }

  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([idSucursal, items]) => ({
      idSucursal,
      etiqueta: (
        items[0]?.direccion ||
        items[0]?.nombre ||
        `Sucursal ${idSucursal}`
      ).trim(),
      almacenes: [...items].sort((a, b) =>
        a.origen.localeCompare(b.origen, "es", { sensitivity: "base" }),
      ),
    }));
}

export function origenesDeSucursal(
  almacenes: Almacen[],
  idSucursal: number | null | undefined,
): string[] {
  if (idSucursal == null || idSucursal <= 0) return [];
  return almacenes
    .filter((a) => a.idSucursal === idSucursal && a.origen.trim())
    .map((a) => a.origen.trim());
}

export function etiquetaGrupoSucursal(
  almacenes: Almacen[],
  idSucursal: number | null | undefined,
): string {
  if (idSucursal == null || idSucursal <= 0) return "";
  const grupo = agruparAlmacenesPorSucursal(almacenes).find(
    (g) => g.idSucursal === idSucursal,
  );
  return grupo?.etiqueta ?? "";
}

/** Par origen/destino SAP de una sucursal (una fila de catálogo por sucursal). */
export type ParAlmacenesSucursal = {
  idSucursal: number;
  etiqueta: string;
  origen: string;
  destino: string;
};

export function paresAlmacenesPorSucursal(
  almacenes: Almacen[],
): ParAlmacenesSucursal[] {
  return agruparAlmacenesPorSucursal(almacenes)
    .map((g) => {
      const first = g.almacenes[0];
      return {
        idSucursal: g.idSucursal,
        etiqueta: g.etiqueta,
        origen: (first?.origen ?? "").trim(),
        destino: (first?.destino ?? "").trim(),
      };
    })
    .filter((p) => p.origen || p.destino);
}

export function parAlmacenesDeSucursal(
  almacenes: Almacen[],
  idSucursal: number | null | undefined,
): ParAlmacenesSucursal | null {
  if (idSucursal == null || idSucursal <= 0) return null;
  return (
    paresAlmacenesPorSucursal(almacenes).find(
      (p) => p.idSucursal === idSucursal,
    ) ?? null
  );
}

export const almacenService = {
  getAlmacenes: async (soloActivos = true): Promise<Almacen[]> => {
    const qs = new URLSearchParams();
    if (soloActivos) qs.set("activo", "true");
    const response = await api.get<unknown>(
      `/api/Almacen${qs.toString() ? `?${qs.toString()}` : ""}`,
    );
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `No se pudieron cargar los almacenes (HTTP ${response.status}).`,
      );
    }
    return unwrapList(response.data)
      .map(normalizeAlmacen)
      .filter((a): a is Almacen => a !== null && !!a.origen.trim())
      .sort((a, b) =>
        a.origen.localeCompare(b.origen, "es", { sensitivity: "base" }),
      );
  },
};
