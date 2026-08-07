import { useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ReportesTabs from "../../components/reportes/ReportesTabs";
import ReportesPorSurtir from "../Dashboard/reportes/ReportesPorSurtir";
import ReportesTraspasos from "../Dashboard/reportes/ReportesTraspasos";

const tabs = [
  { id: "por-surtir", label: "Por surtir", icon: "🚚" },
  { id: "traspasos", label: "Traspasos", icon: "📦" },
];

export default function ReportesOperaciones() {
  const [activeTab, setActiveTab] = useState("por-surtir");

  return (
    <div className="space-y-6">
      <PageMeta
        title="Reportes Operaciones"
        description="Por surtir y estatus de traspasos"
      />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Reportes Operaciones
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Por surtir global y traspasos (mes pasado a la fecha).
        </p>
      </div>

      <ReportesTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === "traspasos" ? <ReportesTraspasos /> : <ReportesPorSurtir />}
    </div>
  );
}
