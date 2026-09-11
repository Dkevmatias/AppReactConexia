import { useEffect, useState } from "react";
import { Plus, Trash2, UserPlus, X } from "lucide-react";
import {
  contactoVacio,
  nombreCompletoContacto,
  validarContactosUnicos,
  type ContactoClienteForm,
  type EnviarCorreoContacto,
  type GeneroContacto,
} from "./clienteAltaUtils";
import { prospectoInputClass, prospectoLabelClass } from "./prospectoFormUtils";

type ModalContactosClienteProps = {
  abierto: boolean;
  contactos: ContactoClienteForm[];
  onGuardar: (contactos: ContactoClienteForm[]) => void | Promise<void>;
  onCerrar: () => void;
  soloLectura?: boolean;
};

export default function ModalContactosCliente({
  abierto,
  contactos,
  onGuardar,
  onCerrar,
  soloLectura = false,
}: ModalContactosClienteProps) {
  const [borrador, setBorrador] = useState<ContactoClienteForm[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setBorrador(
      contactos.length > 0
        ? contactos.map((c) => ({ ...c }))
        : [contactoVacio()],
    );
    setError(null);
  }, [abierto, contactos]);

  if (!abierto) return null;

  const actualizar = (
    idLocal: string,
    parcial: Partial<ContactoClienteForm>,
  ) => {
    setBorrador((prev) =>
      prev.map((c) => (c.idLocal === idLocal ? { ...c, ...parcial } : c)),
    );
  };

  const agregar = () => {
    setBorrador((prev) => [...prev, contactoVacio()]);
  };

  const quitar = (idLocal: string) => {
    setBorrador((prev) => {
      const next = prev.filter((c) => c.idLocal !== idLocal);
      return next.length > 0 ? next : [contactoVacio()];
    });
  };

  const guardar = async () => {
    const validos = borrador.filter(
      (c) =>
        c.nombre.trim() ||
        c.apellido1.trim() ||
        c.telefono1.trim() ||
        c.email.trim(),
    );
    if (validos.length === 0) {
      setError("Capture al menos un contacto con nombre.");
      return;
    }
    for (const c of validos) {
      if (!c.nombre.trim()) {
        setError("Cada contacto debe tener al menos el nombre.");
        return;
      }
      if (c.telefono1.trim().length > 20 || c.telefono2.trim().length > 20) {
        setError("El teléfono no puede exceder 20 caracteres.");
        return;
      }
      if (c.titulo.trim().length > 20) {
        setError("El título no puede exceder 20 caracteres.");
        return;
      }
    }
    const duplicados = validarContactosUnicos(validos);
    if (duplicados) {
      setError(duplicados);
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      await onGuardar(validos);
      onCerrar();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo guardar el contacto.",
      );
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[210] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Agregar contactos"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !guardando) onCerrar();
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-gray-200 bg-white shadow-xl sm:rounded-xl dark:border-gray-600 dark:bg-gray-800">
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 py-4 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {soloLectura ? "Contactos del cliente" : "Agregar contactos"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {soloLectura
                  ? "Cliente ya enviado a SAP: contactos en solo lectura."
                  : "Capture uno o más contactos del cliente. Si el cliente ya está en CRM, se guardan al confirmar."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <fieldset
          disabled={soloLectura}
          className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto border-0 p-4 disabled:opacity-90"
        >
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          {borrador.map((contacto, indice) => (
            <article
              key={contacto.idLocal}
              className="rounded-lg border border-gray-200 bg-gray-50/70 p-4 dark:border-gray-600 dark:bg-gray-900/40"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Contacto {indice + 1}
                  {nombreCompletoContacto(contacto)
                    ? ` · ${nombreCompletoContacto(contacto)}`
                    : ""}
                </p>
                <button
                  type="button"
                  onClick={() => quitar(contacto.idLocal)}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Quitar
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className={prospectoLabelClass}>Nombre</label>
                  <input
                    type="text"
                    value={contacto.nombre}
                    onChange={(e) =>
                      actualizar(contacto.idLocal, { nombre: e.target.value })
                    }
                    className={prospectoInputClass}
                  />
                </div>
                <div>
                  <label className={prospectoLabelClass}>Apellido 1</label>
                  <input
                    type="text"
                    value={contacto.apellido1}
                    onChange={(e) =>
                      actualizar(contacto.idLocal, {
                        apellido1: e.target.value,
                      })
                    }
                    className={prospectoInputClass}
                  />
                </div>
                <div>
                  <label className={prospectoLabelClass}>Apellido 2</label>
                  <input
                    type="text"
                    value={contacto.apellido2}
                    onChange={(e) =>
                      actualizar(contacto.idLocal, {
                        apellido2: e.target.value,
                      })
                    }
                    className={prospectoInputClass}
                  />
                </div>
                <div>
                  <label className={prospectoLabelClass}>Título</label>
                  <input
                    type="text"
                    value={contacto.titulo}
                    onChange={(e) =>
                      actualizar(contacto.idLocal, { titulo: e.target.value })
                    }
                    className={prospectoInputClass}
                  />
                </div>
                <div>
                  <label className={prospectoLabelClass}>Posición</label>
                  <input
                    type="text"
                    value={contacto.posicion}
                    onChange={(e) =>
                      actualizar(contacto.idLocal, {
                        posicion: e.target.value,
                      })
                    }
                    className={prospectoInputClass}
                  />
                </div>
                <div>
                  <label className={prospectoLabelClass}>Teléfono 1</label>
                  <input
                    type="tel"
                    value={contacto.telefono1}
                    onChange={(e) =>
                      actualizar(contacto.idLocal, {
                        telefono1: e.target.value,
                      })
                    }
                    className={prospectoInputClass}
                  />
                </div>
                <div>
                  <label className={prospectoLabelClass}>Teléfono 2</label>
                  <input
                    type="tel"
                    value={contacto.telefono2}
                    onChange={(e) =>
                      actualizar(contacto.idLocal, {
                        telefono2: e.target.value,
                      })
                    }
                    className={prospectoInputClass}
                  />
                </div>
                <div>
                  <label className={prospectoLabelClass}>Email</label>
                  <input
                    type="email"
                    value={contacto.email}
                    onChange={(e) =>
                      actualizar(contacto.idLocal, { email: e.target.value })
                    }
                    className={prospectoInputClass}
                  />
                </div>
                <div>
                  <label className={prospectoLabelClass}>Género</label>
                  <select
                    value={contacto.genero}
                    onChange={(e) =>
                      actualizar(contacto.idLocal, {
                        genero: e.target.value as GeneroContacto,
                      })
                    }
                    className={prospectoInputClass}
                  >
                    <option value="">Seleccione</option>
                    <option value="M">Masculino (M)</option>
                    <option value="F">Femenino (F)</option>
                  </select>
                </div>
                <div>
                  <label className={prospectoLabelClass}>Enviar por correo</label>
                  <select
                    value={contacto.enviarCorreo}
                    onChange={(e) =>
                      actualizar(contacto.idLocal, {
                        enviarCorreo: e.target.value as EnviarCorreoContacto,
                      })
                    }
                    className={prospectoInputClass}
                  >
                    <option value="">Seleccione</option>
                    <option value="Y">Sí (Y)</option>
                    <option value="N">No (N)</option>
                  </select>
                </div>
              </div>
            </article>
          ))}

          <button
            type="button"
            onClick={agregar}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
          >
            <Plus className="h-4 w-4" />
            Agregar otro contacto
          </button>
        </fieldset>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-gray-200 px-4 py-3 sm:flex-row sm:justify-end dark:border-gray-700">
          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            {soloLectura ? "Cerrar" : "Cancelar"}
          </button>
          {!soloLectura ? (
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={guardando}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {guardando ? "Guardando…" : "Guardar contactos"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
