import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { DocODistribucionDetalle } from "../../services/oDistribucionService";
import {
  esIncidenciaFinalizada,
  etiquetaEstadoItem,
  etiquetaEstatusIncidencia,
  EstadoItem,
  IncidenciaCompleta,
  incidenciaService,
  resolverEstatusIncidencia,
  TIPO_INCIDENCIA_SIN_DETALLE,
  tipoIncidenciaConDetalleArticulos,
  TipoIncidencia,
  valorEstadoItem,
} from "../../services/incidenciaService";
import {
  ItemEntrega,
  itemEntregaService,
} from "../../services/itemEntregaService";

const inputClass =
  "box-border w-full max-w-full min-w-0 min-h-[44px] rounded-lg border border-gray-300 bg-white px-2.5 py-2 text-base sm:min-h-[40px] sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white touch-manipulation";
const selectClass = `${inputClass} appearance-auto truncate`;
const inputReadonlyClass = `${inputClass} cursor-default bg-gray-100 dark:bg-gray-800`;
const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

function formDesdeIncidencia(incidencia: IncidenciaCompleta) {
  return {
    idTipoIncidencia: String(incidencia.idTipoIncidencia),
    observacionesEncabezado: incidencia.observaciones,
    lineas: incidencia.detalles.map((detalle, index) => ({
      idLocal: `ver-${incidencia.idIncidencia}-${index}`,
      articulo: detalle.itemCode,
      descripcion: detalle.itemName,
      cantidad: String(detalle.cantidad > 0 ? detalle.cantidad : 1),
      idEstado: detalle.idEstado > 0 ? String(detalle.idEstado) : "",
      observaciones: detalle.observaciones,
    })),
  };
}

function solucionDesdeIncidencia(incidencia: IncidenciaCompleta): string {
  const textos = incidencia.detalles
    .map((detalle) => (detalle.solucion ?? "").trim())
    .filter(Boolean);
  if (textos.length === 0) return "";
  return [...new Set(textos)][0] ?? "";
}

export type ModoModalIncidencia = "crear" | "ver";

export type ContextoIncidenciaDistribucion = {
  folioOrden: number;
  documento: DocODistribucionDetalle;
  modo?: ModoModalIncidencia;
  idIncidencia?: number;
};

type LineaDetalleIncidencia = {
  idLocal: string;
  articulo: string;
  descripcion: string;
  cantidad: string;
  idEstado: string;
  observaciones: string;
};

function nuevaLineaDetalle(idEstadoDefault = ""): LineaDetalleIncidencia {
  return {
    idLocal: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    articulo: "",
    descripcion: "",
    cantidad: "1",
    idEstado: idEstadoDefault,
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

function itemsDisponiblesParaLinea(
  lineaId: string,
  itemsEntrega: ItemEntrega[],
  lineas: LineaDetalleIncidencia[],
): ItemEntrega[] {
  const usadosEnOtrasFilas = new Set(
    lineas
      .filter((linea) => linea.idLocal !== lineaId && linea.articulo.trim())
      .map((linea) => linea.articulo),
  );
  return itemsEntrega.filter((item) => !usadosEnOtrasFilas.has(item.item));
}

function itemsDisponiblesNuevaLinea(
  itemsEntrega: ItemEntrega[],
  lineas: LineaDetalleIncidencia[],
): ItemEntrega[] {
  const usados = new Set(
    lineas
      .filter((linea) => linea.articulo.trim())
      .map((linea) => linea.articulo),
  );
  return itemsEntrega.filter((item) => !usados.has(item.item));
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
  const [estadosArticulo, setEstadosArticulo] = useState<EstadoItem[]>([]);
  const [itemsEntrega, setItemsEntrega] = useState<ItemEntrega[]>([]);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [loadingIncidencia, setLoadingIncidencia] = useState(false);
  const [incidenciaVer, setIncidenciaVer] = useState<IncidenciaCompleta | null>(
    null,
  );
  const [solucionTexto, setSolucionTexto] = useState("");
  const [guardandoSolucion, setGuardandoSolucion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(formularioVacio());

  const modoVer = contexto?.modo === "ver";
  const solucionSoloLectura =
    modoVer && esIncidenciaFinalizada(incidenciaVer?.estatus);

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

  const cargarEstadosArticulo = useCallback(async () => {
    setLoadingEstados(true);
    try {
      const estados = await incidenciaService.getEstadosItemsActivos();
      setEstadosArticulo(estados);
    } catch (err) {
      console.error(err);
      setEstadosArticulo([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los estados de artículo.",
      );
    } finally {
      setLoadingEstados(false);
    }
  }, []);

  const cargarItemsEntrega = useCallback(async (idOrdenEntrega: number) => {
    setLoadingItems(true);
    try {
      const items = await itemEntregaService.getByOrdenEntrega(idOrdenEntrega);
      setItemsEntrega(items);
    } catch (err) {
      console.error(err);
      setItemsEntrega([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los artículos de la entrega.",
      );
    } finally {
      setLoadingItems(false);
    }
  }, []);

  const cargarIncidenciaParaVer = useCallback(async (idIncidencia: number) => {
    setLoadingIncidencia(true);
    setError(null);
    setIncidenciaVer(null);
    setSolucionTexto("");
    setForm(formularioVacio());
    try {
      const incidencia = await incidenciaService.getById(idIncidencia);
      setIncidenciaVer(incidencia);
      setForm(formDesdeIncidencia(incidencia));
      setSolucionTexto(solucionDesdeIncidencia(incidencia));
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la incidencia.",
      );
    } finally {
      setLoadingIncidencia(false);
    }
  }, []);

  useEffect(() => {
    if (!abierto || !contexto) return;

    void cargarEstadosArticulo();

    if (contexto.modo === "ver" && contexto.idIncidencia) {
      setItemsEntrega([]);
      void cargarIncidenciaParaVer(contexto.idIncidencia);
      return;
    }

    setIncidenciaVer(null);
    setSolucionTexto("");
    setForm(formularioVacio());
    setItemsEntrega([]);
    setError(null);
    void cargarTipos();
    const idOrdenEntrega = contexto.documento.entrega;
    if (idOrdenEntrega && idOrdenEntrega > 0) {
      void cargarItemsEntrega(idOrdenEntrega);
    }
  }, [
    abierto,
    contexto?.folioOrden,
    contexto?.documento.entrega,
    contexto?.modo,
    contexto?.idIncidencia,
    cargarTipos,
    cargarEstadosArticulo,
    cargarItemsEntrega,
    cargarIncidenciaParaVer,
  ]);

  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onCerrar]);

  const agregarLinea = () => {
    if (itemsDisponiblesNuevaLinea(itemsEntrega, form.lineas).length === 0)
      return;
    const idEstadoDefault =
      estadosArticulo.length > 0 ? valorEstadoItem(estadosArticulo[0]) : "";
    setForm((prev) => ({
      ...prev,
      lineas: [...prev.lineas, nuevaLineaDetalle(idEstadoDefault)],
    }));
  };

  const seleccionarArticuloLinea = (idLocal: string, itemCode: string) => {
    const item = itemsEntrega.find((row) => row.item === itemCode);
    setForm((prev) => ({
      ...prev,
      lineas: prev.lineas.map((linea) =>
        linea.idLocal === idLocal
          ? {
              ...linea,
              articulo: itemCode,
              descripcion: item?.descripcion ?? "",
            }
          : linea,
      ),
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
    if (!contexto || modoVer) return;
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
      contexto.documento.entrega || contexto.documento.documento;
    if (!idOrdenEntrega || idOrdenEntrega <= 0) {
      setError("La entrega seleccionada no tiene un identificador válido.");
      return;
    }
    const idODistribucion = contexto.documento.folio || contexto.folioOrden;
    if (!idODistribucion || idODistribucion <= 0) {
      setError("La orden de distribución no tiene un folio válido.");
      return;
    }

    const esTipoConDetalle = tipoIncidenciaConDetalleArticulos(idTipo);

    if (esTipoConDetalle) {
      if (form.lineas.length === 0) {
        setError("Agregue al menos un artículo al detalle.");
        return;
      }
      for (const [index, linea] of form.lineas.entries()) {
        if (!linea.articulo.trim()) {
          setError(`Seleccione el artículo en la fila ${index + 1}.`);
          return;
        }
        const cantidad = Number(linea.cantidad);
        if (!Number.isFinite(cantidad) || cantidad <= 0) {
          setError(`Cantidad inválida en la fila ${index + 1}.`);
          return;
        }
        const idEstado = Number(linea.idEstado);
        if (!Number.isFinite(idEstado) || idEstado <= 0) {
          setError(`Seleccione el estado en la fila ${index + 1}.`);
          return;
        }
      }
    }

    const estatusIncidencia = resolverEstatusIncidencia();
    const vendedor = contexto.documento.slpName?.trim() ?? "";

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
        estatus: estatusIncidencia,
        activo: true,
        detalles: esTipoConDetalle
          ? form.lineas.map((linea) => ({
              idOrdenEntrega,
              itemCode: linea.articulo.trim(),
              itemName: linea.descripcion.trim(),
              cantidad: Number(linea.cantidad),
              idEstado: Number(linea.idEstado),
              vendedor,
              observaciones: linea.observaciones.trim(),
              estatus: estatusIncidencia,
              activo: true,
            }))
          : undefined,
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

  const handleGuardarSolucion = async () => {
    if (!modoVer || !incidenciaVer) return;
    if (solucionSoloLectura) {
      setError(
        "La incidencia ya está finalizada; no se puede modificar la solución.",
      );
      return;
    }
    const texto = solucionTexto.trim();
    if (!texto) {
      setError("Capture el detalle de la solución.");
      return;
    }

    setGuardandoSolucion(true);
    setError(null);
    try {
      const idsIncidenciaDetalle = incidenciaVer.detalles
        .map((detalle) => detalle.idIncidenciaDetalle)
        .filter((id): id is number => id != null && id > 0);

      await incidenciaService.actualizarSolucion({
        idIncidencia: incidenciaVer.idIncidencia,
        solucion: texto,
        idsIncidenciaDetalle:
          idsIncidenciaDetalle.length > 0 ? idsIncidenciaDetalle : undefined,
      });

      setIncidenciaVer((prev) =>
        prev
          ? {
              ...prev,
              detalles: prev.detalles.map((detalle) => ({
                ...detalle,
                solucion: texto,
              })),
            }
          : prev,
      );
      onGuardado?.(
        `Solución guardada para la incidencia ${incidenciaVer.idIncidencia}.`,
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar el detalle de la solución.",
      );
    } finally {
      setGuardandoSolucion(false);
    }
  };

  if (!abierto || !contexto) return null;

  const { folioOrden, documento } = contexto;
  const idTipoSeleccionado = Number(form.idTipoIncidencia);
  const esTipoConDetalle =
    tipoIncidenciaConDetalleArticulos(idTipoSeleccionado);
  const puedeAgregarArticulo =
    !modoVer &&
    esTipoConDetalle &&
    !loadingItems &&
    itemsDisponiblesNuevaLinea(itemsEntrega, form.lineas).length > 0;

  const renderCampoArticulo = (linea: LineaDetalleIncidencia) => {
    if (modoVer || !esTipoConDetalle) {
      return (
        <input className={inputReadonlyClass} value={linea.articulo} readOnly />
      );
    }

    const opciones = itemsDisponiblesParaLinea(
      linea.idLocal,
      itemsEntrega,
      form.lineas,
    );

    return (
      <div className="min-w-0 max-w-full overflow-hidden">
        <select
          className={selectClass}
          value={linea.articulo}
          onChange={(e) =>
            seleccionarArticuloLinea(linea.idLocal, e.target.value)
          }
          disabled={loadingItems || opciones.length === 0}
        >
          <option value="">
            {loadingItems ? "Cargando artículos..." : "Seleccione artículo"}
          </option>
          {opciones.map((item) => (
            <option key={item.item} value={item.item}>
              {item.item}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderCampoEstado = (linea: LineaDetalleIncidencia) => {
    if (modoVer) {
      return (
        <input
          className={inputReadonlyClass}
          value={etiquetaEstadoItem(linea.idEstado, estadosArticulo)}
          readOnly
        />
      );
    }

    return (
      <div className="min-w-0 max-w-full overflow-hidden">
        <select
          className={selectClass}
          value={linea.idEstado}
          onChange={(e) =>
            actualizarLinea(linea.idLocal, "idEstado", e.target.value)
          }
          disabled={loadingEstados || estadosArticulo.length === 0}
        >
          <option value="">
            {loadingEstados ? "Cargando..." : "Seleccione estado"}
          </option>
          {estadosArticulo.map((estado) => (
            <option key={estado.idEstado} value={valorEstadoItem(estado)}>
              {estado.nombre}
            </option>
          ))}
        </select>
      </div>
    );
  };

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
      <div className="flex max-h-[94vh] w-full max-w-full flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:max-h-[92vh] sm:max-w-5xl sm:rounded-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <div className="min-w-0 flex-1 overflow-hidden">
            <h2
              id="modal-incidencia-titulo"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              {modoVer ? "Ver incidencia" : "Crear incidencia"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Orden {folioOrden} · Entrega {documento.entrega}
              {modoVer && contexto.idIncidencia
                ? ` · Folio ${contexto.idIncidencia}`
                : ""}
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

        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          {loadingIncidencia ? (
            <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando incidencia...
            </div>
          ) : (
            <>
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
                  <div className="min-w-0 max-w-full sm:col-span-1">
                    <label className={labelClass}>Tipo incidencia</label>
                    {modoVer ? (
                      <input
                        className={inputReadonlyClass}
                        value={incidenciaVer?.tipoIncidencia ?? "—"}
                        readOnly
                      />
                    ) : (
                      <div className="min-w-0 max-w-full overflow-hidden">
                        <select
                          className={selectClass}
                          value={form.idTipoIncidencia}
                          onChange={(e) => {
                            const value = e.target.value;
                            const idTipo = Number(value);
                            setForm((prev) => ({
                              ...prev,
                              idTipoIncidencia: value,
                              lineas:
                                idTipo === TIPO_INCIDENCIA_SIN_DETALLE ||
                                !tipoIncidenciaConDetalleArticulos(idTipo)
                                  ? []
                                  : prev.lineas,
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
                    )}
                  </div>
                  {modoVer && (
                    <div className="min-w-0 max-w-full sm:col-span-1">
                      <label className={labelClass}>Estatus</label>
                      <input
                        className={inputReadonlyClass}
                        value={etiquetaEstatusIncidencia(
                          incidenciaVer?.estatus,
                        )}
                        readOnly
                      />
                    </div>
                  )}
                  <div className="min-w-0 max-w-full sm:col-span-2">
                    <label className={labelClass}>Observaciones</label>
                    <textarea
                      className={`${modoVer ? inputReadonlyClass : inputClass} min-h-[88px] resize-y`}
                      value={form.observacionesEncabezado}
                      readOnly={modoVer}
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
                  {!modoVer && (
                    <button
                      type="button"
                      onClick={agregarLinea}
                      disabled={!puedeAgregarArticulo}
                      className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50 touch-manipulation"
                    >
                      <Plus className="h-4 w-4" />
                      Agregar artículo
                    </button>
                  )}
                </div>

                {esTipoConDetalle && !modoVer && loadingItems && (
                  <p className="mb-3 flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando artículos de la entrega...
                  </p>
                )}

                {esTipoConDetalle &&
                  !modoVer &&
                  !loadingItems &&
                  itemsEntrega.length === 0 && (
                    <p className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                      No hay artículos disponibles para esta orden de entrega.
                    </p>
                  )}

                {form.lineas.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600">
                    {!esTipoConDetalle
                      ? "Este tipo de incidencia no requiere detalle de artículos."
                      : modoVer
                        ? "Sin artículos registrados en el detalle."
                        : 'No hay artículos. Use "Agregar artículo" para registrar el detalle.'}
                  </p>
                ) : (
                  <>
                    <div className="space-y-3 md:hidden">
                      {form.lineas.map((linea, index) => (
                        <article
                          key={linea.idLocal}
                          className="min-w-0 max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900/40"
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">
                              Artículo #{index + 1}
                            </span>
                            {!modoVer && (
                              <button
                                type="button"
                                onClick={() => eliminarLinea(linea.idLocal)}
                                className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                aria-label="Eliminar artículo"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid min-w-0 gap-2">
                            <div className="min-w-0 max-w-full">
                              <label className={labelClass}>Artículo</label>
                              {(esTipoConDetalle || modoVer) &&
                                renderCampoArticulo(linea)}
                            </div>
                            <div className="min-w-0 max-w-full">
                              <label className={labelClass}>Descripción</label>
                              <input
                                className={
                                  modoVer || esTipoConDetalle
                                    ? inputReadonlyClass
                                    : inputClass
                                }
                                value={linea.descripcion}
                                readOnly={modoVer || esTipoConDetalle}
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
                                  className={
                                    modoVer ? inputReadonlyClass : inputClass
                                  }
                                  value={linea.cantidad}
                                  readOnly={modoVer}
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
                                {renderCampoEstado(linea)}
                              </div>
                            </div>
                            <div>
                              <label className={labelClass}>
                                Observaciones
                              </label>
                              <input
                                className={
                                  modoVer ? inputReadonlyClass : inputClass
                                }
                                value={linea.observaciones}
                                readOnly={modoVer}
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
                            {!modoVer && <th className="w-12 px-2 py-2" />}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {form.lineas.map((linea) => (
                            <tr key={linea.idLocal}>
                              <td className="px-2 py-2">
                                {(esTipoConDetalle || modoVer) &&
                                  renderCampoArticulo(linea)}
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  className={
                                    modoVer || esTipoConDetalle
                                      ? inputReadonlyClass
                                      : inputClass
                                  }
                                  value={linea.descripcion}
                                  readOnly={modoVer || esTipoConDetalle}
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
                                  className={
                                    modoVer ? inputReadonlyClass : inputClass
                                  }
                                  value={linea.cantidad}
                                  readOnly={modoVer}
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
                                {renderCampoEstado(linea)}
                              </td>
                              <td className="px-2 py-2">
                                <input
                                  className={
                                    modoVer ? inputReadonlyClass : inputClass
                                  }
                                  value={linea.observaciones}
                                  readOnly={modoVer}
                                  onChange={(e) =>
                                    actualizarLinea(
                                      linea.idLocal,
                                      "observaciones",
                                      e.target.value,
                                    )
                                  }
                                />
                              </td>
                              {!modoVer && (
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
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </section>

              {modoVer ? (
                <section className="mt-4 rounded-xl border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-700 dark:bg-gray-900/30">
                  <h3 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Detalle de la solución
                  </h3>
                  <label className={labelClass} htmlFor="detalle-solucion">
                    ¿Cómo se solventó?
                  </label>
                  <textarea
                    id="detalle-solucion"
                    className={`${solucionSoloLectura ? inputReadonlyClass : inputClass} min-h-[120px] resize-y`}
                    value={solucionTexto}
                    readOnly={solucionSoloLectura}
                    onChange={(e) => setSolucionTexto(e.target.value)}
                    placeholder="Describa cómo se resolvió la incidencia..."
                    rows={4}
                  />
                  {solucionSoloLectura ? (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      La incidencia está finalizada; la solución es solo
                      lectura.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Se actualizará la columna Solución del detalle de la
                      incidencia.
                    </p>
                  )}
                </section>
              ) : null}
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 px-4 py-3 sm:flex-row sm:justify-end dark:border-gray-700">
          {modoVer ? (
            <>
              <button
                type="button"
                onClick={onCerrar}
                disabled={guardandoSolucion}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 touch-manipulation"
              >
                Cerrar
              </button>
              {!solucionSoloLectura ? (
                <button
                  type="button"
                  onClick={() => void handleGuardarSolucion()}
                  disabled={guardandoSolucion || loadingIncidencia}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 touch-manipulation"
                >
                  {guardandoSolucion ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Guardar solución
                </button>
              ) : null}
            </>
          ) : (
            <>
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
                {guardando ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Guardar incidencia
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
