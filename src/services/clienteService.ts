import { api } from "./apiServices";
import type {
  ClienteCreatePayload,
  ClienteUpdatePayload,
  ContactoCreatePayload,
  DireccionCreatePayload,
  ClienteDescuentoApi,
  ClienteDescuentoWritePayload,
} from "../components/CRM/clienteAltaUtils";

function errorDesdeRespuesta(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.mensaje === "string" && o.mensaje) return o.mensaje;
    if (typeof o.detail === "string" && o.detail) return o.detail;
    if (typeof o.title === "string" && o.title) return o.title;
  }
  return fallback;
}

function assertOk<T>(
  response: { status: number; data: T },
  fallback: string,
): T {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(errorDesdeRespuesta(response.data, fallback));
  }
  return response.data;
}

function normalizeArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (Array.isArray(o.items)) return o.items;
  }
  return [];
}

function pickNumber(
  o: Record<string, unknown>,
  ...keys: string[]
): number | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      if (!Number.isNaN(n)) return n;
    }
  }
  return null;
}

function pickString(
  o: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const key of keys) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export type CatalogoMetodoPagoSap = {
  codigo: string;
  nombre: string;
  activo: boolean;
};

export type DefinicionCampoCliente = {
  idDefinicionCampo: number;
  idEmpresa: number | null;
  clave: string;
  etiqueta: string;
  tipoDato: string;
  nombreCampoSap: string | null;
  obligatorio: boolean;
  activo: boolean;
  orden: number;
};

export type ClienteResumen = {
  idCliente: number;
  idLeadOrigen: number | null;
  cardCode: string | null;
  cardName: string;
  phone1: string | null;
  emailAddress: string | null;
  federalTaxID: string | null;
  estatusSap: string | null;
  fechaCreacion: string | null;
  fechaEnvioSap: string | null;
  activo: boolean;
};

function normalizeCliente(raw: unknown): ClienteResumen {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    idCliente: pickNumber(o, "idCliente", "IdCliente") ?? 0,
    idLeadOrigen: pickNumber(o, "idLeadOrigen", "IdLeadOrigen"),
    cardCode: pickString(o, "cardCode", "CardCode"),
    cardName: pickString(o, "cardName", "CardName") ?? "",
    phone1: pickString(o, "phone1", "Phone1", "telefono", "Telefono"),
    emailAddress: pickString(
      o,
      "emailAddress",
      "EmailAddress",
      "correo",
      "Correo",
      "email",
      "Email",
    ),
    federalTaxID: pickString(
      o,
      "federalTaxID",
      "FederalTaxID",
      "rfc",
      "RFC",
    ),
    estatusSap: pickString(o, "estatusSap", "EstatusSap"),
    fechaCreacion: pickString(o, "fechaCreacion", "FechaCreacion"),
    fechaEnvioSap: pickString(o, "fechaEnvioSap", "FechaEnvioSap"),
    activo: o.activo === false || o.Activo === false ? false : true,
  };
}

function soloDigitos(v: string | null | undefined): string {
  return (v ?? "").replace(/\D/g, "");
}

function normalizarTexto(v: string | null | undefined): string {
  return (v ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizarRfc(v: string | null | undefined): string {
  return (v ?? "").trim().toUpperCase().replace(/\s+/g, "");
}

/** RFCs genéricos SAT: permiten muchos clientes con el mismo valor. */
export const RFC_GENERICO_NACIONAL = "XAXX010101000";
export const RFC_GENERICO_EXTRANJERO = "XEXX010101000";

const RFCS_GENERICOS = new Set([
  RFC_GENERICO_NACIONAL,
  RFC_GENERICO_EXTRANJERO,
]);

export function esRfcGenerico(v: string | null | undefined): boolean {
  return RFCS_GENERICOS.has(normalizarRfc(v));
}

function esDuplicadoCliente(
  c: ClienteResumen,
  criterio: {
    telefono?: string | null;
    correo?: string | null;
    nombre?: string | null;
    rfc?: string | null;
  },
): { coincide: boolean; campos: string[] } {
  const campos: string[] = [];
  const tel = soloDigitos(criterio.telefono);
  const mail = normalizarTexto(criterio.correo);
  const nombre = normalizarTexto(criterio.nombre);
  const rfc = normalizarRfc(criterio.rfc);
  const rfcEsGenerico = esRfcGenerico(rfc);

  if (tel && soloDigitos(c.phone1) === tel) campos.push("teléfono");
  if (mail && normalizarTexto(c.emailAddress) === mail) campos.push("correo");
  if (nombre && normalizarTexto(c.cardName) === nombre) campos.push("nombre");
  // No marcar duplicado por RFC genérico (XAXX010101000 / XEXX010101000)
  if (rfc && !rfcEsGenerico && normalizarRfc(c.federalTaxID) === rfc) {
    campos.push("RFC");
  }

  return { coincide: campos.length > 0, campos };
}

export type ClienteDuplicado = ClienteResumen & { campos: string[] };

export type ClienteDescuentoEnvioSap = {
  success: boolean;
  accion: string;
  idDescuento: number;
  absEntry: number;
  cardCode: string | null;
  estatusSync: string;
  mensaje: string | null;
};

export const clienteService = {
  getPorLeadOrigen: async (idLeadOrigen: number): Promise<ClienteResumen | null> => {
    const response = await api.get<unknown>("/api/Cliente", {
      params: { idLeadOrigen, soloActivos: false },
    });
    const lista = normalizeArray(assertOk(response, "No se pudo consultar el cliente.")).map(
      normalizeCliente,
    );
    return lista.find((c) => c.idCliente > 0) ?? null;
  },

  /**
   * Busca clientes duplicados por teléfono, correo, nombre o RFC.
   * Preferente: GET /api/Cliente/duplicados
   * Fallback: filtra listado GET /api/Cliente
   */
  buscarDuplicados: async (criterio: {
    telefono?: string | null;
    correo?: string | null;
    nombre?: string | null;
    rfc?: string | null;
    excluirIdCliente?: number | null;
    excluirIdLeadOrigen?: number | null;
  }): Promise<ClienteDuplicado[]> => {
    const tieneCriterio =
      soloDigitos(criterio.telefono) ||
      normalizarTexto(criterio.correo) ||
      normalizarTexto(criterio.nombre) ||
      (!esRfcGenerico(criterio.rfc) && normalizarRfc(criterio.rfc));
    if (!tieneCriterio) return [];

    const excluirId = criterio.excluirIdCliente ?? 0;
    const excluirLead = criterio.excluirIdLeadOrigen ?? 0;
    const rfcParaApi = esRfcGenerico(criterio.rfc)
      ? undefined
      : criterio.rfc?.trim() || undefined;

    const filtrar = (lista: ClienteResumen[]): ClienteDuplicado[] => {
      const out: ClienteDuplicado[] = [];
      for (const c of lista) {
        if (!c.idCliente || c.idCliente === excluirId) continue;
        if (excluirLead > 0 && c.idLeadOrigen === excluirLead) continue;
        const { coincide, campos } = esDuplicadoCliente(c, {
          ...criterio,
          rfc: rfcParaApi,
        });
        if (coincide) out.push({ ...c, campos });
      }
      return out;
    };

    try {
      const response = await api.get<unknown>("/api/Cliente/duplicados", {
        params: {
          telefono: criterio.telefono?.trim() || undefined,
          correo: criterio.correo?.trim() || undefined,
          nombre: criterio.nombre?.trim() || undefined,
          // No enviar RFC genérico al API (evita falsos positivos)
          rfc: rfcParaApi,
          excluirIdCliente: excluirId > 0 ? excluirId : undefined,
          excluirIdLeadOrigen: excluirLead > 0 ? excluirLead : undefined,
        },
      });
      if (response.status >= 200 && response.status < 300) {
        return filtrar(normalizeArray(response.data).map(normalizeCliente));
      }
    } catch {
      /* fallback */
    }

    const response = await api.get<unknown>("/api/Cliente", {
      params: { soloActivos: true },
    });
    const lista = normalizeArray(
      assertOk(response, "No se pudo validar duplicados de cliente."),
    ).map(normalizeCliente);
    return filtrar(lista);
  },

  getById: async (id: number): Promise<unknown> => {
    const response = await api.get<unknown>(`/api/Cliente/${id}`, {
      params: { incluirRelaciones: true },
    });
    return assertOk(response, "No se pudo cargar el detalle del cliente.");
  },

  /** Listado CRM de clientes (incl. convertidos desde prospecto). */
  getListado: async (opts?: {
    soloActivos?: boolean;
    estatusSap?: string | null;
    texto?: string | null;
    idLeadOrigen?: number | null;
  }): Promise<ClienteResumen[]> => {
    const response = await api.get<unknown>("/api/Cliente", {
      params: {
        soloActivos: opts?.soloActivos ?? true,
        estatusSap: opts?.estatusSap?.trim() || undefined,
        texto: opts?.texto?.trim() || undefined,
        idLeadOrigen:
          opts?.idLeadOrigen && opts.idLeadOrigen > 0
            ? opts.idLeadOrigen
            : undefined,
      },
    });
    return normalizeArray(
      assertOk(response, "No se pudieron cargar los clientes."),
    )
      .map(normalizeCliente)
      .filter((c) => c.idCliente > 0)
      .sort((a, b) => {
        const fa = a.fechaCreacion ? new Date(a.fechaCreacion).getTime() : 0;
        const fb = b.fechaCreacion ? new Date(b.fechaCreacion).getTime() : 0;
        return fb - fa;
      });
  },

  /** Requiere permiso API `cliente.asignar-cardcode` (o admin). */
  asignarCardCode: async (
    id: number,
    cardCode: string,
  ): Promise<ClienteResumen> => {
    const code = cardCode.trim();
    if (!code) throw new Error("CardCode es obligatorio.");
    if (code.length > 15) {
      throw new Error("CardCode no puede exceder 15 caracteres.");
    }
    const response = await api.put<unknown>(`/api/Cliente/${id}/cardcode`, {
      cardCode: code,
    });
    return normalizeCliente(
      assertOk(response, "No se pudo asignar el CardCode."),
    );
  },

  crear: async (payload: ClienteCreatePayload): Promise<ClienteResumen> => {
    const response = await api.post<unknown>("/api/Cliente", payload);
    return normalizeCliente(assertOk(response, "No se pudo crear el cliente."));
  },

  actualizar: async (id: number, payload: ClienteUpdatePayload): Promise<void> => {
    const response = await api.put<unknown>(`/api/Cliente/${id}`, payload);
    assertOk(response, "No se pudo actualizar el cliente.");
  },

  enviarASap: async (id: number): Promise<{
    success: boolean;
    accion: string;
    cardCode: string;
    estatusSap: string;
    mensaje: string | null;
  }> => {
    const response = await api.post<unknown>(`/api/Cliente/${id}/enviar-sap`, {}, {
      timeout: 120000,
    });
    const data = assertOk(response, "No se pudo enviar el cliente a SAP.");
    const o = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    return {
      success: Boolean(o.success ?? o.Success),
      accion: pickString(o, "accion", "Accion") ?? "",
      cardCode: pickString(o, "cardCode", "CardCode") ?? "",
      estatusSap: pickString(o, "estatusSap", "EstatusSap") ?? "",
      mensaje: pickString(o, "mensaje", "Mensaje") ?? pickString(o, "message", "Message"),
    };
  },

  getContactos: async (opts: {
    idLead?: number | null;
    idCliente?: number | null;
  }): Promise<unknown[]> => {
    const response = await api.get<unknown>("/api/Contactos", {
      params: {
        soloActivos: true,
        idLead: opts.idLead && opts.idLead > 0 ? opts.idLead : undefined,
        idCliente: opts.idCliente && opts.idCliente > 0 ? opts.idCliente : undefined,
      },
    });
    return normalizeArray(assertOk(response, "No se pudieron cargar los contactos."));
  },

  actualizarContacto: async (id: number, payload: ContactoCreatePayload): Promise<void> => {
    const response = await api.put<unknown>(`/api/Contactos/${id}`, payload);
    assertOk(response, "No se pudo actualizar el contacto.");
  },

  eliminarContacto: async (id: number): Promise<void> => {
    if (!id || id <= 0) return;
    const response = await api.delete<unknown>(`/api/Contactos/${id}`);
    assertOk(response, "No se pudo eliminar el contacto.");
  },

  getCatalogoMetodosPago: async (): Promise<CatalogoMetodoPagoSap[]> => {
    const response = await api.get<unknown>("/api/CatalogoMetodoPagoSap", {
      params: { soloActivos: true },
    });
    return normalizeArray(
      assertOk(response, "No se pudo cargar el catálogo de métodos de pago."),
    ).map((item) => {
      const o = (item && typeof item === "object" ? item : {}) as Record<
        string,
        unknown
      >;
      return {
        codigo: pickString(o, "codigo", "Codigo") ?? "",
        nombre: pickString(o, "nombre", "Nombre") ?? "",
        activo: true,
      };
    }).filter((m) => m.codigo);
  },

  getDefinicionesCampo: async (
    idEmpresa?: number | null,
  ): Promise<DefinicionCampoCliente[]> => {
    const response = await api.get<unknown>("/api/DefinicionCampoCliente", {
      params: { soloActivos: true, idEmpresa: idEmpresa || undefined },
    });
    return normalizeArray(
      assertOk(response, "No se pudieron cargar los campos de usuario."),
    ).map((item) => {
      const o = (item && typeof item === "object" ? item : {}) as Record<
        string,
        unknown
      >;
      return {
        idDefinicionCampo: pickNumber(o, "idDefinicionCampo", "IdDefinicionCampo") ?? 0,
        idEmpresa: pickNumber(o, "idEmpresa", "IdEmpresa"),
        clave: pickString(o, "clave", "Clave") ?? "",
        etiqueta: pickString(o, "etiqueta", "Etiqueta") ?? "",
        tipoDato: pickString(o, "tipoDato", "TipoDato") ?? "string",
        nombreCampoSap: pickString(o, "nombreCampoSap", "NombreCampoSap"),
        obligatorio: Boolean(o.obligatorio ?? o.Obligatorio),
        activo: true,
        orden: pickNumber(o, "orden", "Orden") ?? 0,
      };
    }).filter((d) => d.idDefinicionCampo > 0);
  },

  crearContacto: async (payload: ContactoCreatePayload): Promise<number> => {
    const response = await api.post<unknown>("/api/Contactos", payload);
    const data = assertOk(response, "No se pudo crear el contacto del cliente.");
    const o = (data && typeof data === "object" ? data : {}) as Record<
      string,
      unknown
    >;
    return pickNumber(o, "idContacto", "IdContacto") ?? 0;
  },

  getDirecciones: async (idCliente: number): Promise<unknown[]> => {
    const response = await api.get<unknown>(
      `/api/ClienteDireccion/cliente/${idCliente}`,
      { params: { soloActivos: true } },
    );
    return normalizeArray(
      assertOk(response, "No se pudieron cargar las direcciones."),
    );
  },

  crearDireccion: async (
    payload: DireccionCreatePayload,
  ): Promise<number> => {
    const response = await api.post<unknown>("/api/ClienteDireccion", payload);
    const data = assertOk(
      response,
      "No se pudo crear la dirección del cliente.",
    );
    const o = (data && typeof data === "object" ? data : {}) as Record<
      string,
      unknown
    >;
    return pickNumber(o, "idClienteDireccion", "IdClienteDireccion") ?? 0;
  },

  actualizarDireccion: async (
    id: number,
    payload: DireccionCreatePayload,
  ): Promise<void> => {
    const response = await api.put<unknown>(`/api/ClienteDireccion/${id}`, payload);
    assertOk(response, "No se pudo actualizar la dirección.");
  },

  getDescuentos: async (idCliente: number): Promise<ClienteDescuentoApi[]> => {
    const response = await api.get<unknown>(
      `/api/ClienteDescuentos/cliente/${idCliente}`,
    );
    return normalizeArray(
      assertOk(response, "No se pudieron cargar los descuentos."),
    )
      .map(normalizeDescuentoApi)
      .filter((d) => d.idDescuento > 0);
  },

  upsertDescuentos: async (
    idCliente: number,
    payload: ClienteDescuentoWritePayload,
  ): Promise<ClienteDescuentoApi> => {
    const response = await api.put<unknown>(
      `/api/ClienteDescuentos/cliente/${idCliente}`,
      payload,
    );
    return normalizeDescuentoApi(
      assertOk(response, "No se pudieron guardar los descuentos."),
    );
  },

  enviarDescuentosASap: async (
    idDescuento: number,
  ): Promise<ClienteDescuentoEnvioSap> => {
    const response = await api.post<unknown>(
      `/api/ClienteDescuentos/${idDescuento}/enviar-sap`,
      {},
      { timeout: 120000 },
    );
    const data = assertOk(response, "No se pudo enviar el descuento a SAP.");
    const o = (data && typeof data === "object" ? data : {}) as Record<
      string,
      unknown
    >;
    return {
      success: Boolean(o.success ?? o.Success),
      accion: pickString(o, "accion", "Accion") ?? "",
      idDescuento: pickNumber(o, "idDescuento", "IdDescuento") ?? idDescuento,
      absEntry: pickNumber(o, "absEntry", "AbsEntry") ?? 0,
      cardCode: pickString(o, "cardCode", "CardCode"),
      estatusSync: pickString(o, "estatusSync", "EstatusSync") ?? "",
      mensaje:
        pickString(o, "mensaje", "Mensaje") ??
        pickString(o, "message", "Message"),
    };
  },
};

function normalizeDescuentoApi(raw: unknown): ClienteDescuentoApi {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  return {
    idDescuento: pickNumber(o, "idDescuento", "IdDescuento") ?? 0,
    idCliente: pickNumber(o, "idCliente", "IdCliente") ?? 0,
    cardCode: pickString(o, "cardCode", "CardCode"),
    absEntry: pickNumber(o, "absEntry", "AbsEntry") ?? 0,
    type: pickString(o, "type", "Type"),
    objType: pickString(o, "objType", "ObjType"),
    objCode: pickString(o, "objCode", "ObjCode"),
    discRel: pickString(o, "discRel", "DiscRel"),
    validFor: pickString(o, "validFor", "ValidFor"),
    estatusSync: pickString(o, "estatusSync", "EstatusSync"),
    fechaSync: pickString(o, "fechaSync", "FechaSync"),
    errorSync: pickString(o, "errorSync", "ErrorSync"),
    detalles: normalizeArray(o.detalles ?? o.Detalles).map((item) => {
      const d = (item && typeof item === "object" ? item : {}) as Record<
        string,
        unknown
      >;
      return {
        idDescuentoDetalle:
          pickNumber(d, "idDescuentoDetalle", "IdDescuentoDetalle") ?? 0,
        objType: pickString(d, "objType", "ObjType"),
        objKey: pickString(d, "objKey", "ObjKey"),
        discType: pickString(d, "discType", "DiscType"),
        discount: pickNumber(d, "discount", "Discount") ?? 0,
        payFor: pickNumber(d, "payFor", "PayFor") ?? 0,
        forFree: pickNumber(d, "forFree", "ForFree") ?? 0,
        upTo: pickNumber(d, "upTo", "UpTo") ?? 0,
      };
    }),
  };
}
