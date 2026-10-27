import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ReportesFilters from "../../components/reportes/ReportesFilters";
import ReportesTabs from "../../components/reportes/ReportesTabs";
import {
  getReportesService,
  TipoMetricaCumplimiento,
} from "../../services/reportesService";
import { useReportesBiPermisos } from "../../hooks/useReportesBiPermisos";
import { useVendedorSesion } from "../../hooks/useVendedorSesion";
import ReportesDashboard from "./reportes/ReportesDashboard";
import ReportesVendedores from "./reportes/ReportesVendedores";
import ReportesClientes from "./reportes/ReportesClientes";
import ReportesArticulos from "./reportes/ReportesArticulos";
import ReportePlataforma from "./reportes/ReportePlataforma";
import ReportesPorSurtir from "./reportes/ReportesPorSurtir";
import ReportesTendenciaCompraCliente from "./reportes/ReportesTendenciaCompraCliente";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: "📊" },
  { id: "vendedores", label: "Vendedores", icon: "👥" },
  { id: "clientes", label: "Clientes", icon: "🏢" },
  { id: "articulos", label: "Artículos", icon: "📦" },
  { id: "plataforma", label: "Plataforma", icon: "💻" },
  { id: "por-surtir", label: "Por Surtir", icon: "🚚" },
  { id: "tendencia-compra", label: "Tendencia compra", icon: "📈" },
];

const TABS_SIN_FILTROS_GLOBALES = new Set(["por-surtir", "tendencia-compra"]);

export default function Reportes() {
  const { puedeVerTab, menuLoading, tieneAccesoCompleto } =
    useReportesBiPermisos();
  const vendedorSesion = useVendedorSesion();
  const restringirAVendedor = !menuLoading && !tieneAccesoCompleto;
  const vendedorSesionFiltro = useMemo(
    () =>
      restringirAVendedor
        ? {
            idUsuario: vendedorSesion.idUsuario,
            username: vendedorSesion.username,
            nombre: vendedorSesion.nombre,
          }
        : null,
    [
      restringirAVendedor,
      vendedorSesion.idUsuario,
      vendedorSesion.username,
      vendedorSesion.nombre,
    ],
  );
  const tabsVisibles = useMemo(
    () => tabs.filter((tab) => puedeVerTab(tab.id)),
    [puedeVerTab],
  );
  const defaultFechas = useMemo(
    () => getReportesService.getFechasDefault(),
    [],
  );
  const [fechaInicio, setFechaInicio] = useState(defaultFechas.fechaInicio);
  const [fechaFin, setFechaFin] = useState(defaultFechas.fechaFin);
  const [activeTab, setActiveTab] = useState("");
  const [añoComparar, setAñoComparar] = useState(new Date().getFullYear() - 1);
  const [vendedorSeleccionado, setVendedorSeleccionado] = useState<
    number | null
  >(null);
  const [username, setNombreVendedor] = useState<string | null>(null);
  const [firmNameSeleccionado, setFirmNameSeleccionado] = useState<
    string | null
  >(null);
  const [filterKey, setFilterKey] = useState(0);
  const [tipoMetrica, setTipoMetrica] =
    useState<TipoMetricaCumplimiento>("ulkp");

  const handleVendedorChange = (id: number | null, nombre: string | null) => {
    setVendedorSeleccionado(id);
    setNombreVendedor(nombre);
  };

  const handleMarcaChange = (firmName: string | null) => {
    setFirmNameSeleccionado(firmName);
  };

  useEffect(() => {
    if (tabsVisibles.length === 0) return;
    if (!tabsVisibles.some((tab) => tab.id === activeTab)) {
      setActiveTab(tabsVisibles[0].id);
    }
  }, [tabsVisibles, activeTab]);

  useEffect(() => {
    if (!restringirAVendedor || !vendedorSesion.listo) return;
    const clave = vendedorSesion.username || vendedorSesion.nombre;
    if (!clave) return;
    setNombreVendedor(clave);
    if (vendedorSesion.idUsuario > 0) {
      setVendedorSeleccionado(vendedorSesion.idUsuario);
    }
  }, [
    restringirAVendedor,
    vendedorSesion.listo,
    vendedorSesion.username,
    vendedorSesion.nombre,
    vendedorSesion.idUsuario,
  ]);

  const handleFilter = () => {
    setFilterKey((prev) => prev + 1);
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setFilterKey((prev) => prev + 1);
  };

  const tabProps = { fechaInicio, fechaFin, añoComparar };

  const renderContent = () => {
    if (menuLoading) {
      return (
        <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
          Cargando reportes…
        </p>
      );
    }
    if (!activeTab || !puedeVerTab(activeTab)) {
      return (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-10 text-center text-sm text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400">
          No tiene permisos para los reportes de este módulo.
        </p>
      );
    }
    switch (activeTab) {
      case "dashboard":
        return (
          <ReportesDashboard
            key={`dashboard-${filterKey}`}
            {...tabProps}
            tipoMetrica={tipoMetrica}
          />
        );
      case "vendedores":
        if (restringirAVendedor && (!vendedorSesion.listo || !username)) {
          return (
            <p className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
              Cargando vendedor…
            </p>
          );
        }
        return (
          <ReportesVendedores
            key={`vendedores-${filterKey}`}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
            username={username}
            firmName={firmNameSeleccionado}
            añoComparar={0}
            tipoMetrica={tipoMetrica}
          />
        );
      case "clientes":
        return <ReportesClientes key={`clientes-${filterKey}`} {...tabProps} />;
      case "articulos":
        return (
          <ReportesArticulos
            key={`articulos-${filterKey}`}
            fechaInicio={fechaInicio}
            fechaFin={fechaFin}
          />
        );
      case "plataforma":
        return (
          <ReportePlataforma key={`plataforma-${filterKey}`} {...tabProps} />
        );
      case "por-surtir":
        return (
          <ReportesPorSurtir
            key={`por-surtir-${filterKey}`}
            restringirAVendedor={restringirAVendedor}
          />
        );
      case "tendencia-compra":
        return (
          <ReportesTendenciaCompraCliente
            key={`tendencia-compra-${filterKey}`}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <PageMeta
        title="Reportes | 50 Aniversario"
        description="Dashboard de reportes"
      />

      <ReportesTabs
        tabs={tabsVisibles}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {!TABS_SIN_FILTROS_GLOBALES.has(activeTab) ? (
        <ReportesFilters
          fechaInicio={fechaInicio}
          fechaFin={fechaFin}
          añoComparar={añoComparar}
          vendedorSeleccionado={vendedorSeleccionado}
          firmNameSeleccionado={firmNameSeleccionado}
          onFechaInicioChange={setFechaInicio}
          onFechaFinChange={setFechaFin}
          onAñoCompararChange={setAñoComparar}
          onVendedorChange={handleVendedorChange}
          onMarcaChange={handleMarcaChange}
          tipoMetrica={tipoMetrica}
          onTipoMetricaChange={setTipoMetrica}
          onFilter={handleFilter}
          bloquearVendedor={restringirAVendedor}
          vendedorSesion={vendedorSesionFiltro}
        />
      ) : null}

      {renderContent()}
    </div>
  );
}
