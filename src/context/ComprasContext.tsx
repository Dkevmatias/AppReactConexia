import { createContext, useContext, useState } from "react";

type ComprasContextType = {
  mesesCompras: boolean | null;
  setMesesCompras: (value: boolean | null) => void;
};

const ComprasContext = createContext<ComprasContextType | undefined>(undefined);

export function ComprasProvider({ children }: { children: React.ReactNode }) {
  const [mesesCompras, setMesesCompras] = useState<boolean | null>(null);
  return (
    <ComprasContext.Provider value={{ mesesCompras, setMesesCompras }}>
      {children}
    </ComprasContext.Provider>
  );
}

export function useCompras() {
  const ctx = useContext(ComprasContext);
  if (!ctx) {
    throw new Error("useCompras debe usarse dentro de un ComprasProvider");
  }
  return ctx;
}
