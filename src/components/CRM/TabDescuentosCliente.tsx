import { useEffect, useMemo, useRef, useState } from "react";
import { Save, Send } from "lucide-react";
import {
  aplicarLimitePorcentaje,
  porcentajeADiscRelEntero,
  sanitizarPorcentajeDescuento,
  sincronizarDescuentosConMarcas,
  type DescuentoClienteForm,
} from "./clienteAltaUtils";
import { prospectoInputClassError, prospectoLabelClass } from "./prospectoFormUtils";
import { getReportesService, type Marca } from "../../services/reportesService";
import ModalAlerta from "../common/ModalAlerta";

type TabDescuentosClienteProps = {
  descuentos: DescuentoClienteForm[];
  onChange: (descuentos: DescuentoClienteForm[]) => void;
  clientePersistido?: boolean;
  onGuardarDescuentos?: () => void | Promise<void>;
  onEnviarDescuentosSap?: () => void | Promise<void>;
  cardCode?: string | null;
  /** Codialub = 1, Codial = 2. Filtra marcas por idEmpresa. */
  idEmpresa?: number | null;
  soloLectura?: boolean;
  camposInvalidos?: Set<string>;
};

function claveMarca(d: DescuentoClienteForm): string {
  if (d.ObjCode) return `code:${d.ObjCode}`;
  if (d.idMarca != null && d.idMarca > 0) return `id:${d.idMarca}`;
  return d.idLocal;
}

export default function TabDescuentosCliente({
  descuentos,
  onChange,
  clientePersistido = false,
  onGuardarDescuentos,
  onEnviarDescuentosSap,
  cardCode = null,
  idEmpresa = null,
  soloLectura = false,
}: TabDescuentosClienteProps) {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [avisosLimite, setAvisosLimite] = useState<Record<string, boolean>>({});
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [alerta, setAlerta] = useState<{ titulo: string; mensaje: string } | null>(
    null,
  );
  const syncHechoRef = useRef(false);
  const empresaSeleccionada =
    idEmpresa != null && idEmpresa > 0 ? idEmpresa : null;

  const meta = descuentos.find((d) => (d.idClienteDescuento ?? 0) > 0);
  const idDescuento = meta?.idClienteDescuento ?? 0;
  const absEntry = meta?.AbsEntry ?? 0;
  const estatusSync = (meta?.EstatusSync ?? "").trim();
  const errorSync = (meta?.ErrorSync ?? "").trim();
  const guardadoEnCrm = idDescuento > 0;
  const enviadoSap =
    estatusSync.toLowerCase() === "enviado" || absEntry > 0;

  useEffect(() => {
    let cancelled = false;
    const cargar = async () => {
      setLoading(true);
      setError(null);
      try {
        const lista = await getReportesService.getMarcas();
        if (cancelled) return;
        setMarcas(lista);
        if (lista.length === 0) {
          setError(
            "El catálogo de marcas respondió vacío. Verifique /api/Marcas/GetMarcas.",
          );
        }
      } catch (err) {
        if (!cancelled) {
          setMarcas([]);
          setError(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las marcas.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void cargar();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    syncHechoRef.current = false;
  }, [empresaSeleccionada]);

  const marcasDeEmpresa = useMemo(() => {
    if (!empresaSeleccionada) return [];
    return marcas.filter((m) => m.idEmpresa === empresaSeleccionada);
  }, [marcas, empresaSeleccionada]);

  const filas = useMemo(() => {
    if (!empresaSeleccionada) return [];
    const lista =
      marcasDeEmpresa.length === 0
        ? []
        : sincronizarDescuentosConMarcas(descuentos, marcasDeEmpresa);
    return [...lista].sort((a, b) =>
      (a.firmName || "").localeCompare(b.firmName || "", "es", {
        sensitivity: "base",
      }),
    );
  }, [marcasDeEmpresa, descuentos, empresaSeleccionada]);

  useEffect(() => {
    if (soloLectura || !empresaSeleccionada || marcasDeEmpresa.length === 0)
      return;
    if (filas.length === 0) return;

    const mismoContenido =
      filas.length === descuentos.length &&
      filas.every((d, i) => {
        const prev = descuentos[i];
        return (
          !!prev &&
          claveMarca(prev) === claveMarca(d) &&
          (prev.porcentaje ?? "") === (d.porcentaje ?? "") &&
          (prev.DiscRel ?? "") === (d.DiscRel ?? "") &&
          (prev.firmName ?? "") === (d.firmName ?? "") &&
          (prev.discountLimit ?? 0) === (d.discountLimit ?? 0)
        );
      });

    if (mismoContenido) {
      syncHechoRef.current = true;
      return;
    }

    onChange(filas);
    syncHechoRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filas, soloLectura, marcasDeEmpresa.length, empresaSeleccionada]);

  const actualizarPorcentaje = (idLocal: string, valor: string) => {
    const base =
      descuentos.length === filas.length && descuentos.length > 0
        ? descuentos
        : filas;
    const actual = base.find((d) => d.idLocal === idLocal);
    const limite = actual?.discountLimit ?? 0;

    const limpio = sanitizarPorcentajeDescuento(valor);
    const { valor: acotado, excedio } = aplicarLimitePorcentaje(limpio, limite);

    setAvisosLimite((prev) => ({ ...prev, [idLocal]: excedio }));

    onChange(
      base.map((d) =>
        d.idLocal === idLocal
          ? {
              ...d,
              porcentaje: acotado,
              DiscRel: porcentajeADiscRelEntero(acotado, d.discountLimit),
            }
          : d,
      ),
    );
  };

  const bloquearNoNumericos = (
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (
      e.ctrlKey ||
      e.metaKey ||
      e.altKey ||
      [
        "Backspace",
        "Delete",
        "Tab",
        "Escape",
        "Enter",
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(e.key)
    ) {
      return;
    }
    if (!/^\d$/.test(e.key) && e.key !== "." && e.key !== ",") {
      e.preventDefault();
    }
  };

  const guardar = async () => {
    if (!onGuardarDescuentos) return;
    setGuardando(true);
    try {
      await onGuardarDescuentos();
    } catch (err) {
      setAlerta({
        titulo: "Error al guardar",
        mensaje:
          err instanceof Error
            ? err.message
            : "No se pudieron guardar los descuentos.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const enviarSap = async () => {
    if (!onEnviarDescuentosSap) return;
    setEnviando(true);
    try {
      await onEnviarDescuentosSap();
    } catch (err) {
      setAlerta({
        titulo: "Error al enviar a SAP",
        mensaje:
          err instanceof Error
            ? err.message
            : "No se pudo enviar el descuento a SAP.",
      });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <fieldset
      disabled={soloLectura}
      className="min-w-0 space-y-4 border-0 p-0 disabled:opacity-90"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
            Descuentos por marca
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Se guarda en el CRM (1 grupo del cliente + una línea por marca con
            %). El envío a SAP usa ese documento ya persistido.
            {empresaSeleccionada === 1
              ? " Marcas de Codialub (empresa 1)."
              : empresaSeleccionada === 2
                ? " Marcas de Codial (empresa 2)."
                : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
            {guardadoEnCrm ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
                Guardado en CRM · #{idDescuento}
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                Sin guardar en CRM
              </span>
            )}
            {absEntry > 0 ? (
              <span className="rounded-full bg-sky-100 px-2 py-0.5 font-medium text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
                AbsEntry SAP {absEntry}
              </span>
            ) : null}
            {estatusSync ? (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                Sync: {estatusSync}
              </span>
            ) : null}
          </div>
          {errorSync ? (
            <p className="mt-1 text-[11px] text-red-600 dark:text-red-300">
              {errorSync}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {onGuardarDescuentos ? (
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={guardando || enviando || !clientePersistido}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
              title={
                clientePersistido
                  ? "Guardar grupo de descuento en CRM"
                  : "Guarde el cliente en CRM primero"
              }
            >
              <Save className="h-3.5 w-3.5" />
              {guardando ? "Guardando…" : "Guardar descuentos"}
            </button>
          ) : null}
          {onEnviarDescuentosSap ? (
            <button
              type="button"
              onClick={() => void enviarSap()}
              disabled={guardando || enviando || !guardadoEnCrm}
              className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
              title={
                !guardadoEnCrm
                  ? "Guarde los descuentos en CRM antes de enviar a SAP"
                  : !cardCode
                    ? "El cliente necesita CardCode para el envío a SAP"
                    : enviadoSap
                      ? "Reenviar grupo de descuento a SAP"
                      : "Enviar grupo de descuento a SAP"
              }
            >
              <Send className="h-3.5 w-3.5" />
              {enviando
                ? "Enviando…"
                : enviadoSap
                  ? "Reenviar a SAP"
                  : "Enviar a SAP"}
            </button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
          Cargando marcas…
        </p>
      ) : !empresaSeleccionada ? (
        <p className="rounded-lg border border-dashed border-amber-300 bg-amber-50 py-10 text-center text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200">
          Seleccione Codialub o Codial para listar las marcas de esa empresa.
        </p>
      ) : filas.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          No hay marcas con idEmpresa {empresaSeleccionada} en el catálogo.
        </p>
      ) : (
        <div className="columns-1 gap-3 sm:columns-2 lg:columns-4">
          {filas.map((d) => {
            const entero =
              d.DiscRel ||
              porcentajeADiscRelEntero(d.porcentaje, d.discountLimit);
            const limite = d.discountLimit ?? 0;
            const excedio = Boolean(avisosLimite[d.idLocal]);
            return (
              <div
                key={claveMarca(d)}
                className="mb-3 break-inside-avoid rounded-lg border border-gray-200 bg-gray-50/70 p-3 dark:border-gray-600 dark:bg-gray-800/50"
              >
                <label
                  className={prospectoLabelClass}
                  htmlFor={`desc-${d.idLocal}`}
                >
                  {d.firmName || `Marca ${d.ObjCode || d.idMarca || "—"}`}
                  {d.ObjCode ? (
                    <span className="ml-1 font-normal text-gray-400">
                      ({d.ObjCode})
                    </span>
                  ) : null}
                </label>
                <div className="relative">
                  <input
                    id={`desc-${d.idLocal}`}
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*[.,]?[0-9]*"
                    value={d.porcentaje ?? ""}
                    onKeyDown={bloquearNoNumericos}
                    onChange={(e) =>
                      actualizarPorcentaje(d.idLocal, e.target.value)
                    }
                    onPaste={(e) => {
                      e.preventDefault();
                      const texto = e.clipboardData.getData("text");
                      actualizarPorcentaje(d.idLocal, texto);
                    }}
                    placeholder="0.00"
                    className={`${prospectoInputClassError(excedio)} pr-10`}
                    title={
                      limite > 0
                        ? `Máximo ${limite}%. Solo números.`
                        : "Solo números"
                    }
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-400">
                    %
                  </span>
                </div>
                <p
                  className={`mt-1 text-[11px] ${
                    excedio
                      ? "font-medium text-amber-700 dark:text-amber-300"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {excedio
                    ? `Máximo permitido: ${limite}%`
                    : limite > 0
                      ? `Máx. ${limite}%${entero ? ` · Se guarda ${entero}%` : ""}`
                      : entero
                        ? `Se guarda como ${entero}%`
                        : "Sin descuento"}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <ModalAlerta
        abierto={Boolean(alerta)}
        titulo={alerta?.titulo ?? ""}
        mensaje={alerta?.mensaje ?? ""}
        onCerrar={() => setAlerta(null)}
      />
    </fieldset>
  );
}
