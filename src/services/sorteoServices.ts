

import { api } from "./apiServices";

export interface SorteoRequest {
  idPeriodo: number;
  cantidadGanadores: number;
  observaciones?: string;
  semillaPublica?: string;
}

export interface Ganador {
  posicion: number;
  cardCode: string;
  nombreCliente: string;
  codigoBoleto: string;
  hashValidacion: string;
  fechaGeneracion: string;
}

export interface SorteoResponse {
  success: boolean;
  message: string;
  datos: {
    idSorteo: number;
    fechaSorteo: string;
    hashSemilla: string;
    ganadores: Ganador[];
    metadata: {
      totalBoletosParticipantes: number;
      totalClientesParticipantes: number;
      algoritmoUtilizado: string;
      versionSistema: string;
      hashBloqueo: string;
    };
  };
}

export const sorteoService = {
  // Realizar sorteo
  realizarSorteo: async (data: SorteoRequest): Promise<SorteoResponse> => {
    const response = await api.post<SorteoResponse>('api/Sorteo/realizar', data);
    return response.data;
  },

  // Descargar PDF
  descargarPDF: async (idSorteo: number): Promise<void> => {
    const response = await api.get(`api/Sorteo/${idSorteo}/reporte-pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sorteo_${idSorteo}_Ganadores_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Ver PDF en nueva pestaña
  verPDF: (idSorteo: number): void => {
    window.open(`${api.defaults.baseURL}/api/Sorteo/${idSorteo}/reporte-pdf/preview`, '_blank');
  },
};