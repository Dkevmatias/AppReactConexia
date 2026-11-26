/* NOMCONEXIA-UNIFY */
import { useEffect, useState, type FormEvent } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { fiscalCatalogoService, CuotaImss } from "../../services/fiscalCatalogoService";

const emptyForm = (): Partial<CuotaImss> => ({
  anio: new Date().getFullYear(),
  tipo: "OBRERO",
  concepto: "",
  ramo: "",
  tipoCalculo: "PORCENTAJE",
  porcentaje: 0,
  cuotaFija: 0,
  umaDesde: 0,
  topeUma: 25,
  smdf: 278.8,
  factorIntegracion: 1.0452,
  activo: true,
});

const pctToUi = (fraccion: number) => Number((fraccion * 100).toFixed(4));
const uiToPct = (pct: number) => Number((pct / 100).toFixed(6));

export default function CuotasImssTab() {
  const [anio, setAnio] = useState(new Date().getFullYear());
  const [tipo, setTipo] = useState("OBRERO");
  const [anios, setAnios] = useState<number[]>([]);
  const [rows, setRows] = useState<CuotaImss[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<CuotaImss | null>(null);
  const [form, setForm] = useState<Partial<CuotaImss>>(emptyForm());
  const [pctUi, setPctUi] = useState("0");
  const [anioDestino, setAnioDestino] = useState(new Date().getFullYear() + 1);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [list, years] = await Promise.all([
        fiscalCatalogoService.getCuotas(anio, tipo),
        fiscalCatalogoService.getAniosCuotas(),
      ]);
      setRows(list);
      const uniq = Array.from(new Set([anio, ...years])).sort((a, b) => b - a);
      setAnios(uniq);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [anio, tipo]);

  const openModal = (row?: CuotaImss) => {
    if (row) {
      setEditing(row);
      setForm(row);
      setPctUi(String(pctToUi(row.porcentaje)));
    } else {
      setEditing(null);
      const blank = { ...emptyForm(), anio, tipo };
      setForm(blank);
      setPctUi("0");
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const payload = {
        ...form,
        anio: Number(form.anio),
        porcentaje: uiToPct(Number(pctUi) || 0),
        ramo: form.ramo || form.concepto,
      };
      if (editing) await fiscalCatalogoService.updateCuota({ ...editing, ...payload } as CuotaImss);
      else await fiscalCatalogoService.createCuota(payload);
      setIsModalOpen(false);
      await load();
    } catch {
      setMessage("No se pudo guardar el ramo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: CuotaImss) => {
    if (!confirm(`¿Inactivar "${row.concepto}" de ${row.anio}?`)) return;
    await fiscalCatalogoService.deleteCuota(row.idCuota);
    await load();
  };

  const handleCopiar = async () => {
    if (!confirm(`¿Copiar ramos de ${anio} a ${anioDestino}? El destino debe estar vacío.`)) return;
    setMessage(null);
    try {
      const msg = await fiscalCatalogoService.copiarAnio(anio, Number(anioDestino));
      setMessage(msg);
      setAnio(Number(anioDestino));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "No se pudo copiar");
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Catálogo fiscal por año, igual que la tabla ISR. El cálculo de nómina usa los ramos{" "}
        <strong>OBRERO</strong> del año de la nómina. Cambia a EXCEDENTE_UMA (ej. EM dinero desde 3 UMA)
        o FIJA_UMA cuando el SUA lo requiera. Las tasas PATRON son punto de partida: confírmalas con el
        dictamen / IMSS del ejercicio.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label>Año</Label>
          <Select
            key={`anio-${anio}-${anios.join(",")}`}
            options={anios.map((y) => ({ value: String(y), label: String(y) }))}
            onChange={(val) => setAnio(Number(val))}
            defaultValue={String(anio)}
            className="w-28"
          />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select
            key={tipo}
            options={[
              { value: "OBRERO", label: "Obrero (retención)" },
              { value: "PATRON", label: "Patrón (cuota patronal)" },
            ]}
            onChange={setTipo}
            defaultValue={tipo}
            className="w-56"
          />
        </div>
        <div>
          <Label>Copiar a año</Label>
          <Input
            type="number"
            value={anioDestino}
            onChange={(e) => setAnioDestino(Number(e.target.value))}
            className="w-28"
          />
        </div>
        <Button variant="outline" onClick={handleCopiar}>
          Copiar año
        </Button>
        <Button onClick={() => openModal()}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Nuevo ramo
        </Button>
      </div>

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
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Ramo</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Concepto</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500">Cálculo</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 text-right">%</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 text-right">Desde UMA</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 text-right">Tope UMA</th>
                <th className="px-4 py-3 text-sm font-medium text-gray-500 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No hay ramos para {anio} / {tipo}. Copia de otro año o crea uno.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.idCuota} className={!row.activo ? "opacity-50" : ""}>
                    <td className="px-4 py-3 font-mono text-sm text-gray-800 dark:text-white">
                      {row.ramo || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-white">{row.concepto}</td>
                    <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">{row.tipoCalculo}</td>
                    <td className="px-4 py-3 text-right text-gray-800 dark:text-white">
                      {pctToUi(row.porcentaje).toFixed(4)}%
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600">{row.umaDesde}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{row.topeUma}</td>
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
          {editing ? "Editar ramo IMSS" : "Nuevo ramo IMSS"}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Año</Label>
              <Input type="number" value={form.anio ?? ""} onChange={(e) => setForm({ ...form, anio: Number(e.target.value) })} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                key={form.tipo}
                options={[
                  { value: "OBRERO", label: "Obrero" },
                  { value: "PATRON", label: "Patrón" },
                ]}
                onChange={(val) => setForm({ ...form, tipo: val })}
                defaultValue={form.tipo || "OBRERO"}
              />
            </div>
          </div>
          <div>
            <Label>Concepto</Label>
            <Input
              value={form.concepto || ""}
              onChange={(e) => setForm({ ...form, concepto: e.target.value })}
              placeholder="Cesantía y vejez"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Clave ramo</Label>
              <Input
                value={form.ramo || ""}
                onChange={(e) => setForm({ ...form, ramo: e.target.value })}
                placeholder="CYV"
              />
            </div>
            <div>
              <Label>Tipo de cálculo</Label>
              <Select
                key={form.tipoCalculo}
                options={[
                  { value: "PORCENTAJE", label: "Porcentaje sobre SBC" },
                  { value: "EXCEDENTE_UMA", label: "Excedente sobre n × UMA" },
                  { value: "FIJA_UMA", label: "Cuota fija sobre UMA" },
                ]}
                onChange={(val) => setForm({ ...form, tipoCalculo: val })}
                defaultValue={form.tipoCalculo || "PORCENTAJE"}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>% (ej. 0.40 = 0.40%)</Label>
              <Input type="number" step={0.0001} value={pctUi} onChange={(e) => setPctUi(e.target.value)} />
            </div>
            <div>
              <Label>Cuota fija (si aplica)</Label>
              <Input
                type="number"
                step={0.0001}
                value={form.cuotaFija ?? 0}
                onChange={(e) => setForm({ ...form, cuotaFija: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>UMA desde (excedente)</Label>
              <Input
                type="number"
                step={0.01}
                value={form.umaDesde ?? 0}
                onChange={(e) => setForm({ ...form, umaDesde: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Tope UMA</Label>
              <Input
                type="number"
                step={0.01}
                value={form.topeUma ?? 25}
                onChange={(e) => setForm({ ...form, topeUma: Number(e.target.value) })}
              />
            </div>
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
