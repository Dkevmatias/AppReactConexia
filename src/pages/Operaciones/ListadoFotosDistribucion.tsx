import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Printer, RefreshCw, X } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import FotoDepositoThumb from "../../components/ComprobacionRuta/FotoDepositoThumb";
import { formatearFecha } from "../../components/ComprobacionRuta";
import { useAuth } from "../../hooks/useAuth";
import { useComprobacionPermisos } from "../../hooks/useComprobacionPermisos";
import { useListadoOperacionesPermisos } from "../../hooks/useListadoOperacionesPermisos";
import {
  ContextoOperativoPersona,
  getContextoOperativoPersona,
} from "../../services/authService";
import {
  incidenciaDepositoService,
  type RelacionFotosODistribucion,
} from "../../services/incidenciaDepositoService";
import {
  bitacoraCobranzaService,
  type Sucursal,
} from "../../services/bitacoraCobranzaService";
import { empresaVisibleEnCombo } from "../../utils/sucursalOperativa";
import { formatCurrency, formatNumber } from "../../utils/format";

const inputClass =
  "w-full min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-base sm:text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white touch-manipulation";

const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

const btnPrimaryClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 touch-manipulation";

const btnSecondaryClass =
  "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 touch-manipulation";

function fechasDefault() {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return {
    fechaInicio: `${y}-${m}-01`,
    fechaFin: `${y}-${m}-${d}`,
  };
}

function formatearFechaHora(valor: string | null | undefined): string {
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

export default function ListadoFotosDistribucion() {
  const { user } = useAuth();
  const { puedeVerTotales } = useComprobacionPermisos();
  const { menuLoading, puedeVerSucursalIncidencia } =
    useListadoOperacionesPermisos();
  const defaults = useMemo(() => fechasDefault(), []);

  const [fechaInicio, setFechaInicio] = useState(defaults.fechaInicio);
  const [fechaFin, setFechaFin] = useState(defaults.fechaFin);
  const [filtroFolio, setFiltroFolio] = useState("");
  const [filtroSucursal, setFiltroSucursal] = useState<number | "">("");
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [contextoOperativo, setContextoOperativo] =
    useState<ContextoOperativoPersona | null>(null);
  const [loadingContexto, setLoadingContexto] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filas, setFilas] = useState<RelacionFotosODistribucion[]>([]);
  const [vistaFoto, setVistaFoto] = useState<{
    folio: number;
    id: number;
  } | null>(null);

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

  useEffect(() => {
    if (menuLoading || !puedeVerSucursalIncidencia) {
      setSucursales([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const lista = await bitacoraCobranzaService.getSucursales();
        if (!cancelled) {
          setSucursales(
            (lista ?? []).filter((s) => empresaVisibleEnCombo(s.idEmpresa)),
          );
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) setSucursales([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [menuLoading, puedeVerSucursalIncidencia]);

  const cargar = useCallback(async () => {
    const idSucursalUsuario = contextoOperativo?.idSucursal ?? 0;
    const idSucursalConsulta = puedeVerSucursalIncidencia
      ? filtroSucursal
        ? Number(filtroSucursal)
        : null
      : idSucursalUsuario;

    if (!puedeVerSucursalIncidencia) {
      if (!idSucursalConsulta || idSucursalConsulta <= 0) {
        setFilas([]);
        setError(
          loadingContexto
            ? null
            : "No se encontró la sucursal del usuario para consultar las fotos.",
        );
        return;
      }
    }

    if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
      setError("La fecha inicio no puede ser mayor que la fecha fin.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const lista = await incidenciaDepositoService.listarRelacion({
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
        idSucursal: idSucursalConsulta,
      });
      setFilas(lista);
    } catch (err) {
      console.error(err);
      setFilas([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la relación de fotos.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    contextoOperativo?.idSucursal,
    fechaFin,
    fechaInicio,
    filtroSucursal,
    loadingContexto,
    puedeVerSucursalIncidencia,
  ]);

  useEffect(() => {
    if (loadingContexto || menuLoading) return;
    void cargar();
  }, [cargar, loadingContexto, menuLoading]);

  useEffect(() => {
    if (!vistaFoto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVistaFoto(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [vistaFoto]);

  const visibles = useMemo(() => {
    const q = filtroFolio.trim();
    if (!q) return filas;
    return filas.filter((f) => String(f.folio).includes(q));
  }, [filas, filtroFolio]);

  const resumen = useMemo(() => {
    const ordenes = visibles.length;
    const fotos = visibles.reduce((acc, r) => acc + (r.cantidadFotos || 0), 0);
    const efectivo = visibles.reduce((acc, r) => acc + (r.totalEfectivo || 0), 0);
    return { ordenes, fotos, efectivo };
  }, [visibles]);

  return (
    <div className="min-w-0 space-y-6">
      <PageMeta
        title="Fotos por orden de distribución"
        description="Relación de folios de distribución con fotos de depósito, sucursal y efectivo"
      />

      <h1 className="hidden text-xl font-bold text-gray-900 print:block">
        Fotos por orden de distribución
      </h1>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Fotos por orden de distribución
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Folio, sucursal, total de pagos en efectivo y fotos adjuntas a cada
            orden.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={visibles.length === 0 || loading}
          className={btnSecondaryClass}
        >
          <Printer className="h-4 w-4" />
          Imprimir listado
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void cargar();
        }}
        className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:grid-cols-2 lg:grid-cols-5 print:hidden"
      >
        <div>
          <label className={labelClass} htmlFor="fotos-od-fecha-inicio">
            Fecha inicio
          </label>
          <input
            id="fotos-od-fecha-inicio"
            type="date"
            className={inputClass}
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="fotos-od-fecha-fin">
            Fecha fin
          </label>
          <input
            id="fotos-od-fecha-fin"
            type="date"
            className={inputClass}
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="fotos-od-folio">
            Folio
          </label>
          <input
            id="fotos-od-folio"
            type="search"
            inputMode="numeric"
            placeholder="Buscar folio"
            className={inputClass}
            value={filtroFolio}
            onChange={(e) => setFiltroFolio(e.target.value)}
          />
        </div>
        {puedeVerSucursalIncidencia ? (
          <div>
            <label className={labelClass} htmlFor="fotos-od-sucursal">
              Sucursal
            </label>
            <select
              id="fotos-od-sucursal"
              className={inputClass}
              value={filtroSucursal}
              onChange={(e) =>
                setFiltroSucursal(e.target.value ? Number(e.target.value) : "")
              }
            >
              <option value="">Todas</option>
              {sucursales.map((s) => (
                <option key={s.idSucursal} value={s.idSucursal}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <p className={labelClass}>Sucursal</p>
            <p className="flex min-h-[44px] items-center text-sm text-gray-800 dark:text-gray-200">
              {contextoOperativo?.sucursal || "—"}
            </p>
          </div>
        )}
        <div className="flex items-end">
          <button type="submit" disabled={loading} className={`${btnPrimaryClass} w-full`}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Consultar
          </button>
        </div>
      </form>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200 print:hidden">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Órdenes</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
            {formatNumber(resumen.ordenes)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-xs text-gray-500 dark:text-gray-400">Fotos</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
            {formatNumber(resumen.fotos)}
          </p>
        </div>
        {puedeVerTotales ? (
          <div className="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total efectivo
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
              {formatCurrency(resumen.efectivo)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
        {loading || loadingContexto ? (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando relación de fotos…
          </div>
        ) : visibles.length === 0 ? (
          <p className="py-12 text-center text-sm text-gray-500">
            No hay órdenes con fotos para los filtros seleccionados.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {visibles.map((row) => (
              <article
                key={row.folio}
                className="break-inside-avoid p-4 sm:p-5"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Folio OD
                    </p>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {row.folio}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      Sucursal:{" "}
                      <span className="font-medium">
                        {row.sucursal?.trim() || "—"}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Última foto: {formatearFechaHora(row.fechaUltimaFoto)}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    {puedeVerTotales ? (
                      <>
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                          Total efectivo
                        </p>
                        <p className="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                          {formatCurrency(row.totalEfectivo)}
                        </p>
                      </>
                    ) : null}
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {row.cantidadFotos} foto
                      {row.cantidadFotos === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:max-w-md">
                  {row.fotos.map((foto, idx) => (
                    <FotoDepositoThumb
                      key={foto.idIncidenciaDeposito}
                      idIncidenciaDeposito={foto.idIncidenciaDeposito}
                      alt={`Foto ${idx + 1} del folio ${row.folio}`}
                      className="aspect-square rounded-lg border border-gray-200 dark:border-gray-600"
                      onClick={() =>
                        setVistaFoto({
                          folio: row.folio,
                          id: foto.idIncidenciaDeposito,
                        })
                      }
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {vistaFoto ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label={`Foto del folio ${vistaFoto.folio}`}
          onClick={() => setVistaFoto(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white p-3 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                Folio {vistaFoto.folio}
              </p>
              <button
                type="button"
                onClick={() => setVistaFoto(null)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <FotoDepositoThumb
              idIncidenciaDeposito={vistaFoto.id}
              alt={`Foto del folio ${vistaFoto.folio}`}
              fit="contain"
              className="h-[75vh] w-full rounded-lg bg-black"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
