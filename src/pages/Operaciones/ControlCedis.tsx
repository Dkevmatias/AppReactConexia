import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  Package,
  AlertCircle,
  ScanBarcode,
  Printer,
  PlusCircle,
  ArrowLeft,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import {
  inventarioCedisService,
  InventarioCedisItem,
  InventarioCedisPayload,
  InventarioHistoryPayload,
  InventarioGuardado,
} from "../../services/transferCedisService";
import { useAuth } from "../../hooks/useAuth";
import { generarPdfEntregaMercancia } from "./generarPdfEntregaMercancia";

type TransferRow = InventarioCedisItem & {
  enviado: number;
};

/** Compara códigos ignorando mayúsculas y espacios (PT 00689 ≡ PT00689). */
const normalizarCodigo = (value: string) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, "");

/** Piezas a sumar según el múltiplo del código de barras escaneado. */
const cantidadPorCodigoEscaneado = (
  row: TransferRow,
  codigoEscaneado: string,
): number => {
  const codigoNorm = normalizarCodigo(codigoEscaneado);
  if (!codigoNorm) return 1;

  for (const item of row.codigoBarra ?? []) {
    if (normalizarCodigo(item.codigo) === codigoNorm) {
      const m = Number(item.multiplo);
      return Number.isFinite(m) && m > 0 ? m : 1;
    }
  }

  // Coincide por itemCode / proveedor sin entrada en codigoBarra → 1 pieza.
  return 1;
};

const coincideCodigo = (row: TransferRow, codigo: string) => {
  const codigoNorm = normalizarCodigo(codigo);
  if (!codigoNorm) return false;

  for (const item of row.codigoBarra ?? []) {
    if (normalizarCodigo(item.codigo) === codigoNorm) return true;
  }
  if (normalizarCodigo(row.itemCode) === codigoNorm) return true;
  if (normalizarCodigo(row.codigoProveedor) === codigoNorm) return true;
  return false;
};

const formatDate = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("es-MX");
};

const getRowStatus = (solicitado: number, enviado: number) => {
  if (enviado === 0) return "neutral";
  if (enviado === solicitado) return "ok";
  if (enviado < solicitado) return "parcial";
  return "exceso";
};

const getDetalleEstatus = (solicitado: number, surtido: number) => {
  if (surtido === 0) return "P";
  if (surtido === solicitado) return "C";
  if (surtido < solicitado) return "P";
  return "E";
};

const rowStatusClass: Record<string, string> = {
  neutral: "hover:bg-gray-50 dark:hover:bg-gray-700/50",
  ok: "bg-green-100 dark:bg-green-900/40",
  parcial: "bg-amber-100 dark:bg-amber-900/40",
  exceso: "bg-red-100 dark:bg-red-900/40",
};

const ControlCedis = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const idTraspasoParam = Number(searchParams.get("idTraspaso") || 0);
  const modoConsulta = idTraspasoParam > 0;

  const [folio, setFolio] = useState("");
  const [resultados, setResultados] = useState<TransferRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codigoBarras, setCodigoBarras] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanOk, setScanOk] = useState<string | null>(null);
  const [confirmEdit, setConfirmEdit] = useState<{
    index: number;
    itemCode: string;
    folio: string;
    solicitado: number;
    valorAnterior: number;
    valorNuevo: number;
  } | null>(null);
  const [motivo, setMotivo] = useState("");
  const [motivoError, setMotivoError] = useState<string | null>(null);
  const [guardandoHistorial, setGuardandoHistorial] = useState(false);
  const [confirmTerminar, setConfirmTerminar] = useState(false);
  const [confirmParcial, setConfirmParcial] = useState(false);
  const [itemsParciales, setItemsParciales] = useState<TransferRow[]>([]);
  const [procesoTerminado, setProcesoTerminado] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [traspasoGuardado, setTraspasoGuardado] =
    useState<InventarioGuardado | null>(null);
  const [modalOperador, setModalOperador] = useState(false);
  const [nombreOperador, setNombreOperador] = useState("");
  const [operadorError, setOperadorError] = useState<string | null>(null);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [clienteConsulta, setClienteConsulta] = useState("");

  const scannerRef = useRef<HTMLInputElement>(null);
  const editDraftRef = useRef<Record<number, string>>({});
  const editOriginalRef = useRef<Record<number, number>>({});
  const procesando = resultados.length > 0;
  const procesandoActivo = procesando && !procesoTerminado && !modoConsulta;
  useEffect(() => {
    if (
      procesandoActivo &&
      !confirmEdit &&
      !confirmTerminar &&
      !confirmParcial
    ) {
      scannerRef.current?.focus();
    }
  }, [procesandoActivo, confirmEdit, confirmTerminar, confirmParcial]);

  useEffect(() => {
    if (!modoConsulta) return;
    let cancelled = false;

    const cargarConsulta = async () => {
      setLoading(true);
      setError(null);
      try {
        const traspaso =
          await inventarioCedisService.getTraspasoById(idTraspasoParam);
        if (cancelled) return;

        const docNum = traspaso.docNum?.toString() || "";
        let origen: InventarioCedisItem[] = [];
        if (docNum) {
          origen = await inventarioCedisService.getByFolioRetail(docNum);
        }
        if (cancelled) return;

        const porItem = new Map(
          origen.map((o) => [o.itemCode.trim().toLowerCase(), o]),
        );

        const filas: TransferRow[] = traspaso.detalles.map((d) => {
          const origenItem = porItem.get(
            (d.itemCode || "").trim().toLowerCase(),
          );
          return {
            sociedad: origenItem?.sociedad || "",
            cliente: origenItem?.cliente || "",
            almacen: d.almacen || origenItem?.almacen || "",
            folio: docNum || String(traspaso.docNum ?? ""),
            fecha: traspaso.docDate || origenItem?.fecha || "",
            codigoProveedor: origenItem?.codigoProveedor || "",
            itemCode: d.itemCode || "",
            codigoBarra: origenItem?.codigoBarra || [],
            descripcion: d.dscription || origenItem?.descripcion || "",
            solicitado: d.solicitado || 0,
            enviado: d.surtido || 0,
          };
        });

        setFolio(docNum);
        setClienteConsulta(origen[0]?.cliente || "");
        setResultados(filas);
        setBusquedaRealizada(true);
        setProcesoTerminado(true);
        setTraspasoGuardado({
          idInventario: traspaso.idInventario,
          docNum: traspaso.docNum,
          cardName: traspaso.cardName || "",
          docDate: traspaso.docDate || new Date().toISOString(),
          estatus: traspaso.estatus,
        });
        setSuccessMessage(
          `Consulta del traspaso #${traspaso.idInventario} (solo lectura).`,
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el traspaso para consulta.",
          );
          setResultados([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void cargarConsulta();
    return () => {
      cancelled = true;
    };
  }, [modoConsulta, idTraspasoParam]);

  const resetProceso = () => {
    if (modoConsulta) {
      navigate("/operaciones/ListaEntregasMercancia");
      return;
    }
    setFolio("");
    setResultados([]);
    setBusquedaRealizada(false);
    setError(null);
    setCodigoBarras("");
    setScanError(null);
    setScanOk(null);
    setConfirmEdit(null);
    setMotivo("");
    setMotivoError(null);
    setGuardandoHistorial(false);
    setConfirmTerminar(false);
    setConfirmParcial(false);
    setItemsParciales([]);
    setProcesoTerminado(false);
    setSuccessMessage(null);
    setTraspasoGuardado(null);
    setModalOperador(false);
    setNombreOperador("");
    setOperadorError(null);
    setGenerandoPdf(false);
    setClienteConsulta("");
    editDraftRef.current = {};
    editOriginalRef.current = {};
  };
  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folio.trim()) return;

    setLoading(true);
    setError(null);
    setScanError(null);
    setScanOk(null);
    setBusquedaRealizada(true);

    try {
      const data = await inventarioCedisService.getByFolioRetail(folio.trim());
      setResultados(data.map((item) => ({ ...item, enviado: 0 })));
    } catch {
      setError("Error al buscar la transferencia CEDIS");
      setResultados([]);
    } finally {
      setLoading(false);
    }
  };

  const indexParaEscanear = (codigo: string) => {
    const indices = resultados
      .map((row, i) => (coincideCodigo(row, codigo) ? i : -1))
      .filter((i) => i >= 0);

    if (indices.length === 0) return -1;

    const pendiente = indices.find(
      (i) => resultados[i].enviado < resultados[i].solicitado,
    );
    return pendiente ?? indices[indices.length - 1];
  };

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    const codigo = codigoBarras.trim();
    if (!codigo || !procesando) return;

    setScanError(null);
    setScanOk(null);

    const index = indexParaEscanear(codigo);

    if (index === -1) {
      setScanError(
        `El artículo escaneado (${codigo}) no se encuentra dentro del traspaso.`,
      );
      setCodigoBarras("");
      scannerRef.current?.focus();
      return;
    }

    const item = resultados[index];
    const cantidad = cantidadPorCodigoEscaneado(item, codigo);
    const enviadoNuevo = item.enviado + cantidad;

    setResultados((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, enviado: row.enviado + cantidad } : row,
      ),
    );

    setScanOk(
      `${item.itemCode} — renglón ${index + 1} (+${cantidad} → ${enviadoNuevo} de ${item.solicitado})`,
    );
    setCodigoBarras("");
    scannerRef.current?.focus();
  };

  const handleEnviadoFocus = (index: number, enviado: number) => {
    editOriginalRef.current[index] = enviado;
    editDraftRef.current[index] = String(enviado);
  };

  const handleEnviadoChange = (index: number, value: string) => {
    if (value !== "" && !/^\d+$/.test(value)) return;
    editDraftRef.current[index] = value;

    setResultados((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, enviado: value === "" ? 0 : Number(value) }
          : row,
      ),
    );
  };

  const handleEnviadoBlur = (index: number) => {
    const original = editOriginalRef.current[index];
    const draft = editDraftRef.current[index];
    if (original === undefined || draft === undefined) return;

    const nuevo = draft === "" ? 0 : Number(draft);
    if (Number.isNaN(nuevo)) {
      setResultados((prev) =>
        prev.map((row, i) =>
          i === index ? { ...row, enviado: original } : row,
        ),
      );
      return;
    }

    if (nuevo !== original) {
      const row = resultados[index];
      // Revert visually until confirmed
      setResultados((prev) =>
        prev.map((r, i) => (i === index ? { ...r, enviado: original } : r)),
      );
      setMotivo("");
      setMotivoError(null);
      setConfirmEdit({
        index,
        itemCode: row.itemCode,
        folio: row.folio || folio.trim(),
        solicitado: row.solicitado,
        valorAnterior: original,
        valorNuevo: nuevo,
      });
    }
  };

  const confirmarEdicion = async () => {
    if (!confirmEdit || !user) return;
    if (!motivo.trim()) {
      setMotivoError("Debes indicar el motivo de la modificación");
      return;
    }

    setGuardandoHistorial(true);
    setMotivoError(null);

    try {
      await inventarioCedisService.guardarHistorialLote([
        {
          docNum: confirmEdit.folio,
          itemCode: confirmEdit.itemCode,
          motivo: motivo.trim(),
          idUsuario: Number(user.idUsuario || user.idPersona),
          solicitado: confirmEdit.solicitado,
          escaneado: confirmEdit.valorAnterior,
        },
      ]);

      const { index, valorNuevo } = confirmEdit;
      setResultados((prev) =>
        prev.map((row, i) =>
          i === index ? { ...row, enviado: valorNuevo } : row,
        ),
      );
      setConfirmEdit(null);
      setMotivo("");
      setMotivoError(null);
      scannerRef.current?.focus();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al guardar el historial de modificación";
      setMotivoError(message);
    } finally {
      setGuardandoHistorial(false);
    }
  };

  const cancelarEdicion = () => {
    setConfirmEdit(null);
    setMotivo("");
    setMotivoError(null);
    scannerRef.current?.focus();
  };

  const buildPayload = (): InventarioCedisPayload | null => {
    if (!resultados.length || !user) return null;

    const first = resultados[0];
    const idUsuarioCreacion = Number(user.idUsuario || user.idPersona);
    const folioRetail = first.folio || folio.trim();
    const docNumParsed = Number(folioRetail);
    const docNum =
      Number.isFinite(docNumParsed) && docNumParsed > 0 ? docNumParsed : null;

    return {
      docNum,
      cardName: first.cliente || "",
      docDate: first.fecha,
      estatus: "P",
      idEmpresa: Number(user.idEmpresa),
      idSucursal: Number(user.idSucursal),
      idUsuarioCreacion,
      detalles: resultados.map((row) => ({
        itemCode: row.itemCode,
        dscription: row.descripcion,
        almacen: row.almacen,
        solicitado: row.solicitado,
        surtido: row.enviado,
        diferencia: row.solicitado - row.enviado,
        estatus: getDetalleEstatus(row.solicitado, row.enviado),
      })),
    };
  };

  const handleCancelar = () => {
    if (
      window.confirm(
        "¿Cancelar el procesamiento? Se perderán las cantidades escaneadas.",
      )
    ) {
      resetProceso();
    }
  };

  const handleTerminarClick = () => {
    const parciales = resultados.filter((row) => row.enviado < row.solicitado);
    if (parciales.length > 0) {
      setItemsParciales(parciales);
      setConfirmParcial(true);
      return;
    }
    setConfirmTerminar(true);
  };

  const finalizarTraspaso = async () => {
    const payload = buildPayload();
    if (!payload) {
      setError("No se pudo obtener el usuario o los datos del traspaso");
      setConfirmTerminar(false);
      setConfirmParcial(false);
      return;
    }

    setGuardando(true);
    setError(null);

    try {
      const saved = await inventarioCedisService.guardarInventario(payload);
      setTraspasoGuardado({
        ...saved,
        cardName: saved.cardName || payload.cardName,
        docNum: saved.docNum ?? payload.docNum ?? null,
        // Fecha del PDF = día de creación del traspaso en CRM
        docDate: new Date().toISOString(),
      });
      setConfirmTerminar(false);
      setConfirmParcial(false);
      setItemsParciales([]);
      setProcesoTerminado(true);
      setSuccessMessage(
        `Traspaso ${saved.docNum || payload.docNum} guardado correctamente${
          saved.idInventario ? ` (Folio ${saved.idInventario})` : ""
        }.`,
      );
      setScanError(null);
      setScanOk(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al guardar el traspaso procesado";
      setError(message);
      setConfirmTerminar(false);
      setConfirmParcial(false);
    } finally {
      setGuardando(false);
    }
  };

  const handleTerminarConfirm = async () => {
    await finalizarTraspaso();
  };

  const handleParcialConfirm = async () => {
    if (!user || itemsParciales.length === 0) return;

    setGuardando(true);
    setError(null);

    try {
      const idUsuario = Number(user.idUsuario || user.idPersona);
      await inventarioCedisService.guardarHistorialLote(
        itemsParciales.map((item) => ({
          docNum: item.folio || folio.trim(),
          itemCode: item.itemCode,
          motivo: `Procesado con cantidad menor a la solicitada (${item.enviado} de ${item.solicitado})`,
          idUsuario,
          solicitado: item.solicitado,
          escaneado: item.enviado,
        })),
      );
      await finalizarTraspaso();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Error al registrar el historial de cantidades parciales";
      setError(message);
      setConfirmParcial(false);
      setGuardando(false);
    }
  };

  const handleImprimir = () => {
    setOperadorError(null);
    setNombreOperador("");
    setModalOperador(true);
  };

  const confirmarPdfOperador = async () => {
    const operador = nombreOperador.trim();
    if (!operador) {
      setOperadorError("Indique el nombre del operador.");
      return;
    }
    if (!resultados.length) {
      setOperadorError("No hay renglones para imprimir.");
      return;
    }

    setGenerandoPdf(true);
    try {
      const first = resultados[0];
      const folioPdf =
        traspasoGuardado?.idInventario && traspasoGuardado.idInventario > 0
          ? traspasoGuardado.idInventario
          : "—";
      const documento =
        traspasoGuardado?.docNum ||
        first.folio ||
        folio.trim() ||
        (traspasoGuardado?.docNum != null
          ? String(traspasoGuardado.docNum)
          : "—");
      const fechaPdf = traspasoGuardado?.docDate || new Date().toISOString();

      await generarPdfEntregaMercancia({
        folio: folioPdf,
        docNum: documento,
        fecha: fechaPdf,
        cliente: first.cliente || clienteConsulta || "",
        operador,
        lineas: resultados.map((row) => ({
          itemCode: row.itemCode,
          codigoProveedor: row.codigoProveedor,
          descripcion: row.descripcion,
          almacen: row.almacen,
          cantidad: row.solicitado,
          enviada: row.enviado,
        })),
      });
      setModalOperador(false);
      setNombreOperador("");
      setOperadorError(null);
    } catch (err) {
      setOperadorError(
        err instanceof Error
          ? err.message
          : "No se pudo generar el PDF de entrega.",
      );
    } finally {
      setGenerandoPdf(false);
    }
  };

  const handleNuevo = () => {
    resetProceso();
  };

  return (
    <div className="p-6 print:p-0">
      <PageMeta
        title={modoConsulta ? "Consulta Entrega CEDIS" : "Control CEDIS"}
        description="Procesar transferencias CEDIS por Folio de Documento"
      />
      <div className="mb-6 print:hidden">
        {modoConsulta ? (
          <button
            type="button"
            onClick={() => navigate("/operaciones/ListaEntregasMercancia")}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </button>
        ) : null}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {modoConsulta ? "Consulta Entrega CEDIS" : "Control CEDIS"}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {modoConsulta
            ? "Visualización de lo escaneado en el traspaso seleccionado (solo lectura)."
            : "Procesar transferencias CEDIS por Folio de Documento e ir escaneando artículos para contabilizar lo enviado."}
        </p>
        {modoConsulta && (clienteConsulta || folio) ? (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            {folio ? (
              <>
                Documento: <strong>{folio}</strong>
              </>
            ) : null}
            {clienteConsulta ? (
              <>
                {folio ? " · " : null}
                Cliente: <strong>{clienteConsulta}</strong>
              </>
            ) : null}
          </p>
        ) : null}
      </div>
      {!modoConsulta ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 print:hidden">
          <form onSubmit={handleBuscar} className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder="Ingrese Folio Retail"
                disabled={procesando}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-60"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !folio.trim() || procesando}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Buscando..." : "Procesar"}
            </button>
          </form>
        </div>
      ) : null}
      {procesoTerminado && successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 print:hidden">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-green-700 dark:text-green-400 font-medium">
              {successMessage}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleImprimir}
                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Printer className="w-4 h-4" />
                Imprimir
              </button>
              <button
                type="button"
                onClick={handleNuevo}
                className="inline-flex items-center gap-2 px-5 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
              >
                {modoConsulta ? (
                  <>
                    <ArrowLeft className="w-4 h-4" />
                    Volver
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    Nuevo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {procesandoActivo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6 print:hidden">
          {" "}
          <form
            onSubmit={handleScan}
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Escáner de código de barras
              </label>
              <div className="relative">
                <ScanBarcode className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  ref={scannerRef}
                  type="text"
                  value={codigoBarras}
                  onChange={(e) => setCodigoBarras(e.target.value)}
                  placeholder="Escanee el artículo..."
                  autoComplete="off"
                  disabled={guardando}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-60"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleTerminarClick}
                disabled={guardando}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Terminar"}
              </button>
              <button
                type="button"
                onClick={handleCancelar}
                disabled={guardando}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </form>
          {scanError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {scanError}
            </p>
          )}
          {scanOk && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400">
              {scanOk}
            </p>
          )}
        </div>
      )}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3 print:hidden">
          {" "}
          <AlertCircle className="text-red-500 w-5 h-5" />
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}
      {busquedaRealizada && !loading && (
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden print:shadow-none print:overflow-visible ${
            procesoTerminado ? "print:hidden" : ""
          }`}
        >
          {" "}
          {resultados.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron transferencias</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Folio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      CodigoProveedor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Artículo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Descripción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Almacén
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Enviado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Diferencia
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {resultados.map((item, index) => {
                    const diferencia = item.solicitado - item.enviado;
                    const status = getRowStatus(item.solicitado, item.enviado);

                    return (
                      <tr
                        key={`${item.folio}-${item.itemCode}-${index}`}
                        className={rowStatusClass[status]}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.folio}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                          {formatDate(item.fecha)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.codigoProveedor}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.itemCode}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 min-w-[220px]">
                          {item.descripcion}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {item.almacen}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {item.solicitado}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.enviado}
                            onFocus={() =>
                              handleEnviadoFocus(index, item.enviado)
                            }
                            onChange={(e) =>
                              handleEnviadoChange(index, e.target.value)
                            }
                            onBlur={() => handleEnviadoBlur(index)}
                            disabled={guardando || procesoTerminado}
                            className="w-24 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white disabled:opacity-60 print:hidden"
                          />
                          <span className="hidden print:inline font-semibold">
                            {item.enviado}
                          </span>{" "}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.enviado === 0 &&
                          diferencia === item.solicitado ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <span
                              className={`font-medium ${
                                diferencia === 0
                                  ? "text-green-700 dark:text-green-400"
                                  : diferencia > 0
                                    ? "text-amber-700 dark:text-amber-400"
                                    : "text-red-700 dark:text-red-400"
                              }`}
                            >
                              {diferencia}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {modalOperador && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-[90%] max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Nombre del operador
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Indique el nombre del operador que aparecerá en el PDF de Entrega
              Mercancía.
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Operador *
              </label>
              <input
                type="text"
                value={nombreOperador}
                onChange={(e) => {
                  setNombreOperador(e.target.value);
                  if (operadorError) setOperadorError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    confirmarPdfOperador();
                  }
                }}
                autoFocus
                placeholder="Nombre completo del operador"
                disabled={generandoPdf}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-60"
              />
              {operadorError ? (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {operadorError}
                </p>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!generandoPdf) {
                    setModalOperador(false);
                    setNombreOperador("");
                    setOperadorError(null);
                  }
                }}
                disabled={generandoPdf}
                className="rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300 disabled:opacity-50 dark:bg-gray-700 dark:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarPdfOperador}
                disabled={generandoPdf || !nombreOperador.trim()}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {generandoPdf ? "Generando…" : "Generar PDF"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm print:hidden">
          {" "}
          <div className="w-[90%] max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Modificar cantidad
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              ¿Estás seguro de modificar la cantidad enviada de{" "}
              <strong>{confirmEdit.valorAnterior}</strong> a{" "}
              <strong>{confirmEdit.valorNuevo}</strong> en el artículo{" "}
              <strong>{confirmEdit.itemCode}</strong>?
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Motivo
              </label>
              <textarea
                value={motivo}
                onChange={(e) => {
                  setMotivo(e.target.value);
                  if (motivoError) setMotivoError(null);
                }}
                rows={3}
                placeholder="Indique el motivo de la modificación"
                disabled={guardandoHistorial}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white disabled:opacity-60"
              />
              {motivoError && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  {motivoError}
                </p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={cancelarEdicion}
                disabled={guardandoHistorial}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                No
              </button>
              <button
                type="button"
                onClick={confirmarEdicion}
                disabled={guardandoHistorial || !motivo.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {guardandoHistorial ? "Guardando..." : "Sí, modificar"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmTerminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm print:hidden">
          <div className="w-[90%] max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Terminar traspaso
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Se guardará el traspaso procesado. Una vez guardado, no se podrán
              realizar más modificaciones. ¿Deseas continuar?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmTerminar(false)}
                disabled={guardando}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleTerminarConfirm}
                disabled={guardando}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmParcial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm print:hidden">
          <div className="w-[90%] max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              Cantidad menor a la solicitada
            </h2>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              Se procesará una cantidad menor a la solicitada en los siguientes
              artículos. Si aceptas, se registrará en el historial y luego se
              guardará el traspaso.
            </p>
            <ul className="mt-4 max-h-56 overflow-y-auto space-y-2">
              {itemsParciales.map((item, index) => (
                <li
                  key={`${item.itemCode}-${index}`}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-800 dark:bg-amber-900/30"
                >
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {item.itemCode}
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    {item.descripcion}
                  </p>
                  <p className="mt-1 text-amber-800 dark:text-amber-300">
                    Solicitado: <strong>{item.solicitado}</strong> — Escaneado:{" "}
                    <strong>{item.enviado}</strong>
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmParcial(false);
                  setItemsParciales([]);
                }}
                disabled={guardando}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleParcialConfirm}
                disabled={guardando}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {guardando ? "Guardando..." : "Aceptar y terminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ControlCedis;
