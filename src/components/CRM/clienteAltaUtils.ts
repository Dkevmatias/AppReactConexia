export type TipoPersonaCliente = "FISICA" | "MORAL";
export type TipoDireccionCliente = "FISCAL" | "ENTREGA";
export type GeneroContacto = "M" | "F" | "";
export type EnviarCorreoContacto = "Y" | "N" | "";

export type DireccionClienteForm = {
  idLocal: string;
  idClienteDireccion?: number | null;
  tipo: TipoDireccionCliente;
  nombre: string;
  calle: string;
  numero: string;
  colonia: string;
  ciudad: string;
  estado: string;
  pais: string;
  cp: string;
  iva: string;
  coloniaSat: string;
  localidadSat: string;
  municipioSat: string;
  estadoSat: string;
  paisSat: string;
  cpSat: string;
  referencia: string;
};

export type ContactoClienteForm = {
  idLocal: string;
  idContacto?: number | null;
  nombre: string;
  apellido1: string;
  apellido2: string;
  titulo: string;
  posicion: string;
  telefono1: string;
  telefono2: string;
  email: string;
  genero: GeneroContacto;
  enviarCorreo: EnviarCorreoContacto;
};

export type ClienteAltaForm = {
  tipoPersona: TipoPersonaCliente | "";
  cardName: string;
  cardForeignName: string;
  rfc: string;
  usoCfdi: string;
  regimenFiscal: string;
  metodoPagoCfdi: string;
  formaPagoCfdi: string;
  phone1: string;
  phone2: string;
  emailAddress: string;
  currency: string;
  payTermsGrpCode: string;
  priceListNum: string;
  salesPersonCode: string;
  uBxpRuta: string;
  uBxpDpp: string;
  uBxpPorcDpp: string;
  uTipoCliente: string;
  uDiaVisita: string;
  addenda: string;
  addendaEsp: string;
  usaMapEsp: string;
  envioAutCe: string;
  ieps: string;
  comEdu: string;
  agrParMos: string;
  metodosPago: string[];
  camposExtra: Record<number, string>;
  contactos: ContactoClienteForm[];
  direcciones: DireccionClienteForm[];
};

export const USOS_CFDI_COMUNES = [
  { value: "", label: "Seleccione uso CFDI" },
  { value: "G01", label: "G01 — Adquisición de mercancías" },
  { value: "G02", label: "G02 — Devoluciones, descuentos o bonificaciones" },
  { value: "G03", label: "G03 — Gastos en general" },
  { value: "I01", label: "I01 — Construcciones" },
  { value: "I02", label: "I02 — Mobilario y equipo de oficina" },
  { value: "I03", label: "I03 — Equipo de transporte" },
  { value: "I04", label: "I04 — Equipo de cómputo y accesorios" },
  { value: "I08", label: "I08 — Otra maquinaria y equipo" },
  {
    value: "D01",
    label: "D01 — Honorarios médicos, dentales y gastos hospitalarios",
  },
  { value: "P01", label: "P01 — Por definir" },
  { value: "S01", label: "S01 — Sin efectos fiscales" },
];

export const METODOS_PAGO_CFDI = [
  { value: "", label: "Seleccione método" },
  { value: "PUE", label: "PUE — Pago en una sola exhibición" },
  { value: "PPD", label: "PPD — Pago en parcialidades o diferido" },
];

export const FORMAS_PAGO_CFDI = [
  { value: "", label: "Seleccione forma" },
  { value: "01", label: "01 — Efectivo" },
  { value: "03", label: "03 — Transferencia electrónica" },
  { value: "04", label: "04 — Tarjeta de crédito" },
  { value: "28", label: "28 — Tarjeta de débito" },
  { value: "99", label: "99 — Por definir" },
];

/** Día de visita SAP (U_DiaVisita): 1=Lunes … 7=Domingo. */
export const DIAS_VISITA_SAP = [
  { value: "1", label: "1 — Lunes" },
  { value: "2", label: "2 — Martes" },
  { value: "3", label: "3 — Miércoles" },
  { value: "4", label: "4 — Jueves" },
  { value: "5", label: "5 — Viernes" },
  { value: "6", label: "6 — Sábado" },
  { value: "7", label: "7 — Domingo" },
] as const;

/** Códigos OCST (SAP) y c_Estado (SAT) para México. */
export const ESTADOS_MEXICO = [
  { sap: "AGS", sat: "AGU", nombre: "Aguascalientes" },
  { sap: "BCN", sat: "BCN", nombre: "Baja California" },
  { sap: "BCS", sat: "BCS", nombre: "Baja California Sur" },
  { sap: "CAM", sat: "CAM", nombre: "Campeche" },
  { sap: "CHS", sat: "CHP", nombre: "Chiapas" },
  { sap: "CHI", sat: "CHH", nombre: "Chihuahua" },
  { sap: "COA", sat: "COA", nombre: "Coahuila" },
  { sap: "COL", sat: "COL", nombre: "Colima" },
  { sap: "DIF", sat: "CMX", nombre: "Ciudad de México" },
  { sap: "DGO", sat: "DUR", nombre: "Durango" },
  { sap: "GTO", sat: "GUA", nombre: "Guanajuato" },
  { sap: "GRO", sat: "GRO", nombre: "Guerrero" },
  { sap: "HGO", sat: "HID", nombre: "Hidalgo" },
  { sap: "JAL", sat: "JAL", nombre: "Jalisco" },
  { sap: "MEX", sat: "MEX", nombre: "Estado de México" },
  { sap: "MIC", sat: "MIC", nombre: "Michoacán" },
  { sap: "MOR", sat: "MOR", nombre: "Morelos" },
  { sap: "NAY", sat: "NAY", nombre: "Nayarit" },
  { sap: "NLE", sat: "NLE", nombre: "Nuevo León" },
  { sap: "OAX", sat: "OAX", nombre: "Oaxaca" },
  { sap: "PUE", sat: "PUE", nombre: "Puebla" },
  { sap: "QRO", sat: "QUE", nombre: "Querétaro" },
  { sap: "ROO", sat: "ROO", nombre: "Quintana Roo" },
  { sap: "SLP", sat: "SLP", nombre: "San Luis Potosí" },
  { sap: "SIN", sat: "SIN", nombre: "Sinaloa" },
  { sap: "SON", sat: "SON", nombre: "Sonora" },
  { sap: "TAB", sat: "TAB", nombre: "Tabasco" },
  { sap: "TAM", sat: "TAM", nombre: "Tamaulipas" },
  { sap: "TLA", sat: "TLA", nombre: "Tlaxcala" },
  { sap: "VER", sat: "VER", nombre: "Veracruz" },
  { sap: "YUC", sat: "YUC", nombre: "Yucatán" },
  { sap: "ZAC", sat: "ZAC", nombre: "Zacatecas" },
] as const;

export const CONDICION_PAGO_FIJA = { code: 8, nombre: "Contado" } as const;
export const LISTA_PRECIOS_FIJA = { code: 1, nombre: "General" } as const;
export const MONEDA_FIJA = "MXN";

export const SI_NO_SAP = [
  { value: "", label: "Seleccione" },
  { value: "Y", label: "Sí" },
  { value: "N", label: "No" },
];

function nuevoIdLocal(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function direccionVacia(
  tipo: TipoDireccionCliente = "FISCAL",
): DireccionClienteForm {
  return {
    idLocal: nuevoIdLocal(),
    idClienteDireccion: null,
    tipo,
    nombre: tipo === "FISCAL" ? "Fiscal" : "Entrega",
    calle: "",
    numero: "",
    colonia: "",
    ciudad: "",
    estado: "",
    pais: "MX",
    cp: "",
    iva: "",
    coloniaSat: "",
    localidadSat: "",
    municipioSat: "",
    estadoSat: "",
    paisSat: "MEX",
    cpSat: "",
    referencia: "",
  };
}

export function contactoVacio(): ContactoClienteForm {
  return {
    idLocal: nuevoIdLocal(),
    nombre: "",
    apellido1: "",
    apellido2: "",
    titulo: "",
    posicion: "",
    telefono1: "",
    telefono2: "",
    email: "",
    genero: "",
    enviarCorreo: "",
  };
}

export function clienteAltaVacio(): ClienteAltaForm {
  return {
    tipoPersona: "",
    cardName: "",
    cardForeignName: "",
    rfc: "",
    usoCfdi: "",
    regimenFiscal: "",
    metodoPagoCfdi: "",
    formaPagoCfdi: "",
    phone1: "",
    phone2: "",
    emailAddress: "",
    currency: MONEDA_FIJA,
    payTermsGrpCode: String(CONDICION_PAGO_FIJA.code),
    priceListNum: String(LISTA_PRECIOS_FIJA.code),
    salesPersonCode: "",
    uBxpRuta: "",
    uBxpDpp: "",
    uBxpPorcDpp: "",
    uTipoCliente: "",
    uDiaVisita: "",
    addenda: "",
    addendaEsp: "",
    usaMapEsp: "N",
    envioAutCe: "N",
    ieps: "N",
    comEdu: "N",
    agrParMos: "N",
    metodosPago: [],
    camposExtra: {},
    contactos: [],
    direcciones: [],
  };
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function pickRaw(o: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (o[key] !== undefined && o[key] !== null) return o[key];
  }
  return undefined;
}

function pickStr(o: Record<string, unknown>, ...keys: string[]): string {
  const v = pickRaw(o, ...keys);
  if (typeof v === "string") return v;
  if (typeof v === "number" && !Number.isNaN(v)) return String(v);
  return "";
}

function tipoPersonaDesdeSap(companyPrivate: string): TipoPersonaCliente | "" {
  const v = companyPrivate.trim().toLowerCase();
  if (v === "ccompany") return "MORAL";
  if (v === "cprivate") return "FISICA";
  return "";
}

function tipoDireccionDesdeSap(addressType: string): TipoDireccionCliente {
  const v = addressType.trim().toLowerCase();
  if (v === "bo_shipto" || v === "entrega" || v === "ship") return "ENTREGA";
  return "FISCAL";
}

export function contactoFormDesdeApi(raw: unknown): ContactoClienteForm {
  const c = asRecord(raw);
  const idContacto = Number(pickRaw(c, "idContacto", "IdContacto"));
  const generoRaw = pickStr(c, "gender", "Gender").toUpperCase();
  const genero: GeneroContacto =
    generoRaw.startsWith("F") || generoRaw === "GT_FEMALE" ? "F"
    : generoRaw.startsWith("M") || generoRaw === "GT_MALE" ? "M"
    : "";

  return {
    ...contactoVacio(),
    idContacto: idContacto > 0 ? idContacto : null,
    nombre: pickStr(c, "nombre", "Nombre", "firstName", "FirstName"),
    apellido1: pickStr(c, "aPaterno", "APaterno"),
    apellido2: pickStr(c, "aMaterno", "AMaterno"),
    titulo: pickStr(c, "title", "Title"),
    posicion: pickStr(c, "puesto", "Puesto"),
    telefono1: pickStr(c, "telefono", "Telefono"),
    telefono2: pickStr(c, "telefonoSecundario", "TelefonoSecundario"),
    email: pickStr(c, "email", "Email"),
    genero,
  };
}

/** Reconstruye el formulario de alta desde GET /api/Cliente/{id}. */
export function clienteAltaDesdeApi(raw: unknown): ClienteAltaForm {
  const o = asRecord(raw);
  const fiscal = asRecord(pickRaw(o, "datosFiscales", "DatosFiscales"));
  const base = clienteAltaVacio();

  const camposExtra: Record<number, string> = {};
  for (const item of asArray(pickRaw(o, "camposExtra", "CamposExtra"))) {
    const e = asRecord(item);
    const id = Number(pickRaw(e, "idDefinicionCampo", "IdDefinicionCampo"));
    if (id > 0) camposExtra[id] = pickStr(e, "valor", "Valor");
  }

  return {
    ...base,
    tipoPersona: tipoPersonaDesdeSap(
      pickStr(o, "companyPrivate", "CompanyPrivate"),
    ),
    cardName: pickStr(o, "cardName", "CardName"),
    cardForeignName: pickStr(o, "cardForeignName", "CardForeignName"),
    rfc: pickStr(o, "federalTaxID", "FederalTaxID"),
    usoCfdi: pickStr(fiscal, "usoCfdi", "UsoCfdi", "mainUsage", "MainUsage"),
    regimenFiscal: pickStr(fiscal, "regimenFiscal", "RegimenFiscal"),
    metodoPagoCfdi: pickStr(fiscal, "metodoPagoCfdi", "MetodoPagoCfdi"),
    formaPagoCfdi: pickStr(fiscal, "formaPagoCfdi", "FormaPagoCfdi"),
    phone1: pickStr(o, "phone1", "Phone1"),
    phone2: pickStr(o, "phone2", "Phone2"),
    emailAddress: pickStr(o, "emailAddress", "EmailAddress"),
    currency: pickStr(o, "currency", "Currency") || MONEDA_FIJA,
    payTermsGrpCode:
      pickStr(o, "payTermsGrpCode", "PayTermsGrpCode") ||
      String(CONDICION_PAGO_FIJA.code),
    priceListNum:
      pickStr(o, "priceListNum", "PriceListNum") ||
      String(LISTA_PRECIOS_FIJA.code),
    salesPersonCode: pickStr(o, "salesPersonCode", "SalesPersonCode"),
    uBxpRuta: pickStr(o, "u_BXP_RUTA", "U_BXP_RUTA"),
    uBxpDpp: pickStr(o, "u_BXP_DPP", "U_BXP_DPP"),
    uBxpPorcDpp: pickStr(o, "u_BXP_PorcDPP", "U_BXP_PorcDPP"),
    uTipoCliente: pickStr(o, "u_TipoCliente", "U_TipoCliente"),
    uDiaVisita: pickStr(o, "u_DiaVisita", "U_DiaVisita"),
    addenda: pickStr(fiscal, "addenda", "Addenda"),
    addendaEsp: pickStr(fiscal, "addendaEsp", "AddendaEsp"),
    usaMapEsp: pickStr(fiscal, "usaMapEsp", "UsaMapEsp") || "N",
    envioAutCe: pickStr(fiscal, "envioAutCe", "EnvioAutCe") || "N",
    ieps: pickStr(fiscal, "ieps", "Ieps") || "N",
    comEdu: pickStr(fiscal, "comEdu", "ComEdu") || "N",
    agrParMos: pickStr(fiscal, "agrParMos", "AgrParMos") || "N",
    metodosPago: asArray(pickRaw(o, "metodosPago", "MetodosPago"))
      .map((m) => pickStr(asRecord(m), "codigoMetodoPago", "CodigoMetodoPago"))
      .filter(Boolean),
    camposExtra,
    contactos: asArray(pickRaw(o, "contactos", "Contactos")).map(contactoFormDesdeApi),
    direcciones: asArray(pickRaw(o, "direcciones", "Direcciones")).map(
      direccionFormDesdeApi,
    ),
  };
}

export function nombreCompletoContacto(c: ContactoClienteForm): string {
  return [c.nombre, c.apellido1, c.apellido2]
    .map((p) => p.trim())
    .filter(Boolean)
    .join(" ");
}

function normalizarTelefonoContacto(valor: string | null | undefined): string {
  return (valor ?? "").replace(/\D/g, "");
}

function normalizarTextoContacto(valor: string | null | undefined): string {
  return (valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Impide contactos duplicados en el mismo cliente:
 * nombre completo, teléfono o correo no pueden repetirse.
 */
export function validarContactosUnicos(
  contactos: ContactoClienteForm[],
): string | null {
  const nombres = new Map<string, number>();
  const telefonos = new Map<string, number>();
  const correos = new Map<string, number>();

  for (let i = 0; i < contactos.length; i++) {
    const c = contactos[i];
    const idx = i + 1;
    const nombre = normalizarTextoContacto(nombreCompletoContacto(c));
    const telefono = normalizarTelefonoContacto(c.telefono1);
    const correo = normalizarTextoContacto(c.email);

    if (nombre) {
      const prev = nombres.get(nombre);
      if (prev != null) {
        return `El contacto ${idx} tiene el mismo nombre que el contacto ${prev}. Cada contacto debe tener un nombre distinto.`;
      }
      nombres.set(nombre, idx);
    }

    if (telefono) {
      const prev = telefonos.get(telefono);
      if (prev != null) {
        return `El contacto ${idx} tiene el mismo teléfono que el contacto ${prev}. Use un número distinto.`;
      }
      telefonos.set(telefono, idx);
    }

    if (correo) {
      const prev = correos.get(correo);
      if (prev != null) {
        return `El contacto ${idx} tiene el mismo correo que el contacto ${prev}. Use un correo distinto.`;
      }
      correos.set(correo, idx);
    }
  }

  return null;
}

/** Clona una dirección fiscal como nueva dirección de entrega. */
export function clonarDireccionComoEntrega(
  origen: DireccionClienteForm,
): DireccionClienteForm {
  return {
    ...origen,
    idLocal: nuevoIdLocal(),
    idClienteDireccion: null,
    tipo: "ENTREGA",
    nombre: origen.nombre
      ? `${origen.nombre} (Entrega)`.replace(
          / \(Entrega\)( \(Entrega\))+/,
          " (Entrega)",
        )
      : "Entrega",
  };
}

export function etiquetaTipoDireccion(tipo: TipoDireccionCliente): string {
  return tipo === "FISCAL" ? "Fiscal" : "Entrega";
}

export function etiquetaTipoPersona(tipo: TipoPersonaCliente | ""): string {
  if (tipo === "FISICA") return "Física";
  if (tipo === "MORAL") return "Moral";
  return "—";
}

export function companyPrivateDesdeTipo(
  tipo: TipoPersonaCliente | "",
): string {
  return tipo === "MORAL" ? "cCompany" : "cPrivate";
}

export function paisSap(valor: string | null | undefined): string {
  const v = (valor ?? "").trim().toLowerCase();
  if (!v || v === "méxico" || v === "mexico" || v === "mx") return "MX";
  return (valor ?? "").trim().slice(0, 3).toUpperCase() || "MX";
}

function normalizarEstado(valor: string): string {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();
}

export function estadoMexicoPorValor(valor: string | null | undefined) {
  const raw = (valor ?? "").trim();
  if (!raw) return undefined;
  const n = normalizarEstado(raw);
  const porCodigo = ESTADOS_MEXICO.find((e) => e.sap === n || e.sat === n);
  if (porCodigo) return porCodigo;

  if (n === "DF" || n === "CDMX" || n === "DISTRITO FEDERAL") {
    return ESTADOS_MEXICO.find((e) => e.sap === "DIF");
  }

  return [...ESTADOS_MEXICO]
    .sort((a, b) => b.nombre.length - a.nombre.length)
    .find((e) => {
      const nn = normalizarEstado(e.nombre);
      return n === nn || n.includes(nn) || nn.includes(n);
    });
}

/** Código OCST (ej. CHS). Si no hay coincidencia, recorta a 10 para CRM. */
export function codigoEstadoSap(valor: string | null | undefined): string | null {
  const raw = (valor ?? "").trim();
  if (!raw) return null;
  const match = estadoMexicoPorValor(raw);
  if (match) return match.sap;
  return raw.slice(0, 10);
}

export function codigoEstadoSat(valor: string | null | undefined): string | null {
  const raw = (valor ?? "").trim();
  if (!raw) return null;
  const match = estadoMexicoPorValor(raw);
  if (match) return match.sat;
  return raw.slice(0, 10);
}

function trimOrNull(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  return t ? t : null;
}

/**
 * SAP espera formas de pago 1–8 con cero a la izquierda (01…08).
 * Códigos ya padded o fuera de 1–8 se dejan igual.
 */
export function codigoFormaPagoSap(
  valor: string | null | undefined,
): string | null {
  const t = trimOrNull(valor);
  if (!t) return null;
  if (/^\d{1,2}$/.test(t)) {
    const n = Number(t);
    if (n >= 1 && n <= 8) return String(n).padStart(2, "0");
  }
  return t;
}

function numeroONull(v: string | null | undefined): number | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isNaN(n) ? null : n;
}

export function validarClienteAlta(form: ClienteAltaForm): string | null {
  if (!form.cardName.trim()) {
    return "El nombre de negocio (CardName) es obligatorio para crear el cliente.";
  }
  if (form.cardName.trim().length > 100) {
    return "El nombre de negocio no puede exceder 100 caracteres.";
  }
  return null;
}

export type ClienteCreatePayload = {
  idEmpresa: number;
  idSucursal?: number | null;
  idLeadOrigen?: number | null;
  idUsuarioCreacion?: number | null;
  cardName: string;
  cardForeignName?: string | null;
  cardType: string;
  groupCode?: number | null;
  payTermsGrpCode?: number | null;
  priceListNum?: number | null;
  currency?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  emailAddress?: string | null;
  federalTaxID?: string | null;
  companyPrivate?: string | null;
  country?: string | null;
  salesPersonCode?: number | null;
  u_BXP_RUTA?: string | null;
  u_BXP_DPP?: string | null;
  u_BXP_PorcDPP?: number | null;
  u_TipoCliente?: string | null;
  u_DiaVisita?: string | null;
  estatusSap: string;
  datosFiscales?: {
    regimenFiscal?: string | null;
    metodoPagoCfdi?: string | null;
    formaPagoCfdi?: string | null;
    usoCfdi?: string | null;
    addenda?: string | null;
    addendaEsp?: string | null;
    usaMapEsp?: string | null;
    envioAutCe?: string | null;
    ieps?: string | null;
    comEdu?: string | null;
    agrParMos?: string | null;
    mainUsage?: string | null;
  };
  direcciones?: Array<{
    addressName: string;
    addressType: string;
    street?: string | null;
    streetNo?: string | null;
    block?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    zipCode?: string | null;
    taxCode?: string | null;
    federalTaxID?: string | null;
    u_COK1_01COL?: string | null;
    u_COK1_01LOC?: string | null;
    u_COK1_01MUN?: string | null;
    u_COK1_01EST?: string | null;
    u_Country?: string | null;
    u_ZipCode?: string | null;
    u_Referencia?: string | null;
    esDefaultBillTo: boolean;
    esDefaultShipTo: boolean;
    activo: boolean;
  }>;
  metodosPago?: Array<{
    codigoMetodoPago: string;
    esDefault: boolean;
    activo: boolean;
  }>;
  camposExtra?: Array<{
    idDefinicionCampo: number;
    valor?: string | null;
  }>;
};

export type ClienteUpdatePayload = {
  idEmpresa?: number;
  idSucursal?: number | null;
  idLeadOrigen?: number | null;
  idUsuarioActualizacion?: number | null;
  cardName?: string;
  cardForeignName?: string | null;
  groupCode?: number | null;
  payTermsGrpCode?: number | null;
  priceListNum?: number | null;
  currency?: string | null;
  phone1?: string | null;
  phone2?: string | null;
  emailAddress?: string | null;
  federalTaxID?: string | null;
  companyPrivate?: string | null;
  country?: string | null;
  salesPersonCode?: number | null;
  u_BXP_RUTA?: string | null;
  u_BXP_DPP?: string | null;
  u_BXP_PorcDPP?: number | null;
  u_TipoCliente?: string | null;
  u_DiaVisita?: string | null;
};

export type ContactoCreatePayload = {
  idContacto?: number | null;
  nombre: string;
  aPaterno?: string | null;
  aMaterno?: string | null;
  telefono?: string | null;
  telefonoSecundario?: string | null;
  email?: string | null;
  idEmpresa?: number | null;
  puesto?: string | null;
  idCliente?: number | null;
  idLead?: number | null;
  firstName?: string | null;
  title?: string | null;
  gender?: string | null;
  activo: boolean;
};

export function armarPayloadClienteCreate(opts: {
  form: ClienteAltaForm;
  idEmpresa: number;
  idSucursal?: number | null;
  idLeadOrigen: number;
  idUsuarioCreacion?: number | null;
  groupCode?: number | null;
}): ClienteCreatePayload {
  const { form } = opts;
  const fiscales = form.direcciones.filter((d) => d.tipo === "FISCAL");
  const entregas = form.direcciones.filter((d) => d.tipo === "ENTREGA");

  return {
    idEmpresa: opts.idEmpresa,
    idSucursal: opts.idSucursal ?? null,
    idLeadOrigen: opts.idLeadOrigen,
    idUsuarioCreacion: opts.idUsuarioCreacion ?? null,
    cardName: form.cardName.trim(),
    cardForeignName: trimOrNull(form.cardForeignName),
    cardType: "cCustomer",
    groupCode: opts.groupCode ?? null,
    payTermsGrpCode: CONDICION_PAGO_FIJA.code,
    priceListNum: LISTA_PRECIOS_FIJA.code,
    currency: MONEDA_FIJA,
    phone1: trimOrNull(form.phone1),
    phone2: trimOrNull(form.phone2),
    emailAddress: trimOrNull(form.emailAddress),
    federalTaxID: trimOrNull(form.rfc),
    companyPrivate: companyPrivateDesdeTipo(form.tipoPersona),
    country: "MX",
    salesPersonCode: numeroONull(form.salesPersonCode),
    u_BXP_RUTA: trimOrNull(form.uBxpRuta),
    u_BXP_DPP: trimOrNull(form.uBxpDpp),
    u_BXP_PorcDPP: numeroONull(form.uBxpPorcDpp),
    u_TipoCliente: trimOrNull(form.uTipoCliente),
    u_DiaVisita: trimOrNull(form.uDiaVisita),
    estatusSap: "Borrador",
    datosFiscales: {
      regimenFiscal: trimOrNull(form.regimenFiscal),
      metodoPagoCfdi: trimOrNull(form.metodoPagoCfdi),
      formaPagoCfdi: codigoFormaPagoSap(form.formaPagoCfdi),
      usoCfdi: trimOrNull(form.usoCfdi),
      addenda: trimOrNull(form.addenda),
      addendaEsp: trimOrNull(form.addendaEsp),
      usaMapEsp: trimOrNull(form.usaMapEsp),
      envioAutCe: trimOrNull(form.envioAutCe),
      ieps: trimOrNull(form.ieps),
      comEdu: trimOrNull(form.comEdu),
      agrParMos: trimOrNull(form.agrParMos),
      mainUsage: trimOrNull(form.usoCfdi),
    },
    direcciones: form.direcciones
      .filter((d) => d.nombre.trim() || d.calle.trim())
      .map((d) => ({
        addressName: d.nombre.trim() || etiquetaTipoDireccion(d.tipo),
        addressType: d.tipo === "FISCAL" ? "bo_BillTo" : "bo_ShipTo",
        street: trimOrNull(d.calle),
        streetNo: trimOrNull(d.numero),
        block: trimOrNull(d.colonia),
        city: trimOrNull(d.ciudad),
        state: codigoEstadoSap(d.estado),
        country: paisSap(d.pais),
        zipCode: trimOrNull(d.cp),
        taxCode: trimOrNull(d.iva),
        federalTaxID: trimOrNull(form.rfc),
        u_COK1_01COL: trimOrNull(d.coloniaSat || d.colonia),
        u_COK1_01LOC: trimOrNull(d.localidadSat),
        u_COK1_01MUN: trimOrNull(d.municipioSat),
        u_COK1_01EST: codigoEstadoSat(d.estadoSat || d.estado),
        u_Country: trimOrNull(d.paisSat),
        u_ZipCode: trimOrNull(d.cpSat || d.cp),
        u_Referencia: trimOrNull(d.referencia),
        esDefaultBillTo: fiscales[0]?.idLocal === d.idLocal,
        esDefaultShipTo: entregas[0]?.idLocal === d.idLocal,
        activo: true,
      })),
    metodosPago: (() => {
      const codigos =
        form.metodosPago.length > 0
          ? form.metodosPago
          : form.formaPagoCfdi.trim()
            ? [form.formaPagoCfdi.trim()]
            : [];
      return codigos
        .map((c) => codigoFormaPagoSap(c))
        .filter((c): c is string => Boolean(c))
        .map((codigoMetodoPago, idx) => ({
          codigoMetodoPago,
          esDefault: idx === 0,
          activo: true,
        }));
    })(),
    camposExtra: Object.entries(form.camposExtra)
      .map(([id, valor]) => ({
        idDefinicionCampo: Number(id),
        valor: trimOrNull(valor),
      }))
      .filter((c) => c.idDefinicionCampo > 0),
  };
}

export function armarPayloadClienteUpdate(opts: {
  form: ClienteAltaForm;
  idEmpresa: number;
  idSucursal?: number | null;
  idLeadOrigen: number;
  idUsuarioActualizacion?: number | null;
  groupCode?: number | null;
}): ClienteUpdatePayload {
  const { form } = opts;
  return {
    idEmpresa: opts.idEmpresa,
    idSucursal: opts.idSucursal ?? null,
    idLeadOrigen: opts.idLeadOrigen,
    idUsuarioActualizacion: opts.idUsuarioActualizacion ?? null,
    cardName: form.cardName.trim(),
    cardForeignName: trimOrNull(form.cardForeignName),
    groupCode: opts.groupCode ?? null,
    payTermsGrpCode: CONDICION_PAGO_FIJA.code,
    priceListNum: LISTA_PRECIOS_FIJA.code,
    currency: MONEDA_FIJA,
    phone1: trimOrNull(form.phone1),
    phone2: trimOrNull(form.phone2),
    emailAddress: trimOrNull(form.emailAddress),
    federalTaxID: trimOrNull(form.rfc),
    companyPrivate: companyPrivateDesdeTipo(form.tipoPersona),
    country: "MX",
    salesPersonCode: numeroONull(form.salesPersonCode),
    u_BXP_RUTA: trimOrNull(form.uBxpRuta),
    u_BXP_DPP: trimOrNull(form.uBxpDpp),
    u_BXP_PorcDPP: numeroONull(form.uBxpPorcDpp),
    u_TipoCliente: trimOrNull(form.uTipoCliente),
    u_DiaVisita: trimOrNull(form.uDiaVisita),
  };
}

export function armarPayloadContacto(
  c: ContactoClienteForm,
  opts: { idCliente: number; idLead: number; idEmpresa?: number | null },
): ContactoCreatePayload {
  return {
    idContacto: c.idContacto ?? null,
    nombre: c.nombre.trim(),
    aPaterno: trimOrNull(c.apellido1),
    aMaterno: trimOrNull(c.apellido2),
    telefono: trimOrNull(c.telefono1),
    telefonoSecundario: trimOrNull(c.telefono2),
    email: trimOrNull(c.email),
    idEmpresa: opts.idEmpresa ?? null,
    puesto: trimOrNull(c.posicion),
    idCliente: opts.idCliente,
    idLead: opts.idLead,
    firstName: trimOrNull(c.nombre),
    title: trimOrNull(c.titulo),
    gender: trimOrNull(c.genero),
    activo: true,
  };
}

export function armarPayloadsContactos(opts: {
  form: ClienteAltaForm;
  idCliente: number;
  idLead: number;
  idEmpresa?: number | null;
}): ContactoCreatePayload[] {
  return opts.form.contactos
    .filter((c) => c.nombre.trim())
    .map((c) => armarPayloadContacto(c, opts));
}

export type DireccionCreatePayload = {
  idCliente: number;
  addressName: string;
  addressType: string;
  street?: string | null;
  streetNo?: string | null;
  block?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
  taxCode?: string | null;
  federalTaxID?: string | null;
  u_COK1_01COL?: string | null;
  u_COK1_01LOC?: string | null;
  u_COK1_01MUN?: string | null;
  u_COK1_01EST?: string | null;
  u_Country?: string | null;
  u_ZipCode?: string | null;
  u_Referencia?: string | null;
  esDefaultBillTo: boolean;
  esDefaultShipTo: boolean;
  activo: boolean;
};

export function armarPayloadDireccion(
  d: DireccionClienteForm,
  opts: {
    idCliente: number;
    rfc?: string | null;
    esDefaultBillTo?: boolean;
    esDefaultShipTo?: boolean;
  },
): DireccionCreatePayload {
  return {
    idCliente: opts.idCliente,
    addressName: d.nombre.trim() || etiquetaTipoDireccion(d.tipo),
    addressType: d.tipo === "FISCAL" ? "bo_BillTo" : "bo_ShipTo",
    street: trimOrNull(d.calle),
    streetNo: trimOrNull(d.numero),
    block: trimOrNull(d.colonia),
    city: trimOrNull(d.ciudad),
    state: codigoEstadoSap(d.estado),
    country: paisSap(d.pais),
    zipCode: trimOrNull(d.cp),
    taxCode: trimOrNull(d.iva),
    federalTaxID: trimOrNull(opts.rfc),
    u_COK1_01COL: trimOrNull(d.coloniaSat || d.colonia),
    u_COK1_01LOC: trimOrNull(d.localidadSat),
    u_COK1_01MUN: trimOrNull(d.municipioSat),
    u_COK1_01EST: codigoEstadoSat(d.estadoSat || d.estado),
    u_Country: trimOrNull(d.paisSat),
    u_ZipCode: trimOrNull(d.cpSat || d.cp),
    u_Referencia: trimOrNull(d.referencia),
    esDefaultBillTo: opts.esDefaultBillTo ?? false,
    esDefaultShipTo: opts.esDefaultShipTo ?? false,
    activo: true,
  };
}

export function direccionFormDesdeApi(raw: unknown): DireccionClienteForm {
  const d = asRecord(raw);
  const tipo = tipoDireccionDesdeSap(
    pickStr(d, "addressType", "AddressType"),
  );
  const idDir = Number(pickRaw(d, "idClienteDireccion", "IdClienteDireccion"));
  return {
    ...direccionVacia(tipo),
    idClienteDireccion: idDir > 0 ? idDir : null,
    tipo,
    nombre: pickStr(d, "addressName", "AddressName"),
    calle: pickStr(d, "street", "Street"),
    numero: pickStr(d, "streetNo", "StreetNo"),
    colonia: pickStr(d, "block", "Block"),
    ciudad: pickStr(d, "city", "City"),
    estado: pickStr(d, "state", "State"),
    pais: pickStr(d, "country", "Country") || "MX",
    cp: pickStr(d, "zipCode", "ZipCode"),
    iva: pickStr(d, "taxCode", "TaxCode"),
    coloniaSat: pickStr(d, "u_COK1_01COL", "U_COK1_01COL"),
    localidadSat: pickStr(d, "u_COK1_01LOC", "U_COK1_01LOC"),
    municipioSat: pickStr(d, "u_COK1_01MUN", "U_COK1_01MUN"),
    estadoSat: pickStr(d, "u_COK1_01EST", "U_COK1_01EST"),
    paisSat: pickStr(d, "u_Country", "U_Country") || "MEX",
    cpSat: pickStr(d, "u_ZipCode", "U_ZipCode"),
    referencia: pickStr(d, "u_Referencia", "U_Referencia"),
  };
}

export function prellenarClienteDesdeLead(opts: {
  actual: ClienteAltaForm;
  nombre?: string | null;
  aPaterno?: string | null;
  telefono?: string | null;
  correo?: string | null;
}): ClienteAltaForm {
  const nombreNegocio = [opts.nombre, opts.aPaterno]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
    .join(" ");

  return {
    ...opts.actual,
    cardName: opts.actual.cardName.trim() || nombreNegocio,
    phone1: opts.actual.phone1.trim() || (opts.telefono ?? "").trim(),
    emailAddress: opts.actual.emailAddress.trim() || (opts.correo ?? "").trim(),
  };
}

/** Payload Service Layer BusinessPartners (vista previa, aún no se envía). */
export function armarPayloadSapBusinessPartner(opts: {
  form: ClienteAltaForm;
  groupCode?: number | null;
  cardCode?: string | null;
}): Record<string, unknown> {
  const { form } = opts;
  const formaPago = codigoFormaPagoSap(form.formaPagoCfdi);
  const slp = numeroONull(form.salesPersonCode);
  const metodosSap = (
    form.metodosPago.length > 0
      ? form.metodosPago
      : formaPago
        ? [formaPago]
        : []
  )
    .map((c) => codigoFormaPagoSap(c))
    .filter((c): c is string => Boolean(c));

  return {
    CardCode: trimOrNull(opts.cardCode) ?? "",
    CardName: form.cardName.trim(),
    CardForeignName: trimOrNull(form.cardForeignName),
    CardType: "cCustomer",
    GroupCode: opts.groupCode ?? null,
    PayTermsGrpCode: CONDICION_PAGO_FIJA.code,
    Currency: MONEDA_FIJA,
    SalesPersonCode: slp,
    CompanyPrivate: companyPrivateDesdeTipo(form.tipoPersona),
    Country: "MX",
    FederalTaxID: trimOrNull(form.rfc),
    PriceListNum: LISTA_PRECIOS_FIJA.code,
    Phone1: trimOrNull(form.phone1),
    Phone2: trimOrNull(form.phone2),
    EmailAddress: trimOrNull(form.emailAddress),
    BPAddresses: form.direcciones
      .filter((d) => d.nombre.trim() || d.calle.trim())
      .map((d) => ({
        AddressName: d.nombre.trim() || etiquetaTipoDireccion(d.tipo),
        Street: trimOrNull(d.calle),
        StreetNo: trimOrNull(d.numero),
        Block: trimOrNull(d.colonia),
        City: trimOrNull(d.ciudad),
        State: codigoEstadoSap(d.estado),
        ZipCode: trimOrNull(d.cp),
        Country: paisSap(d.pais),
        TaxCode: trimOrNull(d.iva),
        AddressType: d.tipo === "FISCAL" ? "bo_BillTo" : "bo_ShipTo",
        U_IdUbic: null,
        U_COK1_01COL: trimOrNull(d.coloniaSat || d.colonia),
        U_COK1_01LOC: trimOrNull(d.localidadSat),
        U_Referencia: trimOrNull(d.referencia),
        U_COK1_01MUN: trimOrNull(d.municipioSat),
        U_COK1_01EST: codigoEstadoSat(d.estadoSat || d.estado),
        U_Country: trimOrNull(d.paisSat),
        U_ZipCode: trimOrNull(d.cpSat || d.cp),
      })),
    ContactEmployees: form.contactos
      .filter((c) => c.nombre.trim())
      .map((c) => ({
        Name: nombreCompletoContacto(c) || c.nombre.trim(),
        FirstName: trimOrNull(c.nombre),
        Title: trimOrNull(c.titulo),
        Position: trimOrNull(c.posicion),
        E_Mail: trimOrNull(c.email),
        Phone1: trimOrNull(c.telefono1),
        Gender: trimOrNull(c.genero),
      })),
    BPPaymentMethods: metodosSap.map((PaymentMethodCode) => ({
      PaymentMethodCode,
    })),
    U_B1SYS_MainUsage: trimOrNull(form.usoCfdi),
    U_COK1_01ADDENDA: trimOrNull(form.addenda),
    U_COK1_01ADDENDAESP: trimOrNull(form.addendaEsp),
    U_COK1_USMAPESP: form.usaMapEsp || "N",
    U_COK1_01ENVAUTCE: form.envioAutCe || "N",
    U_COK1_01IEPS: form.ieps || "N",
    U_COK1_01COMEDU: form.comEdu || "N",
    U_COK1_01AGRPARMOS: form.agrParMos || "N",
    U_COK1_01REGFIS: trimOrNull(form.regimenFiscal),
    U_Metodo: trimOrNull(form.metodoPagoCfdi),
    U_Forma: formaPago,
    U_BXP_RUTA: trimOrNull(form.uBxpRuta),
    U_BXP_DPP: trimOrNull(form.uBxpDpp),
    U_BXP_PorcDPP: numeroONull(form.uBxpPorcDpp),
    U_TipoCliente: trimOrNull(form.uTipoCliente),
    U_DiaVisita: trimOrNull(form.uDiaVisita),
  };
}

/** True si el cliente ya se envió correctamente a SAP (no reenviar). */
export function esClienteEnviadoSap(
  estatus: string | null | undefined,
): boolean {
  return (estatus ?? "").trim().toLowerCase() === "enviado";
}

/**
 * Permiso (por definir en catálogo de roles) para editar datos de un cliente
 * ya enviado a SAP. Mientras no exista, el formulario queda en solo lectura.
 */
export const PERMISO_CLIENTE_EDITAR_POST_SAP = "cliente.editar-post-sap";
