/* NOMCONEXIA-UNIFY */
import { useEffect, useState } from "react";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import {
  empleadoService,
  EmpleadoPrestamo,
  EmpleadoPrestamoSave,
} from "../../services/empleadoService";
import { CatalogoSatItem } from "../../services/nominaSatCatalogoService";

const TIPOS = [
  { value: "INFONAVIT", label: "INFONAVIT (SAT 010)" },
  { value: "FONACOT", label: "FONACOT (SAT 011)" },
  { value: "PERSONAL", label: "Préstamo personal" },
  { value: "EMPRESA", label: "Préstamo empresa" },
];

function emptyForm(tipo = "INFONAVIT"): EmpleadoPrestamoSave {
  return {
    tipoPrestamo: tipo,
    claveTipoDeduccionSat: tipo === "FONACOT" ? "011" : tipo === "INFONAVIT" ? "010" : "004",
    numeroCredito: "",
    claveTipoDescuento: tipo === "INFONAVIT" ? "2" : "",
    valorDescuento: 0,
    salarioMinimoReferencia: 278.8,
    importeOriginal: 0,
    importeRestante: 0,
    numeroPagos: 0,
    pagosRestantes: 0,
    pagoQuincenal: 0,
    tasaInteres: 0,
    plazoMeses: null,
    topeDescuento: null,
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: null,
    fechaAvisoRetencion: null,
    institucion: tipo === "INFONAVIT" || tipo === "FONACOT" ? tipo : "",
    activo: true,
    observaciones: "",
  };
}

function parseMoney(value: string): number {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : 0;
}

function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  return String(value).slice(0, 10);
}

type Props = {
  idEmpleado: number | null;
  tiposDescuento: CatalogoSatItem[];
};

export default function EmpleadoCreditosTab({ idEmpleado, tiposDescuento }: Props) {
  const [items, setItems] = useState<EmpleadoPrestamo[]>([]);
  const [form, setForm] = useState<EmpleadoPrestamoSave>(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!idEmpleado) return;
    const data = await empleadoService.getPrestamos(idEmpleado);
    setItems(data);
  };

  useEffect(() => {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    if (idEmpleado) load().catch(() => setError("No se pudieron cargar los créditos"));
  }, [idEmpleado]);

  if (!idEmpleado) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Guarda el empleado primero para capturar Infonavit, Fonacot u otros créditos.
      </p>
    );
  }

  const isInfonavit = form.tipoPrestamo === "INFONAVIT";
  const isFonacot = form.tipoPrestamo === "FONACOT";

  const startEdit = (row: EmpleadoPrestamo) => {
    setEditingId(row.idPrestamo);
    setForm({
      tipoPrestamo: row.tipoPrestamo,
      claveTipoDeduccionSat: row.claveTipoDeduccionSat || "",
      numeroCredito: row.numeroCredito || "",
      claveTipoDescuento: row.claveTipoDescuento || "",
      valorDescuento: row.valorDescuento,
      salarioMinimoReferencia: row.salarioMinimoReferencia,
      importeOriginal: row.importeOriginal,
      importeRestante: row.importeRestante,
      numeroPagos: row.numeroPagos,
      pagosRestantes: row.pagosRestantes,
      pagoQuincenal: row.pagoQuincenal,
      tasaInteres: row.tasaInteres,
      plazoMeses: row.plazoMeses,
      topeDescuento: row.topeDescuento,
      fechaInicio: toDateInput(row.fechaInicio),
      fechaFin: toDateInput(row.fechaFin) || null,
      fechaAvisoRetencion: toDateInput(row.fechaAvisoRetencion) || null,
      institucion: row.institucion || "",
      activo: row.activo,
      observaciones: row.observaciones || "",
    });
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSaving(true);
    setError("");
    try {
      const pago = Number(form.pagoQuincenal) || 0;
      const original = Number(form.importeOriginal) || 0;
      const restante = Number(form.importeRestante) || 0;
      const valorDesc = Number(form.valorDescuento) || 0;
      const payload: EmpleadoPrestamoSave = {
        ...form,
        pagoQuincenal:
          pago > 0 ? pago : form.claveTipoDescuento === "2" && valorDesc > 0 ? valorDesc : 0,
        importeOriginal: original > 0 ? original : restante,
        importeRestante: restante > 0 ? restante : original,
        valorDescuento: valorDesc,
        fechaInicio: form.fechaInicio || new Date().toISOString().split("T")[0],
        fechaFin: form.fechaFin || null,
        fechaAvisoRetencion: form.fechaAvisoRetencion || null,
      };
      if (payload.pagoQuincenal <= 0) {
        setError("Indica el pago por periodo (o el valor de descuento en cuota fija).");
        setSaving(false);
        return;
      }
      await empleadoService.savePrestamo(idEmpleado, payload, editingId ?? undefined);
      setEditingId(null);
      setForm(emptyForm());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (idPrestamo: number) => {
    if (!confirm("¿Inactivar este crédito? Dejará de aplicarse en el cálculo.")) return;
    await empleadoService.deletePrestamo(idEmpleado, idPrestamo);
    await load();
  };

  const money = (n: number) =>
    new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        El aviso de retención Infonavit (porcentaje, cuota o VSM) sirve para calcular. El CFDI
        lleva SAT <strong>010</strong> vivienda y <strong>011</strong> FONACOT con el importe del
        periodo. Fonacot se topeará al 20% del sueldo del periodo (LFT).
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/60">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Tipo</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Crédito</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Pago periodo</th>
              <th className="px-3 py-2 text-right font-medium text-gray-500">Saldo</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500">Estatus</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                  Sin créditos capturados
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.idPrestamo} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-3 py-2">{row.tipoPrestamo}</td>
                  <td className="px-3 py-2">{row.numeroCredito || "—"}</td>
                  <td className="px-3 py-2 text-right">{money(row.pagoQuincenal)}</td>
                  <td className="px-3 py-2 text-right">{money(row.importeRestante)}</td>
                  <td className="px-3 py-2">{row.activo ? "Activo" : "Inactivo"}</td>
                  <td className="px-3 py-2 text-right">
                    <button type="button" className="mr-2 text-blue-600" onClick={() => startEdit(row)}>
                      Editar
                    </button>
                    {row.activo && (
                      <button type="button" className="text-red-600" onClick={() => handleDelete(row.idPrestamo)}>
                        Inactivar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <Label>Tipo *</Label>
          <Select
            key={`tipo-${editingId}-${form.tipoPrestamo}`}
            options={TIPOS}
            defaultValue={form.tipoPrestamo}
            onChange={(val) => setForm({ ...emptyForm(val), ...form, tipoPrestamo: val, claveTipoDeduccionSat: val === "FONACOT" ? "011" : val === "INFONAVIT" ? "010" : "004", institucion: val === "INFONAVIT" || val === "FONACOT" ? val : form.institucion })}
          />
        </div>
        <div>
          <Label>Número de crédito</Label>
          <Input
            value={form.numeroCredito || ""}
            onChange={(e) => setForm({ ...form, numeroCredito: e.target.value })}
            placeholder={isInfonavit ? "10 dígitos Infonavit" : "Número FONACOT"}
            maxLength={20}
          />
        </div>
        <div>
          <Label>Clave SAT deducción</Label>
          <Input value={form.claveTipoDeduccionSat || ""} disabled />
        </div>
        {isInfonavit && (
          <>
            <div>
              <Label>Tipo descuento (aviso)</Label>
              <Select
                key={`desc-${editingId}-${form.claveTipoDescuento}`}
                options={(tiposDescuento.length
                  ? tiposDescuento
                  : [
                      { clave: "1", descripcion: "Porcentaje" },
                      { clave: "2", descripcion: "Cuota fija en pesos" },
                      { clave: "3", descripcion: "Veces salario mínimo (VSM)" },
                    ]
                ).map((c) => ({ value: c.clave, label: `${c.clave} - ${c.descripcion}` }))}
                defaultValue={form.claveTipoDescuento || "2"}
                onChange={(val) => setForm({ ...form, claveTipoDescuento: val })}
              />
            </div>
            <div>
              <Label>
                Valor descuento
                {form.claveTipoDescuento === "1" ? " (%)" : form.claveTipoDescuento === "3" ? " (VSM)" : " ($)"}
              </Label>
              <Input
                type="number"
                step={0.01}
                value={form.valorDescuento.toString()}
                onChange={(e) => setForm({ ...form, valorDescuento: parseMoney(e.target.value) })}
              />
            </div>
            <div>
              <Label>SM referencia (VSM)</Label>
              <Input
                type="number"
                step={0.01}
                value={form.salarioMinimoReferencia}
                onChange={(e) => setForm({ ...form, salarioMinimoReferencia: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Fecha aviso retención</Label>
              <Input
                type="date"
                value={form.fechaAvisoRetencion || ""}
                onChange={(e) => setForm({ ...form, fechaAvisoRetencion: e.target.value || null })}
              />
            </div>
          </>
        )}
        {isFonacot && (
          <>
            <div>
              <Label>Tasa interés %</Label>
              <Input
                type="number"
                step={0.01}
                value={form.tasaInteres}
                onChange={(e) => setForm({ ...form, tasaInteres: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Plazo (meses)</Label>
              <Input
                type="number"
                value={form.plazoMeses ?? 0}
                onChange={(e) => setForm({ ...form, plazoMeses: parseInt(e.target.value) || 0 })}
              />
            </div>
          </>
        )}
        <div>
          <Label>Pago por periodo *</Label>
          <Input
            type="number"
            step={0.01}
            min="0"
            value={form.pagoQuincenal.toString()}
            onChange={(e) => setForm({ ...form, pagoQuincenal: parseMoney(e.target.value) })}
          />
        </div>
        <div>
          <Label>Importe original</Label>
          <Input
            type="number"
            step={0.01}
            min="0"
            value={form.importeOriginal.toString()}
            onChange={(e) => setForm({ ...form, importeOriginal: parseMoney(e.target.value) })}
          />
        </div>
        <div>
          <Label>Saldo restante</Label>
          <Input
            type="number"
            step={0.01}
            min="0"
            value={form.importeRestante.toString()}
            onChange={(e) => setForm({ ...form, importeRestante: parseMoney(e.target.value) })}
          />
        </div>
        <div>
          <Label>Número de pagos</Label>
          <Input
            type="number"
            value={form.numeroPagos}
            onChange={(e) => setForm({ ...form, numeroPagos: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>Pagos restantes</Label>
          <Input
            type="number"
            value={form.pagosRestantes}
            onChange={(e) => setForm({ ...form, pagosRestantes: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div>
          <Label>Inicio</Label>
          <Input
            type="date"
            value={form.fechaInicio}
            onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
          />
        </div>
        <div>
          <Label>Fin (opcional)</Label>
          <Input
            type="date"
            value={form.fechaFin || ""}
            onChange={(e) => setForm({ ...form, fechaFin: e.target.value || null })}
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <Label>Observaciones</Label>
          <Input
            value={form.observaciones || ""}
            onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.activo}
            onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">Activo (se aplica al calcular nómina)</span>
        </label>
        {error && <p className="sm:col-span-3 text-sm text-red-500">{error}</p>}
        <div className="flex gap-2 sm:col-span-3">
          <Button type="button" disabled={saving} onClick={handleSubmit}>
            {saving ? "Guardando..." : editingId ? "Actualizar crédito" : "Agregar crédito"}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setForm(emptyForm());
              }}
            >
              Cancelar edición
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
