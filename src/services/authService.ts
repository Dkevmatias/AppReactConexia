import { api } from "./apiServices";
import { saveTokenFallback } from "../utils/tokenFallback";
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
  accessToken?: string;
}

// LOGIN
export const loginService = async (
  email: string,
  password: string,
  recaptchaToken?: string | null,
): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>(
    "/api/Acceso/Login",
    { email, password, recaptchaToken },
    { withCredentials: true, validateStatus: (status) => status < 500 },
  );

  if (res.data.isSuccess && res.data.accessToken) {
    saveTokenFallback(res.data.accessToken);
  }

  return res.data;
};

// CHECK AUTH (lee cookie HttpOnly)
export const checkAuthService = async () => {
  const res = await api.get("/api/Acceso/CheckAuth", {
    validateStatus: (status) => status === 200 || status === 401,
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
  const response = await api.get(
    `/api/Personas/GetPersonasRelacion/${idpersona}`,
  );
  return response.data;
};

export const getPersonasTelefono = async () => {
  const response = await api.get(`/api/Personas/GetPersonas`);
  console.log("Respuesta de getPersonasTelefono:", response.data);
  return response.data;
};

export interface DatosCliente {
  idPersona: number;
  nombre: string | null;
  fullname: string | null;
  cardCode: string;
  activo: boolean | null;
  sociedad: string | null;
  email: string | null;
  telefono: string | null;
  unico: boolean;
}

export const getDatosCliente = async (idPersona: number) => {
  const response = await api.get<{ persona: DatosCliente }>(
    `/api/Personas/GetDatosClientes?idPersona=${idPersona}`,
  );
  return response.data.persona;
};

export interface DocumentoCartera {
  sociedad: string;
  cardCode: string;
  cardName: string;
  docNum: number;
  docDate: string;
  docDueDate: string;
  diasVencido: number;
  totalDeuda: number;
  porVencer: number;
  rango0_30: number;
  rango31_60: number;
  rango61_90: number;
  rango91_120: number;
  mas120: number;
  numAtCard: string;
  docTotal: number;
  paidToDate: number;
  saldoDocumento: number;
  pymntGroup: string;
  u_BXP_RUTA: string;
  slpName: string;
}

export const getCarteraCliente = async (cardCodes: string[]) => {
  const response = await api.post<DocumentoCartera[]>(
    `/api/Clientes/GetCarteraPorClientes`,
    cardCodes,
  );
  return response.data;
};

//Acumulado de Ventas por mes
export const getPeriodosActivos = async () => {
  const response = await api.get(`/api/PeriodoBoletos/GetPeriodosActivos`);
  //console.log("datos",response.data)
  return response.data;
};

//Validamos si el cliente tiene deudas
export const getSaldoClientes = async (clientes: string) => {
  const response = await api.get(`/api/Personas/GetSaldosClientes`, {
    params: {
      clientes,
    },
  });

  return {
    ...response.data,
    vencido: response.data.Vencido === 1,
  };
};

export const getVentasCLientes = async (
  fechaInicio: string,
  fechaFin: string,
  clientes: string,
) => {
  // Llamada a la API para obtener ventas de clientes
  const response = await api.get(`/api/Clientes/GetVentasClientesNetas`, {
    params: {
      fechaInicio,
      fechaFin,
      clientes,
    },
  });

  return response.data;
};
export const procesarFacturas = async (
  fechaInicio: string,
  fechaFin: string,
  clientes: string,
  idPersona: number,
) => {
  const response = await api.post(`/api/Puntos/ProcesarFacturasSAP`, {
    FechaInicio: fechaInicio,
    FechaFin: fechaFin,
    CardCode: clientes,
    IdPersona: idPersona,
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
    cardCode,
  };
  const response = await api.post("/api/Clientes/AsignarPuntos", payload, {
    withCredentials: true,
  });
  return response.data;
};

export const getPuntosAcumulados = async (idPersona: number) => {
  const payload = {
    idPersona,
  };
  const response = await api.get(
    `/api/Puntos/GetPuntosAcumuladosCliente/${idPersona}`,
    {
      params: payload,
      withCredentials: true,
    },
  );
  console.log("clientes:", idPersona);
  console.log("Puntos Acumulados Response:", response.data?.puntos);
  return response.data?.puntos ?? 0;
};
