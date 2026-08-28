import { useEffect } from "react";
import Alert from "../ui/alert/Alert";

export type ModalConfirmacionProps = {
  abierto: boolean;
  titulo: string;
  mensaje: string;
  textoConfirmar?: string;
  textoCancelar?: string;
  confirmando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
};

export default function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  confirmando = false,
  onConfirmar,
  onCancelar,
}: ModalConfirmacionProps) {
  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !confirmando) onCancelar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, confirmando, onCancelar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !confirmando) onCancelar();
      }}
    >
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-600 dark:bg-gray-800">
        <Alert variant="info" title={titulo} message={mensaje} />

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancelar}
            disabled={confirmando}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={confirmando}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
