/* NOMCONEXIA-UNIFY */
import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { empleadoService, Empleado, EmpleadoCreate, Departamento, Puesto } from "../../services/empleadoService";
import { empresaService, Empresa } from "../../services/empresaService";
import { satCatalogoService, CatalogoSatItem } from "../../services/nominaSatCatalogoService";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../../icons";
import Alert from "../../components/ui/alert/Alert";
import EmpleadoCreditosTab from "../../components/nomina/EmpleadoCreditosTab";
import EmpleadoVacacionesTab from "../../components/nomina/EmpleadoVacacionesTab";
import { validarCurp, validarNss, validarRfc } from "../../utils/validacionFiscal";

type EmpleadoFormTab = "personales" | "laboral" | "sat" | "pago" | "creditos" | "vacaciones";

const FORM_TABS: { id: EmpleadoFormTab; label: string }[] = [
  { id: "personales", label: "Personales" },
  { id: "laboral", label: "Laboral" },
  { id: "sat", label: "SAT" },
  { id: "pago", label: "Pago" },
  { id: "creditos", label: "Créditos" },
  { id: "vacaciones", label: "Vacaciones" },
];

const TAB_ERROR_FIELDS: Record<EmpleadoFormTab, string[]> = {
  personales: ["nombre", "primerApellido", "rfc", "curp", "nss"],
  laboral: ["idEmpresa", "idDepartamento", "idPuesto"],
  sat: [],
  pago: ["sueldoBase"],
  creditos: [],
  vacaciones: [],
};

function firstTabWithErrors(errs: Record<string, string>): EmpleadoFormTab {
  for (const tab of FORM_TABS) {
    if (TAB_ERROR_FIELDS[tab.id].some((field) => errs[field])) return tab.id;
  }
  return "personales";
}

export default function Empleados() {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [puestos, setPuestos] = useState<Puesto[]>([]);
  const [satContratos, setSatContratos] = useState<CatalogoSatItem[]>([]);
  const [satRegimenes, setSatRegimenes] = useState<CatalogoSatItem[]>([]);
  const [satJornadas, setSatJornadas] = useState<CatalogoSatItem[]>([]);
  const [satRiesgos, setSatRiesgos] = useState<CatalogoSatItem[]>([]);
  const [satBancos, setSatBancos] = useState<CatalogoSatItem[]>([]);
  const [satEstados, setSatEstados] = useState<CatalogoSatItem[]>([]);
  const [satPeriodicidad, setSatPeriodicidad] = useState<CatalogoSatItem[]>([]);
  const [satRegimenFiscal, setSatRegimenFiscal] = useState<CatalogoSatItem[]>([]);
  const [satTipoCredito, setSatTipoCredito] = useState<CatalogoSatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpleado, setEditingEmpleado] = useState<Empleado | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filtroEmpresa, setFiltroEmpresa] = useState<number | "">("");
  const [formTab, setFormTab] = useState<EmpleadoFormTab>("personales");
  const [notice, setNotice] = useState<{ variant: "success" | "error"; title: string; message: string } | null>(
    null
  );
  const [colegas, setColegas] = useState<Empleado[]>([]);

  const [formData, setFormData] = useState<EmpleadoCreate>({
    idEmpresa: 0,
    idPuesto: 0,
    idDepartamento: 0,
    nombre: "",
    primerApellido: "",
    segundoApellido: "",
    nss: null,
    correo: "",
    rfc: "",
    curp: "",
    fechaNacimiento: "",
    sueldoBase: 0,
    tipoContrato: "01",
    numeroEmpleado: "",
    claveSucursal: "",
    claveTipoContrato: "01",
    claveTipoRegimen: "02",
    claveTipoJornada: "01",
    claveRiesgoPuesto: "1",
    claveBanco: "",
    claveEntidadFederativa: "CHP",
    clavePeriodicidadPago: "04",
    claveRegimenFiscal: "605",
    cuentaBancaria: "",
    clabe: "",
    sdi: 0,
    sbc: 0,
    fechaIngreso: new Date().toISOString().split("T")[0],
    idJefe: null,
  });

  useEffect(() => {
    loadEmpresas();
    loadSatCatalogos();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(t);
  }, [notice]);

  const loadSatCatalogos = async () => {
    try {
      const [contratos, regimenes, jornadas, riesgos, bancos, estados, periodicidad, regimenFiscal, tipoCredito] =
        await Promise.all([
          satCatalogoService.getTipoContrato(),
          satCatalogoService.getTipoRegimen(),
          satCatalogoService.getTipoJornada(),
          satCatalogoService.getRiesgoPuesto(),
          satCatalogoService.getBancos(),
          satCatalogoService.getEstados(),
          satCatalogoService.getPeriodicidadPago(),
          satCatalogoService.getRegimenFiscal(),
          satCatalogoService.getTipoCreditoInfonavit(),
        ]);
      setSatContratos(contratos || []);
      setSatRegimenes(regimenes || []);
      setSatJornadas(jornadas || []);
      setSatRiesgos(riesgos || []);
      setSatBancos(bancos || []);
      setSatEstados(estados || []);
      setSatPeriodicidad(periodicidad || []);
      setSatRegimenFiscal(regimenFiscal || []);
      setSatTipoCredito(tipoCredito || []);
    } catch (error) {
      console.error("Error loading SAT catalogs:", error);
    }
  };

  useEffect(() => {
    if (filtroEmpresa) {
      loadEmpleados(Number(filtroEmpresa));
    } else {
      loadEmpleados();
    }
  }, [filtroEmpresa]);

  useEffect(() => {
    if (formData.idEmpresa) {
      loadDepartamentos(formData.idEmpresa);
    }
  }, [formData.idEmpresa]);

  useEffect(() => {
    if (formData.idDepartamento) {
      loadPuestos(formData.idDepartamento);
    }
  }, [formData.idDepartamento]);

  useEffect(() => {
    if (!isModalOpen || !formData.idEmpresa) {
      setColegas([]);
      return;
    }
    empleadoService
      .getEmpleados(formData.idEmpresa)
      .then(setColegas)
      .catch(() => setColegas([]));
  }, [isModalOpen, formData.idEmpresa]);

  const loadEmpresas = async () => {
    try {
      const data = await empresaService.getEmpresas();
      setEmpresas(data);
      if (data.length > 0 && !filtroEmpresa) {
        setFormData((prev) => ({ ...prev, idEmpresa: data[0].idEmpresa }));
      }
    } catch (error) {
      console.error("Error loading empresas:", error);
      setEmpresas([]);
    }
  };

  const loadDepartamentos = async (idEmpresa: number) => {
    try {
      const data = await empleadoService.getDepartamentos(idEmpresa);
      setDepartamentos(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, idDepartamento: data[0].idDepartamento }));
      } else {
        setFormData((prev) => ({ ...prev, idDepartamento: 0, idPuesto: 0 }));
        setPuestos([]);
      }
    } catch (error) {
      console.error("Error loading departamentos:", error);
    }
  };

  const loadPuestos = async (idDepartamento: number) => {
    try {
      const data = await empleadoService.getPuestos(idDepartamento);
      setPuestos(data);
      if (data.length > 0) {
        setFormData((prev) => ({ ...prev, idPuesto: data[0].idPuesto }));
      } else {
        setFormData((prev) => ({ ...prev, idPuesto: 0 }));
      }
    } catch (error) {
      console.error("Error loading puestos:", error);
    }
  };

  const loadEmpleados = async (idEmpresa?: number) => {
    setLoading(true);
    try {
      const data = await empleadoService.getEmpleados(idEmpresa);
      setEmpleados(data);
    } catch (error) {
      console.error("Error loading empleados:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (empleado?: Empleado) => {
    if (empleado) {
      setEditingEmpleado(empleado);
      setFormData({
        idEmpresa: empleado.idEmpresa,
        idPuesto: empleado.idPuesto,
        idDepartamento: empleado.idDepartamento,
        nombre: empleado.nombre,
        primerApellido: empleado.primerApellido,
        segundoApellido: empleado.segundoApellido || "",
        nss: empleado.nss,
        correo: empleado.correo || "",
        rfc: empleado.rfc || "",
        curp: empleado.curp || "",
        fechaNacimiento: empleado.fechaNacimiento ? empleado.fechaNacimiento.split("T")[0] : "",
        sueldoBase: empleado.sueldoBase,
        tipoContrato: empleado.claveTipoContrato || empleado.tipoContrato || "01",
        numeroEmpleado: empleado.numeroEmpleado || "",
        claveSucursal: empleado.claveSucursal || "",
        claveTipoContrato: empleado.claveTipoContrato || empleado.tipoContrato || "01",
        claveTipoRegimen: empleado.claveTipoRegimen || "02",
        claveTipoJornada: empleado.claveTipoJornada || "01",
        claveRiesgoPuesto: empleado.claveRiesgoPuesto || "1",
        claveBanco: empleado.claveBanco || "",
        claveEntidadFederativa: empleado.claveEntidadFederativa || "CHP",
        clavePeriodicidadPago: empleado.clavePeriodicidadPago || "04",
        claveRegimenFiscal: empleado.claveRegimenFiscal || "605",
        cuentaBancaria: empleado.cuentaBancaria || "",
        clabe: empleado.clabe || "",
        sdi: empleado.sdi || 0,
        sbc: empleado.sbc || 0,
        fechaIngreso: empleado.fechaIngreso.split("T")[0],
        idJefe: empleado.idJefe ?? null,
      });
      loadDepartamentos(empleado.idEmpresa).then(() => {
        setTimeout(() => {
          setFormData((prev) => ({ ...prev, idDepartamento: empleado.idDepartamento }));
        }, 100);
      });
      loadPuestos(empleado.idDepartamento).then(() => {
        setTimeout(() => {
          setFormData((prev) => ({ ...prev, idPuesto: empleado.idPuesto }));
        }, 100);
      });
    } else {
      setEditingEmpleado(null);
      const defaultEmpresa = filtroEmpresa
        ? Number(filtroEmpresa)
        : empresas.length > 0
          ? empresas[0].idEmpresa
          : 0;
      setFormData({
        idEmpresa: defaultEmpresa,
        idPuesto: 0,
        idDepartamento: 0,
        nombre: "",
        primerApellido: "",
        segundoApellido: "",
        nss: null,
        correo: "",
        rfc: "",
        curp: "",
        fechaNacimiento: "",
        sueldoBase: 0,
        tipoContrato: "01",
        numeroEmpleado: "",
        claveSucursal: "",
        claveTipoContrato: "01",
        claveTipoRegimen: "02",
        claveTipoJornada: "01",
        claveRiesgoPuesto: "1",
        claveBanco: "",
        claveEntidadFederativa: "CHP",
        clavePeriodicidadPago: "04",
        claveRegimenFiscal: "605",
        cuentaBancaria: "",
        clabe: "",
        sdi: 0,
        sbc: 0,
        fechaIngreso: new Date().toISOString().split("T")[0],
        idJefe: null,
      });
      if (defaultEmpresa) {
        loadDepartamentos(defaultEmpresa);
      }
    }
    setErrors({});
    setFormTab("personales");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmpleado(null);
    setErrors({});
    setFormTab("personales");
    setDepartamentos([]);
    setPuestos([]);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.idEmpresa) newErrors.idEmpresa = "La empresa es requerida";
    if (!formData.idDepartamento) newErrors.idDepartamento = "El departamento es requerido";
    if (!formData.idPuesto) newErrors.idPuesto = "El puesto es requerido";
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    if (!formData.primerApellido.trim()) newErrors.primerApellido = "El primer apellido es requerido";
    if (formData.nss) {
      const nss = validarNss(formData.nss);
      if (!nss.valido) newErrors.nss = nss.error ?? "El NSS no es válido";
    }
    if (formData.rfc) {
      const rfc = validarRfc(formData.rfc, "fisica");
      if (!rfc.valido) newErrors.rfc = rfc.error ?? "El RFC no es válido";
    }
    if (formData.curp) {
      const curp = validarCurp(formData.curp);
      if (!curp.valido) newErrors.curp = curp.error ?? "La CURP no es válida";
    }
    if (formData.sueldoBase <= 0) newErrors.sueldoBase = "El salario debe ser mayor a 0";
    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setFormTab(firstTabWithErrors(newErrors));
      return;
    }

    setSaving(true);
    try {
      if (editingEmpleado) {
        await empleadoService.updateEmpleado({
          ...formData,
          idEmpleado: editingEmpleado.idEmpleado,
        });
        setNotice({
          variant: "success",
          title: "Empleado actualizado",
          message: `Los datos de ${formData.nombre} ${formData.primerApellido} se guardaron correctamente.`,
        });
      } else {
        await empleadoService.createEmpleado(formData);
        setNotice({
          variant: "success",
          title: "Empleado creado",
          message: `${formData.nombre} ${formData.primerApellido} se dio de alta correctamente.`,
        });
      }
      await loadEmpleados(filtroEmpresa ? Number(filtroEmpresa) : undefined);
      closeModal();
    } catch (error) {
      console.error("Error saving:", error);
      const msg = error instanceof Error ? error.message : "Error al guardar el empleado";
      setErrors({ submit: msg });
      setNotice({ variant: "error", title: "No se pudo guardar", message: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (empleado: Empleado) => {
    if (!confirm(`¿Está seguro de inactivar al empleado "${empleado.fullName}"?`)) return;
    try {
      await empleadoService.deleteEmpleado(empleado.idEmpleado);
      await loadEmpleados(filtroEmpresa ? Number(filtroEmpresa) : undefined);
      setNotice({
        variant: "success",
        title: "Empleado inactivado",
        message: `${empleado.fullName} ya no aparece como activo.`,
      });
    } catch (error) {
      console.error("Error deleting:", error);
      const msg = error instanceof Error ? error.message : "No se pudo inactivar el empleado";
      setNotice({ variant: "error", title: "No se pudo inactivar", message: msg });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Empleados
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Administra los empleados del sistema
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select
            options={[
              { value: "", label: "Todas las empresas" },
              ...empresas.map((e) => ({ value: e.idEmpresa.toString(), label: e.nombre })),
            ]}
            placeholder="Filtrar por empresa"
            onChange={(val) => setFiltroEmpresa(val ? parseInt(val) : "")}
            defaultValue={filtroEmpresa.toString()}
            className="w-48"
          />
          <Button onClick={() => openModal()}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuevo Empleado
          </Button>
        </div>
      </div>

      {notice && (
        <Alert variant={notice.variant} title={notice.title} message={notice.message} />
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Empleado
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Empresa
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Departamento
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Puesto
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  RFC
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Sueldo
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {empleados.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay empleados registrados
                  </td>
                </tr>
              ) : (
                empleados.map((emp) => (
                  <tr key={emp.idEmpleado} className="hover:bg-gray-50 dark:hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 dark:text-white">
                        {emp.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        Ingreso: {new Date(emp.fechaIngreso).toLocaleDateString("es-MX")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {emp.empresaNombre}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {emp.departamentoNombre}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {emp.puestoNombre}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {emp.rfc || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {formatCurrency(emp.sueldoBase)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(emp)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Inactivar"
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
      </div>

      {/* Modal Create/Edit */}
      <Modal isOpen={isModalOpen} onClose={closeModal} className="max-w-4xl w-full">
        <div className="sticky top-0 z-20 border-b border-gray-200 bg-white pr-16 dark:border-gray-800 dark:bg-gray-900">
          <div className="px-5 pt-4 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {editingEmpleado ? "Editar empleado" : "Nuevo empleado"}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              El empleado se liga a la empresa que elijas aquí. Departamento y puesto están en Laboral.
            </p>
            <div className="mt-3 max-w-md">
              <Label htmlFor="idEmpresaHeader">Empresa *</Label>
              <select
                id="idEmpresaHeader"
                value={formData.idEmpresa ? String(formData.idEmpresa) : ""}
                onChange={(e) => {
                  const id = parseInt(e.target.value) || 0;
                  setFormData({
                    ...formData,
                    idEmpresa: id,
                    idDepartamento: 0,
                    idPuesto: 0,
                  });
                }}
                className="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
              >
                <option value="">Selecciona empresa</option>
                {empresas.map((e) => (
                  <option key={e.idEmpresa} value={e.idEmpresa}>
                    {e.nombre}
                  </option>
                ))}
              </select>
              {errors.idEmpresa && <p className="mt-1 text-sm text-red-500">{errors.idEmpresa}</p>}
            </div>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto px-5 sm:px-6" aria-label="Secciones del empleado">
            {FORM_TABS.map((tab) => {
              const hasError = TAB_ERROR_FIELDS[tab.id].some((field) => errors[field]);
              const active = formTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFormTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  }`}
                >
                  {tab.label}
                  {hasError && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-red-500 align-middle" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <form id="empleado-form" onSubmit={handleSubmit} className="flex flex-col">
          <div
            className={
              formTab === "creditos" || formTab === "vacaciones"
                ? "hidden"
                : "min-h-[280px] px-5 py-5 sm:px-6"
            }
          >
            {formTab === "personales" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    placeholder="Nombre(s)"
                  />
                  {errors.nombre && <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>}
                </div>
                <div>
                  <Label htmlFor="primerApellido">Primer apellido *</Label>
                  <Input
                    id="primerApellido"
                    value={formData.primerApellido}
                    onChange={(e) => setFormData({ ...formData, primerApellido: e.target.value })}
                    placeholder="Primer apellido"
                  />
                  {errors.primerApellido && (
                    <p className="mt-1 text-sm text-red-500">{errors.primerApellido}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="segundoApellido">Segundo apellido</Label>
                  <Input
                    id="segundoApellido"
                    value={formData.segundoApellido || ""}
                    onChange={(e) => setFormData({ ...formData, segundoApellido: e.target.value })}
                    placeholder="Segundo apellido"
                  />
                </div>
                <div>
                  <Label>Núm. empleado</Label>
                  <Input
                    value={formData.numeroEmpleado || ""}
                    onChange={(e) => setFormData({ ...formData, numeroEmpleado: e.target.value })}
                    placeholder="OPER0403"
                  />
                </div>
                <div>
                  <Label>Sucursal SAP</Label>
                  <Input
                    value={formData.claveSucursal || ""}
                    onChange={(e) => setFormData({ ...formData, claveSucursal: e.target.value })}
                    placeholder="SUC00001"
                  />
                </div>
                <div>
                  <Label htmlFor="fechaNacimiento">Fecha de nacimiento</Label>
                  <Input
                    id="fechaNacimiento"
                    type="date"
                    value={formData.fechaNacimiento || ""}
                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="correo">Correo</Label>
                  <Input
                    id="correo"
                    type="email"
                    value={formData.correo || ""}
                    onChange={(e) => setFormData({ ...formData, correo: e.target.value })}
                    placeholder="correo@empresa.com"
                  />
                </div>
                <div>
                  <Label htmlFor="rfc">RFC</Label>
                  <Input
                    id="rfc"
                    value={formData.rfc || ""}
                    onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                    placeholder="XAXX010101000"
                    maxLength={13}
                  />
                  {errors.rfc && <p className="mt-1 text-sm text-red-500">{errors.rfc}</p>}
                </div>
                <div>
                  <Label htmlFor="curp">CURP</Label>
                  <Input
                    id="curp"
                    value={formData.curp || ""}
                    onChange={(e) => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
                    placeholder="CURP"
                    maxLength={18}
                  />
                  {errors.curp && <p className="mt-1 text-sm text-red-500">{errors.curp}</p>}
                </div>
                <div>
                  <Label htmlFor="nss">NSS</Label>
                  <Input
                    id="nss"
                    value={formData.nss?.toString() || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        nss: e.target.value.replace(/\D/g, "").slice(0, 11),
                      })
                    }
                    placeholder="11 dígitos"
                    maxLength={11}
                  />
                  {errors.nss && <p className="mt-1 text-sm text-red-500">{errors.nss}</p>}
                </div>
              </div>
            )}

            {formTab === "laboral" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="idDepartamento">Departamento *</Label>
                  <Select
                    options={departamentos.map((d) => ({
                      value: d.idDepartamento.toString(),
                      label: d.nombre,
                    }))}
                    placeholder="Selecciona departamento"
                    onChange={(val) =>
                      setFormData({ ...formData, idDepartamento: parseInt(val), idPuesto: 0 })
                    }
                    defaultValue={formData.idDepartamento.toString()}
                  />
                  {errors.idDepartamento && (
                    <p className="mt-1 text-sm text-red-500">{errors.idDepartamento}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="idPuesto">Puesto *</Label>
                  <Select
                    options={puestos.map((p) => ({
                      value: p.idPuesto.toString(),
                      label: p.nombre,
                    }))}
                    placeholder="Selecciona puesto"
                    onChange={(val) => setFormData({ ...formData, idPuesto: parseInt(val) })}
                    defaultValue={formData.idPuesto.toString()}
                  />
                  {errors.idPuesto && <p className="mt-1 text-sm text-red-500">{errors.idPuesto}</p>}
                </div>
                <div>
                  <Label htmlFor="fechaIngreso">Fecha de ingreso *</Label>
                  <Input
                    id="fechaIngreso"
                    type="date"
                    value={formData.fechaIngreso}
                    onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="idJefe">Jefe inmediato</Label>
                  <Select
                    options={[
                      { value: "", label: "Sin jefe (RH autoriza)" },
                      ...colegas
                        .filter((e) => e.idEmpleado !== editingEmpleado?.idEmpleado)
                        .map((e) => ({ value: String(e.idEmpleado), label: e.fullName })),
                    ]}
                    placeholder="Selecciona jefe"
                    value={formData.idJefe ? String(formData.idJefe) : ""}
                    onChange={(val) =>
                      setFormData({ ...formData, idJefe: val ? parseInt(val) : null })
                    }
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Autoriza vacaciones y permisos. Si no hay jefe, RH autoriza en Solicitudes.
                  </p>
                </div>
              </div>
            )}

            {formTab === "sat" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="tipoContrato">Tipo contrato</Label>
                  <Select
                    options={(satContratos.length
                      ? satContratos
                      : [
                          { clave: "01", descripcion: "Tiempo indeterminado" },
                          { clave: "02", descripcion: "Tiempo determinado" },
                        ]
                    ).map((c) => ({ value: c.clave, label: `${c.clave} - ${c.descripcion}` }))}
                    placeholder="Selecciona tipo"
                    onChange={(val) =>
                      setFormData({ ...formData, claveTipoContrato: val, tipoContrato: val })
                    }
                    defaultValue={formData.claveTipoContrato || formData.tipoContrato || "01"}
                  />
                </div>
                <div>
                  <Label>Régimen laboral</Label>
                  <Select
                    options={(satRegimenes.length
                      ? satRegimenes
                      : [{ clave: "02", descripcion: "Sueldos" }]
                    ).map((c) => ({ value: c.clave, label: `${c.clave} - ${c.descripcion}` }))}
                    onChange={(val) => setFormData({ ...formData, claveTipoRegimen: val })}
                    defaultValue={formData.claveTipoRegimen || "02"}
                  />
                </div>
                <div>
                  <Label>Jornada</Label>
                  <Select
                    options={(satJornadas.length
                      ? satJornadas
                      : [{ clave: "01", descripcion: "Diurna" }]
                    ).map((c) => ({ value: c.clave, label: `${c.clave} - ${c.descripcion}` }))}
                    onChange={(val) => setFormData({ ...formData, claveTipoJornada: val })}
                    defaultValue={formData.claveTipoJornada || "01"}
                  />
                </div>
                <div>
                  <Label>Riesgo puesto</Label>
                  <Select
                    options={(satRiesgos.length
                      ? satRiesgos
                      : [{ clave: "1", descripcion: "Clase I" }]
                    ).map((c) => ({ value: c.clave, label: `${c.clave} - ${c.descripcion}` }))}
                    onChange={(val) => setFormData({ ...formData, claveRiesgoPuesto: val })}
                    defaultValue={formData.claveRiesgoPuesto || "1"}
                  />
                </div>
                <div>
                  <Label>Entidad federativa</Label>
                  <Select
                    options={(satEstados.length
                      ? satEstados
                      : [{ clave: "CHP", descripcion: "Chiapas" }]
                    ).map((c) => ({ value: c.clave, label: `${c.clave} - ${c.descripcion}` }))}
                    onChange={(val) => setFormData({ ...formData, claveEntidadFederativa: val })}
                    defaultValue={formData.claveEntidadFederativa || "CHP"}
                  />
                </div>
                <div>
                  <Label>Periodicidad</Label>
                  <Select
                    options={(satPeriodicidad.length
                      ? satPeriodicidad
                      : [{ clave: "04", descripcion: "Quincenal" }]
                    ).map((c) => ({ value: c.clave, label: `${c.clave} - ${c.descripcion}` }))}
                    onChange={(val) => setFormData({ ...formData, clavePeriodicidadPago: val })}
                    defaultValue={formData.clavePeriodicidadPago || "04"}
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-3">
                  <Label>Régimen fiscal CFDI</Label>
                  <Select
                    options={(satRegimenFiscal.length
                      ? satRegimenFiscal
                      : [{ clave: "605", descripcion: "Sueldos y Salarios" }]
                    ).map((c) => ({ value: c.clave, label: `${c.clave} - ${c.descripcion}` }))}
                    onChange={(val) => setFormData({ ...formData, claveRegimenFiscal: val })}
                    defaultValue={formData.claveRegimenFiscal || "605"}
                  />
                </div>
              </div>
            )}

            {formTab === "pago" && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <Label htmlFor="sueldoBase">Sueldo base *</Label>
                  <Input
                    id="sueldoBase"
                    type="number"
                    value={formData.sueldoBase?.toString() || "0"}
                    onChange={(e) =>
                      setFormData({ ...formData, sueldoBase: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    min="0"
                  />
                  {errors.sueldoBase && (
                    <p className="mt-1 text-sm text-red-500">{errors.sueldoBase}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="sdi">SDI</Label>
                  <Input
                    id="sdi"
                    type="number"
                    value={formData.sdi?.toString() || "0"}
                    onChange={(e) =>
                      setFormData({ ...formData, sdi: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    min="0"
                  />
                </div>
                <div>
                  <Label htmlFor="sbc">SBC</Label>
                  <Input
                    id="sbc"
                    type="number"
                    value={formData.sbc?.toString() || "0"}
                    onChange={(e) =>
                      setFormData({ ...formData, sbc: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="0.00"
                    min="0"
                  />
                </div>
                <div>
                  <Label>Banco</Label>
                  <Select
                    options={[
                      { value: "", label: "Sin banco" },
                      ...satBancos.map((c) => ({
                        value: c.clave,
                        label: `${c.clave} - ${c.descripcion}`,
                      })),
                    ]}
                    onChange={(val) => setFormData({ ...formData, claveBanco: val })}
                    defaultValue={formData.claveBanco || ""}
                  />
                </div>
                <div>
                  <Label>Cuenta bancaria</Label>
                  <Input
                    value={formData.cuentaBancaria || ""}
                    onChange={(e) => setFormData({ ...formData, cuentaBancaria: e.target.value })}
                  />
                </div>
                <div>
                  <Label>CLABE</Label>
                  <Input
                    value={formData.clabe || ""}
                    onChange={(e) => setFormData({ ...formData, clabe: e.target.value })}
                    maxLength={18}
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {(formTab === "creditos" || formTab === "vacaciones") && (
          <div className="min-h-[280px] px-5 py-5 sm:px-6">
            {formTab === "creditos" && (
              <EmpleadoCreditosTab
                idEmpleado={editingEmpleado?.idEmpleado ?? null}
                tiposDescuento={satTipoCredito}
              />
            )}
            {formTab === "vacaciones" && (
              <EmpleadoVacacionesTab
                idEmpleado={editingEmpleado?.idEmpleado ?? null}
                sueldoBase={formData.sueldoBase || 0}
              />
            )}
          </div>
        )}

          {errors.submit && (
            <p className="px-5 text-sm text-red-500 sm:px-6">{errors.submit}</p>
          )}

          <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-white px-5 py-4 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={formTab === FORM_TABS[0].id}
                onClick={() => {
                  const i = FORM_TABS.findIndex((t) => t.id === formTab);
                  if (i > 0) setFormTab(FORM_TABS[i - 1].id);
                }}
              >
                Anterior
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={formTab === FORM_TABS[FORM_TABS.length - 1].id}
                onClick={() => {
                  const i = FORM_TABS.findIndex((t) => t.id === formTab);
                  if (i < FORM_TABS.length - 1) setFormTab(FORM_TABS[i + 1].id);
                }}
              >
                Siguiente
              </Button>
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" form="empleado-form" disabled={saving}>
                {saving ? "Guardando..." : editingEmpleado ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </div>
      </Modal>
    </div>
  );
}
