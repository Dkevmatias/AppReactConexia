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
  /** Ruta inicial del rol (desde backend); opcional */
  defaultRoute?: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  /** true mientras se obtiene el menú del backend (evita mostrar todos los ítems y luego filtrar) */
  menuLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  menu: Modulo[];
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

export interface Permiso {
  idPermiso: number;
  nombre: string;
  clave: string;
  activo: boolean;
}

export interface Modulo {
  idModulo: number;
  nombre: string;
  clave: string;
  ruta: string;
  activo: boolean;
  permisos: Permiso[];
}
