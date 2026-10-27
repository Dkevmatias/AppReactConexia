import {
  ID_EMPRESA_CODIAL,
  ID_EMPRESA_CODIALUB,
  idEmpresaDescuentoDesdeDoc,
} from "./prospectoFormUtils";

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

export type DescuentoClienteForm = {
  idLocal: string;
  idClienteDescuento?: number | null;
  idDescuentoDetalle?: number | null;
  idCliente: number | null;
  idSucursal: number | null;
  IdLeadOrigen: number | null;
  IdUsuarioCreacion: number | null;
  IdUsuarioActualizacion: number | null;
  AbsEntry: number | null;
  Type: string;
  ObjType: string;
  /** FirmCode de la marca (SAP). */
  ObjCode: string;
  idMarca: number | null;
  firmName: string;
  /** Tope máximo de % permitido por marca (API discountLimit). */
  discountLimit: number;
  /** Porcentaje capturado en UI (permite decimales, ej. "15.5"). */
  porcentaje: string;
  /** Entero a persistir (redondeado desde porcentaje). */
  DiscRel: string;
  ValidFor: string;
  ValidForm: string | null;
  ValidTo: string | null;
  DataSource: string;
  UserSign: number | null;
  LogInstanc: number | null;
  UserSign2: number | null;
  EstatusSync: string;
  FechaSync: string;
  ErrorSync: string;
  FechaCreacion: string | null;
  FechaActualizacion: string | null;
  /** Codialub = 1, Codial = 2. Independiente de la empresa del cliente. */
  idEmpresa?: number | null;
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
  descuentos: DescuentoClienteForm[];
};

/** Se crearon Catalogo*/
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
/** Addenda especial fija (no editable en UI). */
export const ADDENDA_ESP_FIJA = "Cap_31";

export const NOMBRE_DIR_FISCAL = "Direccion Fiscal";
export const NOMBRE_DIR_ENTREGA = "Direccion de Entrega";

export const CODIGOS_IVA_DIRECCION = [
  { value: "IVAT16", label: "IVAT16" },
  { value: "IVAT0", label: "IVAT0" },
  { value: "IVAT8", label: "IVAT8" },
] as const;

export const IVA_DIRECCION_CODIAL = "IVAT16";

export function ivaFijoEnEmpresa(
  idEmpresa: number | null | undefined,
): boolean {
  return idEmpresa === ID_EMPRESA_CODIAL;
}

export function ivaDireccionParaEmpresa(
  iva: string,
  idEmpresa: number | null | undefined,
): string {
  return ivaFijoEnEmpresa(idEmpresa) ? IVA_DIRECCION_CODIAL : iva;
}

export function opcionesIvaDireccion(
  idEmpresa: number | null | undefined,
): ReadonlyArray<{ value: string; label: string }> {
  if (ivaFijoEnEmpresa(idEmpresa)) {
    return CODIGOS_IVA_DIRECCION.filter(
      (o) => o.value === IVA_DIRECCION_CODIAL,
    );
  }
  return CODIGOS_IVA_DIRECCION;
}

export function nombreDireccionPorTipo(tipo: TipoDireccionCliente): string {
  return tipo === "FISCAL" ? NOMBRE_DIR_FISCAL : NOMBRE_DIR_ENTREGA;
}

function esNombreDireccionGenerico(nombre: string): boolean {
  const n = nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return (
    !n ||
    n === "fiscal" ||
    n === "entrega" ||
    n === "direccion fiscal" ||
    n === "direccion de entrega" ||
    n === "fiscal (entrega)"
  );
}

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
    nombre: nombreDireccionPorTipo(tipo),
    calle: "",
    numero: "",
    colonia: "",
    ciudad: "",
    estado: "",
    pais: "MX",
    cp: "",
    iva: "IVAT16",
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
    enviarCorreo: "Y",
  };
}

/** Solo dígitos y un separador decimal (. o ,). Sin letras. */
export function sanitizarPorcentajeDescuento(valor: string): string {
  let s = (valor ?? "").replace(/[^\d.,]/g, "");
  const sepIdx = s.search(/[.,]/);
  if (sepIdx >= 0) {
    const sep = s[sepIdx];
    s = s.slice(0, sepIdx + 1) + s.slice(sepIdx + 1).replace(/[.,]/g, "");
    // Un solo separador
    if (sep === ",") {
      /* keep comma while typing; DiscRel normaliza a . */
    }
  }
  return s;
}

/**
 * Convierte % UI a entero DiscRel, respetando tope de marca.
 * Ej. 15.5 → "16"; si límite 10 y capturan 12 → "10".
 */
export function porcentajeADiscRelEntero(
  porcentaje: string,
  discountLimit?: number | null,
): string {
  const n = Number((porcentaje ?? "").trim().replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return "";
  let valor = Math.max(0, n);
  const limite =
    discountLimit != null && Number.isFinite(discountLimit)
      ? Number(discountLimit)
      : null;
  if (limite != null && limite >= 0) {
    valor = Math.min(valor, limite);
  } else {
    valor = Math.min(valor, 100);
  }
  return String(Math.round(valor));
}

/** Si el número capturado supera el límite, lo recorta al máximo permitido. */
export function aplicarLimitePorcentaje(
  porcentaje: string,
  discountLimit: number | null | undefined,
): { valor: string; excedio: boolean } {
  const limpio = sanitizarPorcentajeDescuento(porcentaje);
  if (!limpio) return { valor: "", excedio: false };
  const n = Number(limpio.replace(",", "."));
  if (!Number.isFinite(n)) return { valor: limpio, excedio: false };
  const limite =
    discountLimit != null && Number.isFinite(discountLimit)
      ? Number(discountLimit)
      : null;
  if (limite == null || limite < 0) return { valor: limpio, excedio: false };
  if (n > limite) {
    // Mantener formato simple del límite
    const entero = Number.isInteger(limite) ? String(limite) : String(limite);
    return { valor: entero, excedio: true };
  }
  return { valor: limpio, excedio: false };
}

export function descuentoVacio(opts?: {
  idMarca?: number | null;
  firmCode?: number | null;
  firmName?: string;
  discountLimit?: number | null;
  porcentaje?: string;
  idEmpresa?: number | null;
}): DescuentoClienteForm {
  const discountLimit = opts?.discountLimit ?? 0;
  const porcentaje = opts?.porcentaje ?? "";
  const firmCode = opts?.firmCode ?? null;
  return {
    idLocal: nuevoIdLocal(),
    idClienteDescuento: null,
    idDescuentoDetalle: null,
    idCliente: null,
    idSucursal: null,
    IdLeadOrigen: null,
    IdUsuarioCreacion: null,
    IdUsuarioActualizacion: null,
    AbsEntry: null,
    Type: "A",
    ObjType: "4",
    ObjCode: firmCode != null && firmCode > 0 ? String(firmCode) : "",
    idMarca: opts?.idMarca ?? null,
    firmName: (opts?.firmName ?? "").trim(),
    discountLimit,
    porcentaje,
    DiscRel: porcentajeADiscRelEntero(porcentaje, discountLimit),
    ValidFor: "Y",
    ValidForm: null,
    ValidTo: null,
    DataSource: "O",
    UserSign: null,
    LogInstanc: null,
    UserSign2: null,
    EstatusSync: "",
    FechaSync: "",
    ErrorSync: "",
    FechaCreacion: null,
    FechaActualizacion: null,
    idEmpresa: opts?.idEmpresa ?? null,
  };
}

/** Codialub=1 / Codial=2. Filas sin idEmpresa se tratan como Codialub. */
export function esDescuentoDeEmpresa(
  idEmpresaFila: number | null | undefined,
  idEmpresaCheck: number | null | undefined,
): boolean {
  if (idEmpresaCheck == null || idEmpresaCheck <= 0) return true;
  const check = Number(idEmpresaCheck);
  const fila = Number(idEmpresaFila);
  if (Number.isFinite(fila) && fila > 0) return fila === check;
  return check === ID_EMPRESA_CODIALUB;
}

/**
 * Asegura un renglón de descuento por cada marca del catálogo,
 * conservando valores ya capturados.
 */
export function sincronizarDescuentosConMarcas(
  actuales: DescuentoClienteForm[],
  marcas: Array<{
    idMarca: number;
    firmCode: number;
    firmName: string;
    discountLimit?: number;
  }>,
  idEmpresa?: number | null,
): DescuentoClienteForm[] {
  const deEmpresa =
    idEmpresa != null && idEmpresa > 0
      ? actuales.filter((d) => esDescuentoDeEmpresa(d.idEmpresa, idEmpresa))
      : actuales;
  const header =
    deEmpresa.find((d) => (d.idClienteDescuento ?? 0) > 0) ?? deEmpresa[0];
  return marcas.map((marca) => {
    const firmCodeStr = String(marca.firmCode);
    const discountLimit = marca.discountLimit ?? 0;
    const prev =
      deEmpresa.find(
        (d) =>
          (d.ObjCode && claveObjMarca(d.ObjCode) === firmCodeStr) ||
          (d.idMarca != null && d.idMarca === marca.idMarca),
      ) ?? null;
    if (prev) {
      const { valor } = aplicarLimitePorcentaje(
        prev.porcentaje || prev.DiscRel,
        discountLimit,
      );
      return {
        ...prev,
        idMarca: marca.idMarca,
        firmName: marca.firmName,
        ObjCode: firmCodeStr,
        discountLimit,
        porcentaje: valor,
        DiscRel: porcentajeADiscRelEntero(valor, discountLimit),
        idClienteDescuento:
          prev.idClienteDescuento ?? header?.idClienteDescuento ?? null,
        AbsEntry: prev.AbsEntry ?? header?.AbsEntry ?? null,
        EstatusSync: prev.EstatusSync || header?.EstatusSync || "",
        ErrorSync: prev.ErrorSync || header?.ErrorSync || "",
        idEmpresa: idEmpresa ?? prev.idEmpresa ?? null,
      };
    }
    const vacio = descuentoVacio({
      idMarca: marca.idMarca,
      firmCode: marca.firmCode,
      firmName: marca.firmName,
      discountLimit,
      idEmpresa,
    });
    return {
      ...vacio,
      idClienteDescuento: header?.idClienteDescuento ?? null,
      AbsEntry: header?.AbsEntry ?? null,
      EstatusSync: header?.EstatusSync ?? "",
      ErrorSync: header?.ErrorSync ?? "",
      FechaSync: header?.FechaSync ?? "",
      idEmpresa: idEmpresa ?? null,
    };
  });
}

/** Documento local: 1 cabecera (cliente) + N líneas (marca con % > 0). */
export type ClienteDescuentoWritePayload = {
  idCliente: number;
  idEmpresa?: number | null;
  /** PascalCase para el bind de ASP.NET si el DTO no acepta camelCase. */
  IdEmpresa?: number | null;
  idSucursal: number;
  idLeadOrigen: number;
  idUsuarioCreacion?: number | null;
  type: string;
  objType: string;
  objCode: string;
  discRel: string;
  validFor: string;
  validFrom?: string | null;
  validTo?: string | null;
  detalles: {
    idDescuentoDetalle?: number | null;
    idEmpresa: number;
    IdEmpresa: number;
    objType: string;
    objKey: string;
    discType: string;
    discount: number;
    payFor: number;
    forFree: number;
    upTo: number;
  }[];
};

export type ClienteDescuentoApi = {
  idDescuento: number;
  idCliente: number;
  idEmpresa?: number | null;
  cardCode: string | null;
  absEntry: number;
  type: string | null;
  objType: string | null;
  objCode: string | null;
  discRel: string | null;
  validFor: string | null;
  estatusSync: string | null;
  fechaSync: string | null;
  errorSync: string | null;
  detalles: {
    idDescuentoDetalle: number;
    idEmpresa?: number | null;
    objType: string | null;
    objKey: string | null;
    discType: string | null;
    discount: number;
    payFor: number;
    forFree: number;
    upTo: number;
  }[];
};

export type MarcaEmpresaRef = {
  firmCode: number;
  idEmpresa: number;
};

/**
 * Arma el payload CRM (no SAP). Cabecera = cliente; detalle = marca.
 * El JSON de Service Layer se mapeará después con el payload que envíes.
 */
export function armarPayloadDescuentoLocal(
  filas: DescuentoClienteForm[],
  opts: {
    idCliente: number;
    idEmpresa?: number | null;
    idSucursal?: number | null;
    idLeadOrigen?: number | null;
    idUsuario?: number | null;
  },
): ClienteDescuentoWritePayload {
  const idEmpresaCheck =
    opts.idEmpresa != null && opts.idEmpresa > 0 ? opts.idEmpresa : null;
  /** Líneas de la sociedad del check (Codialub=1, Codial=2). */
  const deEmpresa = idEmpresaCheck
    ? filas.filter((d) => esDescuentoDeEmpresa(d.idEmpresa, idEmpresaCheck))
    : filas;
  const header =
    deEmpresa.find((d) => (d.idClienteDescuento ?? 0) > 0) ??
    filas.find((d) => (d.idClienteDescuento ?? 0) > 0) ??
    deEmpresa[0];
  const detalles = deEmpresa
    .map((fila) => {
      const discount = Number(
        porcentajeADiscRelEntero(fila.porcentaje, fila.discountLimit) || 0,
      );
      const objKey = claveObjMarca(fila.ObjCode);
      if (!objKey || !Number.isFinite(discount) || discount <= 0) return null;
      if (!idEmpresaCheck) return null;
      return {
        idDescuentoDetalle:
          fila.idDescuentoDetalle && fila.idDescuentoDetalle > 0
            ? fila.idDescuentoDetalle
            : null,
        idEmpresa: idEmpresaCheck,
        IdEmpresa: idEmpresaCheck,
        objType: String(fila.ObjType || "4"),
        objKey,
        discType: "D",
        discount,
        payFor: 0,
        forFree: 0,
        upTo: 0,
      };
    })
    .filter((d): d is NonNullable<typeof d> => d != null);

  return {
    idCliente: opts.idCliente,
    idEmpresa: idEmpresaCheck,
    IdEmpresa: idEmpresaCheck,
    idSucursal: opts.idSucursal ?? header?.idSucursal ?? 0,
    idLeadOrigen: opts.idLeadOrigen ?? header?.IdLeadOrigen ?? 0,
    idUsuarioCreacion: opts.idUsuario ?? header?.IdUsuarioCreacion ?? null,
    type: "C",
    objType: "4",
    objCode: "",
    discRel: "A",
    validFor: header?.ValidFor || "Y",
    validFrom: header?.ValidForm,
    validTo: header?.ValidTo,
    detalles,
  };
}

const CLAVES_DETALLES_DESCUENTO = [
  "detalles",
  "Detalles",
  "detalle",
  "Detalle",
  "clienteDescuentoDetalles",
  "ClienteDescuentoDetalles",
  "clienteDescuentoDetalle",
  "ClienteDescuentoDetalle",
  "descuentoDetalles",
  "DescuentoDetalles",
] as const;

function rawDetallesDescuento(o: Record<string, unknown>): unknown {
  return pickRaw(o, ...CLAVES_DETALLES_DESCUENTO);
}

function detalleDescuentoDesdeRaw(item: unknown): ClienteDescuentoApi["detalles"][number] {
  const d = asRecord(item);
  const objKey = pickStr(
    d,
    "objKey",
    "ObjKey",
    "objCode",
    "ObjCode",
    "firmCode",
    "FirmCode",
  );
  const discount =
    pickNum(d, "discount", "Discount", "porcentaje", "Porcentaje") ??
    pickNum(d, "discRel", "DiscRel") ??
    0;
  return {
    idDescuentoDetalle:
      pickNum(d, "idDescuentoDetalle", "IdDescuentoDetalle") ?? 0,
    idEmpresa: pickNum(d, "idEmpresa", "IdEmpresa", "id_empresa"),
    objType: pickStr(d, "objType", "ObjType") || null,
    objKey: objKey || null,
    discType: pickStr(d, "discType", "DiscType") || null,
    discount,
    payFor: pickNum(d, "payFor", "PayFor") ?? 0,
    forFree: pickNum(d, "forFree", "ForFree") ?? 0,
    upTo: pickNum(d, "upTo", "UpTo") ?? 0,
  };
}

function esLineaDetalleDescuento(raw: unknown): boolean {
  const o = asRecord(raw);
  if (Object.keys(o).length === 0) return false;
  if (rawDetallesDescuento(o) != null) return false;
  const objKey = pickStr(
    o,
    "objKey",
    "ObjKey",
    "objCode",
    "ObjCode",
    "firmCode",
    "FirmCode",
  );
  const idDet = pickNum(o, "idDescuentoDetalle", "IdDescuentoDetalle");
  return objKey.length > 0 || (idDet != null && idDet > 0);
}

function agruparLineasDetalleDescuento(lineas: unknown[]): unknown[] {
  const grupos = new Map<
    number,
    { idDescuento: number; idEmpresa: number | null; detalles: unknown[] }
  >();
  for (const item of lineas) {
    const o = asRecord(item);
    const idDescuento =
      pickNum(
        o,
        "idDescuento",
        "IdDescuento",
        "idClienteDescuento",
        "IdClienteDescuento",
      ) ?? 0;
    const prev = grupos.get(idDescuento) ?? {
      idDescuento,
      idEmpresa: pickNum(o, "idEmpresa", "IdEmpresa"),
      detalles: [] as unknown[],
    };
    prev.detalles.push(item);
    if (prev.idEmpresa == null || prev.idEmpresa <= 0) {
      prev.idEmpresa = pickNum(o, "idEmpresa", "IdEmpresa");
    }
    grupos.set(idDescuento, prev);
  }
  return [...grupos.values()].map((g) => ({
    idDescuento: g.idDescuento,
    IdDescuento: g.idDescuento,
    idEmpresa: g.idEmpresa,
    detalles: g.detalles,
  }));
}

/** Arrays, wrappers .NET (`$values`, `data`) o un objeto suelto. */
export function comoListaApi(raw: unknown): unknown[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  const nested =
    o.data ??
    o.Data ??
    o.items ??
    o.Items ??
    o.value ??
    o.Value ??
    o.$values ??
    o.descuentos ??
    o.Descuentos ??
    o.result ??
    o.Result;
  if (Array.isArray(nested)) return nested;
  if (nested && typeof nested === "object") return comoListaApi(nested);
  return [raw];
}

/** GET puede devolver un array, un wrapper .NET o un solo documento. */
export function extraerDocumentosDescuentoApi(raw: unknown): unknown[] {
  const lista = comoListaApi(raw).filter((x) => x != null);
  if (lista.length > 0 && lista.every(esLineaDetalleDescuento)) {
    return agruparLineasDetalleDescuento(lista);
  }
  if (lista.length !== 1) return lista;
  const unico = lista[0];
  if (!unico || typeof unico !== "object") return lista;
  const o = unico as Record<string, unknown>;
  const inner = o.descuentos ?? o.Descuentos;
  if (inner != null && inner !== unico) {
    return extraerDocumentosDescuentoApi(inner);
  }
  if (
    o.idDescuento != null ||
    o.IdDescuento != null ||
    o.idClienteDescuento != null ||
    o.IdClienteDescuento != null ||
    rawDetallesDescuento(o) != null
  ) {
    return [unico];
  }
  return lista;
}

export function descuentoApiDesdeRaw(raw: unknown): ClienteDescuentoApi {
  const o = asRecord(raw);
  let detalles = comoListaApi(rawDetallesDescuento(o)).map(
    detalleDescuentoDesdeRaw,
  );
  if (detalles.length === 0 && esLineaDetalleDescuento(o)) {
    detalles = [detalleDescuentoDesdeRaw(o)];
  }
  const cardCode = pickStr(o, "cardCode", "CardCode") || null;
  const idEmpresaCampo = pickNum(o, "idEmpresa", "IdEmpresa", "id_empresa");
  return {
    idDescuento:
      pickNum(
        o,
        "idDescuento",
        "IdDescuento",
        "idClienteDescuento",
        "IdClienteDescuento",
      ) ?? 0,
    idCliente: pickNum(o, "idCliente", "IdCliente") ?? 0,
    idEmpresa: idEmpresaDescuentoDesdeDoc({
      idEmpresa:
        idEmpresaCampo ??
        detalles.find((d) => d.idEmpresa != null && d.idEmpresa > 0)
          ?.idEmpresa,
      cardCode,
    }),
    cardCode,
    absEntry: pickNum(o, "absEntry", "AbsEntry") ?? 0,
    type: pickStr(o, "type", "Type") || null,
    objType: pickStr(o, "objType", "ObjType") || null,
    objCode: pickStr(o, "objCode", "ObjCode") || null,
    discRel: pickStr(o, "discRel", "DiscRel") || null,
    validFor: pickStr(o, "validFor", "ValidFor") || null,
    estatusSync: pickStr(o, "estatusSync", "EstatusSync") || null,
    fechaSync: pickStr(o, "fechaSync", "FechaSync") || null,
    errorSync: pickStr(o, "errorSync", "ErrorSync") || null,
    detalles,
  };
}

export function fusionarDocumentosDescuento(
  docs: ClienteDescuentoApi[],
): ClienteDescuentoApi[] {
  const map = new Map<string, ClienteDescuentoApi>();
  for (const doc of docs) {
    if (!doc || doc.idDescuento <= 0) continue;
    const idEmpresa = idEmpresaDescuentoDesdeDoc(doc);
    const stamped = { ...doc, idEmpresa };
    const key = `${stamped.idDescuento}:${idEmpresa ?? 0}`;
    const prev = map.get(key);
    if (!prev || stamped.detalles.length > prev.detalles.length) {
      map.set(key, stamped);
    }
  }
  for (const key of [...map.keys()]) {
    if (!key.endsWith(":0")) continue;
    const id = key.slice(0, key.lastIndexOf(":"));
    const hayEspecifica = [...map.keys()].some(
      (k) => k.startsWith(`${id}:`) && k !== key,
    );
    if (hayEspecifica) map.delete(key);
  }
  return [...map.values()];
}

export function claveObjMarca(
  code: string | number | null | undefined,
): string {
  const s = String(code ?? "").trim();
  if (!s) return "";
  const n = Number(s.replace(",", "."));
  if (Number.isFinite(n) && n > 0) return String(Math.trunc(n));
  return s;
}

export function idEmpresaDesdeMarcasCatalogo(
  objKey: string | number | null | undefined,
  marcas: MarcaEmpresaRef[] | undefined,
): number | null {
  if (!marcas?.length) return null;
  const clave = claveObjMarca(objKey);
  if (!clave) return null;
  const marca = marcas.find((m) => claveObjMarca(m.firmCode) === clave);
  return marca && marca.idEmpresa > 0 ? marca.idEmpresa : null;
}

/** Parte un documento mixto en uno por sociedad, usando el idEmpresa del detalle o de la marca. */
export function partirDocumentosPorEmpresaDetalle(
  docs: ClienteDescuentoApi[],
  marcas?: MarcaEmpresaRef[],
): ClienteDescuentoApi[] {
  const partidos: ClienteDescuentoApi[] = [];
  for (const doc of docs) {
    if (!doc || doc.idDescuento <= 0) continue;
    const grupos = new Map<number, ClienteDescuentoApi["detalles"]>();
    for (const det of doc.detalles ?? []) {
      const emp =
        (det.idEmpresa != null && det.idEmpresa > 0 ? det.idEmpresa : null) ??
        idEmpresaDescuentoDesdeDoc(doc) ??
        idEmpresaDesdeMarcasCatalogo(det.objKey, marcas) ??
        1;
      const lista = grupos.get(emp) ?? [];
      lista.push({ ...det, idEmpresa: emp });
      grupos.set(emp, lista);
    }
    if (grupos.size === 0) {
      partidos.push({
        ...doc,
        idEmpresa: idEmpresaDescuentoDesdeDoc(doc) ?? doc.idEmpresa,
      });
      continue;
    }
    const headerEmp = idEmpresaDescuentoDesdeDoc(doc);
    for (const [idEmpresa, detalles] of grupos) {
      const esCabecera = headerEmp == null || headerEmp === idEmpresa;
      partidos.push({
        ...doc,
        idEmpresa,
        detalles,
        estatusSync: esCabecera ? doc.estatusSync : "",
        absEntry: esCabecera ? doc.absEntry : 0,
      });
    }
  }
  return fusionarDocumentosDescuento(partidos);
}

export function mergeDocumentosDescuentoAFilas(
  docs: ClienteDescuentoApi[],
  actuales: DescuentoClienteForm[] = [],
  idEmpresaSiFalta?: number | null,
  marcas?: MarcaEmpresaRef[],
): DescuentoClienteForm[] {
  const normalizados = partirDocumentosPorEmpresaDetalle(docs, marcas).map(
    (doc) => {
      const inferida = idEmpresaDescuentoDesdeDoc(doc);
      return {
        ...doc,
        idEmpresa:
          inferida != null && inferida > 0
            ? inferida
            : docs.length === 1 && idEmpresaSiFalta
              ? idEmpresaSiFalta
              : doc.idEmpresa,
      };
    },
  );
  const empresasEnDocs = new Set(
    normalizados
      .map((d) => d.idEmpresa)
      .filter((id): id is number => id != null && id > 0),
  );
  const otras = actuales.filter(
    (d) =>
      d.idEmpresa != null &&
      d.idEmpresa > 0 &&
      !empresasEnDocs.has(d.idEmpresa),
  );
  return normalizados.reduce(
    (acc, doc) =>
      aplicarDescuentoApiAFilas(
        acc,
        doc,
        doc.idEmpresa != null && doc.idEmpresa > 0
          ? doc.idEmpresa
          : idEmpresaSiFalta,
      ),
    otras,
  );
}

export function aplicarDescuentoApiAFilas(
  actuales: DescuentoClienteForm[],
  doc: ClienteDescuentoApi | null,
  idEmpresaFallback?: number | null,
): DescuentoClienteForm[] {
  if (!doc || doc.idDescuento <= 0) return actuales;

  const idEmpresaDoc =
    idEmpresaFallback != null && idEmpresaFallback > 0
      ? idEmpresaFallback
      : doc.idEmpresa != null && doc.idEmpresa > 0
        ? doc.idEmpresa
        : 1;
  const porMarca = new Map(
    (doc.detalles ?? [])
      .map((d) => [claveObjMarca(d.objKey), d] as const)
      .filter(([k]) => k.length > 0),
  );

  const filaDesdeDetalle = (
    d: ClienteDescuentoApi["detalles"][number],
  ): DescuentoClienteForm => {
    const pct = d.discount > 0 ? String(d.discount) : "";
    const idEmpresaFila =
      d.idEmpresa != null && d.idEmpresa > 0 ? d.idEmpresa : idEmpresaDoc;
    return {
      ...descuentoVacio({
        firmCode: Number(claveObjMarca(d.objKey)) || null,
        porcentaje: pct,
        idEmpresa: idEmpresaFila,
      }),
      idClienteDescuento: doc.idDescuento,
      idDescuentoDetalle: d.idDescuentoDetalle,
      idCliente: doc.idCliente,
      AbsEntry: doc.absEntry,
      Type: doc.type || "C",
      ObjType: d.objType || "4",
      ObjCode: claveObjMarca(d.objKey),
      DiscRel: pct,
      ValidFor: doc.validFor || "Y",
      EstatusSync: doc.estatusSync ?? "",
      FechaSync: doc.fechaSync ?? "",
      ErrorSync: doc.errorSync ?? "",
      idEmpresa: idEmpresaFila,
    };
  };

  const perteneceAEmpresa = (d: DescuentoClienteForm) =>
    esDescuentoDeEmpresa(d.idEmpresa, idEmpresaDoc);
  const otras = actuales.filter((d) => !perteneceAEmpresa(d));
  const deEmpresa = actuales.filter(perteneceAEmpresa);
  const base = deEmpresa.length > 0 ? deEmpresa : [];
  if (base.length === 0) {
    return [...otras, ...(doc.detalles ?? []).map(filaDesdeDetalle)];
  }

  const usados = new Set<string>();
  const actualizadas = base.map((fila) => {
    const clave = claveObjMarca(fila.ObjCode);
    const detalle = porMarca.get(clave);
    if (detalle) usados.add(clave);
    const pct =
      detalle && detalle.discount > 0
        ? String(detalle.discount)
        : fila.porcentaje;
    return {
      ...fila,
      idClienteDescuento: doc.idDescuento,
      idDescuentoDetalle:
        detalle?.idDescuentoDetalle ?? fila.idDescuentoDetalle ?? null,
      idCliente: doc.idCliente,
      AbsEntry: doc.absEntry,
      Type: doc.type || fila.Type,
      ObjType: detalle?.objType || fila.ObjType,
      ObjCode: clave || fila.ObjCode,
      porcentaje: pct,
      DiscRel: porcentajeADiscRelEntero(pct, fila.discountLimit),
      ValidFor: doc.validFor || fila.ValidFor,
      EstatusSync: doc.estatusSync ?? "",
      FechaSync: doc.fechaSync ?? "",
      ErrorSync: doc.errorSync ?? "",
      idEmpresa:
        detalle?.idEmpresa != null && detalle.idEmpresa > 0
          ? detalle.idEmpresa
          : idEmpresaDoc,
    };
  });
  const extras = [...porMarca.entries()]
    .filter(([k]) => !usados.has(k))
    .map(([, d]) => filaDesdeDetalle(d));
  return [...otras, ...actualizadas, ...extras];
}

/** % de descuento como decimal para SAP (ej. 38 → 38.0). */
function porcentajeADiscountDecimal(
  porcentaje: string,
  discountLimit?: number | null,
): number {
  const n = Number((porcentaje ?? "").trim().replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 0;
  let valor = Math.max(0, n);
  const limite =
    discountLimit != null && Number.isFinite(discountLimit)
      ? Number(discountLimit)
      : null;
  if (limite != null && limite >= 0) {
    valor = Math.min(valor, limite);
  } else {
    valor = Math.min(valor, 100);
  }
  return Math.round(valor * 10) / 10;
}

/**
 * Payload Service Layer EnhancedDiscountGroups (espejo de MapearPayload en API).
 * Solo para preview/validación antes de enviar; el API arma el mismo shape al POST/PATCH.
 */
export function armarPayloadSapDiscountGroup(opts: {
  cardCode: string;
  filas: DescuentoClienteForm[];
}): {
  Type: string;
  ObjectCode: string;
  DiscountRelations: string | null;
  Active: string;
  ValidTo?: string | null;
  DiscountGroupLineCollection: Array<{
    ObjectType: string;
    ObjectCode: string;
    Discount: number;
    DiscountType: string;
  }>;
} {
  const cardCode = (opts.cardCode || "").trim();
  const header =
    opts.filas.find((d) => (d.idClienteDescuento ?? 0) > 0) ?? opts.filas[0];
  const validFor = (header?.ValidFor || "Y").trim().toUpperCase();
  const active =
    validFor === "N" || validFor === "NO" || validFor === "0" ? "tNO" : "tYES";

  const lineas = opts.filas
    .map((fila) => {
      const objectCode = claveObjMarca(fila.ObjCode);
      const discount = porcentajeADiscountDecimal(
        fila.porcentaje || fila.DiscRel,
        fila.discountLimit,
      );
      const firm = Number(objectCode);
      if (!objectCode || !Number.isFinite(firm) || firm <= 0 || discount <= 0) {
        return null;
      }
      return {
        ObjectType: "dgboManufacturer",
        ObjectCode: objectCode,
        Discount: discount,
        DiscountType: "dt_Percentage",
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  return {
    Type: "dgt_SpecificBP",
    ObjectCode: cardCode,
    DiscountRelations: "dgrDiscountTotals",
    Active: active,
    ...(header?.ValidTo ? { ValidTo: header.ValidTo } : {}),
    DiscountGroupLineCollection: lineas,
  };
}

/** Serializa el payload SAP con Discount siempre a 1 decimal (38 → 38.0). */
export function stringifyPayloadSapDiscountGroup(
  payload: ReturnType<typeof armarPayloadSapDiscountGroup>,
): string {
  const raw = JSON.stringify(
    {
      ...payload,
      DiscountGroupLineCollection: payload.DiscountGroupLineCollection.map(
        (linea) => ({
          ...linea,
          Discount: `__SAP_DISC_${Number(linea.Discount).toFixed(1)}__`,
        }),
      ),
    },
    null,
    2,
  );
  return raw.replace(/"__SAP_DISC_(-?\d+\.\d)__"/g, "$1");
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
    addendaEsp: ADDENDA_ESP_FIJA,
    usaMapEsp: "N",
    envioAutCe: "N",
    ieps: "N",
    comEdu: "N",
    agrParMos: "N",
    metodosPago: [],
    camposExtra: {},
    contactos: [],
    direcciones: [],
    descuentos: [],
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

function pickNum(o: Record<string, unknown>, ...keys: string[]): number | null {
  const v = pickRaw(o, ...keys);
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v.replace(",", "."));
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function enviarCorreoDesdeApi(valor: string): EnviarCorreoContacto {
  const v = valor.trim().toUpperCase();
  if (v === "N" || v === "NO" || v === "FALSE" || v === "TNO") return "N";
  return "Y";
}

function formaPagoCfdiDesdeApi(
  cliente: Record<string, unknown>,
  fiscal: Record<string, unknown>,
): string {
  const directo = pickStr(
    fiscal,
    "formaPagoCfdi",
    "FormaPagoCfdi",
    "u_Forma",
    "U_Forma",
    "formaPago",
    "FormaPago",
  );
  const enCliente = pickStr(
    cliente,
    "u_Forma",
    "U_Forma",
    "formaPagoCfdi",
    "FormaPagoCfdi",
  );
  const metodos = asArray(
    pickRaw(cliente, "metodosPago", "MetodosPago"),
  )
    .map((m) =>
      pickStr(asRecord(m), "codigoMetodoPago", "CodigoMetodoPago", "codigo"),
    )
    .filter(Boolean);
  const raw = directo || enCliente || metodos[0] || "";
  return codigoFormaPagoSap(raw) ?? raw;
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
    generoRaw.startsWith("F") || generoRaw === "GT_FEMALE"
      ? "F"
      : generoRaw.startsWith("M") || generoRaw === "GT_MALE"
        ? "M"
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
    enviarCorreo: enviarCorreoDesdeApi(
      pickStr(c, "enviarCorreo", "EnviarCorreo", "sendEmail", "SendEmail"),
    ),
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
    formaPagoCfdi: formaPagoCfdiDesdeApi(o, fiscal),
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
    uTipoCliente: "",
    uDiaVisita: pickStr(o, "u_DiaVisita", "U_DiaVisita"),
    addenda: pickStr(fiscal, "addenda", "Addenda"),
    addendaEsp: ADDENDA_ESP_FIJA,
    usaMapEsp: pickStr(fiscal, "usaMapEsp", "UsaMapEsp") || "N",
    envioAutCe: pickStr(fiscal, "envioAutCe", "EnvioAutCe") || "N",
    ieps: pickStr(fiscal, "ieps", "Ieps") || "N",
    comEdu: pickStr(fiscal, "comEdu", "ComEdu") || "N",
    agrParMos: pickStr(fiscal, "agrParMos", "AgrParMos") || "N",
    metodosPago: asArray(pickRaw(o, "metodosPago", "MetodosPago"))
      .map((m) => pickStr(asRecord(m), "codigoMetodoPago", "CodigoMetodoPago"))
      .filter(Boolean),
    camposExtra,
    contactos: asArray(pickRaw(o, "contactos", "Contactos")).map(
      contactoFormDesdeApi,
    ),
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
    nombre: NOMBRE_DIR_ENTREGA,
  };
}

export function etiquetaTipoDireccion(tipo: TipoDireccionCliente): string {
  return tipo === "FISCAL" ? "Direccion Fiscal" : "Direccion de Entrega";
}

export function etiquetaTipoPersona(tipo: TipoPersonaCliente | ""): string {
  if (tipo === "FISICA") return "Física";
  if (tipo === "MORAL") return "Moral";
  return "—";
}

export function companyPrivateDesdeTipo(tipo: TipoPersonaCliente | ""): string {
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
export function codigoEstadoSap(
  valor: string | null | undefined,
): string | null {
  const raw = (valor ?? "").trim();
  if (!raw) return null;
  const match = estadoMexicoPorValor(raw);
  if (match) return match.sap;
  return raw.slice(0, 10);
}

export function codigoEstadoSat(
  valor: string | null | undefined,
): string | null {
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

export type ResultadoValidacionClienteAlta = {
  mensaje: string | null;
  /** Claves de campo para resaltar en UI (ej. "rfc", "dir:abc:calle"). */
  campos: string[];
};

const ETIQUETAS_CAMPO_CLIENTE: Record<string, string> = {
  tipoPersona: "Tipo de persona",
  usoCfdi: "Uso de CFDI",
  cardName: "Nombre",
  rfc: "RFC",
  phone1: "Teléfono 1",
  metodoPagoCfdi: "Método de pago CFDI",
  formaPagoCfdi: "Forma de pago CFDI",
  regimenFiscal: "Régimen fiscal",
  uBxpRuta: "Ruta",
  uBxpDpp: "Descuento por Pronto Pago",
  uDiaVisita: "Día de visita",
  salesPersonCode: "Vendedor SAP",
  direcciones: "Direcciones",
  direccionEntrega: "Dirección de entrega",
};

const CAMPOS_DIRECCION_OBLIGATORIOS: Array<{
  key: keyof DireccionClienteForm;
  etiqueta: string;
}> = [
  { key: "nombre", etiqueta: "Dirección" },
  { key: "calle", etiqueta: "Calle" },
  { key: "numero", etiqueta: "Número" },
  { key: "cp", etiqueta: "Código postal" },
  { key: "coloniaSat", etiqueta: "Colonia" },
  { key: "ciudad", etiqueta: "Ciudad" },
  { key: "estadoSat", etiqueta: "Estado" },
  { key: "pais", etiqueta: "País" },
  { key: "iva", etiqueta: "IVA" },
  { key: "paisSat", etiqueta: "País SAT" },
  { key: "municipioSat", etiqueta: "Municipio SAT" },
  { key: "localidadSat", etiqueta: "Localidad SAT" },
];

function vacio(v: string | null | undefined): boolean {
  return !(v ?? "").trim();
}

export function claveCampoDireccion(idLocal: string, campo: string): string {
  return `dir:${idLocal}:${campo}`;
}

/** Campos faltantes según reglas de alta de cliente. */
export function camposFaltantesClienteAlta(form: ClienteAltaForm): string[] {
  const faltantes: string[] = [];

  if (vacio(form.tipoPersona)) faltantes.push("tipoPersona");
  if (vacio(form.usoCfdi)) faltantes.push("usoCfdi");
  if (vacio(form.cardName)) faltantes.push("cardName");
  if (vacio(form.rfc)) faltantes.push("rfc");
  if (vacio(form.phone1)) faltantes.push("phone1");
  if (vacio(form.metodoPagoCfdi)) faltantes.push("metodoPagoCfdi");
  if (vacio(form.formaPagoCfdi)) faltantes.push("formaPagoCfdi");

  if (vacio(form.regimenFiscal)) faltantes.push("regimenFiscal");
  if (vacio(form.uBxpRuta)) faltantes.push("uBxpRuta");
  if (vacio(form.uBxpDpp)) faltantes.push("uBxpDpp");
  if (vacio(form.uDiaVisita)) faltantes.push("uDiaVisita");
  if (vacio(form.salesPersonCode)) faltantes.push("salesPersonCode");

  const hayEntrega = form.direcciones.some((d) => d.tipo === "ENTREGA");
  if (!hayEntrega) {
    faltantes.push("direccionEntrega");
  }

  if (form.direcciones.length === 0) {
    faltantes.push("direcciones");
  } else {
    for (const d of form.direcciones) {
      for (const { key } of CAMPOS_DIRECCION_OBLIGATORIOS) {
        const valor =
          key === "coloniaSat"
            ? d.coloniaSat || d.colonia
            : key === "estadoSat"
              ? d.estadoSat || d.estado
              : key === "cp"
                ? d.cp || d.cpSat
                : String(d[key] ?? "");
        if (vacio(valor)) {
          faltantes.push(claveCampoDireccion(d.idLocal, key));
        }
      }
      // CP SAT alineado con CP
      if (vacio(d.cpSat) && !vacio(d.cp)) {
        /* cpSat se sincroniza con cp; si cp está, ok */
      } else if (vacio(d.cpSat) && vacio(d.cp)) {
        /* ya marcado via cp */
      }
    }
  }

  return faltantes;
}

export function validarClienteAlta(
  form: ClienteAltaForm,
): ResultadoValidacionClienteAlta {
  if (form.cardName.trim().length > 100) {
    return {
      mensaje: "El nombre no puede exceder 100 caracteres.",
      campos: ["cardName"],
    };
  }

  const campos = camposFaltantesClienteAlta(form);
  if (campos.length === 0) {
    return { mensaje: null, campos: [] };
  }

  if (campos.includes("direccionEntrega")) {
    const otros = campos.filter(
      (c) => c !== "direccionEntrega" && c !== "direcciones",
    );
    if (otros.length === 0) {
      return {
        mensaje:
          "Capture una dirección de entrega antes de guardar el cliente.",
        campos,
      };
    }
  }

  const etiquetas = campos
    .map((c) => {
      if (c.startsWith("dir:")) {
        const partes = c.split(":");
        const campo = partes[2] ?? "";
        const meta = CAMPOS_DIRECCION_OBLIGATORIOS.find((x) => x.key === campo);
        return meta ? `Dirección · ${meta.etiqueta}` : "Dirección";
      }
      return ETIQUETAS_CAMPO_CLIENTE[c] ?? c;
    })
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 6);

  const extra = campos.length > 6 ? ` y ${campos.length - 6} más` : "";
  return {
    mensaje: `Complete los campos obligatorios: ${etiquetas.join(", ")}${extra}.`,
    campos,
  };
}

/** Compatibilidad: mensaje único o null. */
export function mensajeValidacionClienteAlta(
  form: ClienteAltaForm,
): string | null {
  return validarClienteAlta(form).mensaje;
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
  enviarCorreo?: EnviarCorreoContacto | null;
  sendEmail?: EnviarCorreoContacto | null;
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
    u_TipoCliente: null,
    u_DiaVisita: trimOrNull(form.uDiaVisita),
    estatusSap: "Borrador",
    datosFiscales: {
      regimenFiscal: trimOrNull(form.regimenFiscal),
      metodoPagoCfdi: trimOrNull(form.metodoPagoCfdi),
      formaPagoCfdi: codigoFormaPagoSap(form.formaPagoCfdi),
      usoCfdi: trimOrNull(form.usoCfdi),
      addenda: trimOrNull(form.addenda),
      addendaEsp: ADDENDA_ESP_FIJA,
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
        taxCode: trimOrNull(ivaDireccionParaEmpresa(d.iva, opts.idEmpresa)),
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
    u_TipoCliente: null,
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
    enviarCorreo: c.enviarCorreo || "Y",
    sendEmail: c.enviarCorreo || "Y",
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
    idEmpresa?: number | null;
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
    taxCode: trimOrNull(ivaDireccionParaEmpresa(d.iva, opts.idEmpresa)),
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
  const tipo = tipoDireccionDesdeSap(pickStr(d, "addressType", "AddressType"));
  const idDir = Number(pickRaw(d, "idClienteDireccion", "IdClienteDireccion"));
  return {
    ...direccionVacia(tipo),
    idClienteDireccion: idDir > 0 ? idDir : null,
    tipo,
    nombre: (() => {
      const n = pickStr(d, "addressName", "AddressName");
      return esNombreDireccionGenerico(n) ? nombreDireccionPorTipo(tipo) : n;
    })(),
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
  aMaterno?: string | null;
  telefono?: string | null;
  correo?: string | null;
}): ClienteAltaForm {
  const nombreNegocio = [opts.nombre, opts.aPaterno, opts.aMaterno]
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
  idEmpresa?: number | null;
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
        TaxCode: trimOrNull(ivaDireccionParaEmpresa(d.iva, opts.idEmpresa)),
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
        SendEmail: c.enviarCorreo === "N" ? "tNO" : "tYES",
      })),
    BPPaymentMethods: metodosSap.map((PaymentMethodCode) => ({
      PaymentMethodCode,
    })),
    U_B1SYS_MainUsage: trimOrNull(form.usoCfdi),
    U_COK1_01ADDENDA: trimOrNull(form.addenda),
    U_COK1_01ADDENDAESP: ADDENDA_ESP_FIJA,
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
    U_TipoCliente: null,
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
