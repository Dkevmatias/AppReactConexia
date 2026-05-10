import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import BasicDatePicker from "../../components/ui/datepicker/datepicker";

import {
  cleanDisplayText,
  getPremiosCanjeados,
  idCanjeRow,
  PremioCanjeadoApi,
} from "../../services/canjesPremioService";

const STORAGE_KEY = "entregas-premios-ui-v1";

type UiPatch = {
  recibe: string;
  fechaEntrega: string;
  validado: boolean;
  entregado: boolean;
  observaciones: string;
};

function loadUiMap(): Record<string, UiPatch> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, UiPatch>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveUiMap(map: Record<string, UiPatch>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

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

const fechaSoloDia = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-MX", { dateStyle: "medium" });
};

type MergedRow = PremioCanjeadoApi & UiPatch;

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
    validado: patch ? patch.validado : Boolean(r.validado),
    entregado: patch ? patch.entregado : Boolean(r.entregado),
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
    validado: Boolean(r.validado),
    entregado: Boolean(r.entregado),
  };
}

function rowClass(entregado: boolean, validado: boolean) {
  if (entregado) {
    return "bg-emerald-50 dark:bg-emerald-950/35 hover:bg-emerald-100/80 dark:hover:bg-emerald-950/45";
  }
  if (validado) {
    return "bg-amber-50 dark:bg-amber-950/25 hover:bg-amber-100/70 dark:hover:bg-amber-950/35";
  }
  return "hover:bg-gray-50 dark:hover:bg-gray-700/40";
}

export default function EntregasPremios() {
  const [canjes, setCanjes] = useState<PremioCanjeadoApi[]>([]);
  const [uiMap, setUiMap] = useState<Record<string, UiPatch>>(() =>
    loadUiMap(),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    rowId: string;
    apiRow: PremioCanjeadoApi;
  } | null>(null);

  const menuRef = useRef<HTMLDivElement | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPremiosCanjeados();
      console.log("Premios canjeados:", data);

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
    void cargar();
  }, [cargar]);

  useEffect(() => {
    saveUiMap(uiMap);
  }, [uiMap]);

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

  const patchUi = useCallback(
    (rowId: string, partial: Partial<UiPatch>, base: PremioCanjeadoApi) => {
      setUiMap((prev) => {
        const cur = prev[rowId] ?? initPatchFromApi(base);
        return { ...prev, [rowId]: { ...cur, ...partial } };
      });
    },
    [],
  );

  const tableData = useMemo(() => {
    const sorted = [...canjes].sort((a, b) => {
      const fa = fechaCanjeDe(a) || "";
      const fb = fechaCanjeDe(b) || "";
      return fb.localeCompare(fa);
    });
    return sorted.map((r, i) => {
      const rowId = idCanjeRow(r, i);
      return { r, rowId, row: mergeRow(r, rowId, uiMap) };
    });
  }, [canjes, uiMap]);

  const toggleEntregado = (
    rowId: string,
    base: PremioCanjeadoApi,
    value?: boolean,
  ) => {
    setUiMap((prev) => {
      const cur = prev[rowId] ?? initPatchFromApi(base);
      const next = value !== undefined ? value : !cur.entregado;
      return { ...prev, [rowId]: { ...cur, entregado: next } };
    });
    setMenu(null);
  };

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
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Los datos de recepción, fecha de entrega y estatus se guardan en
            este navegador hasta que exista un endpoint en el servidor.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void cargar()}
          disabled={loading}
          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 self-start"
        >
          Actualizar listado
        </button>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-gray-600 dark:text-gray-400">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-amber-100 dark:bg-amber-900/50 border border-amber-200 dark:border-amber-800" />
          Validado (info correcta)
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-6 rounded bg-emerald-100 dark:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800" />
          Entregado
        </span>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {menu && (
        <div
          ref={menuRef}
          className="fixed z-[100] min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg py-1 text-sm"
          style={{ left: menu.x, top: menu.y }}
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => toggleEntregado(menu.rowId, menu.apiRow, true)}
          >
            Marcar como entregado
          </button>
          <button
            type="button"
            role="menuitem"
            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => toggleEntregado(menu.rowId, menu.apiRow, false)}
          >
            Quitar entregado
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Cargando canjes…</p>
          </div>
        ) : tableData.length === 0 ? (
          <p className="p-8 text-center text-gray-500 dark:text-gray-400">
            No hay premios canjeados registrados.
          </p>
        ) : (
          <table className="min-w-[1400px] w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
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
                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 min-w-[120px]">
                  Recibe
                </th>
                <th className="px-2 py-2 text-left font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Fecha entrega
                </th>
                <th className="px-2 py-2 text-center font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  OK
                </th>
                <th className="px-2 py-2 text-center font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  Entreg.
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map(({ r, rowId, row: m }) => (
                <tr
                  key={rowId}
                  className={`border-t border-gray-100 dark:border-gray-800 cursor-context-menu ${rowClass(m.entregado, m.validado)}`}
                  onContextMenu={(e) => {
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
                      placeholder="Observaciones"
                      className="w-full min-w-[100px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <input
                      type="text"
                      value={m.recibe}
                      onChange={(e) =>
                        patchUi(rowId, { recibe: e.target.value }, r)
                      }
                      placeholder="Quién recibe"
                      className="w-full min-w-[100px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                    />
                  </td>
                  <td className="px-2 py-2 align-top">
                    <BasicDatePicker
                      className="w-full min-w-[100px] rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-xs"
                      value={m.fechaEntrega}
                      onChange={(next) =>
                        patchUi(rowId, { fechaEntrega: next }, r)
                      }
                    />
                  </td>
                  <td className="px-2 py-2 align-middle text-center">
                    <input
                      type="checkbox"
                      checked={m.validado}
                      onChange={(e) =>
                        patchUi(rowId, { validado: e.target.checked }, r)
                      }
                      title="Confirmo que la información del canje es correcta"
                      className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                    />
                  </td>
                  <td className="px-2 py-2 align-middle text-center">
                    <input
                      type="checkbox"
                      checked={m.entregado}
                      onChange={(e) =>
                        patchUi(rowId, { entregado: e.target.checked }, r)
                      }
                      title="Premio entregado"
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
