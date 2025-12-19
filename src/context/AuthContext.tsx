
/*
import { createContext, useContext, useEffect, useState } from "react";
import { checkAuthService } from "../services/authService";

interface User {
  role: number;
  idPersona: number;
  cardCode: string;
  fullname: string;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Cargar usuario almacenado (localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      verifyAuth();
    }
  }, []);

  // Validar cookie httpOnly en backend
  const verifyAuth = async () => {
    try {
      const res = await checkAuthService();
      if (res.isAuthenticated) {
        localStorage.setItem("user", JSON.stringify(res.user));
        setUser(res.user);
      }
    } catch {
      logout();
    }
  };

  const login = (userData: User) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};*/

import { createContext, useEffect, useState } from "react";
import { checkAuthService, logout as logoutService } from "../services/authService";

interface User {
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

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // SIEMPRE validar cookie al cargar app
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
  try {
    const res = await checkAuthService();
    if (res?.isAuthenticated) {
      setUser(res.user);
    } else {
      setUser(null);
    }
  } catch (error) {
    // ⚠️ 401 es esperado cuando no hay sesión
    setUser(null);
  } finally {
    setLoading(false);
  }
};


  // Login solo setea estado (cookie ya la puso el backend)
  const login = (user: User) => {
    setUser(user);
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};