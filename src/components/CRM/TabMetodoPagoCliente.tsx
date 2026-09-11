import { ClienteAltaForm } from "./clienteAltaUtils";
import { CatalogoMetodoPagoSap } from "../../services/clienteService";
import { prospectoLabelClass } from "./prospectoFormUtils";

type Props = {
  datos: ClienteAltaForm;
  catalogo: CatalogoMetodoPagoSap[];
  cargando: boolean;
  onChange: (parcial: Partial<ClienteAltaForm>) => void;
};

export default function TabMetodoPagoCliente({
  datos,
  catalogo,
  cargando,
  onChange,
}: Props) {
  const toggle = (codigo: string) => {
    const tiene = datos.metodosPago.includes(codigo);
    onChange({
      metodosPago: tiene
        ? datos.metodosPago.filter((c) => c !== codigo)
        : [...datos.metodosPago, codigo],
    });
  };

  if (cargando) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Cargando métodos de pago SAP…
      </p>
    );
  }

  if (catalogo.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        No hay métodos en CatalogoMetodoPagoSap. Puede capturarlos después.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className={prospectoLabelClass}>
        Métodos de pago autorizados (BPPaymentMethods)
      </p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {catalogo.map((m) => (
          <li key={m.codigo}>
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm dark:border-gray-600">
              <input
                type="checkbox"
                checked={datos.metodosPago.includes(m.codigo)}
                onChange={() => toggle(m.codigo)}
              />
              <span className="text-gray-800 dark:text-gray-100">
                {m.codigo}
                {m.nombre ? ` — ${m.nombre}` : ""}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
