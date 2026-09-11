import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Search } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import PaginacionTabla from "../../components/common/PaginacionTabla";
import ModalDetalleRegistro, {
  CampoDetalle,
} from "../../components/common/ModalDetalleRegistro";
import { useClientPagination } from "../../hooks/useClientPagination";
import {
  activityTimelineService,
  etiquetaTipoActividad,
  formatearFechaActividad,
  TIPOS_SEGUIMIENTO_FILTRO,
  type ActivityTimelineItem,
  type LeadSeguimientoDetalle,
  type TipoActividadTimeline,
} from "../../services/activityTimelineService";
import {
  leadsService,
  nombreCompletoLead,
  type LeadListado,
} from "../../services/leadsService";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";

const rowClass =
  "cursor-pointer border-t dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20";

const colorBadge: Record<string, string> = {
  mensaje: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
  llamada:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  visita: "bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200",
  cotizacion:
    "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
  nota: "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200",
  recordatorio:
    "bg-orange-100 text-orange-900 dark:bg-orange-900/50 dark:text-orange-200",
};

export default function CrmSeguimientos() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ActivityTimelineItem[]>([]);
  const [leads, setLeads] = useState<LeadListado[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroTipoId, setFiltroTipoId] = useState<number | "">("");
  const [filtroIdLead, setFiltroIdLead] = useState<number | "">("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [detalle, setDetalle] = useState<LeadSeguimientoDetalle | null>(null);
  const [itemLista, setItemLista] = useState<ActivityTimelineItem | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  const mapaLeads = useMemo(() => {
    const m = new Map<number, string>();
    for (const l of leads) {
      m.set(l.idLead, nombreCompletoLead(l) || `Lead #${l.idLead}`);
    }
    return m;
  }, [leads]);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [seguimientos, listadoLeads] = await Promise.all([
        activityTimelineService.getAll({
          idTipoSeguimiento:
            typeof filtroTipoId === "number" ? filtroTipoId : null,
          soloActivos: true,
        }),
        leadsService.getLeadsListado(),
      ]);
      setItems(seguimientos);
      setLeads(listadoLeads);
    } catch (err) {
      console.error(err);
      setItems([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los seguimientos.",
      );
    } finally {
      setLoading(false);
    }
  }, [filtroTipoId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    let rows = items;
    if (typeof filtroIdLead === "number" && filtroIdLead > 0) {
      rows = rows.filter((i) => i.idLead === filtroIdLead);
    }
    const q = busqueda.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const nombreLead =
        row.idLead != null ? mapaLeads.get(row.idLead) ?? "" : "";
      const texto = [
        row.titulo,
        row.descripcion,
        row.nombreUsuario,
        etiquetaTipoActividad(row.tipo),
        nombreLead,
        row.idLead != null ? String(row.idLead) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(q);
    });
  }, [items, filtroIdLead, busqueda, mapaLeads]);

  const pagination = useClientPagination(filtrados, 50);

  const abrirDetalle = async (row: ActivityTimelineItem) => {
    setItemLista(row);
    setModalAbierto(true);
    setDetalle(null);
    setErrorDetalle(null);
    setCargandoDetalle(true);
    try {
      const d = await activityTimelineService.getById(row.id);
      setDetalle(d);
    } catch (err) {
      setErrorDetalle(
        err instanceof Error
          ? err.message
          : "No se pudo cargar el detalle del seguimiento.",
      );
    } finally {
      setCargandoDetalle(false);
    }
  };

  const nombreProspectoDetalle =
    detalle?.idLead != null
      ? mapaLeads.get(detalle.idLead) ?? `Lead #${detalle.idLead}`
      : itemLista?.idLead != null
        ? mapaLeads.get(itemLista.idLead) ?? `Lead #${itemLista.idLead}`
        : "—";

  return (
    <div className="space-y-6 p-6">
      <PageMeta
        title="Seguimientos de Prospectos"
        description="Listado global de seguimientos del CRM."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Seguimientos de Prospectos
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Filtre por tipo o prospecto. Doble clic para ver el detalle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void cargar()}
          disabled={loading}
          className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
        >
          Actualizar
        </button>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar en título, detalle, usuario, prospecto…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Tipo de seguimiento
          </label>
          <select
            value={filtroTipoId === "" ? "" : String(filtroTipoId)}
            onChange={(e) => {
              const v = e.target.value;
              setFiltroTipoId(v ? Number(v) : "");
            }}
            className={inputClass}
          >
            {TIPOS_SEGUIMIENTO_FILTRO.map((t) => (
              <option key={t.label} value={t.id === "" ? "" : String(t.id)}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Prospecto
          </label>
          <select
            value={filtroIdLead === "" ? "" : String(filtroIdLead)}
            onChange={(e) => {
              const v = e.target.value;
              setFiltroIdLead(v ? Number(v) : "");
            }}
            className={inputClass}
          >
            <option value="">Todos los prospectos</option>
            {leads.map((l) => (
              <option key={l.idLead} value={l.idLead}>
                {nombreCompletoLead(l) || `Lead #${l.idLead}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {!loading && filtrados.length > 0 ? (
          <PaginacionTabla
            pagination={pagination}
            etiqueta="seguimiento(s)"
            posicion="arriba"
          />
        ) : null}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="text-sm">Cargando seguimientos…</p>
          </div>
        ) : filtrados.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay seguimientos con los filtros actuales.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Fecha
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Tipo
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Prospecto
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Actividad
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Usuario
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((row) => {
                  const tipo = row.tipo as TipoActividadTimeline;
                  const badge =
                    colorBadge[tipo] ??
                    "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
                  const nombreLead =
                    row.idLead != null
                      ? mapaLeads.get(row.idLead) ?? `Lead #${row.idLead}`
                      : "—";
                  return (
                    <tr
                      key={`${row.id}-${row.fecha}-${row.titulo}`}
                      className={rowClass}
                      title="Doble clic para ver detalle"
                      onDoubleClick={() => void abrirDetalle(row)}
                    >
                      <td className="whitespace-nowrap px-4 py-2 text-xs text-gray-600 dark:text-gray-400">
                        {formatearFechaActividad(row.fecha)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${badge}`}
                        >
                          {etiquetaTipoActividad(tipo)}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {row.idLead ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/CRM/Prospectos/${row.idLead}`);
                            }}
                            onDoubleClick={(e) => e.stopPropagation()}
                            className="text-left text-blue-600 hover:underline dark:text-blue-400"
                          >
                            {nombreLead}
                          </button>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {row.titulo}
                        </div>
                        {row.descripcion ? (
                          <div className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                            {row.descripcion}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                        {row.nombreUsuario || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtrados.length > 0 ? (
          <PaginacionTabla
            pagination={pagination}
            etiqueta="seguimiento(s)"
            posicion="abajo"
          />
        ) : null}
      </div>

      <ModalDetalleRegistro
        abierto={modalAbierto}
        titulo={`Detalle · ${etiquetaTipoActividad(detalle?.tipo ?? itemLista?.tipo ?? "otro")}`}
        subtitulo={nombreProspectoDetalle}
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
            {(detalle?.idLead ?? itemLista?.idLead) ? (
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/CRM/Prospectos/${detalle?.idLead ?? itemLista?.idLead}`,
                  )
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Ir al prospecto
              </button>
            ) : null}
          </>
        }
      >
        {detalle ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <CampoDetalle
              label="Tipo"
              valor={etiquetaTipoActividad(detalle.tipo)}
            />
            <CampoDetalle
              label="Fecha"
              valor={formatearFechaActividad(detalle.fechaSeguimiento)}
            />
            <div className="sm:col-span-2">
              <CampoDetalle label="Comentario" valor={detalle.comentario} />
            </div>
            {detalle.mensaje ? (
              <>
                <CampoDetalle label="Canal" valor={detalle.mensaje.canal} />
                <CampoDetalle
                  label="Teléfono"
                  valor={detalle.mensaje.telefono}
                />
                <CampoDetalle
                  label="Estatus envío"
                  valor={detalle.mensaje.estatusEnvio}
                />
                <div className="sm:col-span-2">
                  <CampoDetalle label="Cuerpo" valor={detalle.mensaje.cuerpo} />
                </div>
              </>
            ) : null}
            {detalle.llamada ? (
              <>
                <CampoDetalle
                  label="Teléfono"
                  valor={detalle.llamada.telefono}
                />
                <CampoDetalle
                  label="Resultado"
                  valor={detalle.llamada.resultado}
                />
                <CampoDetalle
                  label="Duración (s)"
                  valor={detalle.llamada.duracionSegundos}
                />
                <CampoDetalle
                  label="Entrante"
                  valor={detalle.llamada.entrante ? "Sí" : "No"}
                />
                <div className="sm:col-span-2">
                  <CampoDetalle
                    label="Observaciones"
                    valor={detalle.llamada.observaciones}
                  />
                </div>
              </>
            ) : null}
            {detalle.visita ? (
              <>
                <CampoDetalle
                  label="Dirección"
                  valor={detalle.visita.direccion}
                />
                <CampoDetalle label="Ciudad" valor={detalle.visita.ciudad} />
                <CampoDetalle
                  label="Resultado"
                  valor={detalle.visita.resultado}
                />
                <CampoDetalle
                  label="Completada"
                  valor={detalle.visita.completada ? "Sí" : "No"}
                />
              </>
            ) : null}
            {detalle.cotizacion ? (
              <>
                <CampoDetalle label="Folio" valor={detalle.cotizacion.folio} />
                <CampoDetalle
                  label="Total"
                  valor={
                    detalle.cotizacion.total != null
                      ? `${detalle.cotizacion.total} ${detalle.cotizacion.moneda ?? ""}`
                      : null
                  }
                />
                <CampoDetalle
                  label="Estatus"
                  valor={detalle.cotizacion.estatus}
                />
                <CampoDetalle
                  label="CardCode"
                  valor={detalle.cotizacion.cardCode}
                />
              </>
            ) : null}
          </dl>
        ) : itemLista && !cargandoDetalle && !errorDetalle ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <CampoDetalle label="Título" valor={itemLista.titulo} />
            <CampoDetalle
              label="Fecha"
              valor={formatearFechaActividad(itemLista.fecha)}
            />
            <div className="sm:col-span-2">
              <CampoDetalle label="Descripción" valor={itemLista.descripcion} />
            </div>
          </dl>
        ) : null}
      </ModalDetalleRegistro>
    </div>
  );
}
