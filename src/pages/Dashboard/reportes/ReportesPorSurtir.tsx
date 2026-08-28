import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
  Warehouse,
} from "lucide-react";
import ModalExistenciasArticulo, {
  type ContextoExistenciasArticulo,
} from "../../../components/reportes/ModalExistenciasArticulo";
import { useAuth } from "../../../hooks/useAuth";
import {
  getContextoOperativoPersona,
  type ContextoOperativoPersona,
} from "../../../services/authService";
import {
  getReportesService,
  type PorSurtirGlobalItem,
} from "../../../services/reportesService";
import { formatCurrency, formatNumber } from "../../../utils/format";
import {
  configSucursalPorId,
  etiquetaSucursalAlmacen,
} from "../../../utils/sucursalOperativa";

type FiltroAtraso = "" | "0-7" | "8-14" | "15+" | "8+";
type FiltroExistencia = "" | "sin-cero" | "solo-cero";

type GrupoFolio = {
  key: string;
  folio: string;
  fecha: string;
  documento: string;
  base: string;
  vendedor: string;
  almacen: string;
  sucursal: string;
  ruta: string;
  comentarios: string;
  articulos: PorSurtirGlobalItem[];
  cantidadPdnte: number;
  ulkpPdnte: number;
  importePdnte: number;
  diasAtraso: number;
};

type GrupoCliente = {
  key: string;
  codCliente: string;
  nombreCliente: string;
  folios: GrupoFolio[];
  partidas: number;
  cantidadPdnte: number;
  ulkpPdnte: number;
  importePdnte: number;
  /** Máximo atraso entre folios del cliente (para orden / semáforo). */
  diasAtrasoMax: number;
  fechaMasAntigua: string;
};

function parseFechaLocal(iso: string): Date | null {
  if (!iso?.trim()) return null;
  const raw = iso.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function hoyLocal(): Date {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}

/** Días de atraso: hoy vs DocDate (fecha). Negativos se tratan como 0. */
function diasAtrasoDesdeFecha(iso: string): number {
  const doc = parseFechaLocal(iso);
  if (!doc) return 0;
  const ms = hoyLocal().getTime() - doc.getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

function pasaFiltroAtraso(dias: number, filtro: FiltroAtraso): boolean {
  if (!filtro) return true;
  if (filtro === "0-7") return dias <= 7;
  if (filtro === "8-14") return dias >= 8 && dias <= 14;
  if (filtro === "15+") return dias >= 15;
  if (filtro === "8+") return dias >= 8;
  return true;
}

function claseSemáforoAtraso(dias: number): string {
  if (dias >= 15) {
    return "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/40";
  }
  if (dias >= 8) {
    return "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30";
  }
  return "border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800";
}

function etiquetaAtraso(dias: number): string {
  if (dias <= 0) return "0 d";
  return `${dias} d`;
}

function formatFechaCorta(iso: string): string {
  if (!iso?.trim()) return "—";
  const d = parseFechaLocal(iso) ?? new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function compararFechaAsc(a: string, b: string): number {
  const da = parseFechaLocal(a)?.getTime() ?? Number.POSITIVE_INFINITY;
  const db = parseFechaLocal(b)?.getTime() ?? Number.POSITIVE_INFINITY;
  if (da !== db) return da - db;
  return 0;
}

function csvEscape(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "es", { sensitivity: "base" }),
  );
}

function claveCliente(r: PorSurtirGlobalItem): string {
  return (r.codCliente || r.nombreCliente || "sin-cliente").trim();
}

function claveFolio(r: PorSurtirGlobalItem): string {
  return `${claveCliente(r)}::${(r.folio || "sin-folio").trim()}`;
}

function agruparPorClienteYFolio(items: PorSurtirGlobalItem[]): GrupoCliente[] {
  const porCliente = new Map<string, PorSurtirGlobalItem[]>();
  for (const item of items) {
    const ck = claveCliente(item);
    const list = porCliente.get(ck);
    if (list) list.push(item);
    else porCliente.set(ck, [item]);
  }

  const grupos: GrupoCliente[] = [];

  for (const [ck, clienteItems] of porCliente) {
    const porFolio = new Map<string, PorSurtirGlobalItem[]>();
    for (const item of clienteItems) {
      const fk = claveFolio(item);
      const list = porFolio.get(fk);
      if (list) list.push(item);
      else porFolio.set(fk, [item]);
    }

    const folios: GrupoFolio[] = [];
    for (const [fk, articulos] of porFolio) {
      const first = articulos[0];
      const comentarios =
        articulos
          .map((a) => a.comentarios?.trim())
          .find((c) => c && c.length > 0) ?? "";
      folios.push({
        key: fk,
        folio: first.folio,
        fecha: first.fecha,
        documento: first.documento,
        base: first.base,
        vendedor: first.vendedor,
        almacen: first.almacen,
        sucursal: first.sucursal,
        ruta: first.ruta,
        comentarios,
        articulos,
        cantidadPdnte: articulos.reduce(
          (s, a) => s + (a.cantidadPdnte || 0),
          0,
        ),
        ulkpPdnte: articulos.reduce((s, a) => s + (a.ulkpsPartPdte || 0), 0),
        importePdnte: articulos.reduce(
          (s, a) => s + (a.importePartPdte || 0),
          0,
        ),
        diasAtraso: diasAtrasoDesdeFecha(first.fecha),
      });
    }

    // DocDate ASC: lo más antiguo primero
    folios.sort((a, b) => {
      const byFecha = compararFechaAsc(a.fecha, b.fecha);
      if (byFecha !== 0) return byFecha;
      return a.folio.localeCompare(b.folio, "es", { numeric: true });
    });

    const first = clienteItems[0];
    const fechaMasAntigua = folios[0]?.fecha ?? first.fecha;
    grupos.push({
      key: ck,
      codCliente: first.codCliente,
      nombreCliente: first.nombreCliente,
      folios,
      partidas: clienteItems.length,
      cantidadPdnte: clienteItems.reduce(
        (s, a) => s + (a.cantidadPdnte || 0),
        0,
      ),
      ulkpPdnte: clienteItems.reduce((s, a) => s + (a.ulkpsPartPdte || 0), 0),
      importePdnte: clienteItems.reduce(
        (s, a) => s + (a.importePartPdte || 0),
        0,
      ),
      diasAtrasoMax: folios.reduce((m, f) => Math.max(m, f.diasAtraso), 0),
      fechaMasAntigua,
    });
  }

  // Clientes por DocDate más antiguo ASC (mantiene agrupación, prioriza atraso)
  grupos.sort((a, b) => {
    const byFecha = compararFechaAsc(a.fechaMasAntigua, b.fechaMasAntigua);
    if (byFecha !== 0) return byFecha;
    return (a.nombreCliente || a.codCliente).localeCompare(
      b.nombreCliente || b.codCliente,
      "es",
      { sensitivity: "base" },
    );
  });

  return grupos;
}

export default function ReportesPorSurtir() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PorSurtirGlobalItem[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroAlmacen, setFiltroAlmacen] = useState("");
  const [filtroRuta, setFiltroRuta] = useState("");
  const [filtroVendedor, setFiltroVendedor] = useState("");
  const [filtroAtraso, setFiltroAtraso] = useState<FiltroAtraso>("");
  const [filtroExistencia, setFiltroExistencia] =
    useState<FiltroExistencia>("");
  const [clientesAbiertos, setClientesAbiertos] = useState<Set<string>>(
    () => new Set(),
  );
  const [foliosAbiertos, setFoliosAbiertos] = useState<Set<string>>(
    () => new Set(),
  );
  const [contexto, setContexto] = useState<ContextoOperativoPersona | null>(
    null,
  );
  const [contextoListo, setContextoListo] = useState(false);
  const [existenciasCtx, setExistenciasCtx] =
    useState<ContextoExistenciasArticulo | null>(null);

  const abrirExistenciasArticulo = useCallback((row: PorSurtirGlobalItem) => {
    const articulo = (row.articulo ?? "").trim();
    const codigoProv = (row.codigoProv ?? "").trim();
    if (!articulo && !codigoProv) return;
    setExistenciasCtx({
      articulo,
      codigoProv,
      descripcion: row.descripcion,
      marca: row.marca,
    });
  }, []);

  const cfgSucursal = useMemo(
    () => configSucursalPorId(contexto?.idSucursal),
    [contexto?.idSucursal],
  );

  /** Códigos de almacén que van en `?sucursal=` (el API pagina el global). */
  const almacenesConsulta = useMemo(() => {
    if (!cfgSucursal) return [];
    if (filtroAlmacen.trim()) return [filtroAlmacen.trim()];
    return [...cfgSucursal.almacenes];
  }, [cfgSucursal, filtroAlmacen]);

  useEffect(() => {
    let cancelled = false;
    const loadCtx = async () => {
      if (!user?.idPersona) {
        if (!cancelled) {
          setContexto(null);
          setContextoListo(true);
        }
        return;
      }
      try {
        const ctx = await getContextoOperativoPersona(user.idPersona);
        if (!cancelled) setContexto(ctx);
      } catch (err) {
        console.error(err);
        if (!cancelled) setContexto(null);
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
    if (!contextoListo) return;
    if (!cfgSucursal || almacenesConsulta.length === 0) {
      setRows([]);
      setLoading(false);
      setError(
        contextoListo && !cfgSucursal
          ? "No se pudo resolver el almacén de tu sucursal."
          : null,
      );
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const listas = await Promise.all(
        almacenesConsulta.map((whs) =>
          getReportesService.getPorSurtirGlobal({ sucursal: whs }),
        ),
      );
      setRows(listas.flat());
    } catch (err) {
      console.error(err);
      setRows([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el reporte Por surtir.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recarga al cambiar almacén/sucursal
  }, [contextoListo, cfgSucursal?.nombre, almacenesConsulta.join("|")]);

  const almacenes = useMemo(() => {
    if (cfgSucursal) return [...cfgSucursal.almacenes];
    return uniqueSorted(rows.map((r) => r.almacen));
  }, [cfgSucursal, rows]);

  const rutas = useMemo(() => uniqueSorted(rows.map((r) => r.ruta)), [rows]);

  const vendedores = useMemo(
    () => uniqueSorted(rows.map((r) => r.vendedor)),
    [rows],
  );

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return rows.filter((r) => {
      if (filtroRuta && r.ruta !== filtroRuta) return false;
      if (filtroVendedor && r.vendedor !== filtroVendedor) return false;
      if (filtroExistencia === "sin-cero" && (r.existencia ?? 0) <= 0) {
        return false;
      }
      if (filtroExistencia === "solo-cero" && (r.existencia ?? 0) > 0) {
        return false;
      }
      if (!pasaFiltroAtraso(diasAtrasoDesdeFecha(r.fecha), filtroAtraso)) {
        return false;
      }
      if (!q) return true;
      const haystack = [
        r.folio,
        r.nombreCliente,
        r.codCliente,
        r.articulo,
        r.codigoProv,
        r.descripcion,
        r.marca,
        r.vendedor,
        r.ruta,
        r.almacen,
        r.sucursal,
        r.documento,
        r.base,
        etiquetaSucursalAlmacen(r.sucursal, r.almacen),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [
    rows,
    busqueda,
    filtroRuta,
    filtroVendedor,
    filtroExistencia,
    filtroAtraso,
  ]);

  const grupos = useMemo(() => agruparPorClienteYFolio(filtrados), [filtrados]);

  const resumen = useMemo(() => {
    const folios = new Set(filtrados.map((r) => r.folio).filter(Boolean));
    return {
      clientes: grupos.length,
      partidas: filtrados.length,
      folios: folios.size,
      cantidadPdnte: filtrados.reduce((s, r) => s + (r.cantidadPdnte || 0), 0),
      importePdnte: filtrados.reduce((s, r) => s + (r.importePartPdte || 0), 0),
      ulkpPdnte: filtrados.reduce((s, r) => s + (r.ulkpsPartPdte || 0), 0),
    };
  }, [filtrados, grupos.length]);

  const toggleCliente = (key: string) => {
    setClientesAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleFolio = (key: string) => {
    setFoliosAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandirTodo = () => {
    setClientesAbiertos(new Set(grupos.map((g) => g.key)));
    setFoliosAbiertos(
      new Set(grupos.flatMap((g) => g.folios.map((f) => f.key))),
    );
  };

  const colapsarTodo = () => {
    setClientesAbiertos(new Set());
    setFoliosAbiertos(new Set());
  };

  const exportarCsv = () => {
    const headers = [
      "Base",
      "Documento",
      "Fecha",
      "DiasAtraso",
      "Comentarios",
      "Folio",
      "Cliente",
      "CodCliente",
      "Vendedor",
      "Almacen",
      "Sucursal",
      "SucursalAlmacen",
      "Ruta",
      "Articulo",
      "CodigoProv",
      "Descripcion",
      "Marca",
      "CantidadTotal",
      "CantidadPdnte",
      "Existencia",
      "ULKP",
      "ULKPsPartPdte",
      "ImportePartPdte",
    ];
    const lines = [
      headers.join(","),
      ...filtrados.map((r) =>
        [
          r.base,
          r.documento,
          formatFechaCorta(r.fecha),
          diasAtrasoDesdeFecha(r.fecha),
          r.comentarios ?? "",
          r.folio,
          r.nombreCliente,
          r.codCliente,
          r.vendedor,
          r.almacen,
          r.sucursal,
          etiquetaSucursalAlmacen(r.sucursal, r.almacen),
          r.ruta,
          r.articulo,
          r.codigoProv,
          r.descripcion,
          r.marca,
          r.cantidadTotal,
          r.cantidadPdnte,
          r.existencia,
          r.ulkp,
          r.ulkpsPartPdte,
          r.importePartPdte,
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
    a.download = `por_surtir_global_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Por surtir
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Filtrado por almacén. Agrupado por cliente; folios por fecha ASC
            (más antiguo primero).
          </p>
          <p className="mt-1 flex flex-wrap gap-3 text-[11px] text-gray-500 dark:text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-gray-300 bg-white" />
              0–7 días
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-amber-400 bg-amber-200" />
              8–14 días
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm border border-red-400 bg-red-200" />
              15+ días
            </span>
          </p>
          {cfgSucursal ? (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              {contexto?.sucursal || cfgSucursal.nombre} · consultando{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {almacenesConsulta.join(", ")}
              </span>
            </p>
          ) : contextoListo ? (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              No se pudo resolver tu idSucursal. No hay partidas para filtrar.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={expandirTodo}
            disabled={loading || grupos.length === 0}
            className="inline-flex min-h-[40px] items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Expandir todo
          </button>
          <button
            type="button"
            onClick={colapsarTodo}
            disabled={loading || grupos.length === 0}
            className="inline-flex min-h-[40px] items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Colapsar todo
          </button>
          <button
            type="button"
            onClick={() => void cargar()}
            disabled={loading}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
          <button
            type="button"
            onClick={exportarCsv}
            disabled={filtrados.length === 0 || loading}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {[
          { label: "Clientes", value: formatNumber(resumen.clientes) },
          { label: "Folios", value: formatNumber(resumen.folios) },
          { label: "Partidas", value: formatNumber(resumen.partidas) },
          {
            label: "Cant. pendiente",
            value: formatNumber(resumen.cantidadPdnte),
          },
          { label: "ULKP pend.", value: formatNumber(resumen.ulkpPdnte) },
          {
            label: "Importe pend.",
            value: formatCurrency(resumen.importePdnte),
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

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0 flex-1 sm:min-w-[220px]">
          <label
            htmlFor="por-surtir-busqueda"
            className="mb-1 block text-xs text-gray-500"
          >
            Buscar
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="por-surtir-busqueda"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Folio, cliente, artículo, marca…"
              className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="por-surtir-almacen"
            className="mb-1 block text-xs text-gray-500"
          >
            Almacén
          </label>
          <select
            id="por-surtir-almacen"
            value={filtroAlmacen}
            onChange={(e) => setFiltroAlmacen(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos de mi sucursal</option>
            {almacenes.map((a) => (
              <option key={a} value={a}>
                {cfgSucursal
                  ? etiquetaSucursalAlmacen(cfgSucursal.nombre, a)
                  : a}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-40">
          <label
            htmlFor="por-surtir-ruta"
            className="mb-1 block text-xs text-gray-500"
          >
            Ruta
          </label>
          <select
            id="por-surtir-ruta"
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
        <div className="w-full sm:w-40">
          <label
            htmlFor="por-surtir-vendedor"
            className="mb-1 block text-xs text-gray-500"
          >
            Vendedor
          </label>
          <select
            id="por-surtir-vendedor"
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
            htmlFor="por-surtir-atraso"
            className="mb-1 block text-xs text-gray-500"
          >
            Atraso (hoy vs DocDate)
          </label>
          <select
            id="por-surtir-atraso"
            value={filtroAtraso}
            onChange={(e) => setFiltroAtraso(e.target.value as FiltroAtraso)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            <option value="0-7">0–7 días</option>
            <option value="8-14">8–14 días (amarillo)</option>
            <option value="15+">15+ días (rojo)</option>
            <option value="8+">8+ días (amarillo y rojo)</option>
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="por-surtir-existencia"
            className="mb-1 block text-xs text-gray-500"
          >
            Existencia
          </label>
          <select
            id="por-surtir-existencia"
            value={filtroExistencia}
            onChange={(e) =>
              setFiltroExistencia(e.target.value as FiltroExistencia)
            }
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todas</option>
            <option value="sin-cero">Sin existencia 0</option>
            <option value="solo-cero">Solo existencia 0</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {loading || !contextoListo ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      ) : !cfgSucursal ? (
        <p className="py-10 text-center text-gray-500 dark:text-gray-400">
          No hay sucursal asignada al usuario; no se pueden mostrar partidas.
        </p>
      ) : grupos.length === 0 ? (
        <p className="py-10 text-center text-gray-500 dark:text-gray-400">
          {rows.length === 0
            ? "No hay partidas por surtir para el almacén consultado."
            : "No hay partidas con los filtros actuales."}
        </p>
      ) : (
        <div className="space-y-2">
          {grupos.map((cliente) => {
            const abierto = clientesAbiertos.has(cliente.key);
            return (
              <div
                key={cliente.key}
                className={`overflow-hidden rounded-lg border shadow-sm ${claseSemáforoAtraso(cliente.diasAtrasoMax)}`}
              >
                <button
                  type="button"
                  onClick={() => toggleCliente(cliente.key)}
                  className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-black/5 dark:hover:bg-white/5 sm:items-center"
                  aria-expanded={abierto}
                >
                  <span className="mt-0.5 shrink-0 text-gray-500 sm:mt-0">
                    {abierto ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {cliente.nombreCliente || "—"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {cliente.codCliente || "Sin código"} ·{" "}
                      {cliente.folios.length} folio
                      {cliente.folios.length === 1 ? "" : "s"} ·{" "}
                      {cliente.partidas} partida
                      {cliente.partidas === 1 ? "" : "s"}
                      {cliente.diasAtrasoMax > 0
                        ? ` · atraso máx. ${etiquetaAtraso(cliente.diasAtrasoMax)}`
                        : ""}
                    </p>
                  </div>
                  <div className="hidden shrink-0 grid-cols-3 gap-4 text-right text-xs sm:grid md:text-sm">
                    <div>
                      <p className="text-gray-500">Cant. pdte.</p>
                      <p className="font-semibold tabular-nums text-gray-900 dark:text-white">
                        {formatNumber(cliente.cantidadPdnte)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">ULKP</p>
                      <p className="font-semibold tabular-nums text-gray-900 dark:text-white">
                        {formatNumber(cliente.ulkpPdnte)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Importe</p>
                      <p className="font-semibold tabular-nums text-gray-900 dark:text-white">
                        {formatCurrency(cliente.importePdnte)}
                      </p>
                    </div>
                  </div>
                </button>

                {abierto ? (
                  <div className="space-y-2 border-t border-black/5 bg-black/[0.02] px-2 py-2 dark:border-white/10 dark:bg-black/20 sm:px-3">
                    {cliente.folios.map((folio) => {
                      const folioAbierto = foliosAbiertos.has(folio.key);
                      return (
                        <div
                          key={folio.key}
                          className={`overflow-hidden rounded-lg border ${claseSemáforoAtraso(folio.diasAtraso)}`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleFolio(folio.key)}
                            className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-black/5 dark:hover:bg-white/5 sm:items-center"
                            aria-expanded={folioAbierto}
                          >
                            <span className="mt-0.5 shrink-0 text-gray-500 sm:mt-0">
                              {folioAbierto ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                Folio {folio.folio || "—"}
                                <span className="ml-2 font-normal text-gray-500">
                                  · {formatFechaCorta(folio.fecha)}
                                </span>
                                <span
                                  className={`ml-2 inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${
                                    folio.diasAtraso >= 15
                                      ? "bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-100"
                                      : folio.diasAtraso >= 8
                                        ? "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100"
                                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                                  }`}
                                >
                                  {etiquetaAtraso(folio.diasAtraso)}
                                </span>
                                {folio.comentarios ? (
                                  <span className="ml-2 font-bold text-gray-900 dark:text-white">
                                    · Comentarios: {folio.comentarios}
                                  </span>
                                ) : null}
                              </p>
                              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {folio.documento || "—"} ·{" "}
                                {etiquetaSucursalAlmacen(
                                  folio.sucursal,
                                  folio.almacen,
                                )}{" "}
                                · Ruta {folio.ruta || "—"} · Vend.{" "}
                                {folio.vendedor || "—"} ·{" "}
                                {folio.articulos.length} art.
                              </p>
                            </div>
                            <div className="hidden shrink-0 text-right text-xs sm:block">
                              <p className="tabular-nums font-medium text-gray-900 dark:text-white">
                                {formatCurrency(folio.importePdnte)}
                              </p>
                              <p className="text-gray-500">
                                {formatNumber(folio.cantidadPdnte)} pdte.
                              </p>
                            </div>
                          </button>

                          {folioAbierto ? (
                            <div className="overflow-x-auto border-t border-black/5 dark:border-white/10">
                              <table className="min-w-full text-xs sm:text-sm">
                                <thead className="bg-black/[0.03] dark:bg-black/30">
                                  <tr className="text-left text-gray-600 dark:text-gray-200">
                                    <th className="whitespace-nowrap px-3 py-2">
                                      Artículo
                                    </th>
                                    <th className="whitespace-nowrap px-3 py-2">
                                      Cód. prov.
                                    </th>
                                    <th className="min-w-[160px] px-3 py-2">
                                      Descripción
                                    </th>
                                    <th className="whitespace-nowrap px-3 py-2">
                                      Marca
                                    </th>
                                    <th className="whitespace-nowrap px-3 py-2 text-right">
                                      Cant. tot.
                                    </th>
                                    <th className="whitespace-nowrap px-3 py-2 text-right">
                                      Cant. pdte.
                                    </th>
                                    <th className="whitespace-nowrap px-3 py-2 text-right">
                                      Exist.
                                    </th>
                                    <th className="whitespace-nowrap px-3 py-2 text-right">
                                      ULKP pdte.
                                    </th>
                                    <th className="whitespace-nowrap px-3 py-2 text-right">
                                      Importe pdte.
                                    </th>
                                    <th
                                      className="whitespace-nowrap px-2 py-2 text-center"
                                      aria-label="Existencias por almacén"
                                    >
                                      <span className="sr-only">
                                        Existencias
                                      </span>
                                      <Warehouse className="mx-auto h-3.5 w-3.5 text-gray-400" />
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {folio.articulos.map((r, idx) => (
                                    <tr
                                      key={`${r.articulo}-${r.almacen}-${idx}`}
                                      className="cursor-pointer border-t border-black/5 hover:bg-sky-50/60 dark:border-white/10 dark:hover:bg-sky-950/20"
                                      title="Doble clic o botón para ver existencias por almacén"
                                      onDoubleClick={() =>
                                        abrirExistenciasArticulo(r)
                                      }
                                    >
                                      <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px]">
                                        {r.articulo || "—"}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2">
                                        {r.codigoProv || "—"}
                                      </td>
                                      <td
                                        className="max-w-[240px] truncate px-3 py-2"
                                        title={r.descripcion}
                                      >
                                        {r.descripcion || "—"}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2">
                                        {r.marca || "—"}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                                        {formatNumber(r.cantidadTotal)}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums font-medium">
                                        {formatNumber(r.cantidadPdnte)}
                                      </td>
                                      <td
                                        className={`whitespace-nowrap px-3 py-2 text-right tabular-nums ${
                                          (r.existencia ?? 0) <= 0
                                            ? "font-semibold text-red-700 dark:text-red-300"
                                            : ""
                                        }`}
                                      >
                                        {formatNumber(r.existencia)}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                                        {formatNumber(r.ulkpsPartPdte)}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                                        {formatCurrency(r.importePartPdte)}
                                      </td>
                                      <td className="whitespace-nowrap px-2 py-2 text-center">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            abrirExistenciasArticulo(r);
                                          }}
                                          disabled={
                                            !r.articulo?.trim() &&
                                            !r.codigoProv?.trim()
                                          }
                                          title="Ver existencias por almacén"
                                          className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg border border-sky-200 bg-sky-50 text-sky-800 hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-900/50"
                                          aria-label={`Ver existencias de ${r.articulo || r.codigoProv}`}
                                        >
                                          <Warehouse className="h-3.5 w-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <ModalExistenciasArticulo
        abierto={existenciasCtx !== null}
        contexto={existenciasCtx}
        onCerrar={() => setExistenciasCtx(null)}
      />
    </div>
  );
}
