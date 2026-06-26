import { ODistribucionDocumento } from "../../services/oDistribucionService";
import { formatearFecha } from "./utils";

export interface DocumentoDistribucionCardProps {
  doc: ODistribucionDocumento;
  onAbrirDetalle: (doc: ODistribucionDocumento) => void;
}

export default function DocumentoDistribucionCard({
  doc,
  onAbrirDetalle,
}: DocumentoDistribucionCardProps) {
  return (
    <button
      type="button"
      onClick={() => onAbrirDetalle(doc)}
      className="w-full rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-50/40 active:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600 dark:hover:bg-blue-900/20 touch-manipulation"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Folio
          </p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {doc.folio}
          </p>
          <p className="text-xl font-semibold text-gray-900 dark:text-white">
            {doc.estatus}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Fecha
          </p>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {formatearFecha(doc.fecha)}
          </p>
        </div>
      </div>
      <dl className="mt-3 grid gap-2 border-t border-gray-100 pt-3 text-sm dark:border-gray-700">
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-gray-500 dark:text-gray-400">
            Repartidor
          </dt>
          <dd className="font-medium text-gray-800 dark:text-gray-200">
            {doc.repartidor ?? "—"}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-gray-500 dark:text-gray-400">Vehiculo</dt>
          <dd className="font-medium text-gray-800 dark:text-gray-200">
            {doc.vehiculo ?? "—"}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5">
          <dt className="text-xs text-gray-500 dark:text-gray-400">Ruta</dt>
          <dd className="font-medium text-gray-800 dark:text-gray-200">
            {doc.ruta ?? "—"}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-blue-600 dark:text-blue-400">
        Tocar para ver documentos de la orden
      </p>
    </button>
  );
}
