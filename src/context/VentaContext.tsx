import { createContext, useContext, useState } from "react";

type VentaContextType = {
  ventaTotal: number | null;
  ventaMesActual: number  | null;
  mesAnterior: string | null;
  setMesAnterior: (value: string | null) => void;
  setVentaTotal: (value: number | null) => void;
  setVentaMesActual:(value: number | null) => void;
};

const VentaContext = createContext<VentaContextType | undefined>(undefined);

export function VentaProvider({ children }: { children: React.ReactNode }) {
  const [ventaTotal, setVentaTotal] = useState<number | null>(null);
  const [ventaMesActual, setVentaMesActual] = useState<number | null>(null);
  const [mesAnterior, setMesAnterior] = useState<string | null>(null);

  return (
    <VentaContext.Provider value={{ ventaTotal, setVentaTotal, ventaMesActual, setVentaMesActual, mesAnterior, setMesAnterior }}>
      {children}
    </VentaContext.Provider>
  );
}

export function useVenta() {
  const ctx = useContext(VentaContext);
  if (!ctx) {
    throw new Error("useVenta debe usarse dentro de un VentaProvider");
  }
  return ctx;
}
