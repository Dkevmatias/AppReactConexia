import { api } from "./apiServices";

/** Fila devuelta por GetPremiosCanjeados (ajusta nombres al contrato real del backend). */
export type PremioCanjeadoApi = {
  idCanje?: number;
  id?: number;
  nombreCliente?: string | null;
  fullName?: string | null;
  nombrePersona?: string | null;
  persona?: string | null;
  cardCode?: string | null;
  telefono?: string | null;
  celular?: string | null;
  cupon?: string | number | null;
  nombrePremio?: string | null;
  premio?: string | null;
  cantidad?: number | null;
  fechaCanje?: string | null;
  fechaEstimada?: string | null;
  observaciones?: string | null;
  /** Si el backend ya envía estos campos, se usan como valor inicial. */
  recibe?: string | null;
  vendedor?: string | null;
  sucursal?: string | null;
  fechaEntrega?: string | null;
  validado?: boolean | null;
  valido?: boolean | null;
  activo?: boolean | null;
  estatusEntrega?: string | null;
  entregado?: boolean | null;
};

/** Quita espacios raros (NBSP, ideográfico), zero‑width y recorta extremos. */
export function cleanDisplayText(
  value: string | null | undefined,
): string | null {
  if (value == null) return null;
  const s = value
    .replace(/\u00A0/g, " ")
    .replace(/\u3000/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
  return s === "" ? null : s;
}

function normalizeRow(row: PremioCanjeadoApi): PremioCanjeadoApi {
  return {
    ...row,
    nombreCliente: cleanDisplayText(row.nombreCliente),
    fullName: cleanDisplayText(row.fullName),
    nombrePersona: cleanDisplayText(row.nombrePersona),
    persona: cleanDisplayText(row.persona),
  };
}

function normalizeLista(raw: unknown): PremioCanjeadoApi[] {
  let arr: PremioCanjeadoApi[] = [];
  if (Array.isArray(raw)) arr = raw as PremioCanjeadoApi[];
  else if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) arr = o.data as PremioCanjeadoApi[];
    else if (Array.isArray(o.items)) arr = o.items as PremioCanjeadoApi[];
  }
  return arr.map(normalizeRow);
}

export async function getPremiosCanjeados(): Promise<PremioCanjeadoApi[]> {
  const response = await api.get<unknown>(
    "/api/CanjesPremio/GetPremiosCanjeados",
  );
  return normalizeLista(response.data);
}

export function getIdCanjeNum(r: PremioCanjeadoApi): number | null {
  const n = r.idCanje ?? r.id;
  return n != null ? Number(n) : null;
}

export function idCanjeRow(
  r: PremioCanjeadoApi,
  fallbackIndex: number,
): string {
  const n = getIdCanjeNum(r);
  if (n != null) return String(n);
  return `row-${fallbackIndex}`;
}

export type ValidarInfoPayload = {
  idCanje: number;
  idUsuarioEdita: number;
  recibe: string;
  valido: boolean;
};

function errorDesdeRespuesta(
  data: unknown,
  fallback: string,
): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.mensaje === "string" && o.mensaje) return o.mensaje;
  }
  return fallback;
}

export async function validarInfoCanje(
  payload: ValidarInfoPayload,
): Promise<void> {
  const response = await api.post<unknown>(
    "/api/CanjesPremio/ValidarInfo",
    payload,
  );
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      errorDesdeRespuesta(
        response.data,
        "No se pudo validar la información del canje.",
      ),
    );
  }
}

export type EntregaObservacionesPayload = {
  idCanje: number;
  idUsuarioEdita: number;
  observaciones: string;
};

export async function entregaObservaciones(
  payload: EntregaObservacionesPayload,
): Promise<void> {
  const response = await api.post<unknown>(
    "/api/CanjesPremio/EntregaObservaciones",
    payload,
  );
  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      errorDesdeRespuesta(
        response.data,
        "No se pudieron guardar las observaciones.",
      ),
    );
  }
}

export type EntregaPremioPayload = {
  idCanje: number;
  idUsuarioEdita: number;
  observaciones: string;
  recibe: string;
  activo: boolean;
  estatusEntrega?: string;
  fechaEntrega?: string;
};

/** Normaliza a ISO UTC (mediodía) para evitar cambios de día por zona horaria. */
export function toApiFechaEntrega(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const day = /^\d{4}-\d{2}-\d{2}$/.test(trimmed)
    ? trimmed
    : (() => {
        const d = new Date(trimmed);
        if (Number.isNaN(d.getTime())) return null;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${dd}`;
      })();

  if (!day) return null;
  return `${day}T12:00:00.000Z`;
}

export type RegistrarEntregaPayload = {
  idCanje: number;
  idUsuarioEdita: number;
  observaciones: string;
  recibe: string;
  fechaEntrega: string;
};

/** Registra la entrega física del premio (siempre incluye fecha). */
export async function registrarEntregaPremio(
  payload: RegistrarEntregaPayload,
): Promise<void> {
  const response = await api.post<unknown>("/api/CanjesPremio/EntregaPremio", {
    idCanje: payload.idCanje,
    idUsuarioEdita: payload.idUsuarioEdita,
    observaciones: payload.observaciones,
    recibe: payload.recibe,
    activo: false,
    estatusEntrega: "E",
    fechaEntrega: payload.fechaEntrega,
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      errorDesdeRespuesta(
        response.data,
        "No se pudo guardar la entrega del premio.",
      ),
    );
  }
}

export async function entregaPremio(
  payload: EntregaPremioPayload,
): Promise<void> {
  const body: Record<string, unknown> = { ...payload };
  if (body.fechaEntrega == null || body.fechaEntrega === "") {
    delete body.fechaEntrega;
  }
  if (body.estatusEntrega == null || body.estatusEntrega === "") {
    delete body.estatusEntrega;
  }

  const response = await api.post<unknown>(
    "/api/CanjesPremio/EntregaPremio",
    body,
  );

  if (response.status < 200 || response.status >= 300) {
    throw new Error(
      errorDesdeRespuesta(
        response.data,
        "No se pudo guardar la entrega del premio.",
      ),
    );
  }
}
