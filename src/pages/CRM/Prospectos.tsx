import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  ArrowBigRight,
  ArrowRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import { useModalAlerta } from "../../hooks/useModalAlerta";
import PaginacionTabla from "../../components/common/PaginacionTabla";
import ModalDetalleRegistro, {
  CampoDetalle,
} from "../../components/common/ModalDetalleRegistro";
import { useClientPagination } from "../../hooks/useClientPagination";
import {
  formatearFechaLead,
  Lead,
  LeadListado,
  leadsService,
  nombreCompletoLead,
} from "../../services/leadsService";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";

const rowClass =
  "cursor-pointer border-t dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20";

export default function Prospectos() {
  const navigate = useNavigate();
  const { mostrarError, AlertaHost } = useModalAlerta();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [leads, setLeads] = useState<LeadListado[]>([]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [detalle, setDetalle] = useState<Lead | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await leadsService.getLeadsListado();
      setLeads(data);
    } catch (err) {
      console.error(err);
      setLeads([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los prospectos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((row) => {
      const texto = [
        row.nombre,
        row.telefono,
        row.fuente,
        row.etapa,
        row.estatus,
        row.fechallegada,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(q);
    });
  }, [leads, busqueda]);

  const pagination = useClientPagination(filtrados, 50);

  const abrirDetalle = async (row: LeadListado) => {
    setModalAbierto(true);
    setDetalle(null);
    setErrorDetalle(null);
    setCargandoDetalle(true);
    try {
      const lead = await leadsService.getLead(row.idLead);
      setDetalle(lead);
    } catch (err) {
      setErrorDetalle(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el detalle del prospecto.",
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  const eliminar = async (row: LeadListado) => {
    if (!window.confirm(`¿Eliminar el prospecto "${nombreCompletoLead(row)}"?`))
      return;
    try {
      await leadsService.eliminarLead(row.idLead);
      await cargar();
    } catch (err) {
      console.error(err);
      mostrarError(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  const paginacion =
    !loading && filtrados.length > 0 ? (
      <>
        <PaginacionTabla
          pagination={pagination}
          etiqueta="prospecto(s)"
          posicion="arriba"
        />
      </>
    ) : null;

  const paginacionAbajo =
    !loading && filtrados.length > 0 ? (
      <PaginacionTabla
        pagination={pagination}
        etiqueta="prospecto(s)"
        posicion="abajo"
      />
    ) : null;

  return (
    <div className="space-y-6 p-6">
      <PageMeta
        title="Prospectos"
        description="Listado y gestión de prospectos del CRM."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Prospectos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gestione sus leads. Doble clic en una fila para ver el detalle.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void cargar()}
            disabled={loading}
            className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => navigate("/CRM/Prospectos/nuevo")}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Nuevo prospecto
          </button>
        </div>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Buscar por nombre, teléfono, etapa, estatus, fuente…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${inputClass} pl-9`}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {paginacion}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="text-sm">Cargando prospectos…</p>
          </div>
        ) : filtrados.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            {busqueda
              ? "No hay prospectos que coincidan con la búsqueda."
              : "No hay prospectos registrados."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Prospecto
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Etapa
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Estatus
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Fuente
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Llegada
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((row) => (
                  <tr
                    key={row.idLead}
                    className={rowClass}
                    title="Doble clic para ver detalle"
                    onDoubleClick={() => void abrirDetalle(row)}
                  >
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {row.nombre ?? "Sin nombre"}
                      </div>
                      {row.telefono ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {row.telefono}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-2">{row.etapa ?? "—"}</td>
                    <td className="px-4 py-2">{row.estatus ?? "—"}</td>
                    <td className="px-4 py-2">{row.fuente ?? "—"}</td>
                    <td className="px-4 py-2">
                      {formatearFechaLead(row.fechallegada)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div
                        className="inline-flex gap-1"
                        onDoubleClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/CRM/Prospectos/${row.idLead}`)
                          }
                          title="Editar"
                          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                          <ArrowBigRight className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void eliminar(row)}
                          title="Eliminar"
                          className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {paginacionAbajo}
      </div>

      <ModalDetalleRegistro
        abierto={modalAbierto}
        titulo="Detalle del prospecto"
        subtitulo={
          detalle
            ? nombreCompletoLead(detalle)
            : "Solo lectura · doble clic en el listado"
        }
        cargando={cargandoDetalle}
        error={errorDetalle}
        onCerrar={() => setModalAbierto(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
            >
              Cerrar
            </button>
            {detalle ? (
              <button
                type="button"
                onClick={() => navigate(`/CRM/Prospectos/${detalle.idLead}`)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Abrir ficha
              </button>
            ) : null}
          </>
        }
      >
        {detalle ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <CampoDetalle label="Nombre" valor={nombreCompletoLead(detalle)} />
            <CampoDetalle label="Teléfono" valor={detalle.telefono} />
            <CampoDetalle label="Correo" valor={detalle.correo} />
            <CampoDetalle
              label="Etapa"
              valor={detalle.nombreEtapa ?? detalle.idEtapa}
            />
            <CampoDetalle
              label="Estatus"
              valor={detalle.nombreEstatus ?? detalle.idEstatus}
            />
            <CampoDetalle
              label="Fuente"
              valor={detalle.nombreFuente ?? detalle.idFuente}
            />
            <CampoDetalle
              label="Llegada"
              valor={formatearFechaLead(detalle.fechallegada)}
            />
            <CampoDetalle label="Ciudad" valor={detalle.ciudad} />
            <div className="sm:col-span-2">
              <CampoDetalle
                label="Observaciones"
                valor={detalle.observaciones}
              />
            </div>
          </dl>
        ) : null}
      </ModalDetalleRegistro>
      {AlertaHost}
    </div>
  );
}
