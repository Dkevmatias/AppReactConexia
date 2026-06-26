import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { DocODistribucionDetalle } from "../../services/oDistribucionService";
import {
  ESTADOS_ARTICULO_INCIDENCIA,
  incidenciaService,
  resolverEstatusIncidencia,
  TIPO_INCIDENCIA_SIN_DETALLE,
  TipoIncidencia,
} from "../../services/incidenciaService";

const inputClass =
  "w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white touch-manipulation";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

export type ContextoIncidenciaDistribucion = {
  folioOrden: number;
  documento: DocODistribucionDetalle;
};

type LineaDetalleIncidencia = {
  idLocal: string;
  articulo: string;
  descripcion: string;
  cantidad: string;
  estado: string;
  observaciones: string;
};

function nuevaLineaDetalle(): LineaDetalleIncidencia {
  return {
    idLocal: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    articulo: "",
    descripcion: "",
    cantidad: "1",
    estado: ESTADOS_ARTICULO_INCIDENCIA[0],
    observaciones: "",
  };
}

function formularioVacio() {
  return {
    idTipoIncidencia: "",
    observacionesEncabezado: "",
    lineas: [] as LineaDetalleIncidencia[],
  };
}

export interface ModalIncidenciaDistribucionProps {
  abierto: boolean;
  contexto: ContextoIncidenciaDistribucion | null;
  idUsuarioCreacion: number | null;
  idEmpresa: number | null;
  idSucursal: number | null;
  onCerrar: () => void;
  onGuardado?: (mensaje: string) => void;
}

export default function ModalIncidenciaDistribucion({
  abierto,
  contexto,
  idUsuarioCreacion,
  idEmpresa,
  idSucursal,
  onCerrar,
  onGuardado,
}: ModalIncidenciaDistribucionProps) {
  const [tiposIncidencia, setTiposIncidencia] = useState<TipoIncidencia[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(formularioVacio());

  const cargarTipos = useCallback(async () => {
    setLoadingTipos(true);
    setError(null);
    try {
      const tipos = await incidenciaService.getTiposActivos();
      setTiposIncidencia(tipos);
      if (tipos.length === 1) {
        setForm((prev) => ({
          ...prev,
          idTipoIncidencia: String(tipos[0].idTipoIncidencia),
        }));
      }
    } catch (err) {
      console.error(err);
      setTiposIncidencia([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los tipos de incidencia.",
      );
    } finally {
      setLoadingTipos(false);
    }
  }, []);

  useEffect(() => {
    if (!abierto) return;
    setForm(formularioVacio());
    setError(null);
    void cargarTipos();
  }, [abierto, contexto?.folioOrden, contexto?.documento.entrega, cargarTipos]);

  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onCerrar]);

  const agregarLinea = () => {
    setForm((prev) => ({
      ...prev,
      lineas: [...prev.lineas, nuevaLineaDetalle()],
    }));
  };

  const actualizarLinea = (
    idLocal: string,
    campo: keyof Omit<LineaDetalleIncidencia, "idLocal">,
    valor: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      lineas: prev.lineas.map((linea) =>
        linea.idLocal === idLocal ? { ...linea, [campo]: valor } : linea,
      ),
    }));
  };

  const eliminarLinea = (idLocal: string) => {
    setForm((prev) => ({
      ...prev,
      lineas: prev.lineas.filter((linea) => linea.idLocal !== idLocal),
    }));
  };

  const handleGuardar = async () => {
    if (!contexto) return;
    const idTipo = Number(form.idTipoIncidencia);
    if (!idTipo || idTipo <= 0) {
      setError("Seleccione un tipo de incidencia.");
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
    const idOrdenEntrega =
      contexto.documento.entrega || contexto.documento.factura;
    if (!idOrdenEntrega || idOrdenEntrega <= 0) {
      setError("La entrega seleccionada no tiene un identificador válido.");
      return;
    }
    const idODistribucion = contexto.documento.folio || contexto.folioOrden;
    if (!idODistribucion || idODistribucion <= 0) {
      setError("La orden de distribución no tiene un folio válido.");
      return;
    }

    const esTipoSinDetalle = idTipo === TIPO_INCIDENCIA_SIN_DETALLE;

    if (!esTipoSinDetalle) {
      if (form.lineas.length === 0) {
        setError("Agregue al menos un artículo al detalle.");
        return;
      }
      for (const [index, linea] of form.lineas.entries()) {
        if (!linea.articulo.trim()) {
          setError(`Indique el artículo en la fila ${index + 1}.`);
          return;
        }
        const cantidad = Number(linea.cantidad);
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
          setError(`Cantidad inválida en la fila ${index + 1}.`);
          return;
        }
      }
    }

    setGuardando(true);
    setError(null);
    try {
      await incidenciaService.crearIncidencia({
        idTipoIncidencia: idTipo,
        idOrdenEntrega,
        idODistribucion,
        idUsuarioCreacion,
        idEmpresa,
        idSucursal,
        observaciones: form.observacionesEncabezado.trim(),
        estatus: resolverEstatusIncidencia(idTipo),
        activo: true,
      });
      onGuardado?.(
        `Incidencia guardada para la entrega ${contexto.documento.entrega}.`,
      );
      onCerrar();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la incidencia.",
      );
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto || !contexto) return null;

  const { folioOrden, documento } = contexto;
  const idTipoSeleccionado = Number(form.idTipoIncidencia);
  const esTipoSinDetalle = idTipoSeleccionado === TIPO_INCIDENCIA_SIN_DETALLE;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-incidencia-titulo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="flex max-h-[94vh] w-full flex-col rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:max-h-[92vh] sm:max-w-5xl sm:rounded-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <div className="min-w-0">
            <h2
              id="modal-incidencia-titulo"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Crear incidencia
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Orden {folioOrden} · Entrega {documento.entrega}
            </p>
            <p className="truncate text-sm text-gray-700 dark:text-gray-300">
              {documento.cardName ?? "—"}
              {documento.cardCode ? ` (${documento.cardCode})` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 touch-manipulation"
            aria-label="Cerrar incidencia"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          )}

          <section className="rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/30">
            <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Encabezado
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <label className={labelClass}>Tipo incidencia</label>
                <select
                  className={inputClass}
                  value={form.idTipoIncidencia}
                  onChange={(e) => {
                    const value = e.target.value;
                    const idTipo = Number(value);
                    setForm((prev) => ({
                      ...prev,
                      idTipoIncidencia: value,
                      lineas:
                        idTipo === TIPO_INCIDENCIA_SIN_DETALLE ? [] : prev.lineas,
                    }));
                  }}
                  disabled={loadingTipos}
                >
                  <option value="">
                    {loadingTipos ? "Cargando..." : "Seleccione tipo"}
                  </option>
                  {tiposIncidencia.map((tipo) => (
                    <option
                      key={tipo.idTipoIncidencia}
                      value={tipo.idTipoIncidencia}
                    >
                      {tipo.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Observaciones</label>
                <textarea
                  className={`${inputClass} min-h-[88px] resize-y`}
                  value={form.observacionesEncabezado}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      observacionesEncabezado: e.target.value,
                    }))
                  }
                  placeholder="Observaciones generales de la incidencia"
                  rows={3}
                />
              </div>
            </div>
          </section>

          <section className="mt-4">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Detalle de artículos
              </h3>
              <button
                type="button"
                onClick={agregarLinea}
                disabled={esTipoSinDetalle}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50 touch-manipulation"
              >
                <Plus className="h-4 w-4" />
                Agregar artículo
              </button>
            </div>

            {form.lineas.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600">
                {esTipoSinDetalle
                  ? "Este tipo de incidencia no requiere detalle de artículos."
                  : 'No hay artículos. Use "Agregar artículo" para registrar el detalle.'}
              </p>
            ) : (
              <>
                <div className="space-y-3 md:hidden">
                  {form.lineas.map((linea, index) => (
                    <article
                      key={linea.idLocal}
                      className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900/40"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          Artículo #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => eliminarLinea(linea.idLocal)}
                          className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          aria-label="Eliminar artículo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-2">
                        <div>
                          <label className={labelClass}>Artículo</label>
                          <input
                            className={inputClass}
                            value={linea.articulo}
                            onChange={(e) =>
                              actualizarLinea(
                                linea.idLocal,
                                "articulo",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label className={labelClass}>Descripción</label>
                          <input
                            className={inputClass}
                            value={linea.descripcion}
                            onChange={(e) =>
                              actualizarLinea(
                                linea.idLocal,
                                "descripcion",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className={labelClass}>Cantidad</label>
                            <input
                              type="number"
                              min={1}
                              step={1}
                              className={inputClass}
                              value={linea.cantidad}
                              onChange={(e) =>
                                actualizarLinea(
                                  linea.idLocal,
                                  "cantidad",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Estado</label>
                            <select
                              className={inputClass}
                              value={linea.estado}
                              onChange={(e) =>
                                actualizarLinea(
                                  linea.idLocal,
                                  "estado",
                                  e.target.value,
                                )
                              }
                            >
                              {ESTADOS_ARTICULO_INCIDENCIA.map((estado) => (
                                <option key={estado} value={estado}>
                                  {estado}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className={labelClass}>Observaciones</label>
                          <input
                            className={inputClass}
                            value={linea.observaciones}
                            onChange={(e) =>
                              actualizarLinea(
                                linea.idLocal,
                                "observaciones",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                  <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="min-w-[120px] px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                          Artículo
                        </th>
                        <th className="min-w-[160px] px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                          Descripción
                        </th>
                        <th className="w-24 px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                          Cantidad
                        </th>
                        <th className="min-w-[120px] px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                          Estado
                        </th>
                        <th className="min-w-[140px] px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                          Observaciones
                        </th>
                        <th className="w-12 px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {form.lineas.map((linea) => (
                        <tr key={linea.idLocal}>
                          <td className="px-2 py-2">
                            <input
                              className={inputClass}
                              value={linea.articulo}
                              onChange={(e) =>
                                actualizarLinea(
                                  linea.idLocal,
                                  "articulo",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              className={inputClass}
                              value={linea.descripcion}
                              onChange={(e) =>
                                actualizarLinea(
                                  linea.idLocal,
                                  "descripcion",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={1}
                              step={1}
                              className={inputClass}
                              value={linea.cantidad}
                              onChange={(e) =>
                                actualizarLinea(
                                  linea.idLocal,
                                  "cantidad",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="px-2 py-2">
                            <select
                              className={inputClass}
                              value={linea.estado}
                              onChange={(e) =>
                                actualizarLinea(
                                  linea.idLocal,
                                  "estado",
                                  e.target.value,
                                )
                              }
                            >
                              {ESTADOS_ARTICULO_INCIDENCIA.map((estado) => (
                                <option key={estado} value={estado}>
                                  {estado}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-2">
                            <input
                              className={inputClass}
                              value={linea.observaciones}
                              onChange={(e) =>
                                actualizarLinea(
                                  linea.idLocal,
                                  "observaciones",
                                  e.target.value,
                                )
                              }
                            />
                          </td>
                          <td className="px-2 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => eliminarLinea(linea.idLocal)}
                              className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                              aria-label="Eliminar artículo"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 px-4 py-3 sm:flex-row sm:justify-end dark:border-gray-700">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 touch-manipulation"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleGuardar()}
            disabled={guardando || loadingTipos}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 touch-manipulation"
          >
            {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar incidencia
          </button>
        </div>
      </div>
    </div>
  );
}
