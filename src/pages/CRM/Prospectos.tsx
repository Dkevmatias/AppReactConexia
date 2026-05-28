import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import {
  crmService,
  EntidadServicio,
  EstatusCatalogo,
  Etapa,
  Fuente,
} from "../../services/crmService";
import {
  formatearFechaLead,
  formatearMoneda,
  Lead,
  LeadPayload,
  leadsService,
  nombreCompletoLead,
} from "../../services/leadsService";
import { useAuth } from "../../hooks/useAuth";

function leadVacio(): LeadPayload {
  return {
    nombre: "",
    aPaterno: "",
    aMaterno: "",
    telefono: "",
    correo: "",
    observaciones: "",
    unidad: "",
    campaign: "",
    idEntidadServicio: null,
    idUnidad: null,
    idEntidadCampaign: null,
    idFuente: null,
    idEstatus: null,
    idEtapa: null,
    idTemperatura: null,
    idUsuarioCreacion: null,
    idUsuarioAsignado: null,
    idUsuarioActualizacion: null,
    idEmpresa: null,
    idDependencia: null,
    idDependenciaAsignada: null,
    presupuesto: null,
    estado: "",
    ciudad: "",
    municipio: "",
    fechallegada: null,
  };
}

function leadToForm(row: Lead): LeadPayload {
  return {
    nombre: row.nombre ?? "",
    aPaterno: row.aPaterno ?? "",
    aMaterno: row.aMaterno ?? "",
    telefono: row.telefono ?? "",
    correo: row.correo ?? "",
    observaciones: row.observaciones ?? "",
    unidad: row.unidad ?? "",
    campaign: row.campaign ?? "",
    idEntidadServicio: row.idEntidadServicio,
    idUnidad: row.idUnidad,
    idEntidadCampaign: row.idEntidadCampaign,
    idFuente: row.idFuente,
    idEstatus: row.idEstatus,
    idEtapa: row.idEtapa,
    idTemperatura: row.idTemperatura,
    idUsuarioCreacion: row.idUsuarioCreacion,
    idUsuarioAsignado: row.idUsuarioAsignado,
    idUsuarioActualizacion: row.idUsuarioActualizacion,
    idEmpresa: row.idEmpresa,
    idDependencia: row.idDependencia,
    idDependenciaAsignada: row.idDependenciaAsignada,
    presupuesto: row.presupuesto,
    estado: row.estado ?? "",
    ciudad: row.ciudad ?? "",
    municipio: row.municipio ?? "",
    fechallegada: row.fechallegada,
  };
}

function prepararPayload(form: LeadPayload, idUsuario?: number): LeadPayload {
  const trim = (s: string | null) => {
    const t = (s ?? "").trim();
    return t || null;
  };
  return {
    ...form,
    nombre: trim(form.nombre),
    aPaterno: trim(form.aPaterno),
    aMaterno: trim(form.aMaterno),
    telefono: trim(form.telefono),
    correo: trim(form.correo),
    observaciones: trim(form.observaciones),
    unidad: trim(form.unidad),
    campaign: trim(form.campaign),
    estado: trim(form.estado),
    ciudad: trim(form.ciudad),
    municipio: trim(form.municipio),
    idUsuarioActualizacion: idUsuario ?? form.idUsuarioActualizacion,
  };
}

function fechaParaInput(valor: string | null): string {
  if (!valor) return "";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

function etiquetaEtapa(row: Lead, etapas: Etapa[]): string {
  return row.nombreEtapa ?? etapas.find((e) => e.idEtapa === row.idEtapa)?.nombre ?? "—";
}

function etiquetaEstatus(row: Lead, estatus: EstatusCatalogo[]): string {
  return row.nombreEstatus ?? estatus.find((e) => e.idEstatus === row.idEstatus)?.nombre ?? "—";
}

function etiquetaFuente(row: Lead, fuentes: Fuente[]): string {
  return row.nombreFuente ?? fuentes.find((f) => f.idFuente === row.idFuente)?.nombre ?? "—";
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";

const labelClass = "mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300";

export default function Prospectos() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [estatusLista, setEstatusLista] = useState<EstatusCatalogo[]>([]);
  const [servicios, setServicios] = useState<EntidadServicio[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadPayload>(leadVacio);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [leadsRes, etapasRes, fuentesRes, estatusRes, serviciosRes] =
      await Promise.allSettled([
        leadsService.getLeadsListado().catch(() => leadsService.getLeads()),
        crmService.getEtapas(),
        crmService.getFuentes(),
        crmService.getEstatusCatalogo(),
        crmService.getEntidadesServicio(),
      ]);

    if (leadsRes.status === "fulfilled") {
      setLeads(leadsRes.value);
    } else {
      console.error(leadsRes.reason);
      setLeads([]);
      setError(
        leadsRes.reason instanceof Error
          ? leadsRes.reason.message
          : "No se pudieron cargar los prospectos.",
      );
    }

    if (etapasRes.status === "fulfilled") setEtapas(etapasRes.value);
    if (fuentesRes.status === "fulfilled") setFuentes(fuentesRes.value);
    if (estatusRes.status === "fulfilled") setEstatusLista(estatusRes.value);
    if (serviciosRes.status === "fulfilled") setServicios(serviciosRes.value);

    setLoading(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((row) => {
      const texto = [
        nombreCompletoLead(row),
        row.telefono,
        row.correo,
        row.unidad,
        row.campaign,
        row.ciudad,
        row.estado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(q);
    });
  }, [leads, busqueda]);

  const abrirCrear = () => {
    const base = leadVacio();
    if (user?.idPersona) {
      base.idUsuarioCreacion = user.idPersona;
      base.idUsuarioAsignado = user.idPersona;
    }
    setForm(base);
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = async (row: Lead) => {
    setSaving(true);
    try {
      const detalle = await leadsService.getLead(row.idLead);
      setForm(leadToForm(detalle));
      setEditando(detalle);
      setModalAbierto(true);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "No se pudo cargar el prospecto.");
    } finally {
      setSaving(false);
    }
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
  };

  const guardar = async () => {
    if (!(form.nombre ?? "").trim()) {
      alert("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const payload = prepararPayload(form, user?.idPersona);
      if (editando) {
        await leadsService.actualizarLead(editando.idLead, payload);
      } else {
        await leadsService.crearLead(payload);
      }
      cerrarModal();
      await cargar();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const eliminar = async (row: Lead) => {
    if (!window.confirm(`¿Eliminar el prospecto "${nombreCompletoLead(row)}"?`)) return;
    try {
      await leadsService.eliminarLead(row.idLead);
      await cargar();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  const setCampo = <K extends keyof LeadPayload>(key: K, value: LeadPayload[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
  };

  const setIdSelect = (key: keyof LeadPayload, value: string) => {
    setCampo(key, value ? Number(value) : null);
  };

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
            Gestione sus leads: datos de contacto, etapa, estatus y presupuesto.
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
            onClick={abrirCrear}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Nuevo prospecto
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          placeholder="Buscar por nombre, teléfono, correo, unidad…"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className={`${inputClass} pl-9`}
        />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
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
                    Contacto
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
                    Presupuesto
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
                {filtrados.map((row) => (
                  <tr key={row.idLead} className="border-t dark:border-gray-800">
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {nombreCompletoLead(row)}
                      </div>
                      {row.unidad && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {row.unidad}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      <div>{row.telefono ?? "—"}</div>
                      <div className="text-xs">{row.correo ?? ""}</div>
                    </td>
                    <td className="px-4 py-2">{etiquetaEtapa(row, etapas)}</td>
                    <td className="px-4 py-2">{etiquetaEstatus(row, estatusLista)}</td>
                    <td className="px-4 py-2">{etiquetaFuente(row, fuentes)}</td>
                    <td className="px-4 py-2">{formatearMoneda(row.presupuesto)}</td>
                    <td className="px-4 py-2">{formatearFechaLead(row.fechallegada)}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => void abrirEditar(row)}
                          title="Editar"
                          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                          <Pencil className="h-4 w-4" />
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
      </div>

      {!loading && leads.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Mostrando {filtrados.length} de {leads.length} prospecto(s)
        </p>
      )}

      {modalAbierto && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-600 dark:bg-gray-800">
            <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editando ? "Editar prospecto" : "Nuevo prospecto"}
              </h3>
            </div>

            <div className="overflow-y-auto px-5 py-4">
              <div className="space-y-6">
                <section>
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Datos personales
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>
                        Nombre <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={form.nombre ?? ""}
                        onChange={(e) => setCampo("nombre", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Apellido paterno</label>
                      <input
                        type="text"
                        value={form.aPaterno ?? ""}
                        onChange={(e) => setCampo("aPaterno", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Apellido materno</label>
                      <input
                        type="text"
                        value={form.aMaterno ?? ""}
                        onChange={(e) => setCampo("aMaterno", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Contacto
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className={labelClass}>Teléfono</label>
                      <input
                        type="tel"
                        value={form.telefono ?? ""}
                        onChange={(e) => setCampo("telefono", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Correo</label>
                      <input
                        type="email"
                        value={form.correo ?? ""}
                        onChange={(e) => setCampo("correo", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Clasificación CRM
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>Etapa</label>
                      <select
                        value={form.idEtapa ?? ""}
                        onChange={(e) => setIdSelect("idEtapa", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Sin etapa</option>
                        {etapas.map((e) => (
                          <option key={e.idEtapa} value={e.idEtapa}>
                            {e.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Estatus</label>
                      <select
                        value={form.idEstatus ?? ""}
                        onChange={(e) => setIdSelect("idEstatus", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Sin estatus</option>
                        {estatusLista.map((e) => (
                          <option key={e.idEstatus} value={e.idEstatus}>
                            {e.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Fuente</label>
                      <select
                        value={form.idFuente ?? ""}
                        onChange={(e) => setIdSelect("idFuente", e.target.value)}
                        className={inputClass}
                      >
                        <option value="">Sin fuente</option>
                        {fuentes.map((f) => (
                          <option key={f.idFuente} value={f.idFuente}>
                            {f.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Tipo de servicio</label>
                      <select
                        value={form.idEntidadServicio ?? ""}
                        onChange={(e) =>
                          setIdSelect("idEntidadServicio", e.target.value)
                        }
                        className={inputClass}
                      >
                        <option value="">Sin tipo de servicio</option>
                        {servicios.map((s) => (
                          <option
                            key={s.idEntidadServicio ?? s.idEntidadNegocio}
                            value={s.idEntidadServicio ?? s.idEntidadNegocio ?? ""}
                          >
                            {s.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Presupuesto</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={form.presupuesto ?? ""}
                        onChange={(e) =>
                          setCampo(
                            "presupuesto",
                            e.target.value ? Number(e.target.value) : null,
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Fecha de llegada</label>
                      <input
                        type="datetime-local"
                        value={fechaParaInput(form.fechallegada)}
                        onChange={(e) =>
                          setCampo(
                            "fechallegada",
                            e.target.value ? new Date(e.target.value).toISOString() : null,
                          )
                        }
                        className={inputClass}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Ubicación y campaña
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className={labelClass}>Unidad</label>
                      <input
                        type="text"
                        value={form.unidad ?? ""}
                        onChange={(e) => setCampo("unidad", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Campaña</label>
                      <input
                        type="text"
                        value={form.campaign ?? ""}
                        onChange={(e) => setCampo("campaign", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Estado</label>
                      <input
                        type="text"
                        value={form.estado ?? ""}
                        onChange={(e) => setCampo("estado", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Ciudad</label>
                      <input
                        type="text"
                        value={form.ciudad ?? ""}
                        onChange={(e) => setCampo("ciudad", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Municipio</label>
                      <input
                        type="text"
                        value={form.municipio ?? ""}
                        onChange={(e) => setCampo("municipio", e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                    Observaciones
                  </h4>
                  <textarea
                    rows={3}
                    value={form.observaciones ?? ""}
                    onChange={(e) => setCampo("observaciones", e.target.value)}
                    className={inputClass}
                  />
                </section>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-4 dark:border-gray-700">
              <button
                type="button"
                onClick={cerrarModal}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void guardar()}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
