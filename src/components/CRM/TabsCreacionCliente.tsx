import { useState } from "react";

import { clienteAltaVacio, type ClienteAltaForm } from "./clienteAltaUtils";

import ModalContactosCliente from "./ModalContactosCliente";

import TabDireccionesCliente from "./TabDireccionesCliente";

import TabGeneralCliente from "./TabGeneralCliente";

import {

  TABS_CREACION_CLIENTE,

  type TabCreacionClienteId,

} from "./prospectoFormUtils";



type TabsCreacionClienteProps = {

  /** Si false, no renderiza nada. */

  visible: boolean;

};



function PanelPlaceholder({ titulo }: { titulo: string }) {

  return (

    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/80 px-4 py-10 text-center dark:border-gray-600 dark:bg-gray-800/50">

      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">

        {titulo}

      </p>

      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">

        Formulario pendiente de configurar.

      </p>

    </div>

  );

}



const PANEL_POR_TAB: Record<

  Exclude<TabCreacionClienteId, "general" | "direcciones">,

  string

> = {

  "condicion-pago": "Condición de pago",

  "metodo-pago": "Método de pago",

  finanzas: "Datos financieros",

  "campos-usuario": "Campos de usuario",

};



export default function TabsCreacionCliente({ visible }: TabsCreacionClienteProps) {

  const [tabActiva, setTabActiva] =

    useState<TabCreacionClienteId>("general");

  const [clienteAlta, setClienteAlta] = useState<ClienteAltaForm>(clienteAltaVacio);

  const [modalContactosAbierto, setModalContactosAbierto] = useState(false);



  const actualizarCliente = (parcial: Partial<ClienteAltaForm>) => {

    setClienteAlta((prev) => ({ ...prev, ...parcial }));

  };



  if (!visible) return null;



  const renderPanel = () => {

    switch (tabActiva) {

      case "general":

        return (

          <TabGeneralCliente

            datos={clienteAlta}

            onChange={actualizarCliente}

            onAbrirContactos={() => setModalContactosAbierto(true)}

          />

        );

      case "direcciones":

        return (

          <TabDireccionesCliente

            direcciones={clienteAlta.direcciones}

            onChange={(direcciones) => actualizarCliente({ direcciones })}

          />

        );

      default:

        return (

          <PanelPlaceholder

            titulo={PANEL_POR_TAB[tabActiva as keyof typeof PANEL_POR_TAB]}

          />

        );

    }

  };



  return (

    <section className="mt-2 border-t border-gray-200 pt-6 dark:border-gray-700">

      <div className="mb-4">

        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">

          Alta de cliente

        </h4>

        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">

          Complete las pestañas para registrar el cliente en SAP.

        </p>

      </div>



      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">

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

        onCerrar={() => setModalContactosAbierto(false)}

      />

    </section>

  );

}

