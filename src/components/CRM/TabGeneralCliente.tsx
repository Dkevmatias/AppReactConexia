import { UserPlus } from "lucide-react";
import {
  ClienteAltaForm,
  TipoPersonaCliente,
  USOS_CFDI_COMUNES,
} from "./clienteAltaUtils";
import { prospectoInputClass, prospectoLabelClass } from "./prospectoFormUtils";

type TabGeneralClienteProps = {
  datos: ClienteAltaForm;
  onChange: (parcial: Partial<ClienteAltaForm>) => void;
  onAbrirContactos: () => void;
};

export default function TabGeneralCliente({
  datos,
  onChange,
  onAbrirContactos,
}: TabGeneralClienteProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-tipo-persona">
            Tipo de persona
          </label>
          <select
            id="cliente-tipo-persona"
            value={datos.tipoPersona}
            onChange={(e) =>
              onChange({
                tipoPersona: e.target.value as TipoPersonaCliente | "",
              })
            }
            className={prospectoInputClass}
          >
            <option value="">Seleccione tipo</option>
            <option value="FISICA">Física</option>
            <option value="MORAL">Moral</option>
          </select>
        </div>

        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-uso-cfdi">
            Uso CFDI
          </label>
          <select
            id="cliente-uso-cfdi"
            value={datos.usoCfdi}
            onChange={(e) => onChange({ usoCfdi: e.target.value })}
            className={prospectoInputClass}
          >
            {USOS_CFDI_COMUNES.map((opt) => (
              <option key={opt.value || "empty"} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={prospectoLabelClass} htmlFor="cliente-nombre-negocio">
          Nombre de negocio
        </label>
        <input
          id="cliente-nombre-negocio"
          type="text"
          value={datos.nombreNegocio}
          onChange={(e) => onChange({ nombreNegocio: e.target.value })}
          placeholder="Razón social o nombre comercial"
          className={prospectoInputClass}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-600 dark:bg-gray-800/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Contactos
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Agregue los contactos asociados al cliente.
            </p>
          </div>
          <button
            type="button"
            onClick={onAbrirContactos}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/50"
          >
            <UserPlus className="h-4 w-4" />
            Agregar contactos
          </button>
        </div>
      </div>
    </div>
  );
}
