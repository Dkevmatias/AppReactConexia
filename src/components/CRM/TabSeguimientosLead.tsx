import { useMemo, useState, type ReactNode } from "react";
import { Loader2, Plus } from "lucide-react";
import {
  activityTimelineService,
  ahoraParaInputDatetime,
  etiquetaTipoActividad,
  formatearFechaActividad,
  inputDatetimeAIso,
  isoAInputDatetime,
  type ActivityTimelineItem,
  type LeadSeguimientoCreatePayload,
  type LeadSeguimientoDetalle,
  type TipoActividadTimeline,
} from "../../services/activityTimelineService";
import { prospectoInputClass, prospectoLabelClass } from "./prospectoFormUtils";

const SUBTABS = [
  { id: "mensaje" as const, label: "Mensajes" },
  { id: "llamada" as const, label: "Llamadas" },
  { id: "visita" as const, label: "Visita" },
  { id: "cotizacion" as const, label: "Cotización" },
  { id: "nota" as const, label: "Notas" },
  { id: "recordatorio" as const, label: "Recordatorios" },
];

type TabSeguimientosLeadProps = {
  items: ActivityTimelineItem[];
  loading?: boolean;
  embebido?: boolean;
  idLead?: number | null;
  idUsuarioCreacion?: number | null;
  telefonoDefault?: string | null;
  onGuardado?: () => void | Promise<void>;
};

type FormMensaje = {
  canal: string;
  telefono: string;
  cuerpo: string;
  estatusEnvio: string;
  fechaEnvio: string;
  comentario: string;
};

type FormLlamada = {
  telefono: string;
  entrante: "N" | "S";
  resultado: string;
  duracionSegundos: string;
  observaciones: string;
  fechaLlamada: string;
  comentario: string;
};

type FormVisita = {
  direccion: string;
  ciudad: string;
  estado: string;
  resultado: string;
  observaciones: string;
  completada: "N" | "S";
  fechaVisita: string;
  comentario: string;
};

type FormCotizacion = {
  folio: string;
  total: string;
  moneda: string;
  estatus: string;
  docNum: string;
  cardCode: string;
  comentarios: string;
  fechaInicio: string;
  comentario: string;
};

type FormNota = {
  comentario: string;
  fechaSeguimiento: string;
};

type FormRecordatorio = {
  comentario: string;
  fechaSeguimiento: string;
};

function formMensajeVacio(tel: string): FormMensaje {
  return {
    canal: "WhatsApp",
    telefono: tel,
    cuerpo: "",
    estatusEnvio: "sent",
    fechaEnvio: ahoraParaInputDatetime(),
    comentario: "",
  };
}

function formLlamadaVacio(tel: string): FormLlamada {
  return {
    telefono: tel,
    entrante: "N",
    resultado: "",
    duracionSegundos: "",
    observaciones: "",
    fechaLlamada: ahoraParaInputDatetime(),
    comentario: "",
  };
}

function formVisitaVacio(): FormVisita {
  return {
    direccion: "",
    ciudad: "",
    estado: "",
    resultado: "",
    observaciones: "",
    completada: "N",
    fechaVisita: ahoraParaInputDatetime(),
    comentario: "",
  };
}

function formCotizacionVacio(): FormCotizacion {
  return {
    folio: "",
    total: "",
    moneda: "MXN",
    estatus: "Abierta",
    docNum: "",
    cardCode: "",
    comentarios: "",
    fechaInicio: ahoraParaInputDatetime(),
    comentario: "",
  };
}

function formNotaVacio(): FormNota {
  return {
    comentario: "",
    fechaSeguimiento: ahoraParaInputDatetime(),
  };
}

function formRecordatorioVacio(): FormRecordatorio {
  return {
    comentario: "",
    fechaSeguimiento: ahoraParaInputDatetime(),
  };
}

export default function TabSeguimientosLead({
  items,
  loading = false,
  embebido = false,
  idLead = null,
  idUsuarioCreacion = null,
  telefonoDefault = "",
  onGuardado,
}: TabSeguimientosLeadProps) {
  const [subTab, setSubTab] = useState<TipoActividadTimeline>("mensaje");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [modoVista, setModoVista] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const tel = (telefonoDefault ?? "").trim();
  const [formMensaje, setFormMensaje] = useState<FormMensaje>(() =>
    formMensajeVacio(tel),
  );
  const [formLlamada, setFormLlamada] = useState<FormLlamada>(() =>
    formLlamadaVacio(tel),
  );
  const [formVisita, setFormVisita] = useState<FormVisita>(formVisitaVacio);
  const [formCotizacion, setFormCotizacion] = useState<FormCotizacion>(
    formCotizacionVacio,
  );
  const [formNota, setFormNota] = useState<FormNota>(formNotaVacio);
  const [formRecordatorio, setFormRecordatorio] = useState<FormRecordatorio>(
    formRecordatorioVacio,
  );

  const filtrados = useMemo(
    () => items.filter((i) => i.tipo === subTab),
    [items, subTab],
  );

  const puedeRegistrar = (idLead ?? 0) > 0 && (idUsuarioCreacion ?? 0) > 0;

  const cerrarForm = () => {
    setMostrarForm(false);
    setModoVista(false);
    setErrorForm(null);
  };

  const abrirForm = (tipo: TipoActividadTimeline) => {
    setSubTab(tipo);
    setErrorForm(null);
    setModoVista(false);
    if (tipo === "mensaje") setFormMensaje(formMensajeVacio(tel));
    if (tipo === "llamada") setFormLlamada(formLlamadaVacio(tel));
    if (tipo === "visita") setFormVisita(formVisitaVacio());
    if (tipo === "cotizacion") setFormCotizacion(formCotizacionVacio());
    if (tipo === "nota") setFormNota(formNotaVacio());
    if (tipo === "recordatorio") setFormRecordatorio(formRecordatorioVacio());
    setMostrarForm(true);
  };

  const aplicarDetalleAlForm = (detalle: LeadSeguimientoDetalle) => {
    const fechaPadre = isoAInputDatetime(detalle.fechaSeguimiento);
    const tipo = detalle.tipo;

    if (tipo === "mensaje") {
      const m = detalle.mensaje;
      setFormMensaje({
        canal: m?.canal?.trim() || "WhatsApp",
        telefono: m?.telefono?.trim() || "",
        cuerpo: m?.cuerpo?.trim() || "",
        estatusEnvio: m?.estatusEnvio?.trim() || "",
        fechaEnvio: isoAInputDatetime(m?.fechaEnvio) || fechaPadre,
        comentario: detalle.comentario?.trim() || "",
      });
      return;
    }

    if (tipo === "llamada") {
      const l = detalle.llamada;
      setFormLlamada({
        telefono: l?.telefono?.trim() || "",
        entrante: l?.entrante ? "S" : "N",
        resultado: l?.resultado?.trim() || "",
        duracionSegundos:
          l?.duracionSegundos != null ? String(l.duracionSegundos) : "",
        observaciones: l?.observaciones?.trim() || "",
        fechaLlamada: isoAInputDatetime(l?.fechaLlamada) || fechaPadre,
        comentario: detalle.comentario?.trim() || "",
      });
      return;
    }

    if (tipo === "visita") {
      const v = detalle.visita;
      setFormVisita({
        direccion: v?.direccion?.trim() || "",
        ciudad: v?.ciudad?.trim() || "",
        estado: v?.estado?.trim() || "",
        resultado: v?.resultado?.trim() || "",
        observaciones: v?.observaciones?.trim() || "",
        completada: v?.completada ? "S" : "N",
        fechaVisita: isoAInputDatetime(v?.fechaVisita) || fechaPadre,
        comentario: detalle.comentario?.trim() || "",
      });
      return;
    }

    if (tipo === "cotizacion") {
      const c = detalle.cotizacion;
      setFormCotizacion({
        folio: c?.folio?.trim() || "",
        total: c?.total != null ? String(c.total) : "",
        moneda: c?.moneda?.trim() || "MXN",
        estatus: c?.estatus?.trim() || "",
        docNum: c?.docNum != null ? String(c.docNum) : "",
        cardCode: c?.cardCode?.trim() || "",
        comentarios: c?.comentarios?.trim() || "",
        fechaInicio: fechaPadre || ahoraParaInputDatetime(),
        comentario: detalle.comentario?.trim() || "",
      });
      return;
    }

    if (tipo === "nota") {
      setFormNota({
        comentario: detalle.comentario?.trim() || "",
        fechaSeguimiento: fechaPadre || ahoraParaInputDatetime(),
      });
      return;
    }

    if (tipo === "recordatorio") {
      setFormRecordatorio({
        comentario: detalle.comentario?.trim() || "",
        fechaSeguimiento: fechaPadre || ahoraParaInputDatetime(),
      });
    }
  };

  const verDetalle = async (item: ActivityTimelineItem) => {
    if (!item.id || item.id <= 0) {
      setErrorForm("Este seguimiento no tiene un identificador válido.");
      return;
    }
    setCargandoDetalle(true);
    setErrorForm(null);
    try {
      const detalle = await activityTimelineService.getById(item.id);
      const tipoVista =
        detalle.tipo === "mensaje" ||
        detalle.tipo === "llamada" ||
        detalle.tipo === "visita" ||
        detalle.tipo === "cotizacion" ||
        detalle.tipo === "nota" ||
        detalle.tipo === "recordatorio"
          ? detalle.tipo
          : item.tipo;
      setSubTab(tipoVista as typeof subTab);
      aplicarDetalleAlForm({ ...detalle, tipo: tipoVista });
      setModoVista(true);
      setMostrarForm(true);
    } catch (e) {
      setErrorForm(
        e instanceof Error
          ? e.message
          : "No se pudo cargar el detalle del seguimiento.",
      );
      setMostrarForm(false);
      setModoVista(false);
    } finally {
      setCargandoDetalle(false);
    }
  };

  const cambiarSubTab = (tipo: TipoActividadTimeline) => {
    setSubTab(tipo);
    setMostrarForm(false);
    setModoVista(false);
    setErrorForm(null);
  };

  const armarPayload = (): LeadSeguimientoCreatePayload => {
    const lead = idLead!;
    const usuario = idUsuarioCreacion!;
    const base = {
      idLead: lead,
      idUsuarioCreacion: usuario,
      idUsuarioAsignado: usuario,
      activo: true,
      estatus: "A",
    };

    if (subTab === "mensaje") {
      const fecha = inputDatetimeAIso(formMensaje.fechaEnvio);
      return {
        ...base,
        comentario: formMensaje.comentario.trim() || formMensaje.cuerpo.trim(),
        fechaSeguimiento: fecha,
        mensaje: {
          canal: formMensaje.canal.trim() || "WhatsApp",
          telefono: formMensaje.telefono.trim() || null,
          cuerpo: formMensaje.cuerpo.trim() || null,
          estatusEnvio: formMensaje.estatusEnvio.trim() || "sent",
          fechaEnvio: fecha,
        },
      };
    }

    if (subTab === "llamada") {
      const fecha = inputDatetimeAIso(formLlamada.fechaLlamada);
      const dur = Number(formLlamada.duracionSegundos);
      return {
        ...base,
        comentario:
          formLlamada.comentario.trim() ||
          formLlamada.resultado.trim() ||
          "Llamada",
        fechaSeguimiento: fecha,
        llamada: {
          telefono: formLlamada.telefono.trim() || null,
          entrante: formLlamada.entrante === "S",
          resultado: formLlamada.resultado.trim() || null,
          duracionSegundos: Number.isFinite(dur) ? dur : 0,
          observaciones: formLlamada.observaciones.trim() || null,
          fechaLlamada: fecha,
        },
      };
    }

    if (subTab === "visita") {
      const fecha = inputDatetimeAIso(formVisita.fechaVisita);
      return {
        ...base,
        comentario:
          formVisita.comentario.trim() ||
          formVisita.direccion.trim() ||
          "Visita",
        fechaSeguimiento: fecha,
        visita: {
          direccion: formVisita.direccion.trim() || null,
          ciudad: formVisita.ciudad.trim() || null,
          estado: formVisita.estado.trim() || null,
          resultado: formVisita.resultado.trim() || null,
          observaciones: formVisita.observaciones.trim() || null,
          completada: formVisita.completada === "S",
          fechaVisita: fecha,
        },
      };
    }

    if (subTab === "nota") {
      return {
        ...base,
        idTipoSeguimiento: 2,
        comentario: formNota.comentario.trim(),
        fechaSeguimiento: inputDatetimeAIso(formNota.fechaSeguimiento),
      };
    }

    if (subTab === "recordatorio") {
      return {
        ...base,
        idTipoSeguimiento: 3,
        comentario: formRecordatorio.comentario.trim(),
        fechaSeguimiento: inputDatetimeAIso(
          formRecordatorio.fechaSeguimiento,
        ),
      };
    }

    const fecha = inputDatetimeAIso(formCotizacion.fechaInicio);
    const total = Number(formCotizacion.total);
    const docNum = Number(formCotizacion.docNum);
    return {
      ...base,
      comentario:
        formCotizacion.comentario.trim() ||
        formCotizacion.folio.trim() ||
        "Cotización",
      fechaSeguimiento: fecha,
      cotizacion: {
        folio: formCotizacion.folio.trim() || null,
        total: Number.isFinite(total) ? total : null,
        moneda: formCotizacion.moneda.trim() || "MXN",
        estatus: formCotizacion.estatus.trim() || "Abierta",
        docNum: Number.isFinite(docNum) && docNum > 0 ? docNum : null,
        cardCode: formCotizacion.cardCode.trim() || null,
        comentarios: formCotizacion.comentarios.trim() || null,
      },
    };
  };

  const validar = (): string | null => {
    if (!puedeRegistrar) {
      return "Guarde el prospecto primero para registrar seguimientos.";
    }
    if (subTab === "mensaje" && !formMensaje.cuerpo.trim()) {
      return "El cuerpo del mensaje es obligatorio.";
    }
    if (subTab === "llamada" && !formLlamada.telefono.trim()) {
      return "El teléfono de la llamada es obligatorio.";
    }
    if (subTab === "visita" && !formVisita.fechaVisita.trim()) {
      return "La fecha de la visita es obligatoria.";
    }
    if (subTab === "cotizacion" && !formCotizacion.folio.trim()) {
      return "El folio de la cotización es obligatorio.";
    }
    if (subTab === "nota" && !formNota.comentario.trim()) {
      return "El texto de la nota es obligatorio.";
    }
    if (subTab === "recordatorio") {
      if (!formRecordatorio.comentario.trim()) {
        return "La descripción del recordatorio es obligatoria.";
      }
      if (!formRecordatorio.fechaSeguimiento.trim()) {
        return "La fecha del recordatorio es obligatoria.";
      }
    }
    return null;
  };

  const guardar = async () => {
    const err = validar();
    if (err) {
      setErrorForm(err);
      return;
    }
    setGuardando(true);
    setErrorForm(null);
    try {
      await activityTimelineService.crear(armarPayload());
      cerrarForm();
      if (onGuardado) await onGuardado();
    } catch (e) {
      setErrorForm(
        e instanceof Error ? e.message : "No se pudo guardar el seguimiento.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const campo = (label: string, id: string, children: ReactNode) => (
    <div>
      <label className={prospectoLabelClass} htmlFor={id}>
        {label}
      </label>
      {children}
    </div>
  );

  const formActual = (
    <div
      className={`mb-4 rounded-lg border p-4 ${
        modoVista
          ? "border-gray-200 bg-gray-50/80 dark:border-gray-600 dark:bg-gray-800/40"
          : "border-blue-200 bg-blue-50/40 dark:border-blue-800 dark:bg-blue-950/20"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">
          {modoVista
            ? `Detalle · ${etiquetaTipoActividad(subTab)}`
            : `Nuevo ${etiquetaTipoActividad(subTab).toLowerCase()}`}
        </p>
        <button
          type="button"
          onClick={cerrarForm}
          className="text-xs font-medium text-gray-600 hover:underline dark:text-gray-300"
        >
          {modoVista ? "Cerrar" : "Cancelar"}
        </button>
      </div>

      {errorForm ? (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {errorForm}
        </p>
      ) : null}

      {cargandoDetalle ? (
        <p className="flex items-center gap-2 py-6 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando detalle…
        </p>
      ) : (
        <fieldset
          disabled={modoVista}
          className="min-w-0 border-0 p-0 disabled:opacity-95"
        >
      {subTab === "mensaje" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {campo(
            "Canal",
            "seg-msg-canal",
            <select
              id="seg-msg-canal"
              value={formMensaje.canal}
              onChange={(e) =>
                setFormMensaje((f) => ({ ...f, canal: e.target.value }))
              }
              className={prospectoInputClass}
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="SMS">SMS</option>
              <option value="Email">Email</option>
              <option value="Otro">Otro</option>
            </select>,
          )}
          {campo(
            "Teléfono",
            "seg-msg-tel",
            <input
              id="seg-msg-tel"
              type="tel"
              value={formMensaje.telefono}
              onChange={(e) =>
                setFormMensaje((f) => ({ ...f, telefono: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          <div className="sm:col-span-2">
            {campo(
              "Cuerpo del mensaje *",
              "seg-msg-cuerpo",
              <textarea
                id="seg-msg-cuerpo"
                rows={3}
                value={formMensaje.cuerpo}
                onChange={(e) =>
                  setFormMensaje((f) => ({ ...f, cuerpo: e.target.value }))
                }
                className={prospectoInputClass}
              />,
            )}
          </div>
          {campo(
            "Estatus envío",
            "seg-msg-estatus",
            <select
              id="seg-msg-estatus"
              value={formMensaje.estatusEnvio}
              onChange={(e) =>
                setFormMensaje((f) => ({ ...f, estatusEnvio: e.target.value }))
              }
              className={prospectoInputClass}
            >
              <option value="queued">En cola</option>
              <option value="sent">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="failed">Fallido</option>
            </select>,
          )}
          {campo(
            "Fecha envío",
            "seg-msg-fecha",
            <input
              id="seg-msg-fecha"
              type="datetime-local"
              value={formMensaje.fechaEnvio}
              onChange={(e) =>
                setFormMensaje((f) => ({ ...f, fechaEnvio: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          <div className="sm:col-span-2">
            {campo(
              "Comentario",
              "seg-msg-com",
              <input
                id="seg-msg-com"
                type="text"
                value={formMensaje.comentario}
                onChange={(e) =>
                  setFormMensaje((f) => ({ ...f, comentario: e.target.value }))
                }
                className={prospectoInputClass}
              />,
            )}
          </div>
        </div>
      ) : null}

      {subTab === "llamada" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {campo(
            "Teléfono *",
            "seg-call-tel",
            <input
              id="seg-call-tel"
              type="tel"
              value={formLlamada.telefono}
              onChange={(e) =>
                setFormLlamada((f) => ({ ...f, telefono: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          {campo(
            "Dirección",
            "seg-call-dir",
            <select
              id="seg-call-dir"
              value={formLlamada.entrante}
              onChange={(e) =>
                setFormLlamada((f) => ({
                  ...f,
                  entrante: e.target.value as "N" | "S",
                }))
              }
              className={prospectoInputClass}
            >
              <option value="N">Saliente</option>
              <option value="S">Entrante</option>
            </select>,
          )}
          {campo(
            "Resultado",
            "seg-call-res",
            <select
              id="seg-call-res"
              value={formLlamada.resultado}
              onChange={(e) =>
                setFormLlamada((f) => ({ ...f, resultado: e.target.value }))
              }
              className={prospectoInputClass}
            >
              <option value="">Seleccione</option>
              <option value="Contestó">Contestó</option>
              <option value="No contestó">No contestó</option>
              <option value="Ocupado">Ocupado</option>
              <option value="Buzón">Buzón</option>
              <option value="Número incorrecto">Número incorrecto</option>
            </select>,
          )}
          {campo(
            "Duración (segundos)",
            "seg-call-dur",
            <input
              id="seg-call-dur"
              type="number"
              min={0}
              value={formLlamada.duracionSegundos}
              onChange={(e) =>
                setFormLlamada((f) => ({
                  ...f,
                  duracionSegundos: e.target.value,
                }))
              }
              className={prospectoInputClass}
            />,
          )}
          {campo(
            "Fecha llamada",
            "seg-call-fecha",
            <input
              id="seg-call-fecha"
              type="datetime-local"
              value={formLlamada.fechaLlamada}
              onChange={(e) =>
                setFormLlamada((f) => ({ ...f, fechaLlamada: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          <div className="sm:col-span-2">
            {campo(
              "Observaciones",
              "seg-call-obs",
              <textarea
                id="seg-call-obs"
                rows={2}
                value={formLlamada.observaciones}
                onChange={(e) =>
                  setFormLlamada((f) => ({
                    ...f,
                    observaciones: e.target.value,
                  }))
                }
                className={prospectoInputClass}
              />,
            )}
          </div>
          <div className="sm:col-span-2">
            {campo(
              "Comentario",
              "seg-call-com",
              <input
                id="seg-call-com"
                type="text"
                value={formLlamada.comentario}
                onChange={(e) =>
                  setFormLlamada((f) => ({ ...f, comentario: e.target.value }))
                }
                className={prospectoInputClass}
              />,
            )}
          </div>
        </div>
      ) : null}

      {subTab === "visita" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {campo(
              "Dirección",
              "seg-vis-dir",
              <input
                id="seg-vis-dir"
                type="text"
                value={formVisita.direccion}
                onChange={(e) =>
                  setFormVisita((f) => ({ ...f, direccion: e.target.value }))
                }
                className={prospectoInputClass}
              />,
            )}
          </div>
          {campo(
            "Ciudad",
            "seg-vis-ciu",
            <input
              id="seg-vis-ciu"
              type="text"
              value={formVisita.ciudad}
              onChange={(e) =>
                setFormVisita((f) => ({ ...f, ciudad: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          {campo(
            "Estado",
            "seg-vis-est",
            <input
              id="seg-vis-est"
              type="text"
              value={formVisita.estado}
              onChange={(e) =>
                setFormVisita((f) => ({ ...f, estado: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          {campo(
            "Fecha visita *",
            "seg-vis-fecha",
            <input
              id="seg-vis-fecha"
              type="datetime-local"
              value={formVisita.fechaVisita}
              onChange={(e) =>
                setFormVisita((f) => ({ ...f, fechaVisita: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          {campo(
            "Completada",
            "seg-vis-comp",
            <select
              id="seg-vis-comp"
              value={formVisita.completada}
              onChange={(e) =>
                setFormVisita((f) => ({
                  ...f,
                  completada: e.target.value as "N" | "S",
                }))
              }
              className={prospectoInputClass}
            >
              <option value="N">No</option>
              <option value="S">Sí</option>
            </select>,
          )}
          {campo(
            "Resultado",
            "seg-vis-res",
            <input
              id="seg-vis-res"
              type="text"
              value={formVisita.resultado}
              onChange={(e) =>
                setFormVisita((f) => ({ ...f, resultado: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          <div className="sm:col-span-2">
            {campo(
              "Observaciones",
              "seg-vis-obs",
              <textarea
                id="seg-vis-obs"
                rows={2}
                value={formVisita.observaciones}
                onChange={(e) =>
                  setFormVisita((f) => ({
                    ...f,
                    observaciones: e.target.value,
                  }))
                }
                className={prospectoInputClass}
              />,
            )}
          </div>
          <div className="sm:col-span-2">
            {campo(
              "Comentario",
              "seg-vis-com",
              <input
                id="seg-vis-com"
                type="text"
                value={formVisita.comentario}
                onChange={(e) =>
                  setFormVisita((f) => ({ ...f, comentario: e.target.value }))
                }
                className={prospectoInputClass}
              />,
            )}
          </div>
        </div>
      ) : null}

      {subTab === "cotizacion" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {campo(
            "Folio *",
            "seg-cot-folio",
            <input
              id="seg-cot-folio"
              type="text"
              value={formCotizacion.folio}
              onChange={(e) =>
                setFormCotizacion((f) => ({ ...f, folio: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          {campo(
            "Total",
            "seg-cot-total",
            <input
              id="seg-cot-total"
              type="number"
              min={0}
              step="0.01"
              value={formCotizacion.total}
              onChange={(e) =>
                setFormCotizacion((f) => ({ ...f, total: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          {campo(
            "Moneda",
            "seg-cot-mon",
            <select
              id="seg-cot-mon"
              value={formCotizacion.moneda}
              onChange={(e) =>
                setFormCotizacion((f) => ({ ...f, moneda: e.target.value }))
              }
              className={prospectoInputClass}
            >
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
            </select>,
          )}
          {campo(
            "Estatus",
            "seg-cot-est",
            <select
              id="seg-cot-est"
              value={formCotizacion.estatus}
              onChange={(e) =>
                setFormCotizacion((f) => ({ ...f, estatus: e.target.value }))
              }
              className={prospectoInputClass}
            >
              <option value="Abierta">Abierta</option>
              <option value="Enviada">Enviada</option>
              <option value="Aceptada">Aceptada</option>
              <option value="Rechazada">Rechazada</option>
              <option value="Cerrada">Cerrada</option>
            </select>,
          )}
          {campo(
            "DocNum SAP",
            "seg-cot-doc",
            <input
              id="seg-cot-doc"
              type="number"
              value={formCotizacion.docNum}
              onChange={(e) =>
                setFormCotizacion((f) => ({ ...f, docNum: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          {campo(
            "CardCode",
            "seg-cot-card",
            <input
              id="seg-cot-card"
              type="text"
              value={formCotizacion.cardCode}
              onChange={(e) =>
                setFormCotizacion((f) => ({ ...f, cardCode: e.target.value }))
              }
              className={prospectoInputClass}
            />,
          )}
          {campo(
            "Fecha",
            "seg-cot-fecha",
            <input
              id="seg-cot-fecha"
              type="datetime-local"
              value={formCotizacion.fechaInicio}
              onChange={(e) =>
                setFormCotizacion((f) => ({
                  ...f,
                  fechaInicio: e.target.value,
                }))
              }
              className={prospectoInputClass}
            />,
          )}
          <div className="sm:col-span-2">
            {campo(
              "Comentarios cotización",
              "seg-cot-coms",
              <textarea
                id="seg-cot-coms"
                rows={2}
                value={formCotizacion.comentarios}
                onChange={(e) =>
                  setFormCotizacion((f) => ({
                    ...f,
                    comentarios: e.target.value,
                  }))
                }
                className={prospectoInputClass}
              />,
            )}
          </div>
          <div className="sm:col-span-2">
            {campo(
              "Comentario seguimiento",
              "seg-cot-com",
              <input
                id="seg-cot-com"
                type="text"
                value={formCotizacion.comentario}
                onChange={(e) =>
                  setFormCotizacion((f) => ({
                    ...f,
                    comentario: e.target.value,
                  }))
                }
                className={prospectoInputClass}
              />,
            )}
          </div>
        </div>
      ) : null}

      {subTab === "nota" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {campo(
              "Nota *",
              "seg-nota-texto",
              <textarea
                id="seg-nota-texto"
                rows={4}
                value={formNota.comentario}
                onChange={(e) =>
                  setFormNota((f) => ({ ...f, comentario: e.target.value }))
                }
                placeholder="Escriba la nota del prospecto…"
                className={prospectoInputClass}
              />,
            )}
          </div>
          {campo(
            "Fecha",
            "seg-nota-fecha",
            <input
              id="seg-nota-fecha"
              type="datetime-local"
              value={formNota.fechaSeguimiento}
              onChange={(e) =>
                setFormNota((f) => ({
                  ...f,
                  fechaSeguimiento: e.target.value,
                }))
              }
              className={prospectoInputClass}
            />,
          )}
        </div>
      ) : null}

      {subTab === "recordatorio" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {campo(
              "Recordatorio *",
              "seg-rec-texto",
              <textarea
                id="seg-rec-texto"
                rows={3}
                value={formRecordatorio.comentario}
                onChange={(e) =>
                  setFormRecordatorio((f) => ({
                    ...f,
                    comentario: e.target.value,
                  }))
                }
                placeholder="¿Qué debe recordarse?"
                className={prospectoInputClass}
              />,
            )}
          </div>
          {campo(
            "Fecha / hora *",
            "seg-rec-fecha",
            <input
              id="seg-rec-fecha"
              type="datetime-local"
              value={formRecordatorio.fechaSeguimiento}
              onChange={(e) =>
                setFormRecordatorio((f) => ({
                  ...f,
                  fechaSeguimiento: e.target.value,
                }))
              }
              className={prospectoInputClass}
            />,
          )}
        </div>
      ) : null}

        </fieldset>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {modoVista ? (
          <button
            type="button"
            onClick={cerrarForm}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
          >
            Cerrar
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={cerrarForm}
              disabled={guardando}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={guardando}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {guardando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Guardar {etiquetaTipoActividad(subTab).toLowerCase()}
            </button>
          </>
        )}
      </div>
    </div>
  );

  const cuerpo = (
    <div
      className={
        embebido
          ? "overflow-hidden"
          : "overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
      }
    >
      <div
        className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700"
        role="tablist"
        aria-label="Tipos de seguimiento"
      >
        {SUBTABS.map((tab) => {
          const activa = subTab === tab.id;
          const count = items.filter((i) => i.tipo === tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activa}
              onClick={() => cambiarSubTab(tab.id)}
              className={`whitespace-nowrap px-4 py-3 text-sm font-medium transition-colors sm:px-5 ${
                activa
                  ? "border-b-2 border-blue-600 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-gray-800 dark:text-blue-300"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
              {count > 0 ? (
                <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] tabular-nums dark:bg-gray-700">
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-5" role="tabpanel">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {puedeRegistrar
              ? `Registre ${etiquetaTipoActividad(subTab).toLowerCase()}s del prospecto. Doble clic en un registro para ver el detalle.`
              : "Guarde el prospecto para habilitar el registro de seguimientos."}
          </p>
          <button
            type="button"
            onClick={() => abrirForm(subTab)}
            disabled={!puedeRegistrar || (mostrarForm && !modoVista)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar {etiquetaTipoActividad(subTab).toLowerCase()}
          </button>
        </div>

        {mostrarForm ? formActual : null}

        {!mostrarForm && errorForm ? (
          <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
            {errorForm}
          </p>
        ) : null}

        {cargandoDetalle && !mostrarForm ? (
          <p className="mb-3 flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando detalle…
          </p>
        ) : null}

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">
            Cargando seguimientos…
          </p>
        ) : filtrados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/80 px-4 py-10 text-center dark:border-gray-600 dark:bg-gray-800/50">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Sin{" "}
              {subTab === "nota"
                ? "notas"
                : subTab === "recordatorio"
                  ? "recordatorios"
                  : `${etiquetaTipoActividad(subTab).toLowerCase()}s`}{" "}
              registrados
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use Agregar para registrar el primero.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtrados.map((item) => (
              <li
                key={`${item.id}-${item.fecha}`}
                role="button"
                tabIndex={0}
                title="Doble clic para ver el detalle"
                onDoubleClick={() => void verDetalle(item)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    void verDetalle(item);
                  }
                }}
                className="cursor-pointer rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40 dark:border-gray-600 dark:bg-gray-800/50 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {item.titulo}
                  </p>
                  <time className="text-xs text-gray-500 dark:text-gray-400">
                    {formatearFechaActividad(item.fecha)}
                  </time>
                </div>
                {item.descripcion ? (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {item.descripcion}
                  </p>
                ) : null}
                {item.nombreUsuario ? (
                  <p className="mt-2 text-xs text-gray-400">
                    Por {item.nombreUsuario}
                  </p>
                ) : null}
                <p className="mt-2 text-[10px] text-gray-400 dark:text-gray-500">
                  Doble clic para ver detalle
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  if (embebido) return cuerpo;

  return (
    <section className="mt-2 border-t border-gray-200 pt-6 dark:border-gray-700">
      <div className="mb-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
          Seguimientos
        </h4>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
          Mensajes, llamadas, visitas y cotizaciones del prospecto.
        </p>
      </div>
      {cuerpo}
    </section>
  );
}
