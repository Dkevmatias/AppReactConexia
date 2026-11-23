import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { useReportesBiPermisos } from "../../../hooks/useReportesBiPermisos";
import {
  coincideVendedorSesion,
  useVendedorSesion,
} from "../../../hooks/useVendedorSesion";
import {
  getContextoOperativoPersona,
  type ContextoOperativoPersona,
} from "../../../services/authService";
import {
  getReportesService,
  type ClienteChurn,
  type SociedadEfectividad,
  type Vendedores,
} from "../../../services/reportesService";
import { formatCurrency, formatNumber } from "../../../utils/format";
import {
  ID_EMPRESA_CODIAL,
  ID_EMPRESA_CODIALUB,
  salesPersonCodeSegunEmpresa,
  vendedorPorIdUsuario,
  vendedorPorUsername,
} from "../../../components/CRM/prospectoFormUtils";
import TablaScroll from "../../../components/reportes/TablaScroll";

const SOCIEDADES: SociedadEfectividad[] = ["CODIALUB", "CODIAL"];

const DIAS_VISITA = [
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miércoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sábado" },
] as const;

const NOMBRE_DIA_VISITA: Record<string, string> = {
  "1": "Lunes",
  "2": "Martes",
  "3": "Miércoles",
  "4": "Jueves",
  "5": "Viernes",
  "6": "Sábado",
  "7": "Domingo",
};

function nombreDiaVisita(valor: string | number | null | undefined): string {
  const raw = String(valor ?? "").trim();
  if (!raw) return "";
  const clave = raw.replace(/^0+/, "") || "0";
  return NOMBRE_DIA_VISITA[clave] ?? raw;
}

function sociedadDesdeEmpresa(
  idEmpresa: number | null | undefined,
): SociedadEfectividad {
  return idEmpresa === 2 ? "CODIAL" : "CODIALUB";
}

function idEmpresaDesdeSociedad(
  sociedad: SociedadEfectividad | "",
): number {
  return sociedad === "CODIAL" ? ID_EMPRESA_CODIAL : ID_EMPRESA_CODIALUB;
}

function csvEscape(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function slpCodeDeVendedor(
  vendedor: Vendedores | null | undefined,
  sociedad: SociedadEfectividad | "",
): number {
  const code = Number(
    salesPersonCodeSegunEmpresa(vendedor, idEmpresaDesdeSociedad(sociedad)),
  );
  return Number.isFinite(code) && code > 0 ? code : 0;
}

function nombreDeVendedor(vendedor: Vendedores | null | undefined): string {
  return (vendedor?.nombre || vendedor?.slpName || "").trim();
}

function claseCategoria(categoria: string): string {
  const t = categoria.trim().toLowerCase();
  if (
    t.includes("alerta") ||
    t.includes("rojo") ||
    t.includes("inactivo") ||
    t.includes("churn")
  ) {
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
  }
  if (t.includes("vip") || t.includes("oro")) {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200";
  }
  if (t.includes("riesgo") || t.includes("amarillo")) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200";
  }
  return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
}

function esAlerta(categoria: string): boolean {
  const t = categoria.trim().toLowerCase();
  return (
    t.includes("alerta") ||
    t.includes("rojo") ||
    t.includes("inactivo")
  );
}

export default function ReportesCcvZero() {
  const { user } = useAuth();
  const { tieneAccesoCompleto } = useReportesBiPermisos();
  const vendedorSesion = useVendedorSesion();
  const restringirAVendedor = !tieneAccesoCompleto;

  const [sociedad, setSociedad] = useState<SociedadEfectividad>("CODIALUB");
  const [slpCode, setSlpCode] = useState<number | "">("");
  const [diaVisita, setDiaVisita] = useState("");
  const [segmento, setSegmento] = useState("");
  const [textoFiltro, setTextoFiltro] = useState("");
  const [vendedores, setVendedores] = useState<Vendedores[]>([]);
  const [loadingVendedores, setLoadingVendedores] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filas, setFilas] = useState<ClienteChurn[]>([]);
  const [consultado, setConsultado] = useState(false);
  const [contexto, setContexto] = useState<ContextoOperativoPersona | null>(
    null,
  );
  const [contextoListo, setContextoListo] = useState(false);

  const vendedoresOpciones = useMemo(() => {
    const activos = vendedores.filter((v) => v.activo !== false);
    if (!restringirAVendedor || !vendedorSesion.listo) return activos;
    const porUsuario = vendedorPorIdUsuario(
      activos,
      vendedorSesion.idUsuario,
    );
    const porUsername = vendedorPorUsername(activos, vendedorSesion.username);
    const coinciden = activos.filter(
      (v) =>
        (vendedorSesion.idUsuario > 0 &&
          (v.idUsuarioPrizma === vendedorSesion.idUsuario ||
            v.idUsuarioPrizma2 === vendedorSesion.idUsuario)) ||
        coincideVendedorSesion(v.slpName, vendedorSesion) ||
        coincideVendedorSesion(v.nombre, vendedorSesion),
    );
    const unico = porUsuario ?? porUsername ?? coinciden[0] ?? null;
    return unico ? [unico] : coinciden;
  }, [restringirAVendedor, vendedorSesion, vendedores]);

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
    const load = async () => {
      setLoadingVendedores(true);
      try {
        const lista = await getReportesService.getVendedoresPrizma();
        if (!cancelled) setVendedores(lista);
      } catch (err) {
        console.error(err);
        if (!cancelled) setVendedores([]);
      } finally {
        if (!cancelled) setLoadingVendedores(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!restringirAVendedor || vendedoresOpciones.length === 0) return;
    const code = slpCodeDeVendedor(vendedoresOpciones[0], sociedad);
    if (code > 0 && code !== slpCode) setSlpCode(code);
  }, [restringirAVendedor, vendedoresOpciones, sociedad, slpCode]);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReportesService.getClientesChurn({
        sociedad,
        slpCode: slpCode === "" ? null : slpCode,
        diaVisita: diaVisita || null,
      });
      setFilas(data);
      setConsultado(true);
    } catch (err) {
      console.error(err);
      setFilas([]);
      setConsultado(true);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el reporte CCV Zero.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contextoListo || loadingVendedores) return;
    if (restringirAVendedor && (!vendedorSesion.listo || slpCode === "")) {
      return;
    }
    void cargar();
    // Carga inicial con sociedad / vendedor de sesión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextoListo, loadingVendedores, vendedorSesion.listo]);

  const segmentos = useMemo(() => {
    const vistos = new Set<string>();
    for (const row of filas) {
      const valor = (row.categoriaSegmento ?? "").trim();
      if (valor) vistos.add(valor);
    }
    return [...vistos].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [filas]);

  useEffect(() => {
    if (segmento && !segmentos.includes(segmento)) setSegmento("");
  }, [segmento, segmentos]);

  const nombreVendedorPorSlp = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const v of vendedores) {
      const nombre = nombreDeVendedor(v);
      if (!nombre) continue;
      const codeUb = Number(v.salesPersonCode);
      const codeCodial = Number(v.salesPersonCode2);
      if (Number.isFinite(codeUb) && codeUb > 0) {
        mapa.set(`CODIALUB:${codeUb}`, nombre);
        if (!mapa.has(`:${codeUb}`)) mapa.set(`:${codeUb}`, nombre);
      }
      if (Number.isFinite(codeCodial) && codeCodial > 0) {
        mapa.set(`CODIAL:${codeCodial}`, nombre);
        if (!mapa.has(`:${codeCodial}`)) mapa.set(`:${codeCodial}`, nombre);
      }
    }
    return mapa;
  }, [vendedores]);

  const nombreVendedorDeFila = useCallback(
    (row: ClienteChurn): string => {
      const code = Number(row.slpCode);
      if (!Number.isFinite(code) || code <= 0) return "";
      const sociedadRow = (row.sociedad ?? "").trim().toUpperCase();
      return (
        nombreVendedorPorSlp.get(`${sociedadRow}:${code}`) ??
        nombreVendedorPorSlp.get(`:${code}`) ??
        ""
      );
    },
    [nombreVendedorPorSlp],
  );

  const visibles = useMemo(() => {
    const q = textoFiltro.trim().toLowerCase();
    const seg = segmento.trim().toLowerCase();
    return filas.filter((r) => {
      if (seg && (r.categoriaSegmento ?? "").trim().toLowerCase() !== seg) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        r.cardCode,
        r.cardName,
        r.categoriaSegmento,
        r.uDiaVisita,
        nombreDiaVisita(r.uDiaVisita),
        nombreVendedorDeFila(r),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [filas, textoFiltro, segmento, nombreVendedorDeFila]);

  const kpis = useMemo(() => {
    const total = visibles.length;
    const ventaAnual = visibles.reduce((acc, r) => acc + (r.ventaAnual || 0), 0);
    const diasPromedio =
      total > 0
        ? visibles.reduce((acc, r) => acc + (r.diasSinComprar || 0), 0) / total
        : 0;
    const alertas = visibles.filter((r) => esAlerta(r.categoriaSegmento)).length;
    return { total, ventaAnual, diasPromedio, alertas };
  }, [visibles]);

  const exportarCsv = () => {
    if (visibles.length === 0) return;
    const headers = [
      "Sociedad",
      "CardCode",
      "Cliente",
      "Vendedor",
      "Día visita",
      "Días sin comprar",
      "Compras anuales",
      "Venta anual",
      "Categoría",
    ];
    const lines = [
      headers.join(","),
      ...visibles.map((r) =>
        [
          r.sociedad,
          r.cardCode,
          r.cardName,
          nombreVendedorDeFila(r),
          nombreDiaVisita(r.uDiaVisita),
          r.diasSinComprar,
          r.comprasAnuales,
          r.ventaAnual,
          r.categoriaSegmento,
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
    a.download = `ccv_zero_${sociedad.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            CCV Zero
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Clientes churn: días sin comprar, venta anual y segmento.
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
          disabled={visibles.length === 0 || loading}
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
        <div className="w-full sm:w-44">
          <label
            htmlFor="ccv-sociedad"
            className="mb-1 block text-xs text-gray-500"
          >
            Sociedad
          </label>
          <select
            id="ccv-sociedad"
            value={sociedad}
            onChange={(e) => {
              const next = e.target.value as SociedadEfectividad;
              setSociedad(next);
              if (restringirAVendedor && vendedoresOpciones[0]) {
                const code = slpCodeDeVendedor(vendedoresOpciones[0], next);
                setSlpCode(code > 0 ? code : "");
              }
            }}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            {SOCIEDADES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-64">
          <label
            htmlFor="ccv-vendedor"
            className="mb-1 block text-xs text-gray-500"
          >
            Vendedor
          </label>
          <select
            id="ccv-vendedor"
            value={slpCode === "" ? "" : String(slpCode)}
            onChange={(e) =>
              setSlpCode(e.target.value ? Number(e.target.value) : "")
            }
            disabled={restringirAVendedor || loadingVendedores}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-60"
          >
            <option value="">Todos</option>
            {vendedoresOpciones.map((v) => {
              const code = slpCodeDeVendedor(v, sociedad);
              if (code <= 0) return null;
              return (
                <option key={`${v.idVendedor}-${code}`} value={code}>
                  {v.slpName || v.nombre}
                  {v.nombre && v.slpName ? ` — ${v.nombre}` : ""} ({code})
                </option>
              );
            })}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="ccv-dia"
            className="mb-1 block text-xs text-gray-500"
          >
            Día de visita
          </label>
          <select
            id="ccv-dia"
            value={diaVisita}
            onChange={(e) => setDiaVisita(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            {DIAS_VISITA.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:min-w-[16rem] sm:flex-1">
          <label
            htmlFor="ccv-segmento"
            className="mb-1 block text-xs text-gray-500"
          >
            Segmento
          </label>
          <select
            id="ccv-segmento"
            value={segmento}
            onChange={(e) => setSegmento(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            {segmentos.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-56">
          <label
            htmlFor="ccv-buscar"
            className="mb-1 block text-xs text-gray-500"
          >
            Buscar en resultados
          </label>
          <input
            id="ccv-buscar"
            type="search"
            value={textoFiltro}
            onChange={(e) => setTextoFiltro(e.target.value)}
            placeholder="Cliente, vendedor…"
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
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

      {consultado && !error ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Clientes", value: formatNumber(kpis.total) },
            { label: "Venta anual", value: formatCurrency(kpis.ventaAnual) },
            {
              label: "Días sin comprar (prom.)",
              value: formatNumber(Math.round(kpis.diasPromedio)),
            },
            { label: "Alertas / inactivos", value: formatNumber(kpis.alertas) },
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
                  Cliente
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Sociedad
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Vendedor
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Día visita
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  Días sin comprar
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  Compras año
                </th>
                <th className="px-3 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                  Venta anual
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                  Segmento
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading && visibles.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    Cargando CCV Zero…
                  </td>
                </tr>
              ) : visibles.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-3 py-8 text-center text-gray-500"
                  >
                    {consultado
                      ? "No hay clientes para los filtros seleccionados."
                      : "Consulte para ver el reporte."}
                  </td>
                </tr>
              ) : (
                visibles.map((row, idx) => (
                  <tr
                    key={`${row.sociedad}-${row.cardCode}-${idx}`}
                    className="hover:bg-gray-50 dark:hover:bg-gray-900/30"
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {row.cardName || "—"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {row.cardCode || ""}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {row.sociedad || "—"}
                    </td>
                    <td className="px-3 py-2">
                      {nombreVendedorDeFila(row) || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {nombreDiaVisita(row.uDiaVisita) || "—"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatNumber(row.diasSinComprar)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatNumber(row.comprasAnuales)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                      {formatCurrency(row.ventaAnual)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex max-w-[18rem] rounded-full px-2 py-0.5 text-xs font-medium ${claseCategoria(row.categoriaSegmento)}`}
                      >
                        {row.categoriaSegmento || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </TablaScroll>
      </div>
    </div>
  );
}
