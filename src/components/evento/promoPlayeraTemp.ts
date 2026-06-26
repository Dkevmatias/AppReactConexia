/**
 * PROMO TEMPORAL PLAYERA — eliminar este archivo y sus imports al terminar la promoción.
 * Revertir también limite del premio en BD (4 → 2).
 */
export const ID_PREMIO_PLAYERA_PROMO = 5;
/** Solo visualización en tarjeta — el canje sigue usando puntos de BD */
export const PUNTOS_DISPLAY_PLAYERA_PROMO = 20;

const MULTIPLO = 2;

export function esPremioPlayeraPromo(idPremio: number): boolean {
  return idPremio === ID_PREMIO_PLAYERA_PROMO;
}

export function puntosDisplayPremio(idPremio: number, puntosBd: number): number {
  if (esPremioPlayeraPromo(idPremio)) return PUNTOS_DISPLAY_PLAYERA_PROMO;
  return puntosBd;
}

export function cupoRestantePlayera(
  limite: number,
  yaCanjeados: number,
): number {
  return Math.max(limite - yaCanjeados, 0);
}

/** Valida cantidad a canjear: múltiplos de 2, o 1 si solo queda 1 en cupo (histórico). */
export function cantidadValidaCanjePlayera(
  qty: number,
  limite: number,
  yaCanjeados: number,
): boolean {
  if (qty <= 0) return false;

  const cupo = cupoRestantePlayera(limite, yaCanjeados);
  if (qty > cupo) return false;
  if (cupo === 1 && qty === 1) return true;

  return qty % MULTIPLO === 0;
}

export function siguienteCantidadPlayera(
  qtyActual: number,
  limite: number,
  yaCanjeados: number,
): number | null {
  const cupo = cupoRestantePlayera(limite, yaCanjeados);
  if (cupo <= 0) return null;

  if (qtyActual === 0) {
    return cupo >= MULTIPLO ? MULTIPLO : cupo === 1 ? 1 : null;
  }

  const next = qtyActual + MULTIPLO;
  if (next <= cupo) return next;

  return null;
}

export function anteriorCantidadPlayera(qtyActual: number): number {
  if (qtyActual <= 0) return 0;
  if (qtyActual === 1) return 0;
  return qtyActual - MULTIPLO;
}

/** Umbral de puntos para barra / disponibilidad cuando aún no hay cantidad seleccionada. */
export function puntosMinimosPlayera(
  puntosUnitario: number,
  limite: number,
  yaCanjeados: number,
): number {
  const cupo = cupoRestantePlayera(limite, yaCanjeados);
  if (cupo <= 1) return puntosUnitario;
  return puntosUnitario * MULTIPLO;
}
