import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw, Save, Search } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import TablaScroll from "../../components/reportes/TablaScroll";
import { useAuth } from "../../hooks/useAuth";
import {
  getContextoOperativoPersona,
  type ContextoOperativoPersona,
} from "../../services/authService";
import {
  getReportesService,
  type ControlFacturaGuardar,
  type ControlFacturaItem,
  type SociedadEfectividad,
} from "../../services/reportesService";
import { formatCurrency, formatNumber } from "../../utils/format";

const SOCIEDADES: SociedadEfectividad[] = ["CODIALUB", "CODIAL"];

function sociedadDesdeEmpresa(
  idEmpresa: number | null | undefined,
): SociedadEfectividad {
  return idEmpresa === 2 ? "CODIAL" : "CODIALUB";
}

function csvEscape(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
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

function opcionesUnicas(valores: string[]): string[] {
  return Array.from(new Set(valores.map((v) => v.trim()).filter(Boolean))).sort(
    (a, b) => a.localeCompare(b, "es"),
  );
}

function claveFila(row: ControlFacturaItem): string {
  return `${row.sociedad}::${row.docNum}`;
}

function fechaIso(valor: string | null | undefined): string {
  if (!valor?.trim()) return new Date().toISOString();
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return valor;
  return d.toISOString();
}

function toPayload(row: ControlFacturaItem): ControlFacturaGuardar {
  return {
    docNum: row.docNum,
    docDate: fechaIso(row.docDate),
    sociedad: row.sociedad,
    cardCode: row.cardCode,
    cardName: row.cardName,
    ruta: row.ruta,
    slpName: row.slpName,
    docTotal: row.docTotal,
    almacen: row.whsCode,
    validar: true,
  };
}

export default function ControlFacturas() {
  const { user } = useAuth();
  const defaults = useMemo(
    () => getReportesService.getFechasEfectividadDefault(),
    [],
  );
  const [fechaInicio, setFechaInicio] = useState(defaults.fechaInicio);
  const [fechaFin, setFechaFin] = useState(defaults.fechaFin);
  const [sociedad, setSociedad] = useState<SociedadEfectividad | "">("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroRuta, setFiltroRuta] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("");
  const [filtroAlmacen, setFiltroAlmacen] = useState("");
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [facturas, setFacturas] = useState<ControlFacturaItem[]>([]);
  const [seleccionadas, setSeleccionadas] = useState<Set<string>>(
    () => new Set(),
  );
  const [consultado, setConsultado] = useState(false);
  const [contexto, setContexto] = useState<ContextoOperativoPersona | null>(
    null,
  );
  const [contextoListo, setContextoListo] = useState(false);

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
    setExito(null);
    try {
      const data = await getReportesService.getControlFacturas({
        fechaInicio,
        fechaFin,
        sociedad: sociedad || null,
      });
      setFacturas(data.facturas);
      setSeleccionadas(new Set());
      setFiltroRuta("");
      setFiltroVendedor("");
      setFiltroAlmacen("");
      setConsultado(true);
    } catch (err) {
      console.error(err);
      setFacturas([]);
      setConsultado(true);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el control de facturas.",
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

  const rutas = useMemo(
    () => opcionesUnicas(facturas.map((f) => f.ruta)),
    [facturas],
  );
  const vendedores = useMemo(
    () => opcionesUnicas(facturas.map((f) => f.slpName)),
    [facturas],
  );
  const almacenes = useMemo(
    () => opcionesUnicas(facturas.map((f) => f.whsCode)),
    [facturas],
  );

  const filas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return facturas.filter((f) => {
      if (filtroRuta && f.ruta !== filtroRuta) return false;
      if (filtroVendedor && f.slpName !== filtroVendedor) return false;
      if (filtroAlmacen && f.whsCode !== filtroAlmacen) return false;
      if (!q) return true;
      const hay = [
        f.docNum,
        f.cardCode,
        f.cardName,
        f.ruta,
        f.slpName,
        f.whsCode,
        f.sociedad,
      ]
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [busqueda, facturas, filtroAlmacen, filtroRuta, filtroVendedor]);

  const totalImporte = useMemo(
    () => filas.reduce((acc, f) => acc + (f.docTotal ?? 0), 0),
    [filas],
  );
  const clientesUnicos = useMemo(
    () => new Set(filas.map((f) => f.cardCode).filter(Boolean)).size,
    [filas],
  );

  const clavesVisibles = useMemo(() => filas.map(claveFila), [filas]);
  const todasVisiblesSeleccionadas =
    clavesVisibles.length > 0 &&
    clavesVisibles.every((k) => seleccionadas.has(k));
  const algunasVisiblesSeleccionadas = clavesVisibles.some((k) =>
    seleccionadas.has(k),
  );

  const toggleFila = (row: ControlFacturaItem) => {
    const clave = claveFila(row);
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(clave)) next.delete(clave);
      else next.add(clave);
      return next;
    });
  };

  const toggleTodasVisibles = () => {
    setSeleccionadas((prev) => {
      const next = new Set(prev);
      if (todasVisiblesSeleccionadas) {
        for (const k of clavesVisibles) next.delete(k);
      } else {
        for (const k of clavesVisibles) next.add(k);
      }
      return next;
    });
  };

  const guardar = async () => {
    const pendientes = facturas.filter((f) => seleccionadas.has(claveFila(f)));
    if (pendientes.length === 0) {
      setError("Seleccione al menos una factura para validar.");
      return;
    }
    setGuardando(true);
    setError(null);
    setExito(null);
    try {
      await getReportesService.guardarControlFacturas(
        pendientes.map(toPayload),
      );
      setSeleccionadas(new Set());
      setExito(
        `Se guardaron ${pendientes.length} factura${
          pendientes.length === 1 ? "" : "s"
        }.`,
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron guardar las facturas seleccionadas.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const exportarCsv = () => {
    if (filas.length === 0) return;
    const headers = [
      "Sociedad",
      "Folio",
      "Fecha",
      "Código cliente",
      "Cliente",
      "Ruta",
      "Vendedor",
      "Almacén",
      "Total",
    ];
    const lines = [
      headers.join(","),
      ...filas.map((r) =>
        [
          r.sociedad,
          r.docNum,
          formatFechaCorta(r.docDate),
          r.cardCode,
          r.cardName,
          r.ruta,
          r.slpName,
          r.whsCode,
          r.docTotal,
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
    a.download = `control_facturas_${fechaInicio}_${fechaFin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageMeta
        title="Control de Facturas"
        description="Facturas emitidas por sociedad, ruta y vendedor"
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Control de Facturas
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Facturas emitidas en el periodo, por sociedad, ruta y vendedor.
          </p>
          {contexto?.empresa || contexto?.sucursal ? (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {contexto.empresa || sociedad}{" "}
              {contexto.sucursal ? `· ${contexto.sucursal}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={seleccionadas.size === 0 || guardando || loading}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className={`h-4 w-4 ${guardando ? "animate-pulse" : ""}`} />
            Guardar
            {seleccionadas.size > 0 ? ` (${seleccionadas.size})` : ""}
          </button>
          <button
            type="button"
            onClick={exportarCsv}
            disabled={filas.length === 0 || loading}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
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
            htmlFor="control-facturas-fecha-inicio"
            className="mb-1 block text-xs text-gray-500"
          >
            Fecha inicio
          </label>
          <input
            id="control-facturas-fecha-inicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-40">
          <label
            htmlFor="control-facturas-fecha-fin"
            className="mb-1 block text-xs text-gray-500"
          >
            Fecha fin
          </label>
          <input
            id="control-facturas-fecha-fin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="control-facturas-sociedad"
            className="mb-1 block text-xs text-gray-500"
          >
            Sociedad
          </label>
          <select
            id="control-facturas-sociedad"
            value={sociedad}
            onChange={(e) =>
              setSociedad(e.target.value as SociedadEfectividad | "")
            }
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
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Consultar
        </button>
      </form>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:min-w-[220px] sm:flex-1">
          <label
            htmlFor="control-facturas-buscar"
            className="mb-1 block text-xs text-gray-500"
          >
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="control-facturas-buscar"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Folio, cliente, ruta o vendedor"
              className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="control-facturas-ruta"
            className="mb-1 block text-xs text-gray-500"
          >
            Ruta
          </label>
          <select
            id="control-facturas-ruta"
            value={filtroRuta}
            onChange={(e) => setFiltroRuta(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todas</option>
            {rutas.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="control-facturas-vendedor"
            className="mb-1 block text-xs text-gray-500"
          >
            Vendedor
          </label>
          <select
            id="control-facturas-vendedor"
            value={filtroVendedor}
            onChange={(e) => setFiltroVendedor(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            {vendedores.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="control-facturas-almacen"
            className="mb-1 block text-xs text-gray-500"
          >
            Almacén
          </label>
          <select
            id="control-facturas-almacen"
            value={filtroAlmacen}
            onChange={(e) => setFiltroAlmacen(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            {almacenes.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Facturas", value: formatNumber(filas.length) },
          { label: "Importe", value: formatCurrency(totalImporte) },
          { label: "Clientes", value: formatNumber(clientesUnicos) },
          {
            label: "Consultadas",
            value: formatNumber(facturas.length),
          },
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

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </p>
      ) : null}
      {exito ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          {exito}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <TablaScroll>
          <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-3 py-2 text-center font-medium text-gray-600 dark:text-gray-300">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={todasVisiblesSeleccionadas}
                      ref={(el) => {
                        if (el) {
                          el.indeterminate =
                            algunasVisiblesSeleccionadas &&
                            !todasVisiblesSeleccionadas;
                        }
                      }}
                      onChange={toggleTodasVisibles}
                      disabled={filas.length === 0 || loading || guardando}
                      className="h-4 w-4 rounded border-gray-300"
                      aria-label="Seleccionar todas"
                    />
                    Validar
                  </label>
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Sociedad
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  Folio
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Fecha
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  CardCode
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Cliente
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Ruta
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Vendedor
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Almacén
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading && facturas.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    Cargando facturas…
                  </td>
                </tr>
              ) : filas.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    {consultado
                      ? "No hay facturas para los filtros seleccionados."
                      : "Consulte para ver el control de facturas."}
                  </td>
                </tr>
              ) : (
                filas.map((row, idx) => {
                  const clave = claveFila(row);
                  const marcada = seleccionadas.has(clave);
                  return (
                  <tr
                    key={`${clave}-${idx}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={marcada}
                        onChange={() => toggleFila(row)}
                        disabled={guardando}
                        className="h-4 w-4 rounded border-gray-300"
                        aria-label={`Validar folio ${row.docNum}`}
                      />
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {row.sociedad || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {row.docNum || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {formatFechaCorta(row.docDate)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {row.cardCode || "—"}
                    </td>
                    <td className="px-3 py-2">{row.cardName || "—"}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {row.ruta || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {row.slpName || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {row.whsCode || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatCurrency(row.docTotal)}
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
            {filas.length > 0 ? (
              <tfoot className="bg-gray-50 font-semibold dark:bg-gray-900/50">
                <tr>
                  <td className="px-3 py-2" colSpan={9}>
                    Totales · {formatNumber(filas.length)} factura
                    {filas.length === 1 ? "" : "s"}
                    {seleccionadas.size > 0
                      ? ` · ${seleccionadas.size} por validar`
                      : ""}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                    {formatCurrency(totalImporte)}
                  </td>
                </tr>
              </tfoot>
            ) : null}
          </table>
        </TablaScroll>
      </div>
    </div>
  );
}
