/* NOMCONEXIA-UNIFY */
import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { dashboardService, DashboardKpi } from "../../services/dashboardService";
import { GroupIcon, UserIcon, CalenderIcon, DollarLineIcon } from "../../icons";

export default function Home() {
  const [data, setData] = useState<DashboardKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setError(null);
      const result = await dashboardService.getDashboard();
      setData(result);
    } catch (err: unknown) {
      console.error("Error loading dashboard:", err);
      setError(err instanceof Error ? err.message : "Error al cargar los datos");
      setData({
        totalEmpresas: 0,
        totalEmpleados: 0,
        totalNominas: 0,
        nominasPendientes: 0,
        totalNominaMes: 0,
        empleadosPorEmpresa: [],
        nominasPorEstatus: [],
        nominasPorMes: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const chartOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: "55%",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: data?.nominasPorMes?.map((n) => n.mes) || [],
    },
    yaxis: {
      labels: {
        formatter: (val) => formatCurrency(val),
      },
    },
    fill: { opacity: 1 },
    colors: ["#3B82F6", "#10B981"],
    tooltip: {
      y: {
        formatter: (val) => formatCurrency(val),
      },
    },
  };

  const pieOptions: ApexCharts.ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "inherit",
    },
    labels: data?.nominasPorEstatus?.map((n) => n.estatus) || [],
    colors: ["#F59E0B", "#10B981", "#3B82F6", "#EF4444"],
    legend: {
      position: "bottom",
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: () =>
                data?.nominasPorEstatus?.reduce((acc, n) => acc + n.total, 0).toString() || "0",
            },
          },
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 gap-6">
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/40">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          <button
            type="button"
            onClick={loadDashboard}
            className="mt-2 text-sm font-medium text-blue-600 hover:underline"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/5">
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Dashboard de Nómina
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Bienvenido al portal de gestión de nómina - Vista general
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Empresas</p>
              <p className="mt-1 text-3xl font-bold text-blue-600">{data?.totalEmpresas || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <GroupIcon className="size-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Empleados</p>
              <p className="mt-1 text-3xl font-bold text-green-600">{data?.totalEmpleados || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <UserIcon className="size-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Nóminas Pendientes</p>
              <p className="mt-1 text-3xl font-bold text-orange-600">{data?.nominasPendientes || 0}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
              <CalenderIcon className="size-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Nómina del Mes</p>
              <p className="mt-1 text-3xl font-bold text-purple-600">{formatCurrency(data?.totalNominaMes)}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
              <DollarLineIcon className="size-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Nóminas por Mes
          </h3>
          {data?.nominasPorMes && data.nominasPorMes.length > 0 ? (
            <Chart
              options={chartOptions}
              series={[
                {
                  name: "Total",
                  data: data.nominasPorMes.map((n) => n.total),
                },
              ]}
              type="bar"
              height={280}
            />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/5">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            Estado de Nóminas
          </h3>
          {data?.nominasPorEstatus && data.nominasPorEstatus.length > 0 ? (
            <Chart
              options={pieOptions}
              series={data.nominasPorEstatus.map((n) => n.total)}
              type="donut"
              height={280}
            />
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-500">
              No hay datos disponibles
            </div>
          )}
        </div>
      </div>

      {/* Empleados por empresa */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/5">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
          Empleados por Empresa
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Empresa</th>
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400 text-right">Empleados</th>
              </tr>
            </thead>
            <tbody>
              {data?.empleadosPorEmpresa && data.empleadosPorEmpresa.length > 0 ? (
                data.empleadosPorEmpresa.map((emp, index) => (
                  <tr key={index} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-3 text-gray-800 dark:text-white">{emp.empresa}</td>
                    <td className="py-3 text-right font-medium text-gray-800 dark:text-white">
                      {emp.totalEmpleados}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-4 text-center text-gray-500">
                    No hay empresas registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
