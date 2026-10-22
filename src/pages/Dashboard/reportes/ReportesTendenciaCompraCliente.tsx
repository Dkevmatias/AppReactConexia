import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Search, TrendingDown, TrendingUp } from "lucide-react";
import ReactApexChart from "react-apexcharts";
import BasicDatePicker from "../../../components/ui/datepicker/datepicker";
import TablaScroll from "../../../components/reportes/TablaScroll";
import {
  getReportesService,
  type TendenciaCompraCliente,
  type TendenciaCompraSerieMensual,
} from "../../../services/reportesService";
import {
  cotizadorService,
  type CotizadorClienteSapResumen,
} from "../../../services/cotizadorService";
import { formatCurrency, formatNumber, formatPercent } from "../../../utils/format";
import {
  ID_EMPRESA_CODIAL,
  ID_EMPRESA_CODIALUB,
  idEmpresaDescuentoDesdeDoc,
} from "../../../components/CRM/prospectoFormUtils";

const MESES = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

const COLOR_COMPRA = "#2563eb";
const COLOR_MAXIMO = "#16a34a";
const COLOR_PROMEDIO = "#eab308";
const COLOR_BAJA = "#dc2626";

function etiquetaMes(anio: number, mes: number): string {
  const nombre = MESES[mes - 1] ?? String(mes);
  return `${nombre} ${anio}`;
}

function roundMoney(valor: number): number {
  return Number((valor || 0).toFixed(2));
}

function anioMesDesdeIso(
  value?: string | null,
): { anio: number; mes: number } | null {
  const m = (value ?? "").trim().match(/^(\d{4})-(\d{2})/);
  if (!m) return null;
  const anio = Number(m[1]);
  const mes = Number(m[2]);
  if (!Number.isFinite(anio) || mes < 1 || mes > 12) return null;
  return { anio, mes };
}

function compararAnioMes(
  a: { anio: number; mes: number },
  b: { anio: number; mes: number },
): number {
  return a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes;
}

/** Completa meses del rango con 0 para que la línea caiga cuando no hubo compra. */
function completarSerieMensual(
  serie: TendenciaCompraSerieMensual[],
  fechaInicio?: string,
  fechaFin?: string,
): TendenciaCompraSerieMensual[] {
  const porMes = new Map<string, TendenciaCompraSerieMensual>();
  let inicio = anioMesDesdeIso(fechaInicio);
  let fin = anioMesDesdeIso(fechaFin);

  for (const punto of serie) {
    if (punto.anio <= 0 || punto.mes < 1 || punto.mes > 12) continue;
    porMes.set(`${punto.anio}-${punto.mes}`, punto);
    const am = { anio: punto.anio, mes: punto.mes };
    if (!inicio || compararAnioMes(am, inicio) < 0) inicio = am;
    if (!fin || compararAnioMes(am, fin) > 0) fin = am;
  }

  if (!inicio || !fin) return [];

  const completa: TendenciaCompraSerieMensual[] = [];
  let anio = inicio.anio;
  let mes = inicio.mes;
  while (anio < fin.anio || (anio === fin.anio && mes <= fin.mes)) {
    const existente = porMes.get(`${anio}-${mes}`);
    completa.push(
      existente ?? {
        anio,
        mes,
        lineTotal: 0,
        quantity: 0,
        documentos: 0,
      },
    );
    mes += 1;
    if (mes > 12) {
      mes = 1;
      anio += 1;
    }
  }
  return completa;
}

function colorVariacion(valor: number): string {
  if (valor > 0) return "text-green-600";
  if (valor < 0) return "text-red-600";
  return "text-gray-600 dark:text-gray-300";
}

function claseEtiqueta(etiqueta: string): string {
  const t = etiqueta.trim().toLowerCase();
  if (t.includes("sube") || t.includes("alta") || t.includes("crec")) {
    return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
  }
  if (t.includes("baja") || t.includes("cae") || t.includes("decre")) {
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
  }
  return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
}

function idEmpresaDesdeSociedad(sociedad?: string | null): number | null {
  const s = (sociedad ?? "").trim().toUpperCase();
  if (!s) return null;
  if (s.includes("CODIALUB") || s === "1") return ID_EMPRESA_CODIALUB;
  if (s.includes("CODIAL") || s === "2") return ID_EMPRESA_CODIAL;
  return null;
}

function idEmpresaDesdeCardCode(cardCode: string): number | null {
  return idEmpresaDescuentoDesdeDoc({ cardCode });
}

function idEmpresaDesdeCliente(
  cardCode: string,
  sociedad?: string | null,
): number {
  return (
    idEmpresaDesdeCardCode(cardCode) ??
    idEmpresaDesdeSociedad(sociedad) ??
    ID_EMPRESA_CODIALUB
  );
}

function esCardCodeSap(valor: string): boolean {
  return /^C[A-Z0-9]+$/i.test(valor.trim());
}

export default function ReportesTendenciaCompraCliente() {
  const defaults = useMemo(
    () => getReportesService.getFechasTendenciaDefault(),
    [],
  );
  const [textoCliente, setTextoCliente] = useState("");
  const [cardCode, setCardCode] = useState("");
  const [cardName, setCardName] = useState("");
  const [sugerencias, setSugerencias] = useState<CotizadorClienteSapResumen[]>(
    [],
  );
  const [buscandoCliente, setBuscandoCliente] = useState(false);
  const [idEmpresa, setIdEmpresa] = useState(ID_EMPRESA_CODIALUB);
  const [fechaInicio, setFechaInicio] = useState(defaults.fechaInicio);
  const [fechaFin, setFechaFin] = useState(defaults.fechaFin);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TendenciaCompraCliente | null>(null);

  const consultar = useCallback(async () => {
    const code = (cardCode || textoCliente).trim();
    if (!code) {
      setError("Indique el CardCode o busque un cliente.");
      return;
    }
    if (!esCardCodeSap(code)) {
      setError(
        "Seleccione un cliente de la lista o capture un CardCode (ej. C001825).",
      );
      return;
    }
    if (!fechaInicio || !fechaFin) {
      setError("Indique fecha inicio y fecha fin.");
      return;
    }
    const empresa =
      idEmpresa > 0
        ? idEmpresa
        : (idEmpresaDesdeCardCode(code) ?? ID_EMPRESA_CODIALUB);
    setLoading(true);
    setError(null);
    try {
      const resultado = await getReportesService.getTendenciaCompraCliente({
        cardCode: code,
        fechaInicio,
        fechaFin,
        idEmpresa: empresa,
      });
      setData(resultado);
      if (resultado.cardCode) {
        setCardCode(resultado.cardCode);
        setTextoCliente(resultado.cardCode);
      }
    } catch (err) {
      console.error(err);
      setData(null);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar la tendencia de compra.",
      );
    } finally {
      setLoading(false);
    }
  }, [cardCode, textoCliente, fechaInicio, fechaFin, idEmpresa]);

  useEffect(() => {
    const texto = textoCliente.trim();
    if (texto.length < 3) {
      setSugerencias([]);
      return;
    }
    if (
      cardCode &&
      texto.toUpperCase() === cardCode.trim().toUpperCase()
    ) {
      setSugerencias([]);
      return;
    }

    let cancelado = false;
    const timer = window.setTimeout(() => {
      setBuscandoCliente(true);
      void (async () => {
        try {
          const result = await cotizadorService.buscarDescuentosClientes({
            texto,
            top: 8,
          });
          if (!cancelado) setSugerencias(result.clientes);
        } catch {
          if (!cancelado) setSugerencias([]);
        } finally {
          if (!cancelado) setBuscandoCliente(false);
        }
      })();
    }, 350);

    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [textoCliente, cardCode]);

  const seleccionarCliente = (cliente: CotizadorClienteSapResumen) => {
    setCardCode(cliente.cardCode);
    setCardName(cliente.cardName);
    setTextoCliente(cliente.cardCode);
    setSugerencias([]);
    setIdEmpresa(idEmpresaDesdeCliente(cliente.cardCode, cliente.sociedad));
  };

  const serie = useMemo(
    () =>
      data
        ? completarSerieMensual(
            data.serieMensual,
            data.fechaInicio,
            data.fechaFin,
          )
        : [],
    [data],
  );
  const categorias = useMemo(
    () => serie.map((p) => etiquetaMes(p.anio, p.mes)),
    [serie],
  );
  const compras = useMemo(
    () => serie.map((p) => roundMoney(p.lineTotal)),
    [serie],
  );
  const niveles = useMemo(() => {
    if (compras.length === 0) return { maximo: 0, promedio: 0, baja: 0 };
    const maximo = Math.max(...compras);
    const conCompra = compras.filter((valor) => valor > 0);
    const baja = conCompra.length > 0 ? Math.min(...conCompra) : 0;
    const promedio = roundMoney(
      compras.reduce((suma, valor) => suma + valor, 0) / compras.length,
    );
    return { maximo, promedio, baja };
  }, [compras]);
  const seriesGrafica = useMemo(
    () => [
      { name: "Compra", data: compras },
      { name: "Máximo", data: compras.map(() => niveles.maximo) },
      { name: "Promedio", data: compras.map(() => niveles.promedio) },
      { name: "Más baja", data: compras.map(() => niveles.baja) },
    ],
    [compras, niveles],
  );
  const opcionesGrafica = useMemo(() => {
    const etiquetaEje = (v: number) =>
      formatCurrency(v).replace("MXN", "").trim();
    const lineaHorizontal = (
      y: number,
      color: string,
      texto: string,
      offsetY: number,
      colorTexto = "#fff",
    ) => ({
      y,
      borderColor: color,
      strokeDashArray: 0,
      width: "100%",
      opacity: 1,
      label: {
        text: `${texto} ${etiquetaEje(y)}`,
        position: "right" as const,
        offsetX: 6,
        offsetY,
        borderWidth: 0,
        style: {
          color: colorTexto,
          background: color,
          fontSize: "11px",
          fontWeight: 700,
          padding: {
            left: 8,
            right: 8,
            top: 2,
            bottom: 2,
          },
        },
      },
    });

    return {
      chart: {
        type: "line" as const,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: "inherit",
        background: "transparent",
      },
      colors: [COLOR_COMPRA, COLOR_MAXIMO, COLOR_PROMEDIO, COLOR_BAJA],
      stroke: {
        curve: "straight" as const,
        width: [4, 3, 3, 3],
        dashArray: [0, 0, 0, 0],
      },
      markers: {
        size: [5, 0, 0, 0],
        strokeWidth: 2,
        hover: { size: 7 },
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: categorias,
        labels: { rotate: categorias.length > 8 ? -45 : 0 },
      },
      yaxis: {
        min: 0,
        max: niveles.maximo > 0 ? roundMoney(niveles.maximo * 1.15) : 1,
        labels: { formatter: etiquetaEje },
      },
      legend: { show: false },
      grid: {
        borderColor: "#e5e7eb",
        strokeDashArray: 4,
        padding: { right: 28 },
      },
      annotations: {
        yaxis: [
          lineaHorizontal(niveles.maximo, COLOR_MAXIMO, "Máximo", -10),
          lineaHorizontal(
            niveles.promedio,
            COLOR_PROMEDIO,
            "Promedio",
            0,
            "#1f2937",
          ),
          lineaHorizontal(niveles.baja, COLOR_BAJA, "Más baja", 10),
        ],
      },
      tooltip: {
        shared: true,
        intersect: false,
        y: { formatter: (v: number) => formatCurrency(v) },
      },
    };
  }, [categorias, niveles]);

  return (
    <div className="min-w-0 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Tendencia de compra del cliente
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Compare ventas del periodo vs. el anterior y vs. el mismo tramo del
          año pasado.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <div className="relative min-w-0 sm:col-span-2">
            <label
              htmlFor="tendencia-cliente"
              className="mb-1 block text-xs text-gray-500"
            >
              Cliente (CardCode o nombre)
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="tendencia-cliente"
                type="search"
                value={textoCliente}
                onChange={(e) => {
                  const texto = e.target.value;
                  setTextoCliente(texto);
                  setCardCode("");
                  setCardName("");
                  const inferida = idEmpresaDescuentoDesdeDoc({
                    cardCode: texto,
                  });
                  if (inferida) setIdEmpresa(inferida);
                }}
                onBlur={() => {
                  const inferida = idEmpresaDescuentoDesdeDoc({
                    cardCode: textoCliente,
                  });
                  if (inferida) setIdEmpresa(inferida);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void consultar();
                  }
                }}
                placeholder="Ej. C001825 o nombre del cliente"
                className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                autoComplete="off"
              />
            </div>
            {cardName ? (
              <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                {cardName}
              </p>
            ) : null}
            {buscandoCliente || sugerencias.length > 0 ? (
              <ul className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                {buscandoCliente ? (
                  <li className="px-3 py-2 text-sm text-gray-500">
                    Buscando…
                  </li>
                ) : (
                  sugerencias.map((c) => (
                    <li key={`${c.cardCode}-${c.sociedad ?? ""}`}>
                      <button
                        type="button"
                        className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 dark:hover:bg-gray-700"
                        onClick={() => seleccionarCliente(c)}
                      >
                        <span className="font-mono font-medium text-gray-900 dark:text-white">
                          {c.cardCode}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-gray-500 dark:text-gray-400">
                          {c.cardName || "—"}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            ) : null}
          </div>
          <div className="min-w-0">
            <label
              htmlFor="tendencia-empresa"
              className="mb-1 block text-xs text-gray-500"
            >
              Empresa
            </label>
            <select
              id="tendencia-empresa"
              value={idEmpresa}
              onChange={(e) => setIdEmpresa(Number(e.target.value))}
              className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value={ID_EMPRESA_CODIALUB}>Codialub (1)</option>
              <option value={ID_EMPRESA_CODIAL}>Codial (2)</option>
            </select>
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-gray-500">
              Fecha inicio
            </label>
            <BasicDatePicker
              compact={false}
              value={fechaInicio}
              onChange={setFechaInicio}
              className="w-full"
            />
          </div>
          <div className="min-w-0">
            <label className="mb-1 block text-xs text-gray-500">
              Fecha fin
            </label>
            <BasicDatePicker
              compact={false}
              value={fechaFin}
              onChange={setFechaFin}
              className="w-full"
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => void consultar()}
            disabled={loading}
            className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Consultar
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : !data ? (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
          Busque un cliente y pulse Consultar para ver su tendencia de compra.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
              {data.cardCode}
            </p>
            {cardName ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {cardName}
              </p>
            ) : null}
            {data.etiqueta ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${claseEtiqueta(data.etiqueta)}`}
              >
                {data.variacionVsAnteriorPct >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {data.etiqueta}
              </span>
            ) : null}
          </div>

          <div className="min-w-0 overflow-x-auto rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              Tendencia mensual
            </h3>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              La compra mensual cae a cero si no hubo compra. Las líneas
              horizontales marcan máximo, promedio y más baja.
            </p>
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-0.5 w-5 rounded-full"
                  style={{ backgroundColor: COLOR_COMPRA }}
                />
                Compra
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-0.5 w-5 rounded-full"
                  style={{ backgroundColor: COLOR_MAXIMO }}
                />
                Máximo
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-0.5 w-5 rounded-full"
                  style={{ backgroundColor: COLOR_PROMEDIO }}
                />
                Promedio
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-0.5 w-5 rounded-full"
                  style={{ backgroundColor: COLOR_BAJA }}
                />
                Más baja
              </span>
            </div>
            {serie.length > 0 ? (
              <ReactApexChart
                key={`${data.cardCode}-${niveles.maximo}-${niveles.promedio}-${niveles.baja}`}
                options={opcionesGrafica}
                series={seriesGrafica}
                type="line"
                height={360}
              />
            ) : (
              <p className="py-10 text-center text-sm text-gray-500">
                Sin serie mensual.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                label: "Venta periodo",
                value: formatCurrency(data.ventaPeriodo),
              },
              {
                label: "Periodo anterior",
                value: formatCurrency(data.ventaPeriodoAnterior),
              },
              {
                label: "Var. vs anterior",
                value: formatPercent(data.variacionVsAnteriorPct),
                className: colorVariacion(data.variacionVsAnteriorPct),
              },
              {
                label: "Mismo periodo año ant.",
                value: formatCurrency(data.ventaMismoPeriodoAnioAnterior),
              },
              {
                label: "Var. vs año anterior",
                value: formatPercent(data.variacionVsAnioAnteriorPct),
                className: colorVariacion(data.variacionVsAnioAnteriorPct),
              },
              {
                label: "Ticket promedio",
                value: formatCurrency(data.ticketPromedio),
              },
              {
                label: "Documentos",
                value: formatNumber(data.documentos),
              },
              {
                label: "Pendiente mensual",
                value: formatCurrency(data.pendienteMensual),
              },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {kpi.label}
                </p>
                <p
                  className={`mt-1 text-lg font-semibold tabular-nums ${kpi.className ?? "text-gray-900 dark:text-white"}`}
                >
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>

          <div className="min-w-0 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h3 className="mb-3 text-base font-semibold text-gray-900 dark:text-white">
              Detalle mensual
            </h3>
            <TablaScroll>
              <table className="w-full min-w-[28rem] text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-3 py-2 text-left">Mes</th>
                    <th className="px-3 py-2 text-right">Venta</th>
                    <th className="px-3 py-2 text-right">Cantidad</th>
                    <th className="px-3 py-2 text-right">Docs</th>
                  </tr>
                </thead>
                <tbody>
                  {serie.map((p) => (
                    <tr
                      key={`${p.anio}-${p.mes}`}
                      className={`border-t dark:border-gray-700 ${p.lineTotal <= 0 ? "text-gray-400 dark:text-gray-500" : ""}`}
                    >
                      <td className="px-3 py-2">
                        {etiquetaMes(p.anio, p.mes)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(p.lineTotal)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatNumber(p.quantity)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatNumber(p.documentos)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TablaScroll>
          </div>
        </>
      )}
    </div>
  );
}
