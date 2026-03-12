export type EstadoPremio =
  | "disponible"
  | "insuficiente_puntos"
  | "limite_alcanzado"
  | "sin_stock";

export interface User {
  role: number;
  idPersona: number;
  cardCode: string;
  fullname: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
}

export interface ApiResponse<T = unknown> {
  isAuthenticated?: boolean;
  user?: User;
  data?: T;
  message?: string;
  success?: boolean;
}

export interface Premio {
  id: number;
  nombre: string;
  puntos: number;
  estado: EstadoPremio;
  imagen?: string;
}

export interface Boleto {
  id: number;
  numero: string;
  estado: string;
  fechaCompra?: string;
}

export interface Sorteo {
  id: number;
  nombre: string;
  fecha: string;
  estado: "activo" | "finalizado" | "pendiente";
}
