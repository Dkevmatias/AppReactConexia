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
import { useAuth } from "../../hooks/useAuth";

const inputClass =
  "w-full min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white touch-manipulation";

const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

const btnPrimaryClass =
  "inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 touch-manipulation";

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

  const [modalIncidenciaAbierto, setModalIncidenciaAbierto] = useState(false);

  const [contextoIncidencia, setContextoIncidencia] =
    useState<ContextoIncidenciaDistribucion | null>(null);

  const [mensajeIncidencia, setMensajeIncidencia] = useState<string | null>(
    null,
  );

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

    setModalIncidenciaAbierto(false);

    setContextoIncidencia(null);
  }, []);

  const abrirModalIncidencia = useCallback(
    (documento: DocODistribucionDetalle) => {
      if (!folioSeleccionado) return;

      setContextoIncidencia({
        folioOrden: folioSeleccionado,

        documento,
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

      setAviso("Indique repartidor ");

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
        const rutasData = await rutasService.getRutas();

        setRutas((rutasData ?? []).filter((r) => r.activo));
      } catch (err) {
        console.error(err);

        setError("No se pudieron cargar las rutas.");
      } finally {
        setLoadingCatalogos(false);
      }
    };

    void cargarCatalogos();
  }, []);

  useEffect(() => {
    void cargarDocumentos();
  }, [cargarDocumentos]);

  return (
    <>
      <PageMeta
        title="Comprobación de Rutas"
        description="Consulta de documentos de distribución por repartidor y ruta"
      />

      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
          Comprobación de Rutas
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Consulta de documentos por repartidor, ruta y fechas. Optimizado para
          uso en celular y escritorio.
        </p>
      </div>

      <div className="mb-4 space-y-3 rounded-xl border border-gray-200 bg-white p-3 sm:space-y-0 sm:p-4 lg:grid lg:grid-cols-5 lg:gap-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="lg:col-span-1">
          <label className={labelClass}>Repartidor</label>

          <input
            type="text"
            className={inputClass}
            value={repartidor}
            onChange={(e) => setRepartidor(e.target.value)}
            placeholder="Ej. RTX03"
            autoComplete="off"
            enterKeyHint="search"
          />
        </div>

        <div className="lg:col-span-1">
          <label className={labelClass}>Ruta</label>

          <select
            className={inputClass}
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

        <div className="grid grid-cols-2 gap-3 lg:col-span-2 lg:grid-cols-2 lg:gap-4">
          <div>
            <label className={labelClass}>Fecha desde</label>

            <input
              type="date"
              className={inputClass}
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
            />
          </div>

          <div>
            <label className={labelClass}>Fecha hasta</label>

            <input
              type="date"
              className={inputClass}
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
            />
          </div>
        </div>

        <div className="lg:col-span-1 lg:flex lg:items-end">
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
          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
            {documentos.length} documento(s) encontrado(s). Doble clic en una
            fila (escritorio) o toque en móvil para ver el detalle.
          </p>

          <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Estatus Sistema:
            </span>

            <span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                T
              </span>
              : Sin Incidencias
            </span>

            <span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                P
              </span>
              : Pendiente
            </span>

            <span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                I
              </span>
              : Con Incidencia
            </span>
          </div>
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
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {documentos.map((doc, index) => (
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
                  {documentos.map((doc, index) => (
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

      <ModalDetalleOrdenDistribucion
        abierto={modalDetalleAbierto}
        folio={folioSeleccionado}
        estatusSistema={estatusSSeleccionado}
        incidenciaModalAbierto={modalIncidenciaAbierto}
        mensajeExito={mensajeIncidencia}
        idUsuarioCreacion={user?.idPersona ?? null}
        idEmpresa={contextoOperativo?.idEmpresa ?? null}
        idSucursal={contextoOperativo?.idSucursal ?? null}
        onCerrar={cerrarModalDetalle}
        onCrearIncidencia={abrirModalIncidencia}
        onMensajeExitoChange={setMensajeIncidencia}
        onEstatusSistemaChange={actualizarEstatusSistemaOrden}
      />

      <ModalIncidenciaDistribucion
        abierto={modalIncidenciaAbierto}
        contexto={contextoIncidencia}
        idUsuarioCreacion={user?.idPersona ?? null}
        idEmpresa={contextoOperativo?.idEmpresa ?? null}
        idSucursal={contextoOperativo?.idSucursal ?? null}
        onCerrar={cerrarModalIncidencia}
        onGuardado={setMensajeIncidencia}
      />
    </>
  );
}
