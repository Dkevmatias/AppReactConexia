import { useEffect, useState } from "react";
import { getReportesService, TopCliente, VentaPorGrupo, ComparativoAnual } from "../../../services/reportesService";
import ReactApexChart from "react-apexcharts";

const formatCurrency = (value: number | undefined) => 
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

const formatNumber = (value: number | undefined) => 
  new Intl.NumberFormat('es-MX').format(value || 0);

const formatPorcentaje = (value: number | undefined) => 
  `${value ? value.toFixed(1) : '0.0'}%`;

interface ReportesClientesProps {
  fechaInicio: string;
  fechaFin: string;
}

export default function ReportesClientes({ fechaInicio, fechaFin }: ReportesClientesProps) {
  const [loading, setLoading] = useState(true);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
  const [ventasPorGrupo, setVentasPorGrupo] = useState<VentaPorGrupo[]>([]);
  const [comparativo, setComparativo] = useState<ComparativoAnual | null>(null);

  useEffect(() => {
    cargarDatos();
  }, [fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [clientesData, grupoData, comparativoData] = await Promise.all([
        getReportesService.getTopClientes(20, fechaInicio, fechaFin),
        getReportesService.getVentasPorGrupo(fechaInicio, fechaFin),
        getReportesService.getComparativoAnual()
      ]);

      setTopClientes(clientesData || []);
      setVentasPorGrupo(grupoData || []);
      setComparativo(comparativoData || null);
    } catch (error) {
      console.error("Error cargando reportes de clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {comparativo && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Año Actual</p>
            <p className="text-2xl font-bold text-blue-600">{comparativo.AnioActual}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Año Anterior</p>
            <p className="text-2xl font-bold text-gray-600">{comparativo.AnioAnterior}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">Crecimiento</p>
            <p className={`text-2xl font-bold ${comparativo.Crecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(comparativo.Crecimiento)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <p className="text-sm text-gray-500">% Crecimiento</p>
            <p className={`text-2xl font-bold ${comparativo.PorcentajeCrecimiento >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPorcentaje(comparativo.PorcentajeCrecimiento)}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 20 Clientes</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-right">Docs</th>
                <th className="px-3 py-2 text-right">Ventas</th>
              </tr>
            </thead>
            <tbody>
              {topClientes.map((c, i) => (
                <tr key={i} className="border-t dark:border-gray-700">
                  <td className="px-3 py-2">{c.cardName || 'N/A'}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(c.documentos)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(c.totalVenta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Ventas por Marca/Grupo</h3>
          {ventasPorGrupo.length > 0 ? (
            <ReactApexChart 
              options={{
                chart: { type: 'pie', height: 350 },
                labels: ventasPorGrupo.map(g => g.ItmsGrpNam),
                legend: { position: 'bottom' },
                dataLabels: { enabled: true }
              }} 
              series={ventasPorGrupo.map(g => Number((g.TotalVenta || 0).toFixed(2)))} 
              type="pie" 
              height={300} 
            />
          ) : (
            <p className="text-center text-gray-500 py-10">No hay datos de grupos</p>
          )}
        </div>
      </div>
    </div>
  );
}
