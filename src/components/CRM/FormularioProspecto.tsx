import {
  EntidadServicio,
  EstatusCatalogo,
  Etapa,
  Fuente,
  GrupoSAP,
} from "../../services/crmService";
import { LeadPayload } from "../../services/leadsService";
import {
  fechaParaInput,
  prospectoInputClass,
  prospectoLabelClass,
} from "./prospectoFormUtils";

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
};

export default function FormularioProspecto({
  form,
  onChange,
  etapas,
  fuentes,
  estatusLista,
  servicios,
  gruposSAP,
}: FormularioProspectoProps) {
  const setIdSelect = (key: keyof LeadPayload, value: string) => {
    onChange(key, value ? Number(value) : null);
  };

  return (
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
            <label className={prospectoLabelClass}>Teléfono</label>
            <input
              type="tel"
              value={form.telefono ?? ""}
              onChange={(e) => onChange("telefono", e.target.value)}
              className={prospectoInputClass}
            />
          </div>
          <div>
            <label className={prospectoLabelClass}>Correo</label>
            <input
              type="email"
              value={form.correo ?? ""}
              onChange={(e) => onChange("correo", e.target.value)}
              className={prospectoInputClass}
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
            <label className={prospectoLabelClass}>Etapa</label>
            <select
              value={form.idEtapa ?? ""}
              onChange={(e) => setIdSelect("idEtapa", e.target.value)}
              className={prospectoInputClass}
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
          Ubicación y campaña
        </h4>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className={prospectoLabelClass}>Unidad</label>
            <input
              type="text"
              value={form.unidad ?? ""}
              onChange={(e) => onChange("unidad", e.target.value)}
              className={prospectoInputClass}
            />
          </div>
          <div>
            <label className={prospectoLabelClass}>Campaña</label>
            <input
              type="text"
              value={form.campaign ?? ""}
              onChange={(e) => onChange("campaign", e.target.value)}
              className={prospectoInputClass}
            />
          </div>
          <div>
            <label className={prospectoLabelClass}>Estado</label>
            <input
              type="text"
              value={form.estado ?? ""}
              onChange={(e) => onChange("estado", e.target.value)}
              className={prospectoInputClass}
            />
          </div>
          <div>
            <label className={prospectoLabelClass}>Ciudad</label>
            <input
              type="text"
              value={form.ciudad ?? ""}
              onChange={(e) => onChange("ciudad", e.target.value)}
              className={prospectoInputClass}
            />
          </div>
          <div>
            <label className={prospectoLabelClass}>Municipio</label>
            <input
              type="text"
              value={form.municipio ?? ""}
              onChange={(e) => onChange("municipio", e.target.value)}
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
    </div>
  );
}
