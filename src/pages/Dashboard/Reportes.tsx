import { useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ReportesFilters from "../../components/reportes/ReportesFilters";
import ReportesTabs from "../../components/reportes/ReportesTabs";
import { getReportesService } from "../../services/reportesService";
import ReportesDashboard from "./reportes/ReportesDashboard";
import ReportesVendedores from "./reportes/ReportesVendedores";
import ReportesClientes from "./reportes/ReportesClientes";
import ReportesArticulos from "./reportes/ReportesArticulos";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "vendedores", label: "Vendedores", icon: "👥" },
  { id: "clientes", label: "Clientes", icon: "🏢" },
  { id: "articulos", label: "Artículos", icon: "📦" },
];

export default function Reportes() {
  const defaultFechas = useMemo(() => getReportesService.getFechasDefault(), []);
  const [fechaInicio, setFechaInicio] = useState(defaultFechas.fechaInicio);
  const [fechaFin, setFechaFin] = useState(defaultFechas.fechaFin);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [añoComparar, setAñoComparar] = useState(new Date().getFullYear() - 1);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<number | null>(null);
  const [username, setNombreVendedor] = useState<string | null>(null);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState<number | null>(null);
  const [filterKey, setFilterKey] = useState(0);

  const handleVendedorChange = (id: number | null, nombre: string | null) => {
    setVendedorSeleccionado(id);
    setNombreVendedor(nombre);
  };

  const handleMarcaChange = (id: number | null) => {
    setMarcaSeleccionada(id);
  };

  const handleFilter = () => {
    setFilterKey((prev) => prev + 1);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setFilterKey((prev) => prev + 1);
  };

  const tabProps = { fechaInicio, fechaFin, añoComparar };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <ReportesDashboard key={`dashboard-${filterKey}`} {...tabProps} />;
      case "vendedores":
        return (
          <ReportesVendedores
            key={`vendedores-${filterKey}`}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            username={username}
            firmCode={marcaSeleccionada}
          />
        );
      case "clientes":
        return <ReportesClientes key={`clientes-${filterKey}`} {...tabProps} />;
      case "articulos":
        return <ReportesArticulos key={`articulos-${filterKey}`} fechaInicio={fechaInicio} fechaFin={fechaFin} />;
      default:
        return <ReportesDashboard key={`dashboard-${filterKey}`} {...tabProps} />;
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta title="Reportes | 50 Aniversario" description="Dashboard de reportes" />

      <ReportesTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

      <ReportesFilters
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        añoComparar={añoComparar}
        vendedorSeleccionado={vendedorSeleccionado}
        marcaSeleccionada={marcaSeleccionada}
        onFechaInicioChange={setFechaInicio}
        onFechaFinChange={setFechaFin}
        onAñoCompararChange={setAñoComparar}
        onVendedorChange={handleVendedorChange}
        onMarcaChange={handleMarcaChange}
        onFilter={handleFilter}
      />

      {renderContent()}
    </div>
  );
}
