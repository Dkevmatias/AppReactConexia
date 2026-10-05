import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Plus, Trash2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../hooks/useAuth";
import {
  bitacoraCobranzaService,
  BitacoraCobranza,
  claseBadgeEstatusBitacora,
  etiquetaEstatusBitacora,
  Sucursal,
} from "../../services/bitacoraCobranzaService";
import { rutasService, Ruta } from "../../services/rutasService";
import {
  getReportesService,
  Vendedores,
} from "../../services/reportesService";
import { useListadoOperacionesPermisos } from "../../hooks/useListadoOperacionesPermisos";

const inputClass =
  "rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

function formatearFecha(valor: string | number | null | undefined): string {
  if (valor == null || valor === "") return "—";
  if (typeof valor === "number") {
    const d = new Date(valor);
    return Number.isNaN(d.getTime())
      ? String(valor)
      : d.toLocaleString("es-MX");
  }
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleString("es-MX");
}

export default function ListaBitacorasCobranza() {
  const { user } = useAuth();
  const { menuLoading, puedeVerSucursalCobranza } =
    useListadoOperacionesPermisos();
  const [bitacoras, setBitacoras] = useState<BitacoraCobranza[]>([]);
  const [vendedores, setVendedores] = useState<Vendedores[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroVendedor, setFiltroVendedor] = useState<number | "">("");
  const [filtroRuta, setFiltroRuta] = useState<number | "">("");
  const [filtroSucursal, setFiltroSucursal] = useState<number | "">("");

  const mapaVendedores = useMemo(() => {
    const m = new Map<number, string>();
    for (const v of vendedores) {
      m.set(v.idVendedor, v.nombre);
    }
    return m;
  }, [vendedores]);

  const mapaRutas = useMemo(() => {
    const m = new Map<number, string>();
    for (const r of rutas) {
      m.set(r.idRuta, r.codigo);
    }
    return m;
  }, [rutas]);

  const cargar = useCallback(async () => {
    if (!user?.idPersona) {
      setBitacoras([]);
      setError("No hay sesión de usuario para cargar sus bitácoras.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [listaBase, vendedoresData, sucursalesData, rutasData] =
        await Promise.all([
          puedeVerSucursalCobranza
            ? bitacoraCobranzaService.getBitacoras()
            : bitacoraCobranzaService.getBitacorasPorUsuario(
                user.idPersona,
                true,
              ),
          getReportesService.getVendedoresPrizma(),
          puedeVerSucursalCobranza
            ? bitacoraCobranzaService.getSucursales()
            : Promise.resolve([] as Sucursal[]),
          rutasService.getRutas(),
        ]);

      let lista = listaBase;
      if (filtroVendedor) {
        lista = lista.filter((b) => b.idVendedor === filtroVendedor);
      }
      if (filtroRuta) {
        lista = lista.filter((b) => b.idRuta === filtroRuta);
      }
      if (puedeVerSucursalCobranza && filtroSucursal) {
        lista = lista.filter((b) => b.idSucursal === filtroSucursal);
      }

      setBitacoras(lista);
      setVendedores(vendedoresData ?? []);
      setRutas(rutasData ?? []);
      setSucursales(sucursalesData ?? []);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las bitácoras.",
      );
    } finally {
      setLoading(false);
    }
  }, [
    user?.idPersona,
    filtroVendedor,
    filtroRuta,
    filtroSucursal,
    puedeVerSucursalCobranza,
  ]);

  useEffect(() => {
    if (menuLoading) return;
    void cargar();
  }, [cargar, menuLoading]);

  const eliminar = async (row: BitacoraCobranza) => {
    const folioLabel =
      row.folio != null && row.folio > 0
        ? `folio ${row.folio}`
        : `#${row.idBitacora}`;
    if (!window.confirm(`¿Eliminar la bitácora ${folioLabel}?`)) return;
    try {
      await bitacoraCobranzaService.eliminarBitacora(row.idBitacora);
      await cargar();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageMeta
        title="Lista de Bitácoras de Cobranza"
        description="Consulte y administre las bitácoras de cobranza generadas."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Lista de Bitácoras de Cobranza
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {puedeVerSucursalCobranza
              ? "Filtre por vendedor, ruta o sucursal."
              : "Solo sus bitácoras creadas. Filtre por vendedor o ruta dentro de su listado."}
          </p>
        </div>
        <Link
          to="/operaciones/BitacoraCobranza"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Nueva bitácora
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div>
          <label className={labelClass}>Vendedor</label>
          <select
            className={inputClass}
            value={filtroVendedor}
            onChange={(e) => {
              setFiltroVendedor(e.target.value ? Number(e.target.value) : "");
              setFiltroRuta("");
            }}
          >
            <option value="">Todos</option>
            {vendedores.map((v) => (
              <option key={v.idVendedor} value={v.idVendedor}>
                {v.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Ruta</label>
          <select
            className={inputClass}
            value={filtroRuta}
            onChange={(e) => {
              setFiltroRuta(e.target.value ? Number(e.target.value) : "");
              setFiltroVendedor("");
            }}
          >
            <option value="">Todas</option>
            {rutas.map((r) => (
              <option key={r.idRuta} value={r.idRuta}>
                {r.codigo}
              </option>
            ))}
          </select>
        </div>
        {!menuLoading && puedeVerSucursalCobranza ? (
          <div>
            <label className={labelClass} htmlFor="filtro-sucursal-cobranza">
              Sucursal
            </label>
            <select
              id="filtro-sucursal-cobranza"
              className={inputClass}
              value={filtroSucursal}
              onChange={(e) => {
                setFiltroSucursal(
                  e.target.value ? Number(e.target.value) : "",
                );
              }}
            >
              <option value="">Todas</option>
              {sucursales.map((s) => (
                <option key={s.idSucursal} value={s.idSucursal}>
                  {s.nombre}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => void cargar()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando bitácoras...
          </div>
        ) : bitacoras.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-gray-500">
            No hay bitácoras registradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Folio
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Vendedor
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Ruta
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Creación
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Observaciones
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-600 dark:text-gray-300">
                    Estatus
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-600 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {bitacoras.map((b) => (
                  <tr key={b.idBitacora}>
                    <td className="px-4 py-2 font-medium">
                      {b.folio != null && b.folio > 0
                        ? b.folio
                        : `#${b.idBitacora}`}
                    </td>
                    <td className="px-4 py-2">
                      {mapaVendedores.get(b.idVendedor) ?? `#${b.idVendedor}`}
                    </td>
                    <td className="px-4 py-2">
                      {mapaRutas.get(b.idRuta) ?? `#${b.idRuta}`}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatearFecha(b.fechaCreacion)}
                    </td>
                    <td
                      className="px-4 py-2 max-w-xs truncate"
                      title={b.observaciones ?? ""}
                    >
                      {b.observaciones || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`${claseBadgeEstatusBitacora(b.estatus)} px-2 py-0.5 text-xs`}
                      >
                        {etiquetaEstatusBitacora(b.estatus)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <Link
                        to={`/operaciones/BitacoraCobranza?id=${b.idBitacora}`}
                        className="mr-3 text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Abrir
                      </Link>
                      <button
                        type="button"
                        onClick={() => void eliminar(b)}
                        className="inline-flex items-center text-red-600 hover:text-red-700 dark:text-red-400"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
