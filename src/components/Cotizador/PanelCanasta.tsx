import { useEffect, useState } from "react";
import { Loader2, Save, ShoppingCart, Trash2, UserPlus, X } from "lucide-react";
import type { CotizadorCanastaItem } from "../../services/cotizadorService";
import { formatCurrency } from "../../utils/format";

export type PanelCanastaProps = {
  abierto: boolean;
  items: CotizadorCanastaItem[];
  clienteNombre: string;
  clienteCardCode: string;
  clienteEsSap: boolean;
  entregarEn: string;
  ivaPorcentaje: number;
  ordenCompra: string;
  observaciones: string;
  telefonoWhatsApp: string;
  enviandoWhatsApp: boolean;
  guardando: boolean;
  /** true cuando ya hay folio BD (cotización guardada). */
  cotizacionGuardada: boolean;
  onClienteNombre: (v: string) => void;
  onEntregarEn: (v: string) => void;
  onIvaPorcentaje: (v: number) => void;
  onOrdenCompra: (v: string) => void;
  onObservaciones: (v: string) => void;
  onTelefonoWhatsApp: (v: string) => void;
  onAgregarClienteSap: () => void;
  onQuitarClienteSap: () => void;
  onCerrar: () => void;
  onQuitar: (id: string) => void;
  onCambiarCantidad: (id: string, cantidad: number) => void;
  onVaciar: () => void;
  onPrevisualizarPdf: () => void;
  onEnviarWhatsApp: () => void;
  onGuardar: () => void;
  previsualizandoPdf?: boolean;
};

export default function PanelCanasta({
  abierto,
  items,
  clienteNombre,
  clienteCardCode,
  clienteEsSap,
  entregarEn,
  ivaPorcentaje,
  ordenCompra,
  observaciones,
  telefonoWhatsApp,
  enviandoWhatsApp,
  guardando,
  cotizacionGuardada,
  onClienteNombre,
  onEntregarEn,
  onIvaPorcentaje,
  onOrdenCompra,
  onObservaciones,
  onTelefonoWhatsApp,
  onAgregarClienteSap,
  onQuitarClienteSap,
  onCerrar,
  onQuitar,
  onCambiarCantidad,
  onVaciar,
  onPrevisualizarPdf,
  onEnviarWhatsApp,
  onGuardar,
  previsualizandoPdf = false,
}: PanelCanastaProps) {
  const subtotal = items.reduce((sum, item) => sum + item.importe, 0);
  const [isDisabledFolio, setIsDisabledFolio] = useState(true);
  console.log("ivaPorcentaje", items);
  const ivaPct = Number.isFinite(ivaPorcentaje)
    ? Math.max(0, ivaPorcentaje)
    : 16;
  const iva = subtotal * (ivaPct / 100);
  const total = subtotal + iva;

  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[210] flex justify-end bg-black/45"
      role="dialog"
      aria-modal="true"
      aria-labelledby="panel-canasta-titulo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="flex h-full w-full max-w-lg flex-col border-l border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <div>
            <h2
              id="panel-canasta-titulo"
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Canasta de cotización
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              {items.length} artículo(s) · Se conserva al buscar otros códigos
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Cerrar canasta"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-4 space-y-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-600 dark:bg-gray-900/40">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                Datos del cliente
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onAgregarClienteSap}
                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Agregar Cliente SAP
                </button>
                {clienteEsSap ? (
                  <button
                    type="button"
                    onClick={onQuitarClienteSap}
                    className="inline-flex min-h-[36px] items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    Usar manual
                  </button>
                ) : null}
              </div>
            </div>
            {clienteEsSap ? (
              <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-800 dark:bg-sky-900/20 dark:text-sky-100">
                Cliente SAP · {clienteCardCode || "—"} · Los importes usan
                descuentos por marca de SAP.
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Modo manual: descuentos automáticos o personalizados por marca.
              </p>
            )}
            <div>
              <label
                htmlFor="cotizacion-cliente"
                className="mb-1 block text-xs text-gray-500"
              >
                Nombre del cliente
              </label>
              <input
                id="cotizacion-cliente"
                type="text"
                value={clienteNombre}
                onChange={(e) => onClienteNombre(e.target.value)}
                disabled={clienteEsSap}
                placeholder="Ej. CLIENTE MOSTRADOR"
                className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-800"
              />
            </div>
            <div>
              <label
                htmlFor="cotizacion-entregar"
                className="mb-1 block text-xs text-gray-500"
              >
                Entregar en
              </label>
              <textarea
                id="cotizacion-entregar"
                rows={2}
                value={entregarEn}
                onChange={(e) => onEntregarEn(e.target.value)}
                placeholder="Dirección de entrega"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="cotizacion-oc"
                  className="mb-1 block text-xs text-gray-500"
                >
                  Folio
                </label>
                <input
                  id="cotizacion-oc"
                  disabled={isDisabledFolio}
                  type="text"
                  value={ordenCompra}
                  onChange={(e) => onOrdenCompra(e.target.value)}
                  className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label
                  htmlFor="cotizacion-iva"
                  className="mb-1 block text-xs text-gray-500"
                >
                  IVA %
                </label>
                <input
                  id="cotizacion-iva"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  value={ivaPorcentaje}
                  onChange={(e) => onIvaPorcentaje(Number(e.target.value) || 0)}
                  className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="cotizacion-obs"
                className="mb-1 block text-xs text-gray-500"
              >
                Observaciones
              </label>
              <textarea
                id="cotizacion-obs"
                rows={2}
                value={observaciones}
                onChange={(e) => onObservaciones(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="cotizacion-whatsapp"
                className="mb-1 block text-xs text-gray-500"
              >
                WhatsApp (enviar cotización)
              </label>
              <input
                id="cotizacion-whatsapp"
                type="tel"
                inputMode="tel"
                value={telefonoWhatsApp}
                onChange={(e) => onTelefonoWhatsApp(e.target.value)}
                disabled={!cotizacionGuardada || guardando}
                placeholder="9711165434 o 529711165434"
                className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:cursor-not-allowed disabled:opacity-60"
              />
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                {cotizacionGuardada
                  ? "Se descarga el PDF y se abre WhatsApp Web/app. En móvil puede ofrecer compartir el archivo directo."
                  : "Guarda la cotización para obtener folio y poder enviarla por WhatsApp."}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              <ShoppingCart className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p>Aún no hay artículos en la canasta.</p>
              <p className="mt-1 text-xs">
                Usa el botón + en las tarjetas de marca para agregar.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-600 dark:bg-gray-900/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {item.marca}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Prov. {item.codigo || "—"} · Clave{" "}
                        {item.codigoCodialub?.trim() || "—"}
                        {item.unidad ? ` · ${item.unidad}` : ""}
                      </p>
                      {item.descripcion ? (
                        <p className="mt-1 line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                          {item.descripcion}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={() => onQuitar(item.id)}
                      className="inline-flex min-h-[36px] min-w-[36px] shrink-0 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      aria-label={`Quitar ${item.marca}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">
                        Cantidad
                      </label>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={item.cantidad}
                        onChange={(e) =>
                          onCambiarCantidad(item.id, Number(e.target.value))
                        }
                        className="w-24 min-h-[40px] rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-xs text-gray-500">
                        Lista {formatCurrency(item.precioLista)} · c/u{" "}
                        {formatCurrency(item.precioConDescuento)}
                      </p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(item.importe)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="shrink-0 space-y-3 border-t border-gray-200 px-4 py-4 dark:border-gray-700">
          <div className="space-y-1 text-sm">
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
              <span>IVA {ivaPct}%</span>
              <span className="tabular-nums">{formatCurrency(iva)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-800 dark:text-gray-200">
                Total
              </span>
              <span className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">
                {formatCurrency(total)}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={items.length === 0 || guardando}
              onClick={onGuardar}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Guardar
                </>
              )}
            </button>
            <div className="flex flex-col gap-2 sm:flex-row">
              {items.length > 0 ? (
                <button
                  type="button"
                  onClick={onVaciar}
                  disabled={guardando}
                  className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Vaciar canasta
                </button>
              ) : null}
              <button
                type="button"
                disabled={items.length === 0 || guardando || previsualizandoPdf}
                onClick={onPrevisualizarPdf}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {previsualizandoPdf ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generando…
                  </>
                ) : (
                  "Previsualizar PDF"
                )}
              </button>
            </div>
            <button
              type="button"
              disabled={
                items.length === 0 ||
                !cotizacionGuardada ||
                enviandoWhatsApp ||
                guardando ||
                !telefonoWhatsApp.trim()
              }
              onClick={onEnviarWhatsApp}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#1ebe57] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviandoWhatsApp ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparando…
                </>
              ) : (
                "Enviar por WhatsApp"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
