import { useState, useEffect } from "react";
import {
  getReportesService,
  Marca,
  Vendedor,
} from "../../services/reportesService";

interface ReportesFiltersProps {
  fechaInicio: string;
  fechaFin: string;
  añoComparar: number;
  vendedorSeleccionado: number | null;
  /** firmName de la marca seleccionada (no idMarca) */
  firmNameSeleccionado: string | null;
  onFechaInicioChange: (value: string) => void;
  onFechaFinChange: (value: string) => void;
  onAñoCompararChange: (value: number) => void;
  onVendedorChange: (value: number | null, nombre: string | null) => void;
  onMarcaChange: (firmName: string | null) => void;
  onFilter: () => void;
}

const getYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }
  return years;
};

export default function ReportesFilters({
  fechaInicio,
  fechaFin,
  añoComparar,
  vendedorSeleccionado,
  firmNameSeleccionado,
  onFechaInicioChange,
  onFechaFinChange,
  onAñoCompararChange,
  onVendedorChange,
  onMarcaChange,
  onFilter,
}: ReportesFiltersProps) {
  const [tempFechaInicio, setTempFechaInicio] = useState(fechaInicio);
  const [tempFechaFin, setTempFechaFin] = useState(fechaFin);
  const [tempAñoComparar, setTempAñoComparar] = useState(añoComparar);
  const [tempVendedor, setTempVendedor] = useState<number | null>(
    vendedorSeleccionado,
  );
  const [tempFirmName, setTempFirmName] = useState<string | null>(
    firmNameSeleccionado,
  );
  const [vendedores, setVendedores] = useState<Vendedor[]>([]);
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [loadingVendedores, setLoadingVendedores] = useState(true);
  const years = getYears();

  useEffect(() => {
    setTempFechaInicio(fechaInicio);
    setTempFechaFin(fechaFin);
    setTempAñoComparar(añoComparar);
    setTempVendedor(vendedorSeleccionado);
    setTempFirmName(firmNameSeleccionado);
  }, [
    fechaInicio,
    fechaFin,
    añoComparar,
    vendedorSeleccionado,
    firmNameSeleccionado,
  ]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [vendedoresData, marcasData] = await Promise.all([
          getReportesService.getVendedores(),
          getReportesService.getMarcas(),
        ]);
        setVendedores(vendedoresData || []);
        setMarcas(marcasData || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoadingVendedores(false);
      }
    };
    cargarDatos();
  }, []);

  const handleFilter = () => {
    const vendedor = vendedores.find((v) => v.idUsuario === tempVendedor);
    const nombreVendedor = vendedor
      ? (vendedor.slpName ?? vendedor.username)
      : null;
    onFechaInicioChange(tempFechaInicio);
    onFechaFinChange(tempFechaFin);
    onAñoCompararChange(tempAñoComparar);
    onVendedorChange(tempVendedor, nombreVendedor);
    onMarcaChange(tempFirmName);
    onFilter();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Inicio
          </label>
          <input
            type="date"
            value={tempFechaInicio}
            onChange={(e) => setTempFechaInicio(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Fin
          </label>
          <input
            type="date"
            value={tempFechaFin}
            onChange={(e) => setTempFechaFin(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Comparar con Año
          </label>
          <select
            value={tempAñoComparar}
            onChange={(e) => setTempAñoComparar(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vendedor
          </label>
          <select
            value={tempVendedor ?? ""}
            onChange={(e) =>
              setTempVendedor(e.target.value ? Number(e.target.value) : null)
            }
            disabled={loadingVendedores}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 min-w-[180px]"
          >
            <option value="">Todos los vendedores</option>
            {vendedores.map((v) => (
              <option key={v.idUsuario} value={v.idUsuario}>
                {v.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Marca
          </label>
          <select
            value={tempFirmName ?? ""}
            onChange={(e) => setTempFirmName(e.target.value || null)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 min-w-[180px]"
          >
            <option value="">Todas las marcas</option>
            {marcas.map((m) => (
              <option key={m.firmCode} value={m.firmName}>
                {m.firmName}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleFilter}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Filtrar
        </button>
      </div>
    </div>
  );
}
