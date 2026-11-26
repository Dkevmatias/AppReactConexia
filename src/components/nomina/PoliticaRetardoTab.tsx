/* NOMCONEXIA-UNIFY */
import { useEffect, useMemo, useState } from "react";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { PlusIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { empleadoService, Empleado } from "../../services/empleadoService";
import {
  PoliticaRetardo,
  PoliticaRetardoSave,
  fechaToInput,
  horaToApi,
  horaToInput,
  politicaRetardoService,
} from "../../services/politicaRetardoService";

type Props = {
  idEmpresa: number;
};

type ExcepcionForm = {
  idPolitica?: number;
  idEmpleado: string;
  horaEntrada: string;
  toleranciaMinutos: string;
  minutosFalta: string;
  fechaInicio: string;
  fechaFin: string;
  motivo: string;
  activo: boolean;
};

const emptyExcepcion = (horaEntrada: string, tolerancia: number, minutosFalta: number): ExcepcionForm => ({
  idEmpleado: "",
  horaEntrada,
  toleranciaMinutos: String(tolerancia),
  minutosFalta: String(minutosFalta),
  fechaInicio: "",
  fechaFin: "",
  motivo: "",
  activo: true,
});

function limiteRetardo(hora: string, tolerancia: number) {
  const [h, m] = horaToInput(hora).split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + (tolerancia || 0);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function PoliticaRetardoTab({ idEmpresa }: Props) {
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empresa, setEmpresa] = useState<PoliticaRetardo | null>(null);
  const [excepciones, setExcepciones] = useState<PoliticaRetardo[]>([]);
  const [horaEntrada, setHoraEntrada] = useState("08:30");
  const [tolerancia, setTolerancia] = useState("10");
  const [minutosFalta, setMinutosFalta] = useState("60");
  const [form, setForm] = useState<ExcepcionForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = async () => {
    const [pack, emps] = await Promise.all([
      politicaRetardoService.getByEmpresa(idEmpresa),
      empleadoService.getEmpleados(idEmpresa),
    ]);
    setEmpresa(pack.empresa);
    setExcepciones(pack.excepciones);
    setHoraEntrada(horaToInput(pack.empresa.horaEntrada));
    setTolerancia(String(pack.empresa.toleranciaMinutos));
    setMinutosFalta(String(pack.empresa.minutosFalta));
    setEmpleados((Array.isArray(emps) ? emps : []).filter((e) => e.activo !== false));
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    setNotice("");
    setForm(null);
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar la política de retardo"))
      .finally(() => setLoading(false));
  }, [idEmpresa]);

  const limite = useMemo(
    () => limiteRetardo(horaEntrada, Number(tolerancia) || 0),
    [horaEntrada, tolerancia]
  );

  const toSave = (hora: string, tol: string, falta: string, extra?: Partial<PoliticaRetardoSave>): PoliticaRetardoSave => ({
    horaEntrada: horaToApi(hora),
    toleranciaMinutos: Number(tol) || 0,
    minutosFalta: Number(falta) || 60,
    activo: true,
    ...extra,
  });

  const guardarEmpresa = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const row = await politicaRetardoService.saveEmpresa(
        idEmpresa,
        toSave(horaEntrada, tolerancia, minutosFalta, { motivo: empresa?.motivo })
      );
      setEmpresa(row);
      setNotice(`Política de empresa guardada. Retardo después de las ${limite}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const guardarExcepcion = async () => {
    if (!form?.idEmpleado) {
      setError("Selecciona el empleado de la excepción");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await politicaRetardoService.saveExcepcion(
        idEmpresa,
        toSave(form.horaEntrada, form.toleranciaMinutos, form.minutosFalta, {
          idEmpleado: Number(form.idEmpleado),
          fechaInicio: form.fechaInicio || null,
          fechaFin: form.fechaFin || null,
          motivo: form.motivo || null,
          activo: form.activo,
        }),
        form.idPolitica
      );
      setForm(null);
      await load();
      setNotice("Excepción de empleado guardada.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar la excepción");
    } finally {
      setSaving(false);
    }
  };

  const editar = (row: PoliticaRetardo) => {
    setForm({
      idPolitica: row.idPolitica,
      idEmpleado: String(row.idEmpleado || ""),
      horaEntrada: horaToInput(row.horaEntrada),
      toleranciaMinutos: String(row.toleranciaMinutos),
      minutosFalta: String(row.minutosFalta),
      fechaInicio: fechaToInput(row.fechaInicio),
      fechaFin: fechaToInput(row.fechaFin),
      motivo: row.motivo || "",
      activo: row.activo,
    });
  };

  const eliminar = async (row: PoliticaRetardo) => {
    if (!confirm(`¿Eliminar la tolerancia especial de ${row.empleadoNombre || "este empleado"}?`)) return;
    setSaving(true);
    setError("");
    try {
      await politicaRetardoService.deleteExcepcion(idEmpresa, row.idPolitica);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo eliminar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando política de asistencia…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Política de la empresa</h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Entrada {horaToInput(horaEntrada)}. Con {Number(tolerancia) || 0} min de tolerancia, el retardo inicia a
          las <strong>{limite}</strong>. Si el atraso llega a {Number(minutosFalta) || 60} min se puede tratar como
          falta. Aplica al importar el checador (ReporteAjustes).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div>
          <Label htmlFor="horaEntrada">Hora de entrada</Label>
          <Input
            id="horaEntrada"
            type="time"
            value={horaEntrada}
            onChange={(e) => setHoraEntrada(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="tolerancia">Tolerancia (minutos)</Label>
          <Input
            id="tolerancia"
            type="number"
            min="0"
            max="240"
            value={tolerancia}
            onChange={(e) => setTolerancia(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="minutosFalta">Minutos para falta</Label>
          <Input
            id="minutosFalta"
            type="number"
            min="0"
            max="480"
            value={minutosFalta}
            onChange={(e) => setMinutosFalta(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={guardarEmpresa} disabled={saving}>
          {saving ? "Guardando..." : "Guardar política"}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Excepciones por empleado</h3>
          <p className="mt-1 text-xs text-gray-500">
            Para casos extraordinarios: más tolerancia, otro horario o vigencia temporal.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setForm(emptyExcepcion(horaEntrada, Number(tolerancia) || 10, Number(minutosFalta) || 60))
          }
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Agregar
        </Button>
      </div>

      {form && (
        <div className="space-y-3 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Empleado</Label>
              <Select
                options={empleados.map((e) => ({
                  value: String(e.idEmpleado),
                  label: `${e.fullName}${e.numeroEmpleado ? ` · ${e.numeroEmpleado}` : ""}`,
                }))}
                placeholder="Selecciona empleado"
                value={form.idEmpleado}
                onChange={(val) => setForm({ ...form, idEmpleado: val })}
              />
            </div>
            <div>
              <Label>Hora de entrada</Label>
              <Input
                type="time"
                value={form.horaEntrada}
                onChange={(e) => setForm({ ...form, horaEntrada: e.target.value })}
              />
            </div>
            <div>
              <Label>Tolerancia (min)</Label>
              <Input
                type="number"
                min="0"
                value={form.toleranciaMinutos}
                onChange={(e) => setForm({ ...form, toleranciaMinutos: e.target.value })}
              />
            </div>
            <div>
              <Label>Vigencia desde</Label>
              <Input
                type="date"
                value={form.fechaInicio}
                onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
              />
            </div>
            <div>
              <Label>Vigencia hasta</Label>
              <Input
                type="date"
                value={form.fechaFin}
                onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
              />
            </div>
            <div className="md:col-span-2">
              <Label>Motivo</Label>
              <Input
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                placeholder="Ej. cita médica, horario especial de sucursal"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Activa
          </label>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setForm(null)}>
              Cancelar
            </Button>
            <Button type="button" onClick={guardarExcepcion} disabled={saving}>
              {form.idPolitica ? "Actualizar excepción" : "Guardar excepción"}
            </Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-700">
              <th className="px-3 py-2 font-medium">Empleado</th>
              <th className="px-3 py-2 font-medium">Entrada</th>
              <th className="px-3 py-2 font-medium">Tolerancia</th>
              <th className="px-3 py-2 font-medium">Límite</th>
              <th className="px-3 py-2 font-medium">Vigencia</th>
              <th className="px-3 py-2 font-medium">Motivo</th>
              <th className="px-3 py-2 text-right font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {excepciones.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  Sin excepciones. Todos usan la política de la empresa.
                </td>
              </tr>
            ) : (
              excepciones.map((row) => (
                <tr key={row.idPolitica} className="border-b border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-2 text-gray-800 dark:text-white">
                    {row.empleadoNombre || row.idEmpleado}
                    {!row.activo && <span className="ml-2 text-xs text-gray-400">(inactiva)</span>}
                  </td>
                  <td className="px-3 py-2">{horaToInput(row.horaEntrada)}</td>
                  <td className="px-3 py-2">{row.toleranciaMinutos} min</td>
                  <td className="px-3 py-2">{row.horaLimiteRetardo || limiteRetardo(row.horaEntrada, row.toleranciaMinutos)}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {row.fechaInicio || row.fechaFin
                      ? `${fechaToInput(row.fechaInicio) || "…"} → ${fechaToInput(row.fechaFin) || "…"}`
                      : "Indefinida"}
                  </td>
                  <td className="px-3 py-2 text-gray-500">{row.motivo || "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end gap-1">
                      <button type="button" className="p-1.5 text-blue-600" onClick={() => editar(row)} title="Editar">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button type="button" className="p-1.5 text-red-600" onClick={() => eliminar(row)} title="Eliminar">
                        <TrashBinIcon className="h-4 w-4" />
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
