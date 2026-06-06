import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Lock,
  Plus,
  Save,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../hooks/useAuth";
import {
  ContextoOperativoPersona,
  getContextoOperativoPersona,
} from "../../services/authService";
import {
  bitacoraCobranzaService,
  BitacoraCobranza as BitacoraCobranzaModel,
  buildBitacoraUpdatePayload,
  calcularVencidas,
  claseBadgeEstatusBitacora,
  claseFilaContadoPrioritario,
  claseFilaEstatusCobro,
  ClienteBitacoraBusqueda,
  esCondicionContadoPrioritaria,
  clienteBitacoraBusquedaKey,
  documentoCobranzaUnicoKey,
  detalleToDocumentoGenerar,
  DIAS_VISITA,
  DocumentoCobranzaGenerar,
  etiquetaCondicionDocumento,
  etiquetaDiasVisita,
  etiquetaEstatusBitacora,
  etiquetaEstatusCobro,
  mergeEstatusCobroEnDocumentos,
  ModoPeriodoBitacora,
  normalizarEstatusBitacora,
  prioridadOrdenCondicionContado,
  prioridadOrdenEstatusCobro,
  ValidarCobroBitacoraResponse,
} from "../../services/bitacoraCobranzaService";
import {
  filtrarRutasPorVendedor,
  rutasService,
  Ruta,
} from "../../services/rutasService";
import { getReportesService, Vendedor } from "../../services/reportesService";
import { formatCurrency } from "../../utils/format";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";
const ESTATUS_ENTREGA_OPCIONES = ["S", "N", "P"] as const;
type EstatusEntregaFiltro = (typeof ESTATUS_ENTREGA_OPCIONES)[number];

function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleDateString("es-MX");
}

function formatearFechaCreacion(
  valor: string | number | null | undefined,
): string {
  if (valor == null || valor === "") return "—";
  if (typeof valor === "number") {
    if (valor <= 0) return "—";
    const d = new Date(valor);
    return Number.isNaN(d.getTime())
      ? String(valor)
      : d.toLocaleString("es-MX");
  }
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleString("es-MX");
}

type EtapaModalAgregarCliente = 1 | 2;

function etiquetaReferenciaDocumento(doc: DocumentoCobranzaGenerar): string {
  const referencia = (doc.numAtCard ?? "").trim();
  return referencia || "—";
}

function documentoKey(doc: DocumentoCobranzaGenerar, index: number): string {
  return `${doc.sociedad ?? ""}|${doc.cardCode}|${doc.docNum}|${doc.docDate}|${index}`;
}

function documentoEstaPersistido(
  doc: DocumentoCobranzaGenerar,
  clavesPersistidos: Set<string>,
): boolean {
  return (
    (doc.idBitacoraDetalle != null && doc.idBitacoraDetalle > 0) ||
    clavesPersistidos.has(documentoCobranzaUnicoKey(doc))
  );
}

function combinarDocumentosGenerados(
  documentosActuales: DocumentoCobranzaGenerar[],
  generados: DocumentoCobranzaGenerar[],
  clavesPersistidos: Set<string>,
): {
  merged: DocumentoCobranzaGenerar[];
  nuevos: DocumentoCobranzaGenerar[];
} {
  const persistidosEnLista = documentosActuales.filter((d) =>
    documentoEstaPersistido(d, clavesPersistidos),
  );
  const clavesConocidas = new Set(clavesPersistidos);
  persistidosEnLista.forEach((d) =>
    clavesConocidas.add(documentoCobranzaUnicoKey(d)),
  );
  const nuevos = generados.filter(
    (d) => !clavesConocidas.has(documentoCobranzaUnicoKey(d)),
  );
  return { merged: [...persistidosEnLista, ...nuevos], nuevos };
}

function estatusLabel(estatus: string | null | undefined): string {
  const value = (estatus ?? "").trim().toUpperCase();
  if (value === "S" || value === "N" || value === "P") return value;
  return value || "—";
}

function estatusCartera(doc: DocumentoCobranzaGenerar): "OK" | "V" {
  return doc.porVencer > 0 || calcularVencidas(doc) > 0 ? "V" : "OK";
}

function ordenarDocumentosParaPdf(
  documentos: DocumentoCobranzaGenerar[],
): DocumentoCobranzaGenerar[] {
  return [...documentos].sort((a, b) => {
    const cliente = a.cardName.localeCompare(b.cardName, "es", {
      sensitivity: "base",
    });
    if (cliente !== 0) return cliente;
    return a.docNum - b.docNum;
  });
}

function documentoPasaFiltrosTabla(
  doc: DocumentoCobranzaGenerar,
  filtroEstatus: "todos" | "OK" | "V",
  filtroEstatusEntrega: Set<EstatusEntregaFiltro>,
): boolean {
  if (filtroEstatus !== "todos" && estatusCartera(doc) !== filtroEstatus) {
    return false;
  }
  const entrega = (doc.estatus ?? "").trim().toUpperCase();
  if (
    filtroEstatusEntrega.size > 0 &&
    !filtroEstatusEntrega.has(entrega as EstatusEntregaFiltro)
  ) {
    return false;
  }
  return true;
}

/** Monto ya cobrado / pagado del documento. */
function montoCobrado(doc: DocumentoCobranzaGenerar): number {
  if (doc.paidToDate > 0) return doc.paidToDate;
  return Math.max(doc.docTotal - doc.saldoDocumento, 0);
}

function etiquetaSociedad(sociedad: string | null | undefined): string {
  const valor = (sociedad ?? "").trim();
  return valor || "—";
}

function estatusCarteraClass(value: "OK" | "V"): string {
  return value === "OK"
    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
    : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200";
}

function estatusClass(estatus: string | null | undefined): string {
  const value = (estatus ?? "").trim().toUpperCase();
  if (value === "S") {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200";
  }
  if (value === "N") {
    return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200";
  }
  return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200";
}

function folioBitacoraValido(folio: number | null | undefined): boolean {
  return folio != null && folio > 0;
}

/** Conserva el folio visible si el PUT/GET no lo trae en la respuesta. */
function resolverFolioVisual(
  respuesta: { folio: number | null },
  referencia: { folio: number | null } | null,
  previo: number | null,
): number | null {
  if (folioBitacoraValido(respuesta.folio)) return respuesta.folio;
  if (referencia && folioBitacoraValido(referencia.folio)) {
    return referencia.folio;
  }
  if (folioBitacoraValido(previo)) return previo;
  return null;
}

function etiquetaFolioBitacora(
  folio: number | null | undefined,
  idBitacora: number,
): string {
  if (folioBitacoraValido(folio)) return `folio ${folio}`;
  return `#${idBitacora}`;
}

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Espacios de relleno al final/inicio (campos char fijos en BD). */
function trimCampoBd(value: string | null | undefined): string {
  return (value ?? "").trim();
}

type DocumentoConIndice = {
  doc: DocumentoCobranzaGenerar;
  originalIndex: number;
};

export default function BitacoraCobranza() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idDesdeUrl = searchParams.get("id");

  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [contextoOperativo, setContextoOperativo] =
    useState<ContextoOperativoPersona | null>(null);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  const [idVendedor, setIdVendedor] = useState<number | "">("");
  const [rutasSeleccionadas, setRutasSeleccionadas] = useState<Set<number>>(
    new Set(),
  );
  const [modoPeriodo, setModoPeriodo] =
    useState<ModoPeriodoBitacora>("semanal");
  const [diasVisitaSeleccionados, setDiasVisitaSeleccionados] = useState<
    Set<string>
  >(new Set());
  const [sociedad, setSociedad] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [filtroEstatus, setFiltroEstatus] = useState<"todos" | "OK" | "V">(
    "todos",
  );
  const [filtroEstatusEntrega, setFiltroEstatusEntrega] = useState<
    Set<EstatusEntregaFiltro>
  >(new Set());

  const [idBitacora, setIdBitacora] = useState<number | null>(null);
  const [folioBitacora, setFolioBitacora] = useState<number | null>(null);
  const [estatusBitacora, setEstatusBitacora] = useState<string>("B");
  const [fechaCreacionBitacora, setFechaCreacionBitacora] = useState<
    string | number | null
  >(null);
  const [documentos, setDocumentos] = useState<DocumentoCobranzaGenerar[]>([]);
  const [documentosSeleccionados, setDocumentosSeleccionados] = useState<
    Set<string>
  >(new Set());
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [clavesDocumentosPersistidos, setClavesDocumentosPersistidos] =
    useState<Set<string>>(new Set());
  const [detalleGuardado, setDetalleGuardado] = useState(false);
  const [cobroValidado, setCobroValidado] = useState(false);
  const [validandoCobro, setValidandoCobro] = useState(false);
  const [resumenValidacionCobro, setResumenValidacionCobro] =
    useState<ValidarCobroBitacoraResponse | null>(null);

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [terminando, setTerminando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const [modalAgregarClienteAbierto, setModalAgregarClienteAbierto] =
    useState(false);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [resultadosClientes, setResultadosClientes] = useState<
    ClienteBitacoraBusqueda[]
  >([]);
  const [clienteActivo, setClienteActivo] =
    useState<ClienteBitacoraBusqueda | null>(null);
  const [clienteSeleccionadoBusqueda, setClienteSeleccionadoBusqueda] =
    useState<ClienteBitacoraBusqueda | null>(null);
  const [etapaModalAgregar, setEtapaModalAgregar] =
    useState<EtapaModalAgregarCliente>(1);
  const [documentosCliente, setDocumentosCliente] = useState<
    DocumentoCobranzaGenerar[]
  >([]);
  const [documentosClienteSeleccionados, setDocumentosClienteSeleccionados] =
    useState<Set<string>>(new Set());
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [cargandoDocumentosCliente, setCargandoDocumentosCliente] =
    useState(false);
  const [totalClientesBusqueda, setTotalClientesBusqueda] = useState(0);
  const [errorBusquedaClientes, setErrorBusquedaClientes] = useState<
    string | null
  >(null);

  const vendedorSeleccionado = useMemo(
    () => vendedores.find((v) => v.idUsuario === idVendedor) ?? null,
    [vendedores, idVendedor],
  );

  const slpName =
    vendedorSeleccionado?.slpName ?? vendedorSeleccionado?.username ?? "";

  const rutasFiltradas = useMemo(
    () => filtrarRutasPorVendedor(rutas, vendedorSeleccionado),
    [rutas, vendedorSeleccionado],
  );
  const rutasSeleccionadasList = useMemo(
    () => rutasFiltradas.filter((r) => rutasSeleccionadas.has(r.idRuta)),
    [rutasFiltradas, rutasSeleccionadas],
  );
  const codigosRutaSeleccionados = useMemo(
    () => rutasSeleccionadasList.map((r) => r.codigo).filter(Boolean),
    [rutasSeleccionadasList],
  );
  const idsRutasSeleccionadas = useMemo(
    () => rutasSeleccionadasList.map((r) => r.idRuta),
    [rutasSeleccionadasList],
  );
  const idRutaEncabezado = idsRutasSeleccionadas[0] ?? 0;
  const etiquetaRutas =
    codigosRutaSeleccionados.length > 0
      ? codigosRutaSeleccionados.join(", ")
      : "Todas las rutas";
  const todasRutasSeleccionadas =
    rutasFiltradas.length > 0 &&
    rutasFiltradas.every((r) => rutasSeleccionadas.has(r.idRuta));
  const codigosDiasVisitaSeleccionados = useMemo(
    () =>
      [...diasVisitaSeleccionados]
        .map((d) => d.trim())
        .filter(Boolean)
        .sort((a, b) => Number(a) - Number(b)),
    [diasVisitaSeleccionados],
  );
  const etiquetaPeriodoDia = useMemo(
    () => etiquetaDiasVisita(codigosDiasVisitaSeleccionados),
    [codigosDiasVisitaSeleccionados],
  );
  const todosDiasSeleccionados =
    diasVisitaSeleccionados.size === DIAS_VISITA.length;
  const estatusEncabezado = normalizarEstatusBitacora(estatusBitacora);
  const bitacoraTerminada =
    estatusEncabezado === "T" || estatusEncabezado === "C";
  const bitacoraPuedeCerrar =
    estatusEncabezado === "T" && !!idBitacora && !cerrando;
  const tieneDetallePersistido = clavesDocumentosPersistidos.size > 0;
  const puedeTerminar =
    tieneDetallePersistido &&
    !!idBitacora &&
    estatusEncabezado === "B" &&
    !terminando;
  const puedeGenerarPdf =
    (estatusEncabezado === "T" || estatusEncabezado === "C") &&
    !!idBitacora &&
    documentos.length > 0;
  const puedeAgregarCliente =
    !bitacoraTerminada &&
    normalizarEstatusBitacora(estatusBitacora) === "B" &&
    !!idBitacora;
  const pasoDocumentosCliente = etapaModalAgregar === 2;
  const documentosYaEnBitacora = useMemo(
    () => new Set(documentos.map(documentoCobranzaUnicoKey)),
    [documentos],
  );
  const todosDocumentosClienteSeleccionados =
    documentosCliente.length > 0 &&
    documentosCliente
      .filter(
        (doc) => !documentosYaEnBitacora.has(documentoCobranzaUnicoKey(doc)),
      )
      .every((doc) =>
        documentosClienteSeleccionados.has(documentoCobranzaUnicoKey(doc)),
      );
  const documentosParaGuardar = useMemo(
    () =>
      documentos.filter(
        (doc) =>
          documentosSeleccionados.has(documentoCobranzaUnicoKey(doc)) &&
          !documentoEstaPersistido(doc, clavesDocumentosPersistidos),
      ),
    [documentos, documentosSeleccionados, clavesDocumentosPersistidos],
  );
  const totalDocumentosPersistidos = useMemo(
    () =>
      documentos.filter((doc) =>
        documentoEstaPersistido(doc, clavesDocumentosPersistidos),
      ).length,
    [documentos, clavesDocumentosPersistidos],
  );
  const documentosFiltradosOrdenados = useMemo<DocumentoConIndice[]>(() => {
    return documentos
      .map((doc, originalIndex) => ({ doc, originalIndex }))
      .filter(({ doc }) =>
        documentoPasaFiltrosTabla(doc, filtroEstatus, filtroEstatusEntrega),
      )
      .sort((a, b) => {
        const ordenContado =
          prioridadOrdenCondicionContado(a.doc) -
          prioridadOrdenCondicionContado(b.doc);
        if (ordenContado !== 0) return ordenContado;
        if (cobroValidado) {
          const ordenCobro =
            prioridadOrdenEstatusCobro(a.doc.estatusCobro) -
            prioridadOrdenEstatusCobro(b.doc.estatusCobro);
          if (ordenCobro !== 0) return ordenCobro;
        }
        const cliente = a.doc.cardName.localeCompare(b.doc.cardName, "es", {
          sensitivity: "base",
        });
        if (cliente !== 0) return cliente;
        return a.doc.docNum - b.doc.docNum;
      });
  }, [documentos, filtroEstatus, filtroEstatusEntrega, cobroValidado]);
  const documentosSeleccionablesFiltrados = useMemo(
    () =>
      documentosFiltradosOrdenados.filter(
        ({ doc }) => !documentoEstaPersistido(doc, clavesDocumentosPersistidos),
      ),
    [documentosFiltradosOrdenados, clavesDocumentosPersistidos],
  );
  const todosSeleccionados =
    documentosSeleccionablesFiltrados.length > 0 &&
    documentosSeleccionablesFiltrados.every(({ doc }) =>
      documentosSeleccionados.has(documentoCobranzaUnicoKey(doc)),
    );

  const idBitacoraDesdeUrl = useMemo(() => {
    if (!idDesdeUrl) return null;
    const id = Number(idDesdeUrl);
    return !Number.isNaN(id) && id > 0 ? id : null;
  }, [idDesdeUrl]);

  const resolverIdBitacoraActivo = useCallback((): number | null => {
    if (idBitacora != null && idBitacora > 0) return idBitacora;
    return idBitacoraDesdeUrl;
  }, [idBitacora, idBitacoraDesdeUrl]);

  const etiquetaBitacora = useMemo(() => {
    if (folioBitacoraValido(folioBitacora)) {
      return String(folioBitacora);
    }
    const idActivo = resolverIdBitacoraActivo();
    if (idActivo) return `#${idActivo}`;
    return "";
  }, [folioBitacora, resolverIdBitacoraActivo]);

  useEffect(() => {
    if (!documentos.length) {
      setDocumentosSeleccionados(new Set());
    }
  }, [documentos.length]);

  const acotarSeleccionAlFiltro = useCallback(
    (lista: DocumentoCobranzaGenerar[], seleccion: Set<string>) => {
      const acotada = new Set<string>();
      for (const doc of lista) {
        if (documentoEstaPersistido(doc, clavesDocumentosPersistidos)) {
          continue;
        }
        const clave = documentoCobranzaUnicoKey(doc);
        if (
          seleccion.has(clave) &&
          documentoPasaFiltrosTabla(doc, filtroEstatus, filtroEstatusEntrega)
        ) {
          acotada.add(clave);
        }
      }
      return acotada;
    },
    [clavesDocumentosPersistidos, filtroEstatus, filtroEstatusEntrega],
  );

  /** Al cambiar filtros, conserva seleccionados solo si coinciden con el filtro activo. */
  useEffect(() => {
    if (!documentos.length) return;
    setDocumentosSeleccionados((prev) =>
      acotarSeleccionAlFiltro(documentos, prev),
    );
  }, [
    filtroEstatus,
    filtroEstatusEntrega,
    acotarSeleccionAlFiltro,
    documentos,
  ]);

  const cargarBitacoraExistente = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const bitacora = await bitacoraCobranzaService.getBitacoraPorId(id);
      setIdBitacora(bitacora.idBitacora);
      setFolioBitacora(bitacora.folio);
      setIdVendedor(bitacora.idVendedor);
      setRutasSeleccionadas(
        new Set(
          bitacora.idRutas.length > 0
            ? bitacora.idRutas
            : bitacora.idRuta > 0
              ? [bitacora.idRuta]
              : [],
        ),
      );
      setEstatusBitacora(bitacora.estatus ?? "B");
      setFechaCreacionBitacora(bitacora.fechaCreacion);
      setObservaciones(bitacora.observaciones ?? "");
      const detalle = await bitacoraCobranzaService.getDetallePorBitacora(id);
      let documentosDetalle = detalle.map((item) =>
        detalleToDocumentoGenerar(item),
      );
      const primeraSociedad = documentosDetalle.find((d) =>
        d.sociedad?.trim(),
      )?.sociedad;
      if (primeraSociedad) {
        setSociedad(primeraSociedad);
      }

      setCobroValidado(false);
      setResumenValidacionCobro(null);
      let cobroValidadoOk = false;
      if (detalle.length > 0) {
        setValidandoCobro(true);
        try {
          const validacion =
            await bitacoraCobranzaService.validarCobroBitacora(id);
          setResumenValidacionCobro(validacion);
          if (validacion.detalles.length > 0) {
            documentosDetalle = validacion.detalles.map((item) =>
              detalleToDocumentoGenerar(item),
            );
          } else {
            documentosDetalle = mergeEstatusCobroEnDocumentos(
              documentosDetalle,
              validacion.items,
            );
          }
          cobroValidadoOk = true;
          setCobroValidado(true);
        } catch (validacionErr) {
          console.error(validacionErr);
          setError(
            validacionErr instanceof Error
              ? validacionErr.message
              : "No se pudo validar el cobro de la bitácora.",
          );
        } finally {
          setValidandoCobro(false);
        }
      }

      const clavesPersistidos = new Set(
        documentosDetalle.map((doc) => documentoCobranzaUnicoKey(doc)),
      );
      setClavesDocumentosPersistidos(clavesPersistidos);
      setTotalRegistros(detalle.length);
      setDocumentos(documentosDetalle);
      setDocumentosSeleccionados(new Set());
      setDetalleGuardado(clavesPersistidos.size > 0);
      const folioLabel =
        bitacora.folio != null && bitacora.folio > 0
          ? `folio ${bitacora.folio}`
          : `#${id}`;
      setMensaje(
        `Bitácora ${folioLabel} cargada (${detalle.length} registros${cobroValidadoOk ? ", cobro validado" : ""}).`,
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo cargar la bitácora.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cargar = async () => {
      setLoadingCatalogos(true);
      try {
        const [vendedoresData, rutasData] = await Promise.all([
          getReportesService.getVendedores(),
          rutasService.getRutas(),
        ]);
        setVendedores(vendedoresData ?? []);
        setRutas((rutasData ?? []).filter((r) => r.activo));
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar vendedores o rutas.");
      } finally {
        setLoadingCatalogos(false);
      }
    };
    void cargar();
  }, []);

  useEffect(() => {
    if (!user?.idPersona) return;

    const cargarContextoOperativo = async () => {
      try {
        setContextoOperativo(await getContextoOperativoPersona(user.idPersona));
      } catch (err) {
        console.error(err);
        setContextoOperativo(null);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo cargar el contexto operativo del usuario.",
        );
      }
    };

    void cargarContextoOperativo();
  }, [user?.idPersona]);

  useEffect(() => {
    if (!idDesdeUrl) return;
    const id = Number(idDesdeUrl);
    if (!Number.isNaN(id) && id > 0) void cargarBitacoraExistente(id);
  }, [idDesdeUrl, cargarBitacoraExistente]);

  useEffect(() => {
    if (!modalAgregarClienteAbierto || pasoDocumentosCliente) return;

    const termino = busquedaCliente.trim();
    if (termino.length < 2) {
      setResultadosClientes([]);
      setTotalClientesBusqueda(0);
      setErrorBusquedaClientes(null);
      setBuscandoClientes(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        setBuscandoClientes(true);
        setErrorBusquedaClientes(null);
        try {
          const resultado = await bitacoraCobranzaService.buscarClientes({
            texto: termino,
            slpName: slpName || undefined,
          });
          setResultadosClientes(resultado.clientes);
          setTotalClientesBusqueda(resultado.total);
        } catch (err) {
          console.error(err);
          setResultadosClientes([]);
          setTotalClientesBusqueda(0);
          setErrorBusquedaClientes(
            err instanceof Error ? err.message : "No se pudo buscar clientes.",
          );
        } finally {
          setBuscandoClientes(false);
        }
      })();
    }, 400);

    return () => window.clearTimeout(timer);
  }, [
    modalAgregarClienteAbierto,
    pasoDocumentosCliente,
    busquedaCliente,
    slpName,
  ]);

  const validarFiltros = (): string | null => {
    if (!idVendedor) return "Seleccione un vendedor.";
    if (!slpName) return "El vendedor no tiene código SAP (slpName).";
    if (modoPeriodo === "dia" && diasVisitaSeleccionados.size === 0)
      return "Seleccione al menos un día de visita.";
    return null;
  };

  const limpiarVistaDocumentos = useCallback(() => {
    setDocumentos((prev) =>
      prev.filter((doc) =>
        documentoEstaPersistido(doc, clavesDocumentosPersistidos),
      ),
    );
    setDocumentosSeleccionados(new Set());
    setCobroValidado(false);
    setResumenValidacionCobro(null);
  }, [clavesDocumentosPersistidos]);

  const crearEncabezado = async (): Promise<BitacoraCobranzaModel> => {
    const validacion = validarFiltros();
    if (validacion) throw new Error(validacion);
    if (!user?.idPersona) {
      throw new Error(
        "No hay sesión de usuario para obtener empresa y sucursal.",
      );
    }
    if (!contextoOperativo?.idEmpresa || !contextoOperativo?.idSucursal) {
      throw new Error(
        "No se pudo determinar empresa y sucursal del usuario. Verifique el contexto operativo asignado.",
      );
    }

    const idUsuario = user.idPersona;
    const payload = {
      idSucursal: contextoOperativo.idSucursal,
      idEmpresa: contextoOperativo.idEmpresa,
      idVendedor: idVendedor as number,
      idRutas: idsRutasSeleccionadas,
      idUsuarioCreacion: idUsuario,
      observaciones: observaciones.trim() || null,
      activo: true,
    };

    const creada = await bitacoraCobranzaService.crearBitacora(payload);
    setIdBitacora(creada.idBitacora);
    setFolioBitacora(creada.folio);
    setEstatusBitacora(creada.estatus ?? "B");
    setFechaCreacionBitacora(creada.fechaCreacion);
    if (creada.idRutas.length > 0) {
      setRutasSeleccionadas(new Set(creada.idRutas));
    }
    return creada;
  };

  const sincronizarEncabezado = async (
    bitacoraId: number,
  ): Promise<BitacoraCobranzaModel> => {
    if (!user?.idPersona) {
      throw new Error("No hay sesión de usuario para actualizar la bitácora.");
    }

    const encabezado =
      await bitacoraCobranzaService.getBitacoraPorId(bitacoraId);
    const folioPrevio = encabezado.folio;
    const payload = buildBitacoraUpdatePayload(encabezado, {
      idUsuarioEdita: user.idPersona,
      idVendedor:
        typeof idVendedor === "number" ? idVendedor : encabezado.idVendedor,
      idRuta:
        idRutaEncabezado > 0
          ? idRutaEncabezado
          : (encabezado.idRutas[0] ?? encabezado.idRuta),
      idRutas: idsRutasSeleccionadas,
      observaciones: observaciones.trim() || null,
    });
    const actualizada = await bitacoraCobranzaService.actualizarBitacora(
      bitacoraId,
      payload,
    );
    const folioResuelto = resolverFolioVisual(
      actualizada,
      encabezado,
      folioPrevio,
    );
    setFolioBitacora(folioResuelto);
    setEstatusBitacora(actualizada.estatus ?? encabezado.estatus ?? "B");
    setFechaCreacionBitacora(
      actualizada.fechaCreacion ?? encabezado.fechaCreacion,
    );
    if (actualizada.idRutas.length > 0) {
      setRutasSeleccionadas(new Set(actualizada.idRutas));
    }
    return { ...actualizada, folio: folioResuelto };
  };

  const handleGenerar = async () => {
    const validacion = validarFiltros();
    if (validacion) {
      setError(validacion);
      return;
    }

    setLoading(true);
    setError(null);
    setMensaje(null);
    try {
      const idActivo = resolverIdBitacoraActivo();
      let bitacoraId = idActivo;
      let bitacoraRef: BitacoraCobranzaModel | null = null;
      if (idActivo) {
        if (!idBitacora) {
          setIdBitacora(idActivo);
        }
        bitacoraRef = await sincronizarEncabezado(idActivo);
      } else {
        bitacoraRef = await crearEncabezado();
        bitacoraId = bitacoraRef.idBitacora;
      }

      const params = {
        slpName,
        uBxpRutas:
          codigosRutaSeleccionados.length > 0
            ? codigosRutaSeleccionados
            : undefined,
        uDiaVisitas:
          modoPeriodo === "dia" && codigosDiasVisitaSeleccionados.length > 0
            ? codigosDiasVisitaSeleccionados
            : undefined,
        sociedad: sociedad.trim() || undefined,
      };

      const resultado =
        await bitacoraCobranzaService.generarDocumentosParaBitacora(params);

      if (resultado.sociedad && !sociedad.trim()) {
        setSociedad(resultado.sociedad);
      }

      const { merged, nuevos } = combinarDocumentosGenerados(
        documentos,
        resultado.documentos,
        clavesDocumentosPersistidos,
      );
      setDocumentos(merged);
      setDocumentosSeleccionados((prev) => {
        const next = new Set(prev);
        nuevos.forEach((doc) => {
          if (!documentoEstaPersistido(doc, clavesDocumentosPersistidos)) {
            next.add(documentoCobranzaUnicoKey(doc));
          }
        });
        return acotarSeleccionAlFiltro(merged, next);
      });
      setTotalRegistros(merged.length);
      setCobroValidado(false);
      setResumenValidacionCobro(null);
      const refFolio = bitacoraRef?.folio ?? folioBitacora ?? null;
      const omitidos = resultado.documentos.length - nuevos.length;
      setMensaje(
        nuevos.length > 0
          ? `Se cargaron ${nuevos.length} documento(s) nuevo(s) en la bitácora ${etiquetaFolioBitacora(refFolio, bitacoraId!)}.${omitidos > 0 ? ` ${omitidos} ya estaban en bitácora y se omitieron.` : ""} Vienen seleccionados; use filtros para afinar y guarde los marcados.`
          : `No hay documentos nuevos para la bitácora ${etiquetaFolioBitacora(refFolio, bitacoraId!)}.${omitidos > 0 ? ` ${omitidos} ya estaban en bitácora.` : ""}`,
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo generar la bitácora.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarDetalle = async () => {
    const aGuardar = documentos.filter(
      (doc) =>
        documentosSeleccionados.has(documentoCobranzaUnicoKey(doc)) &&
        !documentoEstaPersistido(doc, clavesDocumentosPersistidos),
    );

    if (!aGuardar.length) {
      setError("Seleccione al menos un documento nuevo para guardar.");
      return;
    }

    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const idActivo = resolverIdBitacoraActivo();
      let bitacoraId = idActivo;
      let bitacoraRef: BitacoraCobranzaModel | null = null;
      if (!idActivo) {
        bitacoraRef = await crearEncabezado();
        bitacoraId = bitacoraRef.idBitacora;
      } else if (!idBitacora) {
        setIdBitacora(idActivo);
      }

      if (!bitacoraId) {
        setError("No hay bitácora activa para guardar.");
        return;
      }

      const idUsuario =
        user?.idPersona ?? (typeof idVendedor === "number" ? idVendedor : 0);
      const guardados = await bitacoraCobranzaService.guardarDetalleEnLote(
        aGuardar,
        bitacoraId,
        idUsuario,
      );
      const clavesGuardadas = aGuardar.map((doc) =>
        documentoCobranzaUnicoKey(doc),
      );
      setClavesDocumentosPersistidos((prev) => {
        const next = new Set(prev);
        clavesGuardadas.forEach((clave) => next.add(clave));
        return next;
      });
      setDocumentos((prev) =>
        prev.map((doc) => {
          const clave = documentoCobranzaUnicoKey(doc);
          if (!clavesGuardadas.includes(clave)) return doc;
          const registro = guardados.find(
            (item) =>
              documentoCobranzaUnicoKey(detalleToDocumentoGenerar(item)) ===
              clave,
          );
          return registro
            ? {
                ...doc,
                idBitacoraDetalle: registro.idBitacoraDetalle,
              }
            : doc;
        }),
      );
      setDocumentosSeleccionados((prev) => {
        const next = new Set(prev);
        clavesGuardadas.forEach((clave) => next.delete(clave));
        return next;
      });
      const refFolio = bitacoraRef?.folio ?? folioBitacora;
      setMensaje(
        `Se guardaron ${aGuardar.length} registro(s) nuevo(s) en la bitácora ${etiquetaFolioBitacora(refFolio, bitacoraId)}.`,
      );
      setDetalleGuardado(true);

      const actualizada =
        await bitacoraCobranzaService.getBitacoraPorId(bitacoraId);
      setFolioBitacora((prev) =>
        resolverFolioVisual(actualizada, actualizada, prev),
      );
      setEstatusBitacora(actualizada.estatus ?? "B");
      setFechaCreacionBitacora(actualizada.fechaCreacion);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el detalle.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const handleTerminarBitacora = async () => {
    const idActivo = resolverIdBitacoraActivo();
    if (!idActivo) {
      setError("No hay bitácora activa para terminar.");
      return;
    }
    if (!tieneDetallePersistido) {
      setError("Guarde al menos un detalle antes de terminar la bitácora.");
      return;
    }
    if (bitacoraTerminada) return;

    const idUsuario =
      user?.idPersona ?? (typeof idVendedor === "number" ? idVendedor : 0);
    if (!idUsuario) {
      setError("No hay sesión de usuario para terminar la bitácora.");
      return;
    }

    setTerminando(true);
    setError(null);
    setMensaje(null);
    try {
      const encabezado =
        await bitacoraCobranzaService.getBitacoraPorId(idActivo);
      const payload = buildBitacoraUpdatePayload(encabezado, {
        idUsuarioEdita: idUsuario,
        idVendedor:
          typeof idVendedor === "number" ? idVendedor : encabezado.idVendedor,
        idRuta:
          idRutaEncabezado > 0
            ? idRutaEncabezado
            : (encabezado.idRutas[0] ?? encabezado.idRuta),
        idRutas: idsRutasSeleccionadas,
        observaciones: observaciones.trim() || null,
        estatus: "T",
      });
      const actualizada = await bitacoraCobranzaService.actualizarBitacora(
        idActivo,
        payload,
      );
      const folioResuelto = resolverFolioVisual(
        actualizada,
        encabezado,
        folioBitacora,
      );
      setFolioBitacora(folioResuelto);
      setEstatusBitacora(actualizada.estatus ?? "T");
      setFechaCreacionBitacora(actualizada.fechaCreacion);
      setMensaje(
        `Bitácora ${etiquetaFolioBitacora(folioResuelto, idActivo)} creada. Ya puede generar el PDF.`,
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo terminar la bitácora.",
      );
    } finally {
      setTerminando(false);
    }
  };

  const handleCerrarBitacora = async () => {
    const idActivo = resolverIdBitacoraActivo();
    if (!idActivo) {
      setError("No hay bitácora activa para cerrar.");
      return;
    }
    if (estatusEncabezado !== "T") {
      setError("Solo puede cerrar una bitácora en estatus Creado.");
      return;
    }

    const idUsuario =
      user?.idPersona ?? (typeof idVendedor === "number" ? idVendedor : 0);
    if (!idUsuario) {
      setError("No hay sesión de usuario para cerrar la bitácora.");
      return;
    }

    setCerrando(true);
    setError(null);
    setMensaje(null);
    try {
      const encabezado =
        await bitacoraCobranzaService.getBitacoraPorId(idActivo);
      const payload = buildBitacoraUpdatePayload(encabezado, {
        idUsuarioEdita: idUsuario,
        idVendedor:
          typeof idVendedor === "number" ? idVendedor : encabezado.idVendedor,
        idRuta:
          idRutaEncabezado > 0
            ? idRutaEncabezado
            : (encabezado.idRutas[0] ?? encabezado.idRuta),
        idRutas: idsRutasSeleccionadas,
        observaciones: observaciones.trim() || null,
        estatus: "C",
      });
      const actualizada = await bitacoraCobranzaService.actualizarBitacora(
        idActivo,
        payload,
      );
      const folioResuelto = resolverFolioVisual(
        actualizada,
        encabezado,
        folioBitacora,
      );
      setFolioBitacora(folioResuelto);
      setEstatusBitacora(actualizada.estatus ?? "C");
      setFechaCreacionBitacora(actualizada.fechaCreacion);
      setMensaje(
        `Bitácora ${etiquetaFolioBitacora(folioResuelto, idActivo)} cerrada.`,
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo cerrar la bitácora.",
      );
    } finally {
      setCerrando(false);
    }
  };

  const toggleDiaVisitaSeleccionado = (valor: string) => {
    setDiasVisitaSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(valor)) {
        next.delete(valor);
      } else {
        next.add(valor);
      }
      return next;
    });
    limpiarVistaDocumentos();
  };

  const toggleTodosDiasVisita = () => {
    if (todosDiasSeleccionados) {
      setDiasVisitaSeleccionados(new Set());
    } else {
      setDiasVisitaSeleccionados(new Set(DIAS_VISITA.map((d) => d.value)));
    }
    limpiarVistaDocumentos();
  };

  const toggleRutaSeleccionada = (idRuta: number) => {
    setRutasSeleccionadas((prev) => {
      const next = new Set(prev);
      if (next.has(idRuta)) {
        next.delete(idRuta);
      } else {
        next.add(idRuta);
      }
      return next;
    });
    limpiarVistaDocumentos();
  };

  const toggleTodasRutas = () => {
    if (todasRutasSeleccionadas) {
      setRutasSeleccionadas(new Set());
    } else {
      setRutasSeleccionadas(new Set(rutasFiltradas.map((r) => r.idRuta)));
    }
    limpiarVistaDocumentos();
  };

  const toggleSeleccionTodos = () => {
    const keysVisibles = documentosSeleccionablesFiltrados.map(({ doc }) =>
      documentoCobranzaUnicoKey(doc),
    );
    if (todosSeleccionados) {
      setDocumentosSeleccionados((prev) => {
        const next = new Set(prev);
        keysVisibles.forEach((key) => next.delete(key));
        return next;
      });
      return;
    }
    setDocumentosSeleccionados((prev) => {
      const next = new Set(prev);
      keysVisibles.forEach((key) => next.add(key));
      return next;
    });
  };

  const toggleDocumento = (
    doc: DocumentoCobranzaGenerar,
    persistido: boolean,
  ) => {
    if (persistido || bitacoraTerminada) return;
    const clave = documentoCobranzaUnicoKey(doc);
    setDocumentosSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(clave)) {
        next.delete(clave);
      } else {
        next.add(clave);
      }
      return next;
    });
  };

  const handleNuevaBitacora = () => {
    setIdBitacora(null);
    setFolioBitacora(null);
    setEstatusBitacora("B");
    setFechaCreacionBitacora(null);
    setIdVendedor("");
    setRutasSeleccionadas(new Set());
    setModoPeriodo("semanal");
    setDiasVisitaSeleccionados(new Set());
    setSociedad("");
    setObservaciones("");
    setFiltroEstatus("todos");
    setFiltroEstatusEntrega(new Set());
    setDocumentos([]);
    setDocumentosSeleccionados(new Set());
    setClavesDocumentosPersistidos(new Set());
    setTotalRegistros(0);
    setDetalleGuardado(false);
    setCobroValidado(false);
    setValidandoCobro(false);
    setResumenValidacionCobro(null);
    setError(null);
    setMensaje(null);
    navigate("/operaciones/BitacoraCobranza", { replace: true });
  };

  const toggleFiltroEstatusEntrega = (value: EstatusEntregaFiltro) => {
    setFiltroEstatusEntrega((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  };

  const abrirModalAgregarCliente = () => {
    setBusquedaCliente("");
    setResultadosClientes([]);
    setTotalClientesBusqueda(0);
    setClienteActivo(null);
    setClienteSeleccionadoBusqueda(null);
    setEtapaModalAgregar(1);
    setDocumentosCliente([]);
    setDocumentosClienteSeleccionados(new Set());
    setErrorBusquedaClientes(null);
    setModalAgregarClienteAbierto(true);
  };

  const cerrarModalAgregarCliente = () => {
    setModalAgregarClienteAbierto(false);
    setBusquedaCliente("");
    setResultadosClientes([]);
    setTotalClientesBusqueda(0);
    setClienteActivo(null);
    setClienteSeleccionadoBusqueda(null);
    setEtapaModalAgregar(1);
    setDocumentosCliente([]);
    setDocumentosClienteSeleccionados(new Set());
    setErrorBusquedaClientes(null);
  };

  const volverABusquedaClientes = () => {
    setClienteActivo(null);
    setEtapaModalAgregar(1);
    setDocumentosCliente([]);
    setDocumentosClienteSeleccionados(new Set());
    setErrorBusquedaClientes(null);
  };

  const preseleccionarClienteBusqueda = (cliente: ClienteBitacoraBusqueda) => {
    setClienteSeleccionadoBusqueda(cliente);
    setErrorBusquedaClientes(null);
  };

  const continuarConClienteSeleccionado = () => {
    if (!clienteSeleccionadoBusqueda) {
      setErrorBusquedaClientes("Seleccione un cliente de la lista.");
      return;
    }
    void seleccionarClienteParaDocumentos(clienteSeleccionadoBusqueda);
  };

  const seleccionarClienteParaDocumentos = async (
    cliente: ClienteBitacoraBusqueda,
  ) => {
    if (!cliente.cardCode.trim()) {
      setErrorBusquedaClientes("El cliente no tiene código válido.");
      return;
    }

    setCargandoDocumentosCliente(true);
    setErrorBusquedaClientes(null);
    setClienteActivo(cliente);
    setClienteSeleccionadoBusqueda(cliente);
    setEtapaModalAgregar(2);
    setDocumentosCliente([]);
    setDocumentosClienteSeleccionados(new Set());

    try {
      const resultado = await bitacoraCobranzaService.buscarClientes({
        texto: busquedaCliente.trim() || cliente.cardCode,
        cardCode: cliente.cardCode,
        sociedad: cliente.sociedad ?? undefined,
        slpName: slpName || undefined,
        incluirDocumentos: true,
      });

      const clienteConDocs =
        resultado.clientes.find(
          (item) =>
            item.cardCode === cliente.cardCode &&
            (item.sociedad ?? "") === (cliente.sociedad ?? ""),
        ) ?? resultado.clientes[0];

      const docs = clienteConDocs?.detalleDocumentos ?? [];
      setClienteActivo(clienteConDocs ?? cliente);
      setDocumentosCliente(docs);

      if (!docs.length) {
        setErrorBusquedaClientes(
          "El cliente no tiene documentos de cartera para agregar.",
        );
      }
    } catch (err) {
      console.error(err);
      setClienteActivo(null);
      setEtapaModalAgregar(1);
      setErrorBusquedaClientes(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los documentos del cliente.",
      );
    } finally {
      setCargandoDocumentosCliente(false);
    }
  };

  const toggleDocumentoCliente = (doc: DocumentoCobranzaGenerar) => {
    const key = documentoCobranzaUnicoKey(doc);
    if (documentosYaEnBitacora.has(key)) return;
    setDocumentosClienteSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleSeleccionTodosDocumentosCliente = () => {
    const agregables = documentosCliente.filter(
      (doc) => !documentosYaEnBitacora.has(documentoCobranzaUnicoKey(doc)),
    );
    if (!agregables.length) return;

    const todosAgregablesSeleccionados = agregables.every((doc) =>
      documentosClienteSeleccionados.has(documentoCobranzaUnicoKey(doc)),
    );

    if (todosAgregablesSeleccionados) {
      setDocumentosClienteSeleccionados(new Set());
      return;
    }
    setDocumentosClienteSeleccionados(
      new Set(agregables.map((doc) => documentoCobranzaUnicoKey(doc))),
    );
  };

  const handleConfirmarAgregarDocumentos = () => {
    const seleccionados = documentosCliente.filter((doc) =>
      documentosClienteSeleccionados.has(documentoCobranzaUnicoKey(doc)),
    );
    if (!seleccionados.length) {
      setErrorBusquedaClientes("Seleccione al menos un documento.");
      return;
    }

    const existentes = new Set(documentos.map(documentoCobranzaUnicoKey));
    const nuevos = seleccionados.filter(
      (doc) => !existentes.has(documentoCobranzaUnicoKey(doc)),
    );
    const duplicados = seleccionados.length - nuevos.length;

    if (!nuevos.length) {
      setErrorBusquedaClientes(
        "Los documentos seleccionados ya están en la bitácora.",
      );
      return;
    }

    setDocumentos((prev) => [...prev, ...nuevos]);
    setDocumentosSeleccionados((prev) => {
      const next = new Set(prev);
      nuevos.forEach((doc) => {
        next.add(documentoCobranzaUnicoKey(doc));
      });
      return next;
    });
    setMensaje(
      `Se agregaron ${nuevos.length} documento(s) de ${clienteActivo?.cardName ?? "el cliente"}.${duplicados > 0 ? ` ${duplicados} ya existían y se omitieron.` : ""} Guarde el detalle para persistir.`,
    );
    cerrarModalAgregarCliente();
  };

  const handleGenerarPdf = () => {
    const docsPdf = ordenarDocumentosParaPdf(
      documentosParaGuardar.length ? documentosParaGuardar : documentos,
    );
    if (!idBitacora || !docsPdf.length) {
      setError("No hay detalle para generar el PDF.");
      return;
    }
    if (!bitacoraTerminada) {
      setError(
        "La bitácora debe estar creada para generar el PDF. Use el botón Crear.",
      );
      return;
    }

    const win = window.open("about:blank", "_blank");
    if (!win) {
      setError(
        "No se pudo abrir la ventana de impresión. Permita ventanas emergentes para esta página.",
      );
      return;
    }

    const total = docsPdf.reduce((sum, doc) => sum + doc.docTotal, 0);
    const totalCobrado = docsPdf.reduce(
      (sum, doc) => sum + montoCobrado(doc),
      0,
    );
    const fecha = new Date().toLocaleDateString("es-MX");
    const hora = new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const rows = docsPdf
      .map(
        (doc, idx) => `
          <tr class="data-row">
            <td class="center col-num">${idx + 1}</td>
            <td class="col-cliente">
              <strong>${escapeHtml(trimCampoBd(doc.cardCode))}</strong>
              <span class="cliente-nombre">${escapeHtml(trimCampoBd(doc.cardName))}</span>
            </td>
            <td class="center col-referencia">${escapeHtml(etiquetaReferenciaDocumento(doc))}</td>
            <td class="col-doc">
              <strong>${escapeHtml(doc.docNum)}</strong>
              ${escapeHtml(etiquetaSociedad(doc.sociedad))}
            </td>
            <td class="center col-condicion">${escapeHtml(etiquetaCondicionDocumento(doc))}</td>
            <td class="center col-compact">${escapeHtml(formatearFecha(doc.docDate))}</td>
            <td class="center col-compact">${escapeHtml(formatearFecha(doc.docDueDate))}</td>
            <td class="center col-money col-total">${escapeHtml(formatCurrency(doc.docTotal))}</td>
            <td class="center col-money">${escapeHtml(formatCurrency(montoCobrado(doc)))}</td>
            <td class="center col-status">${escapeHtml(estatusCartera(doc))}</td>
            <td class="center col-status">${escapeHtml(estatusLabel(doc.estatus))}</td>
            <td class="center col-folio">&nbsp;</td>
          </tr>
        `,
      )
      .join("");

    // El encabezado se repite en cada página al imprimir gracias a thead, sin usar position:fixed que traslapa filas en páginas 2+.
    const pdfEncabezadoHtml = `
      <div class="header">
        <div class="company">
          <strong>CODIALUB</strong><br />
          Bitácora de cobranza<br />
          Generada desde Client App
        </div>
        <div class="title">Bitácora de Cobranza</div>
        <div class="meta">
          <strong>Folio:</strong> ${escapeHtml(etiquetaBitacora)}<br />
          <strong>Fecha:</strong> ${escapeHtml(fecha)} ${escapeHtml(hora)}<br />
          <strong>Registros:</strong> ${escapeHtml(docsPdf.length)}
        </div>
      </div>
      <div class="summary">
        <div class="box"><span class="label">Vendedor</span>${escapeHtml(vendedorSeleccionado?.nombre ?? "")}</div>
        <div class="box"><span class="label">Código SAP</span>${escapeHtml(slpName)}</div>
        <div class="box"><span class="label">Ruta(s)</span>${escapeHtml(etiquetaRutas)}</div>
        <div class="box"><span class="label">Periodo</span>${escapeHtml(modoPeriodo === "semanal" ? "Semanal" : etiquetaPeriodoDia || "—")}</div>
      </div>
      <div class="legend">
        <strong>Estatus:</strong> V = Vencido, OK = Al Corriente &nbsp;|&nbsp;
        <strong>Estatus de entrega:</strong> S = Sí, N = No, P = Parcialmente
      </div>
    `;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Bitácora de Cobranza ${escapeHtml(etiquetaBitacora)}</title>
          <style>
            @page {
              size: letter landscape;
              margin: 10mm 10mm 14mm 10mm;

              @bottom-right {
                content: "Página " counter(page) " de " counter(pages);
                font-family: Arial, Helvetica, sans-serif;
                font-size: 9px;
                color: #6b7280;
              }
            }
            * { box-sizing: border-box; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
              margin: 0;
              font-size: 12px;
            }
            .header {
              display: grid;
              grid-template-columns: 1fr auto 1fr;
              align-items: start;
              gap: 12px;
              border-bottom: 2px solid #111827;
              padding-bottom: 8px;
              margin-bottom: 8px;
            }
            .company { line-height: 1.35; }
            .title {
              text-align: center;
              font-weight: 700;
              font-size: 18px;
              text-transform: uppercase;
              letter-spacing: .04em;
            }
            .meta {
              text-align: right;
              line-height: 1.45;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 6px;
              margin: 8px 0;
            }
            .box {
              border: 1px solid #9ca3af;
              padding: 5px 6px;
              min-height: 32px;
            }
            .label {
              display: block;
              color: #6b7280;
              font-size: 10px;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .legend {
              border: 1px solid #d1d5db;
              background: #f9fafb;
              padding: 5px 6px;
              margin-bottom: 8px;
              font-size: 11px;
            }
            /*
              thead/tfoot: el navegador repite encabezado y firmas en cada hoja al imprimir.
              No usar position:fixed (traslapa filas en páginas 2+).
            */
            table.report-print {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            table.report-print thead {
              display: table-header-group;
            }
            table.report-print tfoot {
              display: table-footer-group;
            }
            table.report-print tbody tr.data-row {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            .cell-banner,
            .cell-footer {
              border: none;
              padding: 0;
              vertical-align: top;
              background: #fff;
            }
            .cell-banner {
              padding-bottom: 4px;
            }
            .cell-footer {
              padding-top: 20px;
            }
            table.report-print th,
            table.report-print td {
              border: 1px solid #9ca3af;
              padding: 3px 4px;
              vertical-align: middle;
              font-size: 9.5px;
              line-height: 1.2;
            }
            table.report-print td:not(.col-cliente) {
              word-wrap: break-word;
            }
            th {
              background: #e5e7eb;
              font-size: 9px;
              text-transform: uppercase;
              line-height: 1.2;
              vertical-align: middle;
            }
            /* Anchos fijados con <colgroup> (más fiable al imprimir que width en td/th). */
            table.report-print .col-num {
              width: 10px !important;
              min-width: 10px !important;
              max-width: 10px !important;
              padding: 1px 0 !important;
              text-align: center;
              white-space: nowrap;
              font-size: 8px;
            }
            table.report-print th.col-num {
              font-size: 9px;
              line-height: 1.1;
              padding: 1px 0 !important;
            }
            table.report-print td.col-cliente {
              vertical-align: top;
              white-space: normal;
              word-wrap: normal;
              overflow-wrap: normal;
              word-break: normal;
              overflow: visible;
              padding: 3px 8px;
              line-height: 1.3;
            }
            .col-cliente strong {
              display: block;
              font-size: 9px;
              font-weight: 700;
              margin-bottom: 3px;
              white-space: nowrap;
            }
            .col-cliente .cliente-nombre {
              display: block;
              font-size: 10px;
              line-height: 1.35;
              word-break: normal;
              overflow-wrap: normal;
              hyphens: none;
            }
            .col-referencia {
              width: 48px;
              max-width: 48px;
              font-size: 9px;
              line-height: 1.2;
              padding: 2px 2px;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .col-doc {
              width: 54px;
              max-width: 54px;
              font-size: 9px;
              line-height: 1.2;
              padding: 2px 3px;
              text-align: center;
              overflow: hidden;
            }
            .col-doc strong {
              display: block;
              font-size: 11.5px;
              font-weight: 700;
              margin-bottom: 1px;
            }
            .col-condicion {
              width: 52px;
              max-width: 52px;
              font-size: 8.5px;
              line-height: 1.15;
              padding: 2px 2px;
              text-align: center;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            .col-compact {
              width: 36px;
              max-width: 36px;
              font-size: 9.5px;
              padding: 2px 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .col-money {
              width: 44px;
              max-width: 44px;
              font-size: 9px;
              padding: 2px 2px;
              text-align: center;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .col-money.col-total {
              font-weight: 700;
              font-size: 9.5px;
            }
            table.report-print .col-status {
              width: 22px !important;
              min-width: 22px !important;
              max-width: 22px !important;
              font-size: 9.5px;
              padding: 1px 2px !important;
              text-align: center;
              white-space: nowrap;
            }
            table.report-print th.col-status {
              white-space: normal;
              word-wrap: break-word;
              line-height: 1.2;
              padding: 1px 0;
            }
            .col-folio {
              width: 52px;
              max-width: 52px;
              min-height: 14px;
              padding: 2px 3px;
            }
            .center { text-align: center; }
            .right { text-align: right; }
            .totals td {
              background: #f3f4f6;
              font-weight: 700;
            }
            .signatures {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 48px;
              margin-top: 0;
              page-break-inside: avoid;
            }
            .signature {
              text-align: center;
              border-top: 1px solid #111827;
              margin-top: 28px;
              padding-top: 8px;
              font-size: 12px;
              font-weight: 600;
            }
            .footer {
              margin-top: 8px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              color: #6b7280;
              font-size: 10px;
            }
            .print-page-label::after {
              content: "Vista previa · al imprimir se numera cada hoja";
            }
            @media print {
              .no-print { display: none; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
              .print-page-label::after {
                content: "";
              }
            }
          </style>
        </head>
        <body>
          <table class="report-print">
            <colgroup>
              <col style="width:10px" />
              <col style="width:25%" />
              <col style="width:48px" />
              <col style="width:54px" />
              <col style="width:52px" />
              <col style="width:36px" />
              <col style="width:36px" />
              <col style="width:44px" />
              <col style="width:44px" />
              <col style="width:22px" />
              <col style="width:22px" />
              <col style="width:52px" />
            </colgroup>
            <thead>
              <tr>
                <td colspan="12" class="cell-banner">
                  ${pdfEncabezadoHtml}
                </td>
              </tr>
              <tr>
                <th class="col-num">#</th>
                <th class="col-cliente">Cliente</th>
                <th class="col-referencia">Referencias</th>
                <th class="col-doc">Doc</th>
                <th class="col-condicion">Condición</th>
                <th class="col-compact">Fecha</th>
                <th class="col-compact">Vence</th>
                <th class="col-money">Total</th>
                <th class="col-money">Cobr.</th>
                <th class="col-status">Estatus</th>
                <th class="col-status">Entrega</th>
                <th class="col-folio">Folio</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr class="totals data-row">
                <td colspan="7" class="right">Totales</td>
                <td class="center col-money col-total">${escapeHtml(formatCurrency(total))}</td>
                <td class="center col-money">${escapeHtml(formatCurrency(totalCobrado))}</td>
                <td colspan="3"></td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="12" class="cell-footer">
                  <div class="signatures">
                    <div class="signature">Nombre y Firma de Entrega</div>
                    <div class="signature">Nombre y Firma de Recibo</div>
                  </div>
                  <div class="footer">
                    <span>Bitácora ${escapeHtml(etiquetaBitacora)}</span>
                    <span class="print-page-label"></span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </body>
      </html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <div className="space-y-6 p-6">
      <PageMeta
        title="Generador de Bitácoras de Cobranza"
        description="Cree bitácoras de cobranza por vendedor, ruta y periodo."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Generador de Bitácoras de Cobranza
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Seleccione vendedor, ruta y periodo.
          </p>
        </div>
        <Link
          to="/operaciones/ListaBitacorasCobranza"
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          Ver listado de bitácoras
        </Link>
      </div>

      {resolverIdBitacoraActivo() && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          Bitácora activa:{" "}
          <strong>
            {folioBitacoraValido(folioBitacora)
              ? `Folio ${folioBitacora}`
              : `#${resolverIdBitacoraActivo()}`}
          </strong>
          {contextoOperativo?.sucursal && (
            <span className="ml-2 text-blue-700/80 dark:text-blue-200/80">
              ({contextoOperativo.sucursal})
            </span>
          )}
          {!bitacoraTerminada && (
            <span className="mt-1 block text-xs text-blue-700/90 dark:text-blue-200/90">
              Puede cambiar rutas o periodo y volver a generar; los documentos
              ya guardados se muestran en gris. Use &quot;Nueva bitácora&quot;
              para crear otra.
            </span>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          {mensaje}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 border-b border-gray-200 pb-4 dark:border-gray-700">
          <label className={labelClass}>Estatus Bitacora</label>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className={claseBadgeEstatusBitacora(estatusBitacora)}>
              {etiquetaEstatusBitacora(estatusBitacora)}
            </span>
            {/* Se comenta creo no es necesario poner la Letra del estatus ya que el badge ya lo indica y se busca no saturar la interfaz
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({normalizarEstatusBitacora(estatusBitacora) ?? "B"})
            </span>
             */}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass}>Vendedor</label>
            <select
              className={inputClass}
              value={idVendedor}
              onChange={(e) => {
                setIdVendedor(e.target.value ? Number(e.target.value) : "");
                setRutasSeleccionadas(new Set());
                limpiarVistaDocumentos();
              }}
              disabled={loadingCatalogos || bitacoraTerminada || !!idBitacora}
            >
              <option value="">Seleccione vendedor</option>
              {vendedores.map((v) => (
                <option key={v.idUsuario} value={v.idUsuario}>
                  {v.nombre}
                  {v.slpName ? ` (${v.slpName})` : ""}
                </option>
              ))}
            </select>
            <label className={`${labelClass} mt-3`}>Fecha</label>
            <div
              className={`${inputClass} bg-gray-50 text-gray-700 dark:bg-gray-900/40 dark:text-gray-200`}
            >
              {formatearFechaCreacion(fechaCreacionBitacora)}
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className={labelClass}>Rutas (opcional)</label>
              {idVendedor && rutasFiltradas.length > 0 && (
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={todasRutasSeleccionadas}
                    onChange={toggleTodasRutas}
                    disabled={loadingCatalogos || bitacoraTerminada}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                  Todas
                </label>
              )}
            </div>
            <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
              Sin selección = toda la cartera del vendedor.
            </p>
            <div
              className={`${inputClass} max-h-44 space-y-2 overflow-y-auto bg-white p-2 dark:bg-gray-700`}
            >
              {!idVendedor && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Seleccione vendedor primero
                </p>
              )}
              {idVendedor && rutasFiltradas.length === 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Sin rutas registradas; se usará toda la cartera.
                </p>
              )}
              {rutasFiltradas.map((r) => (
                <label
                  key={r.idRuta}
                  className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-0.5 hover:bg-gray-50 dark:hover:bg-gray-600/40"
                >
                  <input
                    type="checkbox"
                    checked={rutasSeleccionadas.has(r.idRuta)}
                    onChange={() => toggleRutaSeleccionada(r.idRuta)}
                    disabled={loadingCatalogos || bitacoraTerminada}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300"
                  />
                  <span className="text-sm leading-snug">
                    <span className="font-medium">{r.codigo}</span>
                    {r.nombre ? (
                      <span className="text-gray-500 dark:text-gray-300">
                        {" "}
                        — {r.nombre}
                      </span>
                    ) : null}
                  </span>
                </label>
              ))}
            </div>
            {codigosRutaSeleccionados.length > 0 && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Seleccionadas: {etiquetaRutas}
              </p>
            )}
          </div>
          {/* Se Comenta Sociedad ya que la vista considera ambas sociedades y no es necesario filtrar

          <div>
            <label className={labelClass}>Sociedad (opcional)</label>
            <input
              type="text"
              className={inputClass}
              value={sociedad}
              onChange={(e) => setSociedad(e.target.value)}
              placeholder="Ej. empresa SAP"
            />
          </div>
          */}

          <div>
            <label className={labelClass}>Periodo</label>
            <select
              className={inputClass}
              value={modoPeriodo}
              onChange={(e) => {
                const modo = e.target.value as ModoPeriodoBitacora;
                setModoPeriodo(modo);
                if (modo === "semanal") {
                  setDiasVisitaSeleccionados(new Set());
                }
                limpiarVistaDocumentos();
              }}
              disabled={bitacoraTerminada}
            >
              <option value="semanal">Semanal (según ruta)</option>
              <option value="dia">Día específico SAP</option>
            </select>
          </div>

          {modoPeriodo === "dia" && (
            <div>
              <div className="mb-1 flex items-center justify-between gap-2">
                <label className={labelClass}>Días de visita SAP</label>
                <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={todosDiasSeleccionados}
                    onChange={toggleTodosDiasVisita}
                    disabled={loadingCatalogos || bitacoraTerminada}
                    className="h-3.5 w-3.5 rounded border-gray-300"
                  />
                  Todos
                </label>
              </div>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                Seleccione uno o más días.
              </p>
              <div
                className={`${inputClass} max-h-44 space-y-2 overflow-y-auto bg-white p-2 dark:bg-gray-700`}
              >
                {DIAS_VISITA.map((d) => (
                  <label
                    key={d.value}
                    className="flex cursor-pointer items-start gap-2 rounded-md px-1 py-0.5 hover:bg-gray-50 dark:hover:bg-gray-600/40"
                  >
                    <input
                      type="checkbox"
                      checked={diasVisitaSeleccionados.has(d.value)}
                      onChange={() => toggleDiaVisitaSeleccionado(d.value)}
                      disabled={loadingCatalogos || bitacoraTerminada}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm leading-snug">{d.label}</span>
                  </label>
                ))}
              </div>
              {diasVisitaSeleccionados.size > 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Seleccionados: {etiquetaPeriodoDia}
                </p>
              )}
            </div>
          )}

          <div className="sm:col-span-2 lg:col-span-3">
            <label className={labelClass}>Observaciones del encabezado</label>
            <textarea
              className={inputClass}
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas generales de la bitácora"
              disabled={bitacoraTerminada}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleGenerar()}
            disabled={loading || loadingCatalogos || bitacoraTerminada}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Generar
          </button>
          <button
            type="button"
            onClick={() => void handleGuardarDetalle()}
            disabled={
              guardando ||
              documentosParaGuardar.length === 0 ||
              bitacoraTerminada
            }
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar nuevos ({documentosParaGuardar.length})
          </button>
          <button
            type="button"
            onClick={() => void handleTerminarBitacora()}
            disabled={!puedeTerminar}
            title={
              !tieneDetallePersistido
                ? "Guarde al menos un detalle primero"
                : bitacoraTerminada
                  ? "La bitácora ya está creada"
                  : "Crear bitácora y cambiar estatus a Creado"
            }
            className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {terminando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Crear
          </button>
          <button
            type="button"
            onClick={handleGenerarPdf}
            disabled={!puedeGenerarPdf}
            title={
              !bitacoraTerminada
                ? "Cree la bitácora (botón Crear) para habilitar el PDF"
                : "Generar PDF"
            }
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Generar PDF
          </button>
          {bitacoraPuedeCerrar && (
            <button
              type="button"
              onClick={() => void handleCerrarBitacora()}
              disabled={cerrando}
              title="Cerrar bitácora (estatus C) en el servidor"
              className="inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"
            >
              {cerrando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lock className="h-4 w-4" />
              )}
              Cerrar bitácora
            </button>
          )}
          {puedeAgregarCliente && (
            <button
              type="button"
              onClick={abrirModalAgregarCliente}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
              <UserPlus className="h-4 w-4" />
              Agregar Cliente
            </button>
          )}
          {idBitacora && (
            <button
              type="button"
              onClick={handleNuevaBitacora}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nueva bitácora
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Documentos ({documentos.length}
              {totalRegistros > documentos.length ? ` / ${totalRegistros}` : ""}
              )
            </h2>
            {documentos.length > 0 && (
              <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400 sm:items-end">
                <span>
                  Nuevos seleccionados: {documentosParaGuardar.length}
                  {totalDocumentosPersistidos > 0
                    ? ` | En bitácora: ${totalDocumentosPersistidos}`
                    : ""}{" "}
                  | Total en lista: {documentos.length}
                  {documentosFiltradosOrdenados.length !== documentos.length
                    ? ` | Mostrando: ${documentosFiltradosOrdenados.length}`
                    : ""}
                </span>
                {(filtroEstatus !== "todos" ||
                  filtroEstatusEntrega.size > 0) && (
                  <span className="text-gray-500 dark:text-gray-400">
                    El filtro define qué filas se muestran y cuáles quedan
                    seleccionados para guardar.
                  </span>
                )}
                <span>
                  Estatus: <strong>OK</strong>=sin saldo por vencer/vencido,{" "}
                  <strong>V</strong>=con saldo por vencer o vencido. Estatus de
                  entrega: <strong>S</strong>=Sí, <strong>N</strong>=No,{" "}
                  <strong>P</strong>=Parcialmente
                </span>
              </div>
            )}
          </div>
        </div>

        {documentos.length > 0 && (
          <div className="flex flex-wrap gap-3 border-b border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Filtrar estatus
              </label>
              <select
                value={filtroEstatus}
                onChange={(e) =>
                  setFiltroEstatus(e.target.value as "todos" | "OK" | "V")
                }
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="todos">Todos</option>
                <option value="OK">OK</option>
                <option value="V">V</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Filtrar estatus de entrega
              </label>
              <div className="flex flex-wrap gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
                {ESTATUS_ENTREGA_OPCIONES.map((value) => (
                  <label
                    key={value}
                    className="inline-flex items-center gap-1 text-sm text-gray-700 dark:text-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={filtroEstatusEntrega.has(value)}
                      onChange={() => toggleFiltroEstatusEntrega(value)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    {value}
                  </label>
                ))}
                <button
                  type="button"
                  onClick={() => setFiltroEstatusEntrega(new Set())}
                  className="ml-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  Todos
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && !documentos.length ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando...
          </div>
        ) : documentos.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Use <strong>Generar</strong> para traer los clientes y documentos de
            cobranza.
          </p>
        ) : (
          <div className="overflow-x-auto">
            {(validandoCobro || cobroValidado) && (
              <div className="border-b border-gray-200 px-4 py-3 dark:border-gray-700">
                {validandoCobro ? (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validando cobro contra Prizma / vista global...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-gray-300">
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        Estatus de cobro:
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-6 rounded border border-blue-200 bg-blue-100 dark:border-blue-800 dark:bg-blue-900/35" />
                        Pago Prizma
                        {resumenValidacionCobro
                          ? ` (${resumenValidacionCobro.pagoPrizma})`
                          : ""}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-6 rounded border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800" />
                        Sin pago
                        {resumenValidacionCobro
                          ? ` (${resumenValidacionCobro.sinPago})`
                          : ""}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-6 rounded border border-amber-200 bg-amber-100 dark:border-amber-800 dark:bg-amber-900/35" />
                        Pago parcial
                        {resumenValidacionCobro
                          ? ` (${resumenValidacionCobro.pagoParcial})`
                          : ""}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-3 w-6 rounded border border-emerald-200 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/35" />
                        Pagado
                        {resumenValidacionCobro
                          ? ` (${resumenValidacionCobro.pagados})`
                          : ""}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        Orden: azul → blanco → amarillo → verde
                      </span>
                    </div>
                    {resumenValidacionCobro && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sincronizados {resumenValidacionCobro.actualizados} de{" "}
                        {resumenValidacionCobro.totalDetalles} · Pendientes{" "}
                        {resumenValidacionCobro.pendientes}
                        {resumenValidacionCobro.fechaSincronizacion
                          ? ` · ${formatearFechaCreacion(resumenValidacionCobro.fechaSincronizacion)}`
                          : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            <table className="min-w-full table-auto divide-y divide-gray-200 text-xs dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="w-10 px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        onChange={toggleSeleccionTodos}
                        disabled={
                          bitacoraTerminada ||
                          documentosSeleccionablesFiltrados.length === 0
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      Check
                    </label>
                  </th>
                  <th className="min-w-[210px] px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Cliente
                  </th>
                  <th className="w-24 px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Doc.
                  </th>
                  <th className="w-36 px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Fechas
                  </th>
                  <th className="w-24 px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Condición
                  </th>
                  <th className="w-28 px-2 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                    Total
                  </th>
                  <th className="w-28 px-2 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                    Cobrado
                  </th>
                  <th className="w-24 px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Estatus
                  </th>
                  <th className="w-32 px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Estatus de Entrega
                  </th>
                  {cobroValidado && (
                    <th className="w-28 px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                      Cobro
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {documentosFiltradosOrdenados.map(({ doc, originalIndex }) => {
                  const key = documentoKey(doc, originalIndex);
                  const claveSeleccion = documentoCobranzaUnicoKey(doc);
                  const persistido = documentoEstaPersistido(
                    doc,
                    clavesDocumentosPersistidos,
                  );
                  const seleccionado =
                    documentosSeleccionados.has(claveSeleccion);
                  const estatus = estatusCartera(doc);
                  const esBorrador = estatusEncabezado === "B";
                  const esContadoPrioritario =
                    esBorrador &&
                    esCondicionContadoPrioritaria(doc) &&
                    !persistido;
                  const filaPorEstatusCobro = cobroValidado
                    ? claseFilaEstatusCobro(doc.estatusCobro) ||
                      "bg-white dark:bg-gray-800"
                    : "";
                  const claseFila = esContadoPrioritario
                    ? claseFilaContadoPrioritario()
                    : esBorrador
                      ? persistido
                        ? "bg-gray-200/80 text-gray-500 dark:bg-gray-800/80 dark:text-gray-400"
                        : seleccionado
                          ? filaPorEstatusCobro || "bg-white dark:bg-gray-800"
                          : "bg-gray-50 text-gray-400 dark:bg-gray-900/30"
                      : filaPorEstatusCobro || "bg-white dark:bg-gray-800";
                  return (
                    <tr key={key} className={claseFila}>
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={persistido ? false : seleccionado}
                          disabled={persistido || bitacoraTerminada}
                          onChange={() => toggleDocumento(doc, persistido)}
                          className="h-4 w-4 rounded border-gray-300 disabled:opacity-60"
                          aria-label={`Seleccionar documento ${doc.docNum}`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div
                          className="max-w-[260px] truncate font-medium"
                          title={doc.cardName}
                        >
                          {doc.cardName}
                        </div>
                        <div className="text-xs">
                          {doc.cardCode}
                          {persistido && (
                            <span className="ml-2 rounded bg-gray-300/80 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 dark:bg-gray-600 dark:text-gray-200">
                              En bitácora
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {doc.docNum}
                        </div>
                        <div
                          className="text-xs text-gray-500"
                          title={etiquetaSociedad(doc.sociedad)}
                        >
                          {etiquetaSociedad(doc.sociedad)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-[11px] leading-5">
                        <div>Emisión: {formatearFecha(doc.docDate)}</div>
                        <div>Vence: {formatearFecha(doc.docDueDate)}</div>
                        <div className="text-gray-500">
                          {doc.diasVencido} días
                        </div>
                      </td>
                      <td
                        className="max-w-[96px] px-2 py-2 text-[11px] leading-5"
                        title={etiquetaCondicionDocumento(doc)}
                      >
                        {etiquetaCondicionDocumento(doc)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right">
                        {formatCurrency(doc.docTotal)}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2 text-right">
                        {formatCurrency(montoCobrado(doc))}
                      </td>
                      <td className="whitespace-nowrap px-2 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${estatusCarteraClass(estatus)}`}
                        >
                          {estatus}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-2 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${estatusClass(doc.estatus)}`}
                        >
                          {estatusLabel(doc.estatus)}
                        </span>
                      </td>
                      {cobroValidado && (
                        <td className="whitespace-nowrap px-2 py-2">
                          <span className="text-[11px] font-medium text-gray-800 dark:text-gray-100">
                            {etiquetaEstatusCobro(doc.estatusCobro)}
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAgregarClienteAbierto && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-agregar-cliente-titulo"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrarModalAgregarCliente();
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3
                    id="modal-agregar-cliente-titulo"
                    className="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    Agregar cliente a la bitácora
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Seleccione el cliente y valide el folio/documento antes de
                    agregarlo al detalle.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={cerrarModalAgregarCliente}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Cerrar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${
                    etapaModalAgregar === 1
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-xs font-bold dark:bg-gray-900/50">
                    1
                  </span>
                  Buscar y seleccionar cliente
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${
                    etapaModalAgregar === 2
                      ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                  }`}
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-xs font-bold dark:bg-gray-900/50">
                    2
                  </span>
                  Elegir documentos / folios
                </div>
              </div>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              {etapaModalAgregar === 1 ? (
                <>
                  <div>
                    <label className={labelClass}>
                      Paso 1 · Buscar cliente
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="search"
                        autoFocus
                        value={busquedaCliente}
                        onChange={(e) => {
                          setBusquedaCliente(e.target.value);
                          setClienteSeleccionadoBusqueda(null);
                        }}
                        placeholder="Código, nombre o RFC (mín. 2 caracteres)"
                        className={`${inputClass} pl-9`}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Seleccione un cliente y pulse &quot;Ver documentos&quot;
                      para continuar al paso 2.
                    </p>
                  </div>

                  <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="border-b border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900/40">
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        Clientes encontrados
                        {totalClientesBusqueda > 0
                          ? ` (${totalClientesBusqueda})`
                          : resultadosClientes.length > 0
                            ? ` (${resultadosClientes.length})`
                            : ""}
                      </span>
                    </div>

                    <div className="max-h-72 overflow-y-auto">
                      {buscandoClientes ? (
                        <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Buscando...
                        </div>
                      ) : busquedaCliente.trim().length < 2 ? (
                        <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          Escriba al menos 2 caracteres para buscar.
                        </p>
                      ) : resultadosClientes.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                          No se encontraron clientes.
                        </p>
                      ) : (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                          {resultadosClientes.map((cliente) => {
                            const key = clienteBitacoraBusquedaKey(cliente);
                            const seleccionado =
                              clienteSeleccionadoBusqueda != null &&
                              clienteBitacoraBusquedaKey(
                                clienteSeleccionadoBusqueda,
                              ) === key;
                            return (
                              <li key={key}>
                                <div
                                  className={`flex items-start gap-3 px-4 py-3 ${
                                    seleccionado
                                      ? "bg-amber-50 ring-1 ring-inset ring-amber-200 dark:bg-amber-900/20 dark:ring-amber-800"
                                      : "hover:bg-gray-50 dark:hover:bg-gray-700/40"
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name="cliente-busqueda"
                                    checked={seleccionado}
                                    onChange={() =>
                                      preseleccionarClienteBusqueda(cliente)
                                    }
                                    className="mt-1 h-4 w-4 border-gray-300 text-amber-600"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      preseleccionarClienteBusqueda(cliente)
                                    }
                                    className="min-w-0 flex-1 text-left"
                                  >
                                    <span className="block font-medium text-gray-900 dark:text-white">
                                      {cliente.cardName || "—"}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                                      Código: {cliente.cardCode}
                                      {cliente.sociedad
                                        ? ` · ${cliente.sociedad}`
                                        : ""}
                                      {cliente.documentos > 0
                                        ? ` · ${cliente.documentos} doc(s)`
                                        : ""}
                                    </span>
                                    <span className="mt-1 block text-xs text-gray-600 dark:text-gray-300">
                                      Saldo:{" "}
                                      {formatCurrency(cliente.saldoTotal)}
                                      {cliente.carteraVencida > 0
                                        ? ` · Vencida: ${formatCurrency(cliente.carteraVencida)}`
                                        : ""}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void seleccionarClienteParaDocumentos(
                                        cliente,
                                      )
                                    }
                                    disabled={cargandoDocumentosCliente}
                                    className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                                  >
                                    Ver docs
                                    <ChevronRight className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  </div>

                  {clienteSeleccionadoBusqueda && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-100">
                      Cliente seleccionado:{" "}
                      <strong>{clienteSeleccionadoBusqueda.cardName}</strong> (
                      {clienteSeleccionadoBusqueda.cardCode})
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
                    <div className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                      Paso 2 · Cliente seleccionado
                    </div>
                    <div className="mt-1 font-medium text-gray-900 dark:text-white">
                      {clienteActivo?.cardName || "—"}
                    </div>
                    <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                      {clienteActivo?.cardCode}
                      {clienteActivo?.sociedad
                        ? ` · ${clienteActivo.sociedad}`
                        : ""}
                      {clienteActivo
                        ? ` · Saldo ${formatCurrency(clienteActivo.saldoTotal)}`
                        : ""}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <label className={labelClass}>
                        Documentos del cliente — valide folio SAP y referencia
                      </label>
                      {documentosCliente.length > 0 && (
                        <label className="inline-flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300">
                          <input
                            type="checkbox"
                            checked={todosDocumentosClienteSeleccionados}
                            onChange={toggleSeleccionTodosDocumentosCliente}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          Seleccionar todos disponibles
                        </label>
                      )}
                    </div>

                    <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                      {cargandoDocumentosCliente ? (
                        <div className="flex items-center justify-center gap-2 py-12 text-sm text-gray-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cargando documentos del cliente...
                        </div>
                      ) : documentosCliente.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
                          No hay documentos disponibles para este cliente.
                        </p>
                      ) : (
                        documentosCliente.map((doc) => {
                          const key = documentoCobranzaUnicoKey(doc);
                          const yaEnBitacora = documentosYaEnBitacora.has(key);
                          const seleccionado =
                            documentosClienteSeleccionados.has(key);
                          const estatus = estatusCartera(doc);

                          return (
                            <label
                              key={key}
                              className={`block cursor-pointer rounded-xl border p-4 transition-colors ${
                                yaEnBitacora
                                  ? "cursor-not-allowed border-gray-200 bg-gray-50 opacity-70 dark:border-gray-700 dark:bg-gray-900/30"
                                  : seleccionado
                                    ? "border-amber-400 bg-amber-50 ring-1 ring-amber-300 dark:border-amber-600 dark:bg-amber-900/20 dark:ring-amber-700"
                                    : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={seleccionado}
                                  disabled={yaEnBitacora}
                                  onChange={() => toggleDocumentoCliente(doc)}
                                  className="mt-1 h-4 w-4 rounded border-gray-300"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <div>
                                      <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                        Folio SAP (DocNum)
                                      </div>
                                      <div className="text-xl font-bold text-gray-900 dark:text-white">
                                        {doc.docNum}
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Saldo documento
                                      </div>
                                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {formatCurrency(doc.saldoDocumento)}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                                      <div className="text-[10px] font-semibold uppercase text-gray-500">
                                        Referencia / Folio cliente
                                      </div>
                                      <div className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                                        {etiquetaReferenciaDocumento(doc)}
                                      </div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                                      <div className="text-[10px] font-semibold uppercase text-gray-500">
                                        Sociedad
                                      </div>
                                      <div className="mt-0.5 text-sm font-medium text-gray-900 dark:text-white">
                                        {etiquetaSociedad(doc.sociedad)}
                                      </div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                                      <div className="text-[10px] font-semibold uppercase text-gray-500">
                                        Cliente
                                      </div>
                                      <div className="mt-0.5 truncate text-sm font-medium text-gray-900 dark:text-white">
                                        {doc.cardCode}
                                      </div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                                      <div className="text-[10px] font-semibold uppercase text-gray-500">
                                        Emisión
                                      </div>
                                      <div className="mt-0.5 text-sm text-gray-900 dark:text-white">
                                        {formatearFecha(doc.docDate)}
                                      </div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                                      <div className="text-[10px] font-semibold uppercase text-gray-500">
                                        Vencimiento
                                      </div>
                                      <div className="mt-0.5 text-sm text-gray-900 dark:text-white">
                                        {formatearFecha(doc.docDueDate)}
                                      </div>
                                    </div>
                                    <div className="rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900/40">
                                      <div className="text-[10px] font-semibold uppercase text-gray-500">
                                        Días vencido
                                      </div>
                                      <div className="mt-0.5 text-sm text-gray-900 dark:text-white">
                                        {doc.diasVencido}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${estatusCarteraClass(estatus)}`}
                                    >
                                      Cartera: {estatus}
                                    </span>
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${estatusClass(doc.estatus)}`}
                                    >
                                      Entrega: {estatusLabel(doc.estatus)}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      Total: {formatCurrency(doc.docTotal)} ·
                                      Cobrado:{" "}
                                      {formatCurrency(montoCobrado(doc))}
                                    </span>
                                    {doc.u_BXP_RUTA ? (
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        Ruta: {doc.u_BXP_RUTA}
                                      </span>
                                    ) : null}
                                    {yaEnBitacora ? (
                                      <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                                        Ya en la bitácora
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}

              {errorBusquedaClientes && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
                  {errorBusquedaClientes}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
              {etapaModalAgregar === 2 ? (
                <button
                  type="button"
                  onClick={volverABusquedaClientes}
                  disabled={cargandoDocumentosCliente}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al paso 1
                </button>
              ) : (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {clienteSeleccionadoBusqueda
                    ? "Puede continuar para ver los documentos del cliente."
                    : "Seleccione un cliente de la lista."}
                </span>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cerrarModalAgregarCliente}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                {etapaModalAgregar === 1 ? (
                  <button
                    type="button"
                    onClick={continuarConClienteSeleccionado}
                    disabled={
                      !clienteSeleccionadoBusqueda || cargandoDocumentosCliente
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {cargandoDocumentosCliente ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Ver documentos
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConfirmarAgregarDocumentos}
                    disabled={
                      cargandoDocumentosCliente ||
                      documentosClienteSeleccionados.size === 0
                    }
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    Agregar al detalle ({documentosClienteSeleccionados.size})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
