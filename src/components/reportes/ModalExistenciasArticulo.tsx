import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Warehouse, X } from "lucide-react";
import {
  articuloService,
  type Articulo,
} from "../../services/articuloService";
import { formatNumber } from "../../utils/format";

export type ContextoExistenciasArticulo = {
  articulo: string;
  codigoProv?: string;
  descripcion?: string;
  marca?: string;
};

type ModalExistenciasArticuloProps = {
  abierto: boolean;
  contexto: ContextoExistenciasArticulo | null;
  onCerrar: () => void;
};

function terminoBusqueda(ctx: ContextoExistenciasArticulo | null): string {
  if (!ctx) return "";
  return (ctx.articulo || ctx.codigoProv || "").trim();
}

export default function ModalExistenciasArticulo({
  abierto,
  contexto,
  onCerrar,
}: ModalExistenciasArticuloProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Articulo[]>([]);

  const cargar = useCallback(async (termino: string) => {
    setLoading(true);
    setError(null);
    setResultados([]);
    try {
      const data = await articuloService.buscarArticulos(termino);
      setResultados(data);
      if (data.length === 0) {
        setError("No se encontraron existencias para este artículo.");
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron consultar las existencias.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!abierto || !contexto) return;
    const termino = terminoBusqueda(contexto);
    if (!termino) {
      setError("El artículo no tiene código para consultar existencias.");
      setResultados([]);
      return;
    }
    void cargar(termino);
  }, [abierto, contexto, cargar]);

  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onCerrar]);

  const filasOrdenadas = useMemo(() => {
    return [...resultados].sort((a, b) => {
      const disp = (b.disponible ?? 0) - (a.disponible ?? 0);
      if (disp !== 0) return disp;
      return (a.almacen ?? "").localeCompare(b.almacen ?? "", "es", {
        sensitivity: "base",
      });
    });
  }, [resultados]);

  const conStock = useMemo(
    () => filasOrdenadas.filter((r) => (r.disponible ?? 0) > 0).length,
    [filasOrdenadas],
  );

  if (!abierto || !contexto) return null;

  const termino = terminoBusqueda(contexto);

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-existencias-articulo-titulo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="flex max-h-[80vh] w-full flex-col rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:max-w-lg sm:rounded-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="min-w-0">
            <h2
              id="modal-existencias-articulo-titulo"
              className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white"
            >
              <Warehouse className="h-4 w-4 shrink-0 text-sky-600" />
              Almacén y existencias
            </h2>
            <p className="mt-0.5 truncate font-mono text-xs text-gray-700 dark:text-gray-300">
              {termino || "—"}
            </p>
            {contexto.descripcion ? (
              <p
                className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400"
                title={contexto.descripcion}
              >
                {contexto.descripcion}
              </p>
            ) : null}
            {(contexto.marca || contexto.codigoProv) && (
              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                {[contexto.marca, contexto.codigoProv]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Cerrar existencias"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Consultando inventario…
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          ) : filasOrdenadas.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Sin datos de existencia por almacén.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                {conStock} almacén{conStock === 1 ? "" : "es"} con stock ·{" "}
                {filasOrdenadas.length} registro
                {filasOrdenadas.length === 1 ? "" : "s"}
              </p>
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-600">
                {filasOrdenadas.map((fila, idx) => (
                  <li
                    key={`${fila.almacen}-${fila.sociedad}-${idx}`}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-gray-900 dark:text-white">
                        {fila.almacen || "—"}
                      </p>
                      {fila.sociedad ? (
                        <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                          {fila.sociedad}
                        </p>
                      ) : null}
                    </div>
                    <span
                      className={`shrink-0 tabular-nums font-semibold ${
                        (fila.disponible ?? 0) > 0
                          ? "text-emerald-700 dark:text-emerald-300"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {formatNumber(fila.disponible ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
