import { useEffect, useState } from "react";
import { useAuth } from "../../../context/useAuth";
import { Download, Filter } from "lucide-react";
import PageMeta from "../../../components/common/PageMeta";
import { getUsuario } from "../../../services/authService";

interface Persona {
  idPersona: number;
  nombre: string | null;
  cardCode?: string | null;
  unico?: boolean;
  vendedor: string | null;
}

type FiltroEstatus = "todos" | "activo" | "inactivo";

export default function ReportePlataforma() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Persona[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filtroEstatus, setFiltroEstatus] = useState<FiltroEstatus>("todos");

  useEffect(() => {
    const cargarDatos = async () => {
      if (!user?.idPersona) return;
      setLoading(true);
      setError(null);

      try {
        const usuarios = await getUsuario();
        setUsuarios(usuarios);
      } catch (err) {
        console.error("Error cargando conversaciones o personas:", err);
        setError("No se pudieron cargar las conversaciones.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user?.idPersona]);

  const usuariosFiltrados = usuarios.filter((u) => {
    if (filtroEstatus === "todos") return true;
    if (filtroEstatus === "activo") return u.unico === true;
    if (filtroEstatus === "inactivo") return u.unico === false;
    return true;
  });

  const exportarExcel = () => {
    const headers = ["Nombre cliente", "CardCode", "Estatus", "Vendedor"];
    const rows = usuariosFiltrados.map((u) => [
      u.nombre || "",
      u.cardCode || "",
      u.unico ? "Activo" : "Inactivo",
      u.vendedor || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_plataforma_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title="Conversaciones de Clientes"
        description="Listado de conversaciones de WhatsApp vinculadas a clientes."
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Conversaciones de clientes
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filtroEstatus}
              onChange={(e) => setFiltroEstatus(e.target.value as FiltroEstatus)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="todos">Todos</option>
              <option value="activo">Activos</option>
              <option value="inactivo">Inactivos</option>
            </select>
          </div>

          <button
            onClick={exportarExcel}
            disabled={usuariosFiltrados.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
          >
            <Download className="w-4 h-4" />
            Exportar Excel
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Total: {usuariosFiltrados.length} de {usuarios.length} registros
      </p>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : usuariosFiltrados.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No hay Usuarios en la Plataforma.
        </p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left">Nombre cliente</th>
                  <th className="px-3 py-2 text-center">CardCode</th>
                  <th className="px-3 py-2 text-center">Estatus</th>
                  <th className="px-3 py-2 text-center">Vendedor</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((usuario) => (
                  <tr
                    key={usuario.idPersona}
                    className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-3 py-2 text-left">
                      {usuario.nombre || "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {usuario.cardCode || "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          usuario.unico
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {usuario.unico ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {usuario.vendedor || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
            {usuariosFiltrados.map((usuario) => (
              <div key={usuario.idPersona} className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nombre</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {usuario.nombre || "-"}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      usuario.unico
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    }`}
                  >
                    {usuario.unico ? "Activo" : "Inactivo"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">CardCode</p>
                    <p className="text-gray-600 dark:text-gray-300">{usuario.cardCode || "-"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Vendedor</p>
                    <p className="text-gray-600 dark:text-gray-300">{usuario.vendedor || "-"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}