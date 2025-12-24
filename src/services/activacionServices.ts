import { api } from "./apiServices";

export interface ValidarTokenResponse {
  isValid: boolean;
  email: string;
  message: string;
}

export interface ActivarCuentaRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const validarActivacionToken = async (
  token: string
): Promise<ValidarTokenResponse> => {
  const response = await api.post("/api/Acceso/ValidaActivacionToken", { token });
  return response.data;
};

export const activarCuenta = async (data: ActivarCuentaRequest) => {
  const response = await api.post("/Acceso/ActivarCuenta", data);
  return response.data;
};