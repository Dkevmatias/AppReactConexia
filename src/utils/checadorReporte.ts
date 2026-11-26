/* NOMCONEXIA-UNIFY */
import type { Empleado } from "../services/empleadoService";
import type { IncidenciaCreate } from "../services/nominaIncidenciaService";
import type { PoliticaRetardo, PoliticaRetardoEmpresa } from "../services/politicaRetardoService";
import { porcentajeBonoPuntualidad, EscalaPuntualidadTramo, ESCALA_PUNTUALIDAD_DEFAULT } from "./escalaPuntualidad";

export type SeccionChecador = "RETARDO" | "FALTA" | "INCAPACIDAD" | "VACACIONES" | "ALTA" | "BAJA" | "OTRO";

export interface FechaChecador {
  iso: string;
  texto: string;
  minutos?: number;
}

export interface LineaChecador {
  seccion: SeccionChecador;
  nombre: string;
  detalle: string;
  cantidad: number;
  fechas: FechaChecador[];
  extra?: string;
  numeroReloj?: string;
}

export interface PeriodoChecador {
  titulo: string;
  anio: number;
  mes: number;
  quincena: 1 | 2;
  fechaInicio: string;
  fechaFin: string;
}

export interface FilaChecador {
  nombre: string;
  numeroReloj?: string;
  idEmpleado: number | null;
  idEmpresa: number;
  empleadoNombre: string | null;
  sdi: number;
  sueldoBase: number;
  idPuesto: number | null;
  faltas: number;
  retardos: number;
  fechasFalta: FechaChecador[];
  fechasRetardo: FechaChecador[];
  detalleFalta: string;
  detalleRetardo: string;
  pctBono: number;
  montoBono: number;
  bono: number;
  descuento: number;
  descuentoBono: number;
  matched: boolean;
  origenExcel: boolean;
  conflictoNombre?: boolean;
}

export interface ReporteChecador {
  periodo: PeriodoChecador;
  lineas: LineaChecador[];
  filas: FilaChecador[];
  otras: LineaChecador[];
  sinMatch: string[];
}

const MESES: Record<string, number> = {
  enero: 1,
  febrero: 2,
  marzo: 3,
  abril: 4,
  mayo: 5,
  junio: 6,
  julio: 7,
  agosto: 8,
  septiembre: 9,
  setiembre: 9,
  octubre: 10,
  noviembre: 11,
  diciembre: 12,
};

function lastDay(anio: number, mes: number) {
  return new Date(anio, mes, 0).getDate();
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function isoDate(anio: number, mes: number, dia: number) {
  return `${anio}-${pad(mes)}-${pad(dia)}`;
}

/** Excel serial (días desde 1899-12-30). */
export function excelSerialToIso(value: string): string | null {
  const n = Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n < 20000 || n > 80000) return null;
  const utc = Date.UTC(1899, 11, 30) + Math.round(n) * 86400000;
  const d = new Date(utc);
  return isoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

function periodoDesdeHasta(desdeIso: string, hastaIso: string, titulo: string): PeriodoChecador {
  const hasta = new Date(`${hastaIso}T00:00:00`);
  const quincena: 1 | 2 = hasta.getDate() <= 15 ? 1 : 2;
  return {
    titulo: titulo.trim() || "Asistencia y puntualidad",
    anio: hasta.getFullYear(),
    mes: hasta.getMonth() + 1,
    quincena,
    fechaInicio: desdeIso,
    fechaFin: hastaIso,
  };
}

function celda(row: string[], idx: number | undefined) {
  if (idx == null || idx < 0) return "";
  return (row[idx] || "").trim();
}

function esMarcaEspecial(value: string) {
  const v = normalizarNombre(value);
  return v === "falta" || v === "descanso" || v === "vacaciones" || v === "incapacidad" || v === "permiso";
}

function esNumeroPositivo(value: string) {
  if (!value || esMarcaEspecial(value)) return false;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n > 0;
}

/** Columna "Tiempo retardo": fracción de día de Excel (p. ej. 9.72e-3 ≈ 14 min) o minutos. */
function marcaAMinutos(value: string): number | null {
  const n = Number(String(value).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1) return Math.max(1, Math.round(n * 1440));
  return Math.round(n);
}

function esEntero(value: string) {
  if (!value) return false;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 && Math.abs(n - Math.round(n)) < 0.0001;
}

function normalizarNumeroReloj(value: string) {
  return String(value || "").replace(/^0+/, "").trim();
}

function numeroRelojValido(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const n = Number(raw.replace(",", "."));
  if (Number.isFinite(n)) {
    if (n >= 20000) return "";
    if (Math.abs(n - Math.round(n)) > 0.001) return "";
    const r = Math.round(n);
    if (r < 1 || r > 99999) return "";
    return String(r);
  }
  const norm = normalizarNumeroReloj(raw);
  return /^\d{1,5}$/.test(norm) ? norm : "";
}

function localizarEncabezadoAjustes(grid: string[][]) {
  for (let i = 0; i < Math.min(grid.length, 20); i++) {
    const norm = grid[i].map((c) => normalizarNombre(c));
    const nombre = norm.findIndex((h) => h === "nombre");
    const faltas = norm.findIndex((h) => h === "faltas");
    const retardos = norm.findIndex((h) => h === "retardos");
    if (nombre >= 0 && (faltas >= 0 || retardos >= 0)) {
      return {
        row: i,
        numero: norm.findIndex((h) => h === "numero" || h.startsWith("numero")),
        nombre,
        sucursal: norm.findIndex((h) => h.includes("sucursal")),
        fecha: norm.findIndex((h) => h === "fecha"),
        tiempoRetardo: norm.findIndex((h) => h.includes("tiempo retardo") && !h.includes("comida")),
        faltas,
        retardos,
      };
    }
  }
  return null;
}

export function normalizarNombre(value: string) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function esFilaPersona(nombre: string, numero: string) {
  const n = normalizarNombre(nombre);
  const num = numeroRelojValido(numero);
  if (!n && !num) return false;
  if (
    [
      "nombre",
      "numero",
      "sucursal",
      "area",
      "fecha",
      "total",
      "totales",
      "desde",
      "hasta",
      "faltas",
      "retardos",
    ].includes(n)
  ) {
    return false;
  }
  if (n.includes("asistencia") || n.includes("puntualidad") || n.includes("reporte")) return false;
  if (num) return true;
  return n.split(" ").filter((t) => t.length > 1).length >= 2;
}

function esHeader(a: string) {
  const v = normalizarNombre(a);
  return v === "nombre" || v.startsWith("nombre ");
}

function detectarSeccion(text: string): SeccionChecador | null {
  const v = normalizarNombre(text);
  if (!v) return null;
  if (v.includes("bono") && v.includes("puntual")) return "RETARDO";
  if (v.includes("sin goce")) return "FALTA";
  if (v.includes("incapacidad")) return "INCAPACIDAD";
  if (v.includes("permiso") && v.includes("vacacion")) return "VACACIONES";
  if (v.includes("baja") && v.includes("colaborador")) return "BAJA";
  if (v.includes("alta") && v.includes("colaborador")) return "ALTA";
  return null;
}

export function parsePeriodoTitulo(titulo: string): PeriodoChecador {
  const raw = titulo || "";
  const lower = raw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const anioMatch = lower.match(/(20\d{2})/);
  const anio = anioMatch ? Number(anioMatch[1]) : new Date().getFullYear();
  let mes = new Date().getMonth() + 1;
  for (const [nombre, num] of Object.entries(MESES)) {
    if (lower.includes(nombre)) {
      mes = num;
      break;
    }
  }
  const quincena: 1 | 2 = /2a|2da|segunda/.test(lower) ? 2 : 1;
  const fechaInicio = quincena === 1 ? isoDate(anio, mes, 1) : isoDate(anio, mes, 16);
  const fechaFin = quincena === 1 ? isoDate(anio, mes, 15) : isoDate(anio, mes, lastDay(anio, mes));
  return { titulo: raw.trim() || "Reporte de incidencias", anio, mes, quincena, fechaInicio, fechaFin };
}

function extraerCantidad(text: string) {
  const m = (text || "").match(/(\d+)\s*(d[ií]as?)?/i);
  return m ? Number(m[1]) : 0;
}

function parseFechasDetalle(detalle: string, periodo: PeriodoChecador): FechaChecador[] {
  const paren = detalle.match(/\((.*)\)/);
  const inner = paren?.[1] || detalle;
  const tokens = inner
    .split(/,| y | Y /i)
    .map((t) => t.trim())
    .filter(Boolean);
  const parsed = tokens.map((token) => {
    const num = token.match(/(\d{1,2})/);
    if (!num) return null;
    const dia = Number(num[1]);
    let mes: number | null = null;
    const low = token.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    for (const [nombre, n] of Object.entries(MESES)) {
      if (low.includes(nombre)) {
        mes = n;
        break;
      }
    }
    return { dia, mes, texto: token };
  });

  let nextMes: number | null = null;
  for (let i = parsed.length - 1; i >= 0; i--) {
    const item = parsed[i];
    if (!item) continue;
    if (item.mes != null) nextMes = item.mes;
    else item.mes = nextMes ?? periodo.mes;
  }

  return parsed
    .filter((x): x is { dia: number; mes: number; texto: string } => !!x && x.mes != null)
    .map((x) => {
      let anio = periodo.anio;
      if (x.mes > periodo.mes + 1) anio = periodo.anio - 1;
      return { iso: isoDate(anio, x.mes, x.dia), texto: x.texto };
    });
}

function factorARetardos(factor: string) {
  const n = Number(String(factor).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 0.99) return 4;
  if (n >= 0.74) return 3;
  if (n >= 0.49) return 2;
  if (n >= 0.24) return 1;
  return 0;
}

function parseReporteAjustes(grid: string[][]): { periodo: PeriodoChecador; lineas: LineaChecador[] } | null {
  const header = localizarEncabezadoAjustes(grid);
  if (!header) return null;

  let desdeIso = "";
  let hastaIso = "";
  const titulo = grid[0]?.[0] || "Asistencia y puntualidad";
  for (const row of grid.slice(0, header.row)) {
    const a = normalizarNombre(row[0] || "");
    const iso = excelSerialToIso(row[1] || "");
    if (a === "desde" && iso) desdeIso = iso;
    if (a === "hasta" && iso) hastaIso = iso;
  }
  const periodo =
    desdeIso && hastaIso
      ? periodoDesdeHasta(desdeIso, hastaIso, titulo)
      : parsePeriodoTitulo(titulo);

  type Acc = {
    nombre: string;
    numero: string;
    sucursal: string;
    faltas: number | null;
    retardos: number | null;
    diasConFecha: number;
    fechasFalta: FechaChecador[];
    fechasRetardo: FechaChecador[];
  };
  const porPersona = new Map<string, Acc>();
  const keyOf = (numero: string, nombre: string) =>
    numero ? `n:${numero}` : `nom:${normalizarNombre(nombre)}`;

  let ultimaClave = "";
  let vacias = 0;
  for (const row of grid.slice(header.row + 1)) {
    const nombre = celda(row, header.nombre);
    const numero = numeroRelojValido(celda(row, header.numero));
    const fechaIso = excelSerialToIso(celda(row, header.fecha));
    const marca = celda(row, header.tiempoRetardo);
    const faltasCell = celda(row, header.faltas);
    const retardosCell = celda(row, header.retardos);
    const hasResumen = esEntero(faltasCell) || esEntero(retardosCell);
    const esPersona = esFilaPersona(nombre, numero);

    if (!esPersona && !fechaIso && !hasResumen) {
      vacias += 1;
      if (vacias >= 8) break;
      continue;
    }
    vacias = 0;

    let key = "";
    if (esPersona) key = keyOf(numero, nombre);
    else if (fechaIso && ultimaClave) key = ultimaClave;
    else continue;

    ultimaClave = key;
    let acc = porPersona.get(key);
    if (!acc) {
      acc = {
        nombre: nombre || numero,
        numero,
        sucursal: celda(row, header.sucursal),
        faltas: null,
        retardos: null,
        diasConFecha: 0,
        fechasFalta: [],
        fechasRetardo: [],
      };
      porPersona.set(key, acc);
    }
    if (esPersona && nombre) acc.nombre = nombre;
    if (numero) acc.numero = numero;

    if (fechaIso) {
      acc.diasConFecha += 1;
      const marcaNorm = normalizarNombre(marca);
      if (marcaNorm === "falta") {
        acc.fechasFalta.push({ iso: fechaIso, texto: "FALTA" });
      } else if (esNumeroPositivo(marca)) {
        const minutos = marcaAMinutos(marca);
        acc.fechasRetardo.push({
          iso: fechaIso,
          texto: minutos != null ? `${minutos} min` : marca,
          minutos: minutos ?? undefined,
        });
      }
      continue;
    }

    if (esEntero(faltasCell)) acc.faltas = Math.round(Number(faltasCell.replace(",", ".")));
    if (esEntero(retardosCell)) acc.retardos = Math.round(Number(retardosCell.replace(",", ".")));
  }

  const conAsistencia = [...porPersona.values()].filter((a) => a.diasConFecha > 0);
  const fuente = conAsistencia.length > 0 ? conAsistencia : [...porPersona.values()].filter((a) => a.faltas != null || a.retardos != null);

  const lineas: LineaChecador[] = [];
  for (const acc of fuente) {
    if (!esFilaPersona(acc.nombre, acc.numero)) continue;
    const faltas = acc.fechasFalta.length || acc.faltas || 0;
    const retardos = acc.fechasRetardo.length || acc.retardos || 0;
    const suc = acc.sucursal ? ` · ${acc.sucursal}` : "";
    if (faltas > 0) {
      lineas.push({
        seccion: "FALTA",
        nombre: acc.nombre,
        numeroReloj: acc.numero,
        cantidad: faltas,
        fechas: acc.fechasFalta,
        detalle: `${faltas} falta(s)${suc}`,
        extra: acc.numero,
      });
    }
    if (retardos > 0) {
      lineas.push({
        seccion: "RETARDO",
        nombre: acc.nombre,
        numeroReloj: acc.numero,
        cantidad: retardos,
        fechas: acc.fechasRetardo,
        detalle: `${retardos} retardo(s)${suc}`,
        extra: acc.numero,
      });
    }
    if (faltas === 0 && retardos === 0) {
      lineas.push({
        seccion: "OTRO",
        nombre: acc.nombre,
        numeroReloj: acc.numero,
        cantidad: 0,
        fechas: [],
        detalle: `Sin faltas ni retardos${suc}`,
        extra: acc.numero,
      });
    }
  }

  return { periodo, lineas };
}

export function parseChecadorGrid(grid: string[][]): { periodo: PeriodoChecador; lineas: LineaChecador[] } {
  const ajustes = parseReporteAjustes(grid);
  if (ajustes) return ajustes;

  const titulo = grid.flatMap((r) => r).find((c) => /incidencia/i.test(c)) || grid[0]?.[1] || grid[0]?.[0] || "";
  const periodo = parsePeriodoTitulo(titulo);
  const tieneSeccion = grid.some((row) => {
    const a = (row[0] || "").trim();
    const b = (row[1] || "").trim();
    return !b && !!detectarSeccion(a);
  });
  if (!tieneSeccion) return { periodo, lineas: [] };
  const lineas: LineaChecador[] = [];
  let seccion: SeccionChecador | null = null;

  for (const row of grid) {
    const a = (row[0] || "").trim();
    const b = (row[1] || "").trim();
    const c = (row[2] || "").trim();
    const d = (row[3] || "").trim();
    if (!a && !b) continue;

    const nueva = !b ? detectarSeccion(a) : null;
    if (nueva) {
      seccion = nueva;
      continue;
    }
    if (!seccion || esHeader(a)) continue;

    if (seccion === "RETARDO") {
      const detalle = c || b;
      const fechas = parseFechasDetalle(detalle, periodo);
      const cantidad = fechas.length || extraerCantidad(detalle) || factorARetardos(b);
      lineas.push({ seccion, nombre: a, detalle, cantidad, fechas, extra: b });
      continue;
    }

    if (seccion === "FALTA" || seccion === "VACACIONES" || seccion === "INCAPACIDAD") {
      const detalle = b;
      const fechas = parseFechasDetalle(detalle, periodo);
      const cantidad = fechas.length || extraerCantidad(detalle);
      lineas.push({ seccion, nombre: a, detalle, cantidad, fechas, extra: [c, d].filter(Boolean).join(" | ") });
      continue;
    }

    lineas.push({
      seccion,
      nombre: a,
      detalle: [b, c, d].filter(Boolean).join(" | "),
      cantidad: extraerCantidad(b),
      fechas: [],
      extra: c,
    });
  }

  return { periodo, lineas };
}

export function salarioDiarioIntegrado(emp: Empleado) {
  const sdi = Number(emp.sdi);
  if (sdi > 0) return sdi;
  const sbc = Number(emp.sbc);
  if (sbc > 0) return sbc;
  const sueldo = Number(emp.sueldoBase) || 0;
  return sueldo > 0 ? Math.round((sueldo / 30) * 10000) / 10000 : 0;
}

function tokensNombre(value: string) {
  return normalizarNombre(value)
    .split(" ")
    .filter((t) => t.length > 1 && !["de", "del", "la", "las", "los", "y", "el"].includes(t));
}

function nombresCompatibles(excelNombre: string, empleadoNombre: string) {
  const a = tokensNombre(excelNombre);
  const b = tokensNombre(empleadoNombre);
  if (a.length === 0 || b.length === 0) return false;
  if (normalizarNombre(excelNombre) === normalizarNombre(empleadoNombre)) return true;
  const shared = a.filter((t) => b.includes(t));
  return shared.length >= 2;
}

function matchEmpleado(nombre: string, empleados: Empleado[], numeroReloj?: string): Empleado | null {
  const deEmpresa = empleados;
  const key = normalizarNombre(nombre);
  if (key) {
    const exact = deEmpresa.filter((e) => normalizarNombre(e.fullName) === key);
    if (exact.length === 1) return exact[0];
  }
  const num = numeroRelojValido(numeroReloj || "");
  if (num) {
    const byNum = deEmpresa.filter((e) => {
      const nEmp = numeroRelojValido(String(e.numeroEmpleado || ""));
      const nChec = numeroRelojValido(String(e.claveChecador || ""));
      return nEmp === num || nChec === num;
    });
    const compatible = byNum.filter((e) => nombresCompatibles(nombre, e.fullName));
    if (compatible.length === 1) return compatible[0];
  }
  const tokens = tokensNombre(nombre);
  if (tokens.length < 2) return null;
  const contains = deEmpresa.filter((e) => {
    const n = tokensNombre(e.fullName);
    return tokens.every((t) => n.includes(t));
  });
  return contains.length === 1 ? contains[0] : null;
}

export function armarFilasChecador(opts: {
  lineas: LineaChecador[];
  periodo: PeriodoChecador;
  empleados: Empleado[];
  idEmpresa: number;
  montoBono: number;
  escala?: EscalaPuntualidadTramo[];
  overrideMatch?: Record<string, number>;
}): FilaChecador[] {
  const escala = opts.escala || ESCALA_PUNTUALIDAD_DEFAULT;
  const empleados = opts.empleados.filter((e) => !opts.idEmpresa || e.idEmpresa === opts.idEmpresa);
  const map = new Map<string, FilaChecador>();

  const ensure = (nombre: string, numeroReloj?: string): FilaChecador => {
    const key = numeroRelojValido(numeroReloj || "")
      ? `n:${numeroRelojValido(numeroReloj || "")}`
      : normalizarNombre(nombre);
    const existing = map.get(key);
    if (existing) {
      if (numeroReloj && !existing.numeroReloj) existing.numeroReloj = numeroReloj;
      return existing;
    }
    const forced = opts.overrideMatch?.[normalizarNombre(nombre)] ?? opts.overrideMatch?.[key];
    const emp =
      (forced ? empleados.find((e) => e.idEmpleado === forced) : null) ||
      matchEmpleado(nombre, empleados, numeroReloj);
    const sdi = emp ? salarioDiarioIntegrado(emp) : 0;
    const fila: FilaChecador = {
      nombre,
      numeroReloj,
      idEmpleado: emp?.idEmpleado ?? null,
      idEmpresa: emp?.idEmpresa ?? opts.idEmpresa,
      empleadoNombre: emp?.fullName ?? null,
      sdi,
      sueldoBase: emp?.sueldoBase ?? 0,
      idPuesto: emp?.idPuesto ?? null,
      faltas: 0,
      retardos: 0,
      fechasFalta: [],
      fechasRetardo: [],
      detalleFalta: "",
      detalleRetardo: "",
      pctBono: 1,
      montoBono: opts.montoBono,
      bono: opts.montoBono,
      descuento: 0,
      descuentoBono: 0,
      matched: !!emp,
      origenExcel: true,
      conflictoNombre: !!emp && !forced && !nombresCompatibles(nombre, emp.fullName),
    };
    map.set(key, fila);
    return fila;
  };

  for (const linea of opts.lineas) {
    if (linea.seccion !== "FALTA" && linea.seccion !== "RETARDO" && linea.seccion !== "OTRO") continue;
    const fila = ensure(linea.nombre, linea.numeroReloj || linea.extra);
    if (linea.seccion === "FALTA") {
      fila.faltas += linea.cantidad;
      fila.fechasFalta = [...fila.fechasFalta, ...linea.fechas];
      fila.detalleFalta = [fila.detalleFalta, linea.detalle].filter(Boolean).join(" | ");
    } else if (linea.seccion === "RETARDO") {
      fila.retardos += linea.cantidad;
      fila.fechasRetardo = [...fila.fechasRetardo, ...linea.fechas];
      fila.detalleRetardo = [fila.detalleRetardo, linea.detalle].filter(Boolean).join(" | ");
    }
  }

  const filas = [...map.values()].map((fila) => calcularMontosFila(fila, escala));
  filas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return filas;
}

export function calcularMontosFila(fila: FilaChecador, escala: EscalaPuntualidadTramo[] = ESCALA_PUNTUALIDAD_DEFAULT): FilaChecador {
  const pctBono = porcentajeBonoPuntualidad(fila.retardos, escala);
  const bono = Math.round(fila.montoBono * pctBono * 100) / 100;
  const descuento = Math.round(fila.faltas * fila.sdi * 100) / 100;
  const descuentoBono = Math.round((fila.montoBono - bono) * 100) / 100;
  return { ...fila, pctBono, bono, descuento, descuentoBono };
}

function vigentePolitica(p: PoliticaRetardo, iso: string) {
  if (p.activo === false) return false;
  const dia = iso.slice(0, 10);
  const ini = p.fechaInicio ? String(p.fechaInicio).slice(0, 10) : "";
  const fin = p.fechaFin ? String(p.fechaFin).slice(0, 10) : "";
  if (ini && dia < ini) return false;
  if (fin && dia > fin) return false;
  return true;
}

export function resolverPoliticaRetardo(
  pack: PoliticaRetardoEmpresa | null | undefined,
  idEmpleado: number | null,
  fechaIso: string
) {
  const extras = pack?.excepciones || [];
  const extra =
    idEmpleado != null
      ? extras
          .filter((p) => p.idEmpleado === idEmpleado && vigentePolitica(p, fechaIso))
          .sort((a, b) => String(b.fechaInicio || "").localeCompare(String(a.fechaInicio || "")))[0]
      : undefined;
  const src = extra || pack?.empresa;
  return {
    toleranciaMinutos: src?.toleranciaMinutos ?? 10,
    minutosFalta: src?.minutosFalta ?? 60,
  };
}

/** Recalcula retardos con la política (08:30 + 10 min, o excepción del empleado). */
export function aplicarPoliticaRetardo(
  filas: FilaChecador[],
  pack: PoliticaRetardoEmpresa | null | undefined,
  escala: EscalaPuntualidadTramo[] = ESCALA_PUNTUALIDAD_DEFAULT
): FilaChecador[] {
  return filas.map((fila) => {
    if (!fila.fechasRetardo.some((f) => f.minutos != null)) return calcularMontosFila(fila, escala);

    const retardos: FechaChecador[] = [];
    for (const f of fila.fechasRetardo) {
      if (f.minutos == null) {
        retardos.push(f);
        continue;
      }
      const pol = resolverPoliticaRetardo(pack, fila.idEmpleado, f.iso);
      if (f.minutos <= pol.toleranciaMinutos) continue;
      retardos.push({ ...f, texto: `${f.minutos} min` });
    }

    return calcularMontosFila(
      {
        ...fila,
        fechasRetardo: retardos,
        retardos: retardos.length,
        detalleRetardo: retardos.length ? `${retardos.length} retardo(s)` : "",
      },
      escala
    );
  });
}

export function buildReporteChecador(opts: {
  grid: string[][];
  empleados: Empleado[];
  idEmpresa: number;
  montoBono: number;
  escala?: EscalaPuntualidadTramo[];
  overrideMatch?: Record<string, number>;
  politicaRetardo?: PoliticaRetardoEmpresa | null;
}): ReporteChecador {
  const { periodo, lineas } = parseChecadorGrid(opts.grid);
  const filas = aplicarPoliticaRetardo(
    armarFilasChecador({
      lineas,
      periodo,
      empleados: opts.empleados,
      idEmpresa: opts.idEmpresa,
      montoBono: opts.montoBono,
      escala: opts.escala,
      overrideMatch: opts.overrideMatch,
    }),
    opts.politicaRetardo,
    opts.escala
  );
  return {
    periodo,
    lineas,
    filas,
    otras: lineas.filter((l) => l.seccion !== "FALTA" && l.seccion !== "RETARDO" && l.seccion !== "OTRO"),
    sinMatch: filas.filter((f) => !f.matched).map((f) => f.nombre),
  };
}

function fechasOPeriodo(fechas: FechaChecador[], periodo: PeriodoChecador, cantidad: number) {
  if (fechas.length > 0) {
    const isos = [...new Set(fechas.map((f) => f.iso))].sort();
    return isos;
  }
  const out: string[] = [];
  const start = new Date(`${periodo.fechaInicio}T00:00:00`);
  for (let i = 0; i < Math.max(1, cantidad); i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(isoDate(d.getFullYear(), d.getMonth() + 1, d.getDate()));
  }
  return out;
}

export function filasToIncidencias(filas: FilaChecador[], periodo: PeriodoChecador): IncidenciaCreate[] {
  const items: IncidenciaCreate[] = [];
  for (const fila of filas) {
    if (!fila.idEmpleado) continue;
    if (fila.faltas > 0) {
      const dias = fechasOPeriodo(fila.fechasFalta, periodo, fila.faltas);
      for (const dia of dias) {
        items.push({
          idEmpleado: fila.idEmpleado,
          idEmpresa: fila.idEmpresa,
          tipoIncidencia: "FALTA",
          fechaInicio: dia,
          fechaFin: dia,
          cantidad: 1,
          monto: Math.round(fila.sdi * 100) / 100,
          afectaNomina: true,
          tipoMovimiento: "DEDUCCION",
          descripcion: fila.detalleFalta || `Falta checador ${periodo.titulo}`,
        });
      }
    }
    if (fila.retardos > 0) {
      const dias = fechasOPeriodo(fila.fechasRetardo, periodo, fila.retardos);
      for (const dia of dias) {
        const marca = fila.fechasRetardo.find((f) => f.iso === dia);
        const minutosTxt = marca?.minutos != null ? ` (${marca.minutos} min)` : "";
        items.push({
          idEmpleado: fila.idEmpleado,
          idEmpresa: fila.idEmpresa,
          tipoIncidencia: "RETARDO",
          fechaInicio: dia,
          fechaFin: dia,
          cantidad: 1,
          monto: null,
          afectaNomina: true,
          tipoMovimiento: "DEDUCCION",
          descripcion: fila.detalleRetardo || `Retardo checador ${periodo.titulo}${minutosTxt}`,
        });
      }
    }
  }
  return items;
}
