import { AlertTriangle } from "lucide-react";
import { DocODistribucionDetalle } from "../../services/oDistribucionService";
import { formatCurrency } from "../../utils/format";
import {
  btnIncidenciaClass,
  clasesTarjetaDetalleTraspasoTipoOD,
  clasesTarjetaPagoEfectivo,
  clasesTarjetaPagoOtros,
  clasesTarjetaPagoTransferencia,
} from "./constants";
import { BotonVerIncidencia } from "./ModalVerIncidenciasEntrega";
import {
  documentoTieneIncidencia,
  esTipoODTraspaso,
  formatearDocRelacionado,
  formatearFecha,
  resolverTipoPagoPrioridad,
} from "./utils";

export interface DetalleDistribucionCardProps {
  item: DocODistribucionDetalle;
  /** Montos cobrados (total / efectivo / transferencia / otros). */
  mostrarMontos?: boolean;
  crearIncidenciaInactivo?: boolean;
  onCrearIncidencia: (item: DocODistribucionDetalle) => void;
  onVerIncidencia?: (item: DocODistribucionDetalle) => void;
}

export default function DetalleDistribucionCard({
  item,
  mostrarMontos = true,
  crearIncidenciaInactivo = false,
  onCrearIncidencia,
  onVerIncidencia,
}: DetalleDistribucionCardProps) {
  const tipoPago = resolverTipoPagoPrioridad(item);
  const esTraspaso = esTipoODTraspaso(item.tipoOD);
  const tieneIncidencia = documentoTieneIncidencia(item);

  const claseTarjeta =
    tipoPago === "efectivo"
      ? clasesTarjetaPagoEfectivo
      : tipoPago === "transferencia"
        ? clasesTarjetaPagoTransferencia
        : tipoPago === "otros"
          ? clasesTarjetaPagoOtros
          : esTraspaso
            ? clasesTarjetaDetalleTraspasoTipoOD
            : "border-gray-200 bg-gray-50 dark:border-gray-600 dark:bg-gray-900/40";

  return (
    <article className={`rounded-lg border p-3 ${claseTarjeta}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-gray-900 dark:text-white">
            {item.cardName ?? "—"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {item.cardCode ?? "—"}
          </p>
        </div>
        {mostrarMontos ? (
          <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(item.total)}
          </p>
        ) : null}
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Entrega</dt>
          <dd className="font-medium">{item.entrega || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Doc. Relacionado</dt>
          <dd className="font-medium">{formatearDocRelacionado(item)}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Documento</dt>
          <dd className="font-medium">{item.documento || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Fecha</dt>
          <dd className="font-medium">{formatearFecha(item.fechaDoc)}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Condición</dt>
          <dd className="font-medium">{item.condicion ?? "—"}</dd>
        </div>
        {mostrarMontos ? (
          <>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Efectivo</dt>
              <dd className="font-medium">{formatCurrency(item.efectivo)}</dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Transferencias</dt>
              <dd className="font-medium">
                {formatCurrency(item.transferencia)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-500 dark:text-gray-400">Otros</dt>
              <dd className="font-medium">{formatCurrency(item.otros)}</dd>
            </div>
          </>
        ) : null}
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Vendedor</dt>
          <dd className="font-medium">{item.slpName ?? "—"}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={() => onCrearIncidencia(item)}
          disabled={crearIncidenciaInactivo}
          title={
            crearIncidenciaInactivo
              ? "La orden ya está finalizada (R-F); no se pueden crear incidencias"
              : "Crear incidencia"
          }
          className={`${btnIncidenciaClass} flex-1 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Crear incidencia
        </button>
        {tieneIncidencia && onVerIncidencia ? (
          <BotonVerIncidencia
            className="flex-1"
            onClick={() => onVerIncidencia(item)}
          />
        ) : null}
      </div>
    </article>
  );
}
