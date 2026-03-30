import { useEffect, useState } from "react";
import {
  getReportesService,
  VentaPorAlmacen,
  TopCliente,
  VentaPorMarca,
} from "../../../services/reportesService";
import ReactApexChart from "react-apexcharts";
import { formatCurrency, formatNumber } from "../../../utils/format";

interface ReportesVendedoresProps {
  fechaInicio: string;
  fechaFin: string;
  añoComparar: number;
  username: string | null;
  firmCode: number | null;
}

export default function ReportesVendedores({
  fechaInicio,
  fechaFin,
  username,
  firmCode,
}: ReportesVendedoresProps) {
  const [loading, setLoading] = useState(true);
  const [ventasAlmacen, setVentasAlmacen] = useState<VentaPorAlmacen[]>([]);
  const [ventasMarca, setVentasMarca] = useState<VentaPorMarca[]>([]);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);

  useEffect(() => {
    let cancelled = false;

    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [almacenData, marcaData, clientesData] = await Promise.all([
          getReportesService.getVentasPorAlmacen(fechaInicio, fechaFin),
          getReportesService.getVentasPorMarca(
            fechaInicio,
            fechaFin,
            username ?? undefined,
            firmCode,
          ),
          getReportesService.getTopClientesVendedor(
            10,
            fechaInicio,
            fechaFin,
            username ?? undefined,
          ),
        ]);

        console.log("Marca Data:", marcaData);

        if (!cancelled) {
          setVentasAlmacen(almacenData ?? []);
          setVentasMarca(marcaData ?? []);
          setTopClientes(clientesData ?? []);
        }
      } catch (error) {
        console.error("Error cargando reportes de vendedores:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    cargarDatos();
    return () => {
      cancelled = true;
    };
  }, [fechaInicio, fechaFin, username, firmCode]);

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
                {ventasMarca.map((m) => (
                  <tr key={m.marca} className="border-t dark:border-gray-700">
                    <td className="px-3 py-2">{m.marca || "N/A"}</td>
                    <td className="px-3 py-2 text-right">
                      {formatNumber(m.ulkp)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(m.pesos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No hay datos de marcas
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Ventas por Almacén</h3>
          {ventasAlmacen.length > 0 ? (
            <ReactApexChart
              options={{
                chart: { type: "donut" },
                colors: ["#8b5cf6", "#f59e0b", "#ef4444", "#10b981", "#3b82f6"],
                labels: ventasAlmacen.map((a) => a.whsCode),
                legend: { position: "bottom" },
                dataLabels: { enabled: true },
              }}
              series={ventasAlmacen.map((a) =>
                Number((a.totalVenta || 0).toFixed(2)),
              )}
              type="donut"
              height={300}
            />
          ) : (
            <p className="text-center text-gray-500 py-10">
              No hay datos de almacenes
            </p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">
          Top 10 Clientes por Ventas
        </h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 py-2 text-left">Cliente</th>
              <th className="px-3 py-2 text-right">Documentos</th>
              <th className="px-3 py-2 text-right">Ventas</th>
            </tr>
          </thead>
          <tbody>
            {topClientes.map((c) => (
              <tr key={c.cardCode} className="border-t dark:border-gray-700">
                <td className="px-3 py-2">{c.cardName || "N/A"}</td>
                <td className="px-3 py-2 text-right">
                  {formatNumber(c.documentos)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(c.totalVenta)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
