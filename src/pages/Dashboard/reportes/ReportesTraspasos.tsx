import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  Download,
  RefreshCw,
  Search,
} from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import {
  getContextoOperativoPersona,
  type ContextoOperativoPersona,
} from "../../../services/authService";
import {
  getReportesService,
  type TransferStatusItem,
} from "../../../services/reportesService";
import { formatNumber } from "../../../utils/format";

/** Almacenes de la sucursal del usuario (origen / destino). */
type AlmacenesSucursal = {
  origen: string;
  destino: string;
};

const ALMACENES_POR_SUCURSAL: Record<number, AlmacenesSucursal> = {
  1: { origen: "AM1TX01", destino: "AM1TX03" },
  2: { origen: "AM2AR01", destino: "AM2AR03" },
  3: { origen: "AM3TA01", destino: "AM3TA03" },
  4: { origen: "AM4ES01", destino: "AM4ES03" },
  5: { origen: "AM5CO01", destino: "AM5CO03" },
};

function sameAlmacen(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

function almacenesDeSucursal(
  idSucursal: number | null | undefined,
): AlmacenesSucursal | null {
  if (idSucursal == null || idSucursal <= 0) return null;
  return ALMACENES_POR_SUCURSAL[idSucursal] ?? null;
}

type RolMiSucursal = "origen" | "destino" | "ambos" | "ninguno";

function rolLinea(
  r: TransferStatusItem,
  mis: AlmacenesSucursal | null,
): RolMiSucursal {
  if (!mis) return "ninguno";
  const soyOrigen = sameAlmacen(r.origen, mis.origen);
  const soyDestino = sameAlmacen(r.destino, mis.destino);
  if (soyOrigen && soyDestino) return "ambos";
  if (soyOrigen) return "origen";
  if (soyDestino) return "destino";
  return "ninguno";
}

/** La línea involucra algún almacén de la sucursal del usuario. */
function involucraSucursal(
  r: TransferStatusItem,
  mis: AlmacenesSucursal,
): boolean {
  return (
    sameAlmacen(r.origen, mis.origen) ||
    sameAlmacen(r.origen, mis.destino) ||
    sameAlmacen(r.destino, mis.origen) ||
    sameAlmacen(r.destino, mis.destino)
  );
}

type GrupoTraspaso = {
  key: string;
  docNum: number;
  docEntry: number;
  docDate: string;
  origen: string;
  destino: string;
  lineas: TransferStatusItem[];
  solicitado: number;
  enviado: number;
  pendiente: number;
  statusResumen: string;
  rol: RolMiSucursal;
};

function formatFechaCorta(iso: string): string {
  if (!iso?.trim()) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function csvEscape(value: string | number): string {
  const s = String(value ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function fechaSoloDia(iso: string): string {
  if (!iso?.trim()) return "";
  const raw = iso.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function statusBadgeClass(status: string): string {
  const s = status.trim().toLowerCase();
  if (s.includes("completo") || s === "c") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300";
  }
  if (s.includes("pendiente") || s === "p" || s.includes("parcial")) {
    return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
  }
  return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
}

function rolBadgeClass(rol: RolMiSucursal): string {
  if (rol === "origen") {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
  }
  if (rol === "destino") {
    return "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-200";
  }
  if (rol === "ambos") {
    return "bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200";
  }
  return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
}

function labelRol(rol: RolMiSucursal): string | null {
  if (rol === "origen") return "Soy origen";
  if (rol === "destino") return "Soy destino";
  if (rol === "ambos") return "Origen y destino";
  return null;
}

function resumenStatus(lineas: TransferStatusItem[]): string {
  if (lineas.length === 0) return "—";
  const statuses = new Set(
    lineas.map((l) => l.status.trim().toLowerCase()).filter(Boolean),
  );
  if (statuses.size === 1) return lineas[0].status || "—";
  const hayPendiente = lineas.some(
    (l) => (l.pendiente || 0) > 0 || /pendiente|parcial/i.test(l.status),
  );
  return hayPendiente ? "Parcial / Pendiente" : "Mixto";
}

function rolGrupo(
  lineas: TransferStatusItem[],
  mis: AlmacenesSucursal | null,
): RolMiSucursal {
  if (!mis) return "ninguno";
  let soyOrigen = false;
  let soyDestino = false;
  for (const l of lineas) {
    const r = rolLinea(l, mis);
    if (r === "origen" || r === "ambos") soyOrigen = true;
    if (r === "destino" || r === "ambos") soyDestino = true;
  }
  if (soyOrigen && soyDestino) return "ambos";
  if (soyOrigen) return "origen";
  if (soyDestino) return "destino";
  return "ninguno";
}

function agruparPorDocNum(
  items: TransferStatusItem[],
  mis: AlmacenesSucursal | null,
): GrupoTraspaso[] {
  const map = new Map<string, TransferStatusItem[]>();
  for (const item of items) {
    const key = String(item.docNum || item.docEntry || "sin-doc");
    const list = map.get(key);
    if (list) list.push(item);
    else map.set(key, [item]);
  }

  const grupos: GrupoTraspaso[] = [];
  for (const [key, lineas] of map) {
    lineas.sort((a, b) => a.lineNum - b.lineNum);
    const first = lineas[0];
    grupos.push({
      key,
      docNum: first.docNum,
      docEntry: first.docEntry,
      docDate: first.docDate,
      origen: first.origen,
      destino: first.destino,
      lineas,
      solicitado: lineas.reduce((s, l) => s + (l.solicitado || 0), 0),
      enviado: lineas.reduce((s, l) => s + (l.enviado || 0), 0),
      pendiente: lineas.reduce((s, l) => s + (l.pendiente || 0), 0),
      statusResumen: resumenStatus(lineas),
      rol: rolGrupo(lineas, mis),
    });
  }

  grupos.sort((a, b) => {
    const da = new Date(a.docDate).getTime() || 0;
    const db = new Date(b.docDate).getTime() || 0;
    if (db !== da) return db - da;
    return b.docNum - a.docNum;
  });

  return grupos;
}

export default function ReportesTraspasos() {
  const { user } = useAuth();
  const defaults = useMemo(
    () => getReportesService.getFechasTraspasosDefault(),
    [],
  );
  const [fechaInicio, setFechaInicio] = useState(defaults.fechaInicio);
  const [fechaFin, setFechaFin] = useState(defaults.fechaFin);
  const [docNum, setDocNum] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  /** Código de almacén, o __rol_origen / __rol_destino (siempre dentro de la sucursal). */
  const [filtroAlmacen, setFiltroAlmacen] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TransferStatusItem[]>([]);
  const [consultado, setConsultado] = useState(false);
  const [abiertos, setAbiertos] = useState<Set<string>>(() => new Set());
  const [contexto, setContexto] = useState<ContextoOperativoPersona | null>(
    null,
  );
  const [contextoListo, setContextoListo] = useState(false);

  const misAlmacenes = useMemo(
    () => almacenesDeSucursal(contexto?.idSucursal),
    [contexto?.idSucursal],
  );

  /** Solo traspasos de la sucursal del usuario (idSucursal → almacenes). */
  const rowsSucursal = useMemo(() => {
    if (!misAlmacenes) return [];
    return rows.filter((r) => involucraSucursal(r, misAlmacenes));
  }, [rows, misAlmacenes]);

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
    setLoading(true);
    setError(null);
    try {
      const data = await getReportesService.getTransferStatus({
        docNum: docNum.trim() || null,
        fechaInicio: fechaInicio || null,
        fechaFin: fechaFin || null,
      });
      const inicio = fechaInicio.trim();
      const fin = fechaFin.trim();
      const enRango =
        inicio || fin
          ? data.filter((r) => {
              const dia = fechaSoloDia(r.docDate);
              if (!dia) return true;
              if (inicio && dia < inicio) return false;
              if (fin && dia > fin) return false;
              return true;
            })
          : data;
      setRows(enRango);
      setConsultado(true);
      setAbiertos(new Set());
    } catch (err) {
      console.error(err);
      setRows([]);
      setConsultado(true);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el reporte de Traspasos.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void cargar();
    // Carga inicial: mes pasado → hoy
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statuses = useMemo(() => {
    const set = new Set(
      rowsSucursal.map((r) => r.status.trim()).filter(Boolean),
    );
    return [...set].sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" }),
    );
  }, [rowsSucursal]);

  const almacenesOpciones = useMemo(() => {
    if (!misAlmacenes) return [];
    return [misAlmacenes.origen, misAlmacenes.destino];
  }, [misAlmacenes]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return rowsSucursal.filter((r) => {
      if (filtroStatus && r.status !== filtroStatus) return false;

      const rol = rolLinea(r, misAlmacenes);
      if (filtroAlmacen === "__rol_origen") {
        if (rol !== "origen" && rol !== "ambos") return false;
      } else if (filtroAlmacen === "__rol_destino") {
        if (rol !== "destino" && rol !== "ambos") return false;
      } else if (filtroAlmacen) {
        const code = filtroAlmacen.toUpperCase();
        if (!sameAlmacen(r.origen, code) && !sameAlmacen(r.destino, code)) {
          return false;
        }
      }

      if (!q) return true;
      const haystack = [
        String(r.docNum),
        String(r.docEntry),
        r.itemCode,
        r.dscription,
        r.origen,
        r.destino,
        r.status,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [rowsSucursal, busqueda, filtroStatus, filtroAlmacen, misAlmacenes]);

  const grupos = useMemo(
    () => agruparPorDocNum(filtrados, misAlmacenes),
    [filtrados, misAlmacenes],
  );

  const resumen = useMemo(() => {
    const soyOrigen = filtrados.filter((r) => {
      const rol = rolLinea(r, misAlmacenes);
      return rol === "origen" || rol === "ambos";
    }).length;
    const soyDestino = filtrados.filter((r) => {
      const rol = rolLinea(r, misAlmacenes);
      return rol === "destino" || rol === "ambos";
    }).length;
    return {
      documentos: grupos.length,
      lineas: filtrados.length,
      solicitado: filtrados.reduce((s, r) => s + (r.solicitado || 0), 0),
      enviado: filtrados.reduce((s, r) => s + (r.enviado || 0), 0),
      pendiente: filtrados.reduce((s, r) => s + (r.pendiente || 0), 0),
      soyOrigen,
      soyDestino,
    };
  }, [filtrados, grupos.length, misAlmacenes]);

  const toggle = (key: string) => {
    setAbiertos((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const expandirTodo = () => setAbiertos(new Set(grupos.map((g) => g.key)));
  const colapsarTodo = () => setAbiertos(new Set());

  const exportarCsv = () => {
    const headers = [
      "DocEntry",
      "DocNum",
      "DocDate",
      "LineNum",
      "ItemCode",
      "Descripcion",
      "Origen",
      "Destino",
      "MiRol",
      "Solicitado",
      "Enviado",
      "Pendiente",
      "Status",
    ];
    const lines = [
      headers.join(","),
      ...filtrados.map((r) =>
        [
          r.docEntry,
          r.docNum,
          formatFechaCorta(r.docDate),
          r.lineNum,
          r.itemCode,
          r.dscription,
          r.origen,
          r.destino,
          labelRol(rolLinea(r, misAlmacenes)) || "",
          r.solicitado,
          r.enviado,
          r.pendiente,
          r.status,
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
    a.download = `traspasos_${fechaInicio}_${fechaFin}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Traspasos
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Solo traspasos de tu sucursal (mes pasado a la fecha). Agrupado por
            DocNum.
          </p>
          {misAlmacenes ? (
            <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
              Sucursal filtrada (
              {contexto?.sucursal || `id ${contexto?.idSucursal}`}):{" "}
              <span className="font-medium text-blue-700 dark:text-blue-300">
                Origen {misAlmacenes.origen}
              </span>
              {" · "}
              <span className="font-medium text-violet-700 dark:text-violet-300">
                Destino {misAlmacenes.destino}
              </span>
            </p>
          ) : contextoListo ? (
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              No se pudo resolver tu idSucursal. No hay almacenes para filtrar.
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={expandirTodo}
            disabled={loading || grupos.length === 0}
            className="inline-flex min-h-[40px] items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            Expandir todo
          </button>
          <button
            type="button"
            onClick={colapsarTodo}
            disabled={loading || grupos.length === 0}
            className="inline-flex min-h-[40px] items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            Colapsar todo
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

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void cargar();
        }}
        className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:flex-wrap sm:items-end"
      >
        <div className="w-full sm:w-40">
          <label
            htmlFor="traspasos-fecha-inicio"
            className="mb-1 block text-xs text-gray-500"
          >
            Fecha inicio
          </label>
          <input
            id="traspasos-fecha-inicio"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-40">
          <label
            htmlFor="traspasos-fecha-fin"
            className="mb-1 block text-xs text-gray-500"
          >
            Fecha fin
          </label>
          <input
            id="traspasos-fecha-fin"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="w-full sm:w-36">
          <label
            htmlFor="traspasos-docnum"
            className="mb-1 block text-xs text-gray-500"
          >
            DocNum (opcional)
          </label>
          <input
            id="traspasos-docnum"
            type="text"
            inputMode="numeric"
            value={docNum}
            onChange={(e) => setDocNum(e.target.value.replace(/[^\d]/g, ""))}
            placeholder="Ej. 3836"
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-7">
        {[
          { label: "Documentos", value: formatNumber(resumen.documentos) },
          { label: "Líneas", value: formatNumber(resumen.lineas) },
          { label: "Soy origen", value: formatNumber(resumen.soyOrigen) },
          { label: "Soy destino", value: formatNumber(resumen.soyDestino) },
          { label: "Solicitado", value: formatNumber(resumen.solicitado) },
          { label: "Enviado", value: formatNumber(resumen.enviado) },
          { label: "Pendiente", value: formatNumber(resumen.pendiente) },
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
            htmlFor="traspasos-busqueda"
            className="mb-1 block text-xs text-gray-500"
          >
            Buscar en resultados
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              id="traspasos-busqueda"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="DocNum, artículo, origen, destino…"
              className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="w-full sm:w-56">
          <label
            htmlFor="traspasos-almacen"
            className="mb-1 block text-xs text-gray-500"
          >
            Almacén / rol
          </label>
          <select
            id="traspasos-almacen"
            value={filtroAlmacen}
            onChange={(e) => setFiltroAlmacen(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Toda mi sucursal</option>
            {misAlmacenes ? (
              <>
                <option value="__rol_origen">
                  Soy origen ({misAlmacenes.origen})
                </option>
                <option value="__rol_destino">
                  Soy destino ({misAlmacenes.destino})
                </option>
                {almacenesOpciones.map((a) => (
                  <option key={a} value={a}>
                    Almacén {a}
                  </option>
                ))}
              </>
            ) : null}
          </select>
        </div>
        <div className="w-full sm:w-44">
          <label
            htmlFor="traspasos-status"
            className="mb-1 block text-xs text-gray-500"
          >
            Estatus
          </label>
          <select
            id="traspasos-status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Todos</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
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
      ) : !misAlmacenes ? (
        <p className="py-10 text-center text-gray-500 dark:text-gray-400">
          No hay sucursal asignada al usuario; no se pueden mostrar traspasos.
        </p>
      ) : !consultado ? null : grupos.length === 0 ? (
        <p className="py-10 text-center text-gray-500 dark:text-gray-400">
          No hay traspasos de tu sucursal en el rango seleccionado
          {docNum.trim() ? ` para DocNum ${docNum.trim()}` : ""}.
        </p>
      ) : (
        <div className="space-y-2">
          {grupos.map((g) => {
            const abierto = abiertos.has(g.key);
            const rolLbl = labelRol(g.rol);
            return (
              <div
                key={g.key}
                className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800"
              >
                <button
                  type="button"
                  onClick={() => toggle(g.key)}
                  className="flex w-full items-start gap-3 px-3 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:items-center"
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        DocNum {g.docNum || "—"}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(g.statusResumen)}`}
                      >
                        {g.statusResumen}
                      </span>
                      {rolLbl ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${rolBadgeClass(g.rol)}`}
                        >
                          {rolLbl}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFechaCorta(g.docDate)} ·{" "}
                      <span
                        className={
                          misAlmacenes &&
                          sameAlmacen(g.origen, misAlmacenes.origen)
                            ? "font-semibold text-blue-700 dark:text-blue-300"
                            : undefined
                        }
                      >
                        {g.origen || "—"}
                      </span>
                      {" → "}
                      <span
                        className={
                          misAlmacenes &&
                          sameAlmacen(g.destino, misAlmacenes.destino)
                            ? "font-semibold text-violet-700 dark:text-violet-300"
                            : undefined
                        }
                      >
                        {g.destino || "—"}
                      </span>
                      {" · "}
                      {g.lineas.length} línea
                      {g.lineas.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="hidden shrink-0 grid-cols-3 gap-4 text-right text-xs sm:grid md:text-sm">
                    <div>
                      <p className="text-gray-500">Solicitado</p>
                      <p className="font-semibold tabular-nums">
                        {formatNumber(g.solicitado)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Enviado</p>
                      <p className="font-semibold tabular-nums">
                        {formatNumber(g.enviado)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Pendiente</p>
                      <p className="font-semibold tabular-nums">
                        {formatNumber(g.pendiente)}
                      </p>
                    </div>
                  </div>
                </button>

                {abierto ? (
                  <div className="overflow-x-auto border-t border-gray-100 dark:border-gray-700">
                    <table className="min-w-full text-xs sm:text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/80">
                        <tr className="text-left text-gray-600 dark:text-gray-200">
                          <th className="whitespace-nowrap px-3 py-2">Línea</th>
                          <th className="whitespace-nowrap px-3 py-2">
                            Artículo
                          </th>
                          <th className="min-w-[180px] px-3 py-2">
                            Descripción
                          </th>
                          <th className="whitespace-nowrap px-3 py-2">
                            Origen
                          </th>
                          <th className="whitespace-nowrap px-3 py-2">
                            Destino
                          </th>
                          <th className="whitespace-nowrap px-3 py-2">
                            Mi rol
                          </th>
                          <th className="whitespace-nowrap px-3 py-2 text-right">
                            Solicitado
                          </th>
                          <th className="whitespace-nowrap px-3 py-2 text-right">
                            Enviado
                          </th>
                          <th className="whitespace-nowrap px-3 py-2 text-right">
                            Pendiente
                          </th>
                          <th className="whitespace-nowrap px-3 py-2">
                            Estatus
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {g.lineas.map((r) => {
                          const rol = rolLinea(r, misAlmacenes);
                          const rolLblLinea = labelRol(rol);
                          return (
                            <tr
                              key={`${r.docEntry}-${r.lineNum}-${r.itemCode}`}
                              className="border-t border-gray-100 dark:border-gray-700"
                            >
                              <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                                {r.lineNum}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 font-mono text-[11px]">
                                {r.itemCode || "—"}
                              </td>
                              <td
                                className="max-w-[260px] truncate px-3 py-2"
                                title={r.dscription}
                              >
                                {r.dscription || "—"}
                              </td>
                              <td
                                className={`whitespace-nowrap px-3 py-2 ${
                                  misAlmacenes &&
                                  sameAlmacen(r.origen, misAlmacenes.origen)
                                    ? "font-semibold text-blue-700 dark:text-blue-300"
                                    : ""
                                }`}
                              >
                                {r.origen || "—"}
                              </td>
                              <td
                                className={`whitespace-nowrap px-3 py-2 ${
                                  misAlmacenes &&
                                  sameAlmacen(r.destino, misAlmacenes.destino)
                                    ? "font-semibold text-violet-700 dark:text-violet-300"
                                    : ""
                                }`}
                              >
                                {r.destino || "—"}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                {rolLblLinea ? (
                                  <span
                                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${rolBadgeClass(rol)}`}
                                  >
                                    {rolLblLinea}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                                {formatNumber(r.solicitado)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                                {formatNumber(r.enviado)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums font-medium">
                                {formatNumber(r.pendiente)}
                              </td>
                              <td className="whitespace-nowrap px-3 py-2">
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${statusBadgeClass(r.status)}`}
                                >
                                  {r.status || "—"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
