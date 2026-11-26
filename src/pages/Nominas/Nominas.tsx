/* NOMCONEXIA-UNIFY */
import { useEffect, useState, useRef } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import {
  nominaService,
  NominaCabecero,
  NominaDetalle,
  NominaFilters,
  PeriodoNomina,
  toDetalleCreate,
} from "../../services/nominaService";
import { Link } from "react-router";
import { empresaService, Empresa } from "../../services/empresaService";
import { empleadoService, Empleado } from "../../services/empleadoService";
import { satCatalogoService, CatalogoSatItem } from "../../services/nominaSatCatalogoService";
import { incidenciaService, Incidencia } from "../../services/nominaIncidenciaService";
import NominaEmpleadoGrid from "../../components/nomina/NominaEmpleadoGrid";
import PrenominaRecibo from "../../components/nomina/PrenominaRecibo";
import DispersionNominaModal from "../../components/nomina/DispersionNominaModal";
import {
  PlusIcon,
  PencilIcon,
  TrashBinIcon,
  FileIcon,
  CheckLineIcon,
  EyeIcon,
  ListIcon,
} from "../../icons";

function isNominaAbierta(estatus?: string | null) {
  const e = (estatus || "").trim().toUpperCase();
  return e === "PENDIENTE" || e === "CAPTURADA" || e === "CALCULADA";
}

function esTipoNomina(tipo: string | null | undefined, ...claves: string[]) {
  const t = (tipo || "").toUpperCase();
  return claves.some((c) => t.includes(c));
}

export default function Nominas() {
  const [nominas, setNominas] = useState<NominaCabecero[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [, setEmpleados] = useState<Empleado[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoNomina[]>([]);
  const [satTipoNomina, setSatTipoNomina] = useState<CatalogoSatItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetalles, setLoadingDetalles] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerNominaOpen, setIsVerNominaOpen] = useState(false);
  const [editingNomina, setEditingNomina] = useState<NominaCabecero | null>(null);
  const [selectedNomina, setSelectedNomina] = useState<NominaCabecero | null>(null);
  const [detalles, setDetalles] = useState<NominaDetalle[]>([]);
  const [savedDetalles, setSavedDetalles] = useState<NominaDetalle[]>([]);
  const [savingRowId, setSavingRowId] = useState<number | null>(null);
  const [pendingSave, setPendingSave] = useState<NominaDetalle | "all" | null>(null);
  const [prenominaDetalle, setPrenominaDetalle] = useState<NominaDetalle | null>(null);
  const [prenominaEmpleado, setPrenominaEmpleado] = useState<Empleado | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [calculando, setCalculando] = useState(false);
  const [timbrando, setTimbrando] = useState(false);
  const [savingDetalles, setSavingDetalles] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [incidenciasPeriodo, setIncidenciasPeriodo] = useState<Incidencia[]>([]);
  const [isDispersionOpen, setIsDispersionOpen] = useState(false);
  const [descargandoPoliza, setDescargandoPoliza] = useState(false);

  const [filtroEmpresa, setFiltroEmpresa] = useState<number | "">("");
  const [filtroEstatus, setFiltroEstatus] = useState<string>("");

  const [formData, setFormData] = useState<any>({
    idEmpresa: 0,
    idPeriodo: 0,
    numeroNomina: "",
    tipoNomina: "QUINCENAL",
    claveTipoNomina: "O",
    fechaNomina: new Date().toISOString().split("T")[0],
    fechaPago: "",
    fechaInicio: "",
    fechaFin: "",
    observaciones: "",
    montoPtu: 0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadNominas();
  }, [filtroEmpresa, filtroEstatus]);

  useEffect(() => {
    if (filtroEmpresa) {
      loadEmpleadosPorEmpresa(Number(filtroEmpresa));
      loadPeriodosPorEmpresa(Number(filtroEmpresa));
    } else {
      setEmpleados([]);
      setPeriodos([]);
    }
  }, [filtroEmpresa]);

  const loadInitialData = async () => {
    try {
      const [empresasData, tiposNomina] = await Promise.all([
        empresaService.getEmpresas(),
        satCatalogoService.getTipoNomina(),
      ]);
      setEmpresas(empresasData);
      setSatTipoNomina(tiposNomina);
    } catch (error) {
      console.error("Error loading initial data:", error);
      setEmpresas([]);
    }
  };

  const loadEmpleadosPorEmpresa = async (idEmpresa: number) => {
    try {
      const data = await empleadoService.getEmpleados(idEmpresa);
      setEmpleados(data);
    } catch (error) {
      console.error("Error loading empleados:", error);
    }
  };

  const loadPeriodosPorEmpresa = async (idEmpresa: number) => {
    try {
      const data = await nominaService.getPeriodos(idEmpresa);
      setPeriodos(data);
    } catch (error) {
      console.error("Error loading periodos:", error);
    }
  };

  const loadNominas = async () => {
    setLoading(true);
    try {
      const filters: NominaFilters = {};
      if (filtroEmpresa) filters.idEmpresa = Number(filtroEmpresa);
      if (filtroEstatus) filters.estatus = filtroEstatus;

      const data = await nominaService.getNominas(filters);
      setNominas(data);
    } catch (error) {
      console.error("Error loading nominas:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadDetallesNomina = async (idNomina: number) => {
    setLoadingDetalles(true);
    try {
      const data = await nominaService.getDetalles(idNomina);
      setDetalles(data);
      setSavedDetalles(data);
    } catch (error) {
      console.error("Error loading detalles:", error);
    } finally {
      setLoadingDetalles(false);
    }
  };

  const loadIncidenciasPeriodo = async (nomina: NominaCabecero) => {
    try {
      const data = await incidenciaService.getIncidencias({
        idEmpresa: nomina.idEmpresa,
        estatus: "APLICADO",
        fechaInicio: nomina.fechaInicio.split("T")[0],
        fechaFin: nomina.fechaFin.split("T")[0],
      });
      setIncidenciasPeriodo(data);
    } catch (error) {
      console.error("Error loading incidencias del período:", error);
      setIncidenciasPeriodo([]);
    }
  };

  const openModal = (nomina?: NominaCabecero) => {
    if (nomina) {
      setEditingNomina(nomina);
      setFormData({
        idEmpresa: nomina.idEmpresa,
        idPeriodo: nomina.idPeriodo,
        numeroNomina: nomina.numeroNomina,
        tipoNomina: nomina.tipoNomina,
        claveTipoNomina: nomina.claveTipoNomina || "O",
        fechaNomina: nomina.fechaNomina.split("T")[0],
        fechaPago: nomina.fechaPago.split("T")[0],
        fechaInicio: nomina.fechaInicio.split("T")[0],
        fechaFin: nomina.fechaFin.split("T")[0],
        observaciones: nomina.observaciones || "",
        montoPtu: nomina.montoPtu || 0,
      });
      loadPeriodosPorEmpresa(nomina.idEmpresa);
    } else {
      setEditingNomina(null);
      setFormData({
        idEmpresa: filtroEmpresa ? Number(filtroEmpresa) : (empresas[0]?.idEmpresa || 0),
        idPeriodo: 0,
        numeroNomina: "",
        tipoNomina: "QUINCENAL",
        claveTipoNomina: "O",
        fechaNomina: new Date().toISOString().split("T")[0],
        fechaPago: "",
        fechaInicio: "",
        fechaFin: "",
        observaciones: "",
        montoPtu: 0,
      });
      if (filtroEmpresa) {
        loadPeriodosPorEmpresa(Number(filtroEmpresa));
      }
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingNomina(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.idEmpresa) newErrors.idEmpresa = "La empresa es requerida";
    if (!formData.idPeriodo) newErrors.idPeriodo = "El periodo es requerido";
    if (!formData.numeroNomina.trim()) newErrors.numeroNomina = "El número de nómina es requerido";
    if (!formData.fechaPago) newErrors.fechaPago = "La fecha de pago es requerida";
    if (!formData.fechaInicio) newErrors.fechaInicio = "La fecha de inicio es requerida";
    if (!formData.fechaFin) newErrors.fechaFin = "La fecha de fin es requerida";
    if (esTipoNomina(formData.tipoNomina, "PTU") && !(Number(formData.montoPtu) > 0)) {
      newErrors.montoPtu = "Captura el monto de PTU a repartir";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const data = {
        idEmpresa: formData.idEmpresa,
        idPeriodo: formData.idPeriodo || 0,
        numeroNomina: formData.numeroNomina,
        tipoNomina: formData.tipoNomina,
        claveTipoNomina: formData.claveTipoNomina || "O",
        fechaNomina: formData.fechaNomina,
        fechaPago: formData.fechaPago,
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        observaciones: formData.observaciones,
        montoPtu: formData.montoPtu || 0,
      };

      if (editingNomina) {
        await nominaService.updateNomina(editingNomina.idNomina, data);
        await loadNominas();
        closeModal();
      } else {
        const created = await nominaService.createNomina(data);
        await loadNominas();
        closeModal();
        await handleVerNomina(created);
      }
    } catch (error) {
      console.error("Error saving:", error);
      setErrors({ submit: "Error al guardar la nómina" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (nomina: NominaCabecero) => {
    if (!confirm(`¿Eliminar la nómina "${nomina.numeroNomina}"?`)) return;

    try {
      await nominaService.deleteNomina(nomina.idNomina);
      await loadNominas();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleCalcular = async (nomina: NominaCabecero) => {
    if (
      !confirm(
        `¿Recalcular ISR e IMSS de "${nomina.numeroNomina}" con los renglones actuales?\nNo se borrarán sueldo, vacaciones ni descuentos capturados.`
      )
    )
      return;
    setCalculando(true);
    setActionMessage(null);
    try {
      if (selectedNomina?.idNomina === nomina.idNomina && detalles.length > 0) {
        await nominaService.updateDetalles(nomina.idNomina, detalles);
      }
      const result = await nominaService.calcularNomina(nomina.idNomina);
      setActionMessage(
        `Nómina calculada: ${result.totalEmpleados} empleados, neto ${formatCurrency(result.totalNeto)}`
      );
      await loadNominas();
      if (selectedNomina?.idNomina === nomina.idNomina) {
        setSelectedNomina(result);
        await loadDetallesNomina(nomina.idNomina);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al calcular";
      setActionMessage(msg);
      alert(msg);
    } finally {
      setCalculando(false);
    }
  };

  const handleTimbrar = async (nomina: NominaCabecero) => {
    if (!confirm(`¿Timbrar nómina "${nomina.numeroNomina}" con Facturapi (modo prueba)?`)) return;
    setTimbrando(true);
    setActionMessage(null);
    try {
      const result = await nominaService.timbrarNomina(nomina.idNomina);
      const fails = result.resultados.filter((r) => !r.exito).slice(0, 3);
      const failMsg = fails.map((f) => `${f.empleadoNombre || f.idEmpleado}: ${f.error}`).join("\n");
      setActionMessage(
        `Timbrado: ${result.exitosos} ok, ${result.fallidos} fallidos` +
          (failMsg ? `\n${failMsg}` : "")
      );
      alert(
        `Timbrado finalizado.\nÉxitos: ${result.exitosos}\nFallidos: ${result.fallidos}` +
          (failMsg ? `\n\n${failMsg}` : "")
      );
      await loadNominas();
      if (selectedNomina?.idNomina === nomina.idNomina) {
        const refreshed = await nominaService.getNomina(nomina.idNomina);
        setSelectedNomina(refreshed);
        await loadDetallesNomina(nomina.idNomina);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al timbrar";
      setActionMessage(msg);
      alert(msg);
    } finally {
      setTimbrando(false);
    }
  };

  const handleSeedDemo = async () => {
    try {
      const { satCatalogoService } = await import("../../services/nominaSatCatalogoService");
      const result = await satCatalogoService.seedDemo();
      alert(
        `Seed listo.\nEmpresa ${result.idEmpresa}\nNómina ${result.idNomina}\nEmpleados: ${result.empleadosActivos}`
      );
      await loadInitialData();
      await loadNominas();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al ejecutar seed");
    }
  };

  const handleEstatusChange = async (nomina: NominaCabecero, newEstatus: string) => {
    const labels: Record<string, string> = {
      CERRADA: "cerrar la nómina (ya no se podrán editar renglones; se habilita el timbrado)",
      PENDIENTE: "reabrir la nómina para editar renglones",
    };
    const aviso = labels[newEstatus] || `cambiar el estatus a "${newEstatus}"`;
    if (!confirm(`¿Confirmas ${aviso}?`)) return;

    try {
      await nominaService.cambiarEstatus(nomina.idNomina, newEstatus);
      await loadNominas();
      if (selectedNomina?.idNomina === nomina.idNomina) {
        const refreshed = await nominaService.getNomina(nomina.idNomina);
        setSelectedNomina(refreshed);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al cambiar estatus";
      setActionMessage(msg);
      alert(msg);
    }
  };

  const handlePolizaSap = async () => {
    if (!selectedNomina) return;
    setDescargandoPoliza(true);
    try {
      await nominaService.descargarPolizaSap(selectedNomina.idNomina);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "No se pudo generar la póliza SAP";
      setActionMessage(msg);
      alert(msg);
    } finally {
      setDescargandoPoliza(false);
    }
  };

  const handleCerrarNomina = async (nomina: NominaCabecero) => {
    if (selectedNomina?.idNomina === nomina.idNomina && detalles.length > 0 && isNominaAbierta(nomina.estatus)) {
      try {
        await nominaService.updateDetalles(nomina.idNomina, detalles);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Error al guardar renglones";
        alert(msg);
        return;
      }
    }
    await handleEstatusChange(nomina, "CERRADA");
  };

  const handleVerNomina = async (nomina: NominaCabecero) => {
    setSelectedNomina(nomina);
    await Promise.all([
      loadDetallesNomina(nomina.idNomina),
      loadIncidenciasPeriodo(nomina),
    ]);
    setIsVerNominaOpen(true);
  };

  const canEditDetalles = isNominaAbierta(selectedNomina?.estatus);

  const applySavedRow = (saved: NominaDetalle) => {
    setDetalles((prev) => prev.map((r) => (r.idNominaDetalle === saved.idNominaDetalle ? saved : r)));
    setSavedDetalles((prev) => prev.map((r) => (r.idNominaDetalle === saved.idNominaDetalle ? saved : r)));
  };

  const confirmarActualizarRenglon = async () => {
    if (!selectedNomina || !pendingSave || pendingSave === "all") return;
    const row = pendingSave;
    setPendingSave(null);
    setSavingRowId(row.idNominaDetalle);
    setActionMessage(null);
    try {
      await nominaService.updateDetalle(row.idNominaDetalle, toDetalleCreate(row));
      try {
        const saved = await nominaService.getDetalle(row.idNominaDetalle);
        applySavedRow({ ...row, ...saved });
      } catch {
        applySavedRow(row);
      }
      const refreshed = await nominaService.getNomina(selectedNomina.idNomina);
      setSelectedNomina(refreshed);
      await loadNominas();
      setActionMessage(`Renglón actualizado: ${row.empleadoNombre || "empleado"}.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al actualizar el renglón";
      setActionMessage(msg);
      alert(msg);
    } finally {
      setSavingRowId(null);
    }
  };

  const handleGuardarDetalles = async () => {
    if (!selectedNomina) return;
    setPendingSave(null);
    setSavingDetalles(true);
    setActionMessage(null);
    try {
      await nominaService.updateDetalles(selectedNomina.idNomina, detalles);
      const refreshed = await nominaService.getNomina(selectedNomina.idNomina);
      setSelectedNomina(refreshed);
      await loadDetallesNomina(selectedNomina.idNomina);
      await loadNominas();
      setActionMessage("Todos los renglones se actualizaron.");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al guardar renglones";
      setActionMessage(msg);
      alert(msg);
    } finally {
      setSavingDetalles(false);
    }
  };

  const handlePrenomina = async (row: NominaDetalle) => {
    setPrenominaDetalle(row);
    setPrenominaEmpleado(null);
    try {
      const emp = await empleadoService.getEmpleado(row.idEmpleado);
      setPrenominaEmpleado(emp);
    } catch {
      setPrenominaEmpleado(null);
    }
  };

  const handleGenerarRenglones = async () => {
    if (!selectedNomina) return;
    setSavingDetalles(true);
    setActionMessage(null);
    try {
      const result = await nominaService.generarRenglones(selectedNomina.idNomina);
      setSelectedNomina(result);
      await loadDetallesNomina(selectedNomina.idNomina);
      await loadNominas();
      setActionMessage(`Renglones cargados: ${result.totalEmpleados} empleados desde el catálogo.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Error al generar renglones";
      setActionMessage(msg);
      alert(msg);
    } finally {
      setSavingDetalles(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      alert("Por favor selecciona un archivo Excel (.xlsx o .xls)");
      return;
    }

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);
      
      // Por ahora mostramos mensaje - la lógica de parseo de Excel se haría con xlsx library
      alert("Funcionalidad de importación de Excel en desarrollo. Por ahora puedes capturar manualmente.");
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Error al procesar el archivo Excel");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const getEstatusBadge = (estatus: string) => {
    const styles: Record<string, string> = {
      PENDIENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      CAPTURADA: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      CALCULADA: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      CERRADA: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      TIMBRADA: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
      APLICADA: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
      PAGADA: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      CANCELADA: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return styles[estatus] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-MX");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Nómina
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Gestión de nóminas quincenales. En PENDIENTE, doble clic en el registro para editar renglones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleSeedDemo}>
            Cargar demo (5 emp.)
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <FileIcon className="w-5 h-5 mr-2" />
            {uploading ? "Importando..." : "Importar Excel"}
          </Button>
          <Button onClick={() => openModal()}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Nueva Nómina
          </Button>
        </div>
      </div>

      {actionMessage && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 whitespace-pre-line dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
          {actionMessage}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5 p-4">
        <div className="flex items-center gap-2 mb-4">
          <ListIcon className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            options={[
              { value: "", label: "Todas las empresas" },
              ...empresas.map((e) => ({ value: e.idEmpresa.toString(), label: e.nombre })),
            ]}
            placeholder="Empresa"
            onChange={(val) => setFiltroEmpresa(val ? parseInt(val) : "")}
            defaultValue={filtroEmpresa.toString()}
          />
          <Select
            options={[
              { value: "", label: "Todos los estatus" },
              { value: "PENDIENTE", label: "Pendiente" },
              { value: "CERRADA", label: "Cerrada" },
              { value: "TIMBRADA", label: "Timbrada" },
              { value: "CAPTURADA", label: "Capturada (legado)" },
              { value: "CALCULADA", label: "Calculada (legado)" },
              { value: "APLICADA", label: "Aplicada" },
            ]}
            placeholder="Estatus"
            onChange={(val) => setFiltroEstatus(val || "")}
            defaultValue={filtroEstatus}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Núm. Nómina</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Período</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Fecha Pago</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Empleados</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Total Percepciones</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Total Deducciones</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Total Neto</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Estatus</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {nominas.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      No hay nóminas registradas
                    </td>
                  </tr>
                ) : (
                  nominas.map((nomina) => (
                    <tr
                      key={nomina.idNomina}
                      onDoubleClick={() => handleVerNomina(nomina)}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer"
                      title={
                        isNominaAbierta(nomina.estatus)
                          ? "Doble clic para editar los renglones"
                          : "Doble clic para ver los detalles"
                      }
                    >
                      <td className="px-6 py-4 text-gray-800 dark:text-white font-medium">{nomina.numeroNomina}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{nomina.empresaNombre}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                        {formatDate(nomina.fechaInicio)} - {formatDate(nomina.fechaFin)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(nomina.fechaPago)}</td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-right">{nomina.totalEmpleados}</td>
                      <td className="px-6 py-4 text-green-600 dark:text-green-400 text-right">{formatCurrency(nomina.totalPercepciones)}</td>
                      <td className="px-6 py-4 text-red-600 dark:text-red-400 text-right">{formatCurrency(nomina.totalDeducciones)}</td>
                      <td className="px-6 py-4 text-blue-600 dark:text-blue-400 text-right font-semibold">{formatCurrency(nomina.totalNeto)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstatusBadge(nomina.estatus)}`}>
                          {nomina.estatus}
                        </span>
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1 flex-wrap">
                          {isNominaAbierta(nomina.estatus) && (
                            <button
                              onClick={() => handleCalcular(nomina)}
                              disabled={calculando}
                              className="px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg disabled:opacity-50"
                              title="Recalcular ISR e IMSS sin borrar renglones"
                            >
                              Calcular
                            </button>
                          )}
                          {isNominaAbierta(nomina.estatus) && (
                            <button
                              onClick={() => handleCerrarNomina(nomina)}
                              className="px-2 py-1 text-xs font-medium text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg"
                              title="Cerrar captura: bloquea renglones y habilita timbrado"
                            >
                              Cerrado
                            </button>
                          )}
                          {nomina.estatus === "CERRADA" && (
                            <button
                              onClick={() => handleTimbrar(nomina)}
                              disabled={timbrando}
                              className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg disabled:opacity-50"
                              title="Timbrar con Facturapi"
                            >
                              Timbrar
                            </button>
                          )}
                          {nomina.estatus === "CERRADA" && (
                            <button
                              onClick={() => handleEstatusChange(nomina, "PENDIENTE")}
                              className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-50 hover:bg-yellow-100 rounded-lg"
                              title="Reabrir para editar renglones"
                            >
                              Reabrir
                            </button>
                          )}
                          {nomina.estatus === "TIMBRADA" && (
                            <button
                              onClick={() => handleEstatusChange(nomina, "APLICADA")}
                              className="px-2 py-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg"
                              title="Marcar aplicada"
                            >
                              <CheckLineIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => handleVerNomina(nomina)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title={isNominaAbierta(nomina.estatus) ? "Editar renglones" : "Ver detalles"}
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          {isNominaAbierta(nomina.estatus) && (
                            <button
                              onClick={() => openModal(nomina)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(nomina)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <TrashBinIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create/Edit */}
      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-lg w-full p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          {editingNomina ? "Editar Nómina" : "Nueva Nómina"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Empresa *</Label>
            <Select
              options={empresas.map((e) => ({ value: e.idEmpresa.toString(), label: e.nombre }))}
              placeholder="Selecciona empresa"
              onChange={(val) => {
                setFormData({ ...formData, idEmpresa: parseInt(val), idPeriodo: 0 });
                loadPeriodosPorEmpresa(parseInt(val));
                loadEmpleadosPorEmpresa(parseInt(val));
              }}
              defaultValue={formData.idEmpresa?.toString() || ""}
            />
            {errors.idEmpresa && <p className="mt-1 text-sm text-red-500">{errors.idEmpresa}</p>}
          </div>

          <div>
            <Label>Periodo *</Label>
            <Select
              options={[
                { value: "0", label: periodos.length ? "Selecciona periodo" : "Sin periodos (elige empresa)" },
                ...periodos.map((p) => ({
                  value: p.idPeriodo.toString(),
                  label: `${p.anio}-${p.mes}/Q${p.quincena} (${p.fechaInicio?.toString().slice(0, 10)} - ${p.fechaFin?.toString().slice(0, 10)})`,
                })),
              ]}
              placeholder="Periodo"
              onChange={(val) => {
                const idPeriodo = parseInt(val) || 0;
                const periodo = periodos.find((p) => p.idPeriodo === idPeriodo);
                setFormData({
                  ...formData,
                  idPeriodo,
                  fechaInicio: periodo ? periodo.fechaInicio.toString().slice(0, 10) : formData.fechaInicio,
                  fechaFin: periodo ? periodo.fechaFin.toString().slice(0, 10) : formData.fechaFin,
                  fechaPago: periodo ? periodo.fechaPago.toString().slice(0, 10) : formData.fechaPago,
                });
              }}
              defaultValue={formData.idPeriodo?.toString() || "0"}
            />
            {errors.idPeriodo && <p className="mt-1 text-sm text-red-500">{errors.idPeriodo}</p>}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Número de Nómina *</Label>
              <Input
                value={formData.numeroNomina}
                onChange={(e) => setFormData({ ...formData, numeroNomina: e.target.value })}
                placeholder="Ej. 2024-01-1Q"
              />
              {errors.numeroNomina && <p className="mt-1 text-sm text-red-500">{errors.numeroNomina}</p>}
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                options={[
                  { value: "QUINCENAL", label: "Quincenal" },
                  { value: "SEMANAL", label: "Semanal" },
                  { value: "MENSUAL", label: "Mensual" },
                  { value: "AGUINALDO", label: "Aguinaldo (extraordinaria)" },
                  { value: "FINIQUITO", label: "Finiquito (renuncia / término)" },
                  { value: "LIQUIDACION", label: "Liquidación (despido)" },
                  { value: "PTU", label: "PTU / reparto de utilidades" },
                ]}
                onChange={(val) => {
                  const extra = esTipoNomina(val, "AGUINAL", "FINIQUIT", "LIQUIDAC", "PTU");
                  setFormData({
                    ...formData,
                    tipoNomina: val,
                    claveTipoNomina: extra ? "E" : formData.claveTipoNomina || "O",
                  });
                }}
                defaultValue={formData.tipoNomina}
              />
            </div>
            <div>
              <Label>Tipo SAT (timbrado)</Label>
              <Select
                options={(satTipoNomina.length
                  ? satTipoNomina
                  : [
                      { clave: "O", descripcion: "Nómina ordinaria" },
                      { clave: "E", descripcion: "Nómina extraordinaria" },
                    ]
                ).map((c) => ({ value: c.clave, label: `${c.clave} - ${c.descripcion}` }))}
                onChange={(val) => setFormData({ ...formData, claveTipoNomina: val })}
                defaultValue={formData.claveTipoNomina || "O"}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Fecha Nómina *</Label>
              <Input
                type="date"
                value={formData.fechaNomina}
                onChange={(e) => setFormData({ ...formData, fechaNomina: e.target.value })}
              />
            </div>
            <div>
              <Label>Fecha Inicio *</Label>
              <Input
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
              />
              {errors.fechaInicio && <p className="mt-1 text-sm text-red-500">{errors.fechaInicio}</p>}
            </div>
            <div>
              <Label>Fecha Fin *</Label>
              <Input
                type="date"
                value={formData.fechaFin}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
              />
              {errors.fechaFin && <p className="mt-1 text-sm text-red-500">{errors.fechaFin}</p>}
            </div>
          </div>

          <div>
            <Label>Fecha de Pago *</Label>
            <Input
              type="date"
              value={formData.fechaPago}
              onChange={(e) => setFormData({ ...formData, fechaPago: e.target.value })}
            />
            {errors.fechaPago && <p className="mt-1 text-sm text-red-500">{errors.fechaPago}</p>}
          </div>

          {esTipoNomina(formData.tipoNomina, "PTU") && (
            <div>
              <Label>Monto PTU a repartir *</Label>
              <Input
                type="number"
                value={formData.montoPtu?.toString() || "0"}
                onChange={(e) => setFormData({ ...formData, montoPtu: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
              {errors.montoPtu && <p className="mt-1 text-sm text-red-500">{errors.montoPtu}</p>}
              <p className="mt-1 text-xs text-gray-500">
                Fecha inicio/fin deben ser el ejercicio que se reparte (ene–dic), no el mes de pago. 50% igual entre
                quienes tienen 60 días o más; 50% proporcional al sueldo × días.
              </p>
            </div>
          )}

          <div>
            <Label>Observaciones</Label>
            <textarea
              value={formData.observaciones || ""}
              onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
              placeholder="Observaciones adicionales"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>

          {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingNomina ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Ver Detalles */}
      <Modal isOpen={isVerNominaOpen} onClose={() => setIsVerNominaOpen(false)} className="max-w-[98vw] w-full p-6">
        <div className="flex items-center justify-between mb-6 pr-12">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
            Detalle de Nómina: {selectedNomina?.numeroNomina}
          </h2>
          <div className="flex items-center gap-2">
            {selectedNomina && (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstatusBadge(selectedNomina.estatus)}`}>
                {selectedNomina.estatus}
              </span>
            )}
          </div>
        </div>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          En PENDIENTE puedes editar cada renglón en la tabla. Al pulsar Actualizar se pide confirmación. Prenómina muestra el pre-recibo del empleado.
        </p>

        {selectedNomina && (
          <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <p className="text-sm text-gray-500">Empresa</p>
              <p className="font-medium">{selectedNomina.empresaNombre}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Período</p>
              <p className="font-medium">{formatDate(selectedNomina.fechaInicio)} - {formatDate(selectedNomina.fechaFin)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fecha de Pago</p>
              <p className="font-medium">{formatDate(selectedNomina.fechaPago)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Empleados</p>
              <p className="font-medium">{selectedNomina.totalEmpleados}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 text-green-600">Total Percepciones</p>
              <p className="font-medium text-green-600">{formatCurrency(selectedNomina.totalPercepciones)}</p>
            </div>
            <div>
              <p className="text-sm text-red-600">Total Deducciones</p>
              <p className="font-medium text-red-600">{formatCurrency(selectedNomina.totalDeducciones)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Infonavit</p>
              <p className="font-medium">{formatCurrency(selectedNomina.totalInfonavit)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Fonacot</p>
              <p className="font-medium">{formatCurrency(selectedNomina.totalFonacot)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Total Neto</p>
              <p className="font-medium text-blue-600">{formatCurrency(selectedNomina.totalNeto)}</p>
            </div>
          </div>
        )}

        {(selectedNomina?.tipoNomina || "").toUpperCase().includes("AGUINAL") && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            Nómina de <strong>aguinaldo</strong>: 15 días LFT proporcionales al <strong>cierre del periodo (fecha fin)</strong>,
            exención 30 UMA al timbrar, ISR por art. 174. CFDI tipo E.
          </div>
        )}
        {esTipoNomina(selectedNomina?.tipoNomina, "FINIQUIT") && !esTipoNomina(selectedNomina?.tipoNomina, "LIQUIDAC") && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            Nómina de <strong>finiquito</strong> (renuncia o término): días al corte, vacaciones pendientes,
            prima 25% y aguinaldo proporcional. No incluye prima de antigüedad ni 3 meses / 20 días. CFDI tipo E.
          </div>
        )}
        {esTipoNomina(selectedNomina?.tipoNomina, "LIQUIDAC") && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            Nómina de <strong>liquidación</strong> (despido): finiquito + prima de antigüedad (12 días/año, tope 2 SMG, art. 162)
            + 3 meses + 20 días por año (arts. 48 y 50). Exención ISR 90 SMG por año (art. 93 XIII). CFDI tipo E.
          </div>
        )}
        {esTipoNomina(selectedNomina?.tipoNomina, "PTU") && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-200">
            Nómina de <strong>PTU</strong>: se reparte el monto capturado ({formatCurrency(selectedNomina?.montoPtu || 0)})
            50% igual / 50% proporcional entre quienes tienen 60 días en el ejercicio. Exención 15 UMA, ISR art. 174. CFDI tipo E.
          </div>
        )}

        {incidenciasPeriodo.length > 0 && !(selectedNomina?.tipoNomina || "").toUpperCase().includes("AGUINAL") && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
            Hay <strong>{incidenciasPeriodo.length}</strong> incidencia(s) aplicada(s) en este período.
            Cargar empleados descuenta sueldo por faltas; Calcular ISR/IMSS actualiza días cotizados y bonos.
            {" "}
            <Link to="/nomina/incidencias" className="underline font-medium">
              Abrir incidencias
            </Link>
          </div>
        )}
        {selectedNomina && incidenciasPeriodo.length === 0 && canEditDetalles &&
          !(selectedNomina.tipoNomina || "").toUpperCase().includes("AGUINAL") &&
          !(selectedNomina.tipoNomina || "").toUpperCase().includes("FINIQUIT") && (
          <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
            No hay incidencias aplicadas en este período. Captúralas en{" "}
            <Link to="/nomina/incidencias" className="text-blue-600 underline dark:text-blue-400">
              Incidencias
            </Link>{" "}
            y pulsa Aplicar antes de calcular.
          </p>
        )}

        {loadingDetalles ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <NominaEmpleadoGrid
            rows={detalles}
            savedRows={savedDetalles}
            editable={!!canEditDetalles}
            savingId={savingRowId}
            onChange={setDetalles}
            onSaveRow={(row) => setPendingSave(row)}
            onPrenomina={handlePrenomina}
          />
        )}

        <div className="flex flex-wrap justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
          {selectedNomina && canEditDetalles && detalles.length === 0 && (
            <Button variant="outline" onClick={handleGenerarRenglones} disabled={savingDetalles}>
              {savingDetalles ? "Cargando..." : "Cargar empleados"}
            </Button>
          )}
          {selectedNomina && canEditDetalles && detalles.length > 0 && (
            <Button variant="outline" onClick={() => setPendingSave("all")} disabled={savingDetalles}>
              {savingDetalles ? "Guardando..." : "Guardar todos"}
            </Button>
          )}
          {selectedNomina && canEditDetalles && (
            <Button
              onClick={() => handleCalcular(selectedNomina)}
              disabled={calculando}
            >
              {calculando ? "Calculando..." : esTipoNomina(selectedNomina.tipoNomina, "AGUINAL")
                ? "Calcular aguinaldo"
                : esTipoNomina(selectedNomina.tipoNomina, "LIQUIDAC")
                  ? "Calcular liquidación"
                  : esTipoNomina(selectedNomina.tipoNomina, "FINIQUIT")
                    ? "Calcular finiquito"
                    : esTipoNomina(selectedNomina.tipoNomina, "PTU")
                      ? "Calcular PTU"
                      : "Calcular ISR/IMSS"}
            </Button>
          )}
          {selectedNomina && canEditDetalles && detalles.length > 0 && (
            <Button onClick={() => handleCerrarNomina(selectedNomina)}>
              Cerrado
            </Button>
          )}
          {selectedNomina && detalles.length > 0 && (
            <Button variant="outline" onClick={() => setIsDispersionOpen(true)}>
              Dispersión bancaria
            </Button>
          )}
          {selectedNomina && detalles.length > 0 && (
            <Button variant="outline" onClick={handlePolizaSap} disabled={descargandoPoliza}>
              {descargandoPoliza ? "Generando..." : "Póliza SAP"}
            </Button>
          )}
          {selectedNomina?.estatus === "CERRADA" && (
            <Button
              variant="outline"
              onClick={() => handleEstatusChange(selectedNomina, "PENDIENTE")}
            >
              Reabrir
            </Button>
          )}
          {selectedNomina?.estatus === "CERRADA" && (
            <Button
              onClick={() => handleTimbrar(selectedNomina)}
              disabled={timbrando}
            >
              {timbrando ? "Timbrando..." : "Timbrar Facturapi"}
            </Button>
          )}
          <Button variant="outline" onClick={() => setIsVerNominaOpen(false)}>
            Salir
          </Button>
        </div>
      </Modal>

      <Modal isOpen={!!pendingSave} onClose={() => setPendingSave(null)} className="max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white pr-10">
          Confirmar actualización
        </h3>
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
          {pendingSave === "all"
            ? `¿Estás seguro de actualizar los ${detalles.length} renglones de esta nómina?`
            : `¿Estás seguro de editar el registro de ${pendingSave?.empleadoNombre || "este empleado"}? Al aceptar se guardarán los cambios de este renglón.`}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setPendingSave(null)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (pendingSave === "all") handleGuardarDetalles();
              else confirmarActualizarRenglon();
            }}
            disabled={savingDetalles || savingRowId != null}
          >
            Sí, actualizar
          </Button>
        </div>
      </Modal>

      <Modal
        isOpen={!!prenominaDetalle && !!selectedNomina}
        onClose={() => {
          setPrenominaDetalle(null);
          setPrenominaEmpleado(null);
        }}
        className="max-w-5xl w-full p-6"
      >
        {prenominaDetalle && selectedNomina && (
          <PrenominaRecibo
            nomina={selectedNomina}
            detalle={prenominaDetalle}
            empresa={empresas.find((e) => e.idEmpresa === selectedNomina.idEmpresa) || null}
            empleado={prenominaEmpleado}
            onClose={() => {
              setPrenominaDetalle(null);
              setPrenominaEmpleado(null);
            }}
          />
        )}
      </Modal>

      <DispersionNominaModal
        isOpen={isDispersionOpen}
        idNomina={selectedNomina?.idNomina ?? null}
        onClose={() => setIsDispersionOpen(false)}
      />
    </div>
  );
}
