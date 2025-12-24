import { api } from "./apiServices";
export interface User {
  idPersona: number;
  role: number;
  cardCode: string;
  fullname: string;
}

export interface LoginResponse {
  isSuccess: boolean;
  user: User;
}

// LOGIN
export const loginService = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>(
    "/api/Acceso/Login",
    { email, password },
    { withCredentials: true }
  );
  return res.data;
};

// CHECK AUTH (lee cookie HttpOnly)
export const checkAuthService = async () => {
  const res = await api.get("/api/Acceso/CheckAuth", {
    validateStatus: status => status === 200 || status === 401
  });
  return res.data;
};



// LOGOUT
export const logout = async () => {
  await api.post("/api/Acceso/Logout", {}, { withCredentials: true });
};
export const getPeriodoEvaluar = async () => {
  const response = await api.get(`/api/PeriodoBoletos/GetPeriodoEvaluar`);
  //console.log("datos",response.data)
  return response.data;
};

export const getPersonas = async (idpersona: number) => {
  const response = await api.get(`/api/Personas/GetPersonasRelacion/${idpersona}`);
  // console.log("Personas",response);
  return response.data;
};

//Validamos si el cliente tiene deudas
export const getSaldoClientes = async(clientes: string)=>{
  const response = await api.get(`/api/Personas/GetSaldosClientes`,{
    params:{
      clientes
    }
  });
  
  return {
    ...response.data,
    vencido: response.data.Vencido === 1
  };
  //return response.data;

}


export const getVentasCLientes = async (fechaInicio: string,fechaFin: string,clientes: string) => {
 //console.log("getVentasCLientes - parametros:", { fechaInicio, fechaFin, clientes });
  // Llamada a la API para obtener ventas de clientes
   const response = await api.get(`/api/Clientes/GetVentasClientes`, {
       params: {
      fechaInicio,
      fechaFin,
      clientes
    }
  });
     //console.log("Ventas Clientes:", response.data);
  return response.data;



  };
 

