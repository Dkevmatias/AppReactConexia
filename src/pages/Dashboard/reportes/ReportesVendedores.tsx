import { useEffect, useMemo, useState } from "react";
import {
  getReportesService,
  VentaPorVendedorMarca,
  TopCliente,
  CumplimientoObjetivoFila,
  TipoMetricaCumplimiento,
} from "../../../services/reportesService";
import { formatCurrency, formatNumber } from "../../../utils/format";

interface ReportesVendedoresProps {
  fechaInicio: string;
  fechaFin: string;
  añoComparar: number;
  username: string | null;
  firmName: string | null;
}

const formatMetrica = (value: number, tipoMetrica: TipoMetricaCumplimiento) =>
  tipoMetrica === "pesos" ? formatCurrency(value) : formatNumber(value);

const getColorCobertura = (cobertura: number) => {
  if (cobertura >= 100) return "text-green-600";
  if (cobertura >= 90) return "text-yellow-600";
  return "text-red-600";
};

export default function ReportesVendedores({
  fechaInicio,
  fechaFin,
  username,
  firmName,
}: ReportesVendedoresProps) {
  const [loading, setLoading] = useState(true);
  const [tipoMetrica, setTipoMetrica] =
    useState<TipoMetricaCumplimiento>("ulkp");
  const [cumplimientoMarca, setCumplimientoMarca] = useState<
    CumplimientoObjetivoFila[]
  >([]);
  // const [ventasAlmacen, setVentasAlmacen] = useState<VentaPorAlmacen[]>([]);
  const [ventasMarcaDetalle, setVentasMarcaDetalle] = useState<
    VentaPorVendedorMarca[]
  >([]);
  // Reporte anterior — conservado para reutilizar en el futuro
  // const [ventasMarca, setVentasMarca] = useState<VentaPorMarca[]>([]);
  const [topClientes, setTopClientes] = useState<TopCliente[]>([]);

  const totalesCumplimientoMarca = useMemo(() => {
    return cumplimientoMarca.reduce(
      (acc, row) => ({
        objetivo: acc.objetivo + (Number(row.objetivo) || 0),
        ventaReal: acc.ventaReal + (Number(row.ventaReal) || 0),
        diferencia: acc.diferencia + (Number(row.diferencia) || 0),
      }),
      { objetivo: 0, ventaReal: 0, diferencia: 0 },
    );
  }, [cumplimientoMarca]);

  const coberturaTotal = useMemo(() => {
    if (totalesCumplimientoMarca.objetivo <= 0) return 0;
    return (
      (totalesCumplimientoMarca.ventaReal / totalesCumplimientoMarca.objetivo) *
      100
    );
  }, [totalesCumplimientoMarca]);

  const totalesMarcaDetalle = useMemo(() => {
    return ventasMarcaDetalle.reduce(
      (acc, row) => ({
        ulkp: acc.ulkp + (Number(row.ulkp) || 0),
        pesos: acc.pesos + (Number(row.pesos) || 0),
      }),
      { ulkp: 0, pesos: 0 },
    );
  }, [ventasMarcaDetalle]);

  /*
  const totalesMarca = useMemo(() => {
    return ventasMarca.reduce(
      (acc, row) => ({
        ulkp: acc.ulkp + (Number(row.ulkp) || 0),
        pesos: acc.pesos + (Number(row.pesos) || 0),
      }),
      { ulkp: 0, pesos: 0 },
    );
  }, [ventasMarca]);
  */

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
        const [cumplimientoData, marcaDetalleData, clientesData] =
          await Promise.all([
            getReportesService.getCumplimientoObjetivosPorMarca(
              fechaInicio,
              fechaFin,
              {
                slpName: username ?? undefined,
                firmName: firmName ?? undefined,
                tipoMetrica,
                agruparPorVendedor: false,
              },
            ),
            getReportesService.getVentasPorVendedorMarca(
              fechaInicio,
              fechaFin,
              username ?? undefined,
              firmName ?? undefined,
            ),
            getReportesService.getTopClientesVendedor(
              10,
              fechaInicio,
              fechaFin,
              username ?? undefined,
              firmName ?? undefined,
            ),
          ]);

        /*
        Reporte anterior Ventas por Marca (getVentasPorMarca):
        const [marcaData, marcaDetalleData, clientesData] = await Promise.all([
          getReportesService.getVentasPorMarca(
            fechaInicio,
            fechaFin,
            username ?? undefined,
            firmName ?? undefined,
          ),
          ...
        ]);
        */

        if (!cancelled) {
          setCumplimientoMarca(cumplimientoData?.filas ?? []);
          setVentasMarcaDetalle(marcaDetalleData ?? []);
          // setVentasMarca(marcaData ?? []);
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
  }, [fechaInicio, fechaFin, username, firmName, tipoMetrica]);

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
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold">
              Cumplimiento de objetivos por marca
            </h3>
            <div className="flex items-center gap-2">
              <label
                htmlFor="tipo-metrica-marca"
                className="text-sm text-gray-500 dark:text-gray-400"
              >
                Métrica
              </label>
              <select
                id="tipo-metrica-marca"
                value={tipoMetrica}
                onChange={(e) =>
                  setTipoMetrica(e.target.value as TipoMetricaCumplimiento)
                }
                className="px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="ulkp">ULKP</option>
                <option value="pesos">Pesos</option>
              </select>
            </div>
          </div>
          {cumplimientoMarca.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Marca</th>
                  <th className="px-3 py-2 text-right">Objetivo</th>
                  <th className="px-3 py-2 text-right">Venta real</th>
                  <th className="px-3 py-2 text-right">Diferencia</th>
                  <th className="px-3 py-2 text-right">Cobertura</th>
                </tr>
              </thead>
              <tbody>
                {cumplimientoMarca.map((row) => (
                  <tr
                    key={`${row.firmCode}-${row.marca}`}
                    className="border-t dark:border-gray-700"
                  >
                    <td className="px-3 py-2">{row.marca || "N/A"}</td>
                    <td className="px-3 py-2 text-right">
                      {formatMetrica(row.objetivo, tipoMetrica)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {formatMetrica(row.ventaReal, tipoMetrica)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right ${
                        row.diferencia >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatMetrica(row.diferencia, tipoMetrica)}
                    </td>
                    <td
                      className={`px-3 py-2 text-right font-medium ${getColorCobertura(row.cobertura)}`}
                    >
                      {row.cobertura.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700/80 font-semibold">
                  <td className="px-3 py-2 text-left">Total</td>
                  <td className="px-3 py-2 text-right">
                    {formatMetrica(
                      totalesCumplimientoMarca.objetivo,
                      tipoMetrica,
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatMetrica(
                      totalesCumplimientoMarca.ventaReal,
                      tipoMetrica,
                    )}
                  </td>
                  <td
                    className={`px-3 py-2 text-right ${
                      totalesCumplimientoMarca.diferencia >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatMetrica(
                      totalesCumplimientoMarca.diferencia,
                      tipoMetrica,
                    )}
                  </td>
                  <td
                    className={`px-3 py-2 text-right ${getColorCobertura(coberturaTotal)}`}
                  >
                    {coberturaTotal.toFixed(1)}%
                  </td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-10">
              No hay datos de cumplimiento por marca
            </p>
          )}
        </div>

        {/*
        Reporte anterior — Ventas por Marca (getVentasPorMarca):
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
        */}

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
          ...
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
