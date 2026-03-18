import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ReportesFilters from "../../components/reportes/ReportesFilters";
import ReportesTabs from "../../components/reportes/ReportesTabs";
import ReportesDashboard from "./reportes/ReportesDashboard";
import ReportesVendedores from "./reportes/ReportesVendedores";
import ReportesClientes from "./reportes/ReportesClientes";
import ReportesArticulos from "./reportes/ReportesArticulos";

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊' },
  { id: 'vendedores', label: 'Vendedores', icon: '👥' },
  { id: 'clientes', label: 'Clientes', icon: '🏢' },
  { id: 'articulos', label: 'Artículos', icon: '📦' },
];

export default function Reportes() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [añoComparar, setAñoComparar] = useState(new Date().getFullYear() - 1);
  const [filterKey, setFilterKey] = useState(0);

  useEffect(() => {
    const fin = new Date();
    const inicio = new Date();
    inicio.setDate(inicio.getDate() - 30);
    setFechaInicio(inicio.toISOString().split('T')[0]);
    setFechaFin(fin.toISOString().split('T')[0]);
    setLoading(false);
  }, []);

  const handleFilter = () => {
    setFilterKey(prev => prev + 1);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setFilterKey(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const renderContent = () => {
    const props = { fechaInicio, fechaFin, añoComparar };
    
    switch (activeTab) {
      case 'dashboard':
        return <ReportesDashboard key={`dashboard-${filterKey}`} {...props} />;
      case 'vendedores':
        return <ReportesVendedores key={`vendedores-${filterKey}`} {...props} />;
      case 'clientes':
        return <ReportesClientes key={`clientes-${filterKey}`} {...props} />;
      case 'articulos':
        return <ReportesArticulos key={`articulos-${filterKey}`} {...props} />;
      default:
        return <ReportesDashboard key={`dashboard-${filterKey}`} {...props} />;
    }
  };

  return (
    <div className="space-y-6">
      <PageMeta title="Reportes | 50 Aniversario" description="Dashboard de reportes" />
      
      <ReportesTabs 
        tabs={tabs} 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      
      <ReportesFilters
        fechaInicio={fechaInicio}
        fechaFin={fechaFin}
        añoComparar={añoComparar}
        onFechaInicioChange={setFechaInicio}
        onFechaFinChange={setFechaFin}
        onAñoCompararChange={setAñoComparar}
        onFilter={handleFilter}
      />

      {renderContent()}
    </div>
  );
}
