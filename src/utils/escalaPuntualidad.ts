/* NOMCONEXIA-UNIFY */
export interface EscalaPuntualidadTramo {
  retardosDesde: number;
  retardosHasta: number | null;
  porcentajePagar: number;
}

/** 0→100%, 1→75%, 2→50%, 3→25%, 4+→0%. Sustituible por la tabla de catálogo. */
export const ESCALA_PUNTUALIDAD_DEFAULT: EscalaPuntualidadTramo[] = [
  { retardosDesde: 0, retardosHasta: 0, porcentajePagar: 1 },
  { retardosDesde: 1, retardosHasta: 1, porcentajePagar: 0.75 },
  { retardosDesde: 2, retardosHasta: 2, porcentajePagar: 0.5 },
  { retardosDesde: 3, retardosHasta: 3, porcentajePagar: 0.25 },
  { retardosDesde: 4, retardosHasta: null, porcentajePagar: 0 },
];

export function porcentajeBonoPuntualidad(
  retardos: number,
  escala: EscalaPuntualidadTramo[] = ESCALA_PUNTUALIDAD_DEFAULT
): number {
  const n = Math.max(0, Math.floor(retardos));
  const tramo = [...escala]
    .sort((a, b) => a.retardosDesde - b.retardosDesde)
    .find((t) => n >= t.retardosDesde && (t.retardosHasta == null || n <= t.retardosHasta));
  return tramo?.porcentajePagar ?? 0;
}

export function etiquetaEscala(escala: EscalaPuntualidadTramo[] = ESCALA_PUNTUALIDAD_DEFAULT) {
  return escala.map((t) => {
    const rango =
      t.retardosHasta == null
        ? `${t.retardosDesde}+`
        : t.retardosDesde === t.retardosHasta
          ? `${t.retardosDesde}`
          : `${t.retardosDesde}-${t.retardosHasta}`;
    return { rango, pagar: Math.round(t.porcentajePagar * 100) };
  });
}
