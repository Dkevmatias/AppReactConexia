import { useEffect, useState } from "react";
import ModalConfirmacion from "../common/ModalConfirmacion";
import {
  EntidadServicio,
  EstatusCatalogo,
  Etapa,
  Fuente,
  GrupoSAP,
} from "../../services/crmService";
import { LeadPayload } from "../../services/leadsService";
import type { ActivityTimelineItem } from "../../services/activityTimelineService";
import TabsCreacionCliente from "./TabsCreacionCliente";
import TabSeguimientosLead from "./TabSeguimientosLead";
import { ClienteAltaForm, prellenarClienteDesdeLead } from "./clienteAltaUtils";
import {
  esCorreoValido,
  esEtapaCliente,
  fechaParaInput,
  prospectoInputClass,
  prospectoInputClassError,
  prospectoLabelClass,
  prospectoLabelClassError,
  soloDigitosTelefono,
} from "./prospectoFormUtils";

type SeccionProspecto = "cliente" | "seguimientos";

export type FormularioProspectoProps = {
  form: LeadPayload;
  onChange: <K extends keyof LeadPayload>(
    key: K,
    value: LeadPayload[K],
  ) => void;
  etapas: Etapa[];
  fuentes: Fuente[];
  estatusLista: EstatusCatalogo[];
  servicios: EntidadServicio[];
  gruposSAP: GrupoSAP[];
  clienteAlta: ClienteAltaForm;
  onClienteAltaChange: (parcial: Partial<ClienteAltaForm>) => void;
  clienteExistente?: boolean;
  /** Si true, el lead ya es Cliente y no puede cambiar de etapa. */
  etapaBloqueada?: boolean;
  onGuardarContactos?: (
    contactos: ClienteAltaForm["contactos"],
  ) => void | Promise<void>;
  onGuardarDireccion?: (
    direccion: ClienteAltaForm["direcciones"][number],
  ) => void | Promise<void>;
  onGuardarDescuentos?: () => void | Promise<void>;
  onEnviarDescuentosSap?: () => void | Promise<void>;
  cardCodeCliente?: string | null;
  actividades?: ActivityTimelineItem[];
  loadingActividades?: boolean;
  idLead?: number | null;
  idUsuarioCreacion?: number | null;
  onSeguimientoGuardado?: () => void | Promise<void>;
  /** Cliente enviado a SAP: bloquear edición de datos del cliente. */
  clienteSoloLectura?: boolean;
  /** Claves de campos obligatorios faltantes (tras intento de guardar). */
  camposInvalidosCliente?: Set<string>;
  /** Texto opcional del aviso de bloqueo SAP. */
  avisoClienteSap?: string | null;
};

export default function FormularioProspecto({
  form,
  onChange,
  etapas,
  fuentes,
  estatusLista,
  servicios,
  gruposSAP,
  clienteAlta,
  onClienteAltaChange,
  clienteExistente = false,
  etapaBloqueada = false,
  onGuardarContactos,
  onGuardarDireccion,
  onGuardarDescuentos,
  onEnviarDescuentosSap,
  cardCodeCliente = null,
  actividades = [],
  loadingActividades = false,
  idLead = null,
  idUsuarioCreacion = null,
  onSeguimientoGuardado,
  clienteSoloLectura = false,
  camposInvalidosCliente,
  avisoClienteSap = null,
}: FormularioProspectoProps) {
  const [crearClienteActivo, setCrearClienteActivo] = useState(
    () => clienteExistente || esEtapaCliente(form.idEtapa, etapas),
  );
  const [modalCrearCliente, setModalCrearCliente] = useState(false);
  const [idEtapaPendiente, setIdEtapaPendiente] = useState("");
  const [usarCodialub, setUsarCodialub] = useState(false);
  const [usarCodial, setUsarCodial] = useState(false);
  const [seccionActiva, setSeccionActiva] =
    useState<SeccionProspecto>("seguimientos");

  useEffect(() => {
    if (clienteExistente || esEtapaCliente(form.idEtapa, etapas)) {
      setCrearClienteActivo(true);
      setSeccionActiva("cliente");
      if (!clienteExistente && !clienteAlta.cardName.trim()) {
        onClienteAltaChange(
          prellenarClienteDesdeLead({
            actual: clienteAlta,
            nombre: form.nombre,
            aPaterno: form.aPaterno,
            telefono: form.telefono,
            correo: form.correo,
          }),
        );
      }
    }
  }, [form.idEtapa, etapas, clienteExistente]);

  useEffect(() => {
    if (!crearClienteActivo && seccionActiva === "cliente") {
      setSeccionActiva("seguimientos");
    }
  }, [crearClienteActivo, seccionActiva]);

  const setIdSelect = (key: keyof LeadPayload, value: string) => {
    onChange(key, value ? Number(value) : null);
  };

  const handleEtapaChange = (value: string) => {
    if (etapaBloqueada) return;

    const nuevoId = value ? Number(value) : null;
    const eraCliente = esEtapaCliente(form.idEtapa, etapas);
    const seraCliente = esEtapaCliente(nuevoId, etapas);

    if (!eraCliente && seraCliente) {
      setIdEtapaPendiente(value);
      setModalCrearCliente(true);
      return;
    }

    if (eraCliente && !seraCliente) {
      setCrearClienteActivo(false);
    }

    setIdSelect("idEtapa", value);
  };

  const confirmarCrearCliente = () => {
    onClienteAltaChange(
      prellenarClienteDesdeLead({
        actual: clienteAlta,
        nombre: form.nombre,
        aPaterno: form.aPaterno,
        telefono: form.telefono,
        correo: form.correo,
      }),
    );
    setCrearClienteActivo(true);
    setSeccionActiva("cliente");
    setIdSelect("idEtapa", idEtapaPendiente);
    setModalCrearCliente(false);
    setIdEtapaPendiente("");
  };

  const cancelarCrearCliente = () => {
    setModalCrearCliente(false);
    setIdEtapaPendiente("");
  };

  return (
    <>
      <div className="space-y-6">
        <section>
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Datos personales
          </h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={prospectoLabelClass}>
                Nombre <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.nombre ?? ""}
                onChange={(e) => onChange("nombre", e.target.value)}
                className={prospectoInputClass}
                required
              />
            </div>
            <div>
              <label className={prospectoLabelClass}>Apellido paterno</label>
              <input
                type="text"
                value={form.aPaterno ?? ""}
                onChange={(e) => onChange("aPaterno", e.target.value)}
                className={prospectoInputClass}
              />
            </div>
            <div>
              <label className={prospectoLabelClass}>Apellido materno</label>
              <input
                type="text"
                value={form.aMaterno ?? ""}
                onChange={(e) => onChange("aMaterno", e.target.value)}
                className={prospectoInputClass}
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
              <label className={prospectoLabelClass}>
                Teléfono <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                pattern="[0-9]{1,10}"
                value={form.telefono ?? ""}
                onChange={(e) =>
                  onChange("telefono", soloDigitosTelefono(e.target.value))
                }
                className={prospectoInputClass}
                required
                placeholder="10 dígitos"
                title="Solo números, máximo 10 dígitos"
              />
            </div>
            <div>
              <label
                className={prospectoLabelClassError(
                  Boolean((form.correo ?? "").trim()) &&
                    !esCorreoValido(form.correo),
                )}
              >
                Correo
              </label>
              <input
                type="email"
                value={form.correo ?? ""}
                onChange={(e) => onChange("correo", e.target.value)}
                className={prospectoInputClassError(
                  Boolean((form.correo ?? "").trim()) &&
                    !esCorreoValido(form.correo),
                )}
                placeholder="ejemplo@correo.com"
                autoComplete="email"
              />
              {(form.correo ?? "").trim() && !esCorreoValido(form.correo) ? (
                <p className="mt-1 text-[11px] text-amber-700 dark:text-amber-300">
                  Capture un correo válido (ej. nombre@dominio.com).
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
            Clasificación CRM
          </h4>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className={prospectoLabelClass}>Etapa</label>
              <select
                value={form.idEtapa ?? ""}
                onChange={(e) => handleEtapaChange(e.target.value)}
                className={prospectoInputClass}
                disabled={etapaBloqueada}
                title={
                  etapaBloqueada
                    ? "El prospecto ya es Cliente; la etapa no se puede cambiar."
                    : undefined
                }
              >
                <option value="">Sin etapa</option>
                {etapas.map((e) => (
                  <option key={e.idEtapa} value={e.idEtapa}>
                    {e.nombre}
                  </option>
                ))}
              </select>
              {etapaBloqueada ? (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Ya convertido a Cliente: la etapa quedó bloqueada.
                </p>
              ) : null}
            </div>
            <div>
              <label className={prospectoLabelClass}>Estatus</label>
              <select
                value={form.idEstatus ?? ""}
                onChange={(e) => setIdSelect("idEstatus", e.target.value)}
                className={prospectoInputClass}
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
              <label className={prospectoLabelClass}>Fuente</label>
              <select
                value={form.idFuente ?? ""}
                onChange={(e) => setIdSelect("idFuente", e.target.value)}
                className={prospectoInputClass}
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
              <label className={prospectoLabelClass}>Grupo</label>
              <select
                value={form.idGrupo ?? ""}
                onChange={(e) => setIdSelect("idGrupo", e.target.value)}
                className={prospectoInputClass}
              >
                <option value="">Sin grupo</option>
                {gruposSAP.map((g) => (
                  <option key={g.idGrupo} value={g.idGrupo}>
                    {g.groupName?.trim() || `Grupo ${g.idGrupo}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={prospectoLabelClass}>Intereses</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.presupuesto ?? ""}
                onChange={(e) =>
                  onChange(
                    "presupuesto",
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className={prospectoInputClass}
              />
            </div>
            <div>
              <label className={prospectoLabelClass}>Fecha de llegada</label>
              <input
                type="datetime-local"
                value={fechaParaInput(form.fechallegada)}
                onChange={(e) =>
                  onChange(
                    "fechallegada",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  )
                }
                className={prospectoInputClass}
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
            onChange={(e) => onChange("observaciones", e.target.value)}
            className={prospectoInputClass}
          />
        </section>

        <section className="mt-2 border-t border-gray-200 pt-6 dark:border-gray-700">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
            <div
              className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700"
              role="tablist"
              aria-label="Secciones del prospecto"
            >
              {crearClienteActivo ? (
                <button
                  type="button"
                  role="tab"
                  aria-selected={seccionActiva === "cliente"}
                  onClick={() => setSeccionActiva("cliente")}
                  className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors sm:px-5 ${
                    seccionActiva === "cliente"
                      ? "border-b-2 border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-gray-800 dark:text-blue-300"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  Alta de cliente
                </button>
              ) : null}
              <button
                type="button"
                role="tab"
                aria-selected={seccionActiva === "seguimientos"}
                onClick={() => setSeccionActiva("seguimientos")}
                className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors sm:px-5 ${
                  seccionActiva === "seguimientos"
                    ? "border-b-2 border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-gray-800 dark:text-blue-300"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                }`}
              >
                Seguimientos
                {actividades.length > 0 ? (
                  <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-gray-700">
                    {actividades.length}
                  </span>
                ) : null}
              </button>
            </div>

            <div role="tabpanel">
              {seccionActiva === "cliente" && crearClienteActivo ? (
                <div>
                  <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                    {avisoClienteSap ? (
                      <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200">
                        {avisoClienteSap}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Elegir la empresa antes de dar de Alta al Cliente
                      </p>
                    )}
                    <div className="flex gap-6">
                      <label className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={usarCodialub}
                          onChange={(e) => {
                            setUsarCodialub(e.target.checked);
                          }}
                        />
                        Codialub
                      </label>
                      <label className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        <input
                          type="checkbox"
                          checked={usarCodial}
                          onChange={(e) => {
                            setUsarCodial(e.target.checked);
                          }}
                        />
                        Codial
                      </label>
                    </div>
                  </div>

                  <TabsCreacionCliente
                    visible
                    embebido
                    datos={clienteAlta}
                    onChange={onClienteAltaChange}
                    onGuardarContactos={onGuardarContactos}
                    clientePersistido={clienteExistente}
                    onGuardarDireccion={onGuardarDireccion}
                    onGuardarDescuentos={onGuardarDescuentos}
                    onEnviarDescuentosSap={onEnviarDescuentosSap}
                    cardCode={cardCodeCliente}
                    soloLectura={clienteSoloLectura}
                    camposInvalidos={camposInvalidosCliente}
                  />
                </div>
              ) : (
                <div>
                  <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Historial del prospecto por tipo de actividad.
                    </p>
                  </div>
                  <TabSeguimientosLead
                    embebido
                    items={actividades}
                    loading={loadingActividades}
                    idLead={idLead}
                    idUsuarioCreacion={idUsuarioCreacion}
                    telefonoDefault={form.telefono || clienteAlta.phone1}
                    onGuardado={onSeguimientoGuardado}
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <ModalConfirmacion
        abierto={modalCrearCliente}
        titulo="¿Desea crear el cliente?"
        mensaje="Se habilitarán las pestañas General, Direcciones, Condición de pago y Campos de usuario. El CardCode lo asigna después un usuario con permiso."
        textoConfirmar="Sí, crear cliente"
        textoCancelar="No, cancelar"
        onConfirmar={confirmarCrearCliente}
        onCancelar={cancelarCrearCliente}
      />
    </>
  );
}
