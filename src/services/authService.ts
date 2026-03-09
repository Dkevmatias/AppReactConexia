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
  requireCaptcha?: boolean;
}

// LOGIN
export const loginService = async (email: string, password: string, recaptchaToken?: string | null): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>(
    "/api/Acceso/Login",
    { email, password, recaptchaToken },
    { withCredentials: true ,
      validateStatus: (status) => status < 500 
    }
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
  return response.data;
};

export const getPersonas = async (idpersona: number) => {
  const response = await api.get(`/api/Personas/GetPersonasRelacion/${idpersona}`);
  // console.log("Personas",response);
  return response.data;
};

//Acumulado de Ventas por mes 
export const getPeriodosActivos = async () => {
  const response = await api.get(`/api/PeriodoBoletos/GetPeriodosActivos`);
  //console.log("datos",response.data)
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
}

export const getVentasCLientes = async (
  fechaInicio: string,
  fechaFin: string,
  clientes: string) => {
   // Llamada a la API para obtener ventas de clientes
   const response = await api.get(`/api/Clientes/GetVentasClientes`, {
    params: {
      fechaInicio,
      fechaFin,
      clientes
    }
  });
     
  return response.data;

  };
 
export const AsignarPuntos = async (
  idPeriodo: number, 
  puntos: number,
  puntosCanjeados: number,
  cardCode: string,
) => {
  const payload = {
    idPeriodo,
    puntos,
    puntosCanjeados,
    cardCode
  };
  const response = await api.post("/api/Clientes/AsignarPuntos", payload, {
    withCredentials: true
  });
  return response.data;
};