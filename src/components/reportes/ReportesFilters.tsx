import { useState, useEffect } from "react";

interface ReportesFiltersProps {
  fechaInicio: string;
  fechaFin: string;
  añoComparar: number;
  onFechaInicioChange: (value: string) => void;
  onFechaFinChange: (value: string) => void;
  onAñoCompararChange: (value: number) => void;
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
  onFechaInicioChange,
  onFechaFinChange,
  onAñoCompararChange,
  onFilter,
}: ReportesFiltersProps) {
  const [tempFechaInicio, setTempFechaInicio] = useState(fechaInicio);
  const [tempFechaFin, setTempFechaFin] = useState(fechaFin);
  const [tempAñoComparar, setTempAñoComparar] = useState(añoComparar);
  const years = getYears();

  useEffect(() => {
    setTempFechaInicio(fechaInicio);
    setTempFechaFin(fechaFin);
    setTempAñoComparar(añoComparar);
  }, [fechaInicio, fechaFin, añoComparar]);

  const handleFilter = () => {
    onFechaInicioChange(tempFechaInicio);
    onFechaFinChange(tempFechaFin);
    onAñoCompararChange(tempAñoComparar);
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
