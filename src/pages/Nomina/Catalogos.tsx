/* NOMCONEXIA-UNIFY */
import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import {
  catalogoService,
  Departamento,
  Puesto,
  Concepto,
} from "../../services/catalogoService";
import { empresaService, Empresa } from "../../services/empresaService";
import {
  satCatalogoService,
  SatCatalogosTodos,
  CatalogoSatItem,
} from "../../services/nominaSatCatalogoService";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../../icons";
import CuotasImssTab from "../../components/nomina/CuotasImssTab";
import MapeoContableTab from "../../components/nomina/MapeoContableTab";

type TabType = "departamentos" | "puestos" | "conceptos" | "sat" | "imss" | "sap";

const TIPO_CALCULO_OPTIONS = [
  { value: "MANUAL", label: "Manual (no se calcula)" },
  { value: "PORCENTAJE_SUELDO", label: "% del sueldo del periodo" },
  { value: "DIAS_SUELDO", label: "Días de sueldo" },
  { value: "FIJO", label: "Monto fijo" },
  { value: "CAMPO", label: "Copiar campo del renglón" },
];

const CAMPO_ORIGEN_OPTIONS = [
  { value: "SUELDO", label: "Sueldo" },
  { value: "PUNTUALIDAD", label: "Puntualidad" },
  { value: "ASISTENCIA", label: "Asistencia" },
  { value: "VACACIONES", label: "Vacaciones" },
  { value: "PRIMA_VACACIONAL", label: "Prima vacacional" },
  { value: "AGUINALDO", label: "Aguinaldo" },
  { value: "HORAS_EXTRA", label: "Horas extra" },
  { value: "ISR", label: "ISR" },
  { value: "IMSS", label: "IMSS" },
  { value: "INFONAVIT", label: "INFONAVIT" },
  { value: "FONACOT", label: "FONACOT" },
  { value: "PENSION", label: "Pensión" },
  { value: "AHORRO", label: "Ahorro" },
  { value: "PRESTAMO", label: "Préstamo" },
  { value: "NETO", label: "Neto / depósito" },
];

function etiquetaTipoCalculo(tipo?: string) {
  return TIPO_CALCULO_OPTIONS.find((o) => o.value === tipo)?.label ?? tipo ?? "Manual";
}

const SAT_CATALOG_TABS: { id: keyof SatCatalogosTodos; label: string }[] = [
  { id: "regimenFiscal", label: "Régimen fiscal" },
  { id: "estados", label: "Entidad federativa" },
  { id: "tipoNomina", label: "Tipo nómina" },
  { id: "periodicidadPago", label: "Periodicidad" },
  { id: "tipoContrato", label: "Tipo contrato" },
  { id: "tipoRegimen", label: "Tipo régimen" },
  { id: "tipoJornada", label: "Jornada" },
  { id: "riesgoPuesto", label: "Riesgo puesto" },
  { id: "tipoPercepcion", label: "Percepciones" },
  { id: "tipoDeduccion", label: "Deducciones" },
  { id: "tipoCreditoInfonavit", label: "Crédito Infonavit" },
  { id: "tipoOtroPago", label: "Otros pagos" },
  { id: "bancos", label: "Bancos" },
  { id: "origenRecurso", label: "Origen recurso" },
  { id: "tipoHoraExtra", label: "Hora extra" },
  { id: "tipoIncapacidad", label: "Incapacidad" },
];

export default function Catalogos() {
  const [activeTab, setActiveTab] = useState<TabType>("departamentos");
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [conceptos, setConceptos] = useState<Concepto[]>([]);
  const [satTodos, setSatTodos] = useState<SatCatalogosTodos | null>(null);
  const [satView, setSatView] = useState<keyof SatCatalogosTodos>("regimenFiscal");
  
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filtroEmpresa, setFiltroEmpresa] = useState<number | "">("");

  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadEmpresas();
    satCatalogoService.getTodos().then(setSatTodos).catch(() => setSatTodos(null));
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab, filtroEmpresa]);

  const loadEmpresas = async () => {
    try {
      const data = await empresaService.getEmpresas();
      setEmpresas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading empresas:", error);
      setEmpresas([]);
    }
  };

  const loadData = async () => {
    if (activeTab === "imss" || activeTab === "sap") {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (activeTab === "departamentos") {
        const data = await catalogoService.getDepartamentos(
          filtroEmpresa ? Number(filtroEmpresa) : undefined
        );
        setDepartamentos(Array.isArray(data) ? data : []);
      } else if (activeTab === "puestos") {
        const data = await catalogoService.getPuestos(
          filtroEmpresa ? Number(filtroEmpresa) : undefined
        );
        setPuestos(Array.isArray(data) ? data : []);
      } else if (activeTab === "conceptos") {
        const data = await catalogoService.getConceptos();
        setConceptos(Array.isArray(data) ? data : []);
      } else if (activeTab === "sat") {
        const data = await satCatalogoService.getTodos();
        setSatTodos(data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      if (activeTab === "departamentos") setDepartamentos([]);
      else if (activeTab === "puestos") setPuestos([]);
      else setConceptos([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item?: any) => {
    if (activeTab === "departamentos") {
      setFormData(item || {
        idEmpresa: filtroEmpresa || (empresas[0]?.idEmpresa || 0),
        nombre: "",
        codigo: "",
        centroCosto: "",
        categoria: "",
      });
    } else if (activeTab === "puestos") {
      setFormData(item || {
        idDepartamento: 0,
        nombre: "",
        codigoPuesto: "",
        jerarquia: "",
        sueldoBase: 0,
      });
    } else if (activeTab === "conceptos") {
      setFormData(item || {
        clave: "",
        descripcion: "",
        tipoConcepto: "P",
        gravado: true,
        claveSat: "",
        tipoCalculo: "MANUAL",
        valorCalculo: 0,
        esAutomatico: false,
        campoOrigen: "",
      });
    }
    setEditingItem(item || null);
    setErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (activeTab === "departamentos") {
      if (!formData.idEmpresa) newErrors.idEmpresa = "La empresa es requerida";
      if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
      if (!formData.codigo.trim()) newErrors.codigo = "El código es requerido";
    } else if (activeTab === "puestos") {
      if (!formData.idDepartamento) newErrors.idDepartamento = "El departamento es requerido";
      if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
      if (!formData.codigoPuesto.trim()) newErrors.codigoPuesto = "El código es requerido";
    } else if (activeTab === "conceptos") {
      if (!formData.clave.trim()) newErrors.clave = "La clave es requerida";
      if (!formData.descripcion.trim()) newErrors.descripcion = "La descripción es requerida";
      if (!formData.tipoConcepto) newErrors.tipoConcepto = "El tipo es requerido";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (activeTab === "departamentos") {
        if (editingItem) {
          await catalogoService.updateDepartamento({
            ...formData,
            idDepartamento: editingItem.idDepartamento,
          });
        } else {
          await catalogoService.createDepartamento(formData);
        }
      } else if (activeTab === "puestos") {
        if (editingItem) {
          await catalogoService.updatePuesto({
            ...formData,
            idPuesto: editingItem.idPuesto,
          });
        } else {
          await catalogoService.createPuesto(formData);
        }
      } else if (activeTab === "conceptos") {
        if (editingItem) {
          await catalogoService.updateConcepto({
            ...formData,
            idConcepto: editingItem.idConcepto,
          });
        } else {
          await catalogoService.createConcepto(formData);
        }
      }
      await loadData();
      closeModal();
    } catch (error) {
      console.error("Error saving:", error);
      setErrors({ submit: "Error al guardar" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: any) => {
    const confirmMessage = activeTab === "departamentos"
      ? `¿Inactivar el departamento "${item.nombre}"?`
      : activeTab === "puestos"
      ? `¿Inactivar el puesto "${item.nombre}"?`
      : `¿Inactivar el concepto "${item.descripcion}"?`;
      
    if (!confirm(confirmMessage)) return;
    
    try {
      if (activeTab === "departamentos") {
        await catalogoService.deleteDepartamento(item.idDepartamento);
      } else if (activeTab === "puestos") {
        await catalogoService.deletePuesto(item.idPuesto);
      } else if (activeTab === "conceptos") {
        await catalogoService.deleteConcepto(item.idConcepto);
      }
      await loadData();
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const tabs = [
    { id: "departamentos", label: "Departamentos" },
    { id: "puestos", label: "Puestos" },
    { id: "conceptos", label: "Conceptos de Nómina" },
    { id: "imss", label: "Cuotas IMSS" },
    { id: "sap", label: "Cuentas SAP" },
    { id: "sat", label: "Catálogos SAT" },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Catálogos
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Configura los catálogos del sistema
          </p>
        </div>
        {activeTab !== "conceptos" && activeTab !== "sat" && activeTab !== "imss" && activeTab !== "sap" && (
          <Select
            options={[
              { value: "", label: "Todas las empresas" },
              ...(Array.isArray(empresas) ? empresas : []).map((e) => ({
                value: e.idEmpresa.toString(),
                label: e.nombre,
              })),
            ]}
            placeholder="Filtrar por empresa"
            onChange={(val) => setFiltroEmpresa(val ? parseInt(val) : "")}
            defaultValue={filtroEmpresa.toString()}
            className="w-48"
          />
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex items-center justify-between">
        <div></div>
        {activeTab !== "sat" && activeTab !== "imss" && activeTab !== "sap" && (
          <Button onClick={() => openModal()}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuevo
          </Button>
        )}
      </div>

      {activeTab === "imss" ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/5">
          <CuotasImssTab />
        </div>
      ) : activeTab === "sap" ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/5">
          <MapeoContableTab empresas={empresas} />
        </div>
      ) : (

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "departamentos" && (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Código</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Centro de Costo</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {departamentos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No hay departamentos registrados
                      </td>
                    </tr>
                  ) : (
                    departamentos.map((dept) => (
                      <tr key={dept.idDepartamento} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-6 py-4 text-gray-800 dark:text-white">{dept.codigo}</td>
                        <td className="px-6 py-4 text-gray-800 dark:text-white">{dept.nombre}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{dept.empresaNombre}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{dept.centroCosto || "-"}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openModal(dept)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(dept)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                              <TrashBinIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "puestos" && (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Código</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Nombre</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Departamento</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Sueldo Base</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {puestos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                        No hay puestos registrados
                      </td>
                    </tr>
                  ) : (
                    puestos.map((puesto) => (
                      <tr key={puesto.idPuesto} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-6 py-4 text-gray-800 dark:text-white">{puesto.codigoPuesto}</td>
                        <td className="px-6 py-4 text-gray-800 dark:text-white">{puesto.nombre}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{puesto.departamentoNombre}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{puesto.empresaNombre}</td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {puesto.sueldoBase ? formatCurrency(puesto.sueldoBase) : "-"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openModal(puesto)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(puesto)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                              <TrashBinIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "conceptos" && (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Clave</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Clave SAT</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Cálculo</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Automático</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Gravado</th>
                    <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {conceptos.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                        No hay conceptos registrados
                      </td>
                    </tr>
                  ) : (
                    conceptos.map((concepto) => (
                      <tr key={concepto.idConcepto} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-6 py-4 text-gray-800 dark:text-white">{concepto.clave}</td>
                        <td className="px-6 py-4 text-gray-800 dark:text-white">{concepto.descripcion}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            concepto.tipoConcepto === "P" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}>
                            {concepto.tipoConceptoNombre}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {concepto.claveSat || "-"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {etiquetaTipoCalculo(concepto.tipoCalculo)}
                          {concepto.tipoCalculo === "PORCENTAJE_SUELDO" && concepto.valorCalculo
                            ? ` (${concepto.valorCalculo}%)`
                            : concepto.tipoCalculo === "FIJO" && concepto.valorCalculo
                            ? ` (${concepto.valorCalculo})`
                            : concepto.tipoCalculo === "DIAS_SUELDO" && concepto.valorCalculo
                            ? ` (${concepto.valorCalculo} d)`
                            : ""}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {concepto.esAutomatico ? "Sí" : "No"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                          {concepto.gravado ? "Sí" : "No"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => openModal(concepto)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(concepto)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                              <TrashBinIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "sat" && (
              <div className="p-4 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Consulta oficial SAT (solo lectura). Úsalas al dar de alta empresa, empleado y conceptos.
                  </p>
                  <Select
                    options={SAT_CATALOG_TABS.map((t) => ({ value: t.id, label: t.label }))}
                    onChange={(val) => setSatView(val as keyof SatCatalogosTodos)}
                    defaultValue={satView}
                    className="w-64"
                  />
                </div>
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Clave</th>
                      <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">Descripción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {((satTodos?.[satView] as CatalogoSatItem[]) || []).length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-8 text-center text-gray-500">
                          No hay claves SAT. Reinicia la API para sembrar catálogos.
                        </td>
                      </tr>
                    ) : (
                      ((satTodos?.[satView] as CatalogoSatItem[]) || []).map((item) => (
                        <tr key={item.clave} className="hover:bg-gray-50 dark:hover:bg-white/5">
                          <td className="px-6 py-4 font-mono text-gray-800 dark:text-white">{item.clave}</td>
                          <td className="px-6 py-4 text-gray-800 dark:text-white">{item.descripcion}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} className={`${activeTab === "conceptos" ? "max-w-2xl" : "max-w-lg"} w-full p-6`}>
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">
          {editingItem ? "Editar" : "Nuevo"} {activeTab === "departamentos" ? "Departamento" : activeTab === "puestos" ? "Puesto" : "Concepto"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === "departamentos" && (
            <>
              <div>
                <Label>Empresa *</Label>
                <Select
                  options={(Array.isArray(empresas) ? empresas : []).map((e) => ({
                    value: e.idEmpresa.toString(),
                    label: e.nombre,
                  }))}
                  placeholder="Selecciona empresa"
                  onChange={(val) => setFormData({ ...formData, idEmpresa: parseInt(val) })}
                  defaultValue={formData.idEmpresa?.toString() || ""}
                />
                {errors.idEmpresa && <p className="mt-1 text-sm text-red-500">{errors.idEmpresa}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre || ""}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del departamento"
                  />
                  {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
                </div>
                <div>
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigo || ""}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Código"
                  />
                  {errors.codigo && <p className="mt-1 text-sm text-red-500">{errors.codigo}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Centro de Costo</Label>
                  <Input
                    value={formData.centroCosto || ""}
                    onChange={(e) => setFormData({ ...formData, centroCosto: e.target.value })}
                    placeholder="DEP00002"
                  />
                </div>
                <div>
                  <Label>Categoría</Label>
                  <Input
                    value={formData.categoria || ""}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Categoría"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === "puestos" && (
            <>
              <div>
                <Label>Departamento *</Label>
                <Select
                  options={departamentos.map((d) => ({ value: d.idDepartamento.toString(), label: d.nombre }))}
                  placeholder="Selecciona departamento"
                  onChange={(val) => setFormData({ ...formData, idDepartamento: parseInt(val) })}
                  defaultValue={formData.idDepartamento?.toString() || ""}
                />
                {errors.idDepartamento && <p className="mt-1 text-sm text-red-500">{errors.idDepartamento}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input
                    value={formData.nombre || ""}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre del puesto"
                  />
                  {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
                </div>
                <div>
                  <Label>Código *</Label>
                  <Input
                    value={formData.codigoPuesto || ""}
                    onChange={(e) => setFormData({ ...formData, codigoPuesto: e.target.value })}
                    placeholder="Código"
                  />
                  {errors.codigoPuesto && <p className="mt-1 text-sm text-red-500">{errors.codigoPuesto}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Jerarquía</Label>
                  <Input
                    type="number"
                    value={formData.jerarquia?.toString() || ""}
                    onChange={(e) => setFormData({ ...formData, jerarquia: parseInt(e.target.value) || null })}
                    placeholder="Nivel jerárquico"
                  />
                </div>
                <div>
                  <Label>Sueldo Base</Label>
                  <Input
                    type="number"
                    value={formData.sueldoBase?.toString() || ""}
                    onChange={(e) => setFormData({ ...formData, sueldoBase: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === "conceptos" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Clave *</Label>
                  <Input
                    value={formData.clave || ""}
                    onChange={(e) => setFormData({ ...formData, clave: e.target.value.toUpperCase() })}
                    placeholder="Ej. AHORRO"
                    maxLength={20}
                  />
                  {errors.clave && <p className="mt-1 text-sm text-red-500">{errors.clave}</p>}
                </div>
                <div>
                  <Label>Tipo *</Label>
                  <Select
                    options={[
                      { value: "P", label: "Percepción" },
                      { value: "D", label: "Deducción" },
                    ]}
                    placeholder="Selecciona tipo"
                    onChange={(val) => setFormData({ ...formData, tipoConcepto: val })}
                    defaultValue={formData.tipoConcepto || "P"}
                  />
                  {errors.tipoConcepto && <p className="mt-1 text-sm text-red-500">{errors.tipoConcepto}</p>}
                </div>
              </div>
              <div>
                <Label>Descripción *</Label>
                <Input
                  value={formData.descripcion || ""}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Descripción del concepto"
                />
                  {errors.descripcion && <p className="mt-1 text-sm text-red-500">{errors.descripcion}</p>}
              </div>
              <div>
                <Label>Clave SAT</Label>
                <Select
                  options={[
                    { value: "", label: "Sin clave SAT" },
                    ...((formData.tipoConcepto === "D"
                      ? satTodos?.tipoDeduccion
                      : satTodos?.tipoPercepcion) || []
                    ).map((c) => ({
                      value: c.clave,
                      label: `${c.clave} - ${c.descripcion}`,
                    })),
                  ]}
                  placeholder="Selecciona clave SAT"
                  onChange={(val) => setFormData({ ...formData, claveSat: val })}
                  defaultValue={formData.claveSat || ""}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.gravado ?? true}
                    onChange={(e) => setFormData({ ...formData, gravado: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Gravado para impuestos</span>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo de cálculo</Label>
                  <Select
                    key={`calc-${editingItem?.idConcepto ?? "new"}`}
                    options={TIPO_CALCULO_OPTIONS}
                    placeholder="Cómo se calcula"
                    onChange={(val) =>
                      setFormData({
                        ...formData,
                        tipoCalculo: val,
                        esAutomatico: val !== "MANUAL" ? true : formData.esAutomatico,
                      })
                    }
                    defaultValue={formData.tipoCalculo || "MANUAL"}
                  />
                </div>
                {formData.tipoCalculo && formData.tipoCalculo !== "MANUAL" && formData.tipoCalculo !== "CAMPO" && (
                  <div>
                    <Label>
                      {formData.tipoCalculo === "PORCENTAJE_SUELDO"
                        ? "Porcentaje"
                        : formData.tipoCalculo === "DIAS_SUELDO"
                        ? "Días"
                        : "Monto fijo"}
                    </Label>
                    <Input
                      type="number"
                      value={formData.valorCalculo?.toString() ?? "0"}
                      onChange={(e) =>
                        setFormData({ ...formData, valorCalculo: parseFloat(e.target.value) || 0 })
                      }
                      placeholder={formData.tipoCalculo === "PORCENTAJE_SUELDO" ? "Ej. 10" : "0.00"}
                    />
                  </div>
                )}
              </div>
              {formData.tipoCalculo === "CAMPO" && (
                <div>
                  <Label>Campo origen</Label>
                  <Select
                    options={CAMPO_ORIGEN_OPTIONS}
                    placeholder="Campo del renglón"
                    onChange={(val) => setFormData({ ...formData, campoOrigen: val })}
                    defaultValue={formData.campoOrigen || ""}
                  />
                </div>
              )}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.esAutomatico ?? false}
                    onChange={(e) => setFormData({ ...formData, esAutomatico: e.target.checked })}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Aplicar al calcular la nómina ordinaria
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  Las reglas de puntualidad/asistencia del catálogo de bonos tienen prioridad si ya hay importe.
                </p>
              </div>
            </>
          )}

          {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingItem ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
