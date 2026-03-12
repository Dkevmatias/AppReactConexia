import axios from "axios";

const API_URL= import.meta.env.VITE_API_URL;
console.log("API_URL:", API_URL);
interface VentasResponse {
  token: string;
  //username: string;
  //role: string;
  [key: string]: any; // Para cualquier otro dato adicional
}

export const login = async (email: string, password: string): Promise<VentasResponse> => {
  const response = await axios.post<VentasResponse>(`${API_URL}/api/GetVentas/Ventas`, { email, password });
   if (response.data.token) {
    localStorage.setItem("token", response.data.token);
  }
  //console.log("Login exitoso:", response.data);
  return response.data;
  
};

export const logout = () => {
  localStorage.removeItem("token");
};

export const getToken = (): string | null => localStorage.getItem("token");
