import { api } from "./apiServices";

export type TipoActividadTimeline =
  | "mensaje"
  | "llamada"
  | "visita"
  | "cotizacion"
  | "nota"
  | "recordatorio"
  | "etapa"
  | "sistema"
  | "otro";

export type ActivityTimelineItem = {
  id: number;
  idLead: number | null;
  tipo: TipoActividadTimeline;
  titulo: string;
  descripcion: string | null;
  fecha: string | null;
  idUsuario: number | null;
  nombreUsuario: string | null;
};

export type MensajeSeguimientoPayload = {
  idContacto?: number | null;
  idConversacion?: number | null;
  idPlantilla?: number | null;
  canal?: string | null;
  telefono?: string | null;
  cuerpo?: string | null;
  messageSid?: string | null;
  estatusEnvio?: string | null;
  errorMensaje?: string | null;
  fechaEnvio?: string | null;
};

export type LlamadaSeguimientoPayload = {
  idContacto?: number | null;
  telefono?: string | null;
  entrante?: boolean;
  resultado?: string | null;
  duracionSegundos?: number | null;
  observaciones?: string | null;
  fechaLlamada?: string | null;
};

export type VisitaSeguimientoPayload = {
  idCliente?: number | null;
  idContacto?: number | null;
  direccion?: string | null;
  ciudad?: string | null;
  estado?: string | null;
  resultado?: string | null;
  observaciones?: string | null;
  completada?: boolean;
  fechaVisita?: string | null;
};

export type CotizacionSeguimientoPayload = {
  idCotizacion?: number | null;
  docEntry?: number | null;
  docNum?: number | null;
  cardCode?: string | null;
  folio?: string | null;
  total?: number | null;
  moneda?: string | null;
  estatus?: string | null;
  comentarios?: string | null;
};

export type LeadSeguimientoCreatePayload = {
  idLead: number;
  idUsuarioCreacion: number;
  /** 2 = Nota, 3 = Recordatorio (sin detalle nested). */
  idTipoSeguimiento?: number | null;
  comentario?: string | null;
  idUsuarioAsignado?: number | null;
  fechaSeguimiento?: string | null;
  estatus?: string | null;
  activo?: boolean;
  mensaje?: MensajeSeguimientoPayload | null;
  llamada?: LlamadaSeguimientoPayload | null;
  visita?: VisitaSeguimientoPayload | null;
  cotizacion?: CotizacionSeguimientoPayload | null;
};

export type LeadSeguimientoDetalle = {
  id: number;
  idLead: number | null;
  tipo: TipoActividadTimeline;
  comentario: string | null;
  fechaSeguimiento: string | null;
  mensaje: MensajeSeguimientoPayload | null;
  llamada: LlamadaSeguimientoPayload | null;
  visita: VisitaSeguimientoPayload | null;
  cotizacion: CotizacionSeguimientoPayload | null;
};

function pickBool(
  o: Record<string, unknown>,
  ...keys: string[]
): boolean | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "boolean") return v;
    if (v === 1 || v === "1" || v === "true" || v === "S" || v === "s") return true;
    if (v === 0 || v === "0" || v === "false" || v === "N" || v === "n") return false;
  }
  return null;
}

function normalizeMensajeDetalle(
  raw: unknown,
): MensajeSeguimientoPayload | null {
  const o = asRecord(raw);
  if (!Object.keys(o).length) return null;
  return {
    idContacto: pickNumber(o, "idContacto", "IdContacto"),
    idConversacion: pickNumber(o, "idConversacion", "IdConversacion"),
    idPlantilla: pickNumber(o, "idPlantilla", "IdPlantilla"),
    canal: pickString(o, "canal", "Canal"),
    telefono: pickString(o, "telefono", "Telefono"),
    cuerpo: pickString(o, "cuerpo", "Cuerpo"),
    messageSid: pickString(o, "messageSid", "MessageSid"),
    estatusEnvio: pickString(o, "estatusEnvio", "EstatusEnvio"),
    errorMensaje: pickString(o, "errorMensaje", "ErrorMensaje"),
    fechaEnvio: pickFecha(o, "fechaEnvio", "FechaEnvio"),
  };
}

function normalizeLlamadaDetalle(
  raw: unknown,
): LlamadaSeguimientoPayload | null {
  const o = asRecord(raw);
  if (!Object.keys(o).length) return null;
  return {
    idContacto: pickNumber(o, "idContacto", "IdContacto"),
    telefono: pickString(o, "telefono", "Telefono"),
    entrante: pickBool(o, "entrante", "Entrante") ?? false,
    resultado:
      pickString(o, "resultado", "Resultado") ||
      pickString(o, "resultadoLlamada", "ResultadoLlamada"),
    duracionSegundos: pickNumber(o, "duracionSegundos", "DuracionSegundos"),
    observaciones: pickString(o, "observaciones", "Observaciones"),
    fechaLlamada: pickFecha(o, "fechaLlamada", "FechaLlamada"),
  };
}

function normalizeVisitaDetalle(raw: unknown): VisitaSeguimientoPayload | null {
  const o = asRecord(raw);
  if (!Object.keys(o).length) return null;
  return {
    idCliente: pickNumber(o, "idCliente", "IdCliente"),
    idContacto: pickNumber(o, "idContacto", "IdContacto"),
    direccion: pickString(o, "direccion", "Direccion"),
    ciudad: pickString(o, "ciudad", "Ciudad"),
    estado: pickString(o, "estado", "Estado"),
    resultado:
      pickString(o, "resultado", "Resultado") ||
      pickString(o, "resultadoCita", "ResultadoCita"),
    observaciones: pickString(o, "observaciones", "Observaciones"),
    completada: pickBool(o, "completada", "Completada") ?? false,
    fechaVisita: pickFecha(o, "fechaVisita", "FechaVisita"),
  };
}

function normalizeCotizacionDetalle(
  raw: unknown,
): CotizacionSeguimientoPayload | null {
  const o = asRecord(raw);
  if (!Object.keys(o).length) return null;
  return {
    idCotizacion: pickNumber(o, "idCotizacion", "IdCotizacion"),
    docEntry: pickNumber(o, "docEntry", "DocEntry"),
    docNum: pickNumber(o, "docNum", "DocNum"),
    cardCode: pickString(o, "cardCode", "CardCode"),
    folio: pickString(o, "folio", "Folio"),
    total: pickNumber(o, "total", "Total"),
    moneda: pickString(o, "moneda", "Moneda"),
    estatus: pickString(o, "estatus", "Estatus"),
    comentarios: pickString(o, "comentarios", "Comentarios"),
  };
}

export function normalizeLeadSeguimientoDetalle(
  raw: unknown,
): LeadSeguimientoDetalle | null {
  const o = asRecord(raw);
  const id =
    pickNumber(o, "idSeguimiento", "IdSeguimiento", "id", "Id") ?? 0;
  if (!id) return null;
  const idTipo = pickNumber(o, "idTipoSeguimiento", "IdTipoSeguimiento");
  const tipo =
    tipoDesdeId(idTipo) ??
    normalizarTipo(
      pickString(o, "tipoSeguimiento", "TipoSeguimiento", "tipo", "Tipo"),
    );
  return {
    id,
    idLead: pickNumber(o, "idLead", "IdLead"),
    tipo,
    comentario: pickString(o, "comentario", "Comentario"),
    fechaSeguimiento: pickFecha(
      o,
      "fechaSeguimiento",
      "FechaSeguimiento",
      "fechaCreacion",
      "FechaCreacion",
    ),
    mensaje: normalizeMensajeDetalle(o.mensaje ?? o.Mensaje),
    llamada: normalizeLlamadaDetalle(o.llamada ?? o.Llamada),
    visita: normalizeVisitaDetalle(o.visita ?? o.Visita),
    cotizacion: normalizeCotizacionDetalle(o.cotizacion ?? o.Cotizacion),
  };
}

function errorDesdeRespuesta(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.detail === "string" && o.detail) return o.detail;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.mensaje === "string" && o.mensaje) return o.mensaje;
    if (typeof o.title === "string" && o.title) return o.title;
  }
  return fallback;
}

/** Teléfono solo dígitos, máx. 20 (columna LeadSeguimientosMensaje/Llamada). */
export function sanitizarTelefonoSeguimiento(
  valor: string | null | undefined,
): string | null {
  const digits = (valor ?? "").replace(/\D/g, "");
  if (!digits) return null;
  return digits.slice(0, 20);
}

function truncarTexto(
  valor: string | null | undefined,
  max: number,
): string | null {
  const t = (valor ?? "").trim();
  if (!t) return null;
  return t.length <= max ? t : t.slice(0, max);
}

function normalizeArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.items)) return o.items;
    if (Array.isArray(o.result)) return o.result;
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
  }
  return null;
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

function pickFecha(o: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString();
  }
  return null;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function tipoDesdeId(idTipo: number | null): TipoActividadTimeline | null {
  switch (idTipo) {
    case 1:
      return "llamada";
    case 2:
      return "nota";
    case 3:
      return "recordatorio";
    case 4:
      return "visita";
    case 5:
      return "mensaje";
    case 6:
      return "cotizacion";
    default:
      return null;
  }
}

function normalizarTipo(raw: string | null): TipoActividadTimeline {
  const t = (raw ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (t.includes("mensaj") || t === "message" || t === "whatsapp") {
    return "mensaje";
  }
  if (t.includes("llamad") || t === "call" || t === "phone") return "llamada";
  if (t.includes("visit")) return "visita";
  if (t.includes("cotiz") || t === "quote") return "cotizacion";
  if (t.includes("record")) return "recordatorio";
  if (t.includes("nota") || t.includes("note")) return "nota";
  if (t.includes("etapa") || t === "stage") return "etapa";
  if (t.includes("sistem") || t === "system") return "sistema";
  return "otro";
}

function descripcionDesdeDetalle(
  o: Record<string, unknown>,
  tipo: TipoActividadTimeline,
): string | null {
  const mensaje = asRecord(o.mensaje ?? o.Mensaje);
  const llamada = asRecord(o.llamada ?? o.Llamada);
  const visita = asRecord(o.visita ?? o.Visita);
  const cotizacion = asRecord(o.cotizacion ?? o.Cotizacion);

  if (tipo === "mensaje") {
    return (
      pickString(mensaje, "cuerpo", "Cuerpo") ||
      pickString(mensaje, "canal", "Canal")
    );
  }
  if (tipo === "llamada") {
    return (
      pickString(llamada, "resultado", "Resultado") ||
      pickString(llamada, "observaciones", "Observaciones") ||
      pickString(llamada, "telefono", "Telefono")
    );
  }
  if (tipo === "visita") {
    const dir = [
      pickString(visita, "direccion", "Direccion"),
      pickString(visita, "ciudad", "Ciudad"),
      pickString(visita, "resultado", "Resultado"),
    ]
      .filter(Boolean)
      .join(" · ");
    return dir || pickString(visita, "observaciones", "Observaciones");
  }
  if (tipo === "cotizacion") {
    const folio = pickString(cotizacion, "folio", "Folio");
    const total = pickNumber(cotizacion, "total", "Total");
    const moneda = pickString(cotizacion, "moneda", "Moneda") || "MXN";
    if (folio && total != null) return `${folio} · ${total} ${moneda}`;
    return (
      folio ||
      pickString(cotizacion, "comentarios", "Comentarios") ||
      pickString(cotizacion, "estatus", "Estatus")
    );
  }
  return null;
}

export function normalizeActivityTimelineItem(
  raw: unknown,
): ActivityTimelineItem | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const id =
    pickNumber(
      o,
      "idSeguimiento",
      "IdSeguimiento",
      "idLeadSeguimiento",
      "IdLeadSeguimiento",
      "idActivityTimeline",
      "IdActivityTimeline",
      "idActividad",
      "IdActividad",
      "id",
      "Id",
    ) ?? 0;
  const idTipo = pickNumber(o, "idTipoSeguimiento", "IdTipoSeguimiento");
  const tipo =
    tipoDesdeId(idTipo) ??
    normalizarTipo(
      pickString(
        o,
        "tipo",
        "Tipo",
        "tipoActividad",
        "TipoActividad",
        "tipoSeguimiento",
        "TipoSeguimiento",
        "category",
        "Category",
      ),
    );
  const titulo =
    pickString(
      o,
      "titulo",
      "Titulo",
      "comentario",
      "Comentario",
      "asunto",
      "Asunto",
      "tipoSeguimiento",
      "TipoSeguimiento",
      "title",
      "Title",
    ) ?? "";
  const fecha =
    pickFecha(
      o,
      "fechaSeguimiento",
      "FechaSeguimiento",
      "fecha",
      "Fecha",
      "fechaActividad",
      "FechaActividad",
      "fechaCreacion",
      "FechaCreacion",
      "fechaLlamada",
      "FechaLlamada",
      "fechaVisita",
      "FechaVisita",
      "fechaEnvio",
      "FechaEnvio",
      "createdAt",
      "CreatedAt",
    ) ?? null;
  if (!id && !titulo && !fecha) return null;

  const descripcionDirecta = pickString(
    o,
    "descripcion",
    "Descripcion",
    "detalle",
    "Detalle",
    "observaciones",
    "Observaciones",
    "notes",
    "Notes",
  );
  const descripcionDetalle = descripcionDesdeDetalle(o, tipo);
  const descripcion =
    (descripcionDirecta && descripcionDirecta !== (titulo || "Actividad")
      ? descripcionDirecta
      : null) || descripcionDetalle;

  return {
    id,
    idLead: pickNumber(o, "idLead", "IdLead"),
    tipo,
    titulo: titulo || etiquetaTipoActividad(tipo),
    descripcion,
    fecha,
    idUsuario: pickNumber(
      o,
      "idUsuario",
      "IdUsuario",
      "idUsuarioCreacion",
      "IdUsuarioCreacion",
    ),
    nombreUsuario: pickString(
      o,
      "nombreUsuario",
      "NombreUsuario",
      "usuario",
      "Usuario",
    ),
  };
}

function normalizeList(raw: unknown): ActivityTimelineItem[] {
  return normalizeArray(raw)
    .map(normalizeActivityTimelineItem)
    .filter((x): x is ActivityTimelineItem => x !== null)
    .sort((a, b) => {
      const da = a.fecha ? new Date(a.fecha).getTime() : 0;
      const db = b.fecha ? new Date(b.fecha).getTime() : 0;
      return db - da;
    });
}

/**
 * Activity Timeline del lead.
 * GET /api/LeadSeguimientos/lead/{idLead}
 * POST /api/LeadSeguimientos (hub con nested Mensaje/Llamada/Visita/Cotizacion)
 */
export const activityTimelineService = {
  getByLead: async (idLead: number): Promise<ActivityTimelineItem[]> => {
    if (!idLead || idLead <= 0) return [];
    const response = await api.get<unknown>(
      `/api/LeadSeguimientos/lead/${idLead}`,
      { params: { soloActivos: true } },
    );
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        errorDesdeRespuesta(
          response.data,
          "No se pudo cargar el Activity Timeline.",
        ),
      );
    }
    return normalizeList(response.data);
  },

  /** Listado global de seguimientos (filtros tipados en API / UI). */
  getAll: async (opts?: {
    idTipoSeguimiento?: number | null;
    soloActivos?: boolean;
  }): Promise<ActivityTimelineItem[]> => {
    const response = await api.get<unknown>("/api/LeadSeguimientos", {
      params: {
        soloActivos: opts?.soloActivos ?? true,
        idTipoSeguimiento:
          opts?.idTipoSeguimiento && opts.idTipoSeguimiento > 0
            ? opts.idTipoSeguimiento
            : undefined,
      },
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        errorDesdeRespuesta(
          response.data,
          "No se pudieron cargar los seguimientos.",
        ),
      );
    }
    return normalizeList(response.data);
  },

  getById: async (idSeguimiento: number): Promise<LeadSeguimientoDetalle> => {
    if (!idSeguimiento || idSeguimiento <= 0) {
      throw new Error("Identificador de seguimiento inválido.");
    }
    const response = await api.get<unknown>(
      `/api/LeadSeguimientos/${idSeguimiento}`,
    );
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        errorDesdeRespuesta(
          response.data,
          "No se pudo cargar el detalle del seguimiento.",
        ),
      );
    }
    const detalle = normalizeLeadSeguimientoDetalle(response.data);
    if (!detalle) {
      throw new Error("La respuesta del seguimiento no es válida.");
    }
    return detalle;
  },

  crear: async (
    payload: LeadSeguimientoCreatePayload,
  ): Promise<ActivityTimelineItem | null> => {
    const body: LeadSeguimientoCreatePayload = {
      ...payload,
      mensaje: payload.mensaje
        ? {
            ...payload.mensaje,
            canal: truncarTexto(payload.mensaje.canal, 30) ?? "WhatsApp",
            telefono: sanitizarTelefonoSeguimiento(payload.mensaje.telefono),
            estatusEnvio: truncarTexto(payload.mensaje.estatusEnvio, 30),
            messageSid: truncarTexto(payload.mensaje.messageSid, 50),
            errorMensaje: truncarTexto(payload.mensaje.errorMensaje, 250),
          }
        : payload.mensaje,
      llamada: payload.llamada
        ? {
            ...payload.llamada,
            telefono: sanitizarTelefonoSeguimiento(payload.llamada.telefono),
            resultado: truncarTexto(payload.llamada.resultado, 40),
            observaciones: truncarTexto(payload.llamada.observaciones, 500),
          }
        : payload.llamada,
    };

    const response = await api.post<unknown>("/api/LeadSeguimientos", body);
    if (response.status < 200 || response.status >= 300) {
      console.error("[LeadSeguimientos] create failed", {
        status: response.status,
        data: response.data,
        payload: body,
      });
      throw new Error(
        `HTTP ${response.status}: ${errorDesdeRespuesta(
          response.data,
          "No se pudo registrar la actividad.",
        )}`,
      );
    }
    return normalizeActivityTimelineItem(response.data);
  },
};

export function etiquetaTipoActividad(tipo: TipoActividadTimeline): string {
  switch (tipo) {
    case "mensaje":
      return "Mensaje";
    case "llamada":
      return "Llamada";
    case "visita":
      return "Visita";
    case "cotizacion":
      return "Cotización";
    case "nota":
      return "Nota";
    case "recordatorio":
      return "Recordatorio";
    case "etapa":
      return "Etapa";
    case "sistema":
      return "Sistema";
    default:
      return "Actividad";
  }
}

/** Id catálogo ↔ tipo UI (1 Llamada … 6 Cotización). */
export function idTipoSeguimientoDesdeTipo(
  tipo: TipoActividadTimeline,
): number | null {
  switch (tipo) {
    case "llamada":
      return 1;
    case "nota":
      return 2;
    case "recordatorio":
      return 3;
    case "visita":
      return 4;
    case "mensaje":
      return 5;
    case "cotizacion":
      return 6;
    default:
      return null;
  }
}

export const TIPOS_SEGUIMIENTO_FILTRO: {
  id: number | "";
  tipo: TipoActividadTimeline | "";
  label: string;
}[] = [
  { id: "", tipo: "", label: "Todos los tipos" },
  { id: 5, tipo: "mensaje", label: "Mensaje" },
  { id: 1, tipo: "llamada", label: "Llamada" },
  { id: 4, tipo: "visita", label: "Visita" },
  { id: 6, tipo: "cotizacion", label: "Cotización" },
  { id: 2, tipo: "nota", label: "Nota" },
  { id: 3, tipo: "recordatorio", label: "Recordatorio" },
];

export function formatearFechaActividad(valor: string | null): string {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Valor para input datetime-local (hora local). */
export function ahoraParaInputDatetime(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function inputDatetimeAIso(valor: string): string | null {
  const t = valor.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** ISO / fecha API → valor para input datetime-local (hora local). */
export function isoAInputDatetime(valor: string | null | undefined): string {
  if (!valor) return "";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
