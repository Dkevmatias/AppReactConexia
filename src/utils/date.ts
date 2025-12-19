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