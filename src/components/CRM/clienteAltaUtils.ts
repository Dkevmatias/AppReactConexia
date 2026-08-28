export type TipoPersonaCliente = "FISICA" | "MORAL";
export type TipoDireccionCliente = "FISCAL" | "ENTREGA";

export type DireccionClienteForm = {
  idLocal: string;
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
};

export type ClienteAltaForm = {
  tipoPersona: TipoPersonaCliente | "";
  usoCfdi: string;
  nombreNegocio: string;
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
  { value: "D01", label: "D01 — Honorarios médicos, dentales y gastos hospitalarios" },
  { value: "P01", label: "P01 — Por definir" },
  { value: "S01", label: "S01 — Sin efectos fiscales" },
];

function nuevoIdLocal(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function direccionVacia(
  tipo: TipoDireccionCliente = "FISCAL",
): DireccionClienteForm {
  return {
    idLocal: nuevoIdLocal(),
    tipo,
    nombre: "",
    calle: "",
    numero: "",
    colonia: "",
    ciudad: "",
    estado: "",
    pais: "México",
    cp: "",
    iva: "",
    coloniaSat: "",
    localidadSat: "",
    municipioSat: "",
    estadoSat: "",
    paisSat: "MEX",
    cpSat: "",
  };
}

export function clienteAltaVacio(): ClienteAltaForm {
  return {
    tipoPersona: "",
    usoCfdi: "",
    nombreNegocio: "",
    direcciones: [],
  };
}

/** Clona una dirección fiscal como nueva dirección de entrega. */
export function clonarDireccionComoEntrega(
  origen: DireccionClienteForm,
): DireccionClienteForm {
  return {
    ...origen,
    idLocal: nuevoIdLocal(),
    tipo: "ENTREGA",
    nombre: origen.nombre
      ? `${origen.nombre} (Entrega)`.replace(/ \(Entrega\)( \(Entrega\))+/, " (Entrega)")
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
