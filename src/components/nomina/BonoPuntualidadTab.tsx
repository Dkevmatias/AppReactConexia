/* NOMCONEXIA-UNIFY */
import { useEffect, useState } from "react";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { PlusIcon, PencilIcon } from "../../icons";
import { nominaBonoService, NominaBono } from "../../services/nominaBonoService";

type Props = {
  idEmpresa: number;
};

type FormBono = {
  idBono?: number;
  anio: string;
  monto: string;
  activo: boolean;
};

const anioActual = () => new Date().getFullYear();

const emptyForm = (): FormBono => ({
  anio: String(anioActual()),
  monto: "",
  activo: true,
});

function money(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);
}

export default function BonoPuntualidadTab({ idEmpresa }: Props) {
  const [bonos, setBonos] = useState<NominaBono[]>([]);
  const [form, setForm] = useState<FormBono | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    const rows = await nominaBonoService.getByEmpresa(idEmpresa);
    setBonos(rows.sort((a, b) => b.anio - a.anio));
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    setNotice("");
    setForm(null);
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar los bonos"))
      .finally(() => setLoading(false));
  }, [idEmpresa]);

  const guardar = async () => {
    if (!form) return;
    const anio = Number(form.anio);
    const monto = Number(form.monto);
    if (!anio || anio < 2000 || anio > 2100) {
      setError("Captura un año válido.");
      return;
    }
    if (Number.isNaN(monto) || monto < 0) {
      setError("Captura el monto del bono.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (form.idBono) {
        await nominaBonoService.update({
          idBono: form.idBono,
          idEmpresa,
          anio,
          monto,
          activo: form.activo,
        });
        setNotice("Bono actualizado.");
      } else {
        await nominaBonoService.create({
          idEmpresa,
          anio,
          monto,
          activo: form.activo,
        });
        setNotice("Bono de puntualidad guardado.");
      }
      setForm(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar el bono");
    } finally {
      setSaving(false);
    }
  };

  const editar = (row: NominaBono) => {
    setForm({
      idBono: row.idBono,
      anio: String(row.anio),
      monto: String(row.monto),
      activo: row.activo,
    });
    setError("");
    setNotice("");
  };

  const cambiarActivo = async (row: NominaBono, activo: boolean) => {
    setSaving(true);
    setError("");
    try {
      await nominaBonoService.update({
        idBono: row.idBono,
        idEmpresa: row.idEmpresa || idEmpresa,
        anio: row.anio,
        monto: row.monto,
        activo,
      });
      await load();
      setNotice(activo ? `Bono ${row.anio} activado.` : `Bono ${row.anio} inactivado.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cambiar el estatus");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando bono de puntualidad…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Bono de puntualidad</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Un monto por año. El reporte del checador toma el bono activo del año de la quincena.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => setForm(emptyForm())}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Agregar año
        </Button>
      </div>

      {form && (
        <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <Label htmlFor="bonoAnio">Año</Label>
              <Input
                id="bonoAnio"
                type="number"
                min="2000"
                max="2100"
                value={form.anio}
                onChange={(e) => setForm({ ...form, anio: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bonoMonto">Monto</Label>
              <Input
                id="bonoMonto"
                type="number"
                min="0"
                step="0.01"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                Activo
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={guardar} disabled={saving}>
              {form.idBono ? "Actualizar bono" : "Guardar bono"}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
              <th className="px-3 py-2 font-medium">Año</th>
              <th className="px-3 py-2 font-medium">Monto</th>
              <th className="px-3 py-2 font-medium">Estatus</th>
              <th className="px-3 py-2 text-right font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {bonos.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-gray-500">
                  Sin bonos. Agrega el monto y el año para esta empresa.
                </td>
              </tr>
            ) : (
              bonos.map((row) => (
                <tr key={row.idBono} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-2 text-gray-800 dark:text-white">{row.anio}</td>
                  <td className="px-3 py-2">{money(row.monto)}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        row.activo
                          ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                          : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {row.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="p-1.5 text-blue-600" onClick={() => editar(row)} title="Editar">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="text-xs text-gray-600 hover:underline dark:text-gray-300"
                        disabled={saving}
                        onClick={() => cambiarActivo(row, !row.activo)}
                      >
                        {row.activo ? "Inactivar" : "Activar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
      {notice && <p className="text-sm text-green-600 dark:text-green-400">{notice}</p>}
    </div>
  );
}
