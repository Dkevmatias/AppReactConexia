import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import {
  crmService,
  ESTATUS_ACTIVO,
  EntidadNegocio,
  EntidadNegocioPayload,
  EntidadServicio,
  EntidadServicioPayload,
  Etapa,
  EtapaConfiguracion,
  EtapaConfiguracionPayload,
  EstatusCrm,
  Fuente,
  FuentePayload,
} from "../../services/crmService";

type TabId = "negocio" | "servicio" | "funnel" | "fuentes";

const TABS: { id: TabId; label: string }[] = [
  { id: "negocio", label: "Entidad de negocio" },
  { id: "servicio", label: "Tipo de servicio" },
  { id: "funnel", label: "Configuración Funnel de ventas" },
  { id: "fuentes", label: "Fuentes de información" },
];

const TIPOS_FUENTE = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "web", label: "Sitio web" },
  { value: "otro", label: "Otro" },
];

function estatusLabel(estatus: EstatusCrm): string {
  return estatus === ESTATUS_ACTIVO ? "Activo" : "Inactivo";
}

function estatusClass(estatus: EstatusCrm): string {
  return estatus === ESTATUS_ACTIVO
    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
}

type ModalState =
  | { kind: "negocio"; item: EntidadNegocio | null }
  | { kind: "servicio"; item: EntidadServicio | null }
  | { kind: "funnel"; item: EtapaConfiguracion | null }
  | { kind: "fuente"; item: Fuente | null }
  | null;

function idServicio(row: EntidadServicio): number {
  return row.idEntidadServicio ?? row.idEntidadNegocio ?? 0;
}

function nombreEtapaFunnel(
  row: EtapaConfiguracion,
  catalogo: Etapa[],
): string {
  if (row.nombre) return row.nombre;
  if (row.etapa?.nombre) return row.etapa.nombre;
  return (
    catalogo.find((e) => e.idEtapa === row.idEtapa)?.nombre ??
    `Etapa #${row.idEtapa}`
  );
}

function funnelOrdenado(items: EtapaConfiguracion[]): EtapaConfiguracion[] {
  return [...items].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

export default function CrmConfiguracion() {
  const [tab, setTab] = useState<TabId>("negocio");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>(null);

  const [negocios, setNegocios] = useState<EntidadNegocio[]>([]);
  const [servicios, setServicios] = useState<EntidadServicio[]>([]);
  const [catalogoEtapas, setCatalogoEtapas] = useState<Etapa[]>([]);
  const [funnelConfig, setFunnelConfig] = useState<EtapaConfiguracion[]>([]);
  const [fuentes, setFuentes] = useState<Fuente[]>([]);

  const [formNegocio, setFormNegocio] = useState<EntidadNegocioPayload>({
    nombre: "",
    estatus: ESTATUS_ACTIVO,
  });
  const [formServicio, setFormServicio] = useState<EntidadServicioPayload>({
    nombre: "",
    estatus: ESTATUS_ACTIVO,
  });
  const [formFunnel, setFormFunnel] = useState<EtapaConfiguracionPayload>({
    idEtapa: 0,
    orden: 1,
    estatus: ESTATUS_ACTIVO,
  });
  const [formFuente, setFormFuente] = useState<FuentePayload>({
    nombre: "",
    estatus: ESTATUS_ACTIVO,
    tipoFuente: "whatsapp",
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [negRes, servRes, etapasRes, funnelRes, fuentesRes] =
      await Promise.allSettled([
        crmService.getEntidadesNegocio(),
        crmService.getEntidadesServicio(),
        crmService.getEtapas(),
        crmService.getEtapaConfiguraciones(),
        crmService.getFuentes(),
      ]);

    const errores: string[] = [];

    if (negRes.status === "fulfilled") {
      setNegocios(negRes.value);
    } else {
      console.error(negRes.reason);
      setNegocios([]);
      errores.push("entidades de negocio");
    }

    if (servRes.status === "fulfilled") {
      setServicios(servRes.value);
    } else {
      console.error(servRes.reason);
      setServicios([]);
      errores.push("tipos de servicio");
    }

    if (etapasRes.status === "fulfilled") {
      setCatalogoEtapas(etapasRes.value);
    } else {
      console.error(etapasRes.reason);
      setCatalogoEtapas([]);
      errores.push("catálogo de etapas");
    }

    if (funnelRes.status === "fulfilled") {
      setFunnelConfig(funnelRes.value);
    } else {
      console.error(funnelRes.reason);
      setFunnelConfig([]);
      errores.push("configuración del funnel");
    }

    if (fuentesRes.status === "fulfilled") {
      setFuentes(fuentesRes.value);
    } else {
      console.error(fuentesRes.reason);
      setFuentes([]);
      errores.push("fuentes de información");
    }

    if (errores.length > 0) {
      setError(
        `No se pudo cargar: ${errores.join(", ")}. Las demás secciones disponibles siguen activas.`,
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirCrear = () => {
    if (tab === "negocio") {
      setFormNegocio({ nombre: "", estatus: ESTATUS_ACTIVO });
      setModal({ kind: "negocio", item: null });
    } else if (tab === "servicio") {
      setFormServicio({ nombre: "", estatus: ESTATUS_ACTIVO });
      setModal({ kind: "servicio", item: null });
    } else if (tab === "funnel") {
      const primeraEtapa = catalogoEtapas.find((e) => e.estatus === ESTATUS_ACTIVO);
      setFormFunnel({
        idEtapa: primeraEtapa?.idEtapa ?? catalogoEtapas[0]?.idEtapa ?? 0,
        orden: funnelConfig.length + 1,
        estatus: ESTATUS_ACTIVO,
      });
      setModal({ kind: "funnel", item: null });
    } else {
      setFormFuente({
        nombre: "",
        estatus: ESTATUS_ACTIVO,
        tipoFuente: "whatsapp",
      });
      setModal({ kind: "fuente", item: null });
    }
  };

  const abrirEditar = (
    kind: TabId,
    item: EntidadNegocio | EntidadServicio | EtapaConfiguracion | Fuente,
  ) => {
    if (kind === "negocio") {
      const row = item as EntidadNegocio;
      setFormNegocio({ nombre: row.nombre, estatus: row.estatus });
      setModal({ kind: "negocio", item: row });
    } else if (kind === "servicio") {
      const row = item as EntidadServicio;
      setFormServicio({ nombre: row.nombre, estatus: row.estatus });
      setModal({ kind: "servicio", item: row });
    } else if (kind === "funnel") {
      const row = item as EtapaConfiguracion;
      setFormFunnel({
        idEtapa: row.idEtapa,
        orden: row.orden,
        estatus: row.estatus,
      });
      setModal({ kind: "funnel", item: row });
    } else {
      const row = item as Fuente;
      setFormFuente({
        nombre: row.nombre,
        estatus: row.estatus,
        tipoFuente: row.tipoFuente,
      });
      setModal({ kind: "fuente", item: row });
    }
  };

  const cerrarModal = () => setModal(null);

  const guardarModal = async () => {
    if (!modal) return;
    setSaving(true);
    setError(null);
    try {
      if (modal.kind === "negocio") {
        const nombre = formNegocio.nombre.trim();
        if (!nombre) {
          alert("El nombre del negocio es obligatorio.");
          setSaving(false);
          return;
        }
        const payload = { ...formNegocio, nombre };
        if (modal.item) {
          await crmService.actualizarEntidadNegocio(
            modal.item.idEntidadNegocio,
            payload,
          );
        } else {
          await crmService.crearEntidadNegocio(payload);
        }
      } else if (modal.kind === "servicio") {
        const nombre = formServicio.nombre.trim();
        if (!nombre) {
          alert("El nombre del tipo de servicio es obligatorio.");
          setSaving(false);
          return;
        }
        const payload = { ...formServicio, nombre };
        if (modal.item) {
          await crmService.actualizarEntidadServicio(idServicio(modal.item), payload);
        } else {
          await crmService.crearEntidadServicio(payload);
        }
      } else if (modal.kind === "funnel") {
        if (!formFunnel.idEtapa) {
          alert("Seleccione una etapa del catálogo.");
          setSaving(false);
          return;
        }
        if (formFunnel.orden < 1) {
          alert("El orden debe ser mayor a cero.");
          setSaving(false);
          return;
        }
        const payload = { ...formFunnel };
        if (modal.item) {
          await crmService.actualizarEtapaConfiguracion(
            modal.item.idEtapaConfiguracion,
            payload,
          );
        } else {
          await crmService.crearEtapaConfiguracion(payload);
        }
      } else {
        const nombre = formFuente.nombre.trim();
        if (!nombre) {
          alert("El nombre de la fuente es obligatorio.");
          setSaving(false);
          return;
        }
        const payload = { ...formFuente, nombre };
        if (modal.item) {
          await crmService.actualizarFuente(modal.item.idFuente, payload);
        } else {
          await crmService.crearFuente(payload);
        }
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

  const eliminar = async (
    tipo: TabId,
    id: number,
    etiqueta: string,
  ): Promise<void> => {
    if (!window.confirm(`¿Eliminar ${etiqueta}?`)) return;
    setError(null);
    try {
      if (tipo === "negocio") await crmService.eliminarEntidadNegocio(id);
      else if (tipo === "servicio") await crmService.eliminarEntidadServicio(id);
      else if (tipo === "funnel") await crmService.eliminarEtapaConfiguracion(id);
      else await crmService.eliminarFuente(id);
      await cargar();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  const tituloModal =
    modal?.item == null
      ? tab === "negocio"
        ? "Nueva entidad de negocio"
        : tab === "servicio"
          ? "Nuevo tipo de servicio"
          : tab === "funnel"
            ? "Agregar etapa al funnel"
            : "Nueva fuente"
      : "Editar registro";

  return (
    <div className="space-y-6 p-6">
      <PageMeta
        title="Configuración CRM"
        description="Entidad de negocio, configuración del funnel de ventas y fuentes de información."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Configuración CRM
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure su negocio, el tipo de servicio, el orden del funnel de
            ventas y las fuentes por las que llegan los prospectos. Las opciones
            de etapa se definen en el catálogo de etapas.
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

      <nav className="flex flex-wrap gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`-mb-px px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === id
                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {TABS.find((t) => t.id === tab)?.label}
          </h2>
          <button
            type="button"
            onClick={abrirCrear}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Agregar
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="text-sm">Cargando…</p>
          </div>
        ) : tab === "negocio" ? (
          <TablaSimple
            vacio="No hay entidades de negocio registradas."
            filas={negocios}
            renderFila={(row) => (
              <tr key={row.idEntidadNegocio} className="border-t dark:border-gray-800">
                <td className="px-4 py-2">{row.nombre}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${estatusClass(row.estatus)}`}
                  >
                    {estatusLabel(row.estatus)}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <AccionesFila
                    onEditar={() => abrirEditar("negocio", row)}
                    onEliminar={() =>
                      void eliminar("negocio", row.idEntidadNegocio, row.nombre)
                    }
                  />
                </td>
              </tr>
            )}
          />
        ) : tab === "servicio" ? (
          <TablaSimple
            vacio="No hay tipos de servicio registrados."
            filas={servicios}
            renderFila={(row) => (
              <tr
                key={idServicio(row) || row.nombre}
                className="border-t dark:border-gray-800"
              >
                <td className="px-4 py-2">{row.nombre}</td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${estatusClass(row.estatus)}`}
                  >
                    {estatusLabel(row.estatus)}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <AccionesFila
                    onEditar={() => abrirEditar("servicio", row)}
                    onEliminar={() =>
                      void eliminar("servicio", idServicio(row), row.nombre)
                    }
                  />
                </td>
              </tr>
            )}
          />
        ) : tab === "funnel" ? (
          funnelConfig.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              No hay etapas configuradas en el funnel. Agregue etapas desde el
              catálogo para definir el orden de ventas.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      Orden
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      Etapa
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                      Estatus
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {funnelOrdenado(funnelConfig).map((row) => (
                    <tr
                      key={row.idEtapaConfiguracion}
                      className="border-t dark:border-gray-800"
                    >
                      <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                        {row.orden}
                      </td>
                      <td className="px-4 py-2">
                        {nombreEtapaFunnel(row, catalogoEtapas)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${estatusClass(row.estatus)}`}
                        >
                          {estatusLabel(row.estatus)}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <AccionesFila
                          onEditar={() => abrirEditar("funnel", row)}
                          onEliminar={() =>
                            void eliminar(
                              "funnel",
                              row.idEtapaConfiguracion,
                              nombreEtapaFunnel(row, catalogoEtapas),
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          <TablaSimple
            vacio="No hay fuentes de información registradas."
            filas={fuentes}
            extraHeader={
              <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                Tipo
              </th>
            }
            renderFila={(row) => (
              <tr key={row.idFuente} className="border-t dark:border-gray-800">
                <td className="px-4 py-2">{row.nombre}</td>
                <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                  {row.tipoFuente}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${estatusClass(row.estatus)}`}
                  >
                    {estatusLabel(row.estatus)}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <AccionesFila
                    onEditar={() => abrirEditar("fuentes", row)}
                    onEliminar={() =>
                      void eliminar("fuentes", row.idFuente, row.nombre)
                    }
                  />
                </td>
              </tr>
            )}
          />
        )}
      </div>

      {modal && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) cerrarModal();
          }}
        >
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-5 shadow-xl dark:border-gray-600 dark:bg-gray-800">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tituloModal}
            </h3>

            <div className="mt-4 space-y-4">
              {modal.kind === "funnel" ? (
                <>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Etapa del catálogo
                    </label>
                    <select
                      value={formFunnel.idEtapa || ""}
                      onChange={(e) =>
                        setFormFunnel((p) => ({
                          ...p,
                          idEtapa: Number(e.target.value),
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Seleccione una etapa</option>
                      {catalogoEtapas.map((etapa) => (
                        <option key={etapa.idEtapa} value={etapa.idEtapa}>
                          {etapa.nombre}
                          {etapa.estatus !== ESTATUS_ACTIVO ? " (Inactiva)" : ""}
                        </option>
                      ))}
                    </select>
                    {catalogoEtapas.length === 0 && (
                      <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        No hay etapas en el catálogo. Créelas en Catálogo de
                        Etapas.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Orden en el funnel
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formFunnel.orden}
                      onChange={(e) =>
                        setFormFunnel((p) => ({
                          ...p,
                          orden: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Nombre
                  </label>
                  <input
                    type="text"
                    value={
                      modal.kind === "negocio"
                        ? formNegocio.nombre
                        : modal.kind === "servicio"
                          ? formServicio.nombre
                          : formFuente.nombre
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      if (modal.kind === "negocio")
                        setFormNegocio((p) => ({ ...p, nombre: v }));
                      else if (modal.kind === "servicio")
                        setFormServicio((p) => ({ ...p, nombre: v }));
                      else setFormFuente((p) => ({ ...p, nombre: v }));
                    }}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              )}

              {modal.kind === "fuente" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Tipo de fuente
                  </label>
                  <select
                    value={formFuente.tipoFuente}
                    onChange={(e) =>
                      setFormFuente((p) => ({
                        ...p,
                        tipoFuente: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {TIPOS_FUENTE.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estatus
                </label>
                <select
                  value={
                    modal.kind === "negocio"
                      ? formNegocio.estatus
                      : modal.kind === "servicio"
                        ? formServicio.estatus
                        : modal.kind === "funnel"
                          ? formFunnel.estatus
                          : formFuente.estatus
                  }
                  onChange={(e) => {
                    const v = e.target.value as EstatusCrm;
                    if (modal.kind === "negocio")
                      setFormNegocio((p) => ({ ...p, estatus: v }));
                    else if (modal.kind === "servicio")
                      setFormServicio((p) => ({ ...p, estatus: v }));
                    else if (modal.kind === "funnel")
                      setFormFunnel((p) => ({ ...p, estatus: v }));
                    else setFormFuente((p) => ({ ...p, estatus: v }));
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value={ESTATUS_ACTIVO}>Activo</option>
                  <option value="I">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
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
                onClick={() => void guardarModal()}
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

function TablaSimple<T>({
  filas,
  vacio,
  renderFila,
  extraHeader,
}: {
  filas: T[];
  vacio: string;
  renderFila: (row: T) => React.ReactNode;
  extraHeader?: React.ReactNode;
}) {
  if (filas.length === 0) {
    return (
      <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
        {vacio}
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
              Nombre
            </th>
            {extraHeader}
            <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
              Estatus
            </th>
            <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>{filas.map((row) => renderFila(row))}</tbody>
      </table>
    </div>
  );
}

function AccionesFila({
  onEditar,
  onEliminar,
}: {
  onEditar: () => void;
  onEliminar: () => void;
}) {
  return (
    <div className="inline-flex gap-1">
      <button
        type="button"
        onClick={onEditar}
        title="Editar"
        className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onEliminar}
        title="Eliminar"
        className="rounded p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
