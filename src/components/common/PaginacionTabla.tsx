import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  PAGE_SIZE_OPTIONS,
  type ClientPaginationResult,
} from "../../hooks/useClientPagination";

type PaginacionTablaProps = {
  pagination: Pick<
    ClientPaginationResult<unknown>,
    | "page"
    | "pageSize"
    | "totalItems"
    | "totalPages"
    | "from"
    | "to"
    | "setPage"
    | "setPageSize"
    | "goPrev"
    | "goNext"
  >;
  /** Etiqueta del recurso: "prospecto(s)", "cliente(s)", etc. */
  etiqueta?: string;
  /** Borde superior (abajo del listado) o inferior (arriba del listado). */
  posicion?: "arriba" | "abajo";
  className?: string;
};

export default function PaginacionTabla({
  pagination,
  etiqueta = "registro(s)",
  posicion = "abajo",
  className = "",
}: PaginacionTablaProps) {
  const {
    page,
    pageSize,
    totalItems,
    totalPages,
    from,
    to,
    setPage,
    setPageSize,
    goPrev,
    goNext,
  } = pagination;

  if (totalItems === 0) return null;

  const borde =
    posicion === "arriba"
      ? "border-b border-gray-200 dark:border-gray-700"
      : "border-t border-gray-200 dark:border-gray-700";

  return (
    <div
      className={`flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between ${borde} ${className}`}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Mostrando {from}–{to} de {totalItems} {etiqueta}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
          <span className="whitespace-nowrap">Ver</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            aria-label="Registros por página"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <span className="whitespace-nowrap">por página</span>
        </label>

        <div className="inline-flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={page <= 1}
            className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[4.5rem] text-center text-xs tabular-nums text-gray-600 dark:text-gray-300">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={page >= totalPages}
            className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          {totalPages > 2 ? (
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isFinite(n)) return;
                setPage(Math.min(totalPages, Math.max(1, Math.floor(n))));
              }}
              className="ml-1 w-14 rounded-lg border border-gray-300 px-2 py-1.5 text-center text-xs tabular-nums dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              aria-label="Ir a página"
              title="Ir a página"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
