import { api } from "./apiServices";


export type PremioCliente = {
  idPremio: number;
  cantidad: number;
};
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
/*
 export const canjearPremio = async (params: { 
  idPremio: number, 
  cantidad: number, 
  cardCode: string 
}) => {
  const response = await api.post(`/api/Premios/AsignarPremio`, params);
  console.log("parametros canje premio:", params);
  return response.data;
   }  */
   
   export const canjearPremio = async (
    idPremio: number,
    idPeriodo: number,
    nombre: string, 
    cantidad: number, 
    cardCode: string 
  ) => {
     const payload = {
       idPremio,      
       idPeriodo,
       nombre,
       cantidad,
       cardCode
     };  
     const response = await api.post("api/Premios/AsignarPremio", payload);
      console.log("parametros canje premio:", payload);
     return response.data;
   };







  


