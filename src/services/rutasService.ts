import { api } from "./apiServices";

export interface RutaVendedorRef {
  idUsuario: number;
  slpName?: string | null;
  username?: string | null;
}

export interface Ruta {
  idRuta: number;
  idEmpresa: number | null;
  idSucursal: number | null;
  idVendedor: number | null;
  nombre: string | null;
  codigo: string;
  observaciones: string | null;
  slpName: string | null;
  username: string | null;
  activo: boolean;
}

export interface RutaPayload {
  idEmpresa?: number | null;
  idSucursal?: number | null;
  nombre?: string | null;
  codigo: string;
  observaciones?: string | null;
  activo: boolean;
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
    if (typeof v === "string") return v;
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

function normalizeRuta(raw: unknown): Ruta {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    idRuta: pickNumber(o, "idRuta", "IdRuta") ?? 0,
    idEmpresa: pickNumber(o, "idEmpresa", "IdEmpresa"),
    idSucursal: pickNumber(o, "idSucursal", "IdSucursal"),
    idVendedor: pickNumber(o, "idVendedor", "IdVendedor"),
    nombre: pickString(o, "nombre", "Nombre"),
    codigo: pickString(o, "codigo", "Codigo") ?? "",
    observaciones: pickString(o, "observaciones", "Observaciones"),
    // API devuelve "slPName" (P mayúscula); equivale al username del vendedor (ej. VTX01)
    slpName: pickString(o, "slpName", "SlpName", "slPName", "SlPName"),
    username: pickString(o, "username", "Username"),
    activo: pickBool(o, "activo", "Activo"),
  };
}

function codigosVendedorRuta(vendedor: RutaVendedorRef): Set<string> {
  const codigos = new Set<string>();
  for (const valor of [vendedor.slpName, vendedor.username]) {
    const normalizado = (valor ?? "").trim().toLowerCase();
    if (normalizado) codigos.add(normalizado);
  }
  return codigos;
}

/** Indica si la ruta pertenece al vendedor (por id o por código SAP/username). */
export function rutaCoincideConVendedor(
  ruta: Ruta,
  vendedor: RutaVendedorRef,
): boolean {
  if (ruta.idVendedor != null && ruta.idVendedor === vendedor.idUsuario) {
    return true;
  }

  const codigosVendedor = codigosVendedorRuta(vendedor);
  if (codigosVendedor.size === 0) return false;

  const codigoRuta = (ruta.slpName ?? ruta.username ?? "").trim().toLowerCase();
  return codigoRuta !== "" && codigosVendedor.has(codigoRuta);
}

export function filtrarRutasPorVendedor(
  rutas: Ruta[],
  vendedor: RutaVendedorRef | null | undefined,
): Ruta[] {
  if (!vendedor?.idUsuario) return [];
  return rutas.filter((ruta) => rutaCoincideConVendedor(ruta, vendedor));
}

function normalizeArray<T>(raw: unknown, map: (item: unknown) => T): T[] {
  if (Array.isArray(raw)) return raw.map(map);
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data.map(map);
    if (Array.isArray(o.items)) return o.items.map(map);
  }
  return [];
}

export const rutasService = {
  getRutas: async (): Promise<Ruta[]> => {
    const response = await api.get<unknown>("/api/Rutas");
    return normalizeArray(
      assertOk(response, "No se pudieron cargar las rutas."),
      normalizeRuta,
    );
  },

  getRutasPorEmpresa: async (idEmpresa: number): Promise<Ruta[]> => {
    const response = await api.get<unknown>(`/api/Rutas/empresa/${idEmpresa}`);
    return normalizeArray(
      assertOk(response, "No se pudieron cargar las rutas de la empresa."),
      normalizeRuta,
    );
  },

  getRutasPorSucursal: async (idSucursal: number): Promise<Ruta[]> => {
    const response = await api.get<unknown>(
      `/api/Rutas/sucursal/${idSucursal}`,
    );
    return normalizeArray(
      assertOk(response, "No se pudieron cargar las rutas de la sucursal."),
      normalizeRuta,
    );
  },

  getRutaPorId: async (id: number): Promise<Ruta> => {
    const response = await api.get<unknown>(`/api/Rutas/${id}`);
    return normalizeRuta(assertOk(response, "No se pudo cargar la ruta."));
  },

  crearRuta: async (payload: RutaPayload): Promise<Ruta> => {
    const response = await api.post<unknown>("/api/Rutas", payload);
    return normalizeRuta(assertOk(response, "No se pudo crear la ruta."));
  },

  actualizarRuta: async (id: number, payload: RutaPayload): Promise<Ruta> => {
    const response = await api.put<unknown>(`/api/Rutas/${id}`, payload);
    return normalizeRuta(assertOk(response, "No se pudo actualizar la ruta."));
  },

  eliminarRuta: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/Rutas/${id}`);
    assertOk(response, "No se pudo eliminar la ruta.");
  },
};
