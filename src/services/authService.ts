import { api } from "./apiServices";
import {
  applyMobileAuthHeaders,
  clearTokenFallback,
  getRefreshFallback,
  persistTokensFromAuthResponse,
} from "../utils/tokenFallback";

export interface User {
  idPersona: number;
  idUsuario: number;
  idEmpresa: number;
  idSucursal: number;
  role: number;
  cardCode: string;
  fullname: string;
  /** Username de Usuarios; en vendedores coincide con slpName (ej. VTX01). */
  username?: string | null;
  /** Ruta inicial definida en el rol (API); si falta, se usa el mapa local en postLoginRoutes */
  defaultRoute?: string | null;
}

export interface LoginResponse {
  isSuccess: boolean;
  user: User;
  requireCaptcha?: boolean;
  accessToken?: string;
  refreshToken?: string;
}

export interface CheckAuthResponse {
  authenticated?: boolean;
  isAuthenticated?: boolean;
  user?: User;
}

export const isSessionAuthenticated = (
  res: CheckAuthResponse | null | undefined,
): boolean => {
  if (!res?.user) return false;
  return res.authenticated === true || res.isAuthenticated === true;
};

function normalizeUser(raw: unknown): User | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const o = raw as Record<string, unknown>;

  // Solo desanidar si parece un envelope (login/checkauth), no el user ya plano.
  const esEnvelope =
    "isSuccess" in o ||
    "authenticated" in o ||
    "isAuthenticated" in o ||
    ("user" in o && !("idPersona" in o) && !("IdPersona" in o));

  const nested =
    esEnvelope && o.user && typeof o.user === "object"
      ? (o.user as Record<string, unknown>)
      : esEnvelope && o.usuario && typeof o.usuario === "object"
        ? (o.usuario as Record<string, unknown>)
        : null;
  const src = nested ?? o;

  const idPersona = pickNumber(src, "idPersona", "IdPersona", "idpersona");
  const idUsuario = pickNumber(
    src,
    "idUsuario",
    "IdUsuario",
    "idusuario",
    "idUser",
    "IdUser",
  );
  const idEmpresa = pickNumber(src, "idEmpresa", "IdEmpresa");
  const idSucursal = pickNumber(src, "idSucursal", "IdSucursal");
  const role = pickNumber(src, "role", "Role", "idRol", "IdRol");
  const cardCode = pickString(src, "cardCode", "CardCode") ?? "";
  const fullname =
    pickString(src, "fullname", "Fullname", "nombre", "Nombre") ?? "";
  const username = pickString(
    src,
    "username",
    "Username",
    "userName",
    "UserName",
    "slpName",
    "SlpName",
    "slPName",
  );
  const defaultRoute = pickString(
    src,
    "defaultRoute",
    "DefaultRoute",
    "rutaInicial",
    "RutaInicial",
  );

  if (!idPersona && !idUsuario) return undefined;

  return {
    idPersona,
    idUsuario,
    idEmpresa,
    idSucursal,
    role,
    cardCode,
    fullname,
    username,
    defaultRoute,
  };
}

/** Conserva ids válidos si checkauth omite algún campo que sí trajo el login. */
export function mergeSessionUser(
  incoming: User,
  previous: User | null | undefined,
): User {
  return {
    role: incoming.role || previous?.role || 0,
    idPersona:
      incoming.idPersona > 0 ? incoming.idPersona : (previous?.idPersona ?? 0),
    idUsuario:
      incoming.idUsuario > 0 ? incoming.idUsuario : (previous?.idUsuario ?? 0),
    idEmpresa:
      incoming.idEmpresa > 0 ? incoming.idEmpresa : (previous?.idEmpresa ?? 0),
    idSucursal:
      incoming.idSucursal > 0
        ? incoming.idSucursal
        : (previous?.idSucursal ?? 0),
    cardCode: incoming.cardCode || previous?.cardCode || "",
    fullname: incoming.fullname || previous?.fullname || "",
    username: incoming.username || previous?.username || null,
    defaultRoute: incoming.defaultRoute ?? previous?.defaultRoute ?? null,
  };
}

// LOGIN
export const loginService = async (
  email: string,
  password: string,
  recaptchaToken?: string | null,
): Promise<LoginResponse> => {
  const headers: Record<string, string> = {};
  applyMobileAuthHeaders({ headers });

  const res = await api.post<LoginResponse>(
    "/api/Acceso/Login",
    { email, password, recaptchaToken },
    {
      withCredentials: true,
      headers,
      validateStatus: (status) => status < 500,
    },
  );

  if (res.status >= 200 && res.status < 300 && res.data.isSuccess) {
    persistTokensFromAuthResponse(res.data);
  }

  const user = normalizeUser(res.data?.user);
  return {
    ...res.data,
    user: user ?? res.data.user,
  };
};

export interface CambiarPasswordResponse {
  success: boolean;
  message: string;
}

function messageFromAuthBody(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return o.message.trim();
    if (typeof o.mensaje === "string" && o.mensaje.trim()) return o.mensaje.trim();
  }
  return fallback;
}

/** Olvido de contraseña (anónimo). POST /api/Acceso/SolicitarPasswordReset */
export const solicitarPasswordResetService = async (
  email: string,
): Promise<CambiarPasswordResponse> => {
  const res = await api.post<{ success?: boolean; message?: string }>(
    "/api/Acceso/SolicitarPasswordReset",
    { email: email.trim() },
    {
      validateStatus: (status) => status < 500,
    },
  );

  const message = messageFromAuthBody(
    res.data,
    "Si el correo existe, se envió un enlace de recuperación.",
  );

  if (res.status >= 200 && res.status < 300) {
    return { success: true, message };
  }

  return { success: false, message };
};

/** Enlace del correo (anónimo). POST /api/Acceso/ConfirmarPasswordReset */
export const confirmarPasswordResetService = async (
  token: string,
  newPassword: string,
  confirmPassword: string,
): Promise<CambiarPasswordResponse> => {
  const res = await api.post<{ message?: string }>(
    "/api/Acceso/ConfirmarPasswordReset",
    {
      token: token.trim(),
      newPassword,
      confirmPassword,
    },
    {
      validateStatus: (status) => status < 500,
    },
  );

  const message = messageFromAuthBody(
    res.data,
    res.status >= 200 && res.status < 300
      ? "Contraseña actualizada. Inicia sesión de nuevo."
      : "No se pudo restablecer la contraseña",
  );

  if (res.status >= 200 && res.status < 300) {
    return { success: true, message };
  }

  return { success: false, message };
};

/** Requiere sesión (cookie o Bearer). No uses ActualizarPassword: es solo Admin. */
export const cambiarPasswordService = async (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string,
): Promise<CambiarPasswordResponse> => {
  const headers: Record<string, string> = {};
  applyMobileAuthHeaders({ headers });

  const res = await api.post<{ message?: string }>(
    "/api/Acceso/CambiarPassword",
    { currentPassword, newPassword, confirmPassword },
    {
      withCredentials: true,
      headers,
      validateStatus: (status) => status < 500,
    },
  );

  const message =
    res.data?.message ??
    (res.status >= 200 && res.status < 300
      ? "Contraseña actualizada. Inicia sesión de nuevo."
      : "No se pudo cambiar la contraseña");

  if (res.status >= 200 && res.status < 300) {
    clearTokenFallback();
    return { success: true, message };
  }

  return { success: false, message };
};

// CHECK AUTH (lee cookie HttpOnly o Bearer en móvil)
export const checkAuthService = async (): Promise<CheckAuthResponse> => {
  const res = await api.get<CheckAuthResponse>("/api/Acceso/checkauth", {
    validateStatus: (status) => status === 200 || status === 401,
  });
  const data = res.data ?? {};
  // Acepta user en raíz o envelope completo.
  const user = normalizeUser(data.user) ?? normalizeUser(data) ?? undefined;
  return user ? { ...data, user } : data;
};

// LOGOUT
export const logout = async () => {
  const headers: Record<string, string> = {};
  applyMobileAuthHeaders({ headers });

  const fallbackRefresh = getRefreshFallback();
  if (fallbackRefresh) {
    headers["X-Refresh-Token"] = fallbackRefresh;
  }

  await api.post(
    "/api/Acceso/logout",
    fallbackRefresh ? { refreshToken: fallbackRefresh } : {},
    {
      withCredentials: true,
      headers,
      validateStatus: (status) => status < 500,
    },
  );
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
  return response.data;
};

export interface ContextoOperativoPersona {
  idPersona: number;
  idEmpresa: number;
  idSucursal: number;
  empresa?: string | null;
  sucursal?: string | null;
}

function pickNumber(o: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

function pickString(
  o: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const value = o[key];
    if (typeof value === "string") return value;
  }
  return null;
}

function normalizeContextoOperativo(raw: unknown): ContextoOperativoPersona {
  const data =
    raw && typeof raw === "object" && "data" in raw
      ? (raw as Record<string, unknown>).data
      : raw;
  const o = (data && typeof data === "object" ? data : {}) as Record<
    string,
    unknown
  >;

  return {
    idPersona: pickNumber(o, "idPersona", "IdPersona"),
    idEmpresa: pickNumber(o, "idEmpresa", "IdEmpresa"),
    idSucursal: pickNumber(o, "idSucursal", "IdSucursal"),
    empresa: pickString(
      o,
      "empresa",
      "Empresa",
      "nombreEmpresa",
      "NombreEmpresa",
    ),
    sucursal: pickString(
      o,
      "sucursal",
      "Sucursal",
      "nombreSucursal",
      "NombreSucursal",
    ),
  };
}

export const getContextoOperativoPersona = async (
  idPersona: number,
): Promise<ContextoOperativoPersona> => {
  const response = await api.get<unknown>(
    `/api/Personas/contexto-operativo/${idPersona}`,
  );
  if (response.status < 200 || response.status >= 300) {
    throw new Error("No se pudo cargar el contexto operativo del usuario.");
  }
  return normalizeContextoOperativo(response.data);
};

export const getUsuario = async () => {
  const response = await api.get(`api/Usuarios/GetUsuarios`, {
    withCredentials: true,
  });
  return response.data;
};

export interface UsuarioPorId {
  idUsuario: number;
  username: string;
  nombre?: string;
  email?: string;
  idRol?: number;
  idPersona?: number;
}

function unwrapUsuarioPayload(data: unknown): Record<string, unknown> | null {
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    return null;
  }
  const o = data as Record<string, unknown>;
  for (const key of [
    "data",
    "Data",
    "result",
    "Result",
    "usuario",
    "Usuario",
    "user",
    "User",
  ]) {
    const nested = o[key];
    if (nested && typeof nested === "object" && !Array.isArray(nested)) {
      return nested as Record<string, unknown>;
    }
  }
  return o;
}

/** GET /api/Usuarios/{idUsuario} */
export const getUsuarioPorId = async (
  idUsuario: number,
): Promise<UsuarioPorId | null> => {
  if (!idUsuario || idUsuario <= 0) return null;
  const response = await api.get<unknown>(`/api/Usuarios/${idUsuario}`);
  if (response.status < 200 || response.status >= 300) return null;
  const o = unwrapUsuarioPayload(response.data);
  if (!o) return null;
  const username = (
    pickString(
      o,
      "username",
      "Username",
      "userName",
      "UserName",
      "slpName",
      "SlpName",
      "slPName",
    ) ?? ""
  ).trim();
  if (!username) return null;
  return {
    idUsuario: pickNumber(o, "idUsuario", "IdUsuario") || idUsuario,
    username,
    nombre:
      pickString(o, "nombre", "Nombre", "fullname", "Fullname") ?? undefined,
    email: pickString(o, "email", "Email") ?? undefined,
    idRol: pickNumber(o, "idRol", "IdRol") || undefined,
    idPersona: pickNumber(o, "idPersona", "IdPersona") || undefined,
  };
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

export const getPeriodosActivos = async () => {
  const response = await api.get(`/api/PeriodoBoletos/GetPeriodosActivos`);
  return response.data;
};

export const getSaldoClientes = async (clientes: string) => {
  const response = await api.get(`/api/Personas/GetSaldosClientes`, {
    params: {
      clientes,
    },
  });

  const data = response.data as Record<string, unknown>;
  const vencidoRaiz = data?.Vencido === 1 || data?.vencido === true;
  const vencidoPorDetalle = Object.values(data).some((item) => {
    if (!item || typeof item !== "object") return false;
    const fila = item as { vencido?: boolean; Vencido?: number };
    return fila.vencido === true || fila.Vencido === 1;
  });

  return {
    ...data,
    vencido: vencidoRaiz || vencidoPorDetalle,
  };
};

export const getVentasCLientes = async (
  fechaInicio: string,
  fechaFin: string,
  clientes: string,
) => {
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

  return response.data?.puntos ?? 0;
};

export interface Modulo {
  idModulo: number;
  nombre: string;
  clave: string;
  ruta: string;
  activo: boolean;
  permisos: {
    idPermiso: number;
    nombre: string;
    clave: string;
    activo: boolean;
    ruta?: string | null;
  }[];
}

export interface MenuResponse {
  idRol: number;
  nombreRol: string;
  modulos: Modulo[];
}

export const getMenuByRol = async (
  idRol: number,
): Promise<MenuResponse | null> => {
  try {
    const response = await api.get<MenuResponse>(
      `/api/Menu/GetMenuByRol/${idRol}`,
      {
        withCredentials: true,
      },
    );
    if (response.status < 200 || response.status >= 300) return null;
    return response.data;
  } catch (error) {
    console.error("Error fetching menu:", error);
    return null;
  }
};
