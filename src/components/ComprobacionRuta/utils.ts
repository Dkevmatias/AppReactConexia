import type { DocODistribucionDetalle } from "../../services/oDistribucionService";

export function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleDateString("es-MX");
}

export function esTipoODTraspaso(tipoOD: string | null | undefined): boolean {
  return (tipoOD ?? "").trim().toUpperCase() === "T";
}

/** T = Sin Incidencias — no se pueden registrar incidencias. */
export function bloquearCrearIncidenciaPorEstatus(
  estatusS: string | null | undefined,
): boolean {
  return (estatusS ?? "").trim().toUpperCase() === "T";
}

/** T = Sin Incidencias, I = Con Incidencia — no aplica marcar de nuevo. */
export function bloquearSinIncidenciasPorEstatus(
  estatusS: string | null | undefined,
): boolean {
  const estatus = (estatusS ?? "").trim().toUpperCase();
  return estatus === "T" || estatus === "I";
}

function tieneValorDocumentoRelacionado(
  valor: number | null | undefined,
): boolean {
  return valor != null && valor > 0;
}

/** Formato Doc. Relacionado según el campo con valor en el registro. */
export function formatearDocRelacionado(
  item: Pick<
    DocODistribucionDetalle,
    "facturaReserva" | "facturaDeudor" | "devolucionEntrega" | "numTraspaso"
  >,
): string {
  if (tieneValorDocumentoRelacionado(item.facturaReserva)) {
    return `FR-${item.facturaReserva}`;
  }
  if (tieneValorDocumentoRelacionado(item.facturaDeudor)) {
    return `FD-${item.facturaDeudor}`;
  }
  if (tieneValorDocumentoRelacionado(item.devolucionEntrega)) {
    return `DV-${item.devolucionEntrega}`;
  }
  if (tieneValorDocumentoRelacionado(item.numTraspaso)) {
    return `T-${item.numTraspaso}`;
  }
  return "—";
}
