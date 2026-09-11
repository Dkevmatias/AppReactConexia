import {
  CONDICION_PAGO_FIJA,
  LISTA_PRECIOS_FIJA,
  MONEDA_FIJA,
} from "./clienteAltaUtils";
import { prospectoInputClass, prospectoLabelClass } from "./prospectoFormUtils";

const campoFijoClass = `${prospectoInputClass} cursor-not-allowed bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`;

export default function TabCondicionPagoCliente() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Valores fijos para el alta. No se editan en esta etapa.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-payterms">
            Condición de pago
          </label>
          <input
            id="cliente-payterms"
            type="text"
            readOnly
            value={CONDICION_PAGO_FIJA.nombre}
            className={campoFijoClass}
          />
        </div>
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-pricelist">
            Lista de precios
          </label>
          <input
            id="cliente-pricelist"
            type="text"
            readOnly
            value={LISTA_PRECIOS_FIJA.nombre}
            className={campoFijoClass}
          />
        </div>
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-currency">
            Moneda
          </label>
          <input
            id="cliente-currency"
            type="text"
            readOnly
            value={MONEDA_FIJA}
            className={campoFijoClass}
          />
        </div>
      </div>
    </div>
  );
}
