import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Download, Filter, Loader2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import BasicDatePicker from "../../components/ui/datepicker/datepicker";
import { useAuth } from "../../hooks/useAuth";
import { useEntregaPremisos } from "../../hooks/useEntregaPremisos";

import {
  cleanDisplayText,
  entregaObservaciones,
  getIdCanjeNum,
  getPremiosCanjeados,
  idCanjeRow,
  PremioCanjeadoApi,
  registrarEntregaPremio,
  toApiFechaEntrega,
  validarInfoCanje,
} from "../../services/canjesPremioService";

type UiPatch = {
  recibe: string;
  fechaEntrega: string;
  validado: boolean;
  entregado: boolean;
  observaciones: string;
};

const personaDe = (r: PremioCanjeadoApi) =>
  cleanDisplayText(
    r.nombreCliente || r.fullName || r.nombrePersona || r.persona || "",
  ) || "—";

const telefonoDe = (r: PremioCanjeadoApi) =>
  r.telefono?.trim() || r.celular?.trim() || "—";

const premioDe = (r: PremioCanjeadoApi) =>
  r.nombrePremio?.trim() || r.premio?.trim() || "—";

const fechaCanjeDe = (r: PremioCanjeadoApi) => r.fechaCanje || null;
const fechaEstimadaDe = (r: PremioCanjeadoApi) => r.fechaEstimada || null;

const cupoDe = (r: PremioCanjeadoApi) => {
  const c = r.cupon;
  if (c === null || c === undefined || c === "") return "—";
  return String(c);
};

const formatFecha = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

type MergedRow = PremioCanjeadoApi & UiPatch;

type FiltroEstatusExport = "todos" | "pendiente" | "validado" | "entregado";
type PestañaEstatus = "pendiente" | "validado" | "entregado";

const PAGE_SIZE = 25;
const FILTRO_SUCURSAL_TODAS = "__todas__";

const PESTAÑAS: { id: PestañaEstatus; label: string }[] = [
  { id: "pendiente", label: "Pendientes" },
  { id: "validado", label: "Validados" },
  { id: "entregado", label: "Entregados" },
];

function estatusDeRow(row: MergedRow): PestañaEstatus {
  if (row.entregado) return "entregado";
  if (row.validado) return "validado";
  return "pendiente";
}

function cumpleFiltroEstatus(
  row: MergedRow,
  filtro: FiltroEstatusExport,
): boolean {
  if (filtro === "todos") return true;
  if (filtro === "entregado") return row.entregado;
  if (filtro === "validado") return row.validado && !row.entregado;
  if (filtro === "pendiente") return !row.validado;
  return true;
}

function cumpleFiltroSucursal(
  r: PremioCanjeadoApi,
  filtroSucursal: string,
): boolean {
  if (filtroSucursal === FILTRO_SUCURSAL_TODAS) return true;
  return (r.sucursal?.trim() || "") === filtroSucursal;
}

function fechaCanjeMs(iso: string | null): number {
  if (!iso) return Number.MAX_SAFE_INTEGER;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? Number.MAX_SAFE_INTEGER : t;
}

function stickyBg(entregado: boolean, validado: boolean): string {
  if (entregado) return "bg-emerald-100 dark:bg-emerald-950/50";
  if (validado) return "bg-blue-100 dark:bg-blue-950/45";
  return "bg-white dark:bg-gray-900";
}

function estatusEtiqueta(row: MergedRow): string {
  if (row.entregado) return "Entregado";
  if (row.validado) return "Validado";
  return "Pendiente";
}

function mergeRow(
  r: PremioCanjeadoApi,
  id: string,
  ui: Record<string, UiPatch>,
): MergedRow {
  const patch = ui[id];
  return {
    ...r,
    recibe: patch ? patch.recibe : (r.recibe ?? "").trim(),
    fechaEntrega: patch ? patch.fechaEntrega : toDateInputValue(r.fechaEntrega),
    validado: patch ? patch.validado : Boolean(r.valido ?? r.validado),
    entregado: patch
      ? patch.entregado
      : r.estatusEntrega === "E" || r.activo === false || Boolean(r.entregado),
    observaciones: patch ? patch.observaciones : (r.observaciones ?? "").trim(),
  };
}

function toDateInputValue(v: string | null | undefined): string {
  if (!v) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function initPatchFromApi(r: PremioCanjeadoApi): UiPatch {
  return {
    recibe: (r.recibe ?? "").trim(),
    observaciones: (r.observaciones ?? "").trim(),
    fechaEntrega: toDateInputValue(r.fechaEntrega),
    validado: Boolean(r.valido ?? r.validado),
    entregado:
      r.estatusEntrega === "E" || r.activo === false || Boolean(r.entregado),
  };
}

function rowClass(entregado: boolean, validado: boolean) {
  if (entregado) {
    return "bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200/80 dark:hover:bg-emerald-950/60";
  }
  if (validado) {
    return "bg-blue-100 dark:bg-blue-950/45 hover:bg-blue-200/80 dark:hover:bg-blue-950/55";
  }
  return "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60";
}

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function descargarCsv(nombre: string, filas: string[][]) {
  const bom = "\uFEFF";
  const contenido =
    bom + filas.map((fila) => fila.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombre;
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function EntregasPremios() {
  const { user } = useAuth();
  const {
    menuLoading,
    puedeAccederModulo,
    puedeOperar,
    puedeDescargar,
    puedeRefrescarListado,
  } = useEntregaPremisos();
  const [canjes, setCanjes] = useState<PremioCanjeadoApi[]>([]);
  const [uiMap, setUiMap] = useState<Record<string, UiPatch>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingRows, setSavingRows] = useState<Set<string>>(new Set());
  const [editingRecibeRows, setEditingRecibeRows] = useState<Set<string>>(
    new Set(),
  );
  const [filtroEstatusExport, setFiltroEstatusExport] =
    useState<FiltroEstatusExport>("todos");
  const [pestañaActiva, setPestañaActiva] = useState<PestañaEstatus>("pendiente");
  const [filtroSucursal, setFiltroSucursal] = useState(FILTRO_SUCURSAL_TODAS);
  const [page, setPage] = useState(1);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    rowId: string;
    apiRow: PremioCanjeadoApi;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);
  const tableScrollRef = useRef<HTMLDivElement | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPremiosCanjeados();
      setCanjes(data);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error
          ? e.message
          : "No se pudo cargar el listado de premios canjeados.",
      );
      setCanjes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (menuLoading || !puedeAccederModulo) return;
    void cargar();
  }, [cargar, menuLoading, puedeAccederModulo]);

  useEffect(() => {
    if (!menu) return;
    const close = (ev: MouseEvent) => {
      if (menuRef.current?.contains(ev.target as Node)) return;
      setMenu(null);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setMenu(null);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  useEffect(() => {
    if (!puedeOperar) setMenu(null);
  }, [puedeOperar]);

  const patchUi = useCallback(
    (rowId: string, partial: Partial<UiPatch>, base: PremioCanjeadoApi) => {
      setUiMap((prev) => {
        const cur = prev[rowId] ?? initPatchFromApi(base);
        return { ...prev, [rowId]: { ...cur, ...partial } };
      });
    },
    [],
  );

  const marcarComoEntregado = useCallback(
    async (
      r: PremioCanjeadoApi,
      rowId: string,
      merged: UiPatch,
    ): Promise<boolean> => {
      if (!user?.idPersona) {
        alert("No se encontró el usuario en sesión.");
        return false;
      }

      const idCanje = getIdCanjeNum(r);
      if (idCanje == null) {
        alert("No se encontró el identificador del canje.");
        return false;
      }

      const fechaEntrega = toApiFechaEntrega(merged.fechaEntrega);
      if (!fechaEntrega) {
        alert("La fecha de entrega no es válida.");
        return false;
      }

      setSavingRows((prev) => new Set(prev).add(rowId));
      try {
        await registrarEntregaPremio({
          idCanje,
          idUsuarioEdita: user.idPersona,
          observaciones: merged.observaciones,
          recibe: merged.recibe.trim(),
          fechaEntrega,
        });

        const entregadoPatch: UiPatch = { ...merged, entregado: true };
        setUiMap((prev) => ({ ...prev, [rowId]: entregadoPatch }));
        setCanjes((prev) =>
          prev.map((c) =>
            getIdCanjeNum(c) === idCanje
              ? {
                  ...c,
                  activo: false,
                  estatusEntrega: "E",
                  entregado: true,
                  fechaEntrega,
                  observaciones: merged.observaciones.trim(),
                  recibe: merged.recibe.trim(),
                }
              : c,
          ),
        );

        return true;
      } catch (e) {
        console.error(e);
        alert(
          e instanceof Error
            ? e.message
            : "No se pudo guardar la información del canje.",
        );
        return false;
      } finally {
        setSavingRows((prev) => {
          const next = new Set(prev);
          next.delete(rowId);
          return next;
        });
      }
    },
    [user?.idPersona],
  );

  const tableData = useMemo(() => {
    const sorted = [...canjes].sort((a, b) => {
      const fa = fechaCanjeMs(fechaCanjeDe(a));
      const fb = fechaCanjeMs(fechaCanjeDe(b));
      if (fa !== fb) return fa - fb;
      const ia = getIdCanjeNum(a) ?? 0;
      const ib = getIdCanjeNum(b) ?? 0;
      return ia - ib;
    });
    return sorted.map((r, i) => {
      const rowId = idCanjeRow(r, i);
      return { r, rowId, row: mergeRow(r, rowId, uiMap) };
    });
  }, [canjes, uiMap]);

  const sucursalesOpciones = useMemo(() => {
    const set = new Set<string>();
    for (const { r } of tableData) {
      const s = r.sucursal?.trim();
      if (s) set.add(s);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [tableData]);

  const conteosPorPestaña = useMemo(() => {
    const counts: Record<PestañaEstatus, number> = {
      pendiente: 0,
      validado: 0,
      entregado: 0,
    };
    for (const { row, r } of tableData) {
      if (!cumpleFiltroSucursal(r, filtroSucursal)) continue;
      counts[estatusDeRow(row)] += 1;
    }
    return counts;
  }, [tableData, filtroSucursal]);

  const filteredTableData = useMemo(
    () =>
      tableData.filter(
        ({ row, r }) =>
          estatusDeRow(row) === pestañaActiva &&
          cumpleFiltroSucursal(r, filtroSucursal),
      ),
    [tableData, pestañaActiva, filtroSucursal],
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTableData.length / PAGE_SIZE),
  );
  const pageSafe = Math.min(page, totalPages);

  const paginatedTableData = useMemo(() => {
    const start = (pageSafe - 1) * PAGE_SIZE;
    return filteredTableData.slice(start, start + PAGE_SIZE);
  }, [filteredTableData, pageSafe]);

  const rangoMostrado = useMemo(() => {
    if (filteredTableData.length === 0) return { desde: 0, hasta: 0 };
    const desde = (pageSafe - 1) * PAGE_SIZE + 1;
    const hasta = Math.min(pageSafe * PAGE_SIZE, filteredTableData.length);
    return { desde, hasta };
  }, [filteredTableData.length, pageSafe]);

  useEffect(() => {
    setPage(1);
  }, [pestañaActiva, filtroSucursal]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    tableScrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pageSafe, pestañaActiva, filtroSucursal]);

  const datosExportacion = useMemo(
    () =>
      tableData.filter(
        ({ row, r }) =>
          cumpleFiltroEstatus(row, filtroEstatusExport) &&
          cumpleFiltroSucursal(r, filtroSucursal),
      ),
    [tableData, filtroEstatusExport, filtroSucursal],
  );

  const menuRow = useMemo(() => {
    if (!menu) return null;
    return mergeRow(menu.apiRow, menu.rowId, uiMap);
  }, [menu, uiMap]);

  const actualizarRecibe = async (
    r: PremioCanjeadoApi,
    rowId: string,
  ): Promise<boolean> => {
    const cur = uiMap[rowId] ?? initPatchFromApi(r);
    const recibe = cur.recibe.trim();
    if (!recibe) {
      alert("El campo «Recibe» no puede quedar vacío.");
      return false;
    }

    if (!user?.idPersona) {
      alert("No se encontró el usuario en sesión.");
      return false;
    }

    const idCanje = getIdCanjeNum(r);
    if (idCanje == null) {
      alert("No se encontró el identificador del canje.");
      return false;
    }

    setSavingRows((prev) => new Set(prev).add(rowId));
    try {
      await validarInfoCanje({
        idCanje,
        idUsuarioEdita: user.idPersona,
        recibe,
        valido: true,
      });
      setUiMap((prev) => ({
        ...prev,
        [rowId]: { ...cur, recibe, validado: true },
      }));
      setCanjes((prev) =>
        prev.map((c) => (getIdCanjeNum(c) === idCanje ? { ...c, recibe } : c)),
      );
      setEditingRecibeRows((prev) => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
      return true;
    } catch (e) {
      console.error(e);
      alert(
        e instanceof Error
          ? e.message
          : "No se pudo actualizar la persona que acredita.",
      );
      return false;
    } finally {
      setSavingRows((prev) => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
    }
  };

  const onValidadoChange = async (
    checked: boolean,
    r: PremioCanjeadoApi,
    rowId: string,
  ) => {
    if (!checked) return;

    const cur = uiMap[rowId] ?? initPatchFromApi(r);
    const recibe = cur.recibe.trim();
    if (!recibe) {
      alert("El campo «Recibe» es obligatorio antes de validar el canje.");
      return;
    }

    if (!user?.idPersona) {
      alert("No se encontró el usuario en sesión.");
      return;
    }

    const idCanje = getIdCanjeNum(r);
    if (idCanje == null) {
      alert("No se encontró el identificador del canje.");
      return;
    }

    setSavingRows((prev) => new Set(prev).add(rowId));
    try {
      await validarInfoCanje({
        idCanje,
        idUsuarioEdita: user.idPersona,
        recibe,
        valido: true,
      });
      setUiMap((prev) => ({
        ...prev,
        [rowId]: { ...cur, recibe, validado: true },
      }));
      setEditingRecibeRows((prev) => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
    } catch (e) {
      console.error(e);
      alert(
        e instanceof Error
          ? e.message
          : "No se pudo validar la información del canje.",
      );
    } finally {
      setSavingRows((prev) => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
    }
  };

  const onRecibeKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    r: PremioCanjeadoApi,
    rowId: string,
  ) => {
    if (e.key !== "Enter" || !editingRecibeRows.has(rowId)) return;
    e.preventDefault();
    void actualizarRecibe(r, rowId);
  };

  const actualizarObservaciones = async (
    r: PremioCanjeadoApi,
    rowId: string,
  ): Promise<boolean> => {
    const merged = mergeRow(r, rowId, uiMap);

    if (!user?.idPersona) {
      alert("No se encontró el usuario en sesión.");
      return false;
    }

    const idCanje = getIdCanjeNum(r);
    if (idCanje == null) {
      alert("No se encontró el identificador del canje.");
      return false;
    }

    setSavingRows((prev) => new Set(prev).add(rowId));
    try {
      await entregaObservaciones({
        idCanje,
        idUsuarioEdita: user.idPersona,
        observaciones: merged.observaciones.trim(),
      });

      const observaciones = merged.observaciones.trim();
      setUiMap((prev) => ({
        ...prev,
        [rowId]: { ...merged, observaciones },
      }));
      setCanjes((prev) =>
        prev.map((c) =>
          getIdCanjeNum(c) === idCanje ? { ...c, observaciones } : c,
        ),
      );
      return true;
    } catch (e) {
      console.error(e);
      alert(
        e instanceof Error
          ? e.message
          : "No se pudieron guardar las observaciones.",
      );
      return false;
    } finally {
      setSavingRows((prev) => {
        const next = new Set(prev);
        next.delete(rowId);
        return next;
      });
    }
  };

  const onObservacionesKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    r: PremioCanjeadoApi,
    rowId: string,
  ) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    void actualizarObservaciones(r, rowId);
  };

  const toggleEntregado = async (
    rowId: string,
    base: PremioCanjeadoApi,
    value?: boolean,
  ) => {
    const merged = mergeRow(base, rowId, uiMap);
    const next = value !== undefined ? value : !merged.entregado;

    if (!next) {
      patchUi(rowId, { entregado: false }, base);
      setMenu(null);
      return;
    }

    if (!merged.validado) {
      alert(
        "Debe validar la información del canje antes de marcar como entregado.",
      );
      setMenu(null);
      return;
    }

    if (!merged.recibe.trim()) {
      alert("El campo «Recibe» es obligatorio antes de marcar como entregado.");
      setMenu(null);
      return;
    }

    if (!merged.fechaEntrega.trim()) {
      alert(
        "El campo «Fecha entrega» es obligatorio antes de marcar como entregado.",
      );
      setMenu(null);
      return;
    }

    await marcarComoEntregado(base, rowId, merged);
    setMenu(null);
  };

  const exportarExcel = () => {
    if (!puedeDescargar) return;
    if (datosExportacion.length === 0) {
      alert("No hay registros con el estatus seleccionado para exportar.");
      return;
    }

    const encabezados = [
      "Vendedor",
      "Sucursal",
      "Cliente",
      "CardCode",
      "Teléfono",
      "Cupón",
      "Premio",
      "Cantidad",
      "Fecha canje",
      "Fecha estimada",
      "Observaciones",
      "Persona Acreditada",
      "Fecha entrega",
      "Estatus",
    ];

    const filas = datosExportacion.map(({ r, row: m }) => [
      r.vendedor?.trim() || "",
      r.sucursal?.trim() || "",
      personaDe(r) === "—" ? "" : personaDe(r),
      r.cardCode?.trim() || "",
      telefonoDe(r) === "—" ? "" : telefonoDe(r),
      cupoDe(r) === "—" ? "" : cupoDe(r),
      premioDe(r) === "—" ? "" : premioDe(r),
      r.cantidad != null ? String(r.cantidad) : "",
      formatFecha(fechaCanjeDe(r)) === "—" ? "" : formatFecha(fechaCanjeDe(r)),
      formatFecha(fechaEstimadaDe(r)) === "—"
        ? ""
        : formatFecha(fechaEstimadaDe(r)),
      m.observaciones,
      m.recibe,
      m.fechaEntrega
        ? formatFecha(m.fechaEntrega) === "—"
          ? m.fechaEntrega
          : formatFecha(m.fechaEntrega)
        : "",
      estatusEtiqueta(m),
    ]);

    const fecha = new Date().toISOString().slice(0, 10);
    descargarCsv(`entregas_premios_${filtroEstatusExport}_${fecha}.csv`, [
      encabezados,
      ...filas,
    ]);
  };

  if (menuLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-gray-500 dark:text-gray-400">
        <Loader2 className="h-10 w-10 animate-spin" />
        <p className="text-sm">Cargando permisos…</p>
      </div>
    );
  }

  if (!puedeAccederModulo) {
    return (
      <div className="space-y-4 p-6">
        <PageMeta
          title="Entregas de premios"
          description="Seguimiento de premios canjeados y entregas."
        />
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          <h1 className="text-lg font-semibold">Sin acceso</h1>
          <p className="mt-2 text-sm">
            No cuenta con permisos para ver este módulo. Si cree que es un
            error, contacte al administrador.
          </p>
          <Link
            to="/dashboard/Home"
            className="mt-4 inline-block text-sm font-medium text-blue-600 underline hover:no-underline dark:text-blue-400"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageMeta
        title="Entregas de premios"
        description="Seguimiento de premios canjeados y entregas."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Entregas de premios
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {puedeRefrescarListado && (
            <button
              type="button"
              onClick={() => void cargar()}
              disabled={loading}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
            >
              Actualizar listado
            </button>
          )}
          {puedeDescargar && (
            <>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filtroEstatusExport}
                  onChange={(e) =>
                    setFiltroEstatusExport(e.target.value as FiltroEstatusExport)
                  }
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                  <option value="todos">Todos</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="validado">Validado</option>
                  <option value="entregado">Entregado</option>
                </select>
              </div>
              <button
                type="button"
                onClick={exportarExcel}
                disabled={loading || datosExportacion.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Descargar Excel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600" />
          Pendiente de validar
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-blue-200 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-800" />
          Validado (información validada, pendiente de entrega)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-emerald-200 dark:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-800" />
          Entregado
        </span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <nav
          className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700"
          aria-label="Estatus de entregas"
        >
          {PESTAÑAS.map(({ id, label }) => {
            const activa = pestañaActiva === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPestañaActiva(id)}
                className={`-mb-px px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activa
                    ? "border-brand-500 text-brand-600 dark:text-brand-400"
                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                }`}
              >
                {label}
                <span
                  className={`ml-1.5 tabular-nums ${activa ? "" : "text-gray-400 dark:text-gray-500"}`}
                >
                  ({conteosPorPestaña[id]})
                </span>
              </button>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <span className="whitespace-nowrap">Sucursal</span>
            <select
              value={filtroSucursal}
              onChange={(e) => setFiltroSucursal(e.target.value)}
              className="min-w-[160px] rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value={FILTRO_SUCURSAL_TODAS}>Todas</option>
              {sucursalesOpciones.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          {!loading && filteredTableData.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
              Mostrando {rangoMostrado.desde}–{rangoMostrado.hasta} de{" "}
              {filteredTableData.length}
            </p>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {puedeOperar && menu && menuRow && (
        <div
          ref={menuRef}
          className="fixed z-[100] min-w-[220px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1 text-sm"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
        >
          {menuRow.validado &&
            !menuRow.entregado &&
            !editingRecibeRows.has(menu.rowId) && (
              <button
                type="button"
                role="menuitem"
                className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                disabled={savingRows.has(menu.rowId)}
                onClick={() => {
                  setEditingRecibeRows((prev) => new Set(prev).add(menu.rowId));
                  setMenu(null);
                }}
              >
                Editar Persona Acredita
              </button>
            )}
          {editingRecibeRows.has(menu.rowId) && (
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              disabled={savingRows.has(menu.rowId)}
              onClick={() => void actualizarRecibe(menu.apiRow, menu.rowId)}
            >
              Guardar Persona Acredita
            </button>
          )}
          {!menuRow.entregado && menuRow.validado && (
            <button
              type="button"
              role="menuitem"
              className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
              disabled={savingRows.has(menu.rowId)}
              onClick={() =>
                void toggleEntregado(menu.rowId, menu.apiRow, true)
              }
            >
              Marcar como entregado
            </button>
          )}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm flex flex-col">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Cargando canjes…</p>
          </div>
        ) : tableData.length === 0 ? (
          <p className="p-8 text-center text-gray-500 dark:text-gray-400">
            No hay premios canjeados registrados.
          </p>
        ) : filteredTableData.length === 0 ? (
          <p className="p-8 text-center text-gray-500 dark:text-gray-400">
            No hay registros en esta pestaña
            {filtroSucursal !== FILTRO_SUCURSAL_TODAS ? " para la sucursal seleccionada" : ""}.
          </p>
        ) : (
          <>
          <div ref={tableScrollRef} className="max-h-[min(62vh,720px)] overflow-auto">
          <table className="min-w-[1400px] w-full text-sm border-separate border-spacing-0">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-20">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Vendedor
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Sucursal
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Cliente
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  CardCode
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Teléfono
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Cupon
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Premio
                </th>
                <th className="px-2 py-2 text-right font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Cant.
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Fecha canje
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Fecha estimada
                </th>

                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 min-w-[140px]">
                  Observaciones
                </th>
                <th className="sticky right-[162px] z-20 min-w-[130px] bg-gray-50 px-2 py-2 text-left font-medium text-gray-700 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.12)] dark:bg-gray-800 dark:text-gray-300">
                  Persona Acreditada
                </th>
                <th className="sticky right-[52px] z-20 min-w-[110px] whitespace-nowrap bg-gray-50 px-2 py-2 text-left font-medium text-gray-700 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.12)] dark:bg-gray-800 dark:text-gray-300">
                  Fecha entrega
                </th>
                <th className="sticky right-0 z-20 min-w-[52px] whitespace-nowrap bg-gray-50 px-2 py-2 text-center font-medium text-gray-700 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.12)] dark:bg-gray-800 dark:text-gray-300">
                  Validar
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedTableData.map(({ r, rowId, row: m }) => {
                const saving = savingRows.has(rowId);
                const recibeBloqueado =
                  m.validado && !editingRecibeRows.has(rowId);
                return (
                  <tr
                    key={rowId}
                    className={`border-t border-gray-100 dark:border-gray-800 ${puedeOperar ? "cursor-context-menu" : ""} ${rowClass(m.entregado, m.validado)}`}
                    onContextMenu={(e) => {
                      if (!puedeOperar || m.entregado) return;
                      e.preventDefault();
                      setMenu({
                        x: e.clientX,
                        y: e.clientY,
                        rowId,
                        apiRow: r,
                      });
                    }}
                  >
                    <td className="px-2 py-2 align-top whitespace-nowrap max-w-xs">
                      <span
                        className="block whitespace-normal break-words leading-snug"
                        title={r.vendedor?.trim() || "—"}
                      >
                        {r.vendedor?.trim() || "—"}
                      </span>
                    </td>
                    <td className="px-2 py-2 align-top whitespace-nowrap max-w-xs">
                      <span
                        className="block whitespace-normal break-words leading-snug"
                        title={r.sucursal?.trim() || "—"}
                      >
                        {r.sucursal?.trim() || "—"}
                      </span>
                    </td>
                    <td className="px-2 py-2 align-top whitespace-nowrap max-w-xs">
                      <span
                        className="block whitespace-normal break-words leading-snug"
                        title={personaDe(r)}
                      >
                        {personaDe(r)}
                      </span>
                    </td>
                    <td className="px-2 py-2 align-top font-mono text-xs whitespace-nowrap">
                      {r.cardCode?.trim() || "—"}
                    </td>
                    <td className="px-2 py-2 align-top whitespace-nowrap">
                      {telefonoDe(r)}
                    </td>
                    <td className="px-2 py-2 align-top tabular-nums">
                      {cupoDe(r)}
                    </td>
                    <td className="px-2 py-2 align-top max-w-[180px]">
                      <span className="line-clamp-2">{premioDe(r)}</span>
                    </td>
                    <td className="px-2 py-2 align-top text-right tabular-nums">
                      {r.cantidad ?? "—"}
                    </td>
                    <td className="px-2 py-2 align-top whitespace-nowrap text-xs">
                      {formatFecha(fechaCanjeDe(r))}
                    </td>
                    <td className="px-2 py-2 align-top whitespace-nowrap text-xs">
                      {formatFecha(fechaEstimadaDe(r))}
                    </td>
                    <td className="px-2 py-2 align-top">
                      <input
                        type="text"
                        value={m.observaciones}
                        onChange={(e) =>
                          patchUi(rowId, { observaciones: e.target.value }, r)
                        }
                        onKeyDown={(e) =>
                          onObservacionesKeyDown(e, r, rowId)
                        }
                        placeholder="Observaciones (Enter para guardar)"
                        disabled={!puedeOperar || saving}
                        className="w-full min-w-[100px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs disabled:opacity-60"
                      />
                    </td>
                    <td
                      className={`sticky right-[162px] z-[5] min-w-[130px] px-2 py-2 align-top shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)] ${stickyBg(m.entregado, m.validado)}`}
                    >
                      <input
                        type="text"
                        value={m.recibe}
                        onChange={(e) =>
                          patchUi(rowId, { recibe: e.target.value }, r)
                        }
                        onKeyDown={(e) => onRecibeKeyDown(e, r, rowId)}
                        placeholder={
                          editingRecibeRows.has(rowId)
                            ? "Editar y Enter para guardar"
                            : "Quién recibe"
                        }
                        disabled={
                          !puedeOperar ||
                          saving ||
                          m.entregado ||
                          recibeBloqueado
                        }
                        className="w-full min-w-[100px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs disabled:opacity-60"
                      />
                    </td>
                    <td
                      className={`sticky right-[52px] z-[5] min-w-[110px] px-2 py-2 align-top shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)] ${stickyBg(m.entregado, m.validado)}`}
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <BasicDatePicker
                        className="w-full min-w-[100px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs disabled:opacity-60"
                        value={m.fechaEntrega}
                        disabled={!puedeOperar || saving || m.entregado}
                        onOpen={() => setMenu(null)}
                        onChange={(next) =>
                          patchUi(rowId, { fechaEntrega: next }, r)
                        }
                      />
                    </td>
                    <td
                      className={`sticky right-0 z-[5] min-w-[52px] px-2 py-2 align-middle text-center shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)] ${stickyBg(m.entregado, m.validado)}`}
                    >
                      {saving ? (
                        <Loader2 className="mx-auto h-4 w-4 animate-spin text-gray-400" />
                      ) : (
                        <input
                          type="checkbox"
                          checked={m.validado}
                          disabled={
                            !puedeOperar || m.validado || m.entregado
                          }
                          onChange={(e) =>
                            void onValidadoChange(e.target.checked, r, rowId)
                          }
                          title="Confirmo que la información del canje es correcta"
                          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">
              Página {pageSafe} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Página anterior"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={pageSafe >= totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Página siguiente"
              >
                Siguiente
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          </>
        )}
      </div>
    </div>
  );
}


