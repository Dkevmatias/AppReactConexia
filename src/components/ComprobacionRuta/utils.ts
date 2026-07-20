import type { DocODistribucionDetalle } from "../../services/oDistribucionService";
import {
  ESTATUS_COBRANZA,
  ESTATUS_FINALIZADO,
  ESTATUS_PROCESADO,
} from "../../services/procesarODService";

export function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleDateString("es-MX");
}

export function documentoTieneIncidencia(
  item: Pick<
    DocODistribucionDetalle,
    "tieneIncidencia" | "idsIncidencia" | "cantidadIncidencias" | "idIncidencia"
  >,
): boolean {
  if ((item.tieneIncidencia ?? "").trim().toUpperCase() === "S") return true;
  if (item.idsIncidencia.length > 0) return true;
  if (item.cantidadIncidencias > 0) return true;
  return item.idIncidencia != null && item.idIncidencia > 0;
}

export function idsIncidenciaDocumento(
  item: Pick<
    DocODistribucionDetalle,
    "idsIncidencia" | "idIncidencia"
  >,
): number[] {
  if (item.idsIncidencia.length > 0) {
    return [...new Set(item.idsIncidencia)];
  }
  if (item.idIncidencia != null && item.idIncidencia > 0) {
    return [item.idIncidencia];
  }
  return [];
}

export function esTipoODTraspaso(tipoOD: string | null | undefined): boolean {
  return (tipoOD ?? "").trim().toUpperCase() === "T";
}

function normalizarCondicion(condicion: string | null | undefined): string {
  return (condicion ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function esCondicionContado(
  condicion: string | null | undefined,
): boolean {
  return normalizarCondicion(condicion).startsWith("contado");
}

export function esCondicion20Dias(
  condicion: string | null | undefined,
): boolean {
  const valor = normalizarCondicion(condicion);
  return valor.includes("20") && valor.includes("dia");
}

export function prioridadOrdenCondicionDetalle(
  condicion: string | null | undefined,
): number {
  if (esCondicionContado(condicion)) return 0;
  if (esCondicion20Dias(condicion)) return 1;
  return 2;
}

export type TipoPagoPrioridad = "efectivo" | "transferencia" | "otros" | "ninguno";

/** Prioridad visual/orden: efectivo → transferencia → otros → sin pago. */
export function resolverTipoPagoPrioridad(
  item: Pick<DocODistribucionDetalle, "efectivo" | "transferencia" | "otros">,
): TipoPagoPrioridad {
  if ((item.efectivo ?? 0) > 0) return "efectivo";
  if ((item.transferencia ?? 0) > 0) return "transferencia";
  if ((item.otros ?? 0) > 0) return "otros";
  return "ninguno";
}

export function prioridadOrdenPagoDetalle(
  item: Pick<DocODistribucionDetalle, "efectivo" | "transferencia" | "otros">,
): number {
  switch (resolverTipoPagoPrioridad(item)) {
    case "efectivo":
      return 0;
    case "transferencia":
      return 1;
    case "otros":
      return 2;
    default:
      return 3;
  }
}

export function ordenarDocumentosPorCondicion(
  documentos: DocODistribucionDetalle[],
): DocODistribucionDetalle[] {
  return [...documentos].sort((a, b) => {
    const ordenPago =
      prioridadOrdenPagoDetalle(a) - prioridadOrdenPagoDetalle(b);
    if (ordenPago !== 0) return ordenPago;

    const ordenCondicion =
      prioridadOrdenCondicionDetalle(a.condicion) -
      prioridadOrdenCondicionDetalle(b.condicion);
    if (ordenCondicion !== 0) return ordenCondicion;

    return (a.entrega ?? 0) - (b.entrega ?? 0);
  });
}

/** T / R-AM / R-COD / R-F = Sin Incidencias — no se pueden registrar incidencias. */
export function bloquearCrearIncidenciaPorEstatus(
  estatusS: string | null | undefined,
): boolean {
  const estatus = (estatusS ?? "").trim().toUpperCase();
  return (
    estatus === "T" ||
    estatus === ESTATUS_PROCESADO ||
    estatus === ESTATUS_COBRANZA ||
    estatus === ESTATUS_FINALIZADO
  );
}

/** T / R-AM / R-COD / R-F / I — no aplica marcar Sin Incidencias de nuevo. */
export function bloquearSinIncidenciasPorEstatus(
  estatusS: string | null | undefined,
): boolean {
  const estatus = (estatusS ?? "").trim().toUpperCase();
  return (
    estatus === "T" ||
    estatus === "I" ||
    estatus === ESTATUS_PROCESADO ||
    estatus === ESTATUS_COBRANZA ||
    estatus === ESTATUS_FINALIZADO
  );
}

/** Solo habilitado cuando la orden ya fue revisada por almacén (R-AM). */
export function bloquearRCobranzaPorEstatus(
  estatusS: string | null | undefined,
): boolean {
  const estatus = (estatusS ?? "").trim().toUpperCase();
  return estatus !== ESTATUS_PROCESADO;
}

/** Solo habilitado cuando la orden ya fue revisada por cobranza (R-COD). */
export function bloquearFinalizadoPorEstatus(
  estatusS: string | null | undefined,
): boolean {
  const estatus = (estatusS ?? "").trim().toUpperCase();
  return estatus !== ESTATUS_COBRANZA;
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
