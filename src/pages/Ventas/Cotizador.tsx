import { useState } from "react";
import { AlertCircle, Loader2, Package, Search } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../hooks/useAuth";
import {
  cotizadorService,
  CotizadorBusquedaResponse,
  CotizadorResultado,
} from "../../services/cotizadorService";
import { formatCurrency } from "../../utils/format";

function pct(valor: number): string {
  if (!Number.isFinite(valor) || valor <= 0) return "—";
  return `${(valor * 100).toFixed(0)}%`;
}

function ResultadoCard({ item }: { item: CotizadorResultado }) {
  const sinMatch = !item.encontradoSap && !item.tieneCodialub;

  return (
    <article
      className={`rounded-xl border p-4 shadow-sm ${
        sinMatch
          ? "border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-950/20"
          : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Marca
          </p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {item.marca}
          </h3>
        </div>
        {item.encontradoSap ? (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            En SAP
          </span>
        ) : (
          <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            Sin SAP
          </span>
        )}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="col-span-2">
          <dt className="text-xs text-gray-500 dark:text-gray-400">
            Código Codialub
          </dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {item.codigoCodialub?.trim() || "—"}
          </dd>
        </div>
        {item.codigo?.trim() ? (
          <div className="col-span-2">
            <dt className="text-xs text-gray-500 dark:text-gray-400">
              Código equivalente
            </dt>
            <dd className="text-gray-800 dark:text-gray-200">{item.codigo}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">
            Precio lista
          </dt>
          <dd className="font-medium text-gray-900 dark:text-white">
            {formatCurrency(item.precioLista)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">
            Precio c/descuento
          </dt>
          <dd className="font-semibold text-blue-700 dark:text-blue-300">
            {formatCurrency(item.precioConDescuento)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">Importe</dt>
          <dd className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(item.importe)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500 dark:text-gray-400">
            Descuentos
          </dt>
          <dd className="text-gray-700 dark:text-gray-300">
            Base {pct(item.descuentoBase)}
            {item.descuentoAdicional > 0
              ? ` + Adic. ${pct(item.descuentoAdicional)}`
              : ""}
          </dd>
        </div>
      </dl>

      {item.descripcion ? (
        <p className="mt-3 line-clamp-3 text-xs text-gray-600 dark:text-gray-400">
          {item.descripcion}
        </p>
      ) : null}

      {item.mensaje ? (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {item.mensaje}
        </p>
      ) : null}
    </article>
  );
}

export default function Cotizador() {
  const { user, loading: authLoading } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [respuesta, setRespuesta] = useState<CotizadorBusquedaResponse | null>(
    null,
  );

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    const codigoTrim = codigo.trim();
    if (!codigoTrim) return;

    if (authLoading) {
      setError("Espera a que termine de cargar la sesión.");
      return;
    }

    const idVendedor = user?.idPersona ?? 0;
    if (import.meta.env.DEV) {
      console.log("[Cotizador] user:", user, "idVendedor:", idVendedor);
    }
    if (!idVendedor || idVendedor <= 0) {
      setError(
        user
          ? "Tu sesión no trae idUsuario. Revisa que checkauth también lo envíe (no solo el login)."
          : "No hay sesión de usuario. Vuelve a iniciar sesión.",
      );
      return;
    }

    const qty = Number(cantidad);
    if (!Number.isFinite(qty) || qty < 1) {
      setError("La cantidad debe ser al menos 1.");
      return;
    }

    setLoading(true);
    setError(null);
    setBusquedaRealizada(true);

    try {
      const data = await cotizadorService.buscar({
        idVendedor,
        cantidad: Math.trunc(qty),
        codigo: codigoTrim,
      });
      setRespuesta(data);
    } catch (err) {
      console.error(err);
      setRespuesta(null);
      setError(
        err instanceof Error ? err.message : "Error al buscar en el cotizador.",
      );
    } finally {
      setLoading(false);
    }
  };

  const resultados = respuesta?.resultados ?? [];

  return (
    <>
      <PageMeta
        title="Cotizador"
        description="Búsqueda de artículos y equivalentes por código"
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Cotizador
        </h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Busca por código y cantidad. Se consultan equivalentes por marca.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
        <form
          onSubmit={(e) => void handleBuscar(e)}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="min-w-0 flex-1">
            <label
              htmlFor="cotizador-codigo"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Código
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                id="cotizador-codigo"
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
                placeholder="Ej. RS3545"
                className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-base dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="w-full sm:w-28">
            <label
              htmlFor="cotizador-cantidad"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Cantidad
            </label>
            <input
              id="cotizador-cantidad"
              type="number"
              min={1}
              step={1}
              value={cantidad}
              onChange={(e) => setCantidad(Number(e.target.value))}
              className="w-full min-h-[44px] rounded-lg border border-gray-300 bg-white px-3 py-2 text-base dark:border-gray-600 dark:bg-gray-700 dark:text-white sm:text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !codigo.trim()}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </form>
      </div>

      {error ? (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
          <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
          <span className="text-sm text-red-700 dark:text-red-400">
            {error}
          </span>
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Consultando cotizador...
        </div>
      ) : null}

      {busquedaRealizada && !loading && respuesta ? (
        <>
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Código:{" "}
              <strong className="text-gray-900 dark:text-white">
                {respuesta.codigoBusqueda}
              </strong>
            </span>
            <span>
              Sociedad:{" "}
              <strong className="text-gray-900 dark:text-white">
                {respuesta.sociedad || "—"}
              </strong>
            </span>
            <span>
              Cantidad:{" "}
              <strong className="text-gray-900 dark:text-white">
                {respuesta.cantidad}
              </strong>
            </span>
            {respuesta.almacenVendedor ? (
              <span>
                Almacén vendedor:{" "}
                <strong className="text-gray-900 dark:text-white">
                  {respuesta.almacenVendedor}
                </strong>
              </span>
            ) : null}
          </div>

          {resultados.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
              <Package className="mx-auto mb-3 h-12 w-12 opacity-50" />
              <p>No se encontraron resultados</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {resultados.map((item, index) => (
                <ResultadoCard
                  key={`${item.marca}-${item.codigoCodialub ?? item.codigo}-${index}`}
                  item={item}
                />
              ))}
            </div>
          )}
        </>
      ) : null}
    </>
  );
}
