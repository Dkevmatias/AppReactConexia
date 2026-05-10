import { api } from "./apiServices";

/** Fila devuelta por GetPremiosCanjeados (ajusta nombres al contrato real del backend). */
export type PremioCanjeadoApi = {
  idCanjePremio?: number;
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

export function idCanjeRow(
  r: PremioCanjeadoApi,
  fallbackIndex: number,
): string {
  const n = r.idCanjePremio ?? r.id;
  if (n != null) return String(n);
  return `row-${fallbackIndex}`;
}
