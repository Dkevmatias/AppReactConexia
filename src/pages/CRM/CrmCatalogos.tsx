import { useMemo } from "react";
import { useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import CatalogoEstatus from "./CatalogoEstatus";
import CatalogoEtapas from "./CatalogoEtapas";
import CatalogoFuentes from "./CatalogoFuentes";
import CatalogoSeguimientos from "./CatalogoSeguimientos";
import CatalogoTipoEstatus from "./CatalogoTipoEstatus";

const TABS = [
  { id: "etapas", label: "Etapas" },
  { id: "fuentes", label: "Fuentes" },
  { id: "seguimientos", label: "Seguimientos" },
  { id: "estatus", label: "Estatus" },
  { id: "tipo-estatus", label: "Tipo Estatus" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function tabValida(raw: string | null): TabId {
  const found = TABS.find((t) => t.id === raw);
  return found?.id ?? "etapas";
}

export default function CrmCatalogos() {
  const [params, setParams] = useSearchParams();
  const tabActiva = useMemo(() => tabValida(params.get("tab")), [params]);

  const setTab = (id: TabId) => {
    const next = new URLSearchParams(params);
    next.set("tab", id);
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-6 p-6">
      <PageMeta
        title="Catálogos CRM"
        description="Administre etapas, fuentes, seguimientos y estatus del CRM."
      />

      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Catálogos
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Un solo lugar para mantener los catálogos del CRM. Use las pestañas
          para cambiar entre ellos.
        </p>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
        <div
          className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700"
          role="tablist"
          aria-label="Catálogos CRM"
        >
          {TABS.map((tab) => {
            const activa = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activa}
                onClick={() => setTab(tab.id)}
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
          {tabActiva === "etapas" ? <CatalogoEtapas embebido /> : null}
          {tabActiva === "fuentes" ? <CatalogoFuentes embebido /> : null}
          {tabActiva === "seguimientos" ? (
            <CatalogoSeguimientos embebido />
          ) : null}
          {tabActiva === "estatus" ? <CatalogoEstatus embebido /> : null}
          {tabActiva === "tipo-estatus" ? (
            <CatalogoTipoEstatus embebido />
          ) : null}
        </div>
      </div>
    </div>
  );
}
