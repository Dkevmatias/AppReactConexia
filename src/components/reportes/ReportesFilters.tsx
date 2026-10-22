import { useState, useEffect, useMemo } from "react";
import {
  getReportesService,
  Marca,
  TipoMetricaCumplimiento,
  Vendedor,
} from "../../services/reportesService";
import BasicDatePicker from "../ui/datepicker/datepicker";

interface ReportesFiltersProps {
  fechaInicio: string;
  fechaFin: string;
  añoComparar: number;
  vendedorSeleccionado: number | null;
  /** firmName de la marca seleccionada (no idMarca) */
  firmNameSeleccionado: string | null;
  tipoMetrica: TipoMetricaCumplimiento;
  onTipoMetricaChange: (value: TipoMetricaCumplimiento) => void;
  onFechaInicioChange: (value: string) => void;
  onFechaFinChange: (value: string) => void;
  onAñoCompararChange: (value: number) => void;
  onVendedorChange: (value: number | null, nombre: string | null) => void;
  onMarcaChange: (firmName: string | null) => void;
  onFilter: () => void;
  bloquearVendedor?: boolean;
  vendedorSesion?: {
    idUsuario: number;
    username: string;
    nombre: string;
  } | null;
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
  tipoMetrica,
  onTipoMetricaChange,
  onFechaInicioChange,
  onFechaFinChange,
  onAñoCompararChange,
  onVendedorChange,
  onMarcaChange,
  onFilter,
  bloquearVendedor = false,
  vendedorSesion = null,
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
    if (!bloquearVendedor) {
      setTempVendedor(vendedorSeleccionado);
    }
    setTempFirmName(firmNameSeleccionado);
  }, [
    fechaInicio,
    fechaFin,
    añoComparar,
    vendedorSeleccionado,
    firmNameSeleccionado,
    bloquearVendedor,
  ]);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [vendedoresData, marcasData] = await Promise.all([
          getReportesService.getVendedores(),
          getReportesService.getMarcas(),
        ]);
        const lista = vendedoresData || [];
        setVendedores(lista);
        setMarcas(marcasData || []);
      } catch (error) {
        console.error("Error cargando datos:", error);
      } finally {
        setLoadingVendedores(false);
      }
    };
    cargarDatos();
  }, []);

  const vendedoresOpciones = useMemo(() => {
    if (!bloquearVendedor || !vendedorSesion) return vendedores;
    const id = vendedorSesion.idUsuario;
    const username = (vendedorSesion.username ?? "").trim().toLowerCase();
    const nombre = (vendedorSesion.nombre ?? "").trim().toLowerCase();
    const filtrados = vendedores.filter((v) => {
      if (id > 0 && v.idUsuario === id) return true;
      const claveUser = (v.username ?? "").trim().toLowerCase();
      const claveSlp = (v.slpName ?? "").trim().toLowerCase();
      const claveNombre = (v.nombre ?? "").trim().toLowerCase();
      return (
        (username &&
          (claveUser === username ||
            claveSlp === username ||
            claveNombre === username)) ||
        (nombre &&
          (claveUser === nombre || claveSlp === nombre || claveNombre === nombre))
      );
    });
    if (filtrados.length > 0) return filtrados;
    if (!username && !nombre) return [];
    return [
      {
        idUsuario: id > 0 ? id : 0,
        nombre: vendedorSesion.nombre || vendedorSesion.username,
        username: vendedorSesion.username,
        slpName: vendedorSesion.username,
        email: "",
        idRol: 0,
        idPersona: 0,
        cardCode: "",
      } satisfies Vendedor,
    ];
  }, [bloquearVendedor, vendedorSesion, vendedores]);

  useEffect(() => {
    if (!bloquearVendedor || vendedoresOpciones.length === 0) return;
    const unico = vendedoresOpciones[0];
    const id = unico.idUsuario ?? null;
    if (id !== tempVendedor) {
      setTempVendedor(id);
    }
    const clave = unico.slpName || unico.username || unico.nombre;
    if (clave) {
      onVendedorChange(id, clave);
    }
    // onVendedorChange se recrea en cada render del padre; no debe ir en deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bloquearVendedor, vendedoresOpciones, tempVendedor]);

  const handleFilter = () => {
    const vendedor =
      vendedoresOpciones.find((v) => v.idUsuario === tempVendedor) ??
      vendedores.find((v) => v.idUsuario === tempVendedor);
    let nombreVendedor = vendedor
      ? (vendedor.slpName || vendedor.username || vendedor.nombre)
      : null;
    if (bloquearVendedor && !nombreVendedor) {
      nombreVendedor =
        vendedorSesion?.username || vendedorSesion?.nombre || null;
    }
    onFechaInicioChange(tempFechaInicio);
    onFechaFinChange(tempFechaFin);
    onAñoCompararChange(tempAñoComparar);
    onVendedorChange(tempVendedor, nombreVendedor);
    onMarcaChange(tempFirmName);
    onFilter();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
      <div className="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-end sm:gap-4">
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Inicio
          </label>
          <BasicDatePicker
            compact={false}
            value={tempFechaInicio}
            onChange={setTempFechaInicio}
            className="w-full"
          />
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fecha Fin
          </label>
          <BasicDatePicker
            compact={false}
            value={tempFechaFin}
            onChange={setTempFechaFin}
            className="w-full"
          />
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Comparar con Año
          </label>
          <select
            value={tempAñoComparar}
            onChange={(e) => setTempAñoComparar(Number(e.target.value))}
            className="w-full min-h-[40px] px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 sm:w-auto"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Vendedor
          </label>
          <select
            value={tempVendedor ?? ""}
            onChange={(e) =>
              setTempVendedor(e.target.value ? Number(e.target.value) : null)
            }
            disabled={loadingVendedores || bloquearVendedor}
            className="w-full min-h-[40px] px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 sm:min-w-[180px] disabled:cursor-not-allowed disabled:opacity-80"
          >
            {bloquearVendedor ? null : (
              <option value="">Todos los vendedores</option>
            )}
            {vendedoresOpciones.map((v) => (
              <option key={v.idUsuario || v.username} value={v.idUsuario}>
                {v.nombre || v.slpName || v.username}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Marca
          </label>
          <select
            value={tempFirmName ?? ""}
            onChange={(e) => setTempFirmName(e.target.value || null)}
            className="w-full min-h-[40px] px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 sm:min-w-[180px]"
          >
            <option value="">Todas las marcas</option>
            {marcas.map((m) => (
              <option key={m.firmCode} value={m.firmName}>
                {m.firmName}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-0 w-full sm:w-auto">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Métrica
          </label>
          <select
            value={tipoMetrica}
            onChange={(e) =>
              onTipoMetricaChange(e.target.value as TipoMetricaCumplimiento)
            }
            className="w-full min-h-[40px] px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 sm:min-w-[120px]"
          >
            <option value="pesos">Pesos</option>
            <option value="ulkp">ULKP</option>
          </select>
        </div>
        <button
          onClick={handleFilter}
          className="w-full min-h-[40px] px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 sm:w-auto"
        >
          Filtrar
        </button>
      </div>
    </div>
  );
}
