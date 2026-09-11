import { createContext, useEffect, useState } from "react";
import {
  checkAuthService,
  isSessionAuthenticated,
  logout as logoutService,
  getMenuByRol,
  mergeSessionUser,
  Modulo,
} from "../services/authService";
import { tryRefreshSession } from "../services/apiServices";
import { clearTokenFallback } from "../utils/tokenFallback";

const SESSION_REFRESH_MS = 10 * 60 * 1000;

interface User {
  role: number;
  idPersona: number;
  idUsuario: number;
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

  useEffect(() => {
    void checkAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const refreshIfVisible = () => {
      if (document.visibilityState === "hidden") return;
      void tryRefreshSession();
    };

    const intervalId = window.setInterval(refreshIfVisible, SESSION_REFRESH_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [user]);

  const checkAuth = async () => {
    try {
      const res = await checkAuthService();
      if (isSessionAuthenticated(res) && res.user) {
        // Evita que checkauth pise idUsuario si el login ya lo tenía y checkauth lo omite.
        setUser((prev) => mergeSessionUser(res.user!, prev));
        setMenuLoading(true);
        const menuData = await getMenuByRol(res.user.role);
        if (menuData?.modulos) {
          setMenu(menuData.modulos);
        } else {
          setMenu([]);
        }
      } else {
        setUser(null);
        setMenu([]);
      }
    } catch {
      setUser(null);
      setMenu([]);
    } finally {
      setMenuLoading(false);
      setLoading(false);
    }
  };

  const login = async (nextUser: User) => {
    setMenuLoading(true);
    setUser(mergeSessionUser(nextUser, null));
    try {
      const menuData = await getMenuByRol(nextUser.role);
      if (menuData?.modulos) {
        setMenu(menuData.modulos);
      } else {
        setMenu([]);
      }
    } finally {
      setMenuLoading(false);
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutService();
    } finally {
      clearTokenFallback();
      setUser(null);
      setMenu([]);
      setMenuLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, menuLoading, login, logout, menu }}
    >
      {children}
    </AuthContext.Provider>
  );
};
