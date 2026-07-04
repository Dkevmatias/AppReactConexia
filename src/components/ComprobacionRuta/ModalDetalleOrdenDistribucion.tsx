import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import {
  DocODistribucionDetalle,
  oDistribucionService,
} from "../../services/oDistribucionService";
import {
  ESTATUS_PROCESADO,
  OBSERVACIONES_SIN_INCIDENCIAS_RUTA,
  procesarODService,
} from "../../services/procesarODService";
import { formatCurrency } from "../../utils/format";
import { btnIncidenciaClass, clasesFilaTraspasoTipoOD } from "./constants";
import DetalleDistribucionCard from "./DetalleDistribucionCard";
import ModalVerIncidenciasEntrega, {
  BotonVerIncidencia,
} from "./ModalVerIncidenciasEntrega";
import {
  bloquearCrearIncidenciaPorEstatus,
  bloquearSinIncidenciasPorEstatus,
  documentoTieneIncidencia,
  esTipoODTraspaso,
  formatearDocRelacionado,
  formatearFecha,
  idsIncidenciaDocumento,
} from "./utils";

export interface ModalDetalleOrdenDistribucionProps {
  abierto: boolean;
  folio: number | null;
  estatusSistema: string | null;
  incidenciaModalAbierto: boolean;
  /** Incrementa al guardar una incidencia nueva para refrescar el listado de documentos. */
  detalleRefreshKey?: number;
  mensajeExito: string | null;
  idUsuarioCreacion: number | null;
  idEmpresa: number | null;
  idSucursal: number | null;
  onCerrar: () => void;
  onCrearIncidencia: (documento: DocODistribucionDetalle) => void;
  onVerIncidenciaCompleta?: (
    documento: DocODistribucionDetalle,
    idIncidencia: number,
  ) => void;
  onMensajeExitoChange: (mensaje: string | null) => void;
  onEstatusSistemaChange?: (estatus: string) => void;
}

export default function ModalDetalleOrdenDistribucion({
  abierto,
  folio,
  estatusSistema,
  incidenciaModalAbierto,
  detalleRefreshKey = 0,
  mensajeExito,
  idUsuarioCreacion,
  idEmpresa,
  idSucursal,
  onCerrar,
  onCrearIncidencia,
  onVerIncidenciaCompleta,
  onMensajeExitoChange,
  onEstatusSistemaChange,
}: ModalDetalleOrdenDistribucionProps) {
  const [documentos, setDocumentos] = useState<DocODistribucionDetalle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procesandoSinIncidencias, setProcesandoSinIncidencias] =
    useState(false);
  const [verIncidenciasCtx, setVerIncidenciasCtx] = useState<{
    entrega: number;
    idsIncidencia: number[];
    documento: DocODistribucionDetalle;
  } | null>(null);
  const total = useMemo(
    () => documentos.reduce((sum, item) => sum + item.total, 0),
    [documentos],
  );

  const sinIncidenciasInactivo = useMemo(
    () => bloquearSinIncidenciasPorEstatus(estatusSistema),
    [estatusSistema],
  );

  const crearIncidenciaInactivo = useMemo(
    () => bloquearCrearIncidenciaPorEstatus(estatusSistema),
    [estatusSistema],
  );

  const cargarDetalle = useCallback(async (idFolio: number) => {
    setLoading(true);
    setError(null);
    setDocumentos([]);
    try {
      const detalle = await oDistribucionService.getDetalleByFolio(idFolio);
      setDocumentos(detalle);
    } catch (err) {
      console.error(err);
      setDocumentos([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el detalle de la orden.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!abierto || !folio || folio <= 0) {
      setDocumentos([]);
      setError(null);
      setLoading(false);
      setProcesandoSinIncidencias(false);
      setVerIncidenciasCtx(null);
      return;
    }
    void cargarDetalle(folio);
  }, [abierto, folio, cargarDetalle]);

  useEffect(() => {
    if (
      !detalleRefreshKey ||
      !abierto ||
      !folio ||
      folio <= 0
    ) {
      return;
    }
    void cargarDetalle(folio);
  }, [detalleRefreshKey, abierto, folio, cargarDetalle]);

  useEffect(() => {
    if (!abierto || incidenciaModalAbierto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, incidenciaModalAbierto, onCerrar]);

  const marcarSinIncidencias = async () => {
    if (!folio || folio <= 0) {
      setError("No hay una orden de distribución seleccionada.");
      return;
    }
    if (!idUsuarioCreacion || idUsuarioCreacion <= 0) {
      setError("No se pudo identificar al usuario de la sesión.");
      return;
    }
    if (!idEmpresa || idEmpresa <= 0 || !idSucursal || idSucursal <= 0) {
      setError("No se pudo cargar el contexto operativo (empresa/sucursal).");
      return;
    }

    setProcesandoSinIncidencias(true);
    setError(null);
    onMensajeExitoChange(null);
    try {
      await procesarODService.crear({
        idODistribucion: folio,
        idUsuarioCreacion,
        idEmpresa,
        idSucursal,
        observaciones: OBSERVACIONES_SIN_INCIDENCIAS_RUTA,
        estatus: ESTATUS_PROCESADO,
        activo: true,
      });
      onMensajeExitoChange(
        `Orden ${folio} registrada sin incidencias en ruta.`,
      );
      onEstatusSistemaChange?.(ESTATUS_PROCESADO);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar la orden sin incidencias.",
      );
    } finally {
      setProcesandoSinIncidencias(false);
    }
  };

  if (!abierto) return null;

  const abrirVerIncidencias = (item: DocODistribucionDetalle) => {
    const ids = idsIncidenciaDocumento(item);
    if (ids.length === 0) return;

    if (ids.length === 1 && onVerIncidenciaCompleta) {
      onVerIncidenciaCompleta(item, ids[0]);
      return;
    }

    setVerIncidenciasCtx({
      entrega: item.entrega,
      idsIncidencia: ids,
      documento: item,
    });
  };

  const abrirDetalleIncidenciaDesdeListado = (idIncidencia: number) => {
    if (!verIncidenciasCtx || !onVerIncidenciaCompleta) return;
    onVerIncidenciaCompleta(verIncidenciasCtx.documento, idIncidencia);
    setVerIncidenciasCtx(null);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-detalle-folio-titulo"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onCerrar();
        }}
      >
        <div className="flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:max-h-[90vh] sm:max-w-6xl sm:rounded-xl dark:border-gray-600 dark:bg-gray-800">
          <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-700">
            <div className="min-w-0">
              <h2
                id="modal-detalle-folio-titulo"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Detalle orden {folio ?? "—"}
              </h2>
              {!loading && documentos.length > 0 && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  {documentos.length} documento(s) · Total{" "}
                  {formatCurrency(total)}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 touch-manipulation"
              aria-label="Cerrar detalle"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4">
            {mensajeExito && (
              <div className="mb-4 shrink-0 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
                {mensajeExito}
              </div>
            )}
            {loading ? (
              <div className="flex flex-1 items-center justify-center gap-2 py-16 text-gray-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                Cargando detalle...
              </div>
            ) : error ? (
              <div className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                {error}
              </div>
            ) : documentos.length === 0 ? (
              <p className="py-12 text-center text-sm text-gray-500">
                No hay documentos para esta orden.
              </p>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="mb-4 flex shrink-0 items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span
                    className="h-3 w-8 shrink-0 rounded border border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40"
                    aria-hidden
                  />
                  <span>
                    Verde = traspaso{" "}
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      (TipoOD = T)
                    </span>
                  </span>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto md:hidden">
                  {documentos.map((item, index) => (
                    <DetalleDistribucionCard
                      key={`${item.entrega}-${item.documento}-${index}`}
                      item={item}
                      crearIncidenciaInactivo={crearIncidenciaInactivo}
                      onCrearIncidencia={onCrearIncidencia}
                      onVerIncidencia={abrirVerIncidencias}
                    />
                  ))}
                </div>

                <div className="hidden min-h-0 flex-1 overflow-auto md:block">
                  <table className="min-w-full border-separate border-spacing-0 text-sm">
                    <thead>
                      <tr>
                        <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Orden de Entrega
                        </th>
                        <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Doc. Relacionado
                        </th>
                        <th className="sticky top-0 z-20 min-w-[220px] border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Cliente
                        </th>
                        <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Fecha
                        </th>
                        <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-right font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Total
                        </th>
                        <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Condición
                        </th>
                        <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Vendedor
                        </th>
                        <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Vehículo
                        </th>
                        <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Tipo
                        </th>
                        <th className="sticky top-0 z-20 w-36 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Acciones
                        </th>
                        <th className="sticky top-0 z-20 w-40 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left font-medium text-gray-600 shadow-[0_2px_4px_-2px_rgba(0,0,0,0.1)] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                          Ver Incidencias
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {documentos.map((item, index) => {
                        const esTraspaso = esTipoODTraspaso(item.tipoOD);
                        const tieneIncidencia = documentoTieneIncidencia(item);
                        return (
                          <tr
                            key={`${item.entrega}-${item.documento}-${index}`}
                            className={
                              esTraspaso
                                ? clasesFilaTraspasoTipoOD
                                : "hover:bg-gray-50 dark:hover:bg-gray-900/30"
                            }
                          >
                            <td className="whitespace-nowrap px-3 py-2 font-medium">
                              {item.entrega || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {formatearDocRelacionado(item)}
                            </td>
                            <td className="px-3 py-2">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {item.cardName ?? "—"}
                              </div>
                              <div className="text-xs text-gray-500">
                                {item.cardCode ?? "—"}
                              </div>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {formatearFecha(item.fechaDoc)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-right font-medium">
                              {formatCurrency(item.total)}
                            </td>
                            <td className="px-3 py-2">
                              {item.condicion ?? "—"}
                            </td>
                            <td className="px-3 py-2">{item.slpName ?? "—"}</td>
                            <td className="px-3 py-2">
                              {item.vehiculo ?? "—"}
                            </td>
                            <td className="px-3 py-2">
                              {item.tipoCliente ?? "—"}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                type="button"
                                onClick={() => onCrearIncidencia(item)}
                                disabled={crearIncidenciaInactivo}
                                className={`${btnIncidenciaClass} disabled:cursor-not-allowed disabled:opacity-50`}
                                title={
                                  crearIncidenciaInactivo
                                    ? "La orden está registrada sin incidencias (Estatus Sistema T)"
                                    : "Crear incidencia"
                                }
                              >
                                <AlertTriangle className="h-4 w-4 shrink-0" />
                                Crear Incidencia
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              {tieneIncidencia ? (
                                <BotonVerIncidencia
                                  onClick={() => abrirVerIncidencias(item)}
                                />
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="flex shrink-0 gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <button
              type="button"
              onClick={onCerrar}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 touch-manipulation sm:w-auto"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={() => void marcarSinIncidencias()}
              disabled={
                procesandoSinIncidencias || loading || sinIncidenciasInactivo
              }
              title={
                sinIncidenciasInactivo
                  ? "La orden ya está registrada como Sin Incidencias (T) o Con Incidencia (I)"
                  : "Registrar orden sin incidencias en ruta"
              }
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600 touch-manipulation sm:w-auto"
            >
              {procesandoSinIncidencias ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Sin Incidencias
            </button>
          </div>
        </div>
      </div>

      <ModalVerIncidenciasEntrega
        abierto={verIncidenciasCtx !== null}
        entrega={verIncidenciasCtx?.entrega ?? null}
        idsIncidencia={verIncidenciasCtx?.idsIncidencia ?? []}
        onCerrar={() => setVerIncidenciasCtx(null)}
        onVerDetalle={
          onVerIncidenciaCompleta ? abrirDetalleIncidenciaDesdeListado : undefined
        }
      />
    </>
  );
}
