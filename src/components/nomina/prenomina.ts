/* NOMCONEXIA-UNIFY */
import { NominaDetalle } from "../../services/nominaService";

const UMA_2026 = 118.4;
const UMA_2025 = 113.14;

export function round2(n: number) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

export function money(n: number) {
  return (Number(n) || 0).toLocaleString("es-MX", { style: "currency", currency: "MXN" });
}

export function lineTotals(d: NominaDetalle) {
  const perc = round2(
    d.sueldo +
      d.puntualidad +
      d.asistencia +
      d.vacacionesAdicionales +
      d.primaVacacional +
      d.aguinaldo +
      d.otrosIngresos +
      d.diaFestivo +
      d.subIncapacidad +
      d.comisiones +
      d.horasExtra +
      d.primaAntiguedad +
      d.bonos +
      d.percepcionExtra1 +
      d.percepcionExtra2 +
      d.percepcionExtra3
  );
  const ded = round2(
    d.retISR +
      d.retISRArt142 +
      d.retIMSS +
      d.fonacot +
      d.infonavit +
      d.pensionAlim +
      d.otros +
      d.prestamo +
      (d.ahorro || 0) +
      (d.facturas || 0) +
      d.deduccionExtra1 +
      d.deduccionExtra2 +
      d.deduccionExtra3
  );
  return { perc, ded, neto: round2(perc - ded) };
}

export function partirAguinaldo(aguinaldo: number, anio: number) {
  if (aguinaldo <= 0) return { gravado: 0, exento: 0 };
  const uma = anio >= 2026 ? UMA_2026 : UMA_2025;
  const tope = round2(uma * 30);
  const exento = round2(Math.min(aguinaldo, tope));
  return { gravado: round2(aguinaldo - exento), exento };
}

export function partirPrimaVacacional(prima: number, anio: number) {
  if (prima <= 0) return { gravado: 0, exento: 0 };
  const uma = anio >= 2026 ? UMA_2026 : UMA_2025;
  const tope = round2(uma * 15);
  const exento = round2(Math.min(prima, tope));
  return { gravado: round2(prima - exento), exento };
}

export type ConceptoPrenomina = {
  tipo: "P" | "D";
  claveSat: string;
  clave: string;
  descripcion: string;
  gravado: number;
  exento: number;
  importe: number;
};

export function buildConceptosPrenomina(d: NominaDetalle, anioPago: number, tipoNomina?: string): ConceptoPrenomina[] {
  const items: ConceptoPrenomina[] = [];
  const esPtu = (tipoNomina || "").toUpperCase().includes("PTU");
  const addP = (claveSat: string, clave: string, descripcion: string, gravado: number, exento = 0) => {
    const g = round2(gravado);
    const e = round2(exento);
    if (g <= 0 && e <= 0) return;
    items.push({ tipo: "P", claveSat, clave, descripcion, gravado: g, exento: e, importe: round2(g + e) });
  };
  const addD = (claveSat: string, clave: string, descripcion: string, importe: number) => {
    const n = round2(importe);
    if (n <= 0) return;
    items.push({ tipo: "D", claveSat, clave, descripcion, gravado: 0, exento: 0, importe: n });
  };

  addP("001", "001", "Sueldos, salarios, rayas y jornales", d.sueldo);
  addP("010", "010", "Premio por puntualidad", d.puntualidad);
  addP("038", "038", "Premio por asistencia / otros ingresos", d.asistencia);
  addP("001", "VAC", "Vacaciones", d.vacacionesAdicionales);
  const agui = partirAguinaldo(d.aguinaldo, anioPago);
  addP("002", "002", "Aguinaldo", agui.gravado, agui.exento);
  const prima = partirPrimaVacacional(d.primaVacacional, anioPago);
  addP("021", "021", "Prima vacacional", prima.gravado, prima.exento);
  addP("019", "019", "Horas extra", d.horasExtra);
  addP("028", "028", "Comisiones", d.comisiones);
  addP("001", "FEST", "Día festivo", d.diaFestivo);
  addP("038", "BONO", "Bonos", d.bonos);
  addP("025", "025", "Prima de antigüedad", d.primaAntiguedad);
  addP("022", "022", "Indemnización por despido", d.percepcionExtra1);
  addP("014", "014", "Subsidio por incapacidad", d.subIncapacidad);
  if (esPtu) {
    const ptu = partirPrimaVacacional(d.otrosIngresos, anioPago);
    addP("003", "003", "PTU / participación de los trabajadores en las utilidades", ptu.gravado, ptu.exento);
  } else {
    addP("038", "OTR", "Otros ingresos", d.otrosIngresos + d.percepcionExtra2 + d.percepcionExtra3);
  }

  addD("002", "002", "ISR", round2((d.retISR || 0) + (d.retISRArt142 || 0)));
  addD("001", "001", "Seguridad social (IMSS obrero)", d.retIMSSObrera > 0 ? d.retIMSSObrera : d.retIMSS);
  addD("010", "010", "INFONAVIT", d.infonavit);
  addD("011", "011", "FONACOT", d.fonacot);
  addD("007", "007", "Pensión alimenticia", d.pensionAlim);
  addD("004", "004", "Otros préstamos", d.prestamo);
  addD("004", "AHO", "Ahorro / deudores diversos", d.ahorro || 0);
  addD("004", "FAC", "Facturas / deudores diversos", d.facturas || 0);
  addD("004", "OTR", "Otras deducciones", d.otros + d.deduccionExtra1 + d.deduccionExtra2 + d.deduccionExtra3);

  return items;
}

export type AlertaPrenomina = { nivel: "error" | "aviso"; texto: string };

export function validarEstructuraPrenomina(opts: {
  detalle: NominaDetalle;
  rfcEmpresa?: string | null;
  registroPatronal?: string | null;
  codigoPostal?: string | null;
  rfcEmpleado?: string | null;
  curp?: string | null;
  nss?: string | number | null;
}): AlertaPrenomina[] {
  const a: AlertaPrenomina[] = [];
  const rfcEmp = (opts.rfcEmpleado || opts.detalle.rfc || "").trim().toUpperCase();
  if (!rfcEmp || rfcEmp.length < 12) a.push({ nivel: "error", texto: "Falta RFC del empleado (12 o 13 caracteres)." });
  if (!opts.curp) a.push({ nivel: "aviso", texto: "Falta CURP; el CFDI de nómina lo requiere." });
  if (opts.nss == null || String(opts.nss).trim() === "") {
    a.push({ nivel: "aviso", texto: "Falta NSS; se usa en el nodo Receptor del complemento." });
  }
  if (!opts.rfcEmpresa) a.push({ nivel: "error", texto: "Falta RFC de la empresa." });
  if (!opts.registroPatronal) a.push({ nivel: "aviso", texto: "Falta registro patronal del emisor." });
  if (!opts.codigoPostal) a.push({ nivel: "aviso", texto: "Falta código postal de la empresa." });
  if (opts.detalle.sdi <= 0) a.push({ nivel: "error", texto: "SDI debe ser mayor a 0." });
  if (opts.detalle.sbc <= 0) a.push({ nivel: "error", texto: "SBC debe ser mayor a 0." });
  if (opts.detalle.sueldo <= 0 && (opts.detalle.aguinaldo || 0) <= 0
    && (opts.detalle.otrosIngresos || 0) <= 0 && (opts.detalle.primaAntiguedad || 0) <= 0
    && (opts.detalle.percepcionExtra1 || 0) <= 0) {
    a.push({ nivel: "error", texto: "No hay sueldo, aguinaldo, PTU ni indemnización en el renglón." });
  }
  const t = lineTotals(opts.detalle);
  if (t.perc <= 0) a.push({ nivel: "error", texto: "No hay percepciones para armar el recibo." });
  if (t.neto < 0) a.push({ nivel: "error", texto: "El neto es negativo; revisa deducciones." });
  if ((opts.detalle.diasQuincena || 0) <= 0) a.push({ nivel: "aviso", texto: "Días pagados en 0; el CFDI usará 15 por defecto." });
  return a;
}

export function fingerprintRenglon(d: NominaDetalle) {
  return [
    d.sdi, d.sbc, d.sueldo, d.puntualidad, d.asistencia, d.vacacionesAdicionales,
    d.primaVacacional, d.aguinaldo, d.retIMSS, d.retISR, d.retISRArt142, d.infonavit, d.fonacot, d.pensionAlim,
    d.horasExtra, d.comisiones, d.bonos, d.prestamo, d.otros, d.ahorro, d.facturas,
  ].map((n) => round2(Number(n) || 0)).join("|");
}
