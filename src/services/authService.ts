import axios from "axios";

const API_URL= import.meta.env.VITE_API_URL;
console.log("API_URL:", API_URL);
interface LoginResponse {
  token: string;
  [key: string]: any; // Para cualquier otro dato adicional
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await axios.post<LoginResponse>(`${API_URL}Acceso/Login`, { email, password });
  //const response = axios.post<LoginResponse>(API_URL, { email , password})
  if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getToken = (): string | null => localStorage.getItem("token");

