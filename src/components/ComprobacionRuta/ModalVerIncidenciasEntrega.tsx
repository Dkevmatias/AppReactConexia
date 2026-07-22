import { useCallback, useEffect, useState } from "react";
import { Eye, Loader2, X } from "lucide-react";
import {
  etiquetaEstatusIncidencia,
  incidenciaService,
  IncidenciaResumen,
} from "../../services/incidenciaService";

export interface ModalVerIncidenciasEntregaProps {
  abierto: boolean;
  entrega: number | null;
  idsIncidencia: number[];
  onCerrar: () => void;
  onVerDetalle?: (idIncidencia: number) => void;
}

export default function ModalVerIncidenciasEntrega({
  abierto,
  entrega,
  idsIncidencia,
  onCerrar,
  onVerDetalle,
}: ModalVerIncidenciasEntregaProps) {
  const [incidencias, setIncidencias] = useState<IncidenciaResumen[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarIncidencias = useCallback(async (ids: number[]) => {
    setLoading(true);
    setError(null);
    setIncidencias([]);
    try {
      const data = await incidenciaService.getByIds(ids);
      setIncidencias(data);
      if (data.length === 0) {
        setError("No se encontraron incidencias para esta entrega.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las incidencias.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!abierto || idsIncidencia.length === 0) {
      setIncidencias([]);
      setError(null);
      setLoading(false);
      return;
    }
    void cargarIncidencias(idsIncidencia);
  }, [abierto, idsIncidencia, cargarIncidencias]);

  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const abrirDetalle = (idIncidencia: number) => {
    if (!onVerDetalle) return;
    onVerDetalle(idIncidencia);
  };

  const filaListadoClass =
    "cursor-pointer transition hover:bg-violet-50/80 dark:hover:bg-violet-950/20";

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-ver-incidencias-titulo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="flex max-h-[90vh] w-full flex-col rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:max-w-3xl sm:rounded-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <div className="min-w-0">
            <h2
              id="modal-ver-incidencias-titulo"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Incidencias de la entrega
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Entrega {entrega ?? "—"} · {idsIncidencia.length} registro(s)
            </p>
            {onVerDetalle && incidencias.length > 0 && !loading && !error && (
              <p className="mt-1 text-xs text-violet-700 dark:text-violet-300">
                Toca &quot;Ver&quot; o la fila para abrir la incidencia completa
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 touch-manipulation"
            aria-label="Cerrar incidencias"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando incidencias...
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          ) : incidencias.length === 1 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/30">
              <dl className="grid gap-3 text-sm">
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Tipo de incidencia
                  </dt>
                  <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                    {incidencias[0].tipoIncidencia}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Observaciones
                  </dt>
                  <dd className="mt-0.5 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                    {incidencias[0].observaciones || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Estatus
                  </dt>
                  <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                    {etiquetaEstatusIncidencia(incidencias[0].estatus)}
                  </dd>
                </div>
              </dl>
              {onVerDetalle ? (
                <div className="mt-4">
                  <BotonVerIncidencia
                    className="w-full"
                    onClick={() => abrirDetalle(incidencias[0].idIncidencia)}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <div className="space-y-3 md:hidden">
                {incidencias.map((incidencia) => (
                  <article
                    key={incidencia.idIncidencia}
                    className={`rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/30${onVerDetalle ? ` ${filaListadoClass}` : ""}`}
                    onClick={() =>
                      onVerDetalle && abrirDetalle(incidencia.idIncidencia)
                    }
                    onKeyDown={(event) => {
                      if (!onVerDetalle) return;
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        abrirDetalle(incidencia.idIncidencia);
                      }
                    }}
                    role={onVerDetalle ? "button" : undefined}
                    tabIndex={onVerDetalle ? 0 : undefined}
                  >
                    <dl className="grid gap-2 text-sm">
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Tipo de incidencia
                        </dt>
                        <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                          {incidencia.tipoIncidencia}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Observaciones
                        </dt>
                        <dd className="mt-0.5 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
                          {incidencia.observaciones || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 dark:text-gray-400">
                          Estatus
                        </dt>
                        <dd className="mt-0.5 font-medium text-gray-900 dark:text-white">
                          {etiquetaEstatusIncidencia(incidencia.estatus)}
                        </dd>
                      </div>
                    </dl>
                    {onVerDetalle ? (
                      <div className="mt-3">
                        <BotonVerIncidencia
                          className="w-full"
                          onClick={() => abrirDetalle(incidencia.idIncidencia)}
                        />
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>

              <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Tipo de incidencia
                    </th>
                    <th className="min-w-[200px] px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Observaciones
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estatus
                    </th>
                    {onVerDetalle ? (
                      <th className="w-36 px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                        Acción
                      </th>
                    ) : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {incidencias.map((incidencia) => (
                    <tr
                      key={incidencia.idIncidencia}
                      className={onVerDetalle ? filaListadoClass : undefined}
                      onClick={() =>
                        onVerDetalle && abrirDetalle(incidencia.idIncidencia)
                      }
                      title={
                        onVerDetalle
                          ? "Clic para ver la incidencia completa"
                          : undefined
                      }
                    >
                      <td className="px-3 py-2 font-medium">
                        {incidencia.tipoIncidencia}
                      </td>
                      <td className="px-3 py-2 whitespace-pre-wrap">
                        {incidencia.observaciones || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {etiquetaEstatusIncidencia(incidencia.estatus)}
                      </td>
                      {onVerDetalle ? (
                        <td className="px-3 py-2">
                          <BotonVerIncidencia
                            onClick={() =>
                              abrirDetalle(incidencia.idIncidencia)
                            }
                          />
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 touch-manipulation"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

export function BotonVerIncidencia({
  onClick,
  className = "",
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={`inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-medium text-violet-900 hover:bg-violet-100 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-200 dark:hover:bg-violet-900/50 touch-manipulation sm:text-sm ${className}`}
    >
      <Eye className="h-4 w-4 shrink-0" />
      Ver incidencia
    </button>
  );
}
