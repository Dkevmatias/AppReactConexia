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

export const marcarRespuesta = async (
  idConversacion: number,
  idPersona: number,
): Promise<void> => {
  const res = await api.put(
    `/api/Conversaciones/MarcarRespuesta/${idConversacion}/${idPersona}`,
    {},
  );
  if (res.status < 200 || res.status >= 300) {
    throw new Error(
      typeof res.data === "object" && res.data && "message" in res.data
        ? String((res.data as { message?: string }).message)
        : `No se pudo marcar la conversación (${res.status})`,
    );
  }
};
