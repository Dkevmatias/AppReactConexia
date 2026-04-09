import { createContext, useEffect, useState } from "react";
import {
  checkAuthService,
  logout as logoutService,
  getMenuByRol,
  Modulo,
} from "../services/authService";

interface User {
  role: number;
  idPersona: number;
  cardCode: string;
  fullname: string;
  defaultRoute?: string | null;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  menuLoading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  menu: Modulo[];
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<Modulo[]>([]);
  const [menuLoading, setMenuLoading] = useState(false);

  // SIEMPRE validar cookie al cargar app
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await checkAuthService();
      if (res?.isAuthenticated) {
        setUser(res.user);
        setMenuLoading(true);
        const menuData = await getMenuByRol(res.user.role);
        if (menuData && menuData.modulos) {
          setMenu(menuData.modulos);
        } else {
          setMenu([]);
        }
      } else {
        setUser(null);
        setMenu([]);
      }
    } catch (error) {
      // 401 es esperado cuando no hay sesión
      setUser(null);
      setMenu([]);
    } finally {
      setMenuLoading(false);
      setLoading(false);
    }
  };

  // Cookie la puso el backend; menuLoading evita un frame con todos los ítems antes del filtro
  const login = async (user: User) => {
    setMenuLoading(true);
    setUser(user);
    try {
      const menuData = await getMenuByRol(user.role);
      if (menuData?.modulos) {
        setMenu(menuData.modulos);
      } else {
        setMenu([]);
      }
    } finally {
      setMenuLoading(false);
    }
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
    setMenu([]);
    setMenuLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, menuLoading, login, logout, menu }}
    >
      {children}
    </AuthContext.Provider>
  );
};
