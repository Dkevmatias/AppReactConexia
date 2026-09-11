import { useEffect, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";

type ModalDetalleRegistroProps = {
  abierto: boolean;
  titulo: string;
  subtitulo?: string | null;
  cargando?: boolean;
  error?: string | null;
  onCerrar: () => void;
  children?: ReactNode;
  footer?: ReactNode;
};

export function CampoDetalle({
  label,
  valor,
}: {
  label: string;
  valor: ReactNode;
}) {
  const vacio =
    valor == null ||
    valor === "" ||
    (typeof valor === "string" && !valor.trim());
  return (
    <div>
      <dt className="text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-gray-900 dark:text-white">
        {vacio ? "—" : valor}
      </dd>
    </div>
  );
}

export default function ModalDetalleRegistro({
  abierto,
  titulo,
  subtitulo = null,
  cargando = false,
  error = null,
  onCerrar,
  children,
  footer,
}: ModalDetalleRegistroProps) {
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:rounded-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {titulo}
            </h3>
            {subtitulo ? (
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {subtitulo}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {cargando ? (
            <p className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando detalle…
            </p>
          ) : error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </p>
          ) : (
            children
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          {footer ?? (
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
