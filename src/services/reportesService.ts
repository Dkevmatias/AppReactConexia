import { api } from "./apiServices";

export interface DashboardData {
  Resumen: ResumenVentas;
  VentasPorVendedor: VentaPorVendedor[];
  VentasPorAlmacen: VentaPorAlmacen[];
  TopClientes: TopCliente[];
  TopProductos: TopProducto[];
  VentasDiarias: VentaDiaria[];
}

export interface ResumenVentas {
  totalDocumentos: number;
  clientesUnicos: number;
  ventasNetas: number;
  VentasBrutas: number;
  ticketPromedio: number;
}
export interface VentaPorMarca {
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

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const getReportesService = {
  // Dashboard completo
  getDashboard: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get<DashboardData>(`/api/Reportes/DashboardHana?${params}`);
    return response.data;
  },

  // Resumen de ventas
  getResumenVentas: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get<ResumenVentas>(`/api/Reportes/ResumenVentas?${params}`);
    console.log("vENTAS N",response.data);
    return response.data;
  },

  // Ventas por vendedor
  getVentasPorVendedor: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get<VentaPorVendedor[]>(`/api/Reportes/VentasPorVendedorHana?${params}`);
    return response.data;
  },

  // Ventas por almacén
  getVentasPorAlmacen: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get<VentaPorAlmacen[]>(`/api/Reportes/VentasPorAlmacenHana?${params}`);
    return response.data;
  },
  getVentasPorMarca: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get<VentaPorMarca[]>(`/api/Reportes/VentasPorMarca?${params}`);
    return response.data;
  },

  // Top clientes
  getTopClientes: async (top = 10, fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    params.append('top', top.toString());
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get<TopCliente[]>(`/api/Reportes/TopClientes?${params}`);
    return response.data;
  },

  // Top productos
  getTopProductos: async (top = 10, fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    params.append('top', top.toString());
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get<TopProducto[]>(`/api/Reportes/TopProductos?${params}`);
    return response.data;
  },

  // Ventas diarias
  getVentasDiarias: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get<VentaDiaria[]>(`/api/Reportes/VentasDiarias?${params}`);
    return response.data;
  },

  // Ventas por grupo
  getVentasPorGrupo: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get<VentaPorGrupo[]>(`/api/Reportes/VentasPorGrupo?${params}`);
    return response.data;
  },

  // Ventas por ruta
  getVentasPorRuta: async (fechaInicio?: string, fechaFin?: string) => {
    const params = new URLSearchParams();
    if (fechaInicio) params.append('fechaInicio', fechaInicio);
    if (fechaFin) params.append('fechaFin', fechaFin);
    
    const response = await api.get<VentaPorRuta[]>(`/api/Reportes/VentasPorRuta?${params}`);
    return response.data;
  },

  // Comparativo anual
  getComparativoAnual: async (anio?: number) => {
    const params = anio ? `?anio=${anio}` : '';
    const response = await api.get<ComparativoAnual>(`/api/Reportes/ComparativoAnualHana${params}`);
    return response.data;
  },

  // Fechas automático (últimos 30 días)
  getFechasDefault: () => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    return {
      fechaInicio: formatDate(inicio),
      fechaFin: formatDate(fin)
    };
  }
};
