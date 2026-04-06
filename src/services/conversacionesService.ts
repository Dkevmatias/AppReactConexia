import { api } from "./apiServices";

export interface Conversacion {
  idConversacion: number;
  telefono: string;
  nombre: string;
  ultimoMensaje: string;
  fechaUltimoMensaje: string;
  estado: string;
  noLeido: boolean;
  respondido: boolean;
  fechaCreacion: string;
  fechaActualizacion: string;
}

export const getConversaciones = async (): Promise<Conversacion[]> => {
  const response = await api.get<Conversacion[]>("/api/Conversaciones");
  return response.data;
};
