/* NOMCONEXIA-UNIFY */
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import {
  incidenciaService,
  Incidencia,
  IncidenciaCreate,
  TipoIncidencia,
  esIncidenciaPendiente,
  impactoIncidencia,
} from "../../services/nominaIncidenciaService";
import { empresaService, Empresa } from "../../services/empresaService";
import { empleadoService, Empleado } from "../../services/empleadoService";
import {
  PlusIcon,
  PencilIcon,
  TrashBinIcon,
  FileIcon,
  CheckLineIcon,
  CloseIcon,
  ListIcon,
} from "../../icons";

function toTipoMovimientoApi(value: string) {
  const v = (value || "").toUpperCase();
  if (v === "P" || v === "PERCEPCION") return "PERCEPCION";
  if (v === "D" || v === "DEDUCCION") return "DEDUCCION";
  return v;
}

function toTipoMovimientoUi(value: string) {
  const v = (value || "").toUpperCase();
  if (v === "P" || v === "PERCEPCION") return "PERCEPCION";
  if (v === "D" || v === "DEDUCCION") return "DEDUCCION";
  return v;
}

function parseCsv(text: string): IncidenciaCreate[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);

  const iTipo = idx("tipoincidencia");
  const iEmp = idx("idempleado");
  const iEmpresa = idx("idempresa");
  const iInicio = idx("fechainicio");
  const iFin = idx("fechafin");
  const iCant = idx("cantidad");
  const iMonto = idx("monto");
  const iMov = idx("tipomovimiento");
  const iAfecta = idx("afectanomina");
  const iDesc = idx("descripcion");

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const afectaRaw = iAfecta >= 0 ? (cols[iAfecta] || "1").toLowerCase() : "1";
    return {
      tipoIncidencia: (iTipo >= 0 ? cols[iTipo] : "").toUpperCase(),
      idEmpleado: Number(iEmp >= 0 ? cols[iEmp] : 0) || 0,
      idEmpresa: Number(iEmpresa >= 0 ? cols[iEmpresa] : 0) || 0,
      fechaInicio: iInicio >= 0 ? cols[iInicio] : "",
      fechaFin: iFin >= 0 && cols[iFin] ? cols[iFin] : null,
      cantidad: iCant >= 0 && cols[iCant] ? Number(cols[iCant]) : null,
      monto: iMonto >= 0 && cols[iMonto] ? Number(cols[iMonto]) : null,
      tipoMovimiento: toTipoMovimientoApi(iMov >= 0 ? cols[iMov] : "DEDUCCION"),
      afectaNomina: !["0", "false", "no"].includes(afectaRaw),
      descripcion: iDesc >= 0 ? cols[iDesc] || null : null,
    };
  });
}

const TIPOS_FALLBACK: TipoIncidencia[] = [
  { idTipoIncidencia: 1, clave: "FALTA", descripcion: "Falta", tipoMovimiento: "DEDUCCION", requiereCantidad: true, requiereMonto: false, activo: true },
  { idTipoIncidencia: 2, clave: "RETARDO", descripcion: "Retardo", tipoMovimiento: "DEDUCCION", requiereCantidad: true, requiereMonto: false, activo: true },
  { idTipoIncidencia: 3, clave: "PERMISO", descripcion: "Permiso", tipoMovimiento: "DEDUCCION", requiereCantidad: true, requiereMonto: false, activo: true },
  { idTipoIncidencia: 4, clave: "INCAPACIDAD", descripcion: "Incapacidad", tipoMovimiento: "DEDUCCION", requiereCantidad: true, requiereMonto: false, activo: true },
  { idTipoIncidencia: 5, clave: "HORAS_EXTRA", descripcion: "Horas extra", tipoMovimiento: "PERCEPCION", requiereCantidad: false, requiereMonto: true, activo: true },
];

export default function Incidencias() {
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empleadosFiltro, setEmpleadosFiltro] = useState<Empleado[]>([]);
  const [empleadosForm, setEmpleadosForm] = useState<Empleado[]>([]);
  const [tiposIncidencia, setTiposIncidencia] = useState<TipoIncidencia[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncidencia, setEditingIncidencia] = useState<Incidencia | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const [filtroEmpresa, setFiltroEmpresa] = useState<number | "">("");
  const [filtroEmpleado, setFiltroEmpleado] = useState<number | "">("");
  const [filtroEstatus, setFiltroEstatus] = useState<string>("");
  const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>("");
  const [filtroFechaFin, setFiltroFechaFin] = useState<string>("");

  const [formData, setFormData] = useState<IncidenciaCreate>({
    idEmpleado: 0,
    idEmpresa: 0,
    tipoIncidencia: "",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: null,
    cantidad: null,
    monto: null,
    afectaNomina: true,
    tipoMovimiento: "",
    descripcion: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const tiposActivos = tiposIncidencia.filter((t) => t.activo !== false);
  const tipoSeleccionado = tiposActivos.find(
    (t) => (t.clave || t.idTipoIncidencia.toString()) === formData.tipoIncidencia
  );

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadIncidencias();
  }, [filtroEmpresa, filtroEmpleado, filtroEstatus, filtroFechaInicio, filtroFechaFin]);

  useEffect(() => {
    if (filtroEmpresa) {
      loadEmpleados(Number(filtroEmpresa), "filtro");
    } else {
      setEmpleadosFiltro([]);
      setFiltroEmpleado("");
    }
  }, [filtroEmpresa]);

  useEffect(() => {
    if (!isModalOpen) return;
    if (formData.idEmpresa) {
      loadEmpleados(formData.idEmpresa, "form");
    } else {
      setEmpleadosForm([]);
    }
  }, [isModalOpen, formData.idEmpresa]);

  const loadInitialData = async () => {
    setLoadError(null);
    const [empresasRes, tiposRes] = await Promise.allSettled([
      empresaService.getEmpresas(),
      incidenciaService.getTiposIncidencia(),
    ]);

    if (empresasRes.status === "fulfilled") {
      setEmpresas(Array.isArray(empresasRes.value) ? empresasRes.value : []);
      if (!empresasRes.value?.length) {
        setLoadError("No hay empresas activas. Alta una en Catálogos → Empresas.");
      }
    } else {
      setEmpresas([]);
      setLoadError("No se pudieron cargar las empresas. Revisa la sesión y que la API esté encendida.");
    }

    if (tiposRes.status === "fulfilled" && tiposRes.value?.length) {
      setTiposIncidencia(tiposRes.value);
    } else {
      setTiposIncidencia(TIPOS_FALLBACK);
    }
  };

  const loadEmpleados = async (idEmpresa: number, destino: "filtro" | "form") => {
    try {
      const data = await empleadoService.getEmpleados(idEmpresa);
      const list = Array.isArray(data) ? data : [];
      if (destino === "filtro") setEmpleadosFiltro(list);
      else setEmpleadosForm(list);
    } catch (error) {
      console.error("Error loading empleados:", error);
      if (destino === "filtro") setEmpleadosFiltro([]);
      else setEmpleadosForm([]);
    }
  };

  const loadIncidencias = async () => {
    setLoading(true);
    try {
      const data = await incidenciaService.getIncidencias({
        idEmpresa: filtroEmpresa ? Number(filtroEmpresa) : undefined,
        idEmpleado: filtroEmpleado ? Number(filtroEmpleado) : undefined,
        estatus: filtroEstatus || undefined,
        fechaInicio: filtroFechaInicio || undefined,
        fechaFin: filtroFechaFin || undefined,
      });
      setIncidencias(data);
    } catch (error) {
      console.error("Error loading incidencias:", error);
      setIncidencias([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFiltroEmpresa("");
    setFiltroEmpleado("");
    setFiltroEstatus("");
    setFiltroFechaInicio("");
    setFiltroFechaFin("");
  };

  const openModal = (incidencia?: Incidencia) => {
    if (incidencia) {
      setEditingIncidencia(incidencia);
      setFormData({
        idEmpleado: incidencia.idEmpleado,
        idEmpresa: incidencia.idEmpresa,
        tipoIncidencia: incidencia.tipoIncidencia,
        fechaInicio: incidencia.fechaInicio.split("T")[0],
        fechaFin: incidencia.fechaFin ? incidencia.fechaFin.split("T")[0] : null,
        cantidad: incidencia.cantidad,
        monto: incidencia.monto,
        afectaNomina: incidencia.afectaNomina,
        tipoMovimiento: toTipoMovimientoUi(incidencia.tipoMovimiento),
        descripcion: incidencia.descripcion,
      });
      loadEmpleados(incidencia.idEmpresa, "form");
    } else {
      setEditingIncidencia(null);
      const defaultEmpresa = filtroEmpresa
        ? Number(filtroEmpresa)
        : empresas[0]?.idEmpresa || 0;
      setFormData({
        idEmpleado: 0,
        idEmpresa: defaultEmpresa,
        tipoIncidencia: "",
        fechaInicio: new Date().toISOString().split("T")[0],
        fechaFin: null,
        cantidad: null,
        monto: null,
        afectaNomina: true,
        tipoMovimiento: "",
        descripcion: null,
      });
      setEmpleadosForm([]);
    }
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIncidencia(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.idEmpresa) newErrors.idEmpresa = "La empresa es requerida";
    if (!formData.idEmpleado) newErrors.idEmpleado = "El empleado es requerido";
    if (!formData.tipoIncidencia) newErrors.tipoIncidencia = "El tipo de incidencia es requerido";
    if (!formData.fechaInicio) newErrors.fechaInicio = "La fecha de inicio es requerida";
    if (!formData.tipoMovimiento) newErrors.tipoMovimiento = "El tipo de movimiento es requerido";
    if (tipoSeleccionado?.requiereCantidad && (formData.cantidad == null || formData.cantidad <= 0)) {
      newErrors.cantidad = "Este tipo requiere cantidad (días o minutos)";
    }
    if (tipoSeleccionado?.requiereMonto && (formData.monto == null || formData.monto <= 0)) {
      newErrors.monto = "Este tipo requiere un monto";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const payload = {
        ...formData,
        tipoIncidencia: formData.tipoIncidencia.toUpperCase(),
        tipoMovimiento: toTipoMovimientoApi(formData.tipoMovimiento),
      };
      if (editingIncidencia) {
        await incidenciaService.updateIncidencia({
          ...payload,
          idIncidencia: editingIncidencia.idIncidencia,
        });
      } else {
        await incidenciaService.createIncidencia(payload);
      }
      await loadIncidencias();
      closeModal();
    } catch (error) {
      console.error("Error saving:", error);
      setErrors({ submit: "Error al guardar la incidencia" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (incidencia: Incidencia) => {
    if (!esIncidenciaPendiente(incidencia.estatus)) {
      alert("Solo se pueden cancelar incidencias pendientes o usar Cancelar.");
      return;
    }
    if (!confirm(`¿Cancelar la incidencia "${incidencia.tipoIncidencia}" de ${incidencia.empleadoNombre}?`)) return;

    try {
      await incidenciaService.deleteIncidencia(incidencia.idIncidencia);
      await loadIncidencias();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const handleAplicar = async (incidencia: Incidencia) => {
    if (!confirm(`¿Aplicar "${incidencia.tipoIncidencia}"? Entrá al cálculo de la nómina del período.`)) return;

    try {
      await incidenciaService.aplicarIncidencia(incidencia.idIncidencia);
      await loadIncidencias();
    } catch (error) {
      console.error("Error applying:", error);
    }
  };

  const handleCancelar = async (incidencia: Incidencia) => {
    if (!confirm(`¿Cancelar la incidencia "${incidencia.tipoIncidencia}"?`)) return;

    try {
      await incidenciaService.cancelarIncidencia(incidencia.idIncidencia);
      await loadIncidencias();
    } catch (error) {
      console.error("Error canceling:", error);
    }
  };

  const descargarPlantilla = () => {
    const csv =
      "tipoIncidencia,idEmpleado,idEmpresa,fechaInicio,fechaFin,cantidad,monto,tipoMovimiento,afectaNomina,descripcion\n" +
      "FALTA,1,1,2026-09-01,,1,,DEDUCCION,1,Falta injustificada\n";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "plantilla-incidencias.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.csv$/i)) {
      alert("Usa un CSV (puedes guardar el Excel como CSV). Descarga la plantilla para ver las columnas.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (rows.length === 0) {
        alert("El archivo no tiene renglones válidos.");
        return;
      }
      const result = await incidenciaService.createMasiva(rows);
      const extras = (result.mensajes || []).slice(0, 8).join("\n");
      alert(`${result.message || `Se importaron ${result.creados} incidencias.`}${extras ? `\n${extras}` : ""}`);
      await loadIncidencias();
    } catch (error) {
      console.error("Error uploading:", error);
      alert("Error al importar el CSV");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const getEstatusBadge = (estatus: string) => {
    const key = (estatus || "").toUpperCase();
    const styles: Record<string, string> = {
      PENDIENTE: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      APLICADO: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      APLICADA: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      CANCELADO: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
      CANCELADA: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    return styles[key] || "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400";
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-MX");
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Incidencias
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Captura faltas, retardos e incapacidades. El reloj de oficina y el Excel del checador alimentan este mismo catálogo. Al aplicarlas entran al cálculo de la nómina del período. Permisos y vacaciones con autorización del jefe van en{" "}
            <Link to="/nomina/solicitudes" className="text-blue-600 underline dark:text-blue-400">
              Solicitudes
            </Link>
            .
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv,text/csv"
            className="hidden"
          />
          <Button variant="outline" onClick={descargarPlantilla}>
            Plantilla CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <FileIcon className="w-5 h-5 mr-2" />
            {uploading ? "Cargando..." : "Importar CSV"}
          </Button>
          <Link to="/nomina/reloj">
            <Button variant="outline">Reloj oficina</Button>
          </Link>
          <Link to="/nomina/incidencias/checador">
            <Button variant="outline">Reporte checador</Button>
          </Link>
          <Button onClick={() => openModal()} disabled={empresas.length === 0}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Nueva Incidencia
          </Button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          {loadError}{" "}
          <button type="button" className="underline font-medium" onClick={loadInitialData}>
            Reintentar
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5 p-4">
        <div className="flex items-center gap-2 mb-4">
          <ListIcon className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Filtros</span>
          {(filtroEmpresa || filtroEmpleado || filtroEstatus || filtroFechaInicio || filtroFechaFin) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
            >
              Limpiar filtros
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            options={[
              { value: "", label: "Todas las empresas" },
              ...empresas.map((e) => ({ value: e.idEmpresa.toString(), label: e.nombre })),
            ]}
            placeholder="Empresa"
            onChange={(val) => setFiltroEmpresa(val ? parseInt(val) : "")}
            value={filtroEmpresa === "" ? "" : String(filtroEmpresa)}
          />
          <Select
            options={[
              { value: "", label: "Todos los empleados" },
              ...empleadosFiltro.map((emp) => ({
                value: emp.idEmpleado.toString(),
                label: emp.fullName,
              })),
            ]}
            placeholder="Empleado"
            onChange={(val) => setFiltroEmpleado(val ? parseInt(val) : "")}
            value={filtroEmpleado === "" ? "" : String(filtroEmpleado)}
          />
          <Select
            options={[
              { value: "", label: "Todos los estatus" },
              { value: "PENDIENTE", label: "Pendiente" },
              { value: "APLICADO", label: "Aplicada" },
              { value: "CANCELADO", label: "Cancelada" },
            ]}
            placeholder="Estatus"
            onChange={(val) => setFiltroEstatus(val || "")}
            value={filtroEstatus}
          />
          <Input
            type="date"
            value={filtroFechaInicio}
            onChange={(e) => setFiltroFechaInicio(e.target.value)}
            placeholder="Fecha inicio"
          />
          <Input
            type="date"
            value={filtroFechaFin}
            onChange={(e) => setFiltroFechaFin(e.target.value)}
            placeholder="Fecha fin"
          />
        </div>
      </div>

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
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Empleado</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Impacto en nómina</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Fecha Inicio</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Fecha Fin</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cantidad</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Monto</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Estatus</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {incidencias.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                      No hay incidencias registradas
                    </td>
                  </tr>
                ) : (
                  incidencias.map((incidencia) => {
                    const pendiente = esIncidenciaPendiente(incidencia.estatus);
                    return (
                      <tr key={incidencia.idIncidencia} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-6 py-4 text-gray-800 dark:text-white">{incidencia.empresaNombre}</td>
                        <td className="px-6 py-4 text-gray-800 dark:text-white">{incidencia.empleadoNombre}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {incidencia.tipoIncidenciaDescripcion || incidencia.tipoIncidencia}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                          {impactoIncidencia(incidencia.tipoIncidencia, incidencia.afectaNomina)}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(incidencia.fechaInicio)}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{formatDate(incidencia.fechaFin)}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {incidencia.cantidad !== null ? incidencia.cantidad : "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {formatCurrency(incidencia.monto)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getEstatusBadge(incidencia.estatus)}`}>
                            {incidencia.estatus}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {pendiente && (
                              <>
                                <button
                                  onClick={() => handleAplicar(incidencia)}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                  title="Aplicar a nómina"
                                >
                                  <CheckLineIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleCancelar(incidencia)}
                                  className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg"
                                  title="Cancelar"
                                >
                                  <CloseIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => openModal(incidencia)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                  title="Editar"
                                >
                                  <PencilIcon className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(incidencia)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                  title="Cancelar"
                                >
                                  <TrashBinIcon className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-2xl w-full p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          {editingIncidencia ? "Editar Incidencia" : "Nueva Incidencia"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Empresa *</Label>
              <Select
                options={empresas.map((e) => ({ value: e.idEmpresa.toString(), label: e.nombre }))}
                placeholder={empresas.length ? "Selecciona empresa" : "No hay empresas"}
                onChange={(val) => {
                  setFormData({ ...formData, idEmpresa: parseInt(val) || 0, idEmpleado: 0 });
                }}
                value={formData.idEmpresa ? String(formData.idEmpresa) : ""}
              />
              {errors.idEmpresa && <p className="mt-1 text-sm text-red-500">{errors.idEmpresa}</p>}
              {empresas.length === 0 && (
                <p className="mt-1 text-sm text-amber-600">No hay empresas para elegir. Recarga o da de alta una empresa.</p>
              )}
            </div>
            <div>
              <Label>Empleado *</Label>
              <Select
                options={empleadosForm.map((emp) => ({
                  value: emp.idEmpleado.toString(),
                  label: emp.fullName,
                }))}
                placeholder={formData.idEmpresa ? "Selecciona empleado" : "Elige empresa primero"}
                onChange={(val) => setFormData({ ...formData, idEmpleado: parseInt(val) || 0 })}
                value={formData.idEmpleado ? String(formData.idEmpleado) : ""}
              />
              {errors.idEmpleado && <p className="mt-1 text-sm text-red-500">{errors.idEmpleado}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo de Incidencia *</Label>
              <Select
                options={tiposActivos.map((t) => ({
                  value: t.clave || t.idTipoIncidencia.toString(),
                  label: t.descripcion || t.clave || `Tipo ${t.idTipoIncidencia}`,
                }))}
                placeholder="Selecciona tipo"
                onChange={(val) => {
                  const selectedTipo = tiposActivos.find(
                    (t) => (t.clave || t.idTipoIncidencia.toString()) === val
                  );
                  setFormData({
                    ...formData,
                    tipoIncidencia: val,
                    tipoMovimiento: toTipoMovimientoUi(selectedTipo?.tipoMovimiento || ""),
                  });
                }}
                value={formData.tipoIncidencia}
              />
              {errors.tipoIncidencia && <p className="mt-1 text-sm text-red-500">{errors.tipoIncidencia}</p>}
            </div>
            <div>
              <Label>Tipo de Movimiento *</Label>
              <Select
                options={[
                  { value: "PERCEPCION", label: "Percepción" },
                  { value: "DEDUCCION", label: "Deducción" },
                ]}
                placeholder="Selecciona movimiento"
                onChange={(val) => setFormData({ ...formData, tipoMovimiento: val })}
                value={formData.tipoMovimiento}
              />
              {errors.tipoMovimiento && <p className="mt-1 text-sm text-red-500">{errors.tipoMovimiento}</p>}
            </div>
          </div>

          {formData.tipoIncidencia && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {impactoIncidencia(formData.tipoIncidencia, formData.afectaNomina)}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha Inicio *</Label>
              <Input
                type="date"
                value={formData.fechaInicio || ""}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
              />
              {errors.fechaInicio && <p className="mt-1 text-sm text-red-500">{errors.fechaInicio}</p>}
            </div>
            <div>
              <Label>Fecha Fin</Label>
              <Input
                type="date"
                value={formData.fechaFin || ""}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value || null })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{tipoSeleccionado?.requiereCantidad ? "Cantidad *" : "Cantidad"}</Label>
              <Input
                type="number"
                value={formData.cantidad?.toString() || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cantidad: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="Días o minutos"
                step={0.01}
              />
              {errors.cantidad && <p className="mt-1 text-sm text-red-500">{errors.cantidad}</p>}
            </div>
            <div>
              <Label>{tipoSeleccionado?.requiereMonto ? "Monto *" : "Monto"}</Label>
              <Input
                type="number"
                value={formData.monto?.toString() || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    monto: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="0.00"
                step={0.01}
              />
              {errors.monto && <p className="mt-1 text-sm text-red-500">{errors.monto}</p>}
            </div>
          </div>

          <div>
            <Label>Descripción</Label>
            <textarea
              value={formData.descripcion || ""}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value || null })}
              placeholder="Descripción de la incidencia"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.afectaNomina}
                onChange={(e) => setFormData({ ...formData, afectaNomina: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Afecta nómina</span>
            </label>
          </div>

          {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingIncidencia ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
