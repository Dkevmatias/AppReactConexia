import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Loader2,
  Package,
  Percent,
  Plus,
  RotateCcw,
  Search,
  ShoppingCart,
  UserPlus,
  Warehouse,
  X,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { PanelCanasta } from "../../components/Cotizador";
import { useAuth } from "../../hooks/useAuth";
import {
  getContextoOperativoPersona,
  type ContextoOperativoPersona,
} from "../../services/authService";
import {
  calcularPrecioConDescuento,
  claveMarcaCotizador,
  cotizadorService,
  CotizadorBusquedaResponse,
  CotizadorCanastaItem,
  CotizadorClienteSapResumen,
  CotizadorDescuentoClienteSap,
  CotizadorDescuentoMarca,
  CotizadorDireccionEntrega,
  CotizadorExistencia,
  CotizadorResultado,
  descuentoSapPctAFraccion,
  filasDescuentoDeCliente,
  filtrarDescuentosClientePorSociedad,
  formatearDireccionEntrega,
  ivaDesdeTaxCode,
  recalcularResultadoConDescuento,
  resolverDescuentoCatalogoParaMarca,
  resolverDescuentoSapParaItem,
} from "../../services/cotizadorService";
import { formatCurrency } from "../../utils/format";
import {
  crearBlobPdfCotizacion,
  descargarBlobPdf,
  enviarCotizacionPorWhatsApp,
  fechaEmisionCotizacion,
  nombreArchivoCotizacion,
  type DatosPdfCotizacion,
} from "./generarPdfCotizacion";
import ModalPrevisualizarPdfCotizacion from "../../components/Cotizador/ModalPrevisualizarPdfCotizacion";

const ALMACEN_EXCLUIDO = "bodega pencil tuxtla";

/** Oculta marcas vacías: sin SAP y sin equivalencia. */
function resultadoEsVisible(item: CotizadorResultado): boolean {
  return Boolean(
    item.encontradoSap || item.tieneEquivalente || item.tieneCodialub,
  );
}

function claveCanastaItem(
  item: Pick<CotizadorResultado, "marca" | "codigoCodialub" | "codigo">,
): string {
  const codigo =
    (item.codigoCodialub ?? "").trim() ||
    (item.codigo ?? "").trim() ||
    "sin-codigo";
  return `${claveMarcaCotizador(item.marca)}::${codigo.toLowerCase()}`;
}

function crearItemCanasta(
  item: CotizadorResultado,
  cantidad: number,
  codigoBusqueda: string,
): CotizadorCanastaItem {
  const qty = Math.max(1, Math.trunc(cantidad) || 1);
  const precioConDescuento = item.precioConDescuento;
  return {
    id: claveCanastaItem(item),
    marca: item.marca,
    firmCode: item.firmCode,
    codigo: item.codigo?.trim() || "",
    codigoCodialub: item.codigoCodialub,
    descripcion: item.descripcion,
    unidad: item.unidad,
    codigoBusqueda: codigoBusqueda.trim(),
    cantidad: qty,
    precioLista: item.precioLista,
    descuentoBase: item.descuentoBase,
    descuentoAdicional: item.descuentoAdicional,
    precioConDescuento,
    importe: precioConDescuento * qty,
  };
}

function recalcularItemCanastaConSap(
  item: CotizadorCanastaItem,
  descuentosSap: CotizadorDescuentoClienteSap[],
): CotizadorCanastaItem {
  const sap = resolverDescuentoSapParaItem(item, descuentosSap);
  if (!sap) return item;
  const base = descuentoSapPctAFraccion(sap.discount);
  const precioConDescuento = calcularPrecioConDescuento(
    item.precioLista,
    base,
    0,
  );
  return {
    ...item,
    descuentoBase: base,
    descuentoAdicional: 0,
    precioConDescuento,
    importe: precioConDescuento * item.cantidad,
  };
}

function pct(valor: number): string {
  if (!Number.isFinite(valor) || valor <= 0) return "—";
  return `${(valor * 100).toFixed(0)}%`;
}

/** Convierte fraction (0.45) ↔ porcentaje editable (45). */
function fractionToPctInput(valor: number): string {
  if (!Number.isFinite(valor)) return "0";
  return String(Math.round(valor * 1000) / 10);
}

function pctInputToFraction(raw: string): number | null {
  const n = Number(raw.replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return Math.min(100, Math.max(0, n)) / 100;
}

function normalizarNombreAlmacen(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Existencias visibles: sin Bodega Pencil Tuxtla y sin disponible 0. */
function filtrarExistenciasVisibles(
  existencias: CotizadorExistencia[],
): CotizadorExistencia[] {
  return existencias.filter((e) => {
    if ((e.disponible ?? 0) <= 0) return false;
    const nombre = normalizarNombreAlmacen(e.almacen ?? "");
    if (!nombre) return false;
    if (nombre === ALMACEN_EXCLUIDO || nombre.includes(ALMACEN_EXCLUIDO)) {
      return false;
    }
    return true;
  });
}

function ModalExistencias({
  abierto,
  marca,
  codigo,
  existencias,
  onCerrar,
}: {
  abierto: boolean;
  marca: string;
  codigo: string;
  existencias: CotizadorExistencia[];
  onCerrar: () => void;
}) {
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
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-existencias-titulo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="flex max-h-[70vh] w-full flex-col rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:max-w-md sm:rounded-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="min-w-0">
            <h2
              id="modal-existencias-titulo"
              className="text-base font-semibold text-gray-900 dark:text-white"
            >
              Existencias
            </h2>
            <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
              {marca}
              {codigo ? ` · ${codigo}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Cerrar existencias"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {existencias.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay existencias disponibles en otros almacenes.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-600">
              {existencias.map((e) => (
                <li
                  key={e.almacen}
                  className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                >
                  <span className="min-w-0 truncate font-medium text-gray-900 dark:text-white">
                    {e.almacen}
                    {e.esAlmacenVendedor ? (
                      <span className="ml-1.5 text-xs font-normal text-blue-600 dark:text-blue-300">
                        (vendedor)
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 tabular-nums font-semibold text-gray-800 dark:text-gray-200">
                    {e.disponible}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 justify-end border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[40px] items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultadoCard({
  item,
  personalizado,
  descuentoSap,
  enCanasta,
  onAgregar,
}: {
  item: CotizadorResultado;
  personalizado?: boolean;
  descuentoSap?: boolean;
  enCanasta?: boolean;
  onAgregar: (item: CotizadorResultado) => void;
}) {
  const [modalExistenciasAbierto, setModalExistenciasAbierto] = useState(false);
  const sinMatch = !item.encontradoSap && !item.tieneCodialub;
  const existenciasVisibles = useMemo(
    () => filtrarExistenciasVisibles(item.existencias ?? []),
    [item.existencias],
  );
  const codigoMostrar =
    item.codigoCodialub?.trim() || item.codigo?.trim() || "";
  const puedeAgregar = item.precioLista > 0 || item.precioConDescuento > 0;

  return (
    <>
      <article
        className={`rounded-xl border p-4 shadow-sm ${
          sinMatch
            ? "border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20"
            : descuentoSap
              ? "border-sky-300 bg-sky-50/40 dark:border-sky-700 dark:bg-sky-950/20"
              : personalizado
                ? "border-violet-300 bg-violet-50/40 dark:border-violet-700 dark:bg-violet-950/20"
                : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
        }`}
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Marca
            </p>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {item.marca}
            </h3>
          </div>
          <div className="flex flex-col items-end gap-1">
            {item.encontradoSap ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                En SAP
              </span>
            ) : (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                Sin SAP
              </span>
            )}
            {personalizado ? (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800 dark:bg-violet-900/40 dark:text-violet-200">
                Desc. personalizado
              </span>
            ) : null}
            {descuentoSap ? (
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-200">
                Desc. cliente SAP
              </span>
            ) : null}
            {enCanasta ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                En canasta
              </span>
            ) : null}
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="col-span-2">
            <dt className="text-xs text-gray-500 dark:text-gray-400">
              Código Codialub
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {item.codigoCodialub?.trim() || "—"}
            </dd>
          </div>
          {item.codigo?.trim() ? (
            <div className="col-span-2">
              <dt className="text-xs text-gray-500 dark:text-gray-400">
                Código equivalente
              </dt>
              <dd className="text-gray-800 dark:text-gray-200">
                {item.codigo}
              </dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Unidad</dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {item.unidad?.trim() || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">
              Precio lista
            </dt>
            <dd className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(item.precioLista)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">
              Precio c/descuento
            </dt>
            <dd className="font-semibold text-blue-700 dark:text-blue-300">
              {formatCurrency(item.precioConDescuento)}
            </dd>
          </div>
          {/* <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">Importe</dt>
            <dd className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(item.importe)}
            </dd>
          </div> */}
          <div>
            <dt className="text-xs text-gray-500 dark:text-gray-400">
              Descuentos
            </dt>
            <dd className="text-gray-700 dark:text-gray-300">
              Base {pct(item.descuentoBase)}
              {item.descuentoAdicional > 0
                ? ` + Adic. ${pct(item.descuentoAdicional)}`
                : ""}
            </dd>
          </div>
        </dl>

        {item.descripcion ? (
          <p className="mt-3 line-clamp-3 text-xs text-gray-600 dark:text-gray-400">
            {item.descripcion}
          </p>
        ) : null}

        {item.mensaje ? (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
            {item.mensaje}
          </p>
        ) : null}

        <div className="mt-3 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setModalExistenciasAbierto(true)}
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-sky-300 bg-sky-50 px-2 py-2 text-xs font-medium text-sky-900 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50 sm:text-sm"
          >
            <Warehouse className="h-4 w-4 shrink-0" />
            Existencias
            {existenciasVisibles.length > 0 ? (
              <span className="rounded-full bg-sky-200/80 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums dark:bg-sky-800/60">
                {existenciasVisibles.length}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={() => onAgregar(item)}
            disabled={!puedeAgregar}
            title={
              enCanasta
                ? "Sumar cantidad a la canasta"
                : "Agregar a la cotización"
            }
            className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2 py-2 text-xs font-medium text-emerald-900 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50 sm:text-sm"
          >
            <Plus className="h-4 w-4 shrink-0" />
            {enCanasta ? "Agregar +" : "Agregar"}
          </button>
        </div>
      </article>

      <ModalExistencias
        abierto={modalExistenciasAbierto}
        marca={item.marca}
        codigo={codigoMostrar}
        existencias={existenciasVisibles}
        onCerrar={() => setModalExistenciasAbierto(false)}
      />
    </>
  );
}

function ModalAgregarClienteSap({
  abierto,
  onCerrar,
  onConfirmar,
  sociedadPreferida,
}: {
  abierto: boolean;
  onCerrar: () => void;
  onConfirmar: (payload: {
    cardCode: string;
    cardName: string;
    descuentos: CotizadorDescuentoClienteSap[];
    direccion: CotizadorDireccionEntrega | null;
    entregarEn: string;
    ivaPorcentaje: number | null;
  }) => void;
  sociedadPreferida?: string | null;
}) {
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientes, setClientes] = useState<CotizadorClienteSapResumen[]>([]);
  const [filasRaw, setFilasRaw] = useState<CotizadorDescuentoClienteSap[]>([]);
  const [clienteSeleccionado, setClienteSeleccionado] =
    useState<CotizadorClienteSapResumen | null>(null);
  const [cargandoDescuentos, setCargandoDescuentos] = useState(false);
  const [cargandoDirecciones, setCargandoDirecciones] = useState(false);
  const [direcciones, setDirecciones] = useState<CotizadorDireccionEntrega[]>(
    [],
  );
  const [direccionSeleccionada, setDireccionSeleccionada] =
    useState<CotizadorDireccionEntrega | null>(null);

  const descuentosCliente = useMemo(() => {
    if (!clienteSeleccionado) return [];
    const filas = filasDescuentoDeCliente(
      filasRaw,
      clienteSeleccionado.cardCode,
    );
    return filtrarDescuentosClientePorSociedad(filas, sociedadPreferida);
  }, [clienteSeleccionado, filasRaw, sociedadPreferida]);

  const direccionesOrdenadas = useMemo(() => {
    const pref = (sociedadPreferida ?? "").trim().toUpperCase();
    if (!pref) return direcciones;
    return [...direcciones].sort((a, b) => {
      const aMatch = (a.sociedad ?? "").toUpperCase() === pref ? 0 : 1;
      const bMatch = (b.sociedad ?? "").toUpperCase() === pref ? 0 : 1;
      return aMatch - bMatch;
    });
  }, [direcciones, sociedadPreferida]);

  useEffect(() => {
    if (!abierto) {
      setEtapa(1);
      setTextoBusqueda("");
      setClientes([]);
      setFilasRaw([]);
      setClienteSeleccionado(null);
      setDirecciones([]);
      setDireccionSeleccionada(null);
      setError(null);
      setLoading(false);
      setCargandoDescuentos(false);
      setCargandoDirecciones(false);
    }
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [abierto, onCerrar]);

  const buscar = async () => {
    const texto = textoBusqueda.trim();
    if (texto.length < 2) {
      setError("Escribe al menos 2 caracteres para buscar.");
      return;
    }
    setLoading(true);
    setError(null);
    setClientes([]);
    setFilasRaw([]);
    setClienteSeleccionado(null);
    setEtapa(1);
    setDirecciones([]);
    setDireccionSeleccionada(null);
    try {
      const result = await cotizadorService.buscarDescuentosClientes({
        texto,
        top: 10,
      });
      if (result.clientes.length === 0) {
        setError(
          "No se encontraron clientes. Prueba con otro texto o CardCode.",
        );
        return;
      }
      setClientes(result.clientes);
      setFilasRaw(result.filas);
      if (result.clientes.length === 1) {
        setClienteSeleccionado(result.clientes[0]);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudieron buscar clientes.",
      );
    } finally {
      setLoading(false);
    }
  };

  const seleccionarCliente = async (cliente: CotizadorClienteSapResumen) => {
    setClienteSeleccionado(cliente);
    setError(null);

    const yaTieneFilas =
      filasDescuentoDeCliente(filasRaw, cliente.cardCode).length > 0;
    if (yaTieneFilas) return;

    setCargandoDescuentos(true);
    try {
      const result = await cotizadorService.buscarDescuentosClientes({
        texto: cliente.cardCode,
        top: 1,
      });
      setFilasRaw((prev) => {
        const sinEste = prev.filter(
          (f) =>
            f.cardCode.trim().toUpperCase() !==
            cliente.cardCode.trim().toUpperCase(),
        );
        return [...sinEste, ...result.filas];
      });
      if (result.filas.length === 0 && result.clientes.length === 0) {
        setError(
          "El cliente no tiene descuentos por marca en SAP. Puedes usarlo igual.",
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los descuentos del cliente.",
      );
    } finally {
      setCargandoDescuentos(false);
    }
  };

  const irADirecciones = async () => {
    if (!clienteSeleccionado) return;
    setCargandoDirecciones(true);
    setError(null);
    setDirecciones([]);
    setDireccionSeleccionada(null);
    try {
      const list = await cotizadorService.getDireccionesEntrega(
        clienteSeleccionado.cardCode,
      );
      setDirecciones(list);
      setEtapa(2);
      if (list.length === 1) {
        setDireccionSeleccionada(list[0]);
      } else if (list.length === 0) {
        setError(
          "Este cliente no tiene direcciones de entrega en SAP. Puedes continuar y capturarlas manualmente.",
        );
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las direcciones de entrega.",
      );
    } finally {
      setCargandoDirecciones(false);
    }
  };

  const confirmar = () => {
    if (!clienteSeleccionado) return;
    const dir = direccionSeleccionada;
    onConfirmar({
      cardCode: clienteSeleccionado.cardCode,
      cardName: clienteSeleccionado.cardName || clienteSeleccionado.cardCode,
      descuentos: descuentosCliente,
      direccion: dir,
      entregarEn: dir ? formatearDireccionEntrega(dir) : "",
      ivaPorcentaje: dir ? ivaDesdeTaxCode(dir.taxCode) : null,
    });
  };

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-cliente-sap-titulo"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCerrar();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3
                id="modal-cliente-sap-titulo"
                className="text-lg font-semibold text-gray-900 dark:text-white"
              >
                Agregar cliente SAP
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {etapa === 1
                  ? "Busca y selecciona el cliente (hasta 10 resultados)."
                  : "Selecciona la dirección de entrega para la cotización."}
              </p>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium">
            <span
              className={`rounded-full px-2.5 py-1 ${
                etapa === 1
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              1 · Cliente
            </span>
            <span className="text-gray-400">→</span>
            <span
              className={`rounded-full px-2.5 py-1 ${
                etapa === 2
                  ? "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              2 · Dirección
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {etapa === 1 ? (
            <>
              <div>
                <label
                  htmlFor="cliente-sap-busqueda"
                  className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Buscar cliente
                </label>
                <div className="flex gap-2">
                  <input
                    id="cliente-sap-busqueda"
                    type="search"
                    autoFocus
                    value={textoBusqueda}
                    onChange={(e) => setTextoBusqueda(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void buscar();
                      }
                    }}
                    placeholder="Nombre o CardCode (ej. WERCLAIN / C001922)"
                    className="min-h-[44px] flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => void buscar()}
                    disabled={loading}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Buscar
                  </button>
                </div>
              </div>

              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
                  {error}
                </div>
              ) : null}

              {clientes.length > 0 ? (
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium dark:border-gray-700 dark:bg-gray-900/40">
                    Clientes encontrados ({clientes.length}
                    {clientes.length >= 10 ? " · top 10" : ""})
                  </div>
                  <ul className="max-h-56 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">
                    {clientes.map((cliente) => {
                      const seleccionado =
                        clienteSeleccionado?.cardCode.trim().toUpperCase() ===
                        cliente.cardCode.trim().toUpperCase();
                      return (
                        <li key={cliente.cardCode}>
                          <button
                            type="button"
                            onClick={() => void seleccionarCliente(cliente)}
                            className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                              seleccionado
                                ? "bg-sky-50 ring-1 ring-inset ring-sky-200 dark:bg-sky-900/20 dark:ring-sky-800"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                            }`}
                          >
                            <input
                              type="radio"
                              name="cliente-sap-lista"
                              checked={seleccionado}
                              onChange={() => void seleccionarCliente(cliente)}
                              className="mt-1 h-4 w-4 border-gray-300 text-sky-600"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-gray-900 dark:text-white">
                                {cliente.cardName || "—"}
                              </span>
                              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                                {cliente.cardCode}
                                {cliente.sociedad
                                  ? ` · ${cliente.sociedad}`
                                  : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}

              {clienteSeleccionado ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-800 dark:bg-sky-900/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                      Cliente seleccionado
                    </p>
                    <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                      {clienteSeleccionado.cardName || "—"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {clienteSeleccionado.cardCode}
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium dark:border-gray-700 dark:bg-gray-900/40">
                      Descuentos por marca
                      {cargandoDescuentos
                        ? "…"
                        : ` (${descuentosCliente.length})`}
                    </div>
                    {cargandoDescuentos ? (
                      <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando descuentos…
                      </div>
                    ) : descuentosCliente.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                        Sin descuentos por marca para este cliente.
                      </p>
                    ) : (
                      <ul className="max-h-40 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">
                        {descuentosCliente.map((d) => (
                          <li
                            key={`${d.sociedad}-${d.firmCode}-${d.firmName}`}
                            className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
                          >
                            <span className="text-gray-800 dark:text-gray-200">
                              {d.firmName}
                              <span className="ml-1 text-xs text-gray-400">
                                ({d.firmCode})
                              </span>
                            </span>
                            <span className="font-semibold tabular-nums text-gray-900 dark:text-white">
                              {d.discount}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              {clienteSeleccionado ? (
                <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 dark:border-sky-800 dark:bg-sky-900/20">
                  <p className="text-xs font-semibold uppercase tracking-wide text-sky-700 dark:text-sky-300">
                    Cliente
                  </p>
                  <p className="mt-1 font-semibold text-gray-900 dark:text-white">
                    {clienteSeleccionado.cardName}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {clienteSeleccionado.cardCode}
                  </p>
                </div>
              ) : null}

              {error ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-100">
                  {error}
                </div>
              ) : null}

              {cargandoDirecciones ? (
                <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cargando direcciones…
                </div>
              ) : direccionesOrdenadas.length === 0 ? (
                <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No hay direcciones. Puedes confirmar y capturar &quot;Entregar
                  en&quot; a mano en la canasta.
                </p>
              ) : (
                <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium dark:border-gray-700 dark:bg-gray-900/40">
                    Direcciones de entrega ({direccionesOrdenadas.length})
                  </div>
                  <ul className="max-h-72 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-700">
                    {direccionesOrdenadas.map((dir, idx) => {
                      const seleccionado =
                        direccionSeleccionada != null &&
                        direccionSeleccionada.sociedad === dir.sociedad &&
                        direccionSeleccionada.address === dir.address &&
                        direccionSeleccionada.street === dir.street;
                      return (
                        <li key={`${dir.sociedad}-${dir.address}-${idx}`}>
                          <button
                            type="button"
                            onClick={() => setDireccionSeleccionada(dir)}
                            className={`flex w-full items-start gap-3 px-4 py-3 text-left ${
                              seleccionado
                                ? "bg-sky-50 ring-1 ring-inset ring-sky-200 dark:bg-sky-900/20 dark:ring-sky-800"
                                : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                            }`}
                          >
                            <input
                              type="radio"
                              name="direccion-entrega-lista"
                              checked={seleccionado}
                              onChange={() => setDireccionSeleccionada(dir)}
                              className="mt-1 h-4 w-4 border-gray-300 text-sky-600"
                            />
                            <span className="min-w-0 flex-1 space-y-0.5">
                              <span className="block font-medium text-gray-900 dark:text-white">
                                {dir.address || "Sin nombre de dirección"}
                              </span>
                              {dir.street ? (
                                <span className="block text-sm text-gray-700 dark:text-gray-300">
                                  {dir.street}
                                </span>
                              ) : null}
                              {dir.block ? (
                                <span className="block text-xs text-gray-500 dark:text-gray-400">
                                  {dir.block}
                                </span>
                              ) : null}
                              <span className="block text-xs text-gray-500 dark:text-gray-400">
                                {[dir.city, dir.country]
                                  .filter(Boolean)
                                  .join(", ")}
                                {dir.sociedad ? ` · ${dir.sociedad}` : ""}
                                {dir.taxCode ? ` · IVA: ${dir.taxCode}` : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
          {etapa === 2 ? (
            <button
              type="button"
              onClick={() => {
                setEtapa(1);
                setError(null);
              }}
              className="mr-auto inline-flex min-h-[44px] items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              Atrás
            </button>
          ) : null}
          <button
            type="button"
            onClick={onCerrar}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            Cancelar
          </button>
          {etapa === 1 ? (
            <button
              type="button"
              disabled={
                !clienteSeleccionado ||
                cargandoDescuentos ||
                cargandoDirecciones
              }
              onClick={() => void irADirecciones()}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cargandoDirecciones ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Usar este cliente
            </button>
          ) : (
            <button
              type="button"
              disabled={
                direccionesOrdenadas.length > 0 && !direccionSeleccionada
              }
              onClick={confirmar}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-sky-600 px-4 text-sm font-medium text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirmar dirección
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Cotizador() {
  const { user, loading: authLoading } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [respuesta, setRespuesta] = useState<CotizadorBusquedaResponse | null>(
    null,
  );

  const [descuentosPersonalizados, setDescuentosPersonalizados] =
    useState(false);
  const [catalogoDescuentos, setCatalogoDescuentos] = useState<
    CotizadorDescuentoMarca[]
  >([]);
  const [loadingDescuentos, setLoadingDescuentos] = useState(false);
  const [errorDescuentos, setErrorDescuentos] = useState<string | null>(null);
  /** Overrides locales: clave marca → descuentoBase (0–1). */
  const [overridesBase, setOverridesBase] = useState<Record<string, number>>(
    {},
  );
  const [canasta, setCanasta] = useState<CotizadorCanastaItem[]>([]);
  const [panelCanastaAbierto, setPanelCanastaAbierto] = useState(false);
  const [clienteNombre, setClienteNombre] = useState("");
  const [entregarEn, setEntregarEn] = useState("");
  const [ordenCompra, setOrdenCompra] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [ivaPorcentaje, setIvaPorcentaje] = useState(16);
  const [telefonoWhatsApp, setTelefonoWhatsApp] = useState("");
  const [enviandoWhatsApp, setEnviandoWhatsApp] = useState(false);
  const [guardandoCotizacion, setGuardandoCotizacion] = useState(false);
  const [previsualizandoPdf, setPrevisualizandoPdf] = useState(false);
  const [modalPdfAbierto, setModalPdfAbierto] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [contextoOperativo, setContextoOperativo] =
    useState<ContextoOperativoPersona | null>(null);
  const [loadingContexto, setLoadingContexto] = useState(false);
  const [clienteCardCode, setClienteCardCode] = useState("");
  const [clienteEsSap, setClienteEsSap] = useState(false);
  const [descuentosSap, setDescuentosSap] = useState<
    CotizadorDescuentoClienteSap[]
  >([]);
  const [modalClienteSapAbierto, setModalClienteSapAbierto] = useState(false);

  useEffect(() => {
    if (!descuentosPersonalizados) return;
    if (catalogoDescuentos.length > 0) return;

    let cancelled = false;
    setLoadingDescuentos(true);
    setErrorDescuentos(null);

    void (async () => {
      try {
        const data = await cotizadorService.getDescuentos(true);
        if (!cancelled) setCatalogoDescuentos(data);
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setErrorDescuentos(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los descuentos.",
          );
        }
      } finally {
        if (!cancelled) setLoadingDescuentos(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [descuentosPersonalizados, catalogoDescuentos.length]);

  useEffect(() => {
    if (authLoading || !user?.idPersona) {
      setContextoOperativo(null);
      return;
    }

    let cancelled = false;
    setLoadingContexto(true);
    void (async () => {
      try {
        const ctx = await getContextoOperativoPersona(user.idPersona);
        if (!cancelled) setContextoOperativo(ctx);
      } catch (err) {
        console.error(err);
        if (!cancelled) setContextoOperativo(null);
      } finally {
        if (!cancelled) setLoadingContexto(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.idPersona]);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigoTrim = codigo.trim();
    if (!codigoTrim) return;

    if (authLoading) {
      setError("Espera a que termine de cargar la sesión.");
      return;
    }

    const idVendedor = user?.idPersona ?? 0;
    if (import.meta.env.DEV) {
      console.log("[Cotizador] user:", user, "idVendedor:", idVendedor);
    }
    if (!idVendedor || idVendedor <= 0) {
      setError(
        user
          ? "Tu sesión no trae idUsuario. Revisa que checkauth también lo envíe (no solo el login)."
          : "No hay sesión de usuario. Vuelve a iniciar sesión.",
      );
      return;
    }

    const qty = Number(cantidad);
    if (!Number.isFinite(qty) || qty < 1) {
      setError("La cantidad debe ser al menos 1.");
      return;
    }

    setLoading(true);
    setError(null);
    setBusquedaRealizada(true);

    try {
      const data = await cotizadorService.buscar({
        idVendedor,
        cantidad: Math.trunc(qty),
        codigo: codigoTrim,
      });
      setRespuesta(data);
      console.log("[Cotizador] respuesta:", data);
    } catch (err) {
      console.error(err);
      setRespuesta(null);
      setError(
        err instanceof Error ? err.message : "Error al buscar en el cotizador.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resultadosOriginales = respuesta?.resultados ?? [];
  const cantidadRespuesta = respuesta?.cantidad ?? cantidad;

  const { resultados, marcasPersonalizadas, marcasConDescSap } = useMemo(() => {
    const personalizadas = new Set<string>();
    const sapMarcas = new Set<string>();

    if (resultadosOriginales.length === 0) {
      return {
        resultados: resultadosOriginales,
        marcasPersonalizadas: personalizadas,
        marcasConDescSap: sapMarcas,
      };
    }

    // Cliente SAP: descuentos por marca de /api/DescuentosClientes
    if (clienteEsSap && descuentosSap.length > 0) {
      const recalculados = resultadosOriginales.map((item) => {
        const sap = resolverDescuentoSapParaItem(item, descuentosSap);
        if (!sap) return item;
        const clave = claveMarcaCotizador(item.marca);
        if (clave) sapMarcas.add(clave);
        return recalcularResultadoConDescuento(
          item,
          descuentoSapPctAFraccion(sap.discount),
          0,
          cantidadRespuesta,
        );
      });
      return {
        resultados: recalculados,
        marcasPersonalizadas: personalizadas,
        marcasConDescSap: sapMarcas,
      };
    }

    // Manual: descuentos personalizados (overrides) o precios del API
    if (!descuentosPersonalizados) {
      return {
        resultados: resultadosOriginales,
        marcasPersonalizadas: personalizadas,
        marcasConDescSap: sapMarcas,
      };
    }

    const recalculados = resultadosOriginales.map((item) => {
      const catalogo = resolverDescuentoCatalogoParaMarca(
        item.marca,
        catalogoDescuentos,
      );
      const clave =
        claveMarcaCotizador(catalogo?.codigoMarca) ||
        claveMarcaCotizador(item.marca);
      const override = clave ? overridesBase[clave] : undefined;

      if (override == null || !Number.isFinite(override)) {
        return item;
      }

      personalizadas.add(clave);
      const adicional =
        catalogo?.descuentoAdicional ?? item.descuentoAdicional ?? 0;
      return recalcularResultadoConDescuento(
        item,
        override,
        adicional,
        cantidadRespuesta,
      );
    });

    return {
      resultados: recalculados,
      marcasPersonalizadas: personalizadas,
      marcasConDescSap: sapMarcas,
    };
  }, [
    clienteEsSap,
    descuentosSap,
    descuentosPersonalizados,
    resultadosOriginales,
    catalogoDescuentos,
    overridesBase,
    cantidadRespuesta,
  ]);

  const resultadosVisibles = useMemo(
    () => resultados.filter(resultadoEsVisible),
    [resultados],
  );

  const actualizarOverrideBase = (clave: string, pctRaw: string) => {
    const fraction = pctInputToFraction(pctRaw);
    if (fraction == null) return;
    setOverridesBase((prev) => ({ ...prev, [clave]: fraction }));
  };

  const restaurarOverride = (clave: string) => {
    setOverridesBase((prev) => {
      const next = { ...prev };
      delete next[clave];
      return next;
    });
  };

  const restaurarTodosOverrides = () => setOverridesBase({});

  const hayOverrides = Object.keys(overridesBase).length > 0;

  const idsEnCanasta = useMemo(
    () => new Set(canasta.map((item) => item.id)),
    [canasta],
  );

  const totalCanasta = useMemo(
    () => canasta.reduce((sum, item) => sum + item.importe, 0),
    [canasta],
  );

  const agregarACanasta = (item: CotizadorResultado) => {
    const id = claveCanastaItem(item);
    const qtyBusqueda = Math.max(1, Math.trunc(cantidadRespuesta) || 1);
    const codigoBusqueda = respuesta?.codigoBusqueda ?? codigo.trim();

    setCanasta((prev) => {
      const existente = prev.find((row) => row.id === id);
      if (existente) {
        const cantidad = existente.cantidad + qtyBusqueda;
        return prev.map((row) =>
          row.id === id
            ? {
                ...row,
                // Actualiza precios al último valor cotizado (incluye personalizados).
                codigo: item.codigo?.trim() || row.codigo,
                codigoCodialub: item.codigoCodialub ?? row.codigoCodialub,
                descripcion: item.descripcion ?? row.descripcion,
                unidad: item.unidad ?? row.unidad,
                firmCode: item.firmCode ?? row.firmCode,
                precioLista: item.precioLista,
                descuentoBase: item.descuentoBase,
                descuentoAdicional: item.descuentoAdicional,
                precioConDescuento: item.precioConDescuento,
                cantidad,
                importe: item.precioConDescuento * cantidad,
                codigoBusqueda: codigoBusqueda || row.codigoBusqueda,
              }
            : row,
        );
      }
      return [...prev, crearItemCanasta(item, qtyBusqueda, codigoBusqueda)];
    });
    setPanelCanastaAbierto(true);
  };

  const quitarDeCanasta = (id: string) => {
    setCanasta((prev) => prev.filter((item) => item.id !== id));
  };

  const cambiarCantidadCanasta = (id: string, cantidadRaw: number) => {
    const cantidad = Math.max(1, Math.trunc(cantidadRaw) || 1);
    setCanasta((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              cantidad,
              importe: item.precioConDescuento * cantidad,
            }
          : item,
      ),
    );
  };

  const vaciarCanasta = () => {
    setCanasta([]);
    setOrdenCompra(""); // Folio BD: limpia al vaciar
  };

  const confirmarClienteSap = (payload: {
    cardCode: string;
    cardName: string;
    descuentos: CotizadorDescuentoClienteSap[];
    direccion: CotizadorDireccionEntrega | null;
    entregarEn: string;
    ivaPorcentaje: number | null;
  }) => {
    setClienteEsSap(true);
    setClienteCardCode(payload.cardCode);
    setClienteNombre(payload.cardName);
    setDescuentosSap(payload.descuentos);
    setDescuentosPersonalizados(false);
    if (payload.entregarEn.trim()) {
      setEntregarEn(payload.entregarEn);
    }
    if (payload.ivaPorcentaje != null) {
      setIvaPorcentaje(payload.ivaPorcentaje);
    }
    setCanasta((prev) =>
      prev.map((item) => recalcularItemCanastaConSap(item, payload.descuentos)),
    );
    setModalClienteSapAbierto(false);
    setPanelCanastaAbierto(true);
  };

  const quitarClienteSap = () => {
    setClienteEsSap(false);
    setClienteCardCode("");
    setDescuentosSap([]);
    // Nombre queda editable; no borramos para no perder captura manual.
  };

  const armarDatosPdf = (): DatosPdfCotizacion | null => {
    if (canasta.length === 0) return null;
    return {
      folio: ordenCompra.trim(),
      fechaEmision: fechaEmisionCotizacion(),
      cliente: {
        nombre: clienteNombre.trim() || "CLIENTE MOSTRADOR",
        cardCode: clienteCardCode.trim() || null,
        entregarEn: entregarEn.trim() || "—",
        ordenCompra: null,
        vendedor: user?.fullname?.trim() || null,
      },
      items: canasta,
      ivaPorcentaje,
      observaciones: observaciones.trim() || null,
      idSucursal: contextoOperativo?.idSucursal ?? null,
    };
  };

  const cerrarPreviewPdf = () => {
    setModalPdfAbierto(false);
    setPdfPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const previsualizarPdfCotizacion = () => {
    const datos = armarDatosPdf();
    if (!datos) return;
    setError(null);
    setPrevisualizandoPdf(true);
    setModalPdfAbierto(true);
    void (async () => {
      try {
        const blob = await crearBlobPdfCotizacion(datos);
        setPdfPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(blob);
        });
      } catch (err) {
        console.error(err);
        setModalPdfAbierto(false);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo generar la vista previa del PDF.",
        );
      } finally {
        setPrevisualizandoPdf(false);
      }
    })();
  };

  const descargarPreviewPdf = () => {
    if (!pdfPreviewUrl) return;
    void fetch(pdfPreviewUrl)
      .then((r) => r.blob())
      .then((blob) => {
        descargarBlobPdf(
          blob,
          nombreArchivoCotizacion(ordenCompra.trim() || "preview"),
        );
      })
      .catch((err) => {
        console.error(err);
        setError("No se pudo descargar el PDF.");
      });
  };

  const enviarPorWhatsApp = async () => {
    if (!ordenCompra.trim()) {
      setError(
        "Guarda la cotización antes de enviarla por WhatsApp (se requiere folio).",
      );
      return;
    }
    const datos = armarDatosPdf();
    if (!datos) return;
    setEnviandoWhatsApp(true);
    setError(null);
    try {
      const result = await enviarCotizacionPorWhatsApp(datos, telefonoWhatsApp);
      if (!result.ok && result.error) {
        setError(result.error);
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo preparar el envío por WhatsApp.",
      );
    } finally {
      setEnviandoWhatsApp(false);
    }
  };

  const guardarCotizacion = async () => {
    if (canasta.length === 0) return;

    // Prefer idUsuario (tabla usuarios); fallback idPersona.
    const idUsuarioCreacion =
      (user?.idUsuario && user.idUsuario > 0
        ? user.idUsuario
        : user?.idPersona) ?? 0;
    if (!idUsuarioCreacion || idUsuarioCreacion <= 0) {
      setError("No hay sesión de usuario para guardar la cotización.");
      return;
    }

    if (loadingContexto) {
      setError("Espera a que cargue el contexto de empresa/sucursal.");
      return;
    }

    const idEmpresa = contextoOperativo?.idEmpresa ?? 0;
    const idSucursal = contextoOperativo?.idSucursal ?? 0;
    if (!idEmpresa || !idSucursal) {
      setError(
        "No se encontró empresa/sucursal del usuario. Revisa el contexto operativo.",
      );
      return;
    }

    if (!clienteNombre.trim()) {
      setError("Captura o selecciona el nombre del cliente antes de guardar.");
      return;
    }

    const itemSinCodigo = canasta.find(
      (item) => !(item.codigoCodialub?.trim() || item.codigo?.trim()),
    );
    if (itemSinCodigo) {
      setError(
        `El artículo "${itemSinCodigo.marca}" no tiene itemCode (código Codialub/proveedor).`,
      );
      return;
    }

    const subTotal = canasta.reduce((sum, item) => sum + item.importe, 0);
    const ivaPct = Number.isFinite(ivaPorcentaje)
      ? Math.max(0, ivaPorcentaje)
      : 16;
    const iva = subTotal * (ivaPct / 100);
    const total = subTotal + iva;

    const esClienteManual = !clienteEsSap;
    const payload = {
      folio: 0,
      cardCode: esClienteManual
        ? "00001"
        : clienteCardCode.trim() || "",
      cardName: esClienteManual
        ? "Manual"
        : clienteNombre.trim() || "CLIENTE MOSTRADOR",
      direccionEntrega: entregarEn.trim() || "",
      idUsuarioCreacion,
      idEmpresa,
      idSucursal,
      empresa: contextoOperativo?.empresa?.trim() || "",
      sucursal: contextoOperativo?.sucursal?.trim() || "",
      subTotal,
      total,
      iva,
      estatus: "A",
      detalles: canasta.map((item) => ({
        cantidad: item.cantidad,
        itemCode: item.codigoCodialub?.trim() || item.codigo?.trim() || "",
        itemName: item.descripcion?.trim() || item.marca || "",
        suppCatNum: item.codigo?.trim() || "",
        unidad: item.unidad?.trim() || "",
        pl: item.precioLista,
        importe: item.importe,
        idUsuarioCreacion,
        activo: true,
      })),
    };

    setGuardandoCotizacion(true);
    setError(null);
    try {
      const result = await cotizadorService.guardarCotizacion(payload);

      if (result.folio) {
        setOrdenCompra(String(result.folio));
        setError(null);
      } else {
        setError(
          "La cotización se guardó, pero no regresó folio. Revisa el API.",
        );
      }
      window.alert(
        result.folio || result.idCotizacion
          ? `Cotización guardada${result.folio ? `: folio ${result.folio}` : ""}${
              result.idCotizacion != null ? ` (ID ${result.idCotizacion})` : ""
            }.`
          : "Cotización guardada correctamente.",
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la cotización.",
      );
    } finally {
      setGuardandoCotizacion(false);
    }
  };

  return (
    <>
      <PageMeta
        title="Cotizador"
        description="Búsqueda de artículos y equivalentes por código"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Cotizador
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Busca por código y cantidad. Se consultan equivalentes por marca.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <form
          onSubmit={(e) => void handleBuscar(e)}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor="cotizador-codigo"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Código
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                id="cotizador-codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej. RS3545"
                className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-base dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="w-full sm:w-28">
            <label
              htmlFor="cotizador-cantidad"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Cantidad
            </label>
            <input
              id="cotizador-cantidad"
              type="number"
              min={1}
              step={1}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-base dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !codigo.trim()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
          <label
            className={`inline-flex items-center gap-3 ${
              clienteEsSap ? "cursor-not-allowed opacity-60" : "cursor-pointer"
            }`}
          >
            <input
              type="checkbox"
              checked={descuentosPersonalizados}
              disabled={clienteEsSap}
              onChange={(e) => setDescuentosPersonalizados(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 disabled:opacity-50"
            />
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
              Descuentos personalizados
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setModalClienteSapAbierto(true)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Agregar Cliente SAP
            </button>
            {clienteEsSap ? (
              <span className="text-xs text-sky-700 dark:text-sky-300">
                SAP: {clienteCardCode} · {clienteNombre}
              </span>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Activa personalizados para ajustar % base, o carga un cliente
                SAP.
              </p>
            )}
          </div>
        </div>
      </div>

      {descuentosPersonalizados ? (
        <div className="mb-6 rounded-lg border border-violet-200 bg-violet-50/50 p-4 dark:border-violet-800 dark:bg-violet-950/20 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-violet-700 dark:text-violet-300" />
              <h2 className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                Configurar descuentos por marca
              </h2>
            </div>
            {hayOverrides ? (
              <button
                type="button"
                onClick={restaurarTodosOverrides}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-3 py-1.5 text-xs font-medium text-violet-800 hover:bg-violet-50 dark:border-violet-700 dark:bg-violet-900/30 dark:text-violet-200"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restaurar todos
              </button>
            ) : null}
          </div>

          {loadingDescuentos ? (
            <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando catálogo de descuentos...
            </div>
          ) : errorDescuentos ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
              {errorDescuentos}
            </div>
          ) : catalogoDescuentos.length === 0 ? (
            <p className="text-sm text-gray-500">
              No hay descuentos activos configurados.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-violet-200/80 bg-white dark:border-violet-800 dark:bg-gray-900/40">
              <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
                <thead className="bg-violet-50/80 dark:bg-violet-950/40">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Marca
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Base default
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Base editable (%)
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Adicional
                    </th>
                    <th className="w-24 px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {catalogoDescuentos.map((desc) => {
                    const clave = claveMarcaCotizador(desc.codigoMarca);
                    const override = overridesBase[clave];
                    const valorInput =
                      override != null
                        ? fractionToPctInput(override)
                        : fractionToPctInput(desc.descuentoBase);
                    const modificado =
                      override != null &&
                      Math.abs(override - desc.descuentoBase) > 0.0001;

                    return (
                      <tr
                        key={desc.idDescuentoMarca || clave}
                        className={
                          modificado
                            ? "bg-violet-50/60 dark:bg-violet-950/30"
                            : undefined
                        }
                      >
                        <td className="px-3 py-2">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {desc.nombreMarca || desc.codigoMarca}
                          </div>
                          <div className="text-xs text-gray-500">
                            {desc.codigoMarca}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300">
                          {pct(desc.descuentoBase)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex max-w-[120px] items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              step={0.5}
                              value={valorInput}
                              onChange={(e) =>
                                actualizarOverrideBase(clave, e.target.value)
                              }
                              className="w-full min-h-[40px] rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                              aria-label={`Descuento base ${desc.nombreMarca}`}
                            />
                            <span className="text-xs text-gray-500">%</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-gray-600 dark:text-gray-300">
                          {pct(desc.descuentoAdicional)}
                        </td>
                        <td className="px-3 py-2">
                          {modificado ? (
                            <button
                              type="button"
                              onClick={() => restaurarOverride(clave)}
                              className="inline-flex min-h-[36px] items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-900/40"
                              title="Restaurar default"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reset
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-violet-800/80 dark:text-violet-200/80">
            Al cambiar el % base se recalculan precio c/descuento e importe de
            las marcas coincidentes en los resultados actuales.
          </p>
        </div>
      ) : null}

      {error ? (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">
            {error}
          </span>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Consultando cotizador...
        </div>
      ) : null}

      {busquedaRealizada && !loading && respuesta ? (
        <>
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Código:{" "}
              <strong className="text-gray-900 dark:text-white">
                {respuesta.codigoBusqueda}
              </strong>
            </span>
            <span>
              Sociedad:{" "}
              <strong className="text-gray-900 dark:text-white">
                {respuesta.sociedad || "—"}
              </strong>
            </span>
            <span>
              Cantidad:{" "}
              <strong className="text-gray-900 dark:text-white">
                {respuesta.cantidad}
              </strong>
            </span>
            {respuesta.almacenVendedor ? (
              <span>
                Almacén vendedor:{" "}
                <strong className="text-gray-900 dark:text-white">
                  {respuesta.almacenVendedor}
                </strong>
              </span>
            ) : null}
          </div>

          {resultadosVisibles.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <Package className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>No se encontraron resultados</p>
              {resultados.length > 0 ? (
                <p className="mt-2 text-xs">
                  Había {resultados.length} marca(s) sin SAP y sin equivalencia;
                  se ocultaron.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {resultadosVisibles.map((item, index) => {
                const catalogo = resolverDescuentoCatalogoParaMarca(
                  item.marca,
                  catalogoDescuentos,
                );
                const clave =
                  claveMarcaCotizador(catalogo?.codigoMarca) ||
                  claveMarcaCotizador(item.marca);
                const personalizado =
                  !clienteEsSap &&
                  descuentosPersonalizados &&
                  marcasPersonalizadas.has(clave);
                const conDescSap = clienteEsSap && marcasConDescSap.has(clave);
                return (
                  <ResultadoCard
                    key={`${item.marca}-${item.codigoCodialub ?? item.codigo}-${index}`}
                    item={item}
                    personalizado={personalizado}
                    descuentoSap={conDescSap}
                    enCanasta={idsEnCanasta.has(claveCanastaItem(item))}
                    onAgregar={agregarACanasta}
                  />
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {canasta.length > 0 ? (
        <button
          type="button"
          onClick={() => setPanelCanastaAbierto(true)}
          className="fixed bottom-5 right-5 z-[180] inline-flex min-h-[52px] items-center gap-2 rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-emerald-700"
        >
          <ShoppingCart className="h-5 w-5" />
          Canasta ({canasta.length})
          <span className="hidden tabular-nums sm:inline">
            · {formatCurrency(totalCanasta)}
          </span>
        </button>
      ) : null}

      <PanelCanasta
        abierto={panelCanastaAbierto}
        items={canasta}
        clienteNombre={clienteNombre}
        clienteCardCode={clienteCardCode}
        clienteEsSap={clienteEsSap}
        entregarEn={entregarEn}
        ivaPorcentaje={ivaPorcentaje}
        ordenCompra={ordenCompra}
        observaciones={observaciones}
        telefonoWhatsApp={telefonoWhatsApp}
        enviandoWhatsApp={enviandoWhatsApp}
        guardando={guardandoCotizacion}
        cotizacionGuardada={Boolean(ordenCompra.trim())}
        onClienteNombre={setClienteNombre}
        onEntregarEn={setEntregarEn}
        onIvaPorcentaje={setIvaPorcentaje}
        onOrdenCompra={setOrdenCompra}
        onObservaciones={setObservaciones}
        onTelefonoWhatsApp={setTelefonoWhatsApp}
        onAgregarClienteSap={() => setModalClienteSapAbierto(true)}
        onQuitarClienteSap={quitarClienteSap}
        onCerrar={() => setPanelCanastaAbierto(false)}
        onQuitar={quitarDeCanasta}
        onCambiarCantidad={cambiarCantidadCanasta}
        onVaciar={vaciarCanasta}
        onPrevisualizarPdf={previsualizarPdfCotizacion}
        previsualizandoPdf={previsualizandoPdf}
        onEnviarWhatsApp={() => void enviarPorWhatsApp()}
        onGuardar={() => void guardarCotizacion()}
      />

      <ModalPrevisualizarPdfCotizacion
        abierto={modalPdfAbierto}
        url={pdfPreviewUrl}
        cargando={previsualizandoPdf}
        folio={ordenCompra}
        onCerrar={cerrarPreviewPdf}
        onDescargar={descargarPreviewPdf}
      />

      <ModalAgregarClienteSap
        abierto={modalClienteSapAbierto}
        onCerrar={() => setModalClienteSapAbierto(false)}
        onConfirmar={confirmarClienteSap}
        sociedadPreferida={respuesta?.sociedad ?? null}
      />
    </>
  );
}
