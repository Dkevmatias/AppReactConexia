import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import FormularioProspecto from "../../components/CRM/FormularioProspecto";
import {
  leadToForm,
  leadVacio,
  prepararPayload,
} from "../../components/CRM/prospectoFormUtils";
import {
  crmService,
  EntidadServicio,
  EstatusCatalogo,
  Etapa,
  Fuente,
  GrupoSAP,
} from "../../services/crmService";
import { LeadPayload, leadsService } from "../../services/leadsService";
import { useAuth } from "../../hooks/useAuth";

export default function ProspectoFormPage() {
  const { idLead: idLeadParam } = useParams<{ idLead?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const idLead = idLeadParam ? Number(idLeadParam) : null;
  const esEdicion = idLead != null && !Number.isNaN(idLead) && idLead > 0;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<LeadPayload>(leadVacio);
  const [etapas, setEtapas] = useState<Etapa[]>([]);
  const [fuentes, setFuentes] = useState<Fuente[]>([]);
  const [estatusLista, setEstatusLista] = useState<EstatusCatalogo[]>([]);
  const [servicios, setServicios] = useState<EntidadServicio[]>([]);
  const [gruposSAP, setGruposSAP] = useState<GrupoSAP[]>([]);

  const volverAlListado = () => {
    navigate("/CRM/Prospectos");
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [
      etapasRes,
      fuentesRes,
      estatusRes,
      serviciosRes,
      gruposSAPRes,
      leadRes,
    ] = await Promise.allSettled([
      crmService.getEtapas(),
      crmService.getFuentes(),
      crmService.getEstatusCatalogo(),
      crmService.getEntidadesServicio(),
      crmService.getGrupoSAP(),
      esEdicion && idLead
        ? leadsService.getLead(idLead)
        : Promise.resolve(null),
    ]);

    if (etapasRes.status === "fulfilled") setEtapas(etapasRes.value);
    if (fuentesRes.status === "fulfilled") setFuentes(fuentesRes.value);
    if (estatusRes.status === "fulfilled") setEstatusLista(estatusRes.value);
    if (serviciosRes.status === "fulfilled") setServicios(serviciosRes.value);
    if (gruposSAPRes.status === "fulfilled") setGruposSAP(gruposSAPRes.value);

    if (esEdicion) {
      if (leadRes.status === "fulfilled" && leadRes.value) {
        setForm(leadToForm(leadRes.value));
      } else {
        setError(
          leadRes.status === "rejected" && leadRes.reason instanceof Error
            ? leadRes.reason.message
            : "No se pudo cargar el prospecto.",
        );
      }
    } else {
      const base = leadVacio();
      if (user?.idPersona) {
        base.idUsuarioCreacion = user.idPersona;
        base.idUsuarioAsignado = user.idPersona;
      }
      setForm(base);
    }

    setLoading(false);
  }, [esEdicion, idLead, user?.idPersona]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const setCampo = <K extends keyof LeadPayload>(
    key: K,
    value: LeadPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const guardar = async () => {
    if (!(form.nombre ?? "").trim()) {
      alert("El nombre es obligatorio.");
      return;
    }

    setSaving(true);
    try {
      const payload = prepararPayload(form, user?.idPersona);
      if (esEdicion && idLead) {
        await leadsService.actualizarLead(idLead, payload);
      } else {
        await leadsService.crearLead(payload);
      }
      volverAlListado();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const titulo = esEdicion ? "Editar prospecto" : "Nuevo prospecto";

  return (
    <div className="space-y-6 p-6">
      <PageMeta
        title={titulo}
        description="Alta y edición de prospectos del CRM."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={volverAlListado}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al listado
          </button>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            {titulo}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Complete los datos del prospecto y guarde los cambios.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="text-sm">Cargando formulario…</p>
          </div>
        ) : (
          <>
            <FormularioProspecto
              form={form}
              onChange={setCampo}
              etapas={etapas}
              fuentes={fuentes}
              estatusLista={estatusLista}
              servicios={servicios}
              gruposSAP={gruposSAP}
            />

            <div className="mt-6 flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
              <button
                type="button"
                onClick={volverAlListado}
                disabled={saving}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void guardar()}
                disabled={saving || !!error}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
