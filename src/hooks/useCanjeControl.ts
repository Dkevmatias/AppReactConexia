import { useMemo } from "react";

type Premio = {
  idPremio: number;
  puntos: number;
  existencia: number;
  limite: number;
};

export function useCanjeControl({
  periodoActivo,
  vencido,
  restante,
  historial,
  mesescomprasanteriores,
}: {
  periodoActivo: boolean;
  vencido: boolean;
  restante: number;
  historial: Record<number, number>;
  mesescomprasanteriores?: boolean;
}) {
  const bloqueoGlobal = useMemo(() => {
    return !periodoActivo || vencido || !mesescomprasanteriores;
  }, [periodoActivo, vencido, mesescomprasanteriores]);

  const puedeInteractuar = (premio: Premio, qty: number) => {
    if (bloqueoGlobal) return false;
    if (premio.existencia <= 0) return false;
    if (premio.puntos > restante) return false;

    const yaCanjeados = historial[premio.idPremio] || 0;
    if (yaCanjeados + qty >= premio.limite) return false;

    return true;
  };

  return {
    bloqueoGlobal,
    puedeInteractuar,
  };
}
