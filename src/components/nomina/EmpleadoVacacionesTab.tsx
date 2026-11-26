/* NOMCONEXIA-UNIFY */
import { useEffect, useState } from "react";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { empleadoService, EmpleadoVacacion, EmpleadoVacacionSave } from "../../services/empleadoService";

type Props = {
  idEmpleado: number | null;
  sueldoBase: number;
};

function toSave(row: EmpleadoVacacion): EmpleadoVacacionSave {
  return {
    anio: row.anio,
    diasLey: row.diasLey,
    diasAdicionales: row.diasAdicionales,
    diasTomados: row.diasTomados,
    diasAplicarNomina: row.diasAplicarNomina,
    primaPorcentaje: row.primaPorcentaje,
    pagarPrimaEnNomina: row.pagarPrimaEnNomina,
    primaAplicarNomina: row.primaAplicarNomina,
    primaPagadaAnio: row.primaPagadaAnio,
    observaciones: row.observaciones || "",
    activo: row.activo,
  };
}

export default function EmpleadoVacacionesTab({ idEmpleado, sueldoBase }: Props) {
  const [items, setItems] = useState<EmpleadoVacacion[]>([]);
  const [form, setForm] = useState<EmpleadoVacacionSave | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!idEmpleado) return;
    const data = await empleadoService.getVacaciones(idEmpleado);
    setItems(data);
    const current = data.find((v) => v.anio === new Date().getFullYear()) || data[0];
    setForm(current ? toSave(current) : null);
  };

  useEffect(() => {
    setError("");
    setForm(null);
    if (idEmpleado) load().catch(() => setError("No se pudo cargar el saldo de vacaciones"));
  }, [idEmpleado]);

  if (!idEmpleado) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Guarda el empleado primero para generar el saldo anual de vacaciones (LFT).
      </p>
    );
  }

  const generar = async () => {
    setSaving(true);
    setError("");
    try {
      const row = await empleadoService.generarVacacion(idEmpleado, new Date().getFullYear());
      await load();
      setForm(toSave(row));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al generar");
    } finally {
      setSaving(false);
    }
  };

  const calcularPrima = () => {
    if (!form) return;
    const dias = form.diasAplicarNomina > 0 ? form.diasAplicarNomina : form.diasLey;
    const pct = form.primaPorcentaje > 0 ? form.primaPorcentaje : 25;
    const prima = Math.round(((sueldoBase / 30) * dias * (pct / 100)) * 100) / 100;
    setForm({ ...form, primaAplicarNomina: prima, pagarPrimaEnNomina: true });
  };

  const handleSubmit = async () => {
    if (!form) return;
    setSaving(true);
    setError("");
    try {
      await empleadoService.saveVacacion(idEmpleado, form);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const current = items.find((v) => v.anio === form?.anio);

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Saldo anual según LFT (art. 76 y 80, prima mínima 25%). Los días y la prima de{" "}
        <strong>próxima nómina</strong> se aplican cada vez que calcules, hasta que los dejes en 0.
        Después de timbrar, pon días/prima en 0 y registra los tomados. El reloj checador se conectará después.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={generar} disabled={saving}>
          Generar saldo {new Date().getFullYear()}
        </Button>
        {items.length > 1 && form && (
          <select
            className="h-11 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900"
            value={form.anio}
            onChange={(e) => {
              const row = items.find((v) => v.anio === Number(e.target.value));
              if (row) setForm(toSave(row));
            }}
          >
            {items.map((v) => (
              <option key={v.anio} value={v.anio}>
                {v.anio}
              </option>
            ))}
          </select>
        )}
      </div>

      {current && (
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800/60 sm:grid-cols-5">
          <div>
            <p className="text-gray-500">Antigüedad</p>
            <p className="font-medium">{current.aniosAntiguedad} años</p>
          </div>
          <div>
            <p className="text-gray-500">Días de ley</p>
            <p className="font-medium">{current.diasLey}</p>
          </div>
          <div>
            <p className="text-gray-500">Tomados</p>
            <p className="font-medium">{current.diasTomados}</p>
          </div>
          <div>
            <p className="text-gray-500">Pendientes</p>
            <p className="font-medium">{current.diasPendientes}</p>
          </div>
          <div>
            <p className="text-gray-500">Prima pagada año</p>
            <p className="font-medium">
              {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(
                current.primaPagadaAnio || 0
              )}
            </p>
          </div>
        </div>
      )}

      {!form ? (
        <p className="text-sm text-gray-500">Genera el saldo del año para configurar días y prima.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label>Año</Label>
            <Input type="number" value={form.anio} disabled />
          </div>
          <div>
            <Label>Días de ley</Label>
            <Input
              type="number"
              value={form.diasLey}
              onChange={(e) => setForm({ ...form, diasLey: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Días adicionales</Label>
            <Input
              type="number"
              value={form.diasAdicionales}
              onChange={(e) => setForm({ ...form, diasAdicionales: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Días tomados</Label>
            <Input
              type="number"
              value={form.diasTomados}
              onChange={(e) => setForm({ ...form, diasTomados: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Días a aplicar en nómina</Label>
            <Input
              type="number"
              value={form.diasAplicarNomina}
              onChange={(e) => setForm({ ...form, diasAplicarNomina: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Prima %</Label>
            <Input
              type="number"
              step={0.01}
              value={form.primaPorcentaje}
              onChange={(e) => setForm({ ...form, primaPorcentaje: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Prima a pagar ($)</Label>
            <Input
              type="number"
              step={0.01}
              value={form.primaAplicarNomina}
              onChange={(e) => setForm({ ...form, primaAplicarNomina: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" variant="outline" onClick={calcularPrima}>
              Calcular prima 25%
            </Button>
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.pagarPrimaEnNomina}
              onChange={(e) => setForm({ ...form, pagarPrimaEnNomina: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Pagar prima en el próximo cálculo (si el importe es 0 se calcula sola)
            </span>
          </label>
          <div className="sm:col-span-3">
            <Label>Observaciones</Label>
            <Input
              value={form.observaciones || ""}
              onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
            />
          </div>
          {error && <p className="sm:col-span-3 text-sm text-red-500">{error}</p>}
          <div className="sm:col-span-3">
            <Button type="button" disabled={saving} onClick={handleSubmit}>
              {saving ? "Guardando..." : "Guardar vacaciones"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
