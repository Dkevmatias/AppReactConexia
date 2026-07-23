import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import {
  DocumentoDistribucionCard,
  formatearFecha,
  ModalDetalleOrdenDistribucion,
  ModalIncidenciaDistribucion,
  type ContextoIncidenciaDistribucion,
} from "../../components/ComprobacionRuta";

import {
  DocODistribucionDetalle,
  fechaInputAFechaApi,
  filtrosODistribucionPorDefecto,
  ODistribucionDocumento,
  oDistribucionService,
} from "../../services/oDistribucionService";

import { rutasService, Ruta } from "../../services/rutasService";
import {
  ContextoOperativoPersona,
  getContextoOperativoPersona,
} from "../../services/authService";
import { getReportesService, Vendedores } from "../../services/reportesService";
import { useAuth } from "../../hooks/useAuth";

const inputClass =
  "box-border w-full max-w-full min-w-0 min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white touch-manipulation";

const selectClass = `${inputClass} appearance-auto truncate`;

const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

const btnPrimaryClass =
  "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 touch-manipulation";

const ESTATUS_SISTEMA_OPCIONES = [
  { value: "PDT", label: "Pendiente Sin Revisar" },
  { value: "R-AM", label: "Revisado por Almacen" },
  { value: "R-COD", label: "Revisado por Cobranza" },
  { value: "R-F", label: "Revisión Finalizada" },
] as const;

type EstatusSistemaFiltro = (typeof ESTATUS_SISTEMA_OPCIONES)[number]["value"];

const ESTATUS_SISTEMA_TODOS = new Set<EstatusSistemaFiltro>(
  ESTATUS_SISTEMA_OPCIONES.map((opcion) => opcion.value),
);

function normalizarEstatusSistema(
  estatusS: string | null | undefined,
): string {
  const valor = (estatusS ?? "").trim().toUpperCase();
  return valor || "PDT";
}

function documentoPasaFiltroEstatusSistema(
  doc: ODistribucionDocumento,
  filtroEstatus: Set<EstatusSistemaFiltro>,
): boolean {
  if (filtroEstatus.size === 0) return false;
  const estatus = normalizarEstatusSistema(doc.estatusS);
  return filtroEstatus.has(estatus as EstatusSistemaFiltro);
}

const FILTROS_STORAGE_KEY = "comprobacionRutas:filtros";

type FiltrosComprobacion = {
  repartidor: string;
  ruta: string;
  fechaDesde: string;
  fechaHasta: string;
};

function leerFiltrosGuardados(): FiltrosComprobacion | null {
  try {
    const raw = sessionStorage.getItem(FILTROS_STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<FiltrosComprobacion>;

    if (!parsed || typeof parsed !== "object") return null;

    return {
      repartidor:
        typeof parsed.repartidor === "string" ? parsed.repartidor : "",

      ruta: typeof parsed.ruta === "string" ? parsed.ruta : "",

      fechaDesde:
        typeof parsed.fechaDesde === "string"
          ? parsed.fechaDesde
          : filtrosODistribucionPorDefecto().fechaDesde,

      fechaHasta:
        typeof parsed.fechaHasta === "string"
          ? parsed.fechaHasta
          : filtrosODistribucionPorDefecto().fechaHasta,
    };
  } catch {
    return null;
  }
}

function guardarFiltros(filtros: FiltrosComprobacion): void {
  sessionStorage.setItem(FILTROS_STORAGE_KEY, JSON.stringify(filtros));
}

export default function ComprobacionRutas() {
  const { user } = useAuth();

  const defaults = useMemo(() => {
    return leerFiltrosGuardados() ?? filtrosODistribucionPorDefecto();
  }, []);

  const [repartidor, setRepartidor] = useState(defaults.repartidor);

  const [ruta, setRuta] = useState(defaults.ruta);

  const [fechaDesde, setFechaDesde] = useState(defaults.fechaDesde);

  const [fechaHasta, setFechaHasta] = useState(defaults.fechaHasta);

  const [rutas, setRutas] = useState<Ruta[]>([]);

  const [repartidores, setRepartidores] = useState<Vendedores[]>([]);

  const [documentos, setDocumentos] = useState<ODistribucionDocumento[]>([]);

  const [loading, setLoading] = useState(true);

  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [aviso, setAviso] = useState<string | null>(null);

  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const [folioSeleccionado, setFolioSeleccionado] = useState<number | null>(
    null,
  );

  const [estatusSSeleccionado, setEstatusSSeleccionado] = useState<
    string | null
  >(null);

  /** Ruta de la fila del listado (columna Ruta) para el PDF de corte. */
  const [rutaSeleccionada, setRutaSeleccionada] = useState<string | null>(null);

  const [modalIncidenciaAbierto, setModalIncidenciaAbierto] = useState(false);

  const [contextoIncidencia, setContextoIncidencia] =
    useState<ContextoIncidenciaDistribucion | null>(null);

  const [mensajeIncidencia, setMensajeIncidencia] = useState<string | null>(
    null,
  );

  const [detalleRefreshKey, setDetalleRefreshKey] = useState(0);

  const [filtroEstatusSistema, setFiltroEstatusSistema] = useState<
    Set<EstatusSistemaFiltro>
  >(() => new Set(ESTATUS_SISTEMA_TODOS));

  const [contextoOperativo, setContextoOperativo] =
    useState<ContextoOperativoPersona | null>(null);

  useEffect(() => {
    if (!user?.idPersona) {
      setContextoOperativo(null);

      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const ctx = await getContextoOperativoPersona(user.idPersona);

        if (!cancelled) setContextoOperativo(ctx);
      } catch (err) {
        console.error(err);

        if (!cancelled) setContextoOperativo(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.idPersona]);

  const cerrarModalDetalle = useCallback(() => {
    setModalDetalleAbierto(false);

    setFolioSeleccionado(null);

    setEstatusSSeleccionado(null);

    setRutaSeleccionada(null);

    setModalIncidenciaAbierto(false);

    setContextoIncidencia(null);

    setDetalleRefreshKey(0);
  }, []);

  const abrirModalIncidencia = useCallback(
    (documento: DocODistribucionDetalle) => {
      if (!folioSeleccionado) return;

      setContextoIncidencia({
        folioOrden: folioSeleccionado,

        documento,
        modo: "crear",
      });

      setModalIncidenciaAbierto(true);

      setMensajeIncidencia(null);
    },

    [folioSeleccionado],
  );

  const abrirVerIncidenciaCompleta = useCallback(
    (documento: DocODistribucionDetalle, idIncidencia: number) => {
      if (!folioSeleccionado) return;

      setContextoIncidencia({
        folioOrden: folioSeleccionado,
        documento,
        modo: "ver",
        idIncidencia,
      });

      setModalIncidenciaAbierto(true);
      setMensajeIncidencia(null);
    },
    [folioSeleccionado],
  );

  const cerrarModalIncidencia = useCallback(() => {
    setModalIncidenciaAbierto(false);

    setContextoIncidencia(null);
  }, []);

  const abrirDetalleOrden = useCallback((doc: ODistribucionDocumento) => {
    if (!doc.folio || doc.folio <= 0) return;

    setFolioSeleccionado(doc.folio);

    setEstatusSSeleccionado(doc.estatusS);

    setRutaSeleccionada((doc.ruta ?? "").trim() || null);

    setModalDetalleAbierto(true);

    setMensajeIncidencia(null);
  }, []);

  const actualizarEstatusSistemaOrden = useCallback(
    (estatus: string) => {
      setEstatusSSeleccionado(estatus);

      if (!folioSeleccionado) return;

      setDocumentos((prev) =>
        prev.map((doc) =>
          doc.folio === folioSeleccionado ? { ...doc, estatusS: estatus } : doc,
        ),
      );
    },
    [folioSeleccionado],
  );

  const cargarDocumentos = useCallback(async () => {
    const repartidorTrim = repartidor.trim();

    const rutaTrim = ruta.trim();

    if (!repartidorTrim) {
      setDocumentos([]);

      setError(null);

      setAviso("Seleccione un repartidor");

      setLoading(false);

      return;
    }

    setLoading(true);

    setError(null);

    setAviso(null);

    try {
      const filtros = {
        repartidor: repartidorTrim,

        ruta: rutaTrim,

        fechaDesde,

        fechaHasta,
      };

      const lista = await oDistribucionService.getDocumentos({
        repartidor: repartidorTrim,

        ruta: rutaTrim,

        fechaDesde: fechaInputAFechaApi(fechaDesde),

        fechaHasta: fechaInputAFechaApi(fechaHasta),
      });

      guardarFiltros(filtros);

      setDocumentos(lista);
    } catch (err) {
      console.error(err);

      setDocumentos([]);

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el listado de distribución.",
      );
    } finally {
      setLoading(false);
    }
  }, [repartidor, ruta, fechaDesde, fechaHasta]);

  useEffect(() => {
    const cargarCatalogos = async () => {
      setLoadingCatalogos(true);

      try {
        const [rutasData, repartidoresData] = await Promise.all([
          rutasService.getRutas(),
          getReportesService.getVendedoresReparto(true),
        ]);

        setRutas((rutasData ?? []).filter((r) => r.activo));
        setRepartidores(
          (repartidoresData ?? []).filter(
            (v) => v.activo && v.slpName.trim().length > 0,
          ),
        );
      } catch (err) {
        console.error(err);

        setError("No se pudieron cargar rutas o repartidores.");
      } finally {
        setLoadingCatalogos(false);
      }
    };

    void cargarCatalogos();
  }, []);

  useEffect(() => {
    if (loadingCatalogos || !repartidor) return;
    const existe = repartidores.some((v) => v.slpName === repartidor);
    if (!existe) setRepartidor("");
  }, [loadingCatalogos, repartidores, repartidor]);

  useEffect(() => {
    void cargarDocumentos();
  }, [cargarDocumentos]);

  const documentosFiltrados = useMemo(
    () =>
      documentos.filter((doc) =>
        documentoPasaFiltroEstatusSistema(doc, filtroEstatusSistema),
      ),
    [documentos, filtroEstatusSistema],
  );

  /** Nombre legible del repartidor (el filtro guarda slpName / código). */
  const nombreRepartidor = useMemo(() => {
    const codigo = repartidor.trim();
    if (!codigo) return "";
    const encontrado = repartidores.find((v) => v.slpName === codigo);
    const nombre = encontrado?.nombre?.trim() ?? "";
    return nombre || codigo;
  }, [repartidor, repartidores]);

  const toggleFiltroEstatusSistema = (value: EstatusSistemaFiltro) => {
    setFiltroEstatusSistema((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  return (
    <>
      <PageMeta
        title="Comprobación de Rutas"
        description="Consulta de documentos de distribución por repartidor y ruta"
      />

      <div className="w-full max-w-full min-w-0 overflow-x-hidden">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
          Comprobación de Rutas
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Consulta de documentos por repartidor, ruta y fechas. Optimizado para
          uso en celular y escritorio.
        </p>
      </div>

      <div className="mb-4 w-full max-w-full min-w-0 space-y-3 overflow-hidden rounded-xl border border-gray-200 bg-white p-3 sm:p-4 lg:grid lg:grid-cols-5 lg:gap-4 lg:space-y-0 dark:border-gray-700 dark:bg-gray-800">
        <div className="min-w-0 max-w-full lg:col-span-1">
          <label className={labelClass}>Repartidor</label>

          <select
            className={selectClass}
            value={repartidor}
            onChange={(e) => setRepartidor(e.target.value)}
            disabled={loadingCatalogos}
          >
            <option value="">Seleccione repartidor</option>
            {repartidores.map((v) => (
              <option key={v.idVendedor} value={v.slpName}>
                {v.slpName
                  ? `${v.slpName} — ${v.nombre}`
                  : v.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-0 max-w-full lg:col-span-1">
          <label className={labelClass}>Ruta</label>

          <select
            className={selectClass}
            value={ruta}
            onChange={(e) => setRuta(e.target.value)}
            disabled={loadingCatalogos}
          >
            <option value="">Seleccione ruta</option>

            {rutas.map((item) => (
              <option key={item.idRuta} value={item.codigo}>
                {item.codigo}
                {item.nombre ? ` — ${item.nombre}` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid min-w-0 max-w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2 lg:gap-4">
          <div className="min-w-0 max-w-full">
            <label className={labelClass}>Fecha desde</label>

            <input
              type="date"
              className={inputClass}
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>

          <div className="min-w-0 max-w-full">
            <label className={labelClass}>Fecha hasta</label>

            <input
              type="date"
              className={inputClass}
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
        </div>

        <div className="min-w-0 max-w-full lg:col-span-1 lg:flex lg:items-end">
          <button
            type="button"
            onClick={() => void cargarDocumentos()}
            disabled={loading || loadingCatalogos}
            className={btnPrimaryClass}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Buscar
          </button>
        </div>
      </div>

      {aviso && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {aviso}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      {!loading && documentos.length > 0 && (
        <>
          <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filtrar estatus sistema
              </label>
              <button
                type="button"
                onClick={() =>
                  setFiltroEstatusSistema(new Set(ESTATUS_SISTEMA_TODOS))
                }
                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                Marcar todos
              </button>
            </div>
            <div className="flex flex-wrap gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700 sm:gap-3">
              {ESTATUS_SISTEMA_OPCIONES.map(({ value, label }) => (
                <label
                  key={value}
                  className="inline-flex max-w-full items-center gap-2 text-sm text-gray-700 dark:text-gray-200"
                >
                  <input
                    type="checkbox"
                    checked={filtroEstatusSistema.has(value)}
                    onChange={() => toggleFiltroEstatusSistema(value)}
                    className="h-4 w-4 shrink-0 rounded border-gray-300"
                  />
                  <span className="min-w-0">
                    <span className="font-semibold">{value}</span>
                    <span className="hidden text-gray-500 sm:inline dark:text-gray-400">
                      {" "}
                      · {label}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            {documentosFiltrados.length} documento(s) mostrado(s)
            {documentosFiltrados.length !== documentos.length
              ? ` de ${documentos.length}`
              : ""}
            . Doble clic en una fila (escritorio) o toque en móvil para ver el
            detalle.
          </p>
        </>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando documentos...
          </div>
        ) : documentos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            No hay documentos para los filtros seleccionados.
          </p>
        ) : documentosFiltrados.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            No hay documentos con los estatus sistema seleccionados.
          </p>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {documentosFiltrados.map((doc, index) => (
                <DocumentoDistribucionCard
                  key={`${doc.folio}-${doc.fecha ?? ""}-${index}`}
                  doc={doc}
                  onAbrirDetalle={abrirDetalleOrden}
                />
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Sociedad
                    </th>

                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      O. Distribución
                    </th>

                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Fecha
                    </th>

                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Repartidor
                    </th>

                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Ruta
                    </th>

                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Vehículo
                    </th>

                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estatus Prizma
                    </th>

                    <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estatus Sistema
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {documentosFiltrados.map((doc, index) => (
                    <tr
                      key={`${doc.folio}-${doc.fecha ?? ""}-${index}`}
                      onDoubleClick={() => abrirDetalleOrden(doc)}
                      title="Doble clic para ver detalle"
                      className="cursor-pointer hover:bg-blue-50/60 dark:hover:bg-blue-900/20"
                    >
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                        {doc.sociedad ?? "—"}
                      </td>

                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                        {doc.folio}
                      </td>

                      <td className="whitespace-nowrap px-4 py-2">
                        {formatearFecha(doc.fecha)}
                      </td>

                      <td className="px-4 py-2">{doc.repartidor ?? "—"}</td>

                      <td className="px-4 py-2">{doc.ruta ?? "—"}</td>

                      <td className="px-4 py-2">{doc.vehiculo ?? "—"}</td>

                      <td className="px-4 py-2">{doc.estatus ?? "—"}</td>

                      <td className="px-4 py-2">{doc.estatusS ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      </div>

      <ModalDetalleOrdenDistribucion
        abierto={modalDetalleAbierto}
        folio={folioSeleccionado}
        estatusSistema={estatusSSeleccionado}
        ruta={rutaSeleccionada}
        repartidor={nombreRepartidor}
        incidenciaModalAbierto={modalIncidenciaAbierto}
        detalleRefreshKey={detalleRefreshKey}
        mensajeExito={mensajeIncidencia}
        idUsuarioCreacion={user?.idUsuario ?? null}
        idEmpresa={contextoOperativo?.idEmpresa ?? null}
        idSucursal={contextoOperativo?.idSucursal ?? null}
        onCerrar={cerrarModalDetalle}
        onCrearIncidencia={abrirModalIncidencia}
        onVerIncidenciaCompleta={abrirVerIncidenciaCompleta}
        onMensajeExitoChange={setMensajeIncidencia}
        onEstatusSistemaChange={actualizarEstatusSistemaOrden}
      />

      <ModalIncidenciaDistribucion
        abierto={modalIncidenciaAbierto}
        contexto={contextoIncidencia}
        idUsuarioCreacion={user?.idUsuario ?? null}
        idEmpresa={contextoOperativo?.idEmpresa ?? null}
        idSucursal={contextoOperativo?.idSucursal ?? null}
        onCerrar={cerrarModalIncidencia}
        onGuardado={(mensaje) => {
          setMensajeIncidencia(mensaje);
          setDetalleRefreshKey((key) => key + 1);
        }}
      />
    </>
  );
}
