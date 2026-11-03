import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  getContextoOperativoPersona,
  type ContextoOperativoPersona,
} from "../../../services/authService";
import {
  getReportesService,
  type EfectividadPrimeraEntregaGrupo,
  type EfectividadPrimeraEntregaResult,
  type SociedadEfectividad,
  type TipoDocumentoEfectividad,
} from "../../../services/reportesService";
import { formatNumber } from "../../../utils/format";
import { empresaVisibleEnCombo } from "../../../utils/sucursalOperativa";
import {
  almacenService,
  agruparAlmacenesPorSucursal,
  type Almacen,
} from "../../../services/almacenService";
import TablaScroll from "../../../components/reportes/TablaScroll";

const TIPOS_DOCUMENTO: TipoDocumentoEfectividad[] = [
  "Factura de Reserva",
  "Orden de Venta",
];

const SOCIEDADES: SociedadEfectividad[] = ["CODIALUB", "CODIAL"];

function sociedadDesdeEmpresa(
  idEmpresa: number | null | undefined,
): SociedadEfectividad {
  return idEmpresa === 2 ? "CODIAL" : "CODIALUB";
}

function idEmpresaDesdeSociedad(
  sociedad: SociedadEfectividad | "",
): number | null {
  if (sociedad === "CODIALUB") return 1;
  if (sociedad === "CODIAL") return 2;
  return null;
}

function csvEscape(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function formatPct(value: number): string {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

function clasePct(value: number): string {
  if (value >= 85) {
    return "text-emerald-700 dark:text-emerald-300";
  }
  if (value >= 60) {
    return "text-amber-700 dark:text-amber-300";
  }
  return "text-red-700 dark:text-red-300";
}

function etiquetaAlmacen(row: EfectividadPrimeraEntregaGrupo): string {
  const name = (row.whsName ?? "").trim();
  const code = (row.whsCode ?? "").trim();
  if (name && code) return `${name} (${code})`;
  return name || code || "—";
}

function formatFechaCorta(iso: string | null | undefined): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function ReportesEfectividad() {
  const { user } = useAuth();
  const defaults = useMemo(
    () => getReportesService.getFechasEfectividadDefault(),
    [],
  );
  const [fechaInicio, setFechaInicio] = useState(defaults.fechaInicio);
  const [fechaFin, setFechaFin] = useState(defaults.fechaFin);
  const [sociedad, setSociedad] = useState<SociedadEfectividad | "">(
    "CODIALUB",
  );
  const [tipoDocumento, setTipoDocumento] = useState<
    TipoDocumentoEfectividad | ""
  >("");
  const [almacen, setAlmacen] = useState("");
  const [incluirDetalle, setIncluirDetalle] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] =
    useState<EfectividadPrimeraEntregaResult | null>(null);
  const [consultado, setConsultado] = useState(false);
  const [contexto, setContexto] = useState<ContextoOperativoPersona | null>(
    null,
  );
  const [contextoListo, setContextoListo] = useState(false);
  const [almacenesCatalogo, setAlmacenesCatalogo] = useState<Almacen[]>([]);

  const gruposAlmacen = useMemo(() => {
    const idEmpresa = idEmpresaDesdeSociedad(sociedad);
    const visibles = almacenesCatalogo.filter((a) => {
      if (!empresaVisibleEnCombo(a.idEmpresa)) return false;
      if (idEmpresa != null && a.idEmpresa !== idEmpresa) return false;
      return true;
    });
    return agruparAlmacenesPorSucursal(visibles);
  }, [almacenesCatalogo, sociedad]);

  useEffect(() => {
    let cancelled = false;
    const loadCtx = async () => {
      if (!user?.idPersona) {
        if (!cancelled) setContextoListo(true);
        return;
      }
      try {
        const ctx = await getContextoOperativoPersona(user.idPersona);
        if (!cancelled && ctx) {
          setContexto(ctx);
          setSociedad(sociedadDesdeEmpresa(ctx.idEmpresa));
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setContextoListo(true);
      }
    };
    void loadCtx();
    return () => {
      cancelled = true;
    };
  }, [user?.idPersona]);

  useEffect(() => {
    let cancelled = false;
    const loadAlmacenes = async () => {
      try {
        const lista = await almacenService.getAlmacenes(true);
        if (!cancelled) setAlmacenesCatalogo(lista);
      } catch (err) {
        console.error(err);
        if (!cancelled) setAlmacenesCatalogo([]);
      }
    };
    void loadAlmacenes();
    return () => {
      cancelled = true;
    };
  }, []);

  const cargar = async () => {
    if (!fechaInicio || !fechaFin) {
      setError("Indique fecha inicio y fecha fin.");
      return;
    }
    if (fechaInicio > fechaFin) {
      setError("La fecha inicio no puede ser mayor que la fecha fin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await getReportesService.getEfectividadPrimeraEntrega({
        fechaInicio,
        fechaFin,
        almacen: almacen || null,
        tipoDocumento: tipoDocumento || null,
        sociedad: sociedad || null,
        idEmpresa: idEmpresaDesdeSociedad(sociedad),
        detalle: incluirDetalle,
      });
      setResultado(data);
      setConsultado(true);
    } catch (err) {
      console.error(err);
      setResultado(null);
      setConsultado(true);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el reporte de Efectividad.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contextoListo) return;
    void cargar();
    // Carga inicial cuando ya hay sociedad del contexto
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextoListo]);

  const kpis = resultado?.kpis ?? [];
  const totales = resultado?.totales;
  const detalle = resultado?.detalle ?? [];

  const exportarCsv = () => {
    if (kpis.length === 0) return;
    const headers = [
      "Sociedad",
      "Tipo documento",
      "Almacén",
      "Nombre almacén",
      "Total documentos",
      "Completas a la 1ª",
      "OTIF",
      "Con desviación",
      "% Completa 1ª",
      "% OTIF",
    ];
    const filas = [...kpis];
    if (totales) filas.push(totales);
    const lines = [
      headers.join(","),
      ...filas.map((r) =>
        [
          r.sociedad,
          r.tipoDocumento,
          r.whsCode,
          r.whsName,
          r.totalDocumentos,
          r.completasALaPrimera,
          r.otif,
          r.conDesviacion,
          r.pctCompletaALaPrimera,
          r.pctOtif,
        ]
          .map(csvEscape)
          .join(","),
      ),
    ];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `efectividad_${fechaInicio}_${fechaFin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Efectividad
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Completas a la primera entrega y OTIF por almacén y tipo de
            documento.
          </p>
          {contexto?.empresa || contexto?.sucursal ? (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {contexto.empresa || sociedad}{" "}
              {contexto.sucursal ? `· ${contexto.sucursal}` : ""}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={kpis.length === 0 || loading}
          className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void cargar();
        }}
        className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="w-full sm:w-40">
          <label
            htmlFor="efectividad-fecha-inicio"
            className="mb-1 block text-xs text-gray-500"
          >
            Fecha inicio
          </label>
          <input
            id="efectividad-fecha-inicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-40">
          <label
            htmlFor="efectividad-fecha-fin"
            className="mb-1 block text-xs text-gray-500"
          >
            Fecha fin
          </label>
          <input
            id="efectividad-fecha-fin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="efectividad-sociedad"
            className="mb-1 block text-xs text-gray-500"
          >
            Sociedad
          </label>
          <select
            id="efectividad-sociedad"
            value={sociedad}
            onChange={(e) => {
              setSociedad(e.target.value as SociedadEfectividad | "");
              setAlmacen("");
            }}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todas</option>
            {SOCIEDADES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-52">
          <label
            htmlFor="efectividad-tipo"
            className="mb-1 block text-xs text-gray-500"
          >
            Tipo documento
          </label>
          <select
            id="efectividad-tipo"
            value={tipoDocumento}
            onChange={(e) =>
              setTipoDocumento(e.target.value as TipoDocumentoEfectividad | "")
            }
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            {TIPOS_DOCUMENTO.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-64">
          <label
            htmlFor="efectividad-almacen"
            className="mb-1 block text-xs text-gray-500"
          >
            Almacén
          </label>
          <select
            id="efectividad-almacen"
            value={almacen}
            onChange={(e) => setAlmacen(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            {gruposAlmacen.map((grupo) => (
              <optgroup key={grupo.idSucursal} label={grupo.etiqueta}>
                {grupo.almacenes.map((a) => (
                  <option key={a.idAlmacen || a.origen} value={a.origen}>
                    {a.origen}
                    {a.nombre ? ` · ${a.nombre}` : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <label className="inline-flex min-h-[40px] items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={incluirDetalle}
            onChange={(e) => setIncluirDetalle(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          Incluir detalle
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Consultar
        </button>
      </form>

      {totales ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
          {[
            {
              label: "Documentos",
              value: formatNumber(totales.totalDocumentos),
            },
            {
              label: "Completas 1ª",
              value: formatNumber(totales.completasALaPrimera),
            },
            { label: "OTIF", value: formatNumber(totales.otif) },
            {
              label: "Con desviación",
              value: formatNumber(totales.conDesviacion),
            },
            {
              label: "% Completa 1ª",
              value: formatPct(totales.pctCompletaALaPrimera),
            },
            { label: "% OTIF", value: formatPct(totales.pctOtif) },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
            >
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {kpi.label}
              </p>
              <p className="mt-1 text-lg font-semibold tabular-nums text-gray-900 dark:text-white">
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <TablaScroll>
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Sociedad
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Tipo documento
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Almacén
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  Total
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  Completas 1ª
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  OTIF
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  Desviación
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  % Completa
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  % OTIF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading && kpis.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    Cargando efectividad…
                  </td>
                </tr>
              ) : kpis.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    {consultado
                      ? "No hay datos para los filtros seleccionados."
                      : "Consulte para ver el reporte."}
                  </td>
                </tr>
              ) : (
                kpis.map((row, idx) => (
                  <tr
                    key={`${row.sociedad}-${row.tipoDocumento}-${row.whsCode}-${idx}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  >
                    <td className="whitespace-nowrap px-3 py-2">
                      {row.sociedad || "—"}
                    </td>
                    <td className="px-3 py-2">{row.tipoDocumento || "—"}</td>
                    <td className="px-3 py-2">{etiquetaAlmacen(row)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatNumber(row.totalDocumentos)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatNumber(row.completasALaPrimera)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatNumber(row.otif)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatNumber(row.conDesviacion)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums ${clasePct(row.pctCompletaALaPrimera)}`}
                    >
                      {formatPct(row.pctCompletaALaPrimera)}
                    </td>
                    <td
                      className={`whitespace-nowrap px-3 py-2 text-right font-medium tabular-nums ${clasePct(row.pctOtif)}`}
                    >
                      {formatPct(row.pctOtif)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {totales && kpis.length > 0 ? (
              <tfoot className="bg-gray-50 font-semibold dark:bg-gray-900/50">
                <tr>
                  <td className="px-3 py-2" colSpan={3}>
                    Totales
                    {totales.sociedad ? ` · ${totales.sociedad}` : ""}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                    {formatNumber(totales.totalDocumentos)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                    {formatNumber(totales.completasALaPrimera)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                    {formatNumber(totales.otif)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                    {formatNumber(totales.conDesviacion)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${clasePct(totales.pctCompletaALaPrimera)}`}
                  >
                    {formatPct(totales.pctCompletaALaPrimera)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${clasePct(totales.pctOtif)}`}
                  >
                    {formatPct(totales.pctOtif)}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </TablaScroll>
      </div>

      {incluirDetalle && detalle.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 dark:border-gray-700 dark:text-gray-200">
            Detalle ({formatNumber(detalle.length)} documentos)
          </div>
          <TablaScroll>
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Folio
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Tipo
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Cliente
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Almacén
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Fecha doc.
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Compromiso
                  </th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    1ª entrega
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                    Completa 1ª
                  </th>
                  <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                    OTIF
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {detalle.map((row, idx) => (
                  <tr
                    key={`${row.docEntryOrigen}-${row.folioOrigen}-${idx}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  >
                    <td className="whitespace-nowrap px-3 py-2 font-medium">
                      {row.folioOrigen || "—"}
                    </td>
                    <td className="px-3 py-2">{row.tipoDocumento || "—"}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {row.cardName || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.cardCode || ""}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {row.whsName || row.whsCode || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {formatFechaCorta(row.fechaDocumento)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {formatFechaCorta(row.fechaCompromiso)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {formatFechaCorta(row.fechaPrimeraEntrega)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.esCompletaALaPrimera === 1 ? "Sí" : "No"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.esOtif === 1 ? "Sí" : "No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TablaScroll>
        </div>
      ) : null}
    </div>
  );
}
