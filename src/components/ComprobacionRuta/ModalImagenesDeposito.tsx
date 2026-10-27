import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Images, Loader2, Trash2, X } from "lucide-react";
import {
  incidenciaDepositoService,
  MAX_FOTOS_DEPOSITO,
  MAX_MB_FOTO_DEPOSITO,
  validarArchivoDeposito,
  type IncidenciaDeposito,
} from "../../services/incidenciaDepositoService";

export type ModoModalImagenesDeposito = "adjuntar" | "ver";

type Pendiente = {
  idLocal: string;
  file: File;
  previewUrl: string;
};

type Props = {
  abierto: boolean;
  modo: ModoModalImagenesDeposito;
  idODistribucion: number | null;
  onCerrar: () => void;
  onCambio?: () => void;
};

function formatearFecha(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ModalImagenesDeposito({
  abierto,
  modo,
  idODistribucion,
  onCerrar,
  onCambio,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [guardadas, setGuardadas] = useState<IncidenciaDeposito[]>([]);
  const [pendientes, setPendientes] = useState<Pendiente[]>([]);
  const [loading, setLoading] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [vistaId, setVistaId] = useState<number | null>(null);
  const [vistaUrl, setVistaUrl] = useState<string | null>(null);
  const [cargandoVista, setCargandoVista] = useState(false);

  const cupo = Math.max(0, MAX_FOTOS_DEPOSITO - guardadas.length);
  const slotsLibres = Math.max(0, cupo - pendientes.length);
  const puedeAdjuntar = modo === "adjuntar" && slotsLibres > 0;

  const titulo = useMemo(() => {
    const folio = idODistribucion ?? "—";
    return modo === "adjuntar"
      ? `Adjuntar imágenes — Folio ${folio}`
      : `Imágenes del depósito — Folio ${folio}`;
  }, [modo, idODistribucion]);

  const revocarPendientes = useCallback((items: Pendiente[]) => {
    for (const item of items) URL.revokeObjectURL(item.previewUrl);
  }, []);

  const limpiarThumbs = useCallback((mapa: Record<number, string>) => {
    for (const url of Object.values(mapa)) URL.revokeObjectURL(url);
  }, []);

  const cargarGuardadas = useCallback(async (folio: number) => {
    setLoading(true);
    setError(null);
    try {
      const lista = await incidenciaDepositoService.listarPorOd(folio);
      setGuardadas(lista);
    } catch (err) {
      console.error(err);
      setGuardadas([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las imágenes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!abierto || !idODistribucion || idODistribucion <= 0) {
      setGuardadas([]);
      setError(null);
      setMensajeOk(null);
      setVistaId(null);
      setVistaUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPendientes((prev) => {
        revocarPendientes(prev);
        return [];
      });
      return;
    }
    void cargarGuardadas(idODistribucion);
  }, [abierto, idODistribucion, cargarGuardadas, revocarPendientes]);

  const cerrarVista = useCallback(() => {
    setVistaId(null);
    setVistaUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!abierto) {
      setThumbs((prev) => {
        limpiarThumbs(prev);
        return {};
      });
      return;
    }
    const ids = guardadas.map((g) => g.idIncidenciaDeposito);
    if (ids.length === 0) return;
    let cancelado = false;
    void (async () => {
      const resultados = await Promise.all(
        ids.map(async (id) => {
          try {
            const blob = await incidenciaDepositoService.obtenerArchivoBlob(id);
            return [id, URL.createObjectURL(blob)] as const;
          } catch {
            return [id, null] as const;
          }
        }),
      );
      if (cancelado) {
        for (const [, url] of resultados) {
          if (url) URL.revokeObjectURL(url);
        }
        return;
      }
      const siguiente: Record<number, string> = {};
      for (const [id, url] of resultados) {
        if (url) siguiente[id] = url;
      }
      setThumbs((prev) => {
        limpiarThumbs(prev);
        return siguiente;
      });
    })();
    return () => {
      cancelado = true;
    };
  }, [abierto, guardadas, limpiarThumbs]);

  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (vistaId != null) {
          cerrarVista();
          return;
        }
        onCerrar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onCerrar, vistaId, cerrarVista]);

  useEffect(() => {
    return () => {
      setPendientes((prev) => {
        revocarPendientes(prev);
        return [];
      });
      setThumbs((prev) => {
        limpiarThumbs(prev);
        return {};
      });
      setVistaUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [revocarPendientes, limpiarThumbs]);

  const agregarArchivos = (lista: FileList | File[]) => {
    const files = Array.from(lista);
    if (files.length === 0) return;
    setError(null);
    setMensajeOk(null);
    const disponibles = cupo - pendientes.length;
    if (disponibles <= 0) {
      setError(
        `Ya hay ${MAX_FOTOS_DEPOSITO} fotos para este folio (subidas o pendientes).`,
      );
      return;
    }
    const aceptados: Pendiente[] = [];
    for (const file of files) {
      if (aceptados.length >= disponibles) break;
      const motivo = validarArchivoDeposito(file);
      if (motivo) {
        setError(motivo);
        continue;
      }
      aceptados.push({
        idLocal: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 7)}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (aceptados.length > 0) {
      setPendientes((prev) => [...prev, ...aceptados]);
    }
  };

  const quitarPendiente = (idLocal: string) => {
    setPendientes((prev) => {
      const item = prev.find((p) => p.idLocal === idLocal);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.idLocal !== idLocal);
    });
  };

  const enviar = async () => {
    if (!idODistribucion || idODistribucion <= 0) return;
    if (pendientes.length === 0) {
      setError("Seleccione al menos una imagen.");
      return;
    }
    setEnviando(true);
    setError(null);
    setMensajeOk(null);
    try {
      await incidenciaDepositoService.subir(
        idODistribucion,
        pendientes.map((p) => p.file),
      );
      setPendientes((prev) => {
        revocarPendientes(prev);
        return [];
      });
      await cargarGuardadas(idODistribucion);
      setMensajeOk("Imágenes adjuntadas correctamente.");
      onCambio?.();
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudieron subir las imágenes.",
      );
    } finally {
      setEnviando(false);
    }
  };

  const abrirVista = async (id: number) => {
    setVistaId(id);
    setCargandoVista(true);
    setError(null);
    setVistaUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    try {
      const blob = await incidenciaDepositoService.obtenerArchivoBlob(id);
      setVistaUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo abrir la imagen.",
      );
      setVistaId(null);
    } finally {
      setCargandoVista(false);
    }
  };

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[230] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-imagenes-deposito-titulo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="flex max-h-[100dvh] w-full max-w-2xl flex-col rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:max-h-[90vh] sm:rounded-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div>
            <h3
              id="modal-imagenes-deposito-titulo"
              className="text-base font-semibold text-gray-900 dark:text-white"
            >
              {titulo}
            </h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Máximo {MAX_FOTOS_DEPOSITO} fotos por folio · jpg, png o webp ·{" "}
              {MAX_MB_FOTO_DEPOSITO} MB c/u
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {error ? (
            <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </p>
          ) : null}
          {mensajeOk ? (
            <p className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
              {mensajeOk}
            </p>
          ) : null}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando imágenes…
            </div>
          ) : (
            <>
              {guardadas.length > 0 ? (
                <div className="mb-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Archivos subidos ({guardadas.length}/{MAX_FOTOS_DEPOSITO})
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {guardadas.map((foto, idx) => (
                      <button
                        key={foto.idIncidenciaDeposito}
                        type="button"
                        onClick={() => void abrirVista(foto.idIncidenciaDeposito)}
                        className="group relative overflow-hidden rounded-lg border border-gray-200 bg-gray-50 text-left dark:border-gray-600 dark:bg-gray-900/40"
                      >
                        {thumbs[foto.idIncidenciaDeposito] ? (
                          <img
                            src={thumbs[foto.idIncidenciaDeposito]}
                            alt={`Foto ${idx + 1}`}
                            className="h-24 w-full object-cover sm:h-28"
                          />
                        ) : (
                          <div className="flex h-24 flex-col items-center justify-center gap-1 text-[11px] text-gray-500 sm:h-28">
                            <Images className="h-5 w-5" />
                            Ver foto {idx + 1}
                          </div>
                        )}
                        <span className="block truncate px-1.5 py-1 text-[10px] text-gray-600 dark:text-gray-300">
                          {formatearFecha(foto.fechaCreacion) || `Foto ${idx + 1}`}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    Toque una foto para verla a tamaño completo.
                  </p>
                </div>
              ) : modo === "ver" ? (
                <p className="py-8 text-center text-sm text-gray-500">
                  No hay imágenes adjuntas a este folio.
                </p>
              ) : null}

              {modo === "adjuntar" ? (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Pendientes de enviar ({pendientes.length}/{cupo} cupos)
                  </p>
                  {pendientes.length > 0 ? (
                    <div className="mb-3 grid grid-cols-3 gap-2">
                      {pendientes.map((item) => (
                        <div
                          key={item.idLocal}
                          className="relative overflow-hidden rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
                        >
                          <img
                            src={item.previewUrl}
                            alt={item.file.name}
                            className="h-24 w-full object-cover sm:h-28"
                          />
                          <button
                            type="button"
                            onClick={() => quitarPendiente(item.idLocal)}
                            className="absolute right-1 top-1 inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-md bg-black/65 text-white hover:bg-black/80"
                            aria-label={`Quitar ${item.file.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <p className="truncate px-1.5 py-1 text-[10px] text-gray-700 dark:text-gray-200">
                            {item.file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                      {cupo > 0
                        ? "Seleccione 1 a 3 imágenes, revíselas y envíe. Puede quitar una si no es correcta."
                        : "Este folio ya tiene 3 fotos. No se pueden adjuntar más."}
                    </p>
                  )}
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) agregarArchivos(e.target.files);
                      e.target.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    disabled={!puedeAdjuntar || enviando}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                  >
                    <ImagePlus className="h-4 w-4" />
                    Elegir imágenes
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 px-4 py-3 sm:flex-row sm:justify-end dark:border-gray-700">
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Cerrar
          </button>
          {modo === "adjuntar" ? (
            <button
              type="button"
              onClick={() => void enviar()}
              disabled={enviando || pendientes.length === 0 || cupo <= 0}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Enviar {pendientes.length > 0 ? `(${pendientes.length})` : ""}
            </button>
          ) : null}
        </div>
      </div>

      {vistaId != null ? (
        <div
          className="fixed inset-0 z-[240] flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Vista de imagen"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrarVista();
          }}
        >
          <button
            type="button"
            onClick={cerrarVista}
            className="absolute right-4 top-4 inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg bg-white/90 text-gray-800"
            aria-label="Cerrar vista"
          >
            <X className="h-5 w-5" />
          </button>
          {cargandoVista || !vistaUrl ? (
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          ) : (
            <img
              src={vistaUrl}
              alt="Imagen del depósito"
              className="max-h-[90vh] max-w-full rounded-lg object-contain"
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
