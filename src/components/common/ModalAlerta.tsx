import { useEffect } from "react";
import Alert from "../ui/alert/Alert";

export type ModalAlertaVariant = "success" | "error" | "warning" | "info";

export type ModalAlertaProps = {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  variant?: ModalAlertaVariant;
  textoBoton?: string;
  onCerrar: () => void;
};

const TITULOS_DEFAULT: Record<ModalAlertaVariant, string> = {
  success: "Listo",
  error: "Error",
  warning: "Atención",
  info: "Información",
};

export function tituloAlertaPorVariant(variant: ModalAlertaVariant): string {
  return TITULOS_DEFAULT[variant];
}

export default function ModalAlerta({
  abierto,
  titulo,
  mensaje,
  variant = "warning",
  textoBoton = "Entendido",
  onCerrar,
}: ModalAlertaProps) {
  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" || event.key === "Enter") onCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const botonClass =
    variant === "error"
      ? "bg-red-600 hover:bg-red-700 focus:ring-red-500"
      : variant === "success"
        ? "bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
        : variant === "info"
          ? "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
          : "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500";

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="modal-alerta-titulo"
      aria-describedby="modal-alerta-mensaje"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-600 dark:bg-gray-800">
        <div className="p-5">
          <div id="modal-alerta-titulo" className="sr-only">
            {titulo}
          </div>
          <div id="modal-alerta-mensaje">
            <Alert variant={variant} title={titulo} message={mensaje} />
          </div>
        </div>
        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-5 py-3 dark:border-gray-700 dark:bg-gray-900/50">
          <button
            type="button"
            autoFocus
            onClick={onCerrar}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${botonClass}`}
          >
            {textoBoton}
          </button>
        </div>
      </div>
    </div>
  );
}
