import { api } from "./apiServices";

export interface DashboardData {
  Resumen: ResumenVentas;
  VentasPorVendedor: VentaPorVendedor[];
  VentasPorAlmacen: VentaPorAlmacen[];
  TopClientes: TopCliente[];
  TopProductos: TopProducto[];
  VentasDiarias: VentaDiaria[];
}

export interface ResumenVentasKpis {
  ventasNetas: number;
  ventasBrutas: number;
  totalDocumentos: number;
  clientesUnicos: number;
  ulkp: number;
  ticketPromedio: number;
}

export interface ResumenVentas extends ResumenVentasKpis {
  periodoAnterior?: ResumenVentasKpis;
}
export interface VentaPorMarca {
  marca: string;
  ulkp: number;
  pesos: number;
  porcentaje: number;
}

export type TipoMetricaCumplimiento = "ulkp" | "pesos";

export interface CumplimientoMetricaValores {
  objetivo: number;
  ventaReal: number;
  diferencia: number;
  cobertura: number;
}

export interface CumplimientoObjetivoFila {
  firmName: string;
  marca: string;
  slpName: string | null;
  nombreVendedor: string | null;
  ulkp: CumplimientoMetricaValores;
  pesos: CumplimientoMetricaValores;
}

/** Fila aplanada según la métrica activa (solo presentación). */
export type CumplimientoObjetivoFilaVista = Pick<
  CumplimientoObjetivoFila,
  "firmName" | "marca" | "slpName" | "nombreVendedor"
> &
  CumplimientoMetricaValores;

export interface CumplimientoObjetivosPorMarcaResponse {
  fechaInicio: string;
  fechaFin: string;
  agruparPorVendedor: boolean;
  filas: CumplimientoObjetivoFila[];
}

export interface VentaPorVendedorMarca {
  vendedor: string;
  marca: string;
  ulkp: number;
  pesos: number;
  porcentaje: number;
}

export interface VentaPorVendedor {
  SlpName: string;
  TotalVenta: number;
  Documentos: number;
  Clientes: number;
  Porcentaje: number;
}

export interface VentaPorAlmacen {
  whsCode: string;
  totalVenta: number;
  documentos: number;
  porcentaje: number;
}

export interface ResumenObjetivos {
  firmName: string;
  slpName: string;
  objetivoPesos: number;
  objetivoUlkp: number;
}

export interface TopCliente {
  cardCode: string;
  cardName: string;
  totalVenta: number;
  documentos: number;
}

export interface TopProducto {
  itemCode: string;
  dscription: string;
  cantidad: number;
  totalVenta: number;
}

export interface VentaDiaria {
  Fecha: string;
  TotalVenta: number;
  Documentos: number;
}

export interface VentaPorGrupo {
  ItmsGrpNam: string;
  TotalVenta: number;
  Porcentaje: number;
}

export interface VentaPorRuta {
  Ruta: string;
  TotalVenta: number;
  Clientes: number;
  Porcentaje: number;
}

/** Fila de GET /api/PorSurtirGlobal */
export interface PorSurtirGlobalItem {
  base: string;
  documento: string;
  fecha: string;
  folio: string;
  nombreCliente: string;
  codCliente: string;
  vendedor: string;
  almacen: string;
  sucursal: string;
  ruta: string;
  articulo: string;
  codigoProv: string;
  descripcion: string;
  marca: string;
  cantidadTotal: number;
  cantidadPdnte: number;
  existencia: number;
  ulkp: number;
  ulkpsPartPdte: number;
  importePartPdte: number;
  comentarios?: string;
}

/** Fila de GET /api/TransferStatus */
export interface TransferStatusItem {
  docEntry: number;
  docNum: number;
  docDate: string;
  lineNum: number;
  itemCode: string;
  dscription: string;
  origen: string;
  destino: string;
  solicitado: number;
  enviado: number;
  pendiente: number;
  status: string;
}

export interface ComparativoAnual {
  AnioActual: number;
  AnioAnterior: number;
  VentasAnioActual: number;
  VentasAnioAnterior: number;
  Crecimiento: number;
  PorcentajeCrecimiento: number;
  DetalleMensual: ComparativoMensual[];
}

export interface ComparativoMensual {
  Mes: number;
  MesNombre: string;
  AnioActual: number;
  AnioAnterior: number;
  Crecimiento: number;
}

export interface Vendedor {
  idUsuario: number;
  nombre: string;
  username: string;
  /** Código SAP del vendedor (ej. VTX01); usar para reportes y objetivos */
  slpName?: string;
  email: string;
  idRol: number;
  idPersona: number;
  cardCode: string;
}

export interface Vendedores {
  idVendedor: number;
  nombre: string;
  slpName: string;
  idUsuarioPrizma: number;
  idUsuarioPrizma2: number;
  idEmpresa: number;
  idSucursal: number;
  activo: boolean;
}

export interface Marca {
  idMarca: number;
  firmName: string;
  firmCode: number;
}

const formatDate = (date: Date) => date.toISOString().split("T")[0];

function pickNumber(
  o: Record<string, unknown>,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim()) {
      const parsed = Number(v);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}

function pickString(
  o: Record<string, unknown>,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  }
  return undefined;
}

function normalizeVendedor(raw: unknown): Vendedor {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const username = pickString(o, "username", "Username", "userName") ?? "";
  const slpName =
    pickString(o, "slpName", "SlpName", "slpCode", "SlpCode") ?? username;

  return {
    idUsuario: pickNumber(o, "idUsuario", "IdUsuario") ?? 0,
    nombre: pickString(o, "nombre", "Nombre") ?? "",
    username,
    slpName: slpName || undefined,
    email: pickString(o, "email", "Email") ?? "",
    idRol: pickNumber(o, "idRol", "IdRol") ?? 0,
    idPersona: pickNumber(o, "idPersona", "IdPersona") ?? 0,
    cardCode: pickString(o, "cardCode", "CardCode") ?? "",
  };
}

function normalizeVendedoresArray(raw: unknown): Vendedor[] {
  const list = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === "object" &&
        Array.isArray((raw as { data?: unknown }).data)
      ? (raw as { data: unknown[] }).data
      : [];
  return list.map(normalizeVendedor).filter((v) => v.idUsuario > 0);
}

function normalizeVendedorPrizma(raw: unknown): Vendedores {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    idVendedor: pickNumber(o, "idVendedor", "IdVendedor") ?? 0,
    nombre: pickString(o, "nombre", "Nombre") ?? "",
    slpName: pickString(o, "slpName", "SlpName") ?? "",
    idUsuarioPrizma: pickNumber(o, "idUsuarioPrizma", "IdUsuarioPrizma") ?? 0,
    idUsuarioPrizma2:
      pickNumber(o, "idUsuarioPrizma2", "IdUsuarioPrizma2") ?? 0,
    idEmpresa: pickNumber(o, "idEmpresa", "IdEmpresa") ?? 0,
    idSucursal: pickNumber(o, "idSucursal", "IdSucursal") ?? 0,
    activo: typeof o.activo === "boolean" ? o.activo : o.Activo === true,
  };
}

function normalizeVendedoresPrizmaArray(raw: unknown): Vendedores[] {
  const list = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === "object" &&
        Array.isArray((raw as { data?: unknown }).data)
      ? (raw as { data: unknown[] }).data
      : [];
  return list
    .map(normalizeVendedorPrizma)
    .filter((v) => v.idVendedor > 0)
    .sort((a, b) =>
      a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
    );
}

function normalizePorSurtirGlobalItem(
  raw: unknown,
): PorSurtirGlobalItem | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const folio = pickString(o, "folio", "Folio") ?? "";
  const articulo = pickString(o, "articulo", "Articulo") ?? "";
  if (!folio && !articulo) return null;

  return {
    base: pickString(o, "base", "Base") ?? "",
    documento: pickString(o, "documento", "Documento") ?? "",
    fecha: pickString(o, "fecha", "Fecha") ?? "",
    folio,
    nombreCliente: pickString(o, "nombreCliente", "NombreCliente") ?? "",
    codCliente: pickString(o, "codCliente", "CodCliente") ?? "",
    vendedor: pickString(o, "vendedor", "Vendedor") ?? "",
    almacen: pickString(o, "almacen", "Almacen") ?? "",
    sucursal: pickString(o, "sucursal", "Sucursal") ?? "",
    ruta: pickString(o, "ruta", "Ruta") ?? "",
    articulo,
    codigoProv: pickString(o, "codigoProv", "CodigoProv") ?? "",
    descripcion: pickString(o, "descripcion", "Descripcion") ?? "",
    marca: pickString(o, "marca", "Marca") ?? "",
    cantidadTotal: pickNumber(o, "cantidadTotal", "CantidadTotal") ?? 0,
    cantidadPdnte: pickNumber(o, "cantidadPdnte", "CantidadPdnte") ?? 0,
    existencia: pickNumber(o, "existencia", "Existencia") ?? 0,
    ulkp: pickNumber(o, "ulkp", "Ulkp", "ULKP") ?? 0,
    ulkpsPartPdte: pickNumber(o, "ulkpsPartPdte", "UlkpsPartPdte") ?? 0,
    importePartPdte: pickNumber(o, "importePartPdte", "ImportePartPdte") ?? 0,
    comentarios: pickString(o, "comentarios", "Comentarios") ?? undefined,
  };
}

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  for (const key of [
    "data",
    "Data",
    "items",
    "Items",
    "resultado",
    "Resultado",
  ]) {
    const v = o[key];
    if (Array.isArray(v)) return v;
  }
  return [];
}

function normalizePorSurtirGlobalList(raw: unknown): PorSurtirGlobalItem[] {
  return unwrapList(raw)
    .map(normalizePorSurtirGlobalItem)
    .filter((r): r is PorSurtirGlobalItem => r !== null);
}

function normalizeTransferStatusItem(raw: unknown): TransferStatusItem | null {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const docNum = pickNumber(o, "docNum", "DocNum");
  const itemCode = pickString(o, "itemCode", "ItemCode") ?? "";
  if (docNum == null && !itemCode) return null;

  return {
    docEntry: pickNumber(o, "docEntry", "DocEntry") ?? 0,
    docNum: docNum ?? 0,
    docDate: pickString(o, "docDate", "DocDate") ?? "",
    lineNum: pickNumber(o, "lineNum", "LineNum") ?? 0,
    itemCode,
    dscription: pickString(o, "dscription", "Dscription", "descripcion") ?? "",
    origen: pickString(o, "origen", "Origen") ?? "",
    destino: pickString(o, "destino", "Destino") ?? "",
    solicitado: pickNumber(o, "solicitado", "Solicitado") ?? 0,
    enviado: pickNumber(o, "enviado", "Enviado") ?? 0,
    pendiente: pickNumber(o, "pendiente", "Pendiente") ?? 0,
    status: pickString(o, "status", "Status", "estatus", "Estatus") ?? "",
  };
}

function normalizeTransferStatusList(raw: unknown): TransferStatusItem[] {
  const list = Array.isArray(raw)
    ? raw
    : raw &&
        typeof raw === "object" &&
        Array.isArray((raw as { data?: unknown }).data)
      ? (raw as { data: unknown[] }).data
      : [];
  return list
    .map(normalizeTransferStatusItem)
    .filter((r): r is TransferStatusItem => r !== null);
}

const appendFechas = (
  params: URLSearchParams,
  fechaInicio?: string,
  fechaFin?: string,
) => {
  if (fechaInicio) params.append("fechaInicio", fechaInicio);
  if (fechaFin) params.append("fechaFin", fechaFin);
};

export const getReportesService = {
  getDashboard: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    const response = await api.get<DashboardData>(
      `/api/Reportes/DashboardHana?${params}`,
    );
    return response.data;
  },

  getResumenVentas: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    const response = await api.get<ResumenVentas>(
      `/api/Reportes/ResumenVentas?${params}`,
    );
    return response.data;
  },
  getResumenObjetivos: async (
    fechaInicio?: string,
    fechaFin?: string,
    año?: number,
    mes?: number,
    slpName?: string,
    agruparPorVendedor?: boolean,
  ) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    if (año) params.append("año", String(año));
    if (mes) params.append("mes", String(mes));
    if (slpName) params.append("slpName", slpName);
    if (agruparPorVendedor !== undefined) {
      params.append("agruparPorVendedor", String(agruparPorVendedor));
    }
    const response = await api.get<ResumenObjetivos[]>(
      `/api/ObjetivoVendedor/GetObjetivosporPeriodo?${params}`,
    );
    console.log("ResumenObjetivosData:", response.data);
    return response.data;
  },

  getVentasPorVendedor: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    const response = await api.get<VentaPorVendedor[]>(
      `/api/Reportes/VentasPorVendedorHana?${params}`,
    );
    return response.data;
  },

  getVentasPorAlmacen: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    const response = await api.get<VentaPorAlmacen[]>(
      `/api/Reportes/VentasPorAlmacenHana?${params}`,
    );
    return response.data;
  },

  getVentasPorMarca: async (
    fechaInicio?: string,
    fechaFin?: string,
    username?: string,
    firmName?: string | null,
  ) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    if (username) params.append("username", username);
    if (firmName != null) params.append("firmName", firmName);
    const response = await api.get<VentaPorMarca[]>(
      `/api/Reportes/VentasPorMarca?${params}`,
    );
    return response.data;
  },

  getCumplimientoObjetivosPorMarca: async (
    fechaInicio?: string,
    fechaFin?: string,
    options?: {
      slpName?: string;
      /** Alias de slpName (valor del filtro de vendedor) */
      username?: string;
      firmName?: string;
      agruparPorVendedor?: boolean;
    },
  ) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    const slpName = options?.slpName ?? options?.username;
    if (slpName) params.append("slpName", slpName);
    if (options?.firmName) params.append("firmName", options.firmName);
    params.append(
      "agruparPorVendedor",
      String(options?.agruparPorVendedor ?? false),
    );
    const response = await api.get<CumplimientoObjetivosPorMarcaResponse>(
      `/api/Reportes/CumplimientoObjetivosPorMarca?${params}`,
    );
    return response.data;
  },

  getVentasPorVendedorMarca: async (
    fechaInicio?: string,
    fechaFin?: string,
    username?: string,
    firmName?: string | null,
  ) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    if (username) params.append("username", username);
    if (firmName != null) params.append("firmName", firmName);
    const response = await api.get<VentaPorVendedorMarca[]>(
      `/api/Reportes/VentasPorVendedorMarca?${params}`,
    );
    return response.data;
  },

  getTopClientes: async (top = 10, fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    params.append("top", String(top));
    appendFechas(params, fechaInicio, fechaFin);
    const response = await api.get<TopCliente[]>(
      `/api/Reportes/TopClientes?${params}`,
    );
    return response.data;
  },

  getTopClientesVendedor: async (
    top = 10,
    fechaInicio?: string,
    fechaFin?: string,
    username?: string,
    firmName?: string | null,
  ) => {
    const params = new URLSearchParams();
    params.append("top", String(top));
    appendFechas(params, fechaInicio, fechaFin);
    if (username) params.append("username", username);
    if (firmName != null) params.append("firmName", firmName);
    const response = await api.get<TopCliente[]>(
      `/api/Reportes/TopClientesVendedor?${params}`,
    );
    return response.data;
  },

  getTopProductos: async (
    top = 10,
    fechaInicio?: string,
    fechaFin?: string,
  ) => {
    const params = new URLSearchParams();
    params.append("top", String(top));
    appendFechas(params, fechaInicio, fechaFin);
    const response = await api.get<TopProducto[]>(
      `/api/Reportes/TopProductos?${params}`,
    );
    return response.data;
  },

  getVentasDiarias: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    const response = await api.get<VentaDiaria[]>(
      `/api/Reportes/VentasDiarias?${params}`,
    );
    return response.data;
  },

  getVentasPorGrupo: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    const response = await api.get<VentaPorGrupo[]>(
      `/api/Reportes/VentasPorGrupo?${params}`,
    );
    return response.data;
  },

  getVentasPorRuta: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    const response = await api.get<VentaPorRuta[]>(
      `/api/Reportes/VentasPorRuta?${params}`,
    );
    return response.data;
  },

  getComparativoAnual: async (anio?: number) => {
    const params = anio ? `?anio=${anio}` : "";
    const response = await api.get<ComparativoAnual>(
      `/api/Reportes/ComparativoAnualHana${params}`,
    );
    return response.data;
  },

  getFechasDefault: () => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    return {
      fechaInicio: formatDate(inicio),
      fechaFin: formatDate(fin),
    };
  },

  getVendedores: async (): Promise<Vendedor[]> => {
    const response = await api.get<unknown>(`/api/Usuarios/GetVendedores`);
    return normalizeVendedoresArray(response.data);
  },

  // Endpoint específico para obtener vendedores con estructura y datos necesarios para Prizma
  getVendedoresPrizma: async (): Promise<Vendedores[]> => {
    const response = await api.get<unknown>(`/api/Vendedores/`);
    return normalizeVendedoresPrizmaArray(response.data);
  },

  /** Vendedores de reparto: GET /api/Vendedores/reparto?soloActivos=true */
  getVendedoresReparto: async (soloActivos = true): Promise<Vendedores[]> => {
    const qs = new URLSearchParams();
    if (soloActivos) qs.set("soloActivos", "true");
    const response = await api.get<unknown>(
      `/api/Vendedores/reparto?${qs.toString()}`,
    );
    return normalizeVendedoresPrizmaArray(response.data);
  },

  getMarcas: async () => {
    const response = await api.get<Marca[]>(`/api/Marcas/GetMarcas`);
    return response.data;
  },

  /**
   * Órdenes / partidas pendientes por surtir.
   * GET /api/PorSurtirGlobal?sucursal={almacen}
   * `sucursal` es el código de almacén SAP (ej. AM1TX01).
   */
  getPorSurtirGlobal: async (opts?: {
    sucursal?: string | null;
  }): Promise<PorSurtirGlobalItem[]> => {
    const params = new URLSearchParams();
    const sucursal = opts?.sucursal?.trim() ?? "";
    if (sucursal) params.set("sucursal", sucursal);
    const qs = params.toString();
    const response = await api.get<unknown>(
      `/api/PorSurtirGlobal${qs ? `?${qs}` : ""}`,
      { timeout: 60_000 },
    );
    if (response.status < 200 || response.status >= 300) {
      throw new Error(
        `No se pudo cargar Por surtir global (HTTP ${response.status}).`,
      );
    }

    // DEBUG: quitar cuando se confirme comentarios
    const listaRaw = unwrapList(response.data);
    console.log(
      `[PorSurtirGlobal] ${sucursal || "(sin sucursal)"} — ${listaRaw.length} filas. JSON completo:`,
    );
    console.log(JSON.stringify(response.data, null, 2));
    (window as unknown as { __porSurtirDebug?: unknown }).__porSurtirDebug =
      response.data;
    const conComentario = listaRaw.filter((row) => {
      if (!row || typeof row !== "object") return false;
      const o = row as Record<string, unknown>;
      const c =
        o.comentarios ?? o.Comentarios ?? o.comentario ?? o.Comentario ?? "";
      return String(c).trim().length > 0;
    });
    console.log(
      `[PorSurtirGlobal] filas con comentarios: ${conComentario.length}`,
      conComentario.slice(0, 20),
    );

    return normalizePorSurtirGlobalList(response.data);
  },

  /**
   * Estatus de traspasos (líneas).
   * GET /api/TransferStatus?fechaInicio=&fechaFin=&docNum=
   */
  getTransferStatus: async (opts?: {
    docNum?: string | number | null;
    fechaInicio?: string | null;
    fechaFin?: string | null;
  }): Promise<TransferStatusItem[]> => {
    const params = new URLSearchParams();
    const docNum = opts?.docNum != null ? String(opts.docNum).trim() : "";
    if (docNum) params.set("docNum", docNum);
    if (opts?.fechaInicio?.trim()) {
      params.set("fechaInicio", opts.fechaInicio.trim());
    }
    if (opts?.fechaFin?.trim()) {
      params.set("fechaFin", opts.fechaFin.trim());
    }
    const qs = params.toString();
    const response = await api.get<unknown>(
      `/api/TransferStatus${qs ? `?${qs}` : ""}`,
      { timeout: 60_000 },
    );
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`No se pudo cargar Traspasos (HTTP ${response.status}).`);
    }
    return normalizeTransferStatusList(response.data);
  },

  /** Rango por defecto: 1er día del mes pasado → hoy (GETDATE). */
  getFechasTraspasosDefault: () => {
    const fin = new Date();
    const inicio = new Date(fin.getFullYear(), fin.getMonth() - 1, 1);
    return {
      fechaInicio: formatDate(inicio),
      fechaFin: formatDate(fin),
    };
  },
};
