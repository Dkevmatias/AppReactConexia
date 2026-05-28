import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import {
  crmService,
  ESTATUS_ACTIVO,
  EstatusCrm,
  Fuente,
  FuentePayload,
} from "../../services/crmService";

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

function tipoFuenteLabel(tipo: string): string {
  return TIPOS_FUENTE.find((t) => t.value === tipo)?.label ?? tipo;
}

export default function CatalogoFuentes() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Fuente | null>(null);
  const [form, setForm] = useState<FuentePayload>({
    nombre: "",
    estatus: ESTATUS_ACTIVO,
    tipoFuente: "whatsapp",
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFuentes(await crmService.getFuentes());
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "No se pudieron cargar las fuentes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirCrear = () => {
    setForm({ nombre: "", estatus: ESTATUS_ACTIVO, tipoFuente: "whatsapp" });
    setEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (row: Fuente) => {
    setForm({
      nombre: row.nombre,
      estatus: row.estatus,
      tipoFuente: row.tipoFuente,
    });
    setEditando(row);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setEditando(null);
  };

  const guardar = async () => {
    const nombre = form.nombre.trim();
    if (!nombre) {
      alert("El nombre de la fuente es obligatorio.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = { ...form, nombre };
      if (editando) {
        await crmService.actualizarFuente(editando.idFuente, payload);
      } else {
        await crmService.crearFuente(payload);
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

  const eliminar = async (row: Fuente) => {
    if (!window.confirm(`¿Eliminar la fuente "${row.nombre}"?`)) return;
    setError(null);
    try {
      await crmService.eliminarFuente(row.idFuente);
      await cargar();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "No se pudo eliminar.");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageMeta
        title="Catálogo de Fuentes"
        description="Administre las fuentes de información de prospectos."
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Catálogo de Fuentes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure las fuentes por las que llegan los prospectos.
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

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Fuentes de información
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
        ) : fuentes.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            No hay fuentes de información registradas.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Nombre
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Tipo
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
                {fuentes.map((row) => (
                  <tr key={row.idFuente} className="border-t dark:border-gray-800">
                    <td className="px-4 py-2">{row.nombre}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                      {tipoFuenteLabel(row.tipoFuente)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${estatusClass(row.estatus)}`}
                      >
                        {estatusLabel(row.estatus)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => abrirEditar(row)}
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

      {modalAbierto && (
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
              {editando ? "Editar fuente" : "Nueva fuente"}
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nombre
                </label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, nombre: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tipo de fuente
                </label>
                <select
                  value={form.tipoFuente}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tipoFuente: e.target.value }))
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

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estatus
                </label>
                <select
                  value={form.estatus}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      estatus: e.target.value as EstatusCrm,
                    }))
                  }
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
