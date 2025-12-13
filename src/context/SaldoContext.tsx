import { createContext, useContext, useState } from "react";

type SaldoContextType = {
  saldoVencido: boolean | null;
  setSaldoVencido: (value: boolean | null) => void;
};

const SaldoContext = createContext<SaldoContextType | undefined>(undefined);

export function SaldoProvider({ children }: { children: React.ReactNode }) {
  const [saldoVencido, setSaldoVencido] = useState<boolean | null>(null);

  return (
    <SaldoContext.Provider value={{ saldoVencido, setSaldoVencido }}>
      {children}
    </SaldoContext.Provider>
  );
}

export function useVencido() {
  const ctx = useContext(SaldoContext);
  if (!ctx) {
    throw new Error("useVenta debe usarse dentro de un VentaProvider");
  }
  return ctx;
}