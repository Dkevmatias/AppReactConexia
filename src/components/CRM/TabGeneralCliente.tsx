import { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import {
  ClienteAltaForm,
  FORMAS_PAGO_CFDI,
  METODOS_PAGO_CFDI,
  TipoPersonaCliente,
  USOS_CFDI_COMUNES,
  nombreCompletoContacto,
} from "./clienteAltaUtils";
import { prospectoInputClass, prospectoLabelClass } from "./prospectoFormUtils";
import {
  etiquetaSatItem,
  satCatalogoService,
  type SatCatalogoItem,
} from "../../services/satCatalogoService";
import {
  esRfcGenerico,
  RFC_GENERICO_NACIONAL,
} from "../../services/clienteService";

type TabGeneralClienteProps = {
  datos: ClienteAltaForm;
  onChange: (parcial: Partial<ClienteAltaForm>) => void;
  onAbrirContactos: () => void;
  /** Cliente ya en SAP: inputs y acciones deshabilitados. */
  soloLectura?: boolean;
};

export default function TabGeneralCliente({
  datos,
  onChange,
  onAbrirContactos,
  soloLectura = false,
}: TabGeneralClienteProps) {
  const [usosCfdi, setUsosCfdi] = useState<SatCatalogoItem[]>([]);
  const [metodosPago, setMetodosPago] = useState<SatCatalogoItem[]>([]);
  const [formasPago, setFormasPago] = useState<SatCatalogoItem[]>([]);
  const [loadingFiscal, setLoadingFiscal] = useState(true);
  const [errorFiscal, setErrorFiscal] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cargar = async () => {
      setLoadingFiscal(true);
      setErrorFiscal(null);
      try {
        const [usos, metodos, formas] = await Promise.all([
          satCatalogoService.getUsosCfdi(),
          satCatalogoService.getMetodosPago(),
          satCatalogoService.getFormasPago(),
        ]);
        if (cancelled) return;
        setUsosCfdi(usos);
        setMetodosPago(metodos);
        setFormasPago(formas);
      } catch (err) {
        if (!cancelled) {
          setErrorFiscal(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar catálogos fiscales SAT.",
          );
        }
      } finally {
        if (!cancelled) setLoadingFiscal(false);
      }
    };
    void cargar();
    return () => {
      cancelled = true;
    };
  }, []);

  const opcionesUso =
    usosCfdi.length > 0
      ? usosCfdi
      : USOS_CFDI_COMUNES.filter((o) => o.value).map((o) => ({
          clave: o.value,
          nombre: o.label.replace(/^[A-Z0-9]+\s—\s/, ""),
          activo: true,
        }));

  const opcionesMetodo =
    metodosPago.length > 0
      ? metodosPago
      : METODOS_PAGO_CFDI.filter((o) => o.value).map((o) => ({
          clave: o.value,
          nombre: o.label.replace(/^[A-Z0-9]+\s—\s/, ""),
          activo: true,
        }));

  const opcionesForma =
    formasPago.length > 0
      ? formasPago
      : FORMAS_PAGO_CFDI.filter((o) => o.value).map((o) => ({
          clave: o.value,
          nombre: o.label.replace(/^[A-Z0-9]+\s—\s/, ""),
          activo: true,
        }));

  return (
    <fieldset
      disabled={soloLectura}
      className="min-w-0 space-y-5 border-0 p-0 disabled:opacity-90"
    >
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
        El Codigo de Cliente no se captura aquí. Lo asigna después un usuario
        con permiso{" "}
        <span className="font-medium">cliente.asignar-cardcode</span>.
      </p>

      {errorFiscal ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {errorFiscal} Se usan opciones locales de respaldo.
        </p>
      ) : null}

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
            <option value="FISICA">Física (cPrivate)</option>
            <option value="MORAL">Moral (cCompany)</option>
          </select>
        </div>

        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-uso-cfdi">
            Uso CFDI (U_B1SYS_MainUsage)
          </label>
          <select
            id="cliente-uso-cfdi"
            value={datos.usoCfdi}
            onChange={(e) => onChange({ usoCfdi: e.target.value })}
            className={prospectoInputClass}
            disabled={loadingFiscal && usosCfdi.length === 0}
          >
            <option value="">
              {loadingFiscal ? "Cargando usos CFDI…" : "Seleccione uso CFDI"}
            </option>
            {opcionesUso.map((opt) => (
              <option key={opt.clave} value={opt.clave}>
                {etiquetaSatItem(opt)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-cardname">
            Nombre <span className="text-red-500">*</span>
          </label>
          <input
            id="cliente-cardname"
            type="text"
            value={datos.cardName}
            onChange={(e) => onChange({ cardName: e.target.value })}
            placeholder="CardName / razón social"
            className={prospectoInputClass}
          />
        </div>
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-foreign">
            Nombre del Negocio
          </label>
          <input
            id="cliente-foreign"
            type="text"
            value={datos.cardForeignName}
            onChange={(e) => onChange({ cardForeignName: e.target.value })}
            placeholder="CardForeignName"
            className={prospectoInputClass}
          />
        </div>
        <div>
          <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
            <label className={prospectoLabelClass} htmlFor="cliente-rfc">
              RFC
            </label>
            <label
              htmlFor="cliente-rfc-generico"
              className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-300"
            >
              <input
                id="cliente-rfc-generico"
                type="checkbox"
                checked={esRfcGenerico(datos.rfc)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange({ rfc: RFC_GENERICO_NACIONAL });
                  } else if (esRfcGenerico(datos.rfc)) {
                    onChange({ rfc: "" });
                  }
                }}
                className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Genérico
            </label>
          </div>
          <input
            id="cliente-rfc"
            type="text"
            value={datos.rfc}
            onChange={(e) => onChange({ rfc: e.target.value.toUpperCase() })}
            placeholder={
              esRfcGenerico(datos.rfc) ? RFC_GENERICO_NACIONAL : "FederalTaxID"
            }
            readOnly={esRfcGenerico(datos.rfc)}
            className={`${prospectoInputClass}${
              esRfcGenerico(datos.rfc) ? " bg-gray-50 dark:bg-gray-900/40" : ""
            }`}
          />
          {esRfcGenerico(datos.rfc) ? (
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              RFC genérico {datos.rfc} (permite varios clientes)
            </p>
          ) : null}
        </div>
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-email">
            Correo
          </label>
          <input
            id="cliente-email"
            type="email"
            value={datos.emailAddress}
            onChange={(e) => onChange({ emailAddress: e.target.value })}
            className={prospectoInputClass}
          />
        </div>
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-phone1">
            Teléfono 1
          </label>
          <input
            id="cliente-phone1"
            type="tel"
            value={datos.phone1}
            onChange={(e) => onChange({ phone1: e.target.value })}
            className={prospectoInputClass}
          />
        </div>
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-phone2">
            Teléfono 2
          </label>
          <input
            id="cliente-phone2"
            type="tel"
            value={datos.phone2}
            onChange={(e) => onChange({ phone2: e.target.value })}
            className={prospectoInputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-metodo-pago">
            Método de pago CFDI
          </label>
          <select
            id="cliente-metodo-pago"
            value={datos.metodoPagoCfdi}
            onChange={(e) => onChange({ metodoPagoCfdi: e.target.value })}
            className={prospectoInputClass}
            disabled={loadingFiscal && metodosPago.length === 0}
          >
            <option value="">
              {loadingFiscal ? "Cargando métodos…" : "Seleccione método"}
            </option>
            {opcionesMetodo.map((opt) => (
              <option key={opt.clave} value={opt.clave}>
                {etiquetaSatItem(opt)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-forma-pago">
            Forma de pago CFDI
          </label>
          <select
            id="cliente-forma-pago"
            value={datos.formaPagoCfdi}
            onChange={(e) => onChange({ formaPagoCfdi: e.target.value })}
            className={prospectoInputClass}
            disabled={loadingFiscal && formasPago.length === 0}
          >
            <option value="">
              {loadingFiscal ? "Cargando formas…" : "Seleccione forma"}
            </option>
            {opcionesForma.map((opt) => (
              <option key={opt.clave} value={opt.clave}>
                {etiquetaSatItem(opt)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4 dark:border-gray-600 dark:bg-gray-800/50">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Contactos
              {datos.contactos.length > 0 ? ` (${datos.contactos.length})` : ""}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Se guardan en CRM al confirmar en este modal (si el cliente ya
              existe) o al Guardar el prospecto.
            </p>
          </div>
          <button
            type="button"
            onClick={onAbrirContactos}
            className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/50"
          >
            <UserPlus className="h-4 w-4" />
            {datos.contactos.length > 0
              ? "Editar contactos"
              : "Agregar contactos"}
          </button>
        </div>

        {datos.contactos.length > 0 ? (
          <ul className="mt-3 space-y-1.5">
            {datos.contactos.map((c) => (
              <li
                key={c.idLocal}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              >
                <span className="font-medium">
                  {nombreCompletoContacto(c) || "Sin nombre"}
                </span>
                {c.posicion ? ` · ${c.posicion}` : ""}
                {c.telefono1 ? ` · ${c.telefono1}` : ""}
                {c.email ? ` · ${c.email}` : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </fieldset>
  );
}
