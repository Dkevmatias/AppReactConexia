import { useEffect, useState } from "react";
import { getReportesService, TopProducto, VentaPorAlmacen, VentaPorGrupo } from "../../../services/reportesService";
import ReactApexChart from "react-apexcharts";

const formatCurrency = (value: number | undefined) => 
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

const formatNumber = (value: number | undefined) => 
  new Intl.NumberFormat('es-MX').format(value || 0);

interface ReportesArticulosProps {
  fechaInicio: string;
  fechaFin: string;
}

export default function ReportesArticulos({ fechaInicio, fechaFin }: ReportesArticulosProps) {
  const [loading, setLoading] = useState(true);
  const [topProductos, setTopProductos] = useState<TopProducto[]>([]);
  const [ventasAlmacen, setVentasAlmacen] = useState<VentaPorAlmacen[]>([]);
  const [ventasPorGrupo, setVentasPorGrupo] = useState<VentaPorGrupo[]>([]);

  useEffect(() => {
    cargarDatos();
  }, [fechaInicio, fechaFin]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [productosData, almacenData, grupoData] = await Promise.all([
        getReportesService.getTopProductos(20, fechaInicio, fechaFin),
        getReportesService.getVentasPorAlmacen(fechaInicio, fechaFin),
        getReportesService.getVentasPorGrupo(fechaInicio, fechaFin)
      ]);

      setTopProductos(productosData || []);
      setVentasAlmacen(almacenData || []);
      setVentasPorGrupo(grupoData || []);
    } catch (error) {
      console.error("Error cargando reportes de artículos:", error);
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
          <h3 className="text-lg font-semibold mb-4">Top 20 Productos Más Vendidos</h3>
          {topProductos.length > 0 ? (
            <ReactApexChart 
              options={{
                chart: { type: 'bar', height: 350 },
                plotOptions: { bar: { borderRadius: 4, horizontal: true } },
                colors: ['#f59e0b'],
                dataLabels: { enabled: false },
                xaxis: { categories: topProductos.map(p => p.dscription?.substring(0, 20) || 'N/A') }
              }} 
              series={[{ name: 'Ventas', data: topProductos.map(p => Number((p.totalVenta || 0).toFixed(2)))}]} 
              type="bar" 
              height={300} 
            />
          ) : (
            <p className="text-center text-gray-500 py-10">No hay datos de productos</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Ventas por Almacén</h3>
          {ventasAlmacen.length > 0 ? (
            <ReactApexChart 
              options={{
                chart: { type: 'donut' },
                colors: ['#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#ec4899'],
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
        <h3 className="text-lg font-semibold mb-4">Ventas por Marca/Grupo</h3>
        {ventasPorGrupo.length > 0 ? (
          <ReactApexChart 
            options={{
              chart: { type: 'bar', height: 350 },
              plotOptions: { bar: { borderRadius: 4 } },
              colors: ['#10b981'],
              dataLabels: { enabled: false },
              xaxis: { categories: ventasPorGrupo.map(g => g.ItmsGrpNam) }
            }} 
            series={[{ name: 'Ventas', data: ventasPorGrupo.map(g => Number((g.TotalVenta || 0).toFixed(2)))}]} 
            type="bar" 
            height={300} 
          />
        ) : (
          <p className="text-center text-gray-500 py-10">No hay datos de grupos</p>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Detalle de Productos</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Código</th>
              <th className="px-3 py-2 text-left">Producto</th>
              <th className="px-3 py-2 text-right">Cantidad</th>
              <th className="px-3 py-2 text-right">Ventas</th>
            </tr>
          </thead>
          <tbody>
            {topProductos.map((p, i) => (
              <tr key={i} className="border-t dark:border-gray-700">
                <td className="px-3 py-2">{p.itemCode || 'N/A'}</td>
                <td className="px-3 py-2 truncate max-w-xs">{p.dscription || 'N/A'}</td>
                <td className="px-3 py-2 text-right">{formatNumber(p.cantidad)}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(p.totalVenta)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
