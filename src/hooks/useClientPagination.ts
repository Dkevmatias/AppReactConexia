import { useEffect, useMemo, useState } from "react";

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200] as const;
export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export type ClientPaginationResult<T> = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  from: number;
  to: number;
  pageItems: T[];
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  goPrev: () => void;
  goNext: () => void;
};

/**
 * Paginación en cliente sobre un arreglo ya filtrado.
 * Reinicia a página 1 cuando cambian los datos o el tamaño de página.
 */
export function useClientPagination<T>(
  items: T[],
  initialPageSize: PageSizeOption = 50,
): ClientPaginationResult<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1);
  const pageSafe = Math.min(Math.max(1, page), totalPages);

  useEffect(() => {
    setPage(1);
  }, [items, pageSize]);

  useEffect(() => {
    if (page !== pageSafe) setPage(pageSafe);
  }, [page, pageSafe]);

  const pageItems = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, pageSafe, pageSize]);

  const from = totalItems === 0 ? 0 : (pageSafe - 1) * pageSize + 1;
  const to = totalItems === 0 ? 0 : Math.min(pageSafe * pageSize, totalItems);

  const setPageSize = (size: number) => {
    setPageSizeState(size > 0 ? size : initialPageSize);
  };

  return {
    page: pageSafe,
    pageSize,
    totalItems,
    totalPages,
    from,
    to,
    pageItems,
    setPage,
    setPageSize,
    goPrev: () => setPage((p) => Math.max(1, p - 1)),
    goNext: () => setPage((p) => Math.min(totalPages, p + 1)),
  };
}
