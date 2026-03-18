import { useEffect, useState } from "react";
import { getReportesService, ResumenVentas, VentaPorAlmacen, VentaPorMarca, TopCliente, TopProducto } from "../../../services/reportesService";
import ReactApexChart from "react-apexcharts";

const formatCurrency = (value: number | undefined) => 
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

const formatNumber = (value: number | undefined) => 
  new Intl.NumberFormat('es-MX').format(value || 0);

interface ReportesDashboardProps {
  fechaInicio: string;
  fechaFin: string;
  añoComparar: number;
}

export default function ReportesDashboard({ fechaInicio, fechaFin, añoComparar }: ReportesDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [resumen, setResumen] = useState<ResumenVentas | null>(null);
  const [ventasAñoAnterior, setVentasAñoAnterior] = useState<number>(0);
  const [ventasAlmacen, setVentasAlmacen] = useState<VentaPorAlmacen[]>([]);
  const [ventasMarca, setVentasMarca] = useState<VentaPorMarca[]>([]);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);
  const [topProductos, setTopProductos] = useState<TopProducto[]>([]);

  const ventasActuales = resumen?.ventasNetas || 0;
  const porcentajeCobertura = ventasAñoAnterior > 0 
    ? ((ventasActuales - ventasAñoAnterior) / ventasAñoAnterior) * 100 
    : 0;
  
  const getColorCobertura = () => {
    if (porcentajeCobertura >= 0) return 'text-green-600';
    if (porcentajeCobertura >= -10) return 'text-yellow-600';
    return 'text-red-600';
  };

  useEffect(() => {
    cargarDatos();
  }, [fechaInicio, fechaFin, añoComparar]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resumenData, almacenData, marcaData, clientesData, productosData] = await Promise.all([
        getReportesService.getResumenVentas(fechaInicio, fechaFin),
        getReportesService.getVentasPorAlmacen(fechaInicio, fechaFin),
        getReportesService.getVentasPorMarca(fechaInicio, fechaFin),
        getReportesService.getTopClientes(10, fechaInicio, fechaFin),
        getReportesService.getTopProductos(10, fechaInicio, fechaFin)
      ]);

      setResumen(resumenData);
      // TODO: Agregar endpoint de ventas año anterior
      // const ventasAnioAnterior = await getReportesService.getVentasAñoAnterior(fechaInicio, fechaFin, añoComparar);
      // setVentasAñoAnterior(ventasAnioAnterior);
      setVentasAlmacen(almacenData || []);
      setVentasMarca(marcaData || []);
      setTopClientes(clientesData || []);
      setTopProductos(productosData || []);
    } catch (error) {
      console.error("Error cargando dashboard:", error);
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Ventas Año {añoComparar}</p>
          <p className="text-2xl font-bold text-gray-600">{formatCurrency(ventasAñoAnterior)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Ventas Netas ({new Date().getFullYear()})</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(ventasActuales)}</p>
        </div>
        <div className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow`}>
          <p className="text-sm text-gray-500">% Cobertura vs {añoComparar}</p>
          <p className={`text-2xl font-bold ${getColorCobertura()}`}>
            {porcentajeCobertura >= 0 ? '+' : ''}{porcentajeCobertura.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Documentos</p>
          <p className="text-2xl font-bold text-blue-600">{formatNumber(resumen?.totalDocumentos)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Clientes Únicos</p>
          <p className="text-2xl font-bold text-purple-600">{formatNumber(resumen?.clientesUnicos)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Ticket Promedio</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(resumen?.ticketPromedio)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Ventas por Marca</h3>
          {ventasMarca.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Marca</th>
                  <th className="px-3 py-2 text-right">ULKP</th>
                  <th className="px-3 py-2 text-right">Pesos</th>
                </tr>
              </thead>
              <tbody>
                {ventasMarca.map((m, i) => (
                  <tr key={i} className="border-t dark:border-gray-700">
                    <td className="px-3 py-2">{m.marca || 'N/A'}</td>
                    <td className="px-3 py-2 text-right">{formatNumber(m.ulkp)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(m.pesos)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-10">No hay datos de marcas</p>
          )}
        </div>
           
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Ventas por Almacén</h3>
          {ventasAlmacen.length > 0 ? (
            <ReactApexChart 
              options={{
                chart: { type: 'bar', height: 350 },
                plotOptions: { bar: { borderRadius: 4 } },
                colors: ['#8b5cf6', '#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
                dataLabels: { enabled: false },
                xaxis: { categories: ventasAlmacen.map(a => a.whsCode) },
                legend: { position: 'bottom' },
              }} 
              series={[{ name: 'Ventas', data: ventasAlmacen.map(a => Number((a.totalVenta || 0).toFixed(2)))}]} 
              type="bar" 
              height={300} 
            />
          ) : (
            <p className="text-center text-gray-500 py-10">No hay datos de almacenes</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 10 Clientes</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Cliente</th>
                <th className="px-3 py-2 text-right">Ventas</th>
              </tr>
            </thead>
            <tbody>
              {topClientes.map((c, i) => (
                <tr key={i} className="border-t dark:border-gray-700">
                  <td className="px-3 py-2">{c.cardName || 'N/A'}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(c.totalVenta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 10 Productos</h3>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Producto</th>
                <th className="px-3 py-2 text-right">Cantidad</th>
                <th className="px-3 py-2 text-right">Ventas</th>
              </tr>
            </thead>
            <tbody>
              {topProductos.map((p, i) => (
                <tr key={i} className="border-t dark:border-gray-700">
                  <td className="px-3 py-2 truncate max-w-xs">{p.dscription || 'N/A'}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(p.cantidad)}</td>
                  <td className="px-3 py-2 text-right">{formatCurrency(p.totalVenta)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        {/* 
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Ventas por Vendedor</h3>
          {ventasVendedor.length > 0 ? (
            <ReactApexChart 
              options={{
                chart: { type: 'bar', height: 350 },
                plotOptions: { bar: { borderRadius: 4 } },
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
      </div>*/}
      
    </div>
  );
}
