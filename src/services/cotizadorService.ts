import { api } from "./apiServices";

export interface CotizadorExistencia {
  almacen: string;
  disponible: number;
  precio: number;
  unidad: string | null;
  esAlmacenVendedor: boolean;
}

export interface CotizadorResultado {
  marca: string;
  /** Código de fabricante SAP (mismo que firmCode en descuentos cliente). */
  firmCode: number | null;
  codigoBusqueda: string;
  /** Código proveedor / clave prov. */
  codigo: string;
  tieneEquivalente: boolean;
  codigoCodialub: string | null;
  tieneCodialub: boolean;
  encontradoSap: boolean;
  descripcion: string | null;
  unidad: string | null;
  precioLista: number;
  descuentoBase: number;
  descuentoAdicional: number;
  precioConDescuento: number;
  importe: number;
  disponibleAlmacenVendedor: number;
  existencias: CotizadorExistencia[];
  mensaje: string | null;
}

export interface CotizadorBusquedaResponse {
  codigoBusqueda: string;
  sociedad: string;
  almacenVendedor: string;
  cantidad: number;
  resultados: CotizadorResultado[];
}

export interface CotizadorBuscarPayload {
  idVendedor: number;
  cantidad: number;
  codigo: string;
}

/** Ítem persistido en la canasta de cotización (snapshot al agregar). */
export type CotizadorCanastaItem = {
  id: string;
  marca: string;
  /** Código fabricante SAP — cruce con DescuentosClientes.firmCode */
  firmCode: number | null;
  /** Clave Prov. / código proveedor */
  codigo: string;
  codigoCodialub: string | null;
  descripcion: string | null;
  unidad: string | null;
  codigoBusqueda: string;
  cantidad: number;
  precioLista: number;
  descuentoBase: number;
  descuentoAdicional: number;
  precioConDescuento: number;
  importe: number;
};

/** Catálogo de descuentos por marca: GET /api/Cotizador/descuentos */
export interface CotizadorDescuentoMarca {
  idDescuentoMarca: number;
  idMarca: number;
  codigoMarca: string;
  nombreMarca: string;
  descuentoBase: number;
  descuentoAdicional: number;
  vigenciaDesde: string | null;
  vigenciaHasta: string | null;
  activo: boolean;
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
  }
  return null;
}

function pickBool(o: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "boolean") return v;
  }
  return false;
}

function normalizeExistencia(raw: unknown): CotizadorExistencia | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const almacen = pickString(o, "almacen", "Almacen") ?? "";
  if (!almacen) return null;
  return {
    almacen,
    disponible: pickNumber(o, "disponible", "Disponible") ?? 0,
    precio: pickNumber(o, "precio", "Precio") ?? 0,
    unidad: pickString(o, "unidad", "Unidad", "unida", "Unida"),
    esAlmacenVendedor: pickBool(
      o,
      "esAlmacenVendedor",
      "EsAlmacenVendedor",
    ),
  };
}

/** Prefer unidad del almacén del vendedor; si no, la primera existencia con unidad. */
function resolverUnidadDesdeExistencias(
  existencias: CotizadorExistencia[],
): string | null {
  const delVendedor = existencias.find(
    (e) => e.esAlmacenVendedor && e.unidad?.trim(),
  );
  if (delVendedor?.unidad?.trim()) return delVendedor.unidad.trim();

  const conUnidad = existencias.find((e) => e.unidad?.trim());
  return conUnidad?.unidad?.trim() || null;
}

function normalizeResultado(raw: unknown): CotizadorResultado | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const marca = pickString(o, "marca", "Marca") ?? "";
  if (!marca) return null;

  const existenciasRaw = o.existencias ?? o.Existencias;
  const existencias = Array.isArray(existenciasRaw)
    ? existenciasRaw
        .map(normalizeExistencia)
        .filter((e): e is CotizadorExistencia => e !== null)
    : [];

  const unidadRaiz = pickString(o, "unidad", "Unidad", "unida", "Unida");

  return {
    marca,
    firmCode: pickNumber(o, "firmCode", "FirmCode", "idMarca", "IdMarca"),
    codigoBusqueda:
      pickString(o, "codigoBusqueda", "CodigoBusqueda") ?? "",
    codigo: pickString(o, "codigo", "Codigo") ?? "",
    tieneEquivalente: pickBool(o, "tieneEquivalente", "TieneEquivalente"),
    codigoCodialub: pickString(o, "codigoCodialub", "CodigoCodialub"),
    tieneCodialub: pickBool(o, "tieneCodialub", "TieneCodialub"),
    encontradoSap: pickBool(o, "encontradoSap", "EncontradoSap"),
    descripcion: pickString(o, "descripcion", "Descripcion"),
    // Unidad vive en existencias; se copia al resultado para card / canasta / save.
    unidad: unidadRaiz || resolverUnidadDesdeExistencias(existencias),
    precioLista: pickNumber(o, "precioLista", "PrecioLista") ?? 0,
    descuentoBase: pickNumber(o, "descuentoBase", "DescuentoBase") ?? 0,
    descuentoAdicional:
      pickNumber(o, "descuentoAdicional", "DescuentoAdicional") ?? 0,
    precioConDescuento:
      pickNumber(o, "precioConDescuento", "PrecioConDescuento") ?? 0,
    importe: pickNumber(o, "importe", "Importe") ?? 0,
    disponibleAlmacenVendedor:
      pickNumber(
        o,
        "disponibleAlmacenVendedor",
        "DisponibleAlmacenVendedor",
      ) ?? 0,
    existencias,
    mensaje: pickString(o, "mensaje", "Mensaje"),
  };
}

function normalizeBusquedaResponse(raw: unknown): CotizadorBusquedaResponse {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const resultadosRaw = o.resultados ?? o.Resultados;
  const resultados = Array.isArray(resultadosRaw)
    ? resultadosRaw
        .map(normalizeResultado)
        .filter((r): r is CotizadorResultado => r !== null)
    : [];

  return {
    codigoBusqueda: pickString(o, "codigoBusqueda", "CodigoBusqueda") ?? "",
    sociedad: pickString(o, "sociedad", "Sociedad") ?? "",
    almacenVendedor: pickString(o, "almacenVendedor", "AlmacenVendedor") ?? "",
    cantidad: pickNumber(o, "cantidad", "Cantidad") ?? 1,
    resultados,
  };
}

function normalizeDescuentoMarca(raw: unknown): CotizadorDescuentoMarca | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const idDescuentoMarca =
    pickNumber(o, "idDescuentoMarca", "IdDescuentoMarca") ?? 0;
  const codigoMarca = pickString(o, "codigoMarca", "CodigoMarca") ?? "";
  const nombreMarca = pickString(o, "nombreMarca", "NombreMarca") ?? "";
  if (idDescuentoMarca <= 0 && !codigoMarca && !nombreMarca) return null;

  const activoRaw = o.activo ?? o.Activo;
  const activo =
    typeof activoRaw === "boolean" ? activoRaw : idDescuentoMarca > 0;

  return {
    idDescuentoMarca,
    idMarca: pickNumber(o, "idMarca", "IdMarca") ?? 0,
    codigoMarca,
    nombreMarca,
    descuentoBase: pickNumber(o, "descuentoBase", "DescuentoBase") ?? 0,
    descuentoAdicional:
      pickNumber(o, "descuentoAdicional", "DescuentoAdicional") ?? 0,
    vigenciaDesde: pickString(o, "vigenciaDesde", "VigenciaDesde"),
    vigenciaHasta: pickString(o, "vigenciaHasta", "VigenciaHasta"),
    activo,
  };
}

function normalizeDescuentoMarcaList(raw: unknown): CotizadorDescuentoMarca[] {
  if (Array.isArray(raw)) {
    return raw
      .map(normalizeDescuentoMarca)
      .filter((d): d is CotizadorDescuentoMarca => d !== null);
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["data", "descuentos", "items", "result"]) {
      const list = o[key];
      if (Array.isArray(list)) {
        return list
          .map(normalizeDescuentoMarca)
          .filter((d): d is CotizadorDescuentoMarca => d !== null);
      }
    }
  }
  return [];
}

/** Clave estable para cruzar resultado ↔ catálogo de descuentos. */
export function claveMarcaCotizador(valor: string | null | undefined): string {
  return (valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Precio con descuentos compuestos:
 * precioLista * (1 - base) * (1 - adicional)
 */
export function calcularPrecioConDescuento(
  precioLista: number,
  descuentoBase: number,
  descuentoAdicional: number,
): number {
  const lista = Number.isFinite(precioLista) ? Math.max(0, precioLista) : 0;
  const base = Number.isFinite(descuentoBase)
    ? Math.min(1, Math.max(0, descuentoBase))
    : 0;
  const adic = Number.isFinite(descuentoAdicional)
    ? Math.min(1, Math.max(0, descuentoAdicional))
    : 0;
  return lista * (1 - base) * (1 - adic);
}

export function recalcularResultadoConDescuento(
  item: CotizadorResultado,
  descuentoBase: number,
  descuentoAdicional: number,
  cantidad: number,
): CotizadorResultado {
  const precioConDescuento = calcularPrecioConDescuento(
    item.precioLista,
    descuentoBase,
    descuentoAdicional,
  );
  const qty = Number.isFinite(cantidad) && cantidad > 0 ? cantidad : 1;
  return {
    ...item,
    descuentoBase,
    descuentoAdicional,
    precioConDescuento,
    importe: precioConDescuento * qty,
  };
}

export function resolverDescuentoCatalogoParaMarca(
  marcaResultado: string,
  catalogo: CotizadorDescuentoMarca[],
): CotizadorDescuentoMarca | null {
  const clave = claveMarcaCotizador(marcaResultado);
  if (!clave) return null;
  return (
    catalogo.find(
      (d) =>
        claveMarcaCotizador(d.codigoMarca) === clave ||
        claveMarcaCotizador(d.nombreMarca) === clave,
    ) ?? null
  );
}

/** Descuento por marca del cliente en SAP: GET /api/DescuentosClientes */
export interface CotizadorDescuentoClienteSap {
  sociedad: string;
  cardCode: string;
  cardName: string;
  firmCode: number;
  firmName: string;
  /** Porcentaje entero, ej. 38 = 38% */
  discount: number;
}

/** Cliente único en resultados de búsqueda (top N). */
export type CotizadorClienteSapResumen = {
  cardCode: string;
  cardName: string;
  sociedad: string | null;
};

export type BuscarDescuentosClientesParams = {
  /** Texto libre: nombre, CardCode parcial, etc. */
  texto?: string;
  /** CardCode exacto (opcional). */
  cardCode?: string;
  /** Máximo de clientes distintos a devolver (default 10). */
  top?: number;
};

export type BuscarDescuentosClientesResult = {
  clientes: CotizadorClienteSapResumen[];
  filas: CotizadorDescuentoClienteSap[];
};

/** Dirección de entrega SAP: GET /api/DireccionEntrega?cardCode= */
export interface CotizadorDireccionEntrega {
  sociedad: string;
  cardCode: string;
  cardName: string;
  address: string;
  street: string;
  block: string;
  city: string;
  county: string;
  country: string;
  taxCode: string;
}

function normalizeDireccionEntrega(
  raw: unknown,
): CotizadorDireccionEntrega | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const cardCode = pickString(o, "cardCode", "CardCode") ?? "";
  if (!cardCode) return null;
  return {
    sociedad: pickString(o, "sociedad", "Sociedad") ?? "",
    cardCode,
    cardName: pickString(o, "cardName", "CardName") ?? "",
    address: pickString(o, "address", "Address", "AddressName") ?? "",
    street: pickString(o, "street", "Street") ?? "",
    block: pickString(o, "block", "Block") ?? "",
    city: pickString(o, "city", "City") ?? "",
    county: pickString(o, "county", "County") ?? "",
    country: pickString(o, "country", "Country") ?? "",
    taxCode: pickString(o, "taxCode", "TaxCode") ?? "",
  };
}

function normalizeDireccionesEntregaList(
  raw: unknown,
): CotizadorDireccionEntrega[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeDireccionEntrega)
    .filter((d): d is CotizadorDireccionEntrega => d !== null);
}

/** Arma el texto para el campo "Entregar en". */
export function formatearDireccionEntrega(
  d: CotizadorDireccionEntrega,
): string {
  const partes = [
    d.address,
    d.street,
    d.block,
    [d.city, d.county, d.country].filter(Boolean).join(", "),
  ]
    .map((p) => p.trim())
    .filter(Boolean);
  return partes.join("\n");
}

/** Extrae % IVA de taxCode tipo IVAT16 → 16. */
export function ivaDesdeTaxCode(
  taxCode: string | null | undefined,
): number | null {
  const m = String(taxCode ?? "")
    .trim()
    .toUpperCase()
    .match(/(\d+)\s*$/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

function normalizeDescuentoClienteSap(
  raw: unknown,
): CotizadorDescuentoClienteSap | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const cardCode = pickString(o, "cardCode", "CardCode") ?? "";
  const firmName = pickString(o, "firmName", "FirmName") ?? "";
  if (!cardCode || !firmName) return null;
  return {
    sociedad: pickString(o, "sociedad", "Sociedad") ?? "",
    cardCode,
    cardName: pickString(o, "cardName", "CardName") ?? "",
    firmCode: pickNumber(o, "firmCode", "FirmCode") ?? 0,
    firmName,
    discount: pickNumber(o, "discount", "Discount") ?? 0,
  };
}

function normalizeClienteSapResumen(
  raw: unknown,
): CotizadorClienteSapResumen | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const cardCode = pickString(o, "cardCode", "CardCode") ?? "";
  if (!cardCode) return null;
  return {
    cardCode,
    cardName: pickString(o, "cardName", "CardName", "nombre", "Nombre") ?? "",
    sociedad: pickString(o, "sociedad", "Sociedad"),
  };
}

function normalizeDescuentosClienteSapList(
  raw: unknown,
): CotizadorDescuentoClienteSap[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map(normalizeDescuentoClienteSap)
    .filter((d): d is CotizadorDescuentoClienteSap => d !== null);
}

/** Extrae clientes únicos (máx. top) desde filas de descuento o lista de clientes. */
export function listarClientesUnicosDescuentos(
  raw: unknown,
  filas: CotizadorDescuentoClienteSap[],
  top = 10,
): CotizadorClienteSapResumen[] {
  const limit = Math.max(1, Math.min(50, Math.trunc(top) || 10));
  const map = new Map<string, CotizadorClienteSapResumen>();

  const push = (c: CotizadorClienteSapResumen) => {
    const key = c.cardCode.trim().toUpperCase();
    if (!key || map.has(key)) return;
    map.set(key, {
      cardCode: c.cardCode.trim(),
      cardName: c.cardName.trim(),
      sociedad: c.sociedad,
    });
  };

  for (const row of filas) {
    push({
      cardCode: row.cardCode,
      cardName: row.cardName,
      sociedad: row.sociedad || null,
    });
    if (map.size >= limit) return [...map.values()];
  }

  // Respuesta tipo lista de clientes (sin firmas) o { clientes: [...] }
  const o = (raw && typeof raw === "object" ? raw : null) as Record<
    string,
    unknown
  > | null;
  const listaRaw = Array.isArray(raw)
    ? raw
    : Array.isArray(o?.clientes)
      ? o.clientes
      : Array.isArray(o?.Clientes)
        ? o.Clientes
        : [];

  for (const item of listaRaw) {
    const c = normalizeClienteSapResumen(item);
    if (c) {
      push(c);
      if (map.size >= limit) break;
    }
  }

  return [...map.values()].slice(0, limit);
}

export function filasDescuentoDeCliente(
  filas: CotizadorDescuentoClienteSap[],
  cardCode: string,
): CotizadorDescuentoClienteSap[] {
  const code = cardCode.trim().toUpperCase();
  if (!code) return [];
  return filas.filter((f) => f.cardCode.trim().toUpperCase() === code);
}

/** Convierte 38 → 0.38 para el cálculo de precio. */
export function descuentoSapPctAFraccion(discount: number): number {
  if (!Number.isFinite(discount) || discount <= 0) return 0;
  if (discount > 1) return Math.min(1, discount / 100);
  return Math.min(1, Math.max(0, discount));
}

/**
 * Deduplica por firmCode. Prefiere la sociedad indicada; si no hay match, CODIALUB; si no, todas.
 */
export function filtrarDescuentosClientePorSociedad(
  rows: CotizadorDescuentoClienteSap[],
  sociedadPreferida?: string | null,
): CotizadorDescuentoClienteSap[] {
  const pref = (sociedadPreferida ?? "").trim().toUpperCase();
  const byPref = pref
    ? rows.filter((r) => (r.sociedad ?? "").toUpperCase() === pref)
    : [];
  const byCodialub = rows.filter(
    (r) => (r.sociedad ?? "").toUpperCase() === "CODIALUB",
  );
  const source =
    byPref.length > 0 ? byPref : byCodialub.length > 0 ? byCodialub : rows;

  const map = new Map<number, CotizadorDescuentoClienteSap>();
  for (const row of source) {
    if (!map.has(row.firmCode)) map.set(row.firmCode, row);
  }
  return [...map.values()].sort((a, b) =>
    a.firmName.localeCompare(b.firmName, "es"),
  );
}

/**
 * Cruza descuento SAP con el artículo: primero por firmCode (VW_DESCUENTOSCLIENTES),
 * si no hay firmCode o no hay match, intenta por firmName ↔ marca.
 */
export function resolverDescuentoSapParaItem(
  item: { firmCode?: number | null; marca?: string | null },
  descuentosSap: CotizadorDescuentoClienteSap[],
): CotizadorDescuentoClienteSap | null {
  if (
    item.firmCode != null &&
    Number.isFinite(item.firmCode) &&
    descuentosSap.length > 0
  ) {
    const byCode = descuentosSap.find((d) => d.firmCode === item.firmCode);
    if (byCode) return byCode;
  }

  const clave = claveMarcaCotizador(item.marca);
  if (!clave) return null;
  return (
    descuentosSap.find((d) => claveMarcaCotizador(d.firmName) === clave) ?? null
  );
}

/** @deprecated Prefer resolverDescuentoSapParaItem (usa firmCode). */
export function resolverDescuentoSapParaMarca(
  marcaResultado: string,
  descuentosSap: CotizadorDescuentoClienteSap[],
): CotizadorDescuentoClienteSap | null {
  return resolverDescuentoSapParaItem(
    { marca: marcaResultado, firmCode: null },
    descuentosSap,
  );
}

export const cotizadorService = {
  buscar: async (
    payload: CotizadorBuscarPayload,
  ): Promise<CotizadorBusquedaResponse> => {
    const response = await api.post<unknown>("/api/Cotizador/buscar", {
      idVendedor: Math.trunc(payload.idVendedor),
      cantidad: Math.max(1, Math.trunc(payload.cantidad) || 1),
      codigo: payload.codigo.trim(),
    });

    if (response.status < 200 || response.status >= 300) {
      const data = response.data as {
        message?: string;
        mensaje?: string;
      } | null;
      throw new Error(
        data?.message ||
          data?.mensaje ||
          "No se pudo realizar la búsqueda en el cotizador.",
      );
    }

    return normalizeBusquedaResponse(response.data);
  },

  getDescuentos: async (
    soloActivos = true,
  ): Promise<CotizadorDescuentoMarca[]> => {
    const qs = new URLSearchParams();
    if (soloActivos) qs.set("soloActivos", "true");
    const response = await api.get<unknown>(
      `/api/Cotizador/descuentos?${qs.toString()}`,
    );

    if (response.status < 200 || response.status >= 300) {
      const data = response.data as {
        message?: string;
        mensaje?: string;
      } | null;
      throw new Error(
        data?.message ||
          data?.mensaje ||
          "No se pudieron cargar los descuentos del cotizador.",
      );
    }

    return normalizeDescuentoMarcaList(response.data);
  },

  /** Búsqueda por texto: GET /api/DescuentosClientes?texto=wer */
  buscarDescuentosClientes: async (
    params: BuscarDescuentosClientesParams,
  ): Promise<BuscarDescuentosClientesResult> => {
    const texto = (params.texto ?? params.cardCode ?? "").trim();
    const top = Math.max(1, Math.min(50, Math.trunc(params.top ?? 10) || 10));
    if (!texto) {
      return { clientes: [], filas: [] };
    }

    const qs = new URLSearchParams();
    qs.set("texto", texto);

    const response = await api.get<unknown>(
      `/api/DescuentosClientes?${qs.toString()}`,
    );

    if (response.status < 200 || response.status >= 300) {
      const data = response.data as {
        message?: string;
        mensaje?: string;
      } | null;
      throw new Error(
        data?.message ||
          data?.mensaje ||
          "No se pudieron buscar clientes / descuentos.",
      );
    }

    const filas = normalizeDescuentosClienteSapList(response.data);
    const clientes = listarClientesUnicosDescuentos(response.data, filas, top);
    return { clientes, filas };
  },

  /** Descuentos por marca: misma API con texto = CardCode. */
  getDescuentosCliente: async (
    cardCode: string,
  ): Promise<CotizadorDescuentoClienteSap[]> => {
    const code = cardCode.trim();
    if (!code) return [];
    const result = await cotizadorService.buscarDescuentosClientes({
      texto: code,
      top: 1,
    });
    return filasDescuentoDeCliente(result.filas, code);
  },

  /** Direcciones de entrega del cliente en SAP. */
  getDireccionesEntrega: async (
    cardCode: string,
  ): Promise<CotizadorDireccionEntrega[]> => {
    const code = cardCode.trim();
    if (!code) return [];
    const qs = new URLSearchParams();
    qs.set("cardCode", code);
    const response = await api.get<unknown>(
      `/api/DireccionEntrega?${qs.toString()}`,
    );

    if (response.status < 200 || response.status >= 300) {
      const data = response.data as {
        message?: string;
        mensaje?: string;
      } | null;
      throw new Error(
        data?.message ||
          data?.mensaje ||
          "No se pudieron cargar las direcciones de entrega.",
      );
    }

    return normalizeDireccionesEntregaList(response.data);
  },

  /**
   * Guarda la cotización: POST /api/Cotizaciones
   */
  guardarCotizacion: async (
    payload: CotizacionGuardarPayload,
  ): Promise<CotizacionGuardarResponse> => {
    const response = await api.post<unknown>("/api/Cotizaciones", payload);

    if (import.meta.env.DEV) {
      console.log("[Cotizador] guardar payload:", payload);
      console.log(
        "[Cotizador] guardar response:",
        response.status,
        response.data,
      );
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        formatearErrorValidacion(
          response.data,
          "No se pudo guardar la cotización.",
        ),
      );
    }

    const data = (
      response.data && typeof response.data === "object" ? response.data : {}
    ) as Record<string, unknown>;

    const folioRaw = data.folio ?? data.Folio;
    const folio =
      typeof folioRaw === "number"
        ? String(folioRaw)
        : typeof folioRaw === "string"
          ? folioRaw
          : null;

    const idRaw = data.idCotizacion ?? data.IdCotizacion ?? data.id ?? data.Id;
    const idCotizacion =
      typeof idRaw === "number"
        ? idRaw
        : typeof idRaw === "string" && idRaw.trim()
          ? Number(idRaw)
          : null;

    return {
      idCotizacion:
        idCotizacion != null && Number.isFinite(idCotizacion)
          ? idCotizacion
          : null,
      folio,
      raw: response.data,
    };
  },
};

/** Extrae detalle de errores 400 de ASP.NET (ProblemDetails.errors). */
function formatearErrorValidacion(data: unknown, fallback: string): string {
  if (!data || typeof data !== "object") return fallback;
  const o = data as Record<string, unknown>;

  const errors = o.errors;
  if (errors && typeof errors === "object") {
    const detalle = Object.entries(errors as Record<string, unknown>)
      .flatMap(([campo, valor]) => {
        if (Array.isArray(valor)) {
          return valor.map((msg) => `${campo}: ${String(msg)}`);
        }
        return [`${campo}: ${String(valor)}`];
      })
      .join(" | ");
    if (detalle) {
      const title =
        typeof o.title === "string" && o.title ? o.title : "Validación";
      return `${title} → ${detalle}`;
    }
  }

  if (typeof o.message === "string" && o.message) return o.message;
  if (typeof o.mensaje === "string" && o.mensaje) return o.mensaje;
  if (typeof o.detail === "string" && o.detail) return o.detail;
  if (typeof o.title === "string" && o.title) return o.title;
  return fallback;
}

/** Body de POST /api/Cotizaciones */
export type CotizacionGuardarDetallePayload = {
  cantidad: number;
  itemCode: string;
  itemName: string;
  suppCatNum: string;
  unidad: string;
  pl: number;
  importe: number;
  idUsuarioCreacion: number;
  activo: boolean;
};

export type CotizacionGuardarPayload = {
  folio: number;
  cardCode: string;
  cardName: string;
  direccionEntrega: string;
  idUsuarioCreacion: number;
  idEmpresa: number;
  idSucursal: number;
  empresa: string;
  sucursal: string;
  subTotal: number;
  total: number;
  iva: number;
  estatus: string;
  detalles: CotizacionGuardarDetallePayload[];
};

export type CotizacionGuardarResponse = {
  idCotizacion: number | null;
  folio: string | null;
  raw: unknown;
};
