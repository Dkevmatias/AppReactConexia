import { useEffect, useState } from "react";
import { getReportesService, VentaPorVendedor, VentaPorAlmacen, TopCliente } from "../../../services/reportesService";
import ReactApexChart from "react-apexcharts";

const formatCurrency = (value: number | undefined) => 
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

const formatNumber = (value: number | undefined) => 
  new Intl.NumberFormat('es-MX').format(value || 0);

interface ReportesVendedoresProps {
  fechaInicio: string;
  fechaFin: string;
}

export default function ReportesVendedores({ fechaInicio, fechaFin }: ReportesVendedoresProps) {
  const [loading, setLoading] = useState(true);
  const [ventasVendedor, setVentasVendedor] = useState<VentaPorVendedor[]>([]);
  const [ventasAlmacen, setVentasAlmacen] = useState<VentaPorAlmacen[]>([]);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);

  useEffect(() => {
    cargarDatos();
  }, [fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [vendedorData, almacenData, clientesData] = await Promise.all([
        getReportesService.getVentasPorVendedor(fechaInicio, fechaFin),
        getReportesService.getVentasPorAlmacen(fechaInicio, fechaFin),
        getReportesService.getTopClientes(10, fechaInicio, fechaFin)
      ]);

      setVentasVendedor(vendedorData || []);
      setVentasAlmacen(almacenData || []);
      setTopClientes(clientesData || []);
    } catch (error) {
      console.error("Error cargando reportes de vendedores:", error);
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Ventas por Vendedor</h3>
          {ventasVendedor.length > 0 ? (
            <ReactApexChart 
              options={{
                chart: { type: 'bar', height: 350 },
                plotOptions: { bar: { borderRadius: 4, horizontal: true } },
                colors: ['#10b981'],
                dataLabels: { enabled: false },
                xaxis: { categories: ventasVendedor.map(v => v.SlpName) }
              }} 
              series={[{ name: 'Ventas', data: ventasVendedor.map(v => Number((v.TotalVenta || 0).toFixed(2)))}]} 
              type="bar" 
              height={300} 
            />
          ) : (
            <p className="text-center text-gray-500 py-10">No hay datos de vendedores</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Ventas por Almacén</h3>
          {ventasAlmacen.length > 0 ? (
            <ReactApexChart 
              options={{
                chart: { type: 'donut' },
                colors: ['#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
                labels: ventasAlmacen.map(a => a.whsCode),
                legend: { position: 'bottom' },
                dataLabels: { enabled: true }
              }} 
              series={ventasAlmacen.map(a => Number((a.totalVenta || 0).toFixed(2)))} 
              type="donut" 
              height={300} 
            />
          ) : (
            <p className="text-center text-gray-500 py-10">No hay datos de almacenes</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Top 10 Clientes por Ventas</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Cliente</th>
              <th className="px-3 py-2 text-right">Documentos</th>
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
    </div>
  );
}
