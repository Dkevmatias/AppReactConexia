import { Loader2, X } from "lucide-react";

type ModalJsonSapDescuentoProps = {
  abierto: boolean;
  json: string;
  onCerrar: () => void;
  onEnviar: () => void;
  enviando?: boolean;
  puedeEnviar?: boolean;
  cardCode: string;
  mensaje?: string | null;
  errorEnvio?: string | null;
};

export default function ModalJsonSapDescuento({
  abierto,
  json,
  onCerrar,
  onEnviar,
  enviando = false,
  puedeEnviar = false,
  cardCode,
  mensaje = null,
  errorEnvio = null,
}: ModalJsonSapDescuentoProps) {
  if (!abierto) return null;

  const cardCodeOk = cardCode.trim().length > 0;
  const sinCardCode = !cardCode.trim();

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(json);
    } catch {
      /* ignore */
    }
  };

  return (
    <div
      className="fixed inset-0 z-[220] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="JSON descuento hacia SAP"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !enviando) onCerrar();
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:rounded-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Enviar Discount Group a SAP
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Revise el payload de{" "}
              <code className="text-[10px]">EnhancedDiscountGroups</code> antes
              de confirmar el envío.
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={enviando}
            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="mb-1 text-xs font-medium text-gray-700 dark:text-gray-300">
            CardCode del cliente
          </p>
          <p className="font-mono text-sm text-gray-900 dark:text-white">
            {cardCode.trim() || "—"}
          </p>
        </div>

        {sinCardCode ? (
          <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            El cliente necesita CardCode antes de enviar el descuento a SAP.
          </p>
        ) : null}
        {mensaje ? (
          <p className="border-b border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            {mensaje}
          </p>
        ) : null}
        {errorEnvio ? (
          <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {errorEnvio}
          </p>
        ) : null}
        <pre className="min-h-0 flex-1 overflow-auto bg-gray-950 p-4 text-xs text-green-100">
          {json}
        </pre>
        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <button
            type="button"
            onClick={() => void copiar()}
            disabled={enviando}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Copiar JSON
          </button>
          <button
            type="button"
            onClick={onEnviar}
            disabled={!puedeEnviar || enviando || !cardCodeOk}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {enviando ? "Enviando…" : "Confirmar y enviar"}
          </button>
        </div>
      </div>
    </div>
  );
}
