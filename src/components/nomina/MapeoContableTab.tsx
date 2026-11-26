/* NOMCONEXIA-UNIFY */
import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { fiscalCatalogoService, MapeoContable } from "../../services/fiscalCatalogoService";
import { Empresa } from "../../services/empresaService";

type Props = {
  empresas: Empresa[];
};

const CAMPOS = [
  "SUELDO",
  "ASISTENCIA",
  "PUNTUALIDAD",
  "VACACIONES",
  "PRIMA_VACACIONAL",
  "DIA_FESTIVO",
  "SUB_INCAPACIDAD",
  "AGUINALDO",
  "PRIMA_ANTIGUEDAD",
  "INDEMNIZACION",
  "PTU",
  "HORAS_EXTRA",
  "ISR",
  "IMSS",
  "INFONAVIT",
  "FONACOT",
  "PENSION",
  "AHORRO",
  "PRESTAMO",
  "FACTURAS",
  "BANCO",
  "OTROS_INGRESOS",
];

const emptyForm = (idEmpresa: number | null): Partial<MapeoContable> => ({
  idEmpresa,
  claveConcepto: "SUELDO",
  descripcion: "",
  cuentaMayor: "",
  nombreCuenta: "",
  naturaleza: "D",
  campoNomina: "SUELDO",
  orden: 10,
  activo: true,
});

export default function MapeoContableTab({ empresas }: Props) {
  const [idEmpresa, setIdEmpresa] = useState<number | "">("");
  const [rows, setRows] = useState<MapeoContable[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<MapeoContable | null>(null);
  const [form, setForm] = useState<Partial<MapeoContable>>(emptyForm(null));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fiscalCatalogoService.getMapeo(idEmpresa ? Number(idEmpresa) : undefined);
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [idEmpresa]);

  const openModal = (row?: MapeoContable) => {
    if (row) {
      setEditing(row);
      setForm(row);
    } else {
      setEditing(null);
      setForm(emptyForm(idEmpresa ? Number(idEmpresa) : null));
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        idEmpresa: form.idEmpresa || null,
        campoNomina: form.campoNomina || form.claveConcepto,
      };
      if (editing) await fiscalCatalogoService.updateMapeo({ ...editing, ...payload } as MapeoContable);
      else await fiscalCatalogoService.createMapeo(payload);
      setIsModalOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: MapeoContable) => {
    if (!confirm(`¿Quitar ${row.claveConcepto} → ${row.cuentaMayor}?`)) return;
    await fiscalCatalogoService.deleteMapeo(row.idMapeo);
    await load();
  };

  const handleSembrar = async () => {
    if (!idEmpresa) {
      setMessage("Elige una empresa para copiarle la plantilla.");
      return;
    }
    setMessage(null);
    try {
      const msg = await fiscalCatalogoService.sembrarMapeo(Number(idEmpresa));
      setMessage(msg);
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo sembrar");
    }
  };

  const esPlantilla = rows.some((r) => r.idEmpresa == null) && !rows.some((r) => r.idEmpresa != null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Cuentas de mayor del archivo de póliza SAP (layout Codialub). El centro de costo sale del
        departamento del empleado (ej. DEP00002) y la sucursal del campo Sucursal SAP en Empleados
        (ej. SUC00001). La plantilla se puede copiar a cada empresa para cambiar cuentas sin tocar las demás.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Empresa</Label>
          <Select
            key={String(idEmpresa)}
            options={[
              { value: "", label: "Plantilla global" },
              ...empresas.map((e) => ({ value: String(e.idEmpresa), label: e.nombre })),
            ]}
            onChange={(val) => setIdEmpresa(val ? Number(val) : "")}
            defaultValue={idEmpresa === "" ? "" : String(idEmpresa)}
            className="w-64"
          />
        </div>
        <Button variant="outline" onClick={handleSembrar} disabled={!idEmpresa}>
          Copiar plantilla a empresa
        </Button>
        <Button onClick={() => openModal()}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Nueva cuenta
        </Button>
      </div>

      {esPlantilla && idEmpresa && (
        <p className="text-sm text-amber-700 dark:text-amber-300">
          Esta empresa aún no tiene cuentas propias; se muestra la plantilla. Pulsa Copiar plantilla para
          poder editarlas sin afectar a otras empresas.
        </p>
      )}
      {message && <p className="text-sm text-amber-700 dark:text-amber-300">{message}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Concepto</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Cuenta</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Nombre</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Nat.</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Campo</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No hay mapeo. Reinicia la API para sembrar la plantilla Codialub.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.idMapeo}>
                    <td className="px-4 py-3 font-mono text-sm text-gray-800 dark:text-white">
                      {row.claveConcepto}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-800 dark:text-white">
                      {row.cuentaMayor}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{row.nombreCuenta}</td>
                    <td className="px-4 py-3">{row.naturaleza === "D" ? "Débito" : "Crédito"}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{row.campoNomina}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModal(row)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(row)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-lg w-full p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          {editing ? "Editar cuenta" : "Nueva cuenta"}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <Label>Clave concepto</Label>
            <Select
              key={form.claveConcepto}
              options={CAMPOS.map((c) => ({ value: c, label: c }))}
              onChange={(val) => setForm({ ...form, claveConcepto: val, campoNomina: val })}
              defaultValue={form.claveConcepto || "SUELDO"}
            />
          </div>
          <div>
            <Label>Descripción</Label>
            <Input
              value={form.descripcion || ""}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Sueldos y salarios"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cuenta de mayor</Label>
              <Input
                value={form.cuentaMayor || ""}
                onChange={(e) => setForm({ ...form, cuentaMayor: e.target.value })}
                placeholder="6101-0100"
              />
            </div>
            <div>
              <Label>Naturaleza</Label>
              <Select
                key={form.naturaleza}
                options={[
                  { value: "D", label: "Débito (gasto / activo)" },
                  { value: "C", label: "Crédito (pasivo / banco)" },
                ]}
                onChange={(val) => setForm({ ...form, naturaleza: val })}
                defaultValue={form.naturaleza || "D"}
              />
            </div>
          </div>
          <div>
            <Label>Nombre de cuenta (SAP)</Label>
            <Input
              value={form.nombreCuenta || ""}
              onChange={(e) => setForm({ ...form, nombreCuenta: e.target.value })}
              placeholder="SUELDOS Y SALARIOS"
            />
          </div>
          <div>
            <Label>Orden</Label>
            <Input
              type="number"
              value={form.orden ?? 0}
              onChange={(e) => setForm({ ...form, orden: Number(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
