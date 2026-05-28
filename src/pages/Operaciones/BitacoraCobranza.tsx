import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Plus, Save } from "lucide-react";
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
  calcularVencidas,
  detalleToDocumentoGenerar,
  DIAS_VISITA,
  DocumentoCobranzaGenerar,
  ModoPeriodoBitacora,
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

function documentoKey(doc: DocumentoCobranzaGenerar, index: number): string {
  return `${doc.sociedad ?? ""}|${doc.cardCode}|${doc.docNum}|${doc.docDate}|${index}`;
}

function estatusLabel(estatus: string | null | undefined): string {
  const value = (estatus ?? "").trim().toUpperCase();
  if (value === "S" || value === "N" || value === "P") return value;
  return value || "—";
}

function estatusCartera(doc: DocumentoCobranzaGenerar): "OK" | "V" {
  return doc.porVencer > 0 || calcularVencidas(doc) > 0 ? "V" : "OK";
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

function etiquetaFolioBitacora(
  folio: number | null | undefined,
  idBitacora: number,
): string {
  if (folio != null && folio > 0) return `folio ${folio}`;
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
  const [idRuta, setIdRuta] = useState<number | "">("");
  const [modoPeriodo, setModoPeriodo] =
    useState<ModoPeriodoBitacora>("semanal");
  const [diaVisita, setDiaVisita] = useState<string>(DIAS_VISITA[0].value);
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
  const [documentos, setDocumentos] = useState<DocumentoCobranzaGenerar[]>([]);
  const [documentosSeleccionados, setDocumentosSeleccionados] = useState<
    Set<string>
  >(new Set());
  const [totalRegistros, setTotalRegistros] = useState(0);
  const [detalleGuardado, setDetalleGuardado] = useState(false);

  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const vendedorSeleccionado = useMemo(
    () => vendedores.find((v) => v.idUsuario === idVendedor) ?? null,
    [vendedores, idVendedor],
  );

  const rutaSeleccionada = useMemo(
    () => rutas.find((r) => r.idRuta === idRuta) ?? null,
    [rutas, idRuta],
  );

  const slpName =
    vendedorSeleccionado?.slpName ?? vendedorSeleccionado?.username ?? "";
  const rutasFiltradas = useMemo(
    () => filtrarRutasPorVendedor(rutas, vendedorSeleccionado),
    [rutas, vendedorSeleccionado],
  );
  const codigoRuta = rutaSeleccionada?.codigo ?? "";
  const documentosParaGuardar = useMemo(
    () =>
      documentos.filter((doc, idx) =>
        documentosSeleccionados.has(documentoKey(doc, idx)),
      ),
    [documentos, documentosSeleccionados],
  );
  const documentosFiltradosOrdenados = useMemo<DocumentoConIndice[]>(() => {
    return documentos
      .map((doc, originalIndex) => ({ doc, originalIndex }))
      .filter(({ doc }) => {
        if (
          filtroEstatus !== "todos" &&
          estatusCartera(doc) !== filtroEstatus
        ) {
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
      })
      .sort((a, b) => {
        const cliente = a.doc.cardName.localeCompare(b.doc.cardName, "es", {
          sensitivity: "base",
        });
        if (cliente !== 0) return cliente;
        return a.doc.docNum - b.doc.docNum;
      });
  }, [documentos, filtroEstatus, filtroEstatusEntrega]);
  const todosSeleccionados =
    documentosFiltradosOrdenados.length > 0 &&
    documentosFiltradosOrdenados.every(({ doc, originalIndex }) =>
      documentosSeleccionados.has(documentoKey(doc, originalIndex)),
    );

  const etiquetaBitacora = useMemo(() => {
    if (folioBitacora != null && folioBitacora > 0) {
      return String(folioBitacora);
    }
    if (idBitacora) return `#${idBitacora}`;
    return "";
  }, [folioBitacora, idBitacora]);

  useEffect(() => {
    if (!documentos.length) {
      setDocumentosSeleccionados(new Set());
      return;
    }

    setDocumentosSeleccionados(
      new Set(
        documentosFiltradosOrdenados.map(({ doc, originalIndex }) =>
          documentoKey(doc, originalIndex),
        ),
      ),
    );
  }, [documentos.length, documentosFiltradosOrdenados]);

  const cargarBitacoraExistente = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const bitacora = await bitacoraCobranzaService.getBitacoraPorId(id);
      setIdBitacora(bitacora.idBitacora);
      setFolioBitacora(bitacora.folio);
      setIdVendedor(bitacora.idVendedor);
      setIdRuta(bitacora.idRuta);
      setObservaciones(bitacora.observaciones ?? "");
      const detalle = await bitacoraCobranzaService.getDetallePorBitacora(id);
      const documentosDetalle = detalle.map(detalleToDocumentoGenerar);
      const primeraSociedad = documentosDetalle.find((d) => d.sociedad?.trim())
        ?.sociedad;
      if (primeraSociedad) {
        setSociedad(primeraSociedad);
      }
      setTotalRegistros(detalle.length);
      setDocumentos(documentosDetalle);
      setDocumentosSeleccionados(
        new Set(documentosDetalle.map((doc, idx) => documentoKey(doc, idx))),
      );
      setDetalleGuardado(detalle.length > 0);
      const folioLabel =
        bitacora.folio != null && bitacora.folio > 0
          ? `folio ${bitacora.folio}`
          : `#${id}`;
      setMensaje(`Bitácora ${folioLabel} cargada (${detalle.length} registros).`);
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
        setContextoOperativo(
          await getContextoOperativoPersona(user.idPersona),
        );
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

  const validarFiltros = (): string | null => {
    if (!idVendedor) return "Seleccione un vendedor.";
    if (!idRuta) return "Seleccione una ruta.";
    if (!slpName) return "El vendedor no tiene código SAP (slpName).";
    if (!codigoRuta) return "La ruta no tiene código.";
    if (modoPeriodo === "dia" && !diaVisita)
      return "Seleccione el día de visita.";
    return null;
  };

  const crearEncabezado = async (): Promise<BitacoraCobranzaModel> => {
    const validacion = validarFiltros();
    if (validacion) throw new Error(validacion);
    if (!rutaSeleccionada) throw new Error("Ruta no válida.");
    if (!user?.idPersona) {
      throw new Error("No hay sesión de usuario para obtener empresa y sucursal.");
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
      idRuta: idRuta as number,
      idUsuarioCreacion: idUsuario,
      observaciones: observaciones.trim() || null,
      activo: true,
    };

    const creada = await bitacoraCobranzaService.crearBitacora(payload);
    setIdBitacora(creada.idBitacora);
    setFolioBitacora(creada.folio);
    return creada;
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
      let bitacoraId = idBitacora;
      let bitacoraRef: BitacoraCobranzaModel | null = null;
      if (!bitacoraId) {
        bitacoraRef = await crearEncabezado();
        bitacoraId = bitacoraRef.idBitacora;
      }

      const params = {
        slpName,
        uBxpRuta: codigoRuta,
        sociedad: sociedad.trim() || undefined,
      };

      const resultado =
        modoPeriodo === "semanal"
          ? await bitacoraCobranzaService.generarDocumentosSemanal(params)
          : await bitacoraCobranzaService.generarDocumentos({
              ...params,
              uDiaVisita: diaVisita,
            });

      if (resultado.sociedad && !sociedad.trim()) {
        setSociedad(resultado.sociedad);
      }

      setDocumentos(resultado.documentos);
      setDocumentosSeleccionados(
        new Set(resultado.documentos.map((doc, idx) => documentoKey(doc, idx))),
      );
      setTotalRegistros(resultado.totalRegistros);
      setDetalleGuardado(false);
      const refFolio = bitacoraRef?.folio ?? folioBitacora;
      setMensaje(
        `Se generaron ${resultado.documentos.length} documento(s) para la bitácora ${etiquetaFolioBitacora(refFolio, bitacoraId)}. Revise el listado y guarde el detalle.`,
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
    if (!documentos.length) {
      setError("No hay documentos para guardar. Use Generar primero.");
      return;
    }
    if (!documentosParaGuardar.length) {
      setError("Seleccione al menos un documento para guardar.");
      return;
    }

    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      let bitacoraId = idBitacora;
      let bitacoraRef: BitacoraCobranzaModel | null = null;
      if (!bitacoraId) {
        bitacoraRef = await crearEncabezado();
        bitacoraId = bitacoraRef.idBitacora;
      }

      const idUsuario =
        user?.idPersona ?? (typeof idVendedor === "number" ? idVendedor : 0);
      await bitacoraCobranzaService.guardarDetalleEnLote(
        documentosParaGuardar,
        bitacoraId,
        idUsuario,
      );
      const refFolio = bitacoraRef?.folio ?? folioBitacora;
      setMensaje(
        `Se guardaron ${documentosParaGuardar.length} registro(s) en la bitácora ${etiquetaFolioBitacora(refFolio, bitacoraId)}.`,
      );
      setDetalleGuardado(true);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el detalle.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const toggleSeleccionTodos = () => {
    const keysVisibles = documentosFiltradosOrdenados.map(
      ({ doc, originalIndex }) => documentoKey(doc, originalIndex),
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

  const toggleDocumento = (key: string) => {
    setDocumentosSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleNuevaBitacora = () => {
    setIdBitacora(null);
    setFolioBitacora(null);
    setIdVendedor("");
    setIdRuta("");
    setModoPeriodo("semanal");
    setDiaVisita(DIAS_VISITA[0].value);
    setSociedad("");
    setObservaciones("");
    setFiltroEstatus("todos");
    setFiltroEstatusEntrega(new Set());
    setDocumentos([]);
    setDocumentosSeleccionados(new Set());
    setTotalRegistros(0);
    setDetalleGuardado(false);
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

  const handleGenerarPdf = () => {
    const docsPdf = documentosParaGuardar.length
      ? documentosParaGuardar
      : documentos;
    if (!idBitacora || !docsPdf.length) {
      setError("No hay detalle guardado para generar el PDF.");
      return;
    }

    const win = window.open("about:blank", "_blank");
    if (!win) {
      setError(
        "No se pudo abrir la ventana de impresión. Permita ventanas emergentes para esta página.",
      );
      return;
    }

    const total = docsPdf.reduce((sum, doc) => sum + doc.saldoDocumento, 0);
    const totalCobrado = docsPdf.reduce((sum, doc) => sum + montoCobrado(doc), 0);
    const fecha = new Date().toLocaleDateString("es-MX");
    const hora = new Date().toLocaleTimeString("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const rows = docsPdf
      .map(
        (doc, idx) => `
          <tr>
            <td class="center col-num">${idx + 1}</td>
            <td class="col-cliente">
              <strong>${escapeHtml(doc.cardCode)}</strong>
              ${escapeHtml(doc.cardName)}
            </td>
            <td class="col-doc">
              <strong>${escapeHtml(doc.docNum)}</strong>
              ${escapeHtml(etiquetaSociedad(doc.sociedad))}
            </td>
            <td class="center col-compact">${escapeHtml(formatearFecha(doc.docDate))}</td>
            <td class="center col-compact">${escapeHtml(formatearFecha(doc.docDueDate))}</td>
            <td class="center col-money">${escapeHtml(formatCurrency(doc.saldoDocumento))}</td>
            <td class="center col-money">${escapeHtml(formatCurrency(montoCobrado(doc)))}</td>
            <td class="center col-status">${escapeHtml(estatusCartera(doc))}</td>
            <td class="center col-status">${escapeHtml(estatusLabel(doc.estatus))}</td>
            <td class="center col-folio">&nbsp;</td>
          </tr>
        `,
      )
      .join("");

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Bitácora de Cobranza ${escapeHtml(etiquetaBitacora)}</title>
          <style>
            @page { size: letter landscape; margin: 10mm; }
            * { box-sizing: border-box; }
            body {
              font-family: Arial, Helvetica, sans-serif;
              color: #111827;
              margin: 0;
              font-size: 10px;
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
              font-size: 16px;
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
              font-size: 8px;
              text-transform: uppercase;
              margin-bottom: 2px;
            }
            .legend {
              border: 1px solid #d1d5db;
              background: #f9fafb;
              padding: 5px 6px;
              margin-bottom: 8px;
              font-size: 9px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              table-layout: fixed;
            }
            th, td {
              border: 1px solid #9ca3af;
              padding: 3px 4px;
              vertical-align: top;
              word-wrap: break-word;
            }
            th {
              background: #e5e7eb;
              font-size: 7px;
              text-transform: uppercase;
              line-height: 1.2;
            }
            .col-num { width: 22px; }
            .col-cliente {
              width: 118px;
              max-width: 118px;
              font-size: 7.5px;
              line-height: 1.2;
              padding: 2px 3px;
              overflow: hidden;
            }
            .col-cliente strong {
              display: block;
              font-size: 7px;
              margin-bottom: 1px;
            }
            .col-doc {
              width: 54px;
              max-width: 54px;
              font-size: 7.5px;
              line-height: 1.2;
              padding: 2px 3px;
              text-align: center;
              overflow: hidden;
            }
            .col-doc strong {
              display: block;
              font-size: 7px;
              margin-bottom: 1px;
            }
            .col-compact {
              width: 46px;
              max-width: 46px;
              font-size: 7.5px;
              padding: 2px 2px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .col-money {
              width: 48px;
              max-width: 48px;
              font-size: 7px;
              padding: 2px 2px;
              text-align: center;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .col-status {
              width: 30px;
              max-width: 30px;
              font-size: 7.5px;
              padding: 2px 2px;
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
              margin-top: 36px;
              page-break-inside: avoid;
            }
            .signature {
              text-align: center;
              border-top: 1px solid #111827;
              padding-top: 6px;
              font-size: 10px;
            }
            .footer {
              margin-top: 8px;
              display: flex;
              justify-content: space-between;
              color: #6b7280;
              font-size: 8px;
            }
            @media print {
              .no-print { display: none; }
              body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
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
            <div class="box"><span class="label">Ruta</span>${escapeHtml(codigoRuta)}</div>
            <div class="box"><span class="label">Periodo</span>${escapeHtml(modoPeriodo === "semanal" ? "Semanal" : `Día ${diaVisita}`)}</div>
          </div>

          <div class="legend">
            <strong>Estatus:</strong> V = Vencido, OK = Al Corriente &nbsp;|&nbsp;
            <strong>Estatus de entrega:</strong> S = Sí, N = No, P = Parcialmente
          </div>

          <table>
            <thead>
              <tr>
                <th class="col-num">#</th>
                <th class="col-cliente">Cliente</th>
                <th class="col-doc">Doc</th>
                <th class="col-compact">Fecha</th>
                <th class="col-compact">Vence</th>
                <th class="col-money">Total</th>
                <th class="col-money">Cobr.</th>
                <th class="col-status">Est.</th>
                <th class="col-status">Ent.</th>
                <th class="col-folio">Folio</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
              <tr class="totals">
                <td colspan="5" class="right">Totales</td>
                <td class="center col-money">${escapeHtml(formatCurrency(total))}</td>
                <td class="center col-money">${escapeHtml(formatCurrency(totalCobrado))}</td>
                <td colspan="3"></td>
              </tr>
            </tbody>
          </table>

          <div class="signatures">
            <div class="signature">Agente / Asesor de Entregas</div>
            <div class="signature">Agente / Asesor de Retorno</div>
          </div>

          <div class="footer">
            <span>Bitácora ${escapeHtml(etiquetaBitacora)}</span>
            <span>Página generada para impresión/PDF</span>
          </div>
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

      {idBitacora && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          Bitácora activa:{" "}
          <strong>
            {folioBitacora != null && folioBitacora > 0
              ? `Folio ${folioBitacora}`
              : `#${idBitacora}`}
          </strong>
          {contextoOperativo?.sucursal && (
            <span className="ml-2 text-blue-700/80 dark:text-blue-200/80">
              ({contextoOperativo.sucursal})
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass}>Vendedor</label>
            <select
              className={inputClass}
              value={idVendedor}
              onChange={(e) => {
                setIdVendedor(e.target.value ? Number(e.target.value) : "");
                setIdRuta("");
                setIdBitacora(null);
                setFolioBitacora(null);
                setDocumentos([]);
                setDocumentosSeleccionados(new Set());
                setDetalleGuardado(false);
              }}
              disabled={loadingCatalogos || detalleGuardado}
            >
              <option value="">Seleccione vendedor</option>
              {vendedores.map((v) => (
                <option key={v.idUsuario} value={v.idUsuario}>
                  {v.nombre}
                  {v.slpName ? ` (${v.slpName})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Ruta</label>
            <select
              className={inputClass}
              value={idRuta}
              onChange={(e) => {
                setIdRuta(e.target.value ? Number(e.target.value) : "");
                setIdBitacora(null);
                setDocumentos([]);
                setDocumentosSeleccionados(new Set());
                setDetalleGuardado(false);
              }}
              disabled={loadingCatalogos || detalleGuardado || !idVendedor}
            >
              <option value="">Seleccione ruta</option>
              {!idVendedor && (
                <option value="" disabled>
                  Seleccione vendedor primero
                </option>
              )}
              {idVendedor && rutasFiltradas.length === 0 && (
                <option value="" disabled>
                  Sin rutas para este vendedor
                </option>
              )}
              {rutasFiltradas.map((r) => (
                <option key={r.idRuta} value={r.idRuta}>
                  {r.codigo}
                </option>
              ))}
            </select>
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
              onChange={(e) =>
                setModoPeriodo(e.target.value as ModoPeriodoBitacora)
              }
              disabled={detalleGuardado}
            >
              <option value="semanal">Semanal (según ruta)</option>
              <option value="dia">Día específico SAP</option>
            </select>
          </div>

          {modoPeriodo === "dia" && (
            <div>
              <label className={labelClass}>Día de visita SAP</label>
              <select
                className={inputClass}
                value={diaVisita}
                onChange={(e) => setDiaVisita(e.target.value)}
                disabled={detalleGuardado}
              >
                {DIAS_VISITA.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
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
              disabled={detalleGuardado}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void handleGenerar()}
            disabled={loading || loadingCatalogos || detalleGuardado}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Generar
          </button>
          <button
            type="button"
            onClick={() => void handleGuardarDetalle()}
            disabled={guardando || !documentos.length || detalleGuardado}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            {guardando ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar detalle ({documentosParaGuardar.length})
          </button>
          <button
            type="button"
            onClick={handleGenerarPdf}
            disabled={!detalleGuardado || !idBitacora}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            <FileText className="h-4 w-4" />
            Generar PDF
          </button>
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
                  Seleccionados: {documentosParaGuardar.length} de{" "}
                  {documentos.length}
                  {documentosFiltradosOrdenados.length !== documentos.length
                    ? ` | Mostrando: ${documentosFiltradosOrdenados.length}`
                    : ""}
                </span>
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
            <table className="min-w-full table-auto divide-y divide-gray-200 text-xs dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="w-10 px-2 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    <label className="inline-flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        onChange={toggleSeleccionTodos}
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {documentosFiltradosOrdenados.map(({ doc, originalIndex }) => {
                  const key = documentoKey(doc, originalIndex);
                  const seleccionado = documentosSeleccionados.has(key);
                  const estatus = estatusCartera(doc);
                  return (
                    <tr
                      key={key}
                      className={
                        seleccionado
                          ? ""
                          : "bg-gray-50 text-gray-400 dark:bg-gray-900/30"
                      }
                    >
                      <td className="px-2 py-2">
                        <input
                          type="checkbox"
                          checked={seleccionado}
                          onChange={() => toggleDocumento(key)}
                          className="h-4 w-4 rounded border-gray-300"
                          aria-label={`Seleccionar documento ${doc.docNum}`}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <div
                          className="max-w-[260px] truncate font-medium text-gray-900 dark:text-white"
                          title={doc.cardName}
                        >
                          {doc.cardName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {doc.cardCode}
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
                      <td className="whitespace-nowrap px-2 py-2 text-right">
                        {formatCurrency(doc.saldoDocumento)}
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
