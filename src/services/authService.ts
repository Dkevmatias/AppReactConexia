//import axios,{AxiosInstance} from "axios";
/*import { api } from "./apiServices";

// Tipo de usuario
export interface User {
  idPersona: number;
  role: number;
  cardCode: string;
  fullname: string;
}

export interface LoginResponse {
  isSuccess: boolean;
  user: {
    role: number;
    idPersona: number;
    cardCode: string;
    fullname: string;
  };
}

// Respuesta del login
export interface LoginResponse {
  isSuccess: boolean;
  user: User;
}

// Login
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>(
    "Acceso/Login",
    { email, password },
    { withCredentials: true }
  );
  return res.data;
};

// Logout
export const logout = async () => {
  await api.post("Acceso/Logout", {}, { withCredentials: true });
};

// Función para refrescar usuario desde backend usando la cookie HttpOnly
export const refreshUser = async (): Promise<{ authenticated: boolean; user?: User }> => {
  try {
    const res = await api.get<{ authenticated: boolean; user?: User }>("Acceso/CheckAuth", {
      withCredentials: true, // muy importante
    });
    return res.data;
  } catch {
    return { authenticated: false };
  }
};



export const getPersonas = async (idpersona: number) => {
  const response = await api.get(`Personas/GetPersonasRelacion/${idpersona}`);
  return response.data;
};


export const getVentasCLientes = async (fechaInicio: string,fechaFin: string,clientes: string) => {
 console.log("getVentasCLientes - parametros:", { fechaInicio, fechaFin, clientes });
  // Llamada a la API para obtener ventas de clientes
   const response = await api.get(`Clientes/GetVentasClientes`, {
       params: {
      fechaInicio,
      fechaFin,
      clientes
    }
  });
     console.log("Ventas Clientes:", response.data);
  return response.data;



  };*/

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
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>(
    "Acceso/Login",
    { email, password },
    { withCredentials: true }
  );
  return res.data;
};

// CHECK AUTH (desde cookie)
export const checkAuthService = async () => {
  const res = await api.get("Acceso/CheckAuth", { withCredentials: true });
  return res.data;
};

// LOGOUT
export const logout = async () => {
  await api.post("Acceso/Logout", {}, { withCredentials: true });
};

export const getPeriodoEvaluar = async () => {
  const response = await api.get(`PeriodoBoletos/GetPeriodoEvaluar`);
  console.log("datos",response.data)
  return response.data;
};

export const getPersonas = async (idpersona: number) => {
  const response = await api.get(`Personas/GetPersonasRelacion/${idpersona}`);
  return response.data;
};

//Validamos si el cliente tiene deudas
export const getSaldoClientes = async(clientes: string)=>{
  const response = await api.get(`Personas/GetSaldosClientes`,{
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
 console.log("getVentasCLientes - parametros:", { fechaInicio, fechaFin, clientes });
  // Llamada a la API para obtener ventas de clientes
   const response = await api.get(`Clientes/GetVentasClientes`, {
       params: {
      fechaInicio,
      fechaFin,
      clientes
    }
  });
     console.log("Ventas Clientes:", response.data);
  return response.data;



  };
 

