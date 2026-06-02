export const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export const getMesPeriodo = (periodo: number): string => {
  if (periodo < 1 || periodo > 12) return "Periodo inválido";
  return MONTHS_ES[periodo - 1];
};

/** Inicio del día local para comparar fechas de periodo del API. */
export function inicioDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Fin del día local para comparar fechas de periodo del API. */
export function finDelDia(fecha: Date): Date {
  const d = new Date(fecha);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function estaEnRangoCanje(
  fechaInicio: string,
  fechaFin: string,
  referencia: Date = new Date(),
): boolean {
  const ahora = referencia.getTime();
  const inicio = inicioDelDia(new Date(fechaInicio)).getTime();
  const fin = finDelDia(new Date(fechaFin)).getTime();
  return ahora >= inicio && ahora <= fin;
}

export function etiquetaMesDesdeFecha(
  fecha: string | null | undefined,
): string | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  const mes = d.toLocaleDateString("es-MX", { month: "long" });
  return mes.charAt(0).toUpperCase() + mes.slice(1);
}

export function etiquetaFechaLargaDesdeIso(
  fecha: string | null | undefined,
): string | null {
  if (!fecha) return null;
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}