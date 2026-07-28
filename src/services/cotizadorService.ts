import { api } from "./apiServices";

export interface CotizadorExistencia {
  almacen: string;
  disponible: number;
  precio: number;
  esAlmacenVendedor: boolean;
}

export interface CotizadorResultado {
  marca: string;
  codigoBusqueda: string;
  codigo: string;
  tieneEquivalente: boolean;
  codigoCodialub: string | null;
  tieneCodialub: boolean;
  encontradoSap: boolean;
  descripcion: string | null;
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

function pickBool(
  o: Record<string, unknown>,
  ...keys: string[]
): boolean {
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
    esAlmacenVendedor: pickBool(o, "esAlmacenVendedor", "EsAlmacenVendedor"),
  };
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

  return {
    marca,
    codigoBusqueda:
      pickString(o, "codigoBusqueda", "CodigoBusqueda") ?? "",
    codigo: pickString(o, "codigo", "Codigo") ?? "",
    tieneEquivalente: pickBool(o, "tieneEquivalente", "TieneEquivalente"),
    codigoCodialub: pickString(o, "codigoCodialub", "CodigoCodialub"),
    tieneCodialub: pickBool(o, "tieneCodialub", "TieneCodialub"),
    encontradoSap: pickBool(o, "encontradoSap", "EncontradoSap"),
    descripcion: pickString(o, "descripcion", "Descripcion"),
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

function normalizeBusquedaResponse(
  raw: unknown,
): CotizadorBusquedaResponse {
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
    codigoBusqueda:
      pickString(o, "codigoBusqueda", "CodigoBusqueda") ?? "",
    sociedad: pickString(o, "sociedad", "Sociedad") ?? "",
    almacenVendedor:
      pickString(o, "almacenVendedor", "AlmacenVendedor") ?? "",
    cantidad: pickNumber(o, "cantidad", "Cantidad") ?? 1,
    resultados,
  };
}

export const cotizadorService = {
  buscar: async (
    payload: CotizadorBuscarPayload,
  ): Promise<CotizadorBusquedaResponse> => {
    const response = await api.post<unknown>(
      "/api/Cotizador/buscar",
      {
        idVendedor: Math.trunc(payload.idVendedor),
        cantidad: Math.max(1, Math.trunc(payload.cantidad) || 1),
        codigo: payload.codigo.trim(),
      },
    );

    if (response.status < 200 || response.status >= 300) {
      const data = response.data as { message?: string; mensaje?: string } | null;
      throw new Error(
        data?.message ||
          data?.mensaje ||
          "No se pudo realizar la búsqueda en el cotizador.",
      );
    }

    return normalizeBusquedaResponse(response.data);
  },
};
