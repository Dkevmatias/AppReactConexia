import { useEffect } from "react";
import { Download, Loader2, X } from "lucide-react";

export type ModalPrevisualizarPdfCotizacionProps = {
  abierto: boolean;
  url: string | null;
  cargando?: boolean;
  folio?: string | null;
  onCerrar: () => void;
  onDescargar?: () => void;
};

export default function ModalPrevisualizarPdfCotizacion({
  abierto,
  url,
  cargando = false,
  folio,
  onCerrar,
  onDescargar,
}: ModalPrevisualizarPdfCotizacionProps) {
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-pdf-cotizacion-titulo"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="flex h-[min(92vh,900px)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl dark:bg-gray-800">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="min-w-0">
            <h2
              id="preview-pdf-cotizacion-titulo"
              className="truncate text-base font-semibold text-gray-900 dark:text-white"
            >
              Previsualizar PDF
              {folio?.trim() ? ` · Folio ${folio.trim()}` : ""}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Vista previa en la plataforma. Puedes guardar después si está
              correcta.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {onDescargar && url && !cargando ? (
              <button
                type="button"
                onClick={onDescargar}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                <Download className="h-4 w-4" />
                Descargar
              </button>
            ) : null}
            <button
              type="button"
              onClick={onCerrar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              aria-label="Cerrar vista previa"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1 bg-gray-100 dark:bg-gray-900">
          {cargando ? (
            <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Loader2 className="h-5 w-5 animate-spin" />
              Generando vista previa…
            </div>
          ) : url ? (
            <iframe
              title="Vista previa cotización PDF"
              src={url}
              className="h-full w-full border-0"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              No hay PDF para mostrar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
