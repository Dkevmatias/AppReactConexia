/* NOMCONEXIA-UNIFY */
import { useEffect, useState } from "react";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { empresaService, Empresa, EmpresaCreate, Periodicidad } from "../../services/empresaService";
import { satCatalogoService, CatalogoSatItem, satSelectOptions } from "../../services/nominaSatCatalogoService";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../../icons";
import PoliticaRetardoTab from "../../components/nomina/PoliticaRetardoTab";
import BonoPuntualidadTab from "../../components/nomina/BonoPuntualidadTab";
import { nominaBonoService } from "../../services/nominaBonoService";
import { validarCorreo, validarRfc } from "../../utils/validacionFiscal";

export default function Empresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [periodicidades, setPeriodicidades] = useState<Periodicidad[]>([]);
  const [satRegimenFiscal, setSatRegimenFiscal] = useState<CatalogoSatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tab, setTab] = useState<"datos" | "asistencia" | "bono">("datos");
  const [bonoInicial, setBonoInicial] = useState({
    anio: String(new Date().getFullYear()),
    monto: "",
    activo: true,
  });

  const [formData, setFormData] = useState<EmpresaCreate>({
    nombre: "",
    rfc: "",
    regimenFiscal: "601",
    registroPatronal: "",
    representanteLegal: "",
    idPeriodicidad: 0,
    telefono: "",
    correo: "",
    razonSocial: "",
    codigoPostal: "",
    claveBancoEmpresa: "",
    cuentaCargo: "",
    clabeEmpresa: "",
    convenioDispersion: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [emps, per, regimenes] = await Promise.all([
        empresaService.getEmpresas(),
        empresaService.getPeriodicidades(),
        satCatalogoService.getRegimenFiscal(),
      ]);
      setEmpresas(emps);
      setPeriodicidades(per);
      setSatRegimenFiscal(regimenes);
    } catch (error) {
      console.error("Error loading data:", error);
      setEmpresas([]);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (empresa?: Empresa) => {
    if (empresa) {
      setEditingEmpresa(empresa);
      setFormData({
        nombre: empresa.nombre,
        rfc: empresa.rfc,
        regimenFiscal: empresa.regimenFiscal || "",
        registroPatronal: empresa.registroPatronal || "",
        representanteLegal: empresa.representanteLegal || "",
        idPeriodicidad: empresa.idPeriodicidad,
        telefono: empresa.telefono || "",
        correo: empresa.correo || "",
        razonSocial: empresa.razonSocial || empresa.nombre,
        codigoPostal: empresa.codigoPostal || "",
        claveBancoEmpresa: empresa.claveBancoEmpresa || "",
        cuentaCargo: empresa.cuentaCargo || "",
        clabeEmpresa: empresa.clabeEmpresa || "",
        convenioDispersion: empresa.convenioDispersion || "",
      });
    } else {
      setEditingEmpresa(null);
      setFormData({
        nombre: "",
        rfc: "",
        regimenFiscal: "601",
        registroPatronal: "",
        representanteLegal: "",
        idPeriodicidad: periodicidades[0]?.idPeriodicidad || 0,
        telefono: "",
        correo: "",
        razonSocial: "",
        codigoPostal: "",
        claveBancoEmpresa: "",
        cuentaCargo: "",
        clabeEmpresa: "",
        convenioDispersion: "",
      });
    }
    setErrors({});
    setTab("datos");
    setBonoInicial({
      anio: String(new Date().getFullYear()),
      monto: "",
      activo: true,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmpresa(null);
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido";
    const rfc = validarRfc(formData.rfc);
    if (!rfc.valido) newErrors.rfc = rfc.error ?? "El RFC no es válido";
    if (formData.idPeriodicidad === 0) newErrors.idPeriodicidad = "La periodicidad es requerida";
    if (formData.correo) {
      const correo = validarCorreo(formData.correo);
      if (!correo.valido) newErrors.correo = correo.error ?? "Correo inválido";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setTab("datos");
      return;
    }

    setSaving(true);
    try {
      if (editingEmpresa) {
        await empresaService.updateEmpresa({
          ...formData,
          idEmpresa: editingEmpresa.idEmpresa,
        });
      } else {
        const creada = await empresaService.createEmpresa(formData);
        const monto = Number(bonoInicial.monto);
        if (creada?.idEmpresa && monto > 0) {
          await nominaBonoService.create({
            idEmpresa: creada.idEmpresa,
            anio: Number(bonoInicial.anio) || new Date().getFullYear(),
            monto,
            activo: bonoInicial.activo,
          });
        }
      }
      await loadData();
      closeModal();
    } catch (error) {
      console.error("Error saving:", error);
      setErrors({ submit: "Error al guardar la empresa" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (empresa: Empresa) => {
    if (!confirm(`¿Está seguro de inactivar la empresa "${empresa.nombre}"?`)) return;
    try {
      await empresaService.deleteEmpresa(empresa.idEmpresa);
      await loadData();
    } catch (error) {
      console.error("Error deleting:", error);
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
            Empresas
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Datos patronales de nómina (EmpresasNomina). El IdEmpresa es el del sistema principal.
          </p>
        </div>
        <Button onClick={() => openModal()}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Empresa
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  RFC
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Periodicidad
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Teléfono
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Correo
                </th>
                <th className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {empresas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay empresas registradas
                  </td>
                </tr>
              ) : (
                empresas.map((empresa) => (
                  <tr
                    key={empresa.idEmpresa}
                    className="hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-800 dark:text-white">
                        {empresa.nombre}
                      </div>
                      {empresa.representanteLegal && (
                        <div className="text-sm text-gray-500">
                          Rep. Legal: {empresa.representanteLegal}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {empresa.rfc}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {empresa.periodicidadNombre}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {empresa.telefono || "-"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      {empresa.correo || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(empresa)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(empresa)}
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
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        className={`${editingEmpresa || tab !== "datos" ? "max-w-4xl" : "max-w-2xl"} w-full p-6`}
      >
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          {editingEmpresa ? "Editar Empresa" : "Nueva Empresa"}
        </h2>

        <div className="mb-5 flex gap-1 border-b border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setTab("datos")}
              className={`px-4 py-2 text-sm font-medium ${
                tab === "datos"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
              }`}
            >
              Datos
            </button>
            <button
              type="button"
              onClick={() => setTab("asistencia")}
              className={`px-4 py-2 text-sm font-medium ${
                tab === "asistencia"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
              }`}
            >
              Asistencia
            </button>
            <button
              type="button"
              onClick={() => setTab("bono")}
              className={`px-4 py-2 text-sm font-medium ${
                tab === "bono"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-800 dark:hover:text-white"
              }`}
            >
              Bono Puntualidad
            </button>
          </div>

        {tab === "asistencia" ? (
          editingEmpresa ? (
            <PoliticaRetardoTab idEmpresa={editingEmpresa.idEmpresa} />
          ) : (
            <p className="text-sm text-gray-500">Guarda la empresa en Datos para configurar la asistencia.</p>
          )
        ) : tab === "bono" && editingEmpresa ? (
          <BonoPuntualidadTab idEmpresa={editingEmpresa.idEmpresa} />
        ) : tab === "bono" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Este bono se creará al guardar la empresa. Después podrás agregar más años.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="bonoAnioNuevo">Año</Label>
                <Input
                  id="bonoAnioNuevo"
                  type="number"
                  min="2000"
                  max="2100"
                  value={bonoInicial.anio}
                  onChange={(e) => setBonoInicial({ ...bonoInicial, anio: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="bonoMontoNuevo">Monto</Label>
                <Input
                  id="bonoMontoNuevo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bonoInicial.monto}
                  onChange={(e) => setBonoInicial({ ...bonoInicial, monto: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={bonoInicial.activo}
                    onChange={(e) => setBonoInicial({ ...bonoInicial, activo: e.target.checked })}
                  />
                  Activo
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => void handleSubmit({ preventDefault() {} } as React.FormEvent)}>
                {saving ? "Guardando..." : "Crear empresa"}
              </Button>
            </div>
            {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!editingEmpresa && (
              <div>
                <Label htmlFor="idEmpresa">Id empresa (CRM) *</Label>
                <Input
                  id="idEmpresa"
                  type="number"
                  min="1"
                  value={formData.idEmpresa ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      idEmpresa: Number(e.target.value) || undefined,
                    })
                  }
                  placeholder="Mismo IdEmpresa de Personas/Sucursal"
                />
                <p className="mt-1 text-xs text-gray-500">
                  No se genera un folio nuevo: debe coincidir con la empresa del sistema.
                </p>
              </div>
            )}
            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Nombre de la empresa"
              />
              {errors.nombre && (
                <p className="mt-1 text-sm text-red-500">{errors.nombre}</p>
              )}
            </div>

            <div>
              <Label htmlFor="rfc">RFC *</Label>
              <Input
                id="rfc"
                value={formData.rfc}
                onChange={(e) => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                placeholder="XAXX010101000"
                maxLength={13}
              />
              {errors.rfc && (
                <p className="mt-1 text-sm text-red-500">{errors.rfc}</p>
              )}
            </div>

            <div>
              <Label htmlFor="regimenFiscal">Régimen Fiscal SAT</Label>
              <Select
                options={satSelectOptions(satRegimenFiscal)}
                placeholder="Selecciona régimen"
                onChange={(val) => setFormData({ ...formData, regimenFiscal: val })}
                defaultValue={formData.regimenFiscal || "601"}
              />
            </div>

            <div>
              <Label htmlFor="registroPatronal">Registro Patronal</Label>
              <Input
                id="registroPatronal"
                value={formData.registroPatronal || ""}
                onChange={(e) => setFormData({ ...formData, registroPatronal: e.target.value })}
                placeholder="Registro patronal"
              />
            </div>

            <div>
              <Label htmlFor="representanteLegal">Representante Legal</Label>
              <Input
                id="representanteLegal"
                value={formData.representanteLegal || ""}
                onChange={(e) => setFormData({ ...formData, representanteLegal: e.target.value })}
                placeholder="Nombre del representante"
              />
            </div>

            <div>
              <Label htmlFor="periodicidad">Periodicidad de Pago *</Label>
              <Select
                options={periodicidades.map((p) => ({
                  value: p.idPeriodicidad.toString(),
                  label: p.nombre,
                }))}
                placeholder="Selecciona periodicidad"
                onChange={(val) =>
                  setFormData({ ...formData, idPeriodicidad: parseInt(val) })
                }
                defaultValue={formData.idPeriodicidad.toString()}
              />
              {errors.idPeriodicidad && (
                <p className="mt-1 text-sm text-red-500">{errors.idPeriodicidad}</p>
              )}
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono || ""}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="Teléfono"
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
              {errors.correo && (
                <p className="mt-1 text-sm text-red-500">{errors.correo}</p>
              )}
            </div>

            <div>
              <Label htmlFor="codigoPostal">Código postal (expedición)</Label>
              <Input
                id="codigoPostal"
                value={formData.codigoPostal || ""}
                onChange={(e) => setFormData({ ...formData, codigoPostal: e.target.value })}
                placeholder="29000"
                maxLength={5}
              />
            </div>

            <div>
              <Label htmlFor="razonSocial">Razón social</Label>
              <Input
                id="razonSocial"
                value={formData.razonSocial || ""}
                onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                placeholder="Igual al nombre si no aplica"
              />
            </div>

            <div className="col-span-2 pt-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Dispersión bancaria</p>
              <p className="text-xs text-gray-500">Cuenta de cargo del convenio. Se usa en el encabezado del archivo de nómina.</p>
            </div>
            <div>
              <Label htmlFor="claveBancoEmpresa">Banco (clave SAT)</Label>
              <Input
                id="claveBancoEmpresa"
                value={formData.claveBancoEmpresa || ""}
                onChange={(e) => setFormData({ ...formData, claveBancoEmpresa: e.target.value })}
                placeholder="012"
                maxLength={3}
              />
            </div>
            <div>
              <Label htmlFor="cuentaCargo">Cuenta cargo</Label>
              <Input
                id="cuentaCargo"
                value={formData.cuentaCargo || ""}
                onChange={(e) => setFormData({ ...formData, cuentaCargo: e.target.value })}
                placeholder="Cuenta origen"
              />
            </div>
            <div>
              <Label htmlFor="clabeEmpresa">CLABE empresa</Label>
              <Input
                id="clabeEmpresa"
                value={formData.clabeEmpresa || ""}
                onChange={(e) => setFormData({ ...formData, clabeEmpresa: e.target.value })}
                placeholder="18 dígitos"
                maxLength={18}
              />
            </div>
            <div>
              <Label htmlFor="convenioDispersion">Convenio / contrato nómina</Label>
              <Input
                id="convenioDispersion"
                value={formData.convenioDispersion || ""}
                onChange={(e) => setFormData({ ...formData, convenioDispersion: e.target.value })}
                placeholder="Número de convenio"
              />
            </div>
          </div>

          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : editingEmpresa ? "Actualizar" : "Crear"}
            </Button>
          </div>
        </form>
        )}
      </Modal>
    </div>
  );
}
