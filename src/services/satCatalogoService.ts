import { api } from "./apiServices";

export type SatCatalogoItem = {
  clave: string;
  nombre: string;
  activo: boolean;
  clavePadre?: string | null;
  extra?: Record<string, string | null>;
};

/** Respuesta de GET /api/SatCodigoPostal/{codigoPostal} */
export type SatCodigoPostalDetalle = {
  codigoPostal: string;
  estadoClave: string;
  estadoNombre: string | null;
  municipioClave: string;
  municipioNombre: string | null;
  localidadClave: string;
  estimuloFronterizo: boolean | null;
  activo: boolean;
};

function errorDesdeRespuesta(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.mensaje === "string" && o.mensaje) return o.mensaje;
    if (typeof o.title === "string" && o.title) return o.title;
    if (typeof o.detail === "string" && o.detail) return o.detail;
  }
  return fallback;
}

function assertOk<T>(
  response: { status: number; data: T },
  fallback: string,
): T {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      errorDesdeRespuesta(
        response.data,
        `${fallback} (HTTP ${response.status})`,
      ),
    );
  }
  return response.data;
}

function normalizeArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  for (const key of [
    "data",
    "Data",
    "items",
    "Items",
    "result",
    "Result",
    "resultado",
    "Resultado",
    "value",
    "Value",
    "$values",
    "estados",
    "Estados",
    "lista",
    "Lista",
  ]) {
    const v = o[key];
    if (Array.isArray(v)) return v;
    // Algunos wrappers anidan otra vez: { data: { items: [...] } }
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const nested = normalizeArray(v);
      if (nested.length > 0) return nested;
    }
  }
  return [];
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

function pickActivo(o: Record<string, unknown>): boolean {
  // Solo campos de activo/inactivo. No usar `estatus` (en este API suele ser
  // estatus de negocio: I/P/etc., no bandera de catálogo).
  for (const key of ["activo", "Activo", "active", "Active"]) {
    const v = o[key];
    if (typeof v === "boolean") return v;
    if (typeof v === "number") return v !== 0;
    if (typeof v === "string") {
      const t = v.trim().toLowerCase();
      if (["n", "no", "false", "0", "inactivo", "inactive"].includes(t)) {
        return false;
      }
      if (["s", "si", "sí", "y", "true", "1", "activo", "active"].includes(t)) {
        return true;
      }
    }
  }
  return true;
}

type TipoCatalogoSat =
  | "pais"
  | "estado"
  | "municipio"
  | "localidad"
  | "cp"
  | "colonia"
  | "usoCfdi"
  | "formaPago"
  | "metodoPago"
  | "regimen"
  | "auto";

function clavesPorTipo(tipo: TipoCatalogoSat): string[] {
  switch (tipo) {
    case "pais":
      return [
        "clave",
        "Clave",
        "paisClave",
        "PaisClave",
        "c_Pais",
        "codigo",
        "Codigo",
      ];
    case "estado":
      return [
        "clave",
        "Clave",
        "estadoClave",
        "EstadoClave",
        "claveEstado",
        "ClaveEstado",
        "c_Estado",
        "cEstado",
        "CEstado",
        "codigo",
        "Codigo",
        "idEstado",
        "IdEstado",
        "id",
        "Id",
      ];
    case "municipio":
      return [
        "clave",
        "Clave",
        "municipioClave",
        "MunicipioClave",
        "claveMunicipio",
        "ClaveMunicipio",
        "c_Municipio",
        "municipio",
        "Municipio",
        "codigo",
        "Codigo",
      ];
    case "localidad":
      return [
        "clave",
        "Clave",
        "localidadClave",
        "LocalidadClave",
        "claveLocalidad",
        "ClaveLocalidad",
        "c_Localidad",
        "localidad",
        "Localidad",
        "codigo",
        "Codigo",
      ];
    case "cp":
      return [
        "clave",
        "Clave",
        "codigoPostal",
        "CodigoPostal",
        "c_CodigoPostal",
        "cp",
        "CP",
        "codigo",
        "Codigo",
      ];
    case "colonia":
      return [
        "clave",
        "Clave",
        "coloniaClave",
        "ColoniaClave",
        "claveColonia",
        "ClaveColonia",
        "c_Colonia",
        "idColonia",
        "IdColonia",
        "colonia",
        "Colonia",
        "codigo",
        "Codigo",
      ];
    case "usoCfdi":
      return [
        "usoCFDIClave",
        "UsoCFDIClave",
        "clave",
        "Clave",
        "c_UsoCFDI",
        "usoCfdi",
        "UsoCfdi",
        "codigo",
        "Codigo",
      ];
    case "formaPago":
      return [
        "formaPagoClave",
        "FormaPagoClave",
        "clave",
        "Clave",
        "c_FormaPago",
        "formaPago",
        "FormaPago",
        "codigo",
        "Codigo",
      ];
    case "metodoPago":
      return [
        "metodoPagoClave",
        "MetodoPagoClave",
        "clave",
        "Clave",
        "c_MetodoPago",
        "metodoPago",
        "MetodoPago",
        "codigo",
        "Codigo",
      ];
    case "regimen":
      return [
        "regimenFiscalClave",
        "RegimenFiscalClave",
        "clave",
        "Clave",
        "c_RegimenFiscal",
        "regimenFiscal",
        "RegimenFiscal",
        "codigo",
        "Codigo",
      ];
    default:
      return [
        "clave",
        "Clave",
        "codigo",
        "Codigo",
        "codigoPostal",
        "CodigoPostal",
        "id",
        "Id",
      ];
  }
}

function normalizeItem(
  raw: unknown,
  tipo: TipoCatalogoSat = "auto",
): SatCatalogoItem | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const clave = pickString(o, ...clavesPorTipo(tipo)) ?? "";
  const nombre =
    pickString(
      o,
      "nombre",
      "Nombre",
      "descripcion",
      "Descripcion",
      "descripción",
      "Descripción",
      "asentamiento",
      "Asentamiento",
      "name",
      "Name",
    ) ?? "";
  if (!clave && !nombre) return null;
  return {
    clave: clave || nombre,
    nombre: nombre || clave,
    activo: pickActivo(o),
    clavePadre: pickString(
      o,
      "clavePadre",
      "ClavePadre",
      "paisClave",
      "PaisClave",
      "estadoClave",
      "EstadoClave",
      "municipioClave",
      "MunicipioClave",
      "codigoPostal",
      "CodigoPostal",
    ),
    extra: {
      paisClave: pickString(o, "paisClave", "PaisClave", "c_Pais"),
      estadoClave: pickString(
        o,
        "estadoClave",
        "EstadoClave",
        "claveEstado",
        "ClaveEstado",
        "c_Estado",
      ),
      municipioClave: pickString(
        o,
        "municipioClave",
        "MunicipioClave",
        "claveMunicipio",
        "ClaveMunicipio",
        "c_Municipio",
      ),
      localidadClave: pickString(
        o,
        "localidadClave",
        "LocalidadClave",
        "claveLocalidad",
        "ClaveLocalidad",
        "c_Localidad",
      ),
      codigoPostal: pickString(
        o,
        "codigoPostal",
        "CodigoPostal",
        "c_CodigoPostal",
        "cp",
        "CP",
      ),
    },
  };
}

function normalizeList(
  raw: unknown,
  tipo: TipoCatalogoSat = "auto",
): SatCatalogoItem[] {
  // El API ya filtra con soloActivos; no refiltrar por `activo` aquí
  // (evita vaciar el combo si llega otro campo/estatus ambiguo).
  return normalizeArray(raw)
    .map((item) => normalizeItem(item, tipo))
    .filter((x): x is SatCatalogoItem => x !== null)
    .sort((a, b) =>
      `${a.clave} ${a.nombre}`.localeCompare(`${b.clave} ${b.nombre}`, "es", {
        numeric: true,
      }),
    );
}

async function getLista(
  path: string,
  params: Record<string, string | boolean | undefined>,
  fallback: string,
  tipo: TipoCatalogoSat,
): Promise<SatCatalogoItem[]> {
  const cleanParams: Record<string, string | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    cleanParams[k] = v;
  }
  const response = await api.get<unknown>(path, {
    params: cleanParams,
    timeout: 60_000,
  });
  const data = assertOk(response, fallback);
  const lista = normalizeList(data, tipo);
  if (lista.length === 0 && normalizeArray(data).length > 0) {
    console.warn(
      `[SatCatalogo] Respuesta sin ítems normalizados en ${path}`,
      normalizeArray(data)[0],
    );
  }
  return lista;
}

/** País SAT por defecto (?paisClave=MEX). */
export const PAIS_SAT_DEFAULT = "MEX";

/** Unifica MX / MEX / México → MEX para el API. */
export function normalizarPaisClaveSat(valor?: string | null): string {
  const v = (valor ?? "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!v || v === "MX" || v === "MEXICO" || v === "MEX") return PAIS_SAT_DEFAULT;
  return v;
}

export function etiquetaSatItem(item: SatCatalogoItem): string {
  const clave = (item.clave || "").trim();
  const nombre = (item.nombre || "").trim();
  if (!clave) return nombre;
  if (!nombre || nombre === clave) return clave;
  if (nombre.startsWith(clave)) {
    const resto = nombre.slice(clave.length).replace(/^[\s—\-–]+/, "").trim();
    return resto ? `${clave} — ${resto}` : clave;
  }
  return `${clave} — ${nombre}`;
}

export const satCatalogoService = {
  getEstados: async (paisClave: string = PAIS_SAT_DEFAULT) => {
    const clave = normalizarPaisClaveSat(paisClave);
    let lista = await getLista(
      "/api/SatEstado",
      { soloActivos: true, paisClave: clave },
      "No se pudieron cargar estados SAT.",
      "estado",
    );
    // Si el filtro de activos deja vacío, reintenta sin él
    if (lista.length === 0) {
      lista = await getLista(
        "/api/SatEstado",
        { paisClave: clave },
        "No se pudieron cargar estados SAT.",
        "estado",
      );
    }
    // Compatibilidad por si aún hay datos con MX
    if (lista.length === 0 && clave === "MEX") {
      lista = await getLista(
        "/api/SatEstado",
        { soloActivos: true, paisClave: "MX" },
        "No se pudieron cargar estados SAT.",
        "estado",
      );
    }
    return lista;
  },

  getMunicipios: (estadoClave: string) =>
    getLista(
      "/api/SatMunicipio",
      { soloActivos: true, estadoClave },
      "No se pudieron cargar municipios SAT.",
      "municipio",
    ),

  getLocalidades: (estadoClave: string) =>
    getLista(
      "/api/SatLocalidad",
      { soloActivos: true, estadoClave },
      "No se pudieron cargar localidades SAT.",
      "localidad",
    ),

  getCodigosPostales: (estadoClave: string, municipioClave: string) =>
    getLista(
      "/api/SatCodigoPostal",
      { soloActivos: true, estadoClave, municipioClave },
      "No se pudieron cargar códigos postales SAT.",
      "cp",
    ),

  /** Lookup inverso: CP → estado / municipio / localidad. */
  getByCodigoPostal: async (
    codigoPostal: string,
  ): Promise<SatCodigoPostalDetalle | null> => {
    const cp = codigoPostal.trim();
    if (!/^\d{5}$/.test(cp)) return null;

    try {
      const response = await api.get<unknown>(`/api/SatCodigoPostal/${cp}`, {
        timeout: 60_000,
      });
      if (response.status === 404) return null;
      const data = assertOk(
        response,
        `No se encontró el código postal ${cp}.`,
      );
      if (!data || typeof data !== "object") return null;
      const o = data as Record<string, unknown>;
      const codigo =
        pickString(o, "codigoPostal", "CodigoPostal", "clave", "Clave") ?? cp;
      const estadoClave =
        pickString(o, "estadoClave", "EstadoClave", "c_Estado", "cEstado") ??
        "";
      const municipioClave =
        pickString(
          o,
          "municipioClave",
          "MunicipioClave",
          "c_Municipio",
          "cMunicipio",
        ) ?? "";
      if (!estadoClave && !municipioClave) return null;

      return {
        codigoPostal: codigo,
        estadoClave,
        estadoNombre: pickString(o, "estadoNombre", "EstadoNombre", "estado"),
        municipioClave,
        municipioNombre: pickString(
          o,
          "municipioNombre",
          "MunicipioNombre",
          "municipio",
        ),
        localidadClave:
          pickString(
            o,
            "localidadClave",
            "LocalidadClave",
            "c_Localidad",
            "cLocalidad",
          ) ?? "",
        estimuloFronterizo:
          typeof o.estimuloFronterizo === "boolean"
            ? o.estimuloFronterizo
            : typeof o.EstimuloFronterizo === "boolean"
              ? o.EstimuloFronterizo
              : null,
        activo: pickActivo(o),
      };
    } catch (err: unknown) {
      const status =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
      if (status === 404) return null;
      throw err;
    }
  },

  getColonias: (codigoPostal: string) =>
    getLista(
      "/api/SatColonia",
      { soloActivos: true, codigoPostal },
      "No se pudieron cargar colonias SAT.",
      "colonia",
    ),

  getUsosCfdi: () =>
    getLista(
      "/api/SatUsoCfdi",
      { soloActivos: true },
      "No se pudieron cargar usos CFDI.",
      "usoCfdi",
    ),

  getFormasPago: () =>
    getLista(
      "/api/SatFormaPago",
      { soloActivos: true },
      "No se pudieron cargar formas de pago.",
      "formaPago",
    ),

  getMetodosPago: () =>
    getLista(
      "/api/SatMetodoPago",
      { soloActivos: true },
      "No se pudieron cargar métodos de pago.",
      "metodoPago",
    ),

  getRegimenesFiscales: () =>
    getLista(
      "/api/SatRegimenFiscal",
      { soloActivos: true },
      "No se pudieron cargar regímenes fiscales.",
      "regimen",
    ),
};
