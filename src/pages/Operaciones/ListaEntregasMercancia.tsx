import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Search } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../hooks/useAuth";
import {
  inventarioCedisService,
  type InventarioApi,
} from "../../services/transferCedisService";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

function formatearFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? valor : d.toLocaleDateString("es-MX");
}

function etiquetaEstatus(estatus: string | null | undefined): string {
  const e = (estatus ?? "").trim().toUpperCase();
  if (e === "P") return "Procesado";
  if (e === "C") return "Completo";
  if (e === "E") return "Exceso";
  return estatus?.trim() || "—";
}

export default function ListaEntregasMercancia() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lista, setLista] = useState<InventarioApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroFolio, setFiltroFolio] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("");
  const [folioAplicado, setFolioAplicado] = useState("");
  const [clienteAplicado, setClienteAplicado] = useState("");

  const cargar = useCallback(async () => {
    if (!user?.idUsuario) {
      setLista([]);
      setError("No hay sesión de usuario para cargar las entregas.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const folio = folioAplicado.trim();
      const folioNum = Number(folio);
      const esNumero =
        folio !== "" && Number.isFinite(folioNum) && folioNum > 0;

      let traspasos = await inventarioCedisService.listarTraspasos({
        idUsuarioCreacion: user.idUsuario,
        docNum: esNumero ? folioNum : null,
      });

      if (folio) {
        traspasos = traspasos.filter(
          (t) =>
            String(t.idInventario) === folio ||
            String(t.docNum ?? "") === folio,
        );
      }

      const clienteQ = clienteAplicado.trim().toLowerCase();
      setLista(
        clienteQ
          ? traspasos.filter((t) =>
              (t.cardName || "").toLowerCase().includes(clienteQ),
            )
          : traspasos,
      );
    } catch (err) {
      setLista([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar las entregas de mercancía.",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.idUsuario, folioAplicado, clienteAplicado]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const aplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault();
    setFolioAplicado(filtroFolio);
    setClienteAplicado(filtroCliente);
  };

  const limpiarFiltros = () => {
    setFiltroFolio("");
    setFiltroCliente("");
    setFolioAplicado("");
    setClienteAplicado("");
  };

  const abrirDetalle = (idTraspaso: number) => {
    navigate(`/operaciones/ControlCedis?idTraspaso=${idTraspaso}`);
  };

  const total = useMemo(() => lista.length, [lista]);

  return (
    <div className="space-y-6 p-6">
      <PageMeta
        title="Listado de Entregas de Mercancía"
        description="Traspasos CEDIS validados por el usuario"
      />
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Listado de Entregas de Mercancía
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Consulte los traspasos que validó. Doble clic en un renglón para ver
          lo escaneado en Control CEDIS.
        </p>
      </div>

      <form
        onSubmit={aplicarFiltros}
        className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className={labelClass}>Folio</label>
            <input
              type="text"
              value={filtroFolio}
              onChange={(e) => setFiltroFolio(e.target.value)}
              placeholder="Id inventario o DocNum"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Cliente</label>
            <input
              type="text"
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              placeholder="Nombre del cliente"
              className={inputClass}
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
            <button
              type="button"
              onClick={limpiarFiltros}
              disabled={loading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              Limpiar
            </button>
          </div>
        </div>
      </form>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {loading ? "Cargando…" : `${total} entrega(s)`}
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Cargando entregas…
          </div>
        ) : lista.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay entregas con los filtros indicados.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-gray-50 dark:bg-gray-700/60">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Folio
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Documento
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Cliente
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">
                    Estatus
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {lista.map((item) => (
                  <tr
                    key={item.idInventario}
                    onDoubleClick={() => abrirDetalle(item.idInventario)}
                    title="Doble clic para ver detalle en Control CEDIS"
                    className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/30"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {item.idInventario}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {item.docNum || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {item.cardName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {formatearFecha(item.docDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {etiquetaEstatus(item.estatus)}
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
