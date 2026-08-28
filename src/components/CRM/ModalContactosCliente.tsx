import { UserPlus, X } from "lucide-react";

type ModalContactosClienteProps = {
  abierto: boolean;
  onCerrar: () => void;
};

export default function ModalContactosCliente({
  abierto,
  onCerrar,
}: ModalContactosClienteProps) {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Agregar contactos"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Agregar contactos
            </h3>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Aquí podrá registrar uno o más contactos del cliente. El formulario de
          contactos se configurará en una siguiente etapa.
        </p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onCerrar}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
