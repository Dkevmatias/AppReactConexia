import { useState } from "react";
import type { ClienteAltaForm } from "./clienteAltaUtils";
import ModalContactosCliente from "./ModalContactosCliente";
import TabCamposUsuarioCliente from "./TabCamposUsuarioCliente";
import TabCondicionPagoCliente from "./TabCondicionPagoCliente";
import TabDireccionesCliente from "./TabDireccionesCliente";
import TabGeneralCliente from "./TabGeneralCliente";
import {
  TABS_CREACION_CLIENTE,
  type TabCreacionClienteId,
} from "./prospectoFormUtils";

type TabsCreacionClienteProps = {
  visible: boolean;
  datos: ClienteAltaForm;
  onChange: (parcial: Partial<ClienteAltaForm>) => void;
  onGuardarContactos?: (
    contactos: ClienteAltaForm["contactos"],
  ) => void | Promise<void>;
  clientePersistido?: boolean;
  onGuardarDireccion?: (
    direccion: ClienteAltaForm["direcciones"][number],
  ) => void | Promise<void>;
  /** Si true, no renderiza el encabezado/borde externo (para usar dentro de otra tab). */
  embebido?: boolean;
  /** Cliente enviado a SAP: formularios en solo lectura. */
  soloLectura?: boolean;
};

export default function TabsCreacionCliente({
  visible,
  datos,
  onChange,
  onGuardarContactos,
  clientePersistido = false,
  onGuardarDireccion,
  embebido = false,
  soloLectura = false,
}: TabsCreacionClienteProps) {
  const [tabActiva, setTabActiva] =
    useState<TabCreacionClienteId>("general");
  const [modalContactosAbierto, setModalContactosAbierto] = useState(false);

  if (!visible) return null;

  const renderPanel = () => {
    switch (tabActiva) {
      case "general":
        return (
          <TabGeneralCliente
            datos={datos}
            onChange={onChange}
            onAbrirContactos={() => setModalContactosAbierto(true)}
            soloLectura={soloLectura}
          />
        );
      case "direcciones":
        return (
          <TabDireccionesCliente
            direcciones={datos.direcciones}
            onChange={(direcciones) => onChange({ direcciones })}
            clientePersistido={clientePersistido}
            onGuardarDireccion={onGuardarDireccion}
            soloLectura={soloLectura}
          />
        );
      case "condicion-pago":
        return <TabCondicionPagoCliente />;
      case "campos-usuario":
        return (
          <TabCamposUsuarioCliente
            datos={datos}
            onChange={onChange}
            soloLectura={soloLectura}
          />
        );
      default:
        return null;
    }
  };

  const cuerpo = (
    <>
      <div
        className={
          embebido
            ? "overflow-hidden"
            : "overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
        }
      >
        <div
          className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700"
          role="tablist"
          aria-label="Secciones de alta de cliente"
        >
          {TABS_CREACION_CLIENTE.map((tab) => {
            const activa = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => setTabActiva(tab.id)}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors sm:px-5 ${
                  activa
                    ? "border-b-2 border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-gray-800 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-5" role="tabpanel">
          {renderPanel()}
        </div>
      </div>

      <ModalContactosCliente
        abierto={modalContactosAbierto}
        contactos={datos.contactos}
        soloLectura={soloLectura}
        onGuardar={async (contactos) => {
          if (onGuardarContactos) {
            await onGuardarContactos(contactos);
            return;
          }
          onChange({ contactos });
        }}
        onCerrar={() => setModalContactosAbierto(false)}
      />
    </>
  );

  if (embebido) return cuerpo;

  return (
    <section className="mt-2 border-t border-gray-200 pt-6 dark:border-gray-700">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Alta de cliente
        </h4>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Se guarda en el CRM. Después podrá previsualizar el JSON hacia SAP.
        </p>
      </div>
      {cuerpo}
    </section>
  );
}
