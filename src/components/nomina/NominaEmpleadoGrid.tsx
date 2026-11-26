/* NOMCONEXIA-UNIFY */
import { NominaDetalle } from "../../services/nominaService";
import { fingerprintRenglon, lineTotals, money } from "./prenomina";

type Props = {
  rows: NominaDetalle[];
  savedRows: NominaDetalle[];
  editable: boolean;
  savingId?: number | null;
  onChange: (rows: NominaDetalle[]) => void;
  onSaveRow: (row: NominaDetalle) => void;
  onPrenomina: (row: NominaDetalle) => void;
};

function parseNum(raw: string): number {
  const n = Number(String(raw).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

const th = "px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 whitespace-nowrap";
const thGreen = `${th} bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300`;
const thRed = `${th} bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300`;
const thBlue = `${th} bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300`;

function CellInput({
  value,
  disabled,
  onChange,
  dataField,
}: {
  value: number;
  disabled?: boolean;
  onChange: (n: number) => void;
  dataField?: string;
}) {
  return (
    <input
      type="number"
      step={0.01}
      data-field={dataField}
      disabled={disabled}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(parseNum(e.target.value))}
      className="w-[5.75rem] rounded border border-gray-200 bg-white px-1.5 py-1 text-right text-xs text-gray-800 disabled:bg-gray-50 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:disabled:bg-gray-800"
    />
  );
}

export default function NominaEmpleadoGrid({
  rows,
  savedRows,
  editable,
  savingId,
  onChange,
  onSaveRow,
  onPrenomina,
}: Props) {
  const savedById = new Map(savedRows.map((r) => [r.idNominaDetalle, r]));

  const patch = (index: number, partial: Partial<NominaDetalle>) => {
    const next = rows.map((row, i) => {
      if (i !== index) return row;
      const updated = { ...row, ...partial };
      const t = lineTotals(updated);
      return {
        ...updated,
        totalPercepciones: t.perc,
        totalDeducciones: t.ded,
        totalAPagar: t.neto,
        totalDeposito: t.neto,
      };
    });
    onChange(next);
  };

  const totals = rows.reduce(
    (acc, row) => {
      const t = lineTotals(row);
      acc.perc += t.perc;
      acc.ded += t.ded;
      acc.neto += t.neto;
      return acc;
    },
    { perc: 0, ded: 0, neto: 0 }
  );

  if (rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-gray-500">
        No hay renglones. Carga empleados activos para armar el detalle estilo NominaEmpleado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto max-h-[62vh] rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="min-w-max w-full text-left">
        <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900">
          <tr>
            <th colSpan={5} className={`${th} text-center border-b border-gray-200 dark:border-gray-700`}>
              Empleado
            </th>
            <th colSpan={6} className={`${thGreen} text-center border-b border-emerald-200 dark:border-emerald-900`}>
              Percepciones
            </th>
            <th colSpan={5} className={`${thRed} text-center border-b border-rose-200 dark:border-rose-900`}>
              Deducciones
            </th>
            <th className={`${thBlue} text-center border-b border-blue-200 dark:border-blue-900`}>Neto</th>
            <th className={`${th} text-center border-b border-gray-200 dark:border-gray-700`}>Acciones</th>
          </tr>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className={th}>No. emp.</th>
            <th className={th}>Nombre</th>
            <th className={th}>RFC</th>
            <th className={`${th} text-right`}>SDI</th>
            <th className={`${th} text-right`}>SBC</th>
            <th className={`${thGreen} text-right`}>Sueldo</th>
            <th className={`${thGreen} text-right`}>Puntualidad</th>
            <th className={`${thGreen} text-right`}>Asistencia</th>
            <th className={`${thGreen} text-right`}>Vacaciones</th>
            <th className={`${thGreen} text-right`}>Prima vac.</th>
            <th className={`${thGreen} text-right`}>Aguinaldo</th>
            <th className={`${thRed} text-right`}>Ret IMSS</th>
            <th className={`${thRed} text-right`}>Ret ISR</th>
            <th className={`${thRed} text-right`}>Infonavit</th>
            <th className={`${thRed} text-right`}>Fonacot</th>
            <th className={`${thRed} text-right`}>Pensión</th>
            <th className={`${thBlue} text-right`}>A recibir</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {rows.map((row, index) => {
            const t = lineTotals(row);
            const locked = !editable || (row.estatus || "").toUpperCase() === "TIMBRADA";
            const saved = savedById.get(row.idNominaDetalle);
            const dirty = !saved || fingerprintRenglon(saved) !== fingerprintRenglon(row);
            const saving = savingId === row.idNominaDetalle;
            return (
              <tr
                key={row.idNominaDetalle}
                onDoubleClick={(e) => {
                  if (locked) return;
                  const tag = (e.target as HTMLElement).tagName;
                  if (tag === "INPUT" || tag === "BUTTON" || (e.target as HTMLElement).closest("button")) return;
                  const first = e.currentTarget.querySelector<HTMLInputElement>('input[data-field="sueldo"]');
                  first?.focus();
                  first?.select();
                }}
                className={`hover:bg-gray-50 dark:hover:bg-white/5 ${dirty ? "bg-amber-50/70 dark:bg-amber-950/20" : ""} ${locked ? "" : "cursor-pointer"}`}
                title={locked ? undefined : "Doble clic para editar este renglón"}
              >
                <td className="px-2 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {row.numeroEmpleado || "—"}
                </td>
                <td className="px-2 py-2 text-xs font-medium text-gray-800 dark:text-white whitespace-nowrap max-w-[14rem] truncate" title={row.empleadoNombre || ""}>
                  {row.empleadoNombre}
                  {dirty && <span className="ml-1 text-[10px] font-normal text-amber-700">●</span>}
                </td>
                <td className="px-2 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {row.rfc || "—"}
                </td>
                <td className="px-2 py-1">
                  <CellInput value={row.sdi} disabled={locked} onChange={(n) => patch(index, { sdi: n })} />
                </td>
                <td className="px-2 py-1">
                  <CellInput value={row.sbc} disabled={locked} onChange={(n) => patch(index, { sbc: n })} />
                </td>
                <td className="px-2 py-1">
                  <CellInput value={row.sueldo} dataField="sueldo" disabled={locked} onChange={(n) => patch(index, { sueldo: n })} />
                </td>
                <td className="px-2 py-1">
                  <CellInput value={row.puntualidad} disabled={locked} onChange={(n) => patch(index, { puntualidad: n })} />
                </td>
                <td className="px-2 py-1">
                  <CellInput value={row.asistencia} disabled={locked} onChange={(n) => patch(index, { asistencia: n })} />
                </td>
                <td className="px-2 py-1">
                  <CellInput
                    value={row.vacacionesAdicionales}
                    disabled={locked}
                    onChange={(n) => patch(index, { vacacionesAdicionales: n })}
                  />
                </td>
                <td className="px-2 py-1">
                  <CellInput
                    value={row.primaVacacional}
                    disabled={locked}
                    onChange={(n) => patch(index, { primaVacacional: n })}
                  />
                </td>
                <td className="px-2 py-1">
                  <CellInput value={row.aguinaldo} disabled={locked} onChange={(n) => patch(index, { aguinaldo: n })} />
                </td>
                <td className="px-2 py-1">
                  <CellInput value={row.retIMSS} disabled={locked} onChange={(n) => patch(index, { retIMSS: n, retIMSSObrera: n })} />
                </td>
                <td className="px-2 py-1">
                  <CellInput value={row.retISR} disabled={locked} onChange={(n) => patch(index, { retISR: n })} />
                </td>
                <td className="px-2 py-1">
                  <CellInput value={row.infonavit} disabled={locked} onChange={(n) => patch(index, { infonavit: n })} />
                </td>
                <td className="px-2 py-1">
                  <CellInput value={row.fonacot} disabled={locked} onChange={(n) => patch(index, { fonacot: n })} />
                </td>
                <td className="px-2 py-1">
                  <CellInput value={row.pensionAlim} disabled={locked} onChange={(n) => patch(index, { pensionAlim: n })} />
                </td>
                <td className="px-2 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 text-right whitespace-nowrap">
                  {money(t.neto)}
                </td>
                <td className="sticky right-0 bg-white px-2 py-1 dark:bg-gray-900">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    {!locked && (
                      <button
                        type="button"
                        disabled={!dirty || saving}
                        onClick={() => onSaveRow(row)}
                        className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
                      >
                        {saving ? "..." : "Actualizar"}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onPrenomina(row)}
                      className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Prenómina
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/80">
            <td colSpan={11} className="px-2 py-2 text-xs font-medium text-gray-600 dark:text-gray-300">
              Totales ({rows.length} empleados)
            </td>
            <td colSpan={5} className="px-2 py-2 text-xs text-right text-red-600 dark:text-red-400">
              {money(totals.ded)}
            </td>
            <td className="px-2 py-2 text-xs font-semibold text-right text-blue-600 dark:text-blue-400">
              {money(totals.neto)}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
