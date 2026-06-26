import { api } from "./apiServices";

export interface ODistribucionDocumento {
  sociedad: string | null;
  folio: number;
  fecha: string | null;
  repartidor: string | null;
  ruta: string | null;
  idUsuario: number | null;
  nomUser: string | null;
  vehiculo: string | null;
  estatus: string | null;
  estatusS: string | null;
}

export interface ODistribucionParams {
  repartidor: string;
  ruta: string;
  fechaDesde: string;
  fechaHasta: string;
}

export interface DocODistribucionDetalle {
  sociedad: string | null;
  tipoOD: string | null;
  tipoRegistro: string | null;
  folio: number;
  entrega: number;
  documento: number;
  facturaReserva: number | null;
  facturaDeudor: number | null;
  origenFactura: string | null;
  devolucionEntrega: number | null;
  numTraspaso: number | null;
  tieneDevolucion: string | null;
  cardCode: string | null;
  cardName: string | null;
  fechaDoc: string | null;
  total: number;
  slpName: string | null;
  vehiculo: string | null;
  condicion: string | null;
  tipoCliente: string | null;
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

function normalizeDocumento(raw: unknown): ODistribucionDocumento {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    sociedad: pickString(o, "sociedad"),
    folio: pickNumber(o, "folio") ?? 0,
    fecha: pickString(o, "fecha"),
    repartidor: pickString(o, "repartidor"),
    ruta: pickString(o, "ruta"),
    idUsuario: pickNumber(o, "idUsuario"),
    nomUser: pickString(o, "nomUser"),
    vehiculo: pickString(o, "vehiculo"),
    estatus: pickString(o, "estatus"),
    estatusS: pickString(o, "estatusS"),
  };
}

function normalizeList(raw: unknown): ODistribucionDocumento[] {
  return normalizeArray(raw, normalizeDocumento);
}

function normalizeDetalle(raw: unknown): DocODistribucionDetalle {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;

  return {
    sociedad: pickString(o, "sociedad", "Sociedad"),
    tipoOD: pickString(o, "tipoOD", "TipoOD", "tipoOd"),
    tipoRegistro: pickString(o, "tipoRegistro", "TipoRegistro"),
    folio: pickNumber(o, "folio", "Folio") ?? 0,
    entrega: pickNumber(o, "entrega") ?? 0,
    documento: pickNumber(o, "documento", "Documento") ?? 0,
    facturaReserva: pickNumber(o, "facturaReserva", "FacturaReserva"),
    facturaDeudor: pickNumber(o, "facturaDeudor", "FacturaDeudor"),
    origenFactura: pickString(o, "origenFactura", "OrigenFactura"),
    devolucionEntrega: pickNumber(o, "devolucionEntrega", "DevolucionEntrega"),
    numTraspaso: pickNumber(o, "numTraspaso", "NumTraspaso"),
    tieneDevolucion: pickString(o, "tieneDevolucion", "TieneDevolucion"),
    cardCode: pickString(o, "cardCode", "CardCode"),
    cardName: pickString(o, "cardName", "CardName"),
    fechaDoc: pickString(o, "fechaDoc", "FechaDoc"),
    total: pickNumber(o, "total", "Total") ?? 0,
    slpName: pickString(o, "slpName", "SlpName"),
    vehiculo: pickString(o, "vehiculo", "Vehiculo"),
    condicion: pickString(o, "condicion", "Condicion"),
    tipoCliente: pickString(o, "tipoCliente", "TipoCliente"),
  };
}

function normalizeArray<T>(raw: unknown, map: (item: unknown) => T): T[] {
  if (Array.isArray(raw)) {
    return raw.map(map);
  }
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    for (const key of ["data", "items", "documentos", "resultado", "detalle"]) {
      const list = o[key];
      if (Array.isArray(list)) {
        return list.map(map);
      }
    }
  }
  return [];
}

function normalizeDetalleList(raw: unknown): DocODistribucionDetalle[] {
  return normalizeArray(raw, normalizeDetalle);
}

/** Convierte YYYY-MM-DD (input date) a MM-DD-YYYY para el API. */
export function fechaInputAFechaApi(fechaInput: string): string {
  const partes = fechaInput.trim().split("-");
  if (partes.length !== 3) return fechaInput;
  const [anio, mes, dia] = partes;
  if (!anio || !mes || !dia) return fechaInput;
  return `${mes}-${dia}-${anio}`;
}

export function fechaApiAFechaInput(fechaApi: string): string {
  const partes = fechaApi.trim().split("-");
  if (partes.length !== 3) return fechaApi;
  const [mes, dia, anio] = partes;
  if (!anio || !mes || !dia) return fechaApi;
  return `${anio}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

function fechaInputHoy(): string {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fechaInputInicioAnio(anio = new Date().getFullYear()): string {
  return `${anio}-01-01`;
}

export const filtrosODistribucionPorDefecto = () => ({
  repartidor: "",
  ruta: "",
  fechaDesde: fechaInputInicioAnio(),
  fechaHasta: fechaInputHoy(),
});

export const oDistribucionService = {
  getDocumentos: async (
    params: ODistribucionParams,
  ): Promise<ODistribucionDocumento[]> => {
    const qs = new URLSearchParams();
    qs.append("repartidor", params.repartidor.trim());
    qs.append("ruta", params.ruta.trim());
    qs.append("fechaDesde", params.fechaDesde);
    qs.append("fechaHasta", params.fechaHasta);

    const response = await api.get<unknown>(
      `/api/ODistribucion?${qs.toString()}`,
    );
    return normalizeList(
      assertOk(response, "No se pudo consultar la distribución."),
    );
  },

  getDetalleByFolio: async (
    idDeliveryOrder: number,
  ): Promise<DocODistribucionDetalle[]> => {
    const response = await api.get<unknown>(
      `/api/DocODistribucion?idDeliveryOrder=${Math.trunc(idDeliveryOrder)}`,
    );
    return normalizeDetalleList(
      assertOk(response, "No se pudo consultar el detalle de la orden."),
    );
  },
};
