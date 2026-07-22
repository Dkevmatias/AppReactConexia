import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, X } from "lucide-react";
import {
  DocODistribucionDetalle,
  oDistribucionService,
} from "../../services/oDistribucionService";
import {
  ESTATUS_COBRANZA,
  ESTATUS_FINALIZADO,
  ESTATUS_PROCESADO,
  OBSERVACIONES_REVISION_COBRANZA,
  OBSERVACIONES_REVISION_FINALIZADA,
  OBSERVACIONES_SIN_INCIDENCIAS_RUTA,
  procesarODService,
} from "../../services/procesarODService";
import { useComprobacionPermisos } from "../../hooks/useComprobacionPermisos";
import { formatCurrency } from "../../utils/format";
import {
  btnIncidenciaClass,
  clasesFilaPagoEfectivo,
  clasesFilaPagoOtros,
  clasesFilaPagoTransferencia,
  clasesFilaTraspasoTipoOD,
} from "./constants";
import DetalleDistribucionCard from "./DetalleDistribucionCard";
import ModalVerIncidenciasEntrega, {
  BotonVerIncidencia,
} from "./ModalVerIncidenciasEntrega";
import {
  bloquearCrearIncidenciaPorEstatus,
  bloquearFinalizadoPorEstatus,
  bloquearRCobranzaPorEstatus,
  bloquearSinIncidenciasPorEstatus,
  documentoTieneIncidencia,
  esTipoODTraspaso,
  formatearDocRelacionado,
  formatearFecha,
  idsIncidenciaDocumento,
  ordenarDocumentosPorCondicion,
  resolverTipoPagoPrioridad,
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
  const { puedeVerTotales } = useComprobacionPermisos();
  const [documentos, setDocumentos] = useState<DocODistribucionDetalle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [procesandoSinIncidencias, setProcesandoSinIncidencias] =
    useState(false);
  const [procesandoRCobranza, setProcesandoRCobranza] = useState(false);
  const [procesandoFinalizado, setProcesandoFinalizado] = useState(false);
  const [verIncidenciasCtx, setVerIncidenciasCtx] = useState<{
    entrega: number;
    idsIncidencia: number[];
    documento: DocODistribucionDetalle;
  } | null>(null);
  const total = useMemo(
    () => documentos.reduce((sum, item) => sum + item.total, 0),
    [documentos],
  );

  const totalEfectivo = useMemo(
    () => documentos.reduce((sum, item) => sum + (item.efectivo || 0), 0),
    [documentos],
  );

  const totalTransferencia = useMemo(
    () =>
      documentos.reduce((sum, item) => sum + (item.transferencia || 0), 0),
    [documentos],
  );

  const totalOtros = useMemo(
    () => documentos.reduce((sum, item) => sum + (item.otros || 0), 0),
    [documentos],
  );

  const ordenTieneIncidencias = useMemo(
    () => documentos.some((doc) => documentoTieneIncidencia(doc)),
    [documentos],
  );

  const sinIncidenciasInactivo = useMemo(
    () =>
      bloquearSinIncidenciasPorEstatus(estatusSistema) ||
      ordenTieneIncidencias,
    [estatusSistema, ordenTieneIncidencias],
  );

  const rCobranzaInactivo = useMemo(
    () => bloquearRCobranzaPorEstatus(estatusSistema),
    [estatusSistema],
  );

  const finalizadoInactivo = useMemo(
    () => bloquearFinalizadoPorEstatus(estatusSistema),
    [estatusSistema],
  );

  const crearIncidenciaInactivo = useMemo(
    () => bloquearCrearIncidenciaPorEstatus(estatusSistema),
    [estatusSistema],
  );

  const procesandoEstatus =
    procesandoSinIncidencias || procesandoRCobranza || procesandoFinalizado;

  const documentosOrdenados = useMemo(
    () => ordenarDocumentosPorCondicion(documentos),
    [documentos],
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
      setProcesandoRCobranza(false);
      setProcesandoFinalizado(false);
      setVerIncidenciasCtx(null);
      return;
    }
    void cargarDetalle(folio);
  }, [abierto, folio, cargarDetalle]);

  useEffect(() => {
    if (!detalleRefreshKey || !abierto || !folio || folio <= 0) {
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

  const marcarRCobranza = async () => {
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

    setProcesandoRCobranza(true);
    setError(null);
    onMensajeExitoChange(null);
    try {
      await procesarODService.actualizar({
        idODistribucion: folio,
        idUsuarioEdicion: idUsuarioCreacion,
        idEmpresa,
        idSucursal,
        observaciones: OBSERVACIONES_REVISION_COBRANZA,
        estatus: ESTATUS_COBRANZA,
        activo: true,
      });
      onMensajeExitoChange(
        `Orden ${folio} marcada como revisada por cobranza (R-COD).`,
      );
      onEstatusSistemaChange?.(ESTATUS_COBRANZA);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar la revisión de cobranza.",
      );
    } finally {
      setProcesandoRCobranza(false);
    }
  };

  const marcarFinalizado = async () => {
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

    setProcesandoFinalizado(true);
    setError(null);
    onMensajeExitoChange(null);
    try {
      await procesarODService.actualizar({
        idODistribucion: folio,
        idUsuarioEdicion: idUsuarioCreacion,
        idEmpresa,
        idSucursal,
        observaciones: OBSERVACIONES_REVISION_FINALIZADA,
        estatus: ESTATUS_FINALIZADO,
        activo: true,
      });
      onMensajeExitoChange(`Orden ${folio} marcada como finalizada (R-F).`);
      onEstatusSistemaChange?.(ESTATUS_FINALIZADO);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo finalizar la orden de distribución.",
      );
    } finally {
      setProcesandoFinalizado(false);
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
        className="fixed inset-0 z-[200] flex items-stretch justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-detalle-folio-titulo"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onCerrar();
        }}
      >
        {/*
          Handhelds (Zebra TC21): max-h sin height fija + flex-1/min-h-0 colapsa el listado.
          En móvil forzamos 100dvh para que el cuerpo pueda scrollear.
        */}
        <div className="flex h-[100vh] max-h-[100vh] h-[100dvh] max-h-[100dvh] w-full flex-col rounded-none border border-gray-200 bg-white shadow-xl sm:h-auto sm:max-h-[90vh] sm:max-w-7xl sm:rounded-xl dark:border-gray-600 dark:bg-gray-800">
          <div className="flex shrink-0 items-start justify-between gap-2 border-b border-gray-200 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-4 dark:border-gray-700">
            <div className="min-w-0">
              <h2
                id="modal-detalle-folio-titulo"
                className="text-base font-semibold text-gray-900 sm:text-lg dark:text-white"
              >
                Detalle orden {folio ?? "—"}
              </h2>
              {!loading && documentos.length > 0 && (
                <p className="mt-0.5 text-xs text-gray-500 sm:mt-1 sm:text-sm dark:text-gray-400">
                  {documentos.length} documento(s)
                  {puedeVerTotales ? (
                    <> · Total {formatCurrency(total)}</>
                  ) : null}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 touch-manipulation sm:min-h-[44px] sm:min-w-[44px]"
              aria-label="Cerrar detalle"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-3 py-2 sm:overflow-hidden sm:px-4 sm:py-4">
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
                <div className="mb-2 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] leading-tight text-gray-600 sm:mb-4 sm:gap-x-4 sm:gap-y-2 sm:text-xs dark:text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-5 shrink-0 rounded border border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40 sm:h-3 sm:w-8"
                      aria-hidden
                    />
                    Efectivo
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-5 shrink-0 rounded border border-sky-400 bg-sky-50 dark:border-sky-700 dark:bg-sky-950/40 sm:h-3 sm:w-8"
                      aria-hidden
                    />
                    Transferencia
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-5 shrink-0 rounded border border-amber-400 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 sm:h-3 sm:w-8"
                      aria-hidden
                    />
                    Otros
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <span
                      className="h-2.5 w-5 shrink-0 rounded border border-emerald-400 bg-emerald-50/60 dark:border-emerald-700 dark:bg-emerald-950/30 sm:h-3 sm:w-8"
                      aria-hidden
                    />
                    Traspaso (T)
                  </span>
                </div>

                {puedeVerTotales ? (
                  <div className="mb-2 grid shrink-0 grid-cols-3 gap-1.5 sm:mb-4 sm:gap-3">
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 dark:border-emerald-800 dark:bg-emerald-950/40 sm:rounded-xl sm:px-4 sm:py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-300 sm:text-xs">
                        Efectivo
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-emerald-800 dark:text-emerald-200 sm:mt-1 sm:text-lg">
                        {formatCurrency(totalEfectivo)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 dark:border-sky-800 dark:bg-sky-950/40 sm:rounded-xl sm:px-4 sm:py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-sky-700 dark:text-sky-300 sm:text-xs">
                        Transfer.
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-sky-800 dark:text-sky-200 sm:mt-1 sm:text-lg">
                        {formatCurrency(totalTransferencia)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 dark:border-amber-800 dark:bg-amber-950/40 sm:rounded-xl sm:px-4 sm:py-3">
                      <p className="text-[10px] font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300 sm:text-xs">
                        Otros
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-amber-800 dark:text-amber-200 sm:mt-1 sm:text-lg">
                        {formatCurrency(totalOtros)}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-2 pb-2 sm:hidden">
                  {documentosOrdenados.map((item, index) => (
                    <DetalleDistribucionCard
                      key={`${item.entrega}-${item.documento}-${index}`}
                      item={item}
                      mostrarMontos={puedeVerTotales}
                      crearIncidenciaInactivo={crearIncidenciaInactivo}
                      onCrearIncidencia={onCrearIncidencia}
                      onVerIncidencia={abrirVerIncidencias}
                    />
                  ))}
                </div>

                <div className="hidden min-h-0 flex-1 overflow-auto sm:block">
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
                        {puedeVerTotales ? (
                          <>
                            <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-right font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              Total
                            </th>
                            <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-right font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              Efectivo
                            </th>
                            <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-right font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              Transferencias
                            </th>
                            <th className="sticky top-0 z-20 border-b border-gray-200 bg-gray-50 px-3 py-2 text-right font-medium text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
                              Otros
                            </th>
                          </>
                        ) : null}
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
                      {documentosOrdenados.map((item, index) => {
                        const tipoPago = resolverTipoPagoPrioridad(item);
                        const esTraspaso = esTipoODTraspaso(item.tipoOD);
                        const tieneIncidencia = documentoTieneIncidencia(item);
                        const claseFila =
                          tipoPago === "efectivo"
                            ? clasesFilaPagoEfectivo
                            : tipoPago === "transferencia"
                              ? clasesFilaPagoTransferencia
                              : tipoPago === "otros"
                                ? clasesFilaPagoOtros
                                : esTraspaso
                                  ? clasesFilaTraspasoTipoOD
                                  : "hover:bg-gray-50 dark:hover:bg-gray-900/30";
                        return (
                          <tr
                            key={`${item.entrega}-${item.documento}-${index}`}
                            className={claseFila}
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
                            {puedeVerTotales ? (
                              <>
                                <td className="whitespace-nowrap px-3 py-2 text-right font-medium">
                                  {formatCurrency(item.total)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-right">
                                  {formatCurrency(item.efectivo)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-right">
                                  {formatCurrency(item.transferencia)}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2 text-right">
                                  {formatCurrency(item.otros)}
                                </td>
                              </>
                            ) : null}
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
                                    ? "La orden ya está finalizada (R-F); no se pueden crear incidencias"
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

          <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-gray-200 px-3 py-2 dark:border-gray-700 sm:flex sm:flex-row sm:flex-wrap sm:gap-3 sm:px-4 sm:py-3">
            <button
              type="button"
              onClick={onCerrar}
              className="inline-flex min-h-[40px] w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 touch-manipulation sm:min-h-[44px] sm:w-auto sm:px-4"
            >
              Cerrar
            </button>

            <button
              type="button"
              onClick={() => void marcarSinIncidencias()}
              disabled={procesandoEstatus || loading || sinIncidenciasInactivo}
              title={
                ordenTieneIncidencias
                  ? "No disponible: la orden ya tiene incidencias registradas"
                  : sinIncidenciasInactivo
                    ? "La orden ya está procesada (Sin Incidencias R-AM o con incidencia)"
                    : "Registrar orden sin incidencias en ruta"
              }
              className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-700 dark:hover:bg-emerald-600 touch-manipulation sm:min-h-[44px] sm:w-auto sm:px-4"
            >
              {procesandoSinIncidencias ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Sin Incidencias
            </button>

            <button
              type="button"
              onClick={() => void marcarRCobranza()}
              disabled={procesandoEstatus || loading || rCobranzaInactivo}
              title={
                rCobranzaInactivo
                  ? "Disponible cuando la orden esté en R-AM (revisada por almacén)"
                  : "Actualizar estatus a R-COD (revisada por cobranza)"
              }
              className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50 dark:bg-sky-700 dark:hover:bg-sky-600 touch-manipulation sm:min-h-[44px] sm:w-auto sm:px-4"
            >
              {procesandoRCobranza ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              R. Cobranza
            </button>

            <button
              type="button"
              onClick={() => void marcarFinalizado()}
              disabled={procesandoEstatus || loading || finalizadoInactivo}
              title={
                finalizadoInactivo
                  ? "Disponible cuando la orden esté en R-COD (revisada por cobranza)"
                  : "Finalizar orden (actualizar estatus a R-F)"
              }
              className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 dark:bg-violet-700 dark:hover:bg-violet-600 touch-manipulation sm:min-h-[44px] sm:w-auto sm:px-4"
            >
              {procesandoFinalizado ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Finalizado
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
          onVerIncidenciaCompleta
            ? abrirDetalleIncidenciaDesdeListado
            : undefined
        }
      />
    </>
  );
}
