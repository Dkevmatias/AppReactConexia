

import { api } from "./apiServices";

export interface BoletoRequest {
  idBoleto: number;
  color: string;
}

export const asignarBoletos = async (cardCode: string,idPeriodo: number, boletos: BoletoRequest[]) => {
  const payload = {
    cardCode,
    idPeriodo,
    boletos,
  };  
  const response = await api.post("Boletos/Asignar", payload);
  return response.data.boletos;
};


export const getBoletosPorUsuario = async (cardCode: string,) => {
  const response = await api.get(`Boletos/GetBoletos/${cardCode}`);
  return response.data.boletos;
   }

   export const getBoletosPeriodo = async (cardCode: string, idPeriodo: number) => {
  const response = await api.get(`Boletos/GetBoletos/${cardCode}/${idPeriodo}`);
  return response.data.boletos;
   }

