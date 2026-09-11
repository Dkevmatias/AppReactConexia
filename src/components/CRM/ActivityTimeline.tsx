import { useEffect, useRef, useState } from "react";
import { History, X } from "lucide-react";
import {
  etiquetaTipoActividad,
  formatearFechaActividad,
  type ActivityTimelineItem,
  type TipoActividadTimeline,
} from "../../services/activityTimelineService";

type ActivityTimelineProps = {
  items: ActivityTimelineItem[];
  loading?: boolean;
  titulo?: string;
};

type EstiloTipoTimeline = {
  punto: string;
  card: string;
  badge: string;
  barra: string;
};

/** Colores por tipo: tinte suave en el card + acento lateral para escanear rápido. */
function estiloTipo(tipo: TipoActividadTimeline): EstiloTipoTimeline {
  switch (tipo) {
    case "mensaje":
      return {
        punto: "bg-sky-500",
        barra: "bg-sky-500",
        card: "border-sky-200/80 bg-sky-50/90 dark:border-sky-800/60 dark:bg-sky-950/40",
        badge:
          "bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-200",
      };
    case "llamada":
      return {
        punto: "bg-emerald-500",
        barra: "bg-emerald-500",
        card: "border-emerald-200/80 bg-emerald-50/90 dark:border-emerald-800/60 dark:bg-emerald-950/40",
        badge:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-200",
      };
    case "visita":
      return {
        punto: "bg-amber-500",
        barra: "bg-amber-500",
        card: "border-amber-200/80 bg-amber-50/90 dark:border-amber-800/60 dark:bg-amber-950/40",
        badge:
          "bg-amber-100 text-amber-900 dark:bg-amber-900/70 dark:text-amber-200",
      };
    case "cotizacion":
      return {
        punto: "bg-violet-500",
        barra: "bg-violet-500",
        card: "border-violet-200/80 bg-violet-50/90 dark:border-violet-800/60 dark:bg-violet-950/40",
        badge:
          "bg-violet-100 text-violet-800 dark:bg-violet-900/70 dark:text-violet-200",
      };
    case "nota":
      return {
        punto: "bg-slate-500",
        barra: "bg-slate-500",
        card: "border-slate-200/80 bg-slate-50/90 dark:border-slate-700/60 dark:bg-slate-900/50",
        badge:
          "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
      };
    case "recordatorio":
      return {
        punto: "bg-orange-500",
        barra: "bg-orange-500",
        card: "border-orange-200/80 bg-orange-50/90 dark:border-orange-800/60 dark:bg-orange-950/40",
        badge:
          "bg-orange-100 text-orange-900 dark:bg-orange-900/70 dark:text-orange-200",
      };
    case "etapa":
      return {
        punto: "bg-blue-600",
        barra: "bg-blue-600",
        card: "border-blue-200/80 bg-blue-50/90 dark:border-blue-800/60 dark:bg-blue-950/40",
        badge:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/70 dark:text-blue-200",
      };
    default:
      return {
        punto: "bg-gray-400",
        barra: "bg-gray-400",
        card: "border-gray-200 bg-gray-50/90 dark:border-gray-700 dark:bg-gray-800/60",
        badge:
          "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
      };
  }
}

/**
 * Timeline flotante: no ocupa ancho del formulario.
 * Se abre al pasar el mouse cerca del borde derecho / pestaña;
 * se cierra al salir (con pequeño delay).
 */
export default function ActivityTimeline({
  items,
  loading = false,
  titulo = "Línea de tiempo",
}: ActivityTimelineProps) {
  const [abierto, setAbierto] = useState(false);
  const [fijado, setFijado] = useState(false);
  const closeTimer = useRef<number | null>(null);

  const cancelarCierre = () => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const abrir = () => {
    cancelarCierre();
    setAbierto(true);
  };

  const programarCierre = () => {
    if (fijado) return;
    cancelarCierre();
    closeTimer.current = window.setTimeout(() => {
      setAbierto(false);
    }, 280);
  };

  useEffect(() => {
    return () => cancelarCierre();
  }, []);

  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFijado(false);
        setAbierto(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  const contenido = (
    <>
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            {titulo}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Resumen del prospecto · pase el mouse para revisar
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFijado(false);
            setAbierto(false);
          }}
          className="inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
          aria-label="Cerrar línea de tiempo"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <p className="mt-6 text-center text-xs text-gray-500">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-gray-300 px-3 py-8 text-center dark:border-gray-600">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Aún no hay actividades registradas. Cuando agregue mensajes,
              llamadas, visitas o cotizaciones aparecerán aquí.
            </p>
          </div>
        ) : (
          <ol className="relative ml-2 space-y-0 border-l border-gray-200 dark:border-gray-700">
            {items.map((item) => {
              const estilo = estiloTipo(item.tipo);
              return (
                <li
                  key={`${item.id}-${item.fecha}-${item.titulo}`}
                  className="mb-5 ml-4"
                >
                  <span
                    className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white dark:border-gray-900 ${estilo.punto}`}
                  />
                  <div
                    className={`relative overflow-hidden rounded-md border px-3 py-2 shadow-sm ${estilo.card}`}
                  >
                    <span
                      className={`absolute inset-y-0 left-0 w-1 ${estilo.barra}`}
                      aria-hidden
                    />
                    <div className="pl-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${estilo.badge}`}
                        >
                          {etiquetaTipoActividad(item.tipo)}
                        </span>
                        <time className="text-[10px] text-gray-500 dark:text-gray-400">
                          {formatearFechaActividad(item.fecha)}
                        </time>
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                        {item.titulo}
                      </p>
                      {item.descripcion ? (
                        <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-300">
                          {item.descripcion}
                        </p>
                      ) : null}
                      {item.nombreUsuario ? (
                        <p className="mt-1 text-[10px] text-gray-400">
                          {item.nombreUsuario}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="shrink-0 border-t border-gray-100 px-4 py-2 dark:border-gray-700">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <input
            type="checkbox"
            checked={fijado}
            onChange={(e) => setFijado(e.target.checked)}
            className="rounded border-gray-300"
          />
          Mantener abierto
        </label>
      </div>
    </>
  );

  return (
    <>
      {/* Zona sensible del borde derecho: al acercar el mouse abre el panel */}
      <div
        className="pointer-events-none fixed inset-y-0 right-0 z-[180] hidden w-6 md:block"
        aria-hidden
      >
        <div
          className="pointer-events-auto h-full w-full"
          onMouseEnter={abrir}
        />
      </div>

      {/* Pestaña compacta siempre visible */}
      <button
        type="button"
        onMouseEnter={abrir}
        onFocus={abrir}
        onClick={() => {
          setFijado(true);
          setAbierto(true);
        }}
        className={`fixed right-0 top-1/2 z-[185] flex -translate-y-1/2 flex-col items-center gap-1 rounded-l-lg border border-r-0 border-gray-300 bg-white px-1.5 py-3 shadow-md transition-colors hover:bg-blue-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 ${
          abierto ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        aria-expanded={abierto}
        aria-label="Abrir línea de tiempo del prospecto"
        title="Activity Timeline"
      >
        <History className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span
          className="text-[10px] font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          Timeline
        </span>
        {items.length > 0 ? (
          <span className="rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
            {items.length}
          </span>
        ) : null}
      </button>

      {/* Panel deslizante */}
      <aside
        className={`fixed inset-y-0 right-0 z-[190] flex w-[min(100vw,360px)] flex-col border-l border-gray-200 bg-white shadow-2xl transition-transform duration-200 ease-out dark:border-gray-700 dark:bg-gray-900 ${
          abierto ? "translate-x-0" : "translate-x-full"
        }`}
        onMouseEnter={abrir}
        onMouseLeave={programarCierre}
        aria-hidden={!abierto}
      >
        {contenido}
      </aside>
    </>
  );
}
