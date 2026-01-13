import React from "react";

interface LegalModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LegalModal({ open, onClose }: LegalModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <h2 className="text-lg font-semibold mb-4">
          Términos legales
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Antes de continuar, revisa nuestros documentos legales:
        </p>

        <div className="space-y-3">
          <a
            href="/legal/terminos-y-condiciones.pdf"
            target="_blank"
            className="block w-full rounded-lg border px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5"
          >
            📄 Términos y Condiciones
          </a>

          <a
            href="/legal/aviso-de-privacidad.pdf"
            target="_blank"
            className="block w-full rounded-lg border px-4 py-3 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5"
          >
            🔒 Aviso de Privacidad
          </a>
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-black text-white hover:bg-gray-900"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
