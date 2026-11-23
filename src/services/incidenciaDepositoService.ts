import { api } from "./apiServices";

export const MAX_FOTOS_DEPOSITO = 3;
export const MAX_MB_FOTO_DEPOSITO = 5;
const MAX_BYTES = MAX_MB_FOTO_DEPOSITO * 1024 * 1024;
const EXT_OK = new Set(["jpg", "jpeg", "png", "webp"]);

export type IncidenciaDeposito = {
  idIncidenciaDeposito: number;
  idODistribucion: number | null;
  ruta: string | null;
  url: string | null;
  estatus: string | null;
  idUsuarioCreacion: number | null;
  fechaCreacion: string | null;
  activo: boolean | null;
};

export type RelacionFotosODistribucion = {
  folio: number;
  idSucursal: number | null;
  sucursal: string | null;
  totalEfectivo: number;
  cantidadFotos: number;
  fechaUltimaFoto: string | null;
  fotos: IncidenciaDeposito[];
};

export type RelacionFotosODistribucionParams = {
  fechaInicio?: string | null;
  fechaFin?: string | null;
  idSucursal?: number | null;
};

function errorDesdeRespuesta(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.mensaje === "string" && o.mensaje) return o.mensaje;
  }
  if (typeof data === "string" && data.trim()) return data.trim();
  return fallback;
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
      if (Number.isFinite(n)) return n;
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
    if (typeof v === "boolean") continue;
    if (v instanceof Date) return v.toISOString();
  }
  return null;
}

function pickBool(
  o: Record<string, unknown>,
  ...keys: string[]
): boolean | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "boolean") return v;
  }
  return null;
}

function normalizeItem(raw: unknown): IncidenciaDeposito | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const id =
    pickNumber(o, "idIncidenciaDeposito", "IdIncidenciaDeposito") ?? 0;
  if (id <= 0) return null;
  return {
    idIncidenciaDeposito: id,
    idODistribucion: pickNumber(o, "idODistribucion", "IdODistribucion"),
    ruta: pickString(o, "ruta", "Ruta"),
    url: pickString(o, "url", "Url"),
    estatus: pickString(o, "estatus", "Estatus"),
    idUsuarioCreacion: pickNumber(
      o,
      "idUsuarioCreacion",
      "IdUsuarioCreacion",
    ),
    fechaCreacion: pickString(o, "fechaCreacion", "FechaCreacion"),
    activo: pickBool(o, "activo", "Activo"),
  };
}

function unwrapArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["data", "items", "resultado"]) {
      const list = o[key];
      if (Array.isArray(list)) return list;
    }
  }
  return [];
}

function normalizeList(raw: unknown): IncidenciaDeposito[] {
  return unwrapArray(raw)
    .map(normalizeItem)
    .filter((x): x is IncidenciaDeposito => x != null);
}

function normalizeRelacion(
  raw: unknown,
): RelacionFotosODistribucion | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const folio = pickNumber(o, "folio", "Folio") ?? 0;
  if (folio <= 0) return null;
  const fotosRaw = o.fotos ?? o.Fotos;
  return {
    folio,
    idSucursal: pickNumber(o, "idSucursal", "IdSucursal"),
    sucursal: pickString(o, "sucursal", "Sucursal"),
    totalEfectivo: pickNumber(o, "totalEfectivo", "TotalEfectivo") ?? 0,
    cantidadFotos: pickNumber(o, "cantidadFotos", "CantidadFotos") ?? 0,
    fechaUltimaFoto:
      pickString(o, "fechaUltimaFoto", "FechaUltimaFoto") ?? null,
    fotos: normalizeList(fotosRaw),
  };
}

export function extensionArchivo(nombre: string): string {
  const i = nombre.lastIndexOf(".");
  return i >= 0 ? nombre.slice(i + 1).toLowerCase() : "";
}

export function validarArchivoDeposito(file: File): string | null {
  const ext = extensionArchivo(file.name);
  const tipo = (file.type || "").toLowerCase();
  const tipoOk =
    tipo === "image/jpeg" ||
    tipo === "image/png" ||
    tipo === "image/webp" ||
    EXT_OK.has(ext);
  if (!tipoOk) return "Solo se permiten imágenes jpg, jpeg, png o webp.";
  if (file.size > MAX_BYTES) {
    return `Cada imagen debe pesar máximo ${MAX_MB_FOTO_DEPOSITO} MB.`;
  }
  return null;
}

export const incidenciaDepositoService = {
  listarRelacion: async (
    opts: RelacionFotosODistribucionParams = {},
  ): Promise<RelacionFotosODistribucion[]> => {
    const params = new URLSearchParams();
    const inicio = (opts.fechaInicio ?? "").trim();
    const fin = (opts.fechaFin ?? "").trim();
    if (inicio) params.set("fechaInicio", inicio);
    if (fin) params.set("fechaFin", fin);
    if (opts.idSucursal != null && opts.idSucursal > 0) {
      params.set("idSucursal", String(opts.idSucursal));
    }
    const qs = params.toString();
    const response = await api.get<unknown>(
      `/api/IncidenciaDeposito/relacion${qs ? `?${qs}` : ""}`,
      { timeout: 90_000 },
    );
    if (response.status === 404 || response.status === 204) return [];
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        errorDesdeRespuesta(
          response.data,
          "No se pudo cargar la relación de fotos.",
        ),
      );
    }
    return unwrapArray(response.data)
      .map(normalizeRelacion)
      .filter((x): x is RelacionFotosODistribucion => x != null);
  },

  listarPorOd: async (idODistribucion: number): Promise<IncidenciaDeposito[]> => {
    const response = await api.get<unknown>(
      `/api/IncidenciaDeposito/od/${Math.trunc(idODistribucion)}`,
    );
    if (response.status === 404 || response.status === 204) return [];
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        errorDesdeRespuesta(response.data, "No se pudieron listar las imágenes."),
      );
    }
    return normalizeList(response.data);
  },

  subir: async (
    idODistribucion: number,
    archivos: File[],
  ): Promise<IncidenciaDeposito[]> => {
    if (archivos.length < 1) {
      throw new Error("Seleccione al menos una imagen.");
    }
    const form = new FormData();
    form.append("idODistribucion", String(Math.trunc(idODistribucion)));
    for (const archivo of archivos) {
      form.append("archivos", archivo);
    }
    const response = await api.post<unknown>("/api/IncidenciaDeposito", form, {
      timeout: 90_000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        "Content-Type": false as unknown as string,
      },
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        errorDesdeRespuesta(response.data, "No se pudieron subir las imágenes."),
      );
    }
    return normalizeList(response.data);
  },

  obtenerArchivoBlob: async (idIncidenciaDeposito: number): Promise<Blob> => {
    const response = await api.get(
      `/api/IncidenciaDeposito/${Math.trunc(idIncidenciaDeposito)}/archivo`,
      { responseType: "blob", timeout: 60_000 },
    );
    if (response.status < 200 || response.status >= 300) {
      let mensaje = "No se pudo obtener la imagen.";
      try {
        const text = await (response.data as Blob).text();
        if (text) {
          try {
            const parsed = JSON.parse(text) as { message?: string };
            mensaje = parsed.message || text;
          } catch {
            mensaje = text;
          }
        }
      } catch {
        /* usar mensaje por defecto */
      }
      throw new Error(mensaje);
    }
    return response.data as Blob;
  },
};
