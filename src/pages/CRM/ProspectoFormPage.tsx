import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import ActivityTimeline from "../../components/CRM/ActivityTimeline";
import FormularioProspecto from "../../components/CRM/FormularioProspecto";
import ModalJsonSapCliente from "../../components/CRM/ModalJsonSapCliente";
import ModalJsonSapDescuento from "../../components/CRM/ModalJsonSapDescuento";
import {
  clienteAltaVacio,
  clienteAltaDesdeApi,
  contactoFormDesdeApi,
  direccionFormDesdeApi,
  prellenarClienteDesdeLead,
  armarPayloadClienteCreate,
  armarPayloadClienteUpdate,
  armarPayloadsContactos,
  armarPayloadContacto,
  armarPayloadDireccion,
  armarPayloadSapBusinessPartner,
  armarPayloadSapDiscountGroup,
  stringifyPayloadSapDiscountGroup,
  validarClienteAlta,
  camposFaltantesClienteAlta,
  esClienteEnviadoSap,
  armarPayloadDescuentoLocal,
  aplicarDescuentoApiAFilas,
  type ClienteAltaForm,
  type ContactoClienteForm,
  type DireccionClienteForm,
} from "../../components/CRM/clienteAltaUtils";
import {
  esEtapaCliente,
  etapasDelFunnel,
  leadToForm,
  leadVacio,
  prepararPayload,
  valoresDefectoNuevoProspecto,
  esCorreoValido,
} from "../../components/CRM/prospectoFormUtils";
import {
  crmService,
  EntidadServicio,
  EstatusCatalogo,
  Etapa,
  Fuente,
  GrupoSAP,
} from "../../services/crmService";
import { LeadPayload, leadsService, normalizeLead } from "../../services/leadsService";
import { useAuth } from "../../hooks/useAuth";
import { useModalAlerta } from "../../hooks/useModalAlerta";
import { clienteService } from "../../services/clienteService";
import { getContextoOperativoPersona } from "../../services/authService";
import {
  activityTimelineService,
  type ActivityTimelineItem,
} from "../../services/activityTimelineService";

export default function ProspectoFormPage() {
  const { idLead: idLeadParam } = useParams<{ idLead?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { mostrarAdvertencia, mostrarError, AlertaHost } = useModalAlerta();

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
  const [clienteAlta, setClienteAlta] = useState<ClienteAltaForm>(clienteAltaVacio());
  const [clienteGuardadoId, setClienteGuardadoId] = useState<number | null>(null);
  const [clienteCardCode, setClienteCardCode] = useState<string | null>(null);
  const [clienteEstatusSap, setClienteEstatusSap] = useState<string | null>(null);
  const [cardCodeDraft, setCardCodeDraft] = useState("");
  const [mensajeOk, setMensajeOk] = useState<string | null>(null);
  const [jsonSapVisible, setJsonSapVisible] = useState(false);
  const [enviandoSap, setEnviandoSap] = useState(false);
  const [mensajeEnvioSap, setMensajeEnvioSap] = useState<string | null>(null);
  const [errorEnvioSap, setErrorEnvioSap] = useState<string | null>(null);
  const [jsonSapDescuentosVisible, setJsonSapDescuentosVisible] = useState(false);
  const [enviandoSapDescuentos, setEnviandoSapDescuentos] = useState(false);
  const [mensajeEnvioSapDescuentos, setMensajeEnvioSapDescuentos] = useState<
    string | null
  >(null);
  const [errorEnvioSapDescuentos, setErrorEnvioSapDescuentos] = useState<
    string | null
  >(null);
  const [actividades, setActividades] = useState<ActivityTimelineItem[]>([]);
  const [loadingActividades, setLoadingActividades] = useState(false);
  const [mostrarErroresCliente, setMostrarErroresCliente] = useState(false);

  const clienteYaEnviadoSap = esClienteEnviadoSap(clienteEstatusSap);
  // TODO(pruebas): restaurar → clienteYaEnviadoSap && !permisoActivo(..., PERMISO_CLIENTE_EDITAR_POST_SAP)
  const clienteSoloLectura = false;
  const puedeEnviarASap =
    clienteGuardadoId != null && !clienteYaEnviadoSap;
  const camposInvalidosCliente = useMemo(
    () =>
      mostrarErroresCliente
        ? new Set(camposFaltantesClienteAlta(clienteAlta))
        : new Set<string>(),
    [mostrarErroresCliente, clienteAlta],
  );

  const volverAlListado = () => {
    navigate("/CRM/Prospectos");
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);

    setClienteAlta(clienteAltaVacio());
    setClienteGuardadoId(null);
    setClienteCardCode(null);
    setClienteEstatusSap(null);
    setActividades([]);
    setMostrarErroresCliente(false);

    const [
      etapasRes,
      funnelRes,
      fuentesRes,
      estatusRes,
      serviciosRes,
      gruposSAPRes,
      leadRes,
    ] = await Promise.allSettled([
      crmService.getEtapas(),
      crmService.getEtapaConfiguraciones(),
      crmService.getFuentes(),
      crmService.getEstatusCatalogo(),
      crmService.getEntidadesServicio(),
      crmService.getGrupoSAP(),
      esEdicion && idLead
        ? leadsService.getLead(idLead)
        : Promise.resolve(null),
    ]);

    const etapasCatalogo =
      etapasRes.status === "fulfilled" ? etapasRes.value : [];
    const funnel =
      funnelRes.status === "fulfilled" ? funnelRes.value : [];
    const etapasCargadas = etapasDelFunnel(etapasCatalogo, funnel);
    setEtapas(etapasCargadas);
    if (fuentesRes.status === "fulfilled") setFuentes(fuentesRes.value);
    if (estatusRes.status === "fulfilled") setEstatusLista(estatusRes.value);
    if (serviciosRes.status === "fulfilled") setServicios(serviciosRes.value);
    if (gruposSAPRes.status === "fulfilled") setGruposSAP(gruposSAPRes.value);

    if (esEdicion) {
      if (leadRes.status === "fulfilled" && leadRes.value) {
        const leadForm = leadToForm(leadRes.value);
        setForm(leadForm);
        const etapasCargadas = etapasDelFunnel(
          etapasCatalogo,
          funnel,
          leadForm.idEtapa,
        );
        setEtapas(etapasCargadas);
        if (idLead) {
          try {
            const existente = await clienteService.getPorLeadOrigen(idLead);
            if (existente) {
              setClienteGuardadoId(existente.idCliente);
              setClienteCardCode(existente.cardCode);
              setClienteEstatusSap(existente.estatusSap);
              const detalle = await clienteService.getById(existente.idCliente);
              const alta = clienteAltaDesdeApi(detalle);
              let contactos = alta.contactos;
              try {
                const contactosApi = await clienteService.getContactos({
                  idLead,
                  idCliente: existente.idCliente,
                });
                if (contactosApi.length > 0) {
                  contactos = contactosApi.map(contactoFormDesdeApi);
                }
              } catch {
                /* se usan los contactos del GET Cliente si existen */
              }
              let descuentos = alta.descuentos;
              try {
                const docs = await clienteService.getDescuentos(
                  existente.idCliente,
                );
                if (docs[0]) {
                  descuentos = aplicarDescuentoApiAFilas([], docs[0]);
                }
              } catch {
                /* sin descuentos previos */
              }
              setClienteAlta({ ...alta, contactos, descuentos });
            } else if (esEtapaCliente(leadForm.idEtapa, etapasCargadas)) {
              setClienteAlta(
                prellenarClienteDesdeLead({
                  actual: clienteAltaVacio(),
                  nombre: leadForm.nombre,
                  aPaterno: leadForm.aPaterno,
                  telefono: leadForm.telefono,
                  correo: leadForm.correo,
                }),
              );
            }
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "No se pudo cargar el cliente ligado al prospecto.",
            );
          }

          setLoadingActividades(true);
          try {
            const timeline = await activityTimelineService.getByLead(idLead);
            setActividades(timeline);
          } catch (err) {
            console.error("No se pudo cargar el timeline", err);
            setActividades([]);
          } finally {
            setLoadingActividades(false);
          }
        }
      } else {
        setError(
          leadRes.status === "rejected" && leadRes.reason instanceof Error
            ? leadRes.reason.message
            : "No se pudo cargar el prospecto.",
        );
      }
    } else {
      const base = leadVacio();
      if (user?.idUsuario) {
        base.idUsuarioCreacion = user.idUsuario;
        base.idUsuarioAsignado = user.idUsuario;
      }
      const estatusCargados =
        estatusRes.status === "fulfilled" ? estatusRes.value : [];
      setForm(valoresDefectoNuevoProspecto(base, etapasCargadas, estatusCargados));
    }

    setLoading(false);
  }, [esEdicion, idLead, user?.idUsuario]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const recargarActividades = useCallback(async () => {
    if (!idLead || idLead <= 0) {
      setActividades([]);
      return;
    }
    setLoadingActividades(true);
    try {
      const timeline = await activityTimelineService.getByLead(idLead);
      setActividades(timeline);
    } catch (err) {
      console.error("No se pudo cargar el timeline", err);
    } finally {
      setLoadingActividades(false);
    }
  }, [idLead]);

  const setCampo = <K extends keyof LeadPayload>(
    key: K,
    value: LeadPayload[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const actualizarClienteAlta = (parcial: Partial<ClienteAltaForm>) => {
    if (clienteSoloLectura) {
      const keys = Object.keys(parcial);
      if (!(keys.length === 1 && keys[0] === "descuentos")) return;
    }
    setClienteAlta((prev) => ({ ...prev, ...parcial }));
  };

  const guardarContactosDesdeModal = async (contactos: ContactoClienteForm[]) => {
    if (clienteSoloLectura) {
      throw new Error(
        "El cliente ya fue enviado a SAP; no se pueden modificar contactos.",
      );
    }
    if (!clienteGuardadoId || !idLead) {
      actualizarClienteAlta({ contactos });
      setMensajeOk(
        "Contactos listos en el formulario. Pulse Guardar para grabarlos en el CRM.",
      );
      return;
    }

    const contexto = user?.idPersona
      ? await getContextoOperativoPersona(user.idPersona)
      : null;
    const idEmpresa = form.idEmpresa && form.idEmpresa > 0 ? form.idEmpresa : 0;
    const idsNuevos = new Set(
      contactos
        .map((c) => c.idContacto)
        .filter((id): id is number => typeof id === "number" && id > 0),
    );

    for (const previo of clienteAlta.contactos) {
      const idPrev = previo.idContacto ?? 0;
      if (idPrev > 0 && !idsNuevos.has(idPrev)) {
        await clienteService.eliminarContacto(idPrev);
      }
    }

    const persistidos: ContactoClienteForm[] = [];
    for (const contacto of contactos) {
      if (!contacto.nombre.trim()) continue;
      const payload = armarPayloadContacto(contacto, {
        idCliente: clienteGuardadoId,
        idLead,
        idEmpresa: idEmpresa || null,
      });
      if (contacto.idContacto && contacto.idContacto > 0) {
        await clienteService.actualizarContacto(contacto.idContacto, payload);
        persistidos.push(contacto);
      } else {
        const idContacto = await clienteService.crearContacto(payload);
        persistidos.push({
          ...contacto,
          idContacto: idContacto > 0 ? idContacto : null,
        });
      }
    }

    actualizarClienteAlta({ contactos: persistidos });
    setMensajeOk(
      persistidos.length === 1
        ? "Contacto guardado en el CRM."
        : `${persistidos.length} contacto(s) guardados en el CRM.`,
    );
  };

  const guardarDireccionDesdeTab = async (direccion: DireccionClienteForm) => {
    if (clienteSoloLectura) {
      throw new Error(
        "El cliente ya fue enviado a SAP; no se pueden modificar direcciones.",
      );
    }
    if (!direccion.nombre.trim() && !direccion.calle.trim()) {
      throw new Error("Capture al menos nombre o calle de la dirección.");
    }

    if (!clienteGuardadoId) {
      setMensajeOk(
        "Dirección lista en el formulario. Pulse Guardar el prospecto para crearla en el CRM (o cree el cliente primero).",
      );
      return;
    }

    const fiscales = clienteAlta.direcciones.filter((d) => d.tipo === "FISCAL");
    const entregas = clienteAlta.direcciones.filter((d) => d.tipo === "ENTREGA");
    const payload = armarPayloadDireccion(direccion, {
      idCliente: clienteGuardadoId,
      rfc: clienteAlta.rfc,
      esDefaultBillTo: fiscales[0]?.idLocal === direccion.idLocal,
      esDefaultShipTo: entregas[0]?.idLocal === direccion.idLocal,
    });

    let idClienteDireccion = direccion.idClienteDireccion ?? 0;
    if (idClienteDireccion > 0) {
      await clienteService.actualizarDireccion(idClienteDireccion, payload);
    } else {
      idClienteDireccion = await clienteService.crearDireccion(payload);
    }

    actualizarClienteAlta({
      direcciones: clienteAlta.direcciones.map((d) =>
        d.idLocal === direccion.idLocal
          ? {
              ...direccion,
              idClienteDireccion:
                idClienteDireccion > 0 ? idClienteDireccion : null,
            }
          : d,
      ),
    });
    setMensajeOk(
      idClienteDireccion > 0 && (direccion.idClienteDireccion ?? 0) > 0
        ? "Dirección actualizada en el CRM."
        : "Dirección guardada en el CRM.",
    );
  };

  const sincronizarDirecciones = async (
    idCliente: number,
    formCliente: ClienteAltaForm,
  ) => {
    const fiscales = formCliente.direcciones.filter((d) => d.tipo === "FISCAL");
    const entregas = formCliente.direcciones.filter((d) => d.tipo === "ENTREGA");
    const persistidas: DireccionClienteForm[] = [];

    for (const direccion of formCliente.direcciones) {
      if (!direccion.nombre.trim() && !direccion.calle.trim()) {
        persistidas.push(direccion);
        continue;
      }
      const payload = armarPayloadDireccion(direccion, {
        idCliente,
        rfc: formCliente.rfc,
        esDefaultBillTo: fiscales[0]?.idLocal === direccion.idLocal,
        esDefaultShipTo: entregas[0]?.idLocal === direccion.idLocal,
      });
      if (direccion.idClienteDireccion && direccion.idClienteDireccion > 0) {
        await clienteService.actualizarDireccion(
          direccion.idClienteDireccion,
          payload,
        );
        persistidas.push(direccion);
      } else {
        const id = await clienteService.crearDireccion(payload);
        persistidas.push({
          ...direccion,
          idClienteDireccion: id > 0 ? id : null,
        });
      }
    }

    // Si el create del cliente ya insertó direcciones sin id en form, recargar evita duplicados
    try {
      const remotas = await clienteService.getDirecciones(idCliente);
      if (remotas.length > 0) {
        const mapeadas = remotas.map(direccionFormDesdeApi);
        // Conserva idLocal de form cuando coincide por idClienteDireccion
        const merged = mapeadas.map((remota) => {
          const local = persistidas.find(
            (p) =>
              p.idClienteDireccion &&
              p.idClienteDireccion === remota.idClienteDireccion,
          );
          return local ? { ...remota, idLocal: local.idLocal } : remota;
        });
        actualizarClienteAlta({ direcciones: merged });
        return;
      }
    } catch {
      /* ignore */
    }
    actualizarClienteAlta({ direcciones: persistidas });
  };

  const guardarDescuentosDesdeTab = async () => {
    if (!clienteGuardadoId) {
      throw new Error(
        "Guarde el cliente en el CRM antes de persistir los descuentos.",
      );
    }

    const contexto = user?.idPersona
      ? await getContextoOperativoPersona(user.idPersona)
      : null;
    const payload = armarPayloadDescuentoLocal(clienteAlta.descuentos, {
      idCliente: clienteGuardadoId,
      idSucursal: contexto?.idSucursal ?? null,
      idLeadOrigen: idLead,
      idUsuario: user?.idUsuario ?? null,
    });

    const saved = await clienteService.upsertDescuentos(
      clienteGuardadoId,
      payload,
    );
    actualizarClienteAlta({
      descuentos: aplicarDescuentoApiAFilas(clienteAlta.descuentos, saved),
    });
    setMensajeOk(
      saved.detalles.length === 1
        ? "Descuento guardado en el CRM."
        : `Descuentos guardados en el CRM (${saved.detalles.length} marca(s)).`,
    );
    return saved;
  };

  const abrirModalSapDescuentos = () => {
    setMensajeEnvioSapDescuentos(null);
    setErrorEnvioSapDescuentos(null);
    setJsonSapDescuentosVisible(true);
  };

  const enviarDescuentosSapDesdeTab = async () => {
    const code = (clienteCardCode || cardCodeDraft || "").trim();
    if (!code) {
      throw new Error(
        "Asigne un CardCode al cliente antes de enviar los descuentos a SAP.",
      );
    }
    if (!clienteGuardadoId) {
      throw new Error("Guarde el cliente en el CRM primero.");
    }

    const saved = await guardarDescuentosDesdeTab();
    if (!saved.idDescuento) {
      throw new Error("No se obtuvo el descuento guardado para enviar a SAP.");
    }
    if (saved.detalles.length === 0) {
      throw new Error(
        "Capture al menos un porcentaje de marca mayor a 0 antes de enviar a SAP.",
      );
    }

    const result = await clienteService.enviarDescuentosASap(saved.idDescuento);
    const recargado = await clienteService.getDescuentos(clienteGuardadoId);
    actualizarClienteAlta({
      descuentos: aplicarDescuentoApiAFilas(
        clienteAlta.descuentos,
        recargado[0] ?? {
          ...saved,
          absEntry: result.absEntry || saved.absEntry,
          estatusSync: result.estatusSync || saved.estatusSync,
        },
      ),
    });
    setMensajeOk(result.mensaje || "Descuento enviado a SAP.");
    return result;
  };

  const confirmarEnvioDescuentosSap = async () => {
    setEnviandoSapDescuentos(true);
    setErrorEnvioSapDescuentos(null);
    setMensajeEnvioSapDescuentos(null);
    try {
      const result = await enviarDescuentosSapDesdeTab();
      setMensajeEnvioSapDescuentos(
        result?.mensaje || "Descuento enviado a SAP.",
      );
      setJsonSapDescuentosVisible(false);
    } catch (err) {
      setErrorEnvioSapDescuentos(
        err instanceof Error
          ? err.message
          : "No se pudo enviar el descuento a SAP.",
      );
    } finally {
      setEnviandoSapDescuentos(false);
    }
  };

  const guardarClienteSiAplica = async (idLeadGuardado: number): Promise<boolean> => {
    if (!esEtapaCliente(form.idEtapa, etapas)) return false;
    if (clienteSoloLectura) return false;

    const resultado = validarClienteAlta(clienteAlta);
    if (resultado.mensaje) {
      setMostrarErroresCliente(true);
      throw new Error(resultado.mensaje);
    }
    setMostrarErroresCliente(false);

    const contexto = user?.idPersona
      ? await getContextoOperativoPersona(user.idPersona)
      : null;
    const idEmpresa = form.idEmpresa && form.idEmpresa > 0 ? form.idEmpresa : 0;
    if (!idEmpresa) {
      throw new Error(
        "Seleccione Codialub o Codial para indicar en qué base se guardará el cliente.",
      );
    }

    const groupCode =
      gruposSAP.find((g) => g.idGrupo === form.idGrupo)?.groupCode ?? null;

    const existente = await clienteService.getPorLeadOrigen(idLeadGuardado);

    const duplicados = await clienteService.buscarDuplicados({
      telefono: clienteAlta.phone1 || form.telefono,
      correo: clienteAlta.emailAddress || form.correo,
      nombre: clienteAlta.cardName,
      rfc: clienteAlta.rfc,
      excluirIdCliente: existente?.idCliente ?? null,
      excluirIdLeadOrigen: idLeadGuardado,
    });
    if (duplicados.length > 0) {
      const d = duplicados[0];
      const campos = d.campos.join(", ");
      throw new Error(
        `Ya existe un cliente con los mismos datos (${campos}): ` +
          `"${d.cardName || "Sin nombre"}"${d.cardCode ? ` · ${d.cardCode}` : ""}. ` +
          `Corrija teléfono, correo, nombre o RFC para evitar duplicados.`,
      );
    }

    if (existente) {
      await clienteService.actualizar(
        existente.idCliente,
        armarPayloadClienteUpdate({
          form: clienteAlta,
          idEmpresa,
          idSucursal: contexto?.idSucursal ?? null,
          idLeadOrigen: idLeadGuardado,
          idUsuarioActualizacion: user?.idUsuario ?? null,
          groupCode,
        }),
      );
      await sincronizarContactos(
        existente.idCliente,
        idLeadGuardado,
        idEmpresa,
      );
      await sincronizarDirecciones(existente.idCliente, clienteAlta);
      setClienteGuardadoId(existente.idCliente);
      setClienteCardCode(existente.cardCode);
      setClienteEstatusSap(existente.estatusSap);
      return true;
    }

    const creado = await clienteService.crear(
      armarPayloadClienteCreate({
        form: clienteAlta,
        idEmpresa,
        idSucursal: contexto?.idSucursal ?? null,
        idLeadOrigen: idLeadGuardado,
        idUsuarioCreacion: user?.idUsuario ?? null,
        groupCode,
      }),
    );

    await sincronizarContactos(creado.idCliente, idLeadGuardado, idEmpresa);
    // El create ya inserta direcciones; recarga para obtener idClienteDireccion
    try {
      const remotas = await clienteService.getDirecciones(creado.idCliente);
      if (remotas.length > 0) {
        actualizarClienteAlta({
          direcciones: remotas.map(direccionFormDesdeApi),
        });
      }
    } catch {
      /* ignore */
    }
    setClienteGuardadoId(creado.idCliente);
    setClienteCardCode(creado.cardCode);
    setClienteEstatusSap(creado.estatusSap);
    return true;
  };

  const sincronizarContactos = async (
    idCliente: number,
    idLeadGuardado: number,
    idEmpresa: number,
  ) => {
    const idsEnFormulario = new Set(
      clienteAlta.contactos
        .map((c) => c.idContacto)
        .filter((id): id is number => typeof id === "number" && id > 0),
    );

    const remotos = await clienteService.getContactos({
      idCliente,
      idLead: idLeadGuardado,
    });
    for (const raw of remotos) {
      const o = (raw && typeof raw === "object" ? raw : {}) as Record<
        string,
        unknown
      >;
      const idRemoto =
        typeof o.idContacto === "number"
          ? o.idContacto
          : typeof o.IdContacto === "number"
            ? o.IdContacto
            : Number(o.idContacto ?? o.IdContacto ?? 0);
      if (idRemoto > 0 && !idsEnFormulario.has(idRemoto)) {
        await clienteService.eliminarContacto(idRemoto);
      }
    }

    const contactos = armarPayloadsContactos({
      form: clienteAlta,
      idCliente,
      idLead: idLeadGuardado,
      idEmpresa,
    });
    for (const payload of contactos) {
      if (payload.idContacto && payload.idContacto > 0) {
        await clienteService.actualizarContacto(payload.idContacto, payload);
      } else {
        await clienteService.crearContacto(payload);
      }
    }
  };

  const guardar = async () => {
    if (!(form.nombre ?? "").trim()) {
      mostrarAdvertencia("El nombre es obligatorio.", "Dato requerido");
      return;
    }
    if (!(form.telefono ?? "").trim()) {
      mostrarAdvertencia("El teléfono es obligatorio.", "Dato requerido");
      return;
    }
    if ((form.telefono ?? "").replace(/\D/g, "").length > 10) {
      mostrarAdvertencia(
        "El teléfono no puede exceder 10 dígitos.",
        "Teléfono inválido",
      );
      return;
    }
    if ((form.correo ?? "").trim() && !esCorreoValido(form.correo)) {
      mostrarAdvertencia(
        "Capture un correo electrónico válido.",
        "Correo inválido",
      );
      return;
    }
    if (
      (clienteAlta.emailAddress ?? "").trim() &&
      !esCorreoValido(clienteAlta.emailAddress)
    ) {
      mostrarAdvertencia(
        "El correo del cliente no es válido.",
        "Correo inválido",
      );
      return;
    }

    setSaving(true);
    setMensajeOk(null);
    try {
      const payload = prepararPayload(form, user?.idUsuario);
      let idLeadGuardado = idLead ?? 0;
      if (esEdicion && idLead) {
        await leadsService.actualizarLead(idLead, payload);
      } else {
        const creado = await leadsService.crearLead(payload);
        idLeadGuardado = normalizeLead(creado).idLead;
      }
      if (!idLeadGuardado) {
        throw new Error("No se obtuvo el identificador del prospecto.");
      }
      const guardoCliente = await guardarClienteSiAplica(idLeadGuardado);
      if (guardoCliente) {
        setMensajeOk("Cliente guardado en CRM. Ya puede enviarlo a SAP.");
        return;
      }
      volverAlListado();
    } catch (err) {
      console.error(err);
      mostrarError(
        err instanceof Error ? err.message : "No se pudo guardar.",
      );
    } finally {
      setSaving(false);
    }
  };

  const jsonSapPreview = JSON.stringify(
    armarPayloadSapBusinessPartner({
      form: clienteAlta,
      groupCode:
        gruposSAP.find((g) => g.idGrupo === form.idGrupo)?.groupCode ?? null,
      cardCode: cardCodeDraft.trim() || clienteCardCode,
    }),
    null,
    2,
  );

  const cardCodeDescuentos = (clienteCardCode || cardCodeDraft || "").trim();
  const jsonSapDescuentosPreview = stringifyPayloadSapDiscountGroup(
    armarPayloadSapDiscountGroup({
      cardCode: cardCodeDescuentos,
      filas: clienteAlta.descuentos,
    }),
  );
  const puedeEnviarDescuentosASap =
    clienteGuardadoId != null &&
    cardCodeDescuentos.length > 0 &&
    clienteAlta.descuentos.some((d) => {
      const n = Number(
        (d.DiscRel || d.porcentaje || "").toString().replace(",", "."),
      );
      return Number.isFinite(n) && n > 0 && (d.ObjCode || "").trim().length > 0;
    });

  const abrirModalSap = () => {
    if (!puedeEnviarASap) return;
    setMensajeEnvioSap(null);
    setErrorEnvioSap(null);
    setCardCodeDraft((clienteCardCode ?? "").trim());
    setJsonSapVisible(true);
  };

  const enviarClienteASap = async () => {
    if (!clienteGuardadoId || clienteYaEnviadoSap) return;
    const code = cardCodeDraft.trim().toUpperCase();
    if (!code) {
      setErrorEnvioSap("Indique el CardCode antes de enviar.");
      return;
    }
    if (code.length > 15) {
      setErrorEnvioSap("CardCode no puede exceder 15 caracteres.");
      return;
    }

    setEnviandoSap(true);
    setErrorEnvioSap(null);
    setMensajeEnvioSap(null);
    try {
      if (code !== (clienteCardCode ?? "").trim().toUpperCase()) {
        const asignado = await clienteService.asignarCardCode(
          clienteGuardadoId,
          code,
        );
        setClienteCardCode(asignado.cardCode);
        setCardCodeDraft(asignado.cardCode ?? code);
      }

      const result = await clienteService.enviarASap(clienteGuardadoId);
      const texto =
        result.mensaje ||
        (result.accion === "Updated"
          ? "Cliente actualizado en SAP."
          : "Cliente creado en SAP.");
      setMensajeEnvioSap(texto);
      setMensajeOk(texto);
      if (result.cardCode) {
        setClienteCardCode(result.cardCode);
        setCardCodeDraft(result.cardCode);
      }
      setClienteEstatusSap(
        result.estatusSap?.trim() || "Enviado",
      );
    } catch (err) {
      setErrorEnvioSap(
        err instanceof Error ? err.message : "No se pudo enviar el cliente a SAP.",
      );
    } finally {
      setEnviandoSap(false);
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

      {mensajeOk && (
        <div className="rounded-md bg-green-50 p-3 text-sm text-green-800 dark:bg-green-900/30 dark:text-green-200">
          {mensajeOk}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white py-16 text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-sm">Cargando formulario…</p>
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
            <FormularioProspecto
              form={form}
              onChange={setCampo}
              etapas={etapas}
              fuentes={fuentes}
              estatusLista={estatusLista}
              servicios={servicios}
              gruposSAP={gruposSAP}
              clienteAlta={clienteAlta}
              onClienteAltaChange={actualizarClienteAlta}
              clienteExistente={clienteGuardadoId != null}
              etapaBloqueada={clienteGuardadoId != null}
              onGuardarContactos={guardarContactosDesdeModal}
              onGuardarDireccion={guardarDireccionDesdeTab}
              onGuardarDescuentos={async () => {
                await guardarDescuentosDesdeTab();
              }}
              onEnviarDescuentosSap={abrirModalSapDescuentos}
              cardCodeCliente={clienteCardCode || cardCodeDraft}
              actividades={actividades}
              loadingActividades={loadingActividades}
              idLead={idLead && idLead > 0 ? idLead : null}
              idUsuarioCreacion={
                user?.idUsuario || form.idUsuarioCreacion || null
              }
              onSeguimientoGuardado={async () => {
                await recargarActividades();
                setMensajeOk("Seguimiento registrado.");
              }}
              clienteSoloLectura={clienteSoloLectura}
              camposInvalidosCliente={camposInvalidosCliente}
              avisoClienteSap={
                clienteYaEnviadoSap
                  ? `Cliente enviado a SAP${clienteCardCode ? ` (${clienteCardCode})` : ""}. Edición temporalmente habilitada para pruebas; el reenvío sigue deshabilitado.`
                  : null
              }
            />

            <div className="mt-6 flex flex-col-reverse justify-end gap-2 border-t border-gray-200 pt-4 sm:flex-row dark:border-gray-700">
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
                onClick={abrirModalSap}
                disabled={!puedeEnviarASap}
                title={
                  clienteYaEnviadoSap
                    ? "Este cliente ya fue enviado a SAP"
                    : clienteGuardadoId
                      ? "Revisar y enviar el cliente a SAP"
                      : "Guarde el cliente en CRM primero"
                }
                className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
              >
                {clienteYaEnviadoSap ? "Enviado a SAP" : "Enviar a SAP"}
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
          </div>

          <ActivityTimeline
            items={actividades}
            loading={loadingActividades}
          />
        </>
      )}

      <ModalJsonSapCliente
        abierto={jsonSapVisible}
        json={jsonSapPreview}
        onCerrar={() => {
          if (!enviandoSap) setJsonSapVisible(false);
        }}
        onEnviar={() => void enviarClienteASap()}
        enviando={enviandoSap}
        puedeEnviar={puedeEnviarASap}
        cardCode={cardCodeDraft}
        onCardCodeChange={setCardCodeDraft}
        mensaje={mensajeEnvioSap}
        errorEnvio={errorEnvioSap}
      />
      <ModalJsonSapDescuento
        abierto={jsonSapDescuentosVisible}
        json={jsonSapDescuentosPreview}
        onCerrar={() => {
          if (!enviandoSapDescuentos) setJsonSapDescuentosVisible(false);
        }}
        onEnviar={() => void confirmarEnvioDescuentosSap()}
        enviando={enviandoSapDescuentos}
        puedeEnviar={puedeEnviarDescuentosASap}
        cardCode={cardCodeDescuentos}
        mensaje={mensajeEnvioSapDescuentos}
        errorEnvio={errorEnvioSapDescuentos}
      />
      {AlertaHost}
    </div>
  );
}
