import {
  etiquetaFechaLargaDesdeIso,
  etiquetaMesDesdeFecha,
  finDelDia,
  inicioDelDia,
} from "./date";

interface PeriodoAlertProps {
  periodoActivo: boolean;
  saldoVencido: boolean;
  mesescomprasanteriores: boolean;
  fechaInicioCanje?: string | null;
  fechaFinCanje?: string | null;
}

function mensajePeriodoInactivo(
  fechaInicio?: string | null,
  fechaFin?: string | null,
): string {
  const ahora = new Date();

  if (fechaInicio && ahora < inicioDelDia(new Date(fechaInicio))) {
    const etiqueta = etiquetaFechaLargaDesdeIso(fechaInicio);
    return etiqueta
      ? `El canje de puntos estará disponible a partir del ${etiqueta}.`
      : "El canje de puntos aún no está disponible.";
  }

  if (fechaFin && ahora > finDelDia(new Date(fechaFin))) {
    const mes = etiquetaMesDesdeFecha(fechaFin);
    return mes
      ? `El periodo de canje finalizó en ${mes}.`
      : "El periodo de canje ha finalizado.";
  }

  const mesFin = etiquetaMesDesdeFecha(fechaFin);
  if (mesFin) {
    return `El canje de puntos estará disponible hasta el mes de ${mesFin}.`;
  }

  return "El canje de puntos no está disponible en este momento.";
}

export default function PeriodoAlert({
  periodoActivo,
  saldoVencido,
  mesescomprasanteriores,
  fechaInicioCanje,
  fechaFinCanje,
}: PeriodoAlertProps) {
  if (!periodoActivo) {
    return (
      <div className="text-center p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded-xl">
        {mensajePeriodoInactivo(fechaInicioCanje, fechaFinCanje)}
      </div>
    );
  }

  if (saldoVencido) {
    return (
      <div className="text-center p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded-xl">
        Estimado cliente, tienes un saldo vencido que deberas cubrir para poder
        canjear premios. Puedes Contactar a tu asesor para cualquier aclaración.
      </div>
    );
  }

  if (!mesescomprasanteriores) {
    return (
      <div className="text-center p-4 bg-blue-100 border border-blue-300 text-blue-700 rounded-xl">
        Estimado cliente, debes contar con un minimo de 3 meses consecutivos de
        compras para poder canjear premios. Puedes Contactar a tu asesor para
        cualquier aclaración.
      </div>
    );
  }

  const mesFin = etiquetaMesDesdeFecha(fechaFinCanje);
  return (
    <div className="text-center p-4 bg-green-100 border border-green-300 text-green-700 rounded-xl">
      Puedes canjear tus puntos acumulados por cualquiera de los premios
      disponibles
      {mesFin ? ` durante el mes de ${mesFin}.` : "."}
    </div>
  );
}
