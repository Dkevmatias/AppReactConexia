import { api } from "./apiServices";

export interface BitacoraCobranza {
  idBitacora: number;
  folio: number | null;
  idSucursal: number;
  idEmpresa: number;
  idVendedor: number;
  idRuta: number;
  idUsuarioCreacion: number;
  idUsuarioEdita: number | null;
  fechaCreacion: string | number | null;
  fechaEdita: string | number | null;
  observaciones: string | null;
  activo: boolean;
}

export interface BitacoraCobranzaPayload {
  idSucursal: number;
  idEmpresa: number;
  idVendedor: number;
  idRuta: number;
  idUsuarioCreacion: number;
  observaciones?: string | null;
  activo: boolean;
}

export interface BitacoraCobranzaUpdatePayload {
  idSucursal: number;
  idEmpresa: number;
  idVendedor: number;
  idRuta: number;
  idUsuarioEdita: number;
  observaciones?: string | null;
  activo: boolean;
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
}

export interface GenerarBitacoraResponse {
  slpName: string | null;
  uBxpRuta: string | null;
  uDiaVisita: string | null;
  sociedad: string | null;
  totalRegistros: number;
  documentos: DocumentoCobranzaGenerar[];
}

export interface GenerarBitacoraParams {
  slpName: string;
  uBxpRuta: string;
  uDiaVisita?: string;
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

export type ModoPeriodoBitacora = "dia" | "semanal";

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

function assertOk<T>(response: { status: number; data: T }, fallback: string): T {
  if (response.status < 200 || response.status >= 300) {
    const message = errorDesdeRespuesta(response.data, fallback);
    throw new Error(`HTTP ${response.status}: ${message}`);
  }
  return response.data;
}

function pickNumber(o: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
  }
  return null;
}

function pickString(o: Record<string, unknown>, ...keys: string[]): string | null {
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
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    idBitacora: pickNumber(o, "idBitacora", "IdBitacora") ?? 0,
    folio: pickNumber(o, "folio", "Folio"),
    idSucursal: pickNumber(o, "idSucursal", "IdSucursal") ?? 0,
    idEmpresa: pickNumber(o, "idEmpresa", "IdEmpresa") ?? 0,
    idVendedor: pickNumber(o, "idVendedor", "IdVendedor") ?? 0,
    idRuta: pickNumber(o, "idRuta", "IdRuta") ?? 0,
    idUsuarioCreacion: pickNumber(o, "idUsuarioCreacion", "IdUsuarioCreacion") ?? 0,
    idUsuarioEdita: pickNumber(o, "idUsuarioEdita", "IdUsuarioEdita"),
    fechaCreacion: (o.fechaCreacion ?? o.FechaCreacion ?? null) as string | number | null,
    fechaEdita: (o.fechaEdita ?? o.FechaEdita ?? null) as string | number | null,
    observaciones: pickString(o, "observaciones", "Observaciones"),
    activo: pickBool(o, "activo", "Activo"),
  };
}

function normalizeDetalle(raw: unknown): BitacoraDetalle {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    idBitacoraDetalle: pickNumber(o, "idBitacoraDetalle", "IdBitacoraDetalle") ?? 0,
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
    idUsuarioCreacion: pickNumber(o, "idUsuarioCreacion", "IdUsuarioCreacion") ?? 0,
    idUsuarioEdita: pickNumber(o, "idUsuarioEdita", "IdUsuarioEdita"),
    observaciones: pickString(o, "observaciones", "Observaciones"),
    estatus: pickString(o, "estatus", "Estatus"),
    activo: pickBool(o, "activo", "Activo"),
  };
}

function normalizeDocumento(raw: unknown): DocumentoCobranzaGenerar {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
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

function normalizeGenerarResponse(raw: unknown): GenerarBitacoraResponse {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    slpName: pickString(o, "slpName", "SlpName"),
    uBxpRuta: pickString(o, "uBxpRuta", "UBxpRuta"),
    uDiaVisita: pickString(o, "uDiaVisita", "UDiaVisita"),
    sociedad: pickString(o, "sociedad", "Sociedad"),
    totalRegistros: pickNumber(o, "totalRegistros", "TotalRegistros") ?? 0,
    documentos: normalizeArray(o.documentos ?? o.Documentos, normalizeDocumento),
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
export function detalleToDocumentoGenerar(d: BitacoraDetalle): DocumentoCobranzaGenerar {
  return {
    sociedad: d.sociedad,
    cardCode: d.cardCode,
    cardName: d.cardName,
    docNum: Number(d.docNum) || 0,
    docDate: d.docDate ?? "",
    docDueDate: d.docDueDate ?? "",
    diasVencido: d.diasVencidos,
    totalDeuda: d.total,
    porVencer: d.alCorriente,
    rango0_30: 0,
    rango31_60: 0,
    rango61_90: 0,
    rango91_120: 0,
    mas120: d.vencidas,
    numAtCard: d.referencia,
    docTotal: d.total,
    paidToDate: Math.max(d.total - d.porCobrar, 0),
    saldoDocumento: d.porCobrar,
    pymntGroup: null,
    u_BXP_RUTA: null,
    slpName: null,
    uDiaVisita: null,
    estatus: d.estatus,
  };
}

export const bitacoraCobranzaService = {
  getBitacoras: async (): Promise<BitacoraCobranza[]> => {
    const response = await api.get<unknown>("/api/BitacoraCobranza");
    return normalizeArray(assertOk(response, "No se pudieron cargar las bitácoras."), normalizeBitacora);
  },

  getBitacorasPorVendedor: async (idVendedor: number): Promise<BitacoraCobranza[]> => {
    const response = await api.get<unknown>(`/api/BitacoraCobranza/vendedor/${idVendedor}`);
    return normalizeArray(
      assertOk(response, "No se pudieron cargar las bitácoras del vendedor."),
      normalizeBitacora,
    );
  },

  getBitacorasPorRuta: async (idRuta: number): Promise<BitacoraCobranza[]> => {
    const response = await api.get<unknown>(`/api/BitacoraCobranza/ruta/${idRuta}`);
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
    return normalizeBitacora(assertOk(response, "No se pudo cargar la bitácora."));
  },

  crearBitacora: async (payload: BitacoraCobranzaPayload): Promise<BitacoraCobranza> => {
    const response = await api.post<unknown>("/api/BitacoraCobranza", payload);
    return normalizeBitacora(assertOk(response, "No se pudo crear la bitácora."));
  },

  actualizarBitacora: async (
    id: number,
    payload: BitacoraCobranzaUpdatePayload,
  ): Promise<BitacoraCobranza> => {
    const response = await api.put<unknown>(`/api/BitacoraCobranza/${id}`, payload);
    return normalizeBitacora(assertOk(response, "No se pudo actualizar la bitácora."));
  },

  eliminarBitacora: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/BitacoraCobranza/${id}`);
    assertOk(response, "No se pudo eliminar la bitácora.");
  },

  getDetallePorBitacora: async (idBitacora: number): Promise<BitacoraDetalle[]> => {
    const response = await api.get<unknown>(
      `/api/BitacoraCobranzaDetalle/bitacora/${idBitacora}`,
    );
    return normalizeArray(
      assertOk(response, "No se pudo cargar el detalle de la bitácora."),
      normalizeDetalle,
    );
  },

  crearDetalle: async (payload: BitacoraDetallePayload): Promise<BitacoraDetalle> => {
    const response = await api.post<unknown>("/api/BitacoraCobranzaDetalle", payload);
    return normalizeDetalle(assertOk(response, "No se pudo guardar el detalle."));
  },

  actualizarDetalle: async (
    id: number,
    payload: BitacoraDetalleUpdatePayload,
  ): Promise<BitacoraDetalle> => {
    const response = await api.put<unknown>(`/api/BitacoraCobranzaDetalle/${id}`, payload);
    return normalizeDetalle(assertOk(response, "No se pudo actualizar el detalle."));
  },

  eliminarDetalle: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/BitacoraCobranzaDetalle/${id}`);
    assertOk(response, "No se pudo eliminar el detalle.");
  },

  generarDocumentos: async (params: GenerarBitacoraParams): Promise<GenerarBitacoraResponse> => {
    const qs = new URLSearchParams();
    qs.append("slpName", params.slpName);
    qs.append("uBxpRuta", params.uBxpRuta);
    if (params.uDiaVisita) qs.append("uDiaVisita", params.uDiaVisita);
    if (params.sociedad) qs.append("sociedad", params.sociedad);
    const response = await api.get<unknown>(
      `/api/BitacoraCobranzaDetalle/generar?${qs.toString()}`,
    );
    return normalizeGenerarResponse(
      assertOk(response, "No se pudieron generar los documentos de cobranza."),
    );
  },

  generarDocumentosSemanal: async (
    params: Omit<GenerarBitacoraParams, "uDiaVisita">,
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
};
