import { api } from "./apiServices";


export type PremioCliente = {
  idPremio: number;
  cantidad: number;
};

export interface CanjeResponse {
  success: boolean;
  message: string;
  puntosRestantes?: number;
  cantidadCanjeada?: number;
}

//Traemos los premios disponibles
export const getPremios = async () => {
  const response = await api.get(`/api/Premios/GetPremios`); 
  return response.data;
};

//Historial de canjes por cliente
export const getPremiosClientes = async (cardCode: string): Promise<PremioCliente[]> => {
  const response = await api.get(`/api/Premios/GetPremiosClientes/${cardCode}`); 
  return response.data;
};

// Canje unificado: descuenta puntos Y registra el premio
export const canjearPremio = async (
  cardCode: string,
  idPremio: number,
  idPeriodo: number,
  nombrePremio: string,
  cantidad: number,
  puntosRequeridos: number
): Promise<CanjeResponse> => {
  const payload = {
    cardCode,
    idPremio,
    idPeriodo,
    nombrePremio,
    cantidad,
    puntosRequeridos
  };  
  //const response = await api.post<CanjeResponse>("/api/Premios/CanjearPremio", payload);
  const response = await api.post<CanjeResponse>("/api/Puntos/CanjearPremios", payload);
  return response.data;
};
