import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import {
  listaPreciosService,
  ArchivoListaPrecios,
  MarcaListaPrecios,
} from "../../services/listaPreciosService";

type Fila = { marca: string; archivo: ArchivoListaPrecios };

const ListaPrecios = () => {
  const [grupos, setGrupos] = useState<MarcaListaPrecios[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [descargandoKey, setDescargandoKey] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listaPreciosService.getListado();
      setGrupos(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar listas de precios");
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filas: Fila[] = useMemo(
    () =>
      grupos.flatMap((g) =>
        (g.archivos ?? []).map((archivo) => ({ marca: g.marca, archivo })),
      ),
    [grupos],
  );

  const filaKey = (marca: string, nombre: string) => `${marca}\0${nombre}`;

  const handleDescargar = async (marca: string, archivo: ArchivoListaPrecios) => {
    const key = filaKey(marca, archivo.nombre);
    setDescargandoKey(key);
    setError(null);
    try {
      await listaPreciosService.descargarArchivo(marca, archivo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al descargar");
    } finally {
      setDescargandoKey(null);
    }
  };

  const iconoTipo = (ext: string) => {
    const e = ext.toLowerCase();
    if (e === ".pdf") {
      return <FileText className="w-4 h-4 text-red-500 shrink-0" aria-hidden />;
    }
    return <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden />;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Listas de precios
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Archivos por marca; descarga el que necesites.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="text-red-500 w-5 h-5 shrink-0" />
          <span className="text-red-700 dark:text-red-400">{error}</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-gray-500 dark:text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin" />
            <p>Cargando archivos…</p>
          </div>
        ) : filas.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No hay listas de precios disponibles.
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Marca
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Archivo
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-40">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filas.map(({ marca, archivo }) => {
                    const key = filaKey(marca, archivo.nombre);
                    const busy = descargandoKey === key;
                    return (
                      <tr
                        key={key}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">
                          {marca}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                          <span className="inline-flex items-center gap-2">
                            {iconoTipo(archivo.extension)}
                            <span className="break-all">{archivo.nombre}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => void handleDescargar(marca, archivo)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {busy ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            Descargar
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
              {filas.map(({ marca, archivo }) => {
                const key = filaKey(marca, archivo.nombre);
                const busy = descargandoKey === key;
                return (
                  <div key={key} className="p-4 space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Marca</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {marca}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Archivo</p>
                      <p className="text-sm text-gray-800 dark:text-gray-200 inline-flex items-start gap-2">
                        {iconoTipo(archivo.extension)}
                        <span className="break-all">{archivo.nombre}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDescargar(marca, archivo)}
                      disabled={busy}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {busy ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      Descargar
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ListaPrecios;
