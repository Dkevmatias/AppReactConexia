import { api } from "./apiServices";

export interface Lead {
  idLead: number;
  nombre: string | null;
  aPaterno: string | null;
  aMaterno: string | null;
  telefono: string | null;
  correo: string | null;
  observaciones: string | null;
  unidad: string | null;
  campaign: string | null;
  idEntidadServicio: number | null;
  idUnidad: number | null;
  idEntidadCampaign: number | null;
  idFuente: number | null;
  idEstatus: number | null;
  idEtapa: number | null;
  idTemperatura: number | null;
  idUsuarioCreacion: number | null;
  idUsuarioAsignado: number | null;
  idUsuarioActualizacion: number | null;
  idEmpresa: number | null;
  idDependencia: number | null;
  idDependenciaAsignada: number | null;
  presupuesto: number | null;
  estado: string | null;
  ciudad: string | null;
  municipio: string | null;
  fechallegada: string | null;
  fechaCreacion: string | null;
  fechaActualizacion: string | null;
  nombreEtapa?: string;
  nombreEstatus?: string;
  nombreFuente?: string;
  nombreEntidadServicio?: string;
  nombreUsuarioAsignado?: string;
}

export type LeadPayload = Omit<
  Lead,
  "idLead" | "fechaCreacion" | "fechaActualizacion"
>;

function errorDesdeRespuesta(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.mensaje === "string" && o.mensaje) return o.mensaje;
  }
  return fallback;
}

function assertOk<T>(response: { status: number; data: T }, fallback: string): T {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(errorDesdeRespuesta(response.data, fallback));
  }
  return response.data;
}

function normalizeArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.items)) return o.items;
    if (Array.isArray(o.leads)) return o.leads;
    if (Array.isArray(o.result)) return o.result;
  }
  return [];
}

function pickString(o: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

function pickNumber(o: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

/** Valores de catálogos (fuente, tipo actividad) que no deben mostrarse como nombre. */
const VALORES_NO_NOMBRE = new Set([
  "whatsapp",
  "facebook",
  "instagram",
  "tiktok",
  "web",
  "otro",
  "llamada",
  "llamadas",
  "cita",
  "citas",
  "correo",
  "email",
  "tarea",
  "tareas",
  "recordatorio",
  "reunion",
  "reunión",
  "reuniones",
  "cotizacion",
  "cotización",
  "sin nombre",
  "n/a",
  "na",
]);

function pareceNombrePersona(valor: string | null | undefined): boolean {
  if (!valor) return false;
  const t = valor.trim();
  if (t.length < 2) return false;
  const lower = t.toLowerCase();
  if (VALORES_NO_NOMBRE.has(lower)) return false;
  if (/^\d+$/.test(t)) return false;
  return true;
}

/** Excluye si el texto coincide con fuente, seguimiento u otro campo del listado. */
function esTextoDeOtroCampo(
  valor: string,
  o: Record<string, unknown>,
): boolean {
  const v = valor.trim().toLowerCase();
  const otros = [
    pickString(o, "tipoFuente", "TipoFuente"),
    pickString(o, "nombreFuente", "NombreFuente", "fuenteNombre", "FuenteNombre"),
    pickString(o, "fuente", "Fuente"),
    pickString(o, "ultimaActividad", "UltimaActividad"),
    pickString(o, "tipoActividad", "TipoActividad"),
    pickString(o, "tipoSeguimiento", "TipoSeguimiento"),
    pickString(o, "seguimiento", "Seguimiento"),
    pickString(o, "nombreSeguimiento", "NombreSeguimiento"),
    pickString(o, "campaign", "Campaign"),
    pickString(o, "nombreEtapa", "NombreEtapa"),
    pickString(o, "nombreEstatus", "NombreEstatus"),
  ];
  return otros.some((c) => c && c.trim().toLowerCase() === v);
}

function limpiarNombrePersona(
  valor: string | null,
  o: Record<string, unknown>,
): string | null {
  if (!valor) return null;
  const t = valor.trim();
  if (!pareceNombrePersona(t)) return null;
  if (esTextoDeOtroCampo(t, o)) return null;
  return t;
}

function extraerNombrePersona(o: Record<string, unknown>): {
  nombre: string | null;
  aPaterno: string | null;
  aMaterno: string | null;
} {
  const nombre = limpiarNombrePersona(
    pickString(
      o,
      "nombre",
      "Nombre",
      "nombres",
      "Nombres",
      "nombreCliente",
      "NombreCliente",
    ),
    o,
  );
  const aPaterno = limpiarNombrePersona(
    pickString(o, "aPaterno", "APaterno", "Apaterno", "apellidoPaterno", "ApellidoPaterno"),
    o,
  );
  const aMaterno = limpiarNombrePersona(
    pickString(o, "aMaterno", "AMaterno", "Amaterno", "apellidoMaterno", "ApellidoMaterno"),
    o,
  );

  const nombreCompleto = limpiarNombrePersona(
    pickString(
      o,
      "nombreCompleto",
      "NombreCompleto",
      "nombreProspecto",
      "NombreProspecto",
      "fullName",
      "FullName",
    ),
    o,
  );

  if (nombre || aPaterno || aMaterno) {
    return { nombre, aPaterno, aMaterno };
  }

  if (nombreCompleto) {
    const partes = nombreCompleto.split(/\s+/).filter(Boolean);
    if (partes.length >= 3) {
      return {
        nombre: partes[0] ?? null,
        aPaterno: partes[1] ?? null,
        aMaterno: partes.slice(2).join(" ") || null,
      };
    }
    if (partes.length === 2) {
      return { nombre: partes[0] ?? null, aPaterno: partes[1] ?? null, aMaterno: null };
    }
    return { nombre: nombreCompleto, aPaterno: null, aMaterno: null };
  }

  return { nombre: null, aPaterno: null, aMaterno: null };
}

/** Normaliza respuesta del API (camelCase, PascalCase o campos del listado). */
export function normalizeLead(raw: unknown): Lead {
  if (raw && typeof raw === "object") {
    const wrapper = raw as Record<string, unknown>;
    if (wrapper.lead && typeof wrapper.lead === "object") {
      return normalizeLead(wrapper.lead);
    }
    if (wrapper.Lead && typeof wrapper.Lead === "object") {
      return normalizeLead(wrapper.Lead);
    }
  }

  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  const { nombre: nombreFinal, aPaterno: aPaternoFinal, aMaterno: aMaternoFinal } =
    extraerNombrePersona(o);

  return {
    idLead: pickNumber(o, "idLead", "IdLead") ?? 0,
    nombre: nombreFinal,
    aPaterno: aPaternoFinal,
    aMaterno: aMaternoFinal,
    telefono: pickString(o, "telefono", "Telefono"),
    correo: pickString(o, "correo", "Correo"),
    observaciones: pickString(o, "observaciones", "Observaciones"),
    unidad: pickString(o, "unidad", "Unidad"),
    campaign: pickString(o, "campaign", "Campaign"),
    idEntidadServicio: pickNumber(o, "idEntidadServicio", "IdEntidadServicio"),
    idUnidad: pickNumber(o, "idUnidad", "IdUnidad"),
    idEntidadCampaign: pickNumber(o, "idEntidadCampaign", "IdEntidadCampaign"),
    idFuente: pickNumber(o, "idFuente", "IdFuente"),
    idEstatus: pickNumber(o, "idEstatus", "IdEstatus"),
    idEtapa: pickNumber(o, "idEtapa", "IdEtapa"),
    idTemperatura: pickNumber(o, "idTemperatura", "IdTemperatura"),
    idUsuarioCreacion: pickNumber(o, "idUsuarioCreacion", "IdUsuarioCreacion"),
    idUsuarioAsignado: pickNumber(o, "idUsuarioAsignado", "IdUsuarioAsignado"),
    idUsuarioActualizacion: pickNumber(
      o,
      "idUsuarioActualizacion",
      "IdUsuarioActualizacion",
    ),
    idEmpresa: pickNumber(o, "idEmpresa", "IdEmpresa"),
    idDependencia: pickNumber(o, "idDependencia", "IdDependencia"),
    idDependenciaAsignada: pickNumber(
      o,
      "idDependenciaAsignada",
      "IdDependenciaAsignada",
    ),
    presupuesto: pickNumber(o, "presupuesto", "Presupuesto"),
    estado: pickString(o, "estado", "Estado"),
    ciudad: pickString(o, "ciudad", "Ciudad"),
    municipio: pickString(o, "municipio", "Municipio"),
    fechallegada: pickString(o, "fechallegada", "Fechallegada", "fechaLlegada", "FechaLlegada"),
    fechaCreacion: pickString(o, "fechaCreacion", "FechaCreacion"),
    fechaActualizacion: pickString(o, "fechaActualizacion", "FechaActualizacion"),
    nombreEtapa:
      pickString(o, "nombreEtapa", "NombreEtapa", "etapaNombre", "EtapaNombre") ??
      undefined,
    nombreEstatus:
      pickString(
        o,
        "nombreEstatus",
        "NombreEstatus",
        "estatusNombre",
        "EstatusNombre",
      ) ?? undefined,
    nombreFuente:
      pickString(
        o,
        "nombreFuente",
        "NombreFuente",
        "fuenteNombre",
        "FuenteNombre",
        "fuente",
        "Fuente",
        "tipoFuente",
        "TipoFuente",
      ) ?? undefined,
    nombreEntidadServicio:
      pickString(o, "nombreEntidadServicio", "NombreEntidadServicio") ?? undefined,
    nombreUsuarioAsignado:
      pickString(
        o,
        "nombreUsuarioAsignado",
        "NombreUsuarioAsignado",
        "vendedor",
        "Vendedor",
      ) ?? undefined,
  };
}

function normalizeLeads(raw: unknown): Lead[] {
  return normalizeArray(raw).map((item) => normalizeLead(item));
}

export function nombreCompletoLead(
  lead: Pick<Lead, "nombre" | "aPaterno" | "aMaterno">,
): string {
  const partes = [lead.nombre, lead.aPaterno, lead.aMaterno].filter(Boolean);
  const completo = partes.join(" ").trim();
  return completo || "Sin nombre";
}

export function formatearFechaLead(valor: string | null | undefined): string {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatearMoneda(valor: number | null | undefined): string {
  if (valor == null) return "—";
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(valor);
}

export const leadsService = {
  getLeads: async (): Promise<Lead[]> => {
    const response = await api.get<unknown>("/api/Leads/GetLeads");
    return normalizeLeads(assertOk(response, "No se pudieron cargar los prospectos."));
  },

  getLeadsListado: async (): Promise<Lead[]> => {
    const response = await api.get<unknown>("/api/Leads/Listado");
    return normalizeLeads(
      assertOk(response, "No se pudo cargar el listado de prospectos."),
    );
  },

  getLead: async (id: number): Promise<Lead> => {
    const response = await api.get<unknown>(`/api/Leads/GetLeads/${id}`);
    const data = assertOk(response, "No se pudo cargar el prospecto.");
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const o = data as Record<string, unknown>;
      if (o.data && typeof o.data === "object") return normalizeLead(o.data);
      return normalizeLead(data);
    }
    return normalizeLead(data);
  },

  crearLead: async (payload: LeadPayload): Promise<Lead> => {
    const response = await api.post<Lead>("/api/Leads", payload);
    return assertOk(response, "No se pudo crear el prospecto.");
  },

  actualizarLead: async (id: number, payload: LeadPayload): Promise<Lead> => {
    const response = await api.put<Lead>(`/api/Leads/${id}`, payload);
    return assertOk(response, "No se pudo actualizar el prospecto.");
  },

  eliminarLead: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/Leads/${id}`);
    assertOk(response, "No se pudo eliminar el prospecto.");
  },
};
