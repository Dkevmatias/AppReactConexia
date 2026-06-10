import { api } from "./apiServices";

export interface RutaVendedorRef {
  /** Catálogo /api/Vendedores */
  idVendedor?: number;
  /** Compatibilidad con /api/Usuarios/GetVendedores */
  idUsuario?: number;
  slpName?: string | null;
  username?: string | null;
}

function resolverIdVendedorCatalogo(vendedor: RutaVendedorRef): number | null {
  const id = vendedor.idVendedor ?? vendedor.idUsuario;
  return id != null && id > 0 ? id : null;
}

export interface Ruta {
  idRuta: number;
  idEmpresa: number | null;
  idSucursal: number | null;
  idVendedor: number | null;
  nombre: string | null;
  codigo: string;
  /** Prizma: routeName para uBxpRuta al generar (ej. CODIAL32) */
  codigoSap?: string | null;
  /** Prizma: día de inicio de semana (startWeekDay) */
  startWeekDay?: number | null;
  observaciones: string | null;
  slpName: string | null;
  username: string | null;
  activo: boolean;
}

/** Código enviado a generar bitácora (uBxpRuta). */
export function codigoRutaParaGenerar(ruta: Ruta): string {
  return (ruta.codigoSap ?? ruta.codigo).trim();
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

function pickCodigoRuta(o: Record<string, unknown>): string {
  return (
    pickString(
      o,
      "codigo",
      "Codigo",
      "uBxpRuta",
      "UBxpRuta",
      "u_BXP_RUTA",
      "U_BXP_RUTA",
    ) ?? ""
  ).trim();
}

function idRutaPrizmaDesdeCodigo(codigo: string, index: number): number {
  const base = codigo.trim().toUpperCase();
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash * 31 + base.charCodeAt(i)) | 0;
  }
  const id = -Math.abs(hash || index + 1);
  return id === 0 ? -(index + 1) : id;
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
    codigo: pickCodigoRuta(o),
    observaciones: pickString(o, "observaciones", "Observaciones"),
    // API devuelve "slPName" (P mayúscula); equivale al username del vendedor (ej. VTX01)
    slpName: pickString(o, "slpName", "SlpName", "slPName", "SlPName"),
    username: pickString(o, "username", "Username"),
    activo: pickBool(o, "activo", "Activo"),
  };
}

function pickStartWeekDay(o: Record<string, unknown>): number | null {
  const numero = pickNumber(o, "startWeekDay", "StartWeekDay");
  if (numero != null) return numero;
  const texto = pickString(o, "startWeekDay", "StartWeekDay");
  if (!texto) return null;
  const parsed = Number(texto.trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function ordenarRutasPrizma(rutas: Ruta[]): Ruta[] {
  return [...rutas].sort((a, b) => {
    const diaA = a.startWeekDay ?? Number.MAX_SAFE_INTEGER;
    const diaB = b.startWeekDay ?? Number.MAX_SAFE_INTEGER;
    if (diaA !== diaB) return diaA - diaB;
    return a.codigo.localeCompare(b.codigo, "es", { sensitivity: "base" });
  });
}

/** Mapea respuesta GET /api/RutasPrizmas al modelo Ruta del front. */
function normalizeRutaPrizma(raw: unknown, index: number): Ruta {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const routeCode =
    pickString(o, "routeCode", "RouteCode", "codigo", "Codigo")?.trim() ?? "";
  const routeName =
    pickString(o, "routeName", "RouteName", "nombre", "Nombre")?.trim() ?? "";
  const idSalesRoute = pickNumber(
    o,
    "idSalesRoute",
    "IdSalesRoute",
    "idRuta",
    "IdRuta",
  );
  const assignedTo = pickNumber(o, "assignedTo", "AssignedTo", "idVendedor");

  const etiqueta = [routeCode, routeName].filter(Boolean).join(" ").trim();
  const codigo = etiqueta || routeName || routeCode || pickCodigoRuta(o);

  const idRuta =
    idSalesRoute ??
    (codigo ? idRutaPrizmaDesdeCodigo(codigo, index) : -(index + 1));

  return {
    idRuta,
    idEmpresa: pickNumber(o, "idEmpresa", "IdEmpresa"),
    idSucursal: pickNumber(o, "idSucursal", "IdSucursal"),
    idVendedor: assignedTo,
    nombre: null,
    codigo,
    codigoSap: routeName || null,
    startWeekDay: pickStartWeekDay(o),
    observaciones: pickString(o, "startWeekDay", "StartWeekDay"),
    slpName: null,
    username: null,
    activo: true,
  };
}

export interface RutasPrizmaParams {
  /** idUsuarioPrizma del vendedor → query assignedTo */
  idUsuarioPrizma: number;
  /** Segundo usuario Prizma → query assignedTo2 */
  idUsuarioPrizma2?: number;
}

/** IDs de ruta válidos para guardar en bitácora (solo catálogo local). */
export function idsRutasLocales(ids: number[]): number[] {
  return ids.filter((id) => id > 0);
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
  const idVendedor = resolverIdVendedorCatalogo(vendedor);
  if (
    idVendedor != null &&
    ruta.idVendedor != null &&
    ruta.idVendedor === idVendedor
  ) {
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
  if (!vendedor) return [];
  const idVendedor = resolverIdVendedorCatalogo(vendedor);
  const tieneCodigoSap = codigosVendedorRuta(vendedor).size > 0;
  if (!idVendedor && !tieneCodigoSap) return [];
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

  /** Rutas del vendedor en Prizma: GET /api/RutasPrizmas?assignedTo=&assignedTo2= */
  getRutasPrizma: async (params: RutasPrizmaParams): Promise<Ruta[]> => {
    if (params.idUsuarioPrizma <= 0) {
      throw new Error(
        "El vendedor no tiene idUsuarioPrizma para consultar rutas.",
      );
    }
    const qs = new URLSearchParams();
    qs.set("assignedTo", String(params.idUsuarioPrizma));
    if (params.idUsuarioPrizma2 != null && params.idUsuarioPrizma2 > 0) {
      qs.set("assignedTo2", String(params.idUsuarioPrizma2));
    }
    const response = await api.get<unknown>(
      `/api/RutasPrizmas?${qs.toString()}`,
    );
    const raw = assertOk(
      response,
      "No se pudieron cargar las rutas de Prizma.",
    );
    return ordenarRutasPrizma(
      normalizeArray(raw, (item) => item)
        .map((item, index) => normalizeRutaPrizma(item, index))
        .filter((ruta) => ruta.codigo.trim().length > 0),
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
