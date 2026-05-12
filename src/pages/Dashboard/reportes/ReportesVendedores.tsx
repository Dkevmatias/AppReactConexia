import { useEffect, useMemo, useState } from "react";
import {
  getReportesService,
  VentaPorMarca,
  VentaPorVendedorMarca,
  TopCliente,
} from "../../../services/reportesService";
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
  // const [ventasAlmacen, setVentasAlmacen] = useState<VentaPorAlmacen[]>([]);
  const [ventasMarcaDetalle, setVentasMarcaDetalle] = useState<
    VentaPorVendedorMarca[]
  >([]);
  const [ventasMarca, setVentasMarca] = useState<VentaPorMarca[]>([]);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);

  const totalesMarcaDetalle = useMemo(() => {
    return ventasMarcaDetalle.reduce(
      (acc, row) => ({
        ulkp: acc.ulkp + (Number(row.ulkp) || 0),
        pesos: acc.pesos + (Number(row.pesos) || 0),
      }),
      { ulkp: 0, pesos: 0 },
    );
  }, [ventasMarcaDetalle]);

  const totalesMarca = useMemo(() => {
    return ventasMarca.reduce(
      (acc, row) => ({
        ulkp: acc.ulkp + (Number(row.ulkp) || 0),
        pesos: acc.pesos + (Number(row.pesos) || 0),
      }),
      { ulkp: 0, pesos: 0 },
    );
  }, [ventasMarca]);

  const totalesTopClientes = useMemo(() => {
    return topClientes.reduce(
      (acc, row) => ({
        documentos: acc.documentos + (Number(row.documentos) || 0),
        ventas: acc.ventas + (Number(row.totalVenta) || 0),
      }),
      { documentos: 0, ventas: 0 },
    );
  }, [topClientes]);

  useEffect(() => {
    let cancelled = false;

    const cargarDatos = async () => {
      setLoading(true);
      try {
        const [marcaData, marcaDetalleData, clientesData] = await Promise.all([
          getReportesService.getVentasPorMarca(
            fechaInicio,
            fechaFin,
            username ?? undefined,
            firmCode,
          ),
          getReportesService.getVentasPorVendedorMarca(
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

        /*
        Ventas por Almacén (endpoint getVentasPorAlmacen) — oculto temporalmente:
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
        */

        if (!cancelled) {
          // setVentasAlmacen(almacenData ?? []);
          setVentasMarcaDetalle(marcaDetalleData ?? []);
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
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/80 font-semibold">
                  <td className="px-3 py-2 text-left">Total</td>
                  <td className="px-3 py-2 text-right">
                    {formatNumber(totalesMarca.ulkp)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(totalesMarca.pesos)}
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No hay datos de marcas
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">
            Ventas por Marca Detallada
          </h3>
          {ventasMarcaDetalle.length > 0 ? (
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left">Vendedor</th>
                    <th className="px-3 py-2 text-right">ULKP</th>
                    <th className="px-3 py-2 text-right">Pesos</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasMarcaDetalle.map((row, idx) => (
                    <tr
                      key={`${row.vendedor}-${idx}`}
                      className="border-t dark:border-gray-700"
                    >
                      <td className="px-3 py-2">{row.vendedor || "N/A"}</td>
                      <td className="px-3 py-2 text-right">
                        {formatNumber(row.ulkp)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(row.pesos)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/80 font-semibold sticky bottom-0">
                    <td className="px-3 py-2 text-left">Total</td>
                    <td className="px-3 py-2 text-right">
                      {formatNumber(totalesMarcaDetalle.ulkp)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(totalesMarcaDetalle.pesos)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No hay datos del detalle por marca
            </p>
          )}
        </div>

        {/*
        Ventas por Almacén — oculto temporalmente (donut + getVentasPorAlmacen):
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
        */}
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
          {topClientes.length > 0 ? (
            <tfoot>
              <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/80 font-semibold">
                <td className="px-3 py-2 text-left">Total</td>
                <td className="px-3 py-2 text-right">
                  {formatNumber(totalesTopClientes.documentos)}
                </td>
                <td className="px-3 py-2 text-right">
                  {formatCurrency(totalesTopClientes.ventas)}
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </div>
  );
}
