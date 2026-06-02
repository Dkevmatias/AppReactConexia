import { api } from "./apiServices";

export interface BitacoraCobranza {
  idBitacora: number;
  folio: number | null;
  idSucursal: number;
  idEmpresa: number;
  idVendedor: number;
  /** Primera ruta (compatibilidad con listados antiguos) */
  idRuta: number;
  idRutas: number[];
  idUsuarioCreacion: number;
  idUsuarioEdita: number | null;
  fechaCreacion: string | null;
  fechaEdita: string | null;
  estatus: string | null;
  observaciones: string | null;
  activo: boolean;
}

export interface BitacoraCobranzaPayload {
  idSucursal: number;
  idEmpresa: number;
  idVendedor: number;
  idRutas: number[];
  idUsuarioCreacion: number;
  observaciones?: string | null;
  estatus?: string | null;
  activo?: boolean;
}

export interface BitacoraCobranzaUpdatePayload {
  idSucursal: number;
  idEmpresa: number;
  idVendedor: number;
  idRuta: number;
  idUsuarioEdita: number;
  observaciones?: string | null;
  estatus?: string | null;
  activo: boolean;
}

export function buildBitacoraUpdatePayload(
  encabezado: BitacoraCobranza,
  options: {
    idUsuarioEdita: number;
    idVendedor?: number;
    idRuta?: number;
    observaciones?: string | null;
    estatus?: string | null;
    activo?: boolean;
  },
): BitacoraCobranzaUpdatePayload {
  return {
    idSucursal: encabezado.idSucursal,
    idEmpresa: encabezado.idEmpresa,
    idVendedor: options.idVendedor ?? encabezado.idVendedor,
    idRuta: options.idRuta ?? encabezado.idRuta,
    idUsuarioEdita: options.idUsuarioEdita,
    observaciones:
      options.observaciones !== undefined
        ? options.observaciones
        : encabezado.observaciones,
    estatus: options.estatus ?? encabezado.estatus ?? "B",
    activo: options.activo ?? encabezado.activo,
  };
}

export interface BitacoraDetalle {
  idBitacoraDetalle: number;
  idBitacora: number;
  sociedad: string | null;
  cardCode: string;
  cardName: string;
  tipoDoc: string | null;
  referencia: string | null;
  docNum: string | null;
  total: number;
  docDate: string | null;
  docDueDate: string | null;
  diasVencidos: number;
  alCorriente: number;
  vencidas: number;
  porCobrar: number;
  folio: number | null;
  fechaCreacion: string | null;
  idUsuarioCreacion: number;
  idUsuarioEdita: number | null;
  observaciones: string | null;
  estatus: string | null;
  estatusCobro: string | null;
  saldoAlCapturar: number | null;
  saldoSap: number | null;
  paidToDateSap: number | null;
  pagoPrizma: number | null;
  fechaSincSap: string | null;
  fechaSincPrizma: string | null;
  activo: boolean;
}

export interface BitacoraDetallePayload {
  idBitacora: number;
  sociedad?: string | null;
  cardCode: string;
  cardName: string;
  tipoDoc?: string | null;
  referencia?: string | null;
  docNum?: string | null;
  total: number;
  docDate?: string | null;
  docDueDate?: string | null;
  diasVencidos: number;
  alCorriente: number;
  vencidas: number;
  porCobrar: number;
  folio?: number | null;
  idUsuarioCreacion: number;
  observaciones?: string | null;
  estatus?: string | null;
  activo: boolean;
}

export type BitacoraDetalleLotePayload = Omit<
  BitacoraDetallePayload,
  "idBitacora"
>;

export interface BitacoraDetalleUpdatePayload {
  idBitacora: number;
  sociedad?: string | null;
  cardCode: string;
  cardName: string;
  tipoDoc?: string | null;
  referencia?: string | null;
  docNum?: string | null;
  total: number;
  docDate?: string | null;
  docDueDate?: string | null;
  diasVencidos: number;
  alCorriente: number;
  vencidas: number;
  porCobrar: number;
  folio?: number | null;
  idUsuarioEdita: number;
  observaciones?: string | null;
  estatus?: string | null;
  activo: boolean;
}

export interface DocumentoCobranzaGenerar {
  sociedad: string | null;
  cardCode: string;
  cardName: string;
  docNum: number;
  docDate: string;
  docDueDate: string;
  diasVencido: number;
  totalDeuda: number;
  porVencer: number;
  rango0_30: number;
  rango31_60: number;
  rango61_90: number;
  rango91_120: number;
  mas120: number;
  numAtCard: string | null;
  docTotal: number;
  paidToDate: number;
  saldoDocumento: number;
  pymntGroup: string | null;
  u_BXP_RUTA: string | null;
  slpName: string | null;
  uDiaVisita: string | null;
  estatus: string | null;
  /** Validación de cobro al abrir desde listado */
  estatusCobro?: string | null;
  idBitacoraDetalle?: number;
}

export type EstatusCobroBitacora =
  | "SIN_PAGO"
  | "PAGO_PRIZMA"
  | "PAGO_PARCIAL"
  | "PAGADO";

export const ESTATUS_COBRO_BITACORA = {
  SIN_PAGO: "SIN_PAGO",
  PAGO_PRIZMA: "PAGO_PRIZMA",
  PAGO_PARCIAL: "PAGO_PARCIAL",
  PAGADO: "PAGADO",
} as const;

export interface ValidarCobroDetalleItem {
  idBitacoraDetalle: number;
  cardCode: string;
  docNum: string;
  sociedad: string | null;
  estatusCobro: string;
}

export interface ValidarCobroBitacoraResponse {
  idBitacora: number;
  totalDetalles: number;
  actualizados: number;
  sinPago: number;
  pagoPrizma: number;
  pagoParcial: number;
  pagados: number;
  pendientes: number;
  sinClaveSap: number;
  fechaSincronizacion: string | null;
  detalles: BitacoraDetalle[];
  /** Resumen mapeado para merge por id/docNum */
  items: ValidarCobroDetalleItem[];
}

export function normalizarEstatusCobro(
  value: string | null | undefined,
): EstatusCobroBitacora {
  const v = (value ?? "").trim().toUpperCase();
  if (v === ESTATUS_COBRO_BITACORA.PAGO_PRIZMA) return "PAGO_PRIZMA";
  if (v === ESTATUS_COBRO_BITACORA.PAGO_PARCIAL) return "PAGO_PARCIAL";
  if (v === ESTATUS_COBRO_BITACORA.PAGADO) return "PAGADO";
  return "SIN_PAGO";
}

export function prioridadOrdenEstatusCobro(
  value: string | null | undefined,
): number {
  switch (normalizarEstatusCobro(value)) {
    case "PAGO_PRIZMA":
      return 0;
    case "SIN_PAGO":
      return 1;
    case "PAGO_PARCIAL":
      return 2;
    case "PAGADO":
      return 3;
    default:
      return 4;
  }
}

export function claseFilaEstatusCobro(
  value: string | null | undefined,
): string {
  switch (normalizarEstatusCobro(value)) {
    case "PAGO_PRIZMA":
      return "bg-blue-100/80 dark:bg-blue-900/35";
    case "SIN_PAGO":
      return "bg-white dark:bg-gray-800";
    case "PAGO_PARCIAL":
      return "bg-amber-100/80 dark:bg-amber-900/35";
    case "PAGADO":
      return "bg-emerald-100/80 dark:bg-emerald-900/35";
    default:
      return "";
  }
}

export function etiquetaEstatusCobro(value: string | null | undefined): string {
  switch (normalizarEstatusCobro(value)) {
    case "PAGO_PRIZMA":
      return "Pago Prizma";
    case "SIN_PAGO":
      return "Sin pago";
    case "PAGO_PARCIAL":
      return "Pago parcial";
    case "PAGADO":
      return "Pagado";
    default:
      return value?.trim() || "—";
  }
}

export function mergeEstatusCobroEnDocumentos(
  documentos: DocumentoCobranzaGenerar[],
  items: ValidarCobroDetalleItem[],
): DocumentoCobranzaGenerar[] {
  const mapa = new Map<string, ValidarCobroDetalleItem>();
  for (const item of items) {
    if (item.idBitacoraDetalle > 0) {
      mapa.set(`id:${item.idBitacoraDetalle}`, item);
    }
    mapa.set(
      `${item.sociedad ?? ""}|${item.cardCode}|${item.docNum}`,
      item,
    );
  }

  return documentos.map((doc) => {
    const porId =
      doc.idBitacoraDetalle != null && doc.idBitacoraDetalle > 0
        ? mapa.get(`id:${doc.idBitacoraDetalle}`)
        : undefined;
    const porDoc = mapa.get(
      `${doc.sociedad ?? ""}|${doc.cardCode}|${String(doc.docNum)}`,
    );
    const match = porId ?? porDoc;
    if (!match) return doc;
    return {
      ...doc,
      idBitacoraDetalle: match.idBitacoraDetalle || doc.idBitacoraDetalle,
      estatusCobro: match.estatusCobro,
    };
  });
}

export interface GenerarBitacoraResponse {
  slpName: string | null;
  uBxpRutas: string[];
  uBxpRuta: string | null;
  uDiaVisita: string | null;
  uDiaVisitas: string[];
  sociedad: string | null;
  totalRegistros: number;
  documentos: DocumentoCobranzaGenerar[];
}

export interface GenerarBitacoraParams {
  slpName: string;
  /** Códigos de ruta; omitir o vacío = toda la cartera del vendedor */
  uBxpRutas?: string[];
  /** Días SAP 1-7 (modo día específico); query: uDiaVisita=1&uDiaVisita=3 */
  uDiaVisitas?: string[];
  sociedad?: string;
}

export const DIAS_VISITA = [
  { value: "1", label: "1 - Lunes" },
  { value: "2", label: "2 - Martes" },
  { value: "3", label: "3 - Miércoles" },
  { value: "4", label: "4 - Jueves" },
  { value: "5", label: "5 - Viernes" },
  { value: "6", label: "6 - Sábado" },
  { value: "7", label: "7 - Domingo" },
] as const;

export function etiquetaDiasVisita(values: Iterable<string>): string {
  const labels = [...values]
    .map((v) => v.trim())
    .filter(Boolean)
    .sort((a, b) => Number(a) - Number(b))
    .map((v) => DIAS_VISITA.find((d) => d.value === v)?.label ?? v);
  return labels.join(", ");
}

export type ModoPeriodoBitacora = "dia" | "semanal";

/** Estatus del encabezado de bitácora: B = Borrador, T = Terminado */
export type EstatusBitacoraEncabezado = "B" | "T";

export function normalizarEstatusBitacora(
  estatus: string | null | undefined,
): EstatusBitacoraEncabezado | null {
  const valor = (estatus ?? "").trim().toUpperCase();
  if (valor === "B" || valor === "T") return valor;
  return null;
}

export function etiquetaEstatusBitacora(
  estatus: string | null | undefined,
): string {
  const codigo = normalizarEstatusBitacora(estatus);
  if (codigo === "T") return "Terminado";
  if (codigo === "B") return "Borrador";
  return estatus?.trim() || "Borrador";
}

export function claseBadgeEstatusBitacora(
  estatus: string | null | undefined,
): string {
  const codigo = normalizarEstatusBitacora(estatus) ?? "B";
  if (codigo === "T") {
    return "rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200";
  }
  return "rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
}

function errorDesdeRespuesta(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.mensaje === "string" && o.mensaje) return o.mensaje;
    if (typeof o.title === "string" && o.title) {
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
        return detalle ? `${o.title}: ${detalle}` : o.title;
      }
      if (typeof o.detail === "string" && o.detail) {
        return `${o.title}: ${o.detail}`;
      }
      return o.title;
    }
  }
  return fallback;
}

function assertOk<T>(
  response: { status: number; data: T },
  fallback: string,
): T {
  if (response.status < 200 || response.status >= 300) {
    const message = errorDesdeRespuesta(response.data, fallback);
    throw new Error(`HTTP ${response.status}: ${message}`);
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
      const parsed = Number(v);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return null;
}

function pickNumberArray(
  o: Record<string, unknown>,
  ...keys: string[]
): number[] {
  for (const key of keys) {
    const v = o[key];
    if (!Array.isArray(v)) continue;
    return v
      .map((item) => {
        if (typeof item === "number" && !Number.isNaN(item)) return item;
        if (typeof item === "string" && item.trim()) {
          const parsed = Number(item);
          return Number.isNaN(parsed) ? null : parsed;
        }
        return null;
      })
      .filter((item): item is number => item != null && item > 0);
  }
  return [];
}

function pickString(
  o: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed) return trimmed;
      continue;
    }
    if (typeof v === "number" && !Number.isNaN(v)) {
      return String(v);
    }
  }
  return null;
}

function pickSociedad(o: Record<string, unknown>): string | null {
  const direct = pickString(
    o,
    "sociedad",
    "Sociedad",
    "sociedadSAP",
    "SociedadSAP",
    "nombreSociedad",
    "NombreSociedad",
    "codigoSociedad",
    "CodigoSociedad",
    "empresa",
    "Empresa",
  );
  if (direct) return direct;

  for (const [key, value] of Object.entries(o)) {
    if (key.toLowerCase() !== "sociedad") continue;
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && !Number.isNaN(value)) return String(value);
    if (value && typeof value === "object") {
      const nested = value as Record<string, unknown>;
      const nestedValue = pickString(
        nested,
        "nombre",
        "Nombre",
        "codigo",
        "Codigo",
        "value",
        "Value",
      );
      if (nestedValue) return nestedValue;
    }
  }

  return null;
}

function pickBool(o: Record<string, unknown>, ...keys: string[]): boolean {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "boolean") return v;
  }
  return true;
}

function normalizeArray<T>(raw: unknown, map?: (item: unknown) => T): T[] {
  const list = (() => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === "object") {
      const o = raw as Record<string, unknown>;
      if (Array.isArray(o.data)) return o.data;
      if (Array.isArray(o.items)) return o.items;
      if (Array.isArray(o.documentos)) return o.documentos;
      if (Array.isArray(o.detalle)) return o.detalle;
      if (Array.isArray(o.Detalle)) return o.Detalle;
      if (Array.isArray(o.bitacoraDetalle)) return o.bitacoraDetalle;
      if (Array.isArray(o.BitacoraDetalle)) return o.BitacoraDetalle;
    }
    return [];
  })();
  return map ? list.map(map) : (list as T[]);
}

function normalizeBitacora(raw: unknown): BitacoraCobranza {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const idRutas = pickNumberArray(o, "idRutas", "IdRutas");
  const idRutaLegacy = pickNumber(o, "idRuta", "IdRuta") ?? 0;
  const rutas =
    idRutas.length > 0 ? idRutas : idRutaLegacy > 0 ? [idRutaLegacy] : [];

  return {
    idBitacora: pickNumber(o, "idBitacora", "IdBitacora") ?? 0,
    folio: pickNumber(o, "folio", "Folio"),
    idSucursal: pickNumber(o, "idSucursal", "IdSucursal") ?? 0,
    idEmpresa: pickNumber(o, "idEmpresa", "IdEmpresa") ?? 0,
    idVendedor: pickNumber(o, "idVendedor", "IdVendedor") ?? 0,
    idRuta: rutas[0] ?? idRutaLegacy,
    idRutas: rutas,
    idUsuarioCreacion:
      pickNumber(o, "idUsuarioCreacion", "IdUsuarioCreacion") ?? 0,
    idUsuarioEdita: pickNumber(o, "idUsuarioEdita", "IdUsuarioEdita"),
    fechaCreacion: (o.fechaCreacion ?? o.FechaCreacion ?? null) as
      | string
      | null,
    fechaEdita: (o.fechaEdita ?? o.FechaEdita ?? null) as string | null,
    observaciones: pickString(o, "observaciones", "Observaciones"),
    estatus: pickString(o, "estatus", "Estatus"),
    activo: pickBool(o, "activo", "Activo"),
  };
}

function normalizeDetalle(raw: unknown): BitacoraDetalle {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    idBitacoraDetalle:
      pickNumber(o, "idBitacoraDetalle", "IdBitacoraDetalle") ?? 0,
    idBitacora: pickNumber(o, "idBitacora", "IdBitacora") ?? 0,
    sociedad: pickSociedad(o),
    cardCode: pickString(o, "cardCode", "CardCode") ?? "",
    cardName: pickString(o, "cardName", "CardName") ?? "",
    tipoDoc: pickString(o, "tipoDoc", "TipoDoc"),
    referencia: pickString(o, "referencia", "Referencia"),
    docNum: pickString(o, "docNum", "DocNum"),
    total: pickNumber(o, "total", "Total") ?? 0,
    docDate: pickString(o, "docDate", "DocDate"),
    docDueDate: pickString(o, "docDueDate", "DocDueDate"),
    diasVencidos: pickNumber(o, "diasVencidos", "DiasVencidos") ?? 0,
    alCorriente: pickNumber(o, "alCorriente", "AlCorriente") ?? 0,
    vencidas: pickNumber(o, "vencidas", "Vencidas") ?? 0,
    porCobrar: pickNumber(o, "porCobrar", "PorCobrar") ?? 0,
    folio: pickNumber(o, "folio", "Folio"),
    fechaCreacion: pickString(o, "fechaCreacion", "FechaCreacion"),
    idUsuarioCreacion:
      pickNumber(o, "idUsuarioCreacion", "IdUsuarioCreacion") ?? 0,
    idUsuarioEdita: pickNumber(o, "idUsuarioEdita", "IdUsuarioEdita"),
    observaciones: pickString(o, "observaciones", "Observaciones"),
    estatus: pickString(o, "estatus", "Estatus"),
    estatusCobro: pickString(o, "estatusCobro", "EstatusCobro"),
    saldoAlCapturar: pickNumber(o, "saldoAlCapturar", "SaldoAlCapturar"),
    saldoSap: pickNumber(o, "saldoSap", "SaldoSap"),
    paidToDateSap: pickNumber(o, "paidToDateSap", "PaidToDateSap"),
    pagoPrizma: pickNumber(o, "pagoPrizma", "PagoPrizma"),
    fechaSincSap: pickString(o, "fechaSincSap", "FechaSincSap"),
    fechaSincPrizma: pickString(o, "fechaSincPrizma", "FechaSincPrizma"),
    activo: pickBool(o, "activo", "Activo"),
  };
}

function normalizeDocumento(raw: unknown): DocumentoCobranzaGenerar {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    sociedad: pickString(o, "sociedad", "Sociedad"),
    cardCode: pickString(o, "cardCode", "CardCode") ?? "",
    cardName: pickString(o, "cardName", "CardName") ?? "",
    docNum: pickNumber(o, "docNum", "DocNum") ?? 0,
    docDate: pickString(o, "docDate", "DocDate") ?? "",
    docDueDate: pickString(o, "docDueDate", "DocDueDate") ?? "",
    diasVencido: pickNumber(o, "diasVencido", "DiasVencido") ?? 0,
    totalDeuda: pickNumber(o, "totalDeuda", "TotalDeuda") ?? 0,
    porVencer: pickNumber(o, "porVencer", "PorVencer") ?? 0,
    rango0_30: pickNumber(o, "rango0_30", "Rango0_30") ?? 0,
    rango31_60: pickNumber(o, "rango31_60", "Rango31_60") ?? 0,
    rango61_90: pickNumber(o, "rango61_90", "Rango61_90") ?? 0,
    rango91_120: pickNumber(o, "rango91_120", "Rango91_120") ?? 0,
    mas120: pickNumber(o, "mas120", "Mas120") ?? 0,
    numAtCard: pickString(o, "numAtCard", "NumAtCard"),
    docTotal: pickNumber(o, "docTotal", "DocTotal") ?? 0,
    paidToDate: pickNumber(o, "paidToDate", "PaidToDate") ?? 0,
    saldoDocumento: pickNumber(o, "saldoDocumento", "SaldoDocumento") ?? 0,
    pymntGroup: pickString(o, "pymntGroup", "PymntGroup"),
    u_BXP_RUTA: pickString(o, "u_BXP_RUTA", "U_BXP_RUTA"),
    slpName: pickString(o, "slpName", "SlpName"),
    uDiaVisita: pickString(o, "uDiaVisita", "UDiaVisita"),
    estatus: pickString(o, "estatus", "Estatus"),
  };
}

function pickStringArray(
  o: Record<string, unknown>,
  ...keys: string[]
): string[] {
  for (const key of keys) {
    const v = o[key];
    if (Array.isArray(v)) {
      return v
        .map((item) => String(item ?? "").trim())
        .filter((item) => item.length > 0);
    }
    if (typeof v === "string" && v.trim()) {
      return v
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }
  return [];
}

/** Repite el parámetro en query (ej. uBxpRuta=A&uBxpRuta=B, uDiaVisita=1&uDiaVisita=3). */
function appendQueryList(
  qs: URLSearchParams,
  paramName: string,
  values?: string[],
): void {
  (values ?? []).forEach((raw) => {
    const value = raw.trim();
    if (value) qs.append(paramName, value);
  });
}

function normalizeGenerarResponse(raw: unknown): GenerarBitacoraResponse {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const uBxpRutas = pickStringArray(o, "uBxpRutas", "UBxpRutas");
  const uBxpRutaLegacy = pickString(o, "uBxpRuta", "UBxpRuta");
  const rutas =
    uBxpRutas.length > 0
      ? uBxpRutas
      : uBxpRutaLegacy
        ? uBxpRutaLegacy
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [];

  const uDiaVisitas = pickStringArray(
    o,
    "uDiaVisitas",
    "UDiaVisitas",
    "uDiaVisita",
    "UDiaVisita",
  );
  const uDiaVisitaLegacy = pickString(o, "uDiaVisita", "UDiaVisita");
  const diasVisita =
    uDiaVisitas.length > 0
      ? uDiaVisitas
      : uDiaVisitaLegacy
        ? uDiaVisitaLegacy
            .split(",")
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
        : [];

  return {
    slpName: pickString(o, "slpName", "SlpName"),
    uBxpRutas: rutas,
    uBxpRuta: uBxpRutaLegacy ?? (rutas.length ? rutas.join(",") : null),
    uDiaVisita: diasVisita[0] ?? uDiaVisitaLegacy,
    uDiaVisitas: diasVisita,
    sociedad: pickString(o, "sociedad", "Sociedad"),
    totalRegistros: pickNumber(o, "totalRegistros", "TotalRegistros") ?? 0,
    documentos: normalizeArray(
      o.documentos ?? o.Documentos,
      normalizeDocumento,
    ),
  };
}

export function calcularVencidas(doc: DocumentoCobranzaGenerar): number {
  return (
    doc.rango0_30 +
    doc.rango31_60 +
    doc.rango61_90 +
    doc.rango91_120 +
    doc.mas120
  );
}

export function documentoToDetallePayload(
  doc: DocumentoCobranzaGenerar,
  idBitacora: number,
  idUsuarioCreacion: number,
): BitacoraDetallePayload {
  return {
    idBitacora,
    sociedad: doc.sociedad?.trim() || null,
    cardCode: doc.cardCode,
    cardName: doc.cardName,
    tipoDoc: "FV",
    referencia: doc.numAtCard ?? "",
    docNum: String(doc.docNum),
    total: doc.docTotal,
    docDate: doc.docDate,
    docDueDate: doc.docDueDate,
    diasVencidos: doc.diasVencido,
    alCorriente: doc.porVencer,
    vencidas: calcularVencidas(doc),
    porCobrar: doc.saldoDocumento,
    folio: doc.docNum,
    idUsuarioCreacion,
    observaciones: "",
    estatus: doc.estatus || "P",
    activo: true,
  };
}

export function documentoToDetalleLotePayload(
  doc: DocumentoCobranzaGenerar,
  idUsuarioCreacion: number,
): BitacoraDetalleLotePayload {
  const { idBitacora: _idBitacora, ...payload } = documentoToDetallePayload(
    doc,
    0,
    idUsuarioCreacion,
  );
  return payload;
}

/** Convierte un registro guardado de detalle al formato usado en pantalla/PDF. */
export function detalleToDocumentoGenerar(
  d: BitacoraDetalle,
): DocumentoCobranzaGenerar {
  return {
    sociedad: d.sociedad,
    cardCode: d.cardCode,
    cardName: d.cardName,
    docNum: Number(d.docNum) || 0,
    docDate: d.docDate ?? "",
    docDueDate: d.docDueDate ?? "",
    diasVencido: d.diasVencidos,
    totalDeuda: d.alCorriente + d.vencidas + d.porCobrar,
    porVencer: d.alCorriente,
    rango0_30: 0,
    rango31_60: 0,
    rango61_90: 0,
    rango91_120: 0,
    mas120: d.vencidas,
    numAtCard: d.referencia,
    docTotal: d.total,
    paidToDate:
      d.paidToDateSap ??
      (d.pagoPrizma != null && d.pagoPrizma > 0
        ? d.pagoPrizma
        : Math.max(d.total - d.porCobrar, 0)),
    saldoDocumento: d.saldoSap ?? d.porCobrar,
    pymntGroup: null,
    u_BXP_RUTA: null,
    slpName: null,
    uDiaVisita: null,
    estatus: d.estatus,
    estatusCobro: d.estatusCobro,
    idBitacoraDetalle: d.idBitacoraDetalle,
  };
}

function detalleToValidarCobroItem(d: BitacoraDetalle): ValidarCobroDetalleItem {
  return {
    idBitacoraDetalle: d.idBitacoraDetalle,
    cardCode: d.cardCode,
    docNum: d.docNum ?? String(d.folio ?? ""),
    sociedad: d.sociedad,
    estatusCobro: d.estatusCobro ?? ESTATUS_COBRO_BITACORA.SIN_PAGO,
  };
}

function normalizeValidarCobroResponse(
  raw: unknown,
): ValidarCobroBitacoraResponse {
  if (Array.isArray(raw)) {
    const detalles = normalizeArray(raw, normalizeDetalle);
    return {
      idBitacora: 0,
      totalDetalles: detalles.length,
      actualizados: 0,
      sinPago: 0,
      pagoPrizma: 0,
      pagoParcial: 0,
      pagados: 0,
      pendientes: 0,
      sinClaveSap: 0,
      fechaSincronizacion: null,
      detalles,
      items: detalles.map(detalleToValidarCobroItem),
    };
  }

  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const detallesRaw =
    o.detalles ??
    o.Detalles ??
    o.detalle ??
    o.Detalle ??
    o.items ??
    o.Items ??
    o.bitacoraDetalle ??
    o.BitacoraDetalle ??
    o.registros ??
    o.Registros;

  const detalles = normalizeArray(detallesRaw, normalizeDetalle);

  return {
    idBitacora: pickNumber(o, "idBitacora", "IdBitacora") ?? 0,
    totalDetalles:
      pickNumber(o, "totalDetalles", "TotalDetalles", "total", "Total") ??
      detalles.length,
    actualizados: pickNumber(o, "actualizados", "Actualizados") ?? 0,
    sinPago: pickNumber(o, "sinPago", "SinPago") ?? 0,
    pagoPrizma: pickNumber(o, "pagoPrizma", "PagoPrizma") ?? 0,
    pagoParcial: pickNumber(o, "pagoParcial", "PagoParcial") ?? 0,
    pagados: pickNumber(o, "pagados", "Pagados") ?? 0,
    pendientes: pickNumber(o, "pendientes", "Pendientes") ?? 0,
    sinClaveSap: pickNumber(o, "sinClaveSap", "SinClaveSap") ?? 0,
    fechaSincronizacion: pickString(
      o,
      "fechaSincronizacion",
      "FechaSincronizacion",
    ),
    detalles,
    items: detalles.map(detalleToValidarCobroItem),
  };
}

export const bitacoraCobranzaService = {
  getBitacoras: async (): Promise<BitacoraCobranza[]> => {
    const response = await api.get<unknown>("/api/BitacoraCobranza");
    return normalizeArray(
      assertOk(response, "No se pudieron cargar las bitácoras."),
      normalizeBitacora,
    );
  },

  getBitacorasPorVendedor: async (
    idVendedor: number,
  ): Promise<BitacoraCobranza[]> => {
    const response = await api.get<unknown>(
      `/api/BitacoraCobranza/vendedor/${idVendedor}`,
    );
    return normalizeArray(
      assertOk(response, "No se pudieron cargar las bitácoras del vendedor."),
      normalizeBitacora,
    );
  },

  getBitacorasPorRuta: async (idRuta: number): Promise<BitacoraCobranza[]> => {
    const response = await api.get<unknown>(
      `/api/BitacoraCobranza/ruta/${idRuta}`,
    );
    return normalizeArray(
      assertOk(response, "No se pudieron cargar las bitácoras de la ruta."),
      normalizeBitacora,
    );
  },

  getBitacorasPorUsuario: async (
    idUsuario: number,
    soloActivos = true,
  ): Promise<BitacoraCobranza[]> => {
    const qs = new URLSearchParams();
    if (soloActivos) qs.set("soloActivos", "true");
    const query = qs.toString();
    const response = await api.get<unknown>(
      `/api/BitacoraCobranza/Usuario/${idUsuario}${query ? `?${query}` : ""}`,
    );
    return normalizeArray(
      assertOk(response, "No se pudieron cargar las bitácoras del usuario."),
      normalizeBitacora,
    );
  },

  getBitacoraPorId: async (id: number): Promise<BitacoraCobranza> => {
    const response = await api.get<unknown>(`/api/BitacoraCobranza/${id}`);
    return normalizeBitacora(
      assertOk(response, "No se pudo cargar la bitácora."),
    );
  },

  crearBitacora: async (
    payload: BitacoraCobranzaPayload,
  ): Promise<BitacoraCobranza> => {
    const response = await api.post<unknown>("/api/BitacoraCobranza", payload);
    return normalizeBitacora(
      assertOk(response, "No se pudo crear la bitácora."),
    );
  },

  actualizarBitacora: async (
    id: number,
    payload: BitacoraCobranzaUpdatePayload,
  ): Promise<BitacoraCobranza> => {
    const response = await api.put<unknown>(
      `/api/BitacoraCobranza/${id}`,
      payload,
    );
    return normalizeBitacora(
      assertOk(response, "No se pudo actualizar la bitácora."),
    );
  },

  eliminarBitacora: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/BitacoraCobranza/${id}`);
    assertOk(response, "No se pudo eliminar la bitácora.");
  },

  getDetallePorBitacora: async (
    idBitacora: number,
  ): Promise<BitacoraDetalle[]> => {
    const response = await api.get<unknown>(
      `/api/BitacoraCobranzaDetalle/bitacora/${idBitacora}`,
    );
    return normalizeArray(
      assertOk(response, "No se pudo cargar el detalle de la bitácora."),
      normalizeDetalle,
    );
  },

  crearDetalle: async (
    payload: BitacoraDetallePayload,
  ): Promise<BitacoraDetalle> => {
    const response = await api.post<unknown>(
      "/api/BitacoraCobranzaDetalle",
      payload,
    );
    return normalizeDetalle(
      assertOk(response, "No se pudo guardar el detalle."),
    );
  },

  actualizarDetalle: async (
    id: number,
    payload: BitacoraDetalleUpdatePayload,
  ): Promise<BitacoraDetalle> => {
    const response = await api.put<unknown>(
      `/api/BitacoraCobranzaDetalle/${id}`,
      payload,
    );
    return normalizeDetalle(
      assertOk(response, "No se pudo actualizar el detalle."),
    );
  },

  eliminarDetalle: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(
      `/api/BitacoraCobranzaDetalle/${id}`,
    );
    assertOk(response, "No se pudo eliminar el detalle.");
  },

  generarDocumentos: async (
    params: GenerarBitacoraParams,
  ): Promise<GenerarBitacoraResponse> => {
    const qs = new URLSearchParams();
    qs.append("slpName", params.slpName);
    appendQueryList(qs, "uBxpRuta", params.uBxpRutas);
    appendQueryList(qs, "uDiaVisita", params.uDiaVisitas);
    if (params.sociedad) qs.append("sociedad", params.sociedad);
    const response = await api.get<unknown>(
      `/api/BitacoraCobranzaDetalle/generar?${qs.toString()}`,
    );
    return normalizeGenerarResponse(
      assertOk(response, "No se pudieron generar los documentos de cobranza."),
    );
  },

  generarDocumentosSemanal: async (
    params: Omit<GenerarBitacoraParams, "uDiaVisitas">,
  ): Promise<GenerarBitacoraResponse> => {
    return bitacoraCobranzaService.generarDocumentos(params);
  },

  guardarDetalleEnLote: async (
    documentos: DocumentoCobranzaGenerar[],
    idBitacora: number,
    idUsuarioCreacion: number,
  ): Promise<BitacoraDetalle[]> => {
    const payload: BitacoraDetalleLotePayload[] = documentos.map((doc) =>
      documentoToDetalleLotePayload(doc, idUsuarioCreacion),
    );
    const response = await api.post<unknown>(
      `/api/BitacoraCobranzaDetalle/bitacora/${idBitacora}/lote`,
      payload,
    );
    return normalizeArray(
      assertOk(response, "No se pudo guardar el detalle en lote."),
      normalizeDetalle,
    );
  },

  validarCobroBitacora: async (
    idBitacora: number,
  ): Promise<ValidarCobroBitacoraResponse> => {
    const response = await api.post<unknown>(
      `/api/BitacoraCobranzaDetalle/bitacora/${idBitacora}/validar-cobro`,
    );
    return normalizeValidarCobroResponse(
      assertOk(response, "No se pudo validar el cobro de la bitácora."),
    );
  },

  /** Búsqueda de clientes (autocomplete o detalle con documentos). */
  buscarClientes: async (
    params: BuscarClientesBitacoraParams,
  ): Promise<BuscarClientesBitacoraResponse> => {
    const qs = new URLSearchParams();

    if (params.incluirDocumentos && params.cardCode?.trim()) {
      const texto = params.texto?.trim() || params.cardCode.trim();
      qs.append("texto", texto);
      qs.append("cardCode", params.cardCode.trim());
      if (params.sociedad?.trim()) {
        qs.append("sociedad", params.sociedad.trim());
      }
      qs.append("incluirDocumentos", "true");
      if (params.slpName?.trim()) {
        qs.append("slpName", params.slpName.trim());
      }
    } else {
      const texto = params.texto?.trim() ?? "";
      if (!texto) {
        return emptyBuscarClientesResponse();
      }
      qs.append("texto", texto);
      if (params.slpName?.trim()) {
        qs.append("slpName", params.slpName.trim());
      }
      appendQueryList(qs, "uBxpRuta", params.uBxpRutas);
      if (params.sociedad?.trim()) {
        qs.append("sociedad", params.sociedad.trim());
      }
      if (params.soloConCarteraVencida != null) {
        qs.append(
          "soloConCarteraVencida",
          params.soloConCarteraVencida ? "true" : "false",
        );
      }
    }

    const response = await api.get<unknown>(
      `/api/BitacoraCobranzaDetalle/buscar-clientes?${qs.toString()}`,
    );
    return normalizeBuscarClientesResponse(
      assertOk(response, "No se pudieron buscar clientes."),
    );
  },
};

export interface BuscarClientesBitacoraParams {
  /** Autocomplete por texto */
  texto?: string;
  /** Detalle de un cliente con documentos */
  cardCode?: string;
  sociedad?: string;
  incluirDocumentos?: boolean;
  slpName?: string;
  uBxpRutas?: string[];
  soloConCarteraVencida?: boolean;
}

export interface BuscarClientesBitacoraResponse {
  texto: string | null;
  cardCode: string | null;
  slpName: string | null;
  uBxpRutas: string[];
  sociedad: string | null;
  soloConCarteraVencida: boolean;
  incluirDocumentos: boolean;
  documentosIncluidos: boolean;
  total: number;
  clientes: ClienteBitacoraBusqueda[];
}

export interface ClienteBitacoraBusqueda {
  cardCode: string;
  cardName: string;
  sociedad: string | null;
  saldoTotal: number;
  carteraVencida: number;
  documentos: number;
  detalleDocumentos: DocumentoCobranzaGenerar[];
}

export function clienteBitacoraBusquedaKey(
  cliente: ClienteBitacoraBusqueda,
): string {
  return `${cliente.sociedad ?? ""}|${cliente.cardCode}`;
}

export function documentoCobranzaUnicoKey(
  doc: DocumentoCobranzaGenerar,
): string {
  return `${doc.sociedad ?? ""}|${doc.cardCode}|${doc.docNum}|${doc.docDate}`;
}

function emptyBuscarClientesResponse(): BuscarClientesBitacoraResponse {
  return {
    texto: null,
    cardCode: null,
    slpName: null,
    uBxpRutas: [],
    sociedad: null,
    soloConCarteraVencida: false,
    incluirDocumentos: false,
    documentosIncluidos: false,
    total: 0,
    clientes: [],
  };
}

function normalizeBuscarClientesResponse(
  raw: unknown,
): BuscarClientesBitacoraResponse {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const clientesRaw = o.clientes ?? o.Clientes;
  const uBxpRutasRaw = o.uBxpRutas ?? o.UBxpRutas ?? o.uBxpRuta ?? o.UBxpRuta;

  return {
    texto: pickString(o, "texto", "Texto"),
    cardCode: pickString(o, "cardCode", "CardCode"),
    slpName: pickString(o, "slpName", "SlpName", "slPName", "SlPName"),
    uBxpRutas: Array.isArray(uBxpRutasRaw)
      ? uBxpRutasRaw
          .map((item) => (typeof item === "string" ? item.trim() : ""))
          .filter(Boolean)
      : [],
    sociedad: pickString(o, "sociedad", "Sociedad"),
    soloConCarteraVencida: pickBool(
      o,
      "soloConCarteraVencida",
      "SoloConCarteraVencida",
    ),
    incluirDocumentos: (() => {
      const v = o.incluirDocumentos ?? o.IncluirDocumentos;
      return typeof v === "boolean" ? v : false;
    })(),
    documentosIncluidos: (() => {
      const v = o.documentosIncluidos ?? o.DocumentosIncluidos;
      return typeof v === "boolean" ? v : false;
    })(),
    total: pickNumber(o, "total", "Total") ?? 0,
    clientes: normalizeArray(clientesRaw, normalizeClienteBitacoraBusqueda),
  };
}

function normalizeClienteBitacoraBusqueda(
  raw: unknown,
): ClienteBitacoraBusqueda {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const detalleRaw =
    o.detalleDocumentos ?? o.DetalleDocumentos ?? o.documentosDetalle;

  return {
    cardCode: pickString(o, "cardCode", "CardCode", "codigo", "Codigo") ?? "",
    cardName: pickString(o, "cardName", "CardName", "nombre", "Nombre") ?? "",
    sociedad: pickString(o, "sociedad", "Sociedad"),
    saldoTotal:
      pickNumber(o, "saldoTotal", "SaldoTotal", "total", "Total") ?? 0,
    carteraVencida:
      pickNumber(o, "carteraVencida", "CarteraVencida", "vencida", "Vencida") ??
      0,
    documentos: pickNumber(o, "documentos", "Documentos") ?? 0,
    detalleDocumentos: normalizeArray(detalleRaw, normalizeDocumento),
  };
}
