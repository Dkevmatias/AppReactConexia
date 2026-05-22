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

export interface CumplimientoObjetivoFila {
  firmCode: number;
  marca: string;
  slpName: string | null;
  nombreVendedor: string | null;
  objetivo: number;
  ventaReal: number;
  diferencia: number;
  cobertura: number;
}

export interface CumplimientoObjetivosPorMarcaResponse {
  fechaInicio: string;
  fechaFin: string;
  tipoMetrica: TipoMetricaCumplimiento;
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

export interface Marca {
  idMarca: number;
  firmName: string;
  firmCode: number;
}

const formatDate = (date: Date) => date.toISOString().split("T")[0];

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
      tipoMetrica?: TipoMetricaCumplimiento;
      agruparPorVendedor?: boolean;
    },
  ) => {
    const params = new URLSearchParams();
    appendFechas(params, fechaInicio, fechaFin);
    const slpName = options?.slpName ?? options?.username;
    if (slpName) params.append("slpName", slpName);
    if (options?.firmName) params.append("firmName", options.firmName);
    params.append("tipoMetrica", options?.tipoMetrica ?? "ulkp");
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

  getVendedores: async () => {
    const response = await api.get<Vendedor[]>(`/api/Usuarios/GetVendedores`);
    return response.data;
  },

  getMarcas: async () => {
    const response = await api.get<Marca[]>(`/api/Marcas/GetMarcas`);
    return response.data;
  },
};
