interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  total: number;
  boletos: any;
}

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  total,
  boletos
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-[90%] max-w-md p-6 animate-fadeIn scale-100">

        {/* TITULO */}
        <h2 className="text-2xl font-bold text-center text-gray-800">
          Confirmar selección
        </h2>

        {/* CONTENIDO */}
        <div className="mt-4 text-sm text-gray-700 space-y-2">
          <p>
            Total seleccionado:
            <span className="font-semibold text-blue-600">
              ${total.toLocaleString()}
            </span>
          </p>

          <div className="bg-gray-100 p-3 rounded-lg text-xs overflow-auto">
            <pre>{JSON.stringify(boletos, null, 2)}</pre>
          </div>
        </div>

        {/* BOTONES */}
        <div className="flex justify-between mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-300 hover:bg-gray-400 transition font-semibold"
          >
            Cancelar
          </button>

          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition font-semibold"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
