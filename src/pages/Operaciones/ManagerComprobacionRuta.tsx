import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import {
  ModalIncidenciaDistribucion,
  formatearFecha,
  type ContextoIncidenciaDistribucion,
} from "../../components/ComprobacionRuta";
import { useAuth } from "../../hooks/useAuth";
import {
  ContextoOperativoPersona,
  getContextoOperativoPersona,
} from "../../services/authService";
import {
  IncidenciaCompleta,
  incidenciaService,
} from "../../services/incidenciaService";
import { DocODistribucionDetalle } from "../../services/oDistribucionService";

const btnPrimaryClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 touch-manipulation";

const inputClass =
  "w-full min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white touch-manipulation";

const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

const btnSecondaryClass =
  "inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 touch-manipulation";

type FilaIncidenciaManager = {
  key: string;
  idIncidencia: number;
  idODistribucion: number;
  idOrdenEntrega: number;
  nombreTipoIncidencia: string;
  fechaCreacion: string;
  fechaCierre: string;
  nombreUsuarioCreacion: string;
  itemCode: string;
  itemName: string;
  estatus: string;
};

function formatearFechaIncidencia(
  valor: string | null | undefined,
): string {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return formatearFecha(valor);
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function aFilas(incidencias: IncidenciaCompleta[]): FilaIncidenciaManager[] {
  const filas: FilaIncidenciaManager[] = [];

  for (const incidencia of incidencias) {
    const base = {
      idIncidencia: incidencia.idIncidencia,
      idODistribucion: incidencia.idODistribucion,
      idOrdenEntrega: incidencia.idOrdenEntrega,
      nombreTipoIncidencia: incidencia.tipoIncidencia || "—",
      fechaCreacion: formatearFechaIncidencia(incidencia.fechaCreacion),
      fechaCierre: formatearFechaIncidencia(incidencia.fechaCierre),
      nombreUsuarioCreacion: incidencia.nombreUsuarioCreacion?.trim() || "—",
      estatus: incidencia.estatus || "—",
    };

    if (incidencia.detalles.length === 0) {
      filas.push({
        ...base,
        key: `${incidencia.idIncidencia}-sin-detalle`,
        itemCode: "—",
        itemName: "—",
      });
      continue;
    }

    for (const [index, detalle] of incidencia.detalles.entries()) {
      filas.push({
        ...base,
        key: `${incidencia.idIncidencia}-${detalle.itemCode}-${index}`,
        itemCode: detalle.itemCode || "—",
        itemName: detalle.itemName || "—",
      });
    }
  }

  return filas;
}

function documentoStubDesdeIncidencia(
  incidencia: Pick<
    IncidenciaCompleta,
    "idIncidencia" | "idODistribucion" | "idOrdenEntrega"
  >,
): DocODistribucionDetalle {
  return {
    sociedad: null,
    tipoOD: null,
    tipoRegistro: null,
    folio: incidencia.idODistribucion,
    entrega: incidencia.idOrdenEntrega,
    documento: incidencia.idOrdenEntrega,
    facturaReserva: null,
    facturaDeudor: null,
    origenFactura: null,
    devolucionEntrega: null,
    tienePago: null,
    efectivo: 0,
    transferencia: 0,
    otros: 0,
    numTraspaso: null,
    tieneDevolucion: null,
    tieneIncidencia: "S",
    idIncidencia: incidencia.idIncidencia,
    cantidadIncidencias: 1,
    idsIncidencia: [incidencia.idIncidencia],
    cardCode: null,
    cardName: null,
    fechaDoc: null,
    total: 0,
    slpName: null,
    vehiculo: null,
    condicion: null,
    tipoCliente: null,
  };
}

export default function ManagerComprobacionRuta() {
  const { user } = useAuth();
  const [contextoOperativo, setContextoOperativo] =
    useState<ContextoOperativoPersona | null>(null);
  const [incidencias, setIncidencias] = useState<IncidenciaCompleta[]>([]);
  const [loadingContexto, setLoadingContexto] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalIncidenciaAbierto, setModalIncidenciaAbierto] = useState(false);
  const [contextoIncidencia, setContextoIncidencia] =
    useState<ContextoIncidenciaDistribucion | null>(null);
  const [filtroFolioOd, setFiltroFolioOd] = useState("");
  const [filtroOrdenEntrega, setFiltroOrdenEntrega] = useState("");

  const filas = useMemo(() => aFilas(incidencias), [incidencias]);

  const filasFiltradas = useMemo(() => {
    const folioOd = filtroFolioOd.trim();
    const ordenEntrega = filtroOrdenEntrega.trim();

    return filas.filter((fila) => {
      if (folioOd && !String(fila.idODistribucion).includes(folioOd)) {
        return false;
      }
      if (ordenEntrega && !String(fila.idOrdenEntrega).includes(ordenEntrega)) {
        return false;
      }
      return true;
    });
  }, [filas, filtroFolioOd, filtroOrdenEntrega]);

  const hayFiltrosActivos =
    filtroFolioOd.trim().length > 0 || filtroOrdenEntrega.trim().length > 0;

  const limpiarFiltros = useCallback(() => {
    setFiltroFolioOd("");
    setFiltroOrdenEntrega("");
  }, []);

  useEffect(() => {
    if (!user?.idPersona) {
      setContextoOperativo(null);
      setLoadingContexto(false);
      return;
    }

    let cancelled = false;
    setLoadingContexto(true);

    void (async () => {
      try {
        const ctx = await getContextoOperativoPersona(user.idPersona);
        if (!cancelled) setContextoOperativo(ctx);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setContextoOperativo(null);
          setError("No se pudo cargar el contexto operativo (sucursal).");
        }
      } finally {
        if (!cancelled) setLoadingContexto(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.idPersona]);

  const cargarIncidencias = useCallback(async () => {
    const idSucursal = contextoOperativo?.idSucursal ?? 0;
    if (!idSucursal || idSucursal <= 0) {
      setIncidencias([]);
      setError(
        loadingContexto
          ? null
          : "No se encontró la sucursal del usuario para consultar incidencias.",
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const lista = await incidenciaService.getBySucursal(idSucursal, true);
      setIncidencias(lista);
    } catch (err) {
      console.error(err);
      setIncidencias([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las incidencias de la sucursal.",
      );
    } finally {
      setLoading(false);
    }
  }, [contextoOperativo?.idSucursal, loadingContexto]);

  useEffect(() => {
    if (loadingContexto) return;
    void cargarIncidencias();
  }, [loadingContexto, cargarIncidencias]);

  const abrirVerIncidencia = useCallback(
    (idIncidencia: number) => {
      if (!idIncidencia || idIncidencia <= 0) return;

      const incidencia = incidencias.find(
        (item) => item.idIncidencia === idIncidencia,
      );
      if (!incidencia) return;

      setContextoIncidencia({
        folioOrden: incidencia.idODistribucion,
        documento: documentoStubDesdeIncidencia(incidencia),
        modo: "ver",
        idIncidencia: incidencia.idIncidencia,
      });
      setModalIncidenciaAbierto(true);
    },
    [incidencias],
  );

  const cerrarModalIncidencia = useCallback(() => {
    setModalIncidenciaAbierto(false);
    setContextoIncidencia(null);
  }, []);

  return (
    <>
      <PageMeta
        title="Manager Comprobación de Ruta"
        description="Incidencias de la sucursal para revisión de comprobación de rutas"
      />

      <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white">
            Listado de Incidencias
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Incidencias activas de la sucursal
            {contextoOperativo?.sucursal
              ? ` · ${contextoOperativo.sucursal}`
              : contextoOperativo?.idSucursal
                ? ` · #${contextoOperativo.idSucursal}`
                : ""}
            .
          </p>
        </div>

        <button
          type="button"
          className={btnPrimaryClass}
          onClick={() => void cargarIncidencias()}
          disabled={loading || loadingContexto}
        >
          {loading || loadingContexto ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Actualizar
        </button>
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="mb-4 space-y-3 rounded-xl border border-gray-200 bg-white p-3 sm:space-y-0 sm:p-4 lg:grid lg:grid-cols-4 lg:items-end lg:gap-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="lg:col-span-1">
          <label className={labelClass} htmlFor="filtro-folio-od">
            Folio OD
          </label>
          <input
            id="filtro-folio-od"
            type="search"
            inputMode="numeric"
            className={inputClass}
            value={filtroFolioOd}
            onChange={(e) => setFiltroFolioOd(e.target.value)}
            placeholder="Ej. 16917"
            autoComplete="off"
          />
        </div>
        <div className="lg:col-span-1">
          <label className={labelClass} htmlFor="filtro-orden-entrega">
            Orden de entrega
          </label>
          <input
            id="filtro-orden-entrega"
            type="search"
            inputMode="numeric"
            className={inputClass}
            value={filtroOrdenEntrega}
            onChange={(e) => setFiltroOrdenEntrega(e.target.value)}
            placeholder="Ej. 1058131"
            autoComplete="off"
          />
        </div>
        <div className="lg:col-span-2 lg:flex lg:justify-end">
          <button
            type="button"
            className={`${btnSecondaryClass} w-full lg:w-auto`}
            onClick={limpiarFiltros}
            disabled={!hayFiltrosActivos}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
        <span className="font-medium text-gray-700 dark:text-gray-300">
          Seguimiento:
        </span>
        <span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            P
          </span>
          : Pendiente de Revisión
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          · Doble clic (escritorio) o toque (móvil) para ver la incidencia
        </span>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {loading || loadingContexto ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando incidencias...
          </div>
        ) : filas.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">
            No hay incidencias activas para esta sucursal.
          </p>
        ) : filasFiltradas.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">
            No hay coincidencias con los filtros aplicados.
          </p>
        ) : (
          <>
            <div className="space-y-3 p-3 md:hidden">
              {filasFiltradas.map((fila) => (
                <article
                  key={fila.key}
                  role="button"
                  tabIndex={0}
                  onClick={() => abrirVerIncidencia(fila.idIncidencia)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      abrirVerIncidencia(fila.idIncidencia);
                    }
                  }}
                  className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50 p-3 transition hover:border-violet-300 hover:bg-violet-50/60 dark:border-gray-600 dark:bg-gray-900/40 dark:hover:border-violet-700 dark:hover:bg-violet-950/20"
                >
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Folio OD
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {fila.idODistribucion || "—"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Orden entrega
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {fila.idOrdenEntrega || "—"}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-gray-500 dark:text-gray-400">
                        Tipo incidencia
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {fila.nombreTipoIncidencia}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Fecha creación
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {fila.fechaCreacion}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Fecha cierre
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {fila.fechaCierre}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-gray-500 dark:text-gray-400">
                        Usuario creación
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {fila.nombreUsuarioCreacion}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Item code
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {fila.itemCode}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-gray-400">
                        Estatus
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {fila.estatus}
                      </dd>
                    </div>
                    <div className="col-span-2">
                      <dt className="text-gray-500 dark:text-gray-400">
                        Artículo
                      </dt>
                      <dd className="font-medium text-gray-900 dark:text-white">
                        {fila.itemName}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Folio OD
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Orden entrega
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Tipo incidencia
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Fecha creación
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Usuario creación
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Item code
                    </th>
                    <th className="min-w-[220px] px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Artículo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Fecha cierre
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-300">
                      Estatus
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filasFiltradas.map((fila) => (
                    <tr
                      key={fila.key}
                      onDoubleClick={() =>
                        abrirVerIncidencia(fila.idIncidencia)
                      }
                      title="Doble clic para ver la incidencia"
                      className="cursor-pointer hover:bg-violet-50/70 dark:hover:bg-violet-950/20"
                    >
                      <td className="whitespace-nowrap px-4 py-2 font-medium">
                        {fila.idODistribucion || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {fila.idOrdenEntrega || "—"}
                      </td>
                      <td className="px-4 py-2">{fila.nombreTipoIncidencia}</td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {fila.fechaCreacion}
                      </td>
                      <td className="px-4 py-2">
                        {fila.nombreUsuarioCreacion}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2 font-medium">
                        {fila.itemCode}
                      </td>
                      <td className="px-4 py-2">{fila.itemName}</td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {fila.fechaCierre}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2">
                        {fila.estatus}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 px-4 py-3 text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
              {filasFiltradas.length} fila(s) mostrada(s)
              {hayFiltrosActivos ? ` de ${filas.length}` : ""} ·{" "}
              {incidencias.length} incidencia(s)
            </div>
          </>
        )}
      </div>

      <ModalIncidenciaDistribucion
        abierto={modalIncidenciaAbierto}
        contexto={contextoIncidencia}
        idUsuarioCreacion={user?.idUsuario ?? null}
        idEmpresa={contextoOperativo?.idEmpresa ?? null}
        idSucursal={contextoOperativo?.idSucursal ?? null}
        onCerrar={cerrarModalIncidencia}
      />
    </>
  );
}
