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

    const yaCanjeados = historial[premio.idPremio] || 0;
    if (yaCanjeados >= premio.limite) return false;
    if (yaCanjeados + qty > premio.limite) return false;

    if (qty > 0) {
      if (restante < 0) return false;
    } else if (premio.puntos > restante) {
      return false;
    }

    return true;
  };

  return {
    bloqueoGlobal,
    puedeInteractuar,
  };
}
