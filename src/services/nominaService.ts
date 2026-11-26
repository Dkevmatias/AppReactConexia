/* NOMCONEXIA-UNIFY */
import { api, asArray } from "./apiServices";

export interface NominaCabecero {
  idNomina: number;
  idEmpresa: number;
  empresaNombre: string | null;
  idPeriodo: number;
  periodoNombre: string | null;
  numeroNomina: string;
  tipoNomina: string;
  claveTipoNomina?: string | null;
  fechaNomina: string;
  fechaPago: string;
  fechaInicio: string;
  fechaFin: string;
  observaciones: string | null;
  montoPtu?: number;
  estatus: string;
  totalPercepciones: number;
  totalDeducciones: number;
  totalNeto: number;
  totalEmpleados: number;
  totalISR: number;
  totalIMSS: number;
  totalInfonavit: number;
  totalFonacot: number;
  totalPensiones: number;
  archivoExcel: string | null;
  creadoPor: string | null;
  fechaCreacion: string;
  detalles?: NominaDetalle[];
}

export interface NominaCabeceroCreate {
  idEmpresa: number;
  idPeriodo: number;
  numeroNomina: string;
  tipoNomina: string;
  claveTipoNomina?: string | null;
  fechaNomina: string;
  fechaPago: string;
  fechaInicio: string;
  fechaFin: string;
  observaciones?: string;
  montoPtu?: number;
}

export interface NominaDetalle {
  idNominaDetalle: number;
  idNomina: number;
  idEmpleado: number;
  idEmpresa: number;
  empleadoNombre: string | null;
  numeroEmpleado?: string | null;
  rfc?: string | null;
  puestoNombre: string | null;
  departamentoNombre: string | null;
  empresaNombre: string | null;
  sdi: number;
  sbc: number;
  diasQuincena: number;
  diasCotizados: number;
  diasLaborales: number;
  vacaciones: number;
  incapacidad: number;
  ausentismo: number;
  sueldo: number;
  puntualidad: number;
  asistencia: number;
  otrosIngresos: number;
  diaFestivo: number;
  primaVacacional: number;
  subIncapacidad: number;
  aguinaldo: number;
  comisiones: number;
  horasExtra: number;
  primaAntiguedad: number;
  vacacionesAdicionales: number;
  bonos: number;
  percepcionExtra1: number;
  percepcionExtra2: number;
  percepcionExtra3: number;
  totalPercepciones: number;
  retISR: number;
  retISRArt142: number;
  retIMSS: number;
  retIMSSObrera: number;
  fonacot: number;
  infonavit: number;
  pensionAlim: number;
  otros: number;
  deduccionExtra1: number;
  deduccionExtra2: number;
  deduccionExtra3: number;
  totalDeducciones: number;
  totalAPagar: number;
  ahorro: number;
  prestamo: number;
  facturas: number;
  totalDeposito: number;
  cuentaDeposito: string | null;
  banco: string | null;
  estatus: string;
  pagado: boolean;
  fechaPago: string | null;
  observaciones: string | null;
}

export interface NominaDetalleCreate {
  idNominaDetalle?: number;
  idEmpleado: number;
  sdi: number;
  sbc: number;
  diasQuincena: number;
  diasCotizados: number;
  diasLaborales: number;
  vacaciones: number;
  incapacidad: number;
  ausentismo: number;
  sueldo: number;
  puntualidad: number;
  asistencia: number;
  otrosIngresos: number;
  diaFestivo: number;
  primaVacacional: number;
  subIncapacidad: number;
  aguinaldo: number;
  comisiones: number;
  horasExtra: number;
  primaAntiguedad: number;
  vacacionesAdicionales: number;
  bonos: number;
  percepcionExtra1: number;
  percepcionExtra2: number;
  percepcionExtra3: number;
  retISR: number;
  retISRArt142: number;
  retIMSS: number;
  retIMSSObrera: number;
  fonacot: number;
  infonavit: number;
  pensionAlim: number;
  otros: number;
  deduccionExtra1: number;
  deduccionExtra2: number;
  deduccionExtra3: number;
  ahorro: number;
  prestamo: number;
  facturas: number;
  totalDeposito: number;
  cuentaDeposito?: string;
  banco?: string;
  observaciones?: string;
}

export function toDetalleCreate(d: NominaDetalle): NominaDetalleCreate {
  return {
    idNominaDetalle: d.idNominaDetalle,
    idEmpleado: d.idEmpleado,
    sdi: d.sdi,
    sbc: d.sbc,
    diasQuincena: d.diasQuincena,
    diasCotizados: d.diasCotizados,
    diasLaborales: d.diasLaborales,
    vacaciones: d.vacaciones,
    incapacidad: d.incapacidad,
    ausentismo: d.ausentismo,
    sueldo: d.sueldo,
    puntualidad: d.puntualidad,
    asistencia: d.asistencia,
    otrosIngresos: d.otrosIngresos,
    diaFestivo: d.diaFestivo,
    primaVacacional: d.primaVacacional,
    subIncapacidad: d.subIncapacidad,
    aguinaldo: d.aguinaldo,
    comisiones: d.comisiones,
    horasExtra: d.horasExtra,
    primaAntiguedad: d.primaAntiguedad,
    vacacionesAdicionales: d.vacacionesAdicionales,
    bonos: d.bonos,
    percepcionExtra1: d.percepcionExtra1,
    percepcionExtra2: d.percepcionExtra2,
    percepcionExtra3: d.percepcionExtra3,
    retISR: d.retISR,
    retISRArt142: d.retISRArt142,
    retIMSS: d.retIMSS,
    retIMSSObrera: d.retIMSSObrera,
    fonacot: d.fonacot,
    infonavit: d.infonavit,
    pensionAlim: d.pensionAlim,
    otros: d.otros,
    deduccionExtra1: d.deduccionExtra1,
    deduccionExtra2: d.deduccionExtra2,
    deduccionExtra3: d.deduccionExtra3,
    ahorro: d.ahorro,
    prestamo: d.prestamo,
    facturas: d.facturas,
    totalDeposito: d.totalDeposito,
    cuentaDeposito: d.cuentaDeposito || undefined,
    banco: d.banco || undefined,
    observaciones: d.observaciones || undefined,
  };
}

export interface NominaExcelRow {
  EMPLEADO: string;
  SDI: number;
  SBC: number;
  DIAS_QUINCENA: number;
  VACACIONES: number;
  INCAPACIDAD: number;
  AUSENTISMO: number;
  DIAS_COTIZADOS: number;
  DIAS_LABORALES: number;
  SUELDO: number;
  PUNTUALIDAD: number;
  ASISTENCIA: number;
  OTROS_INGRESOS: number;
  DIA_FESTIVO: number;
  VACACIONES_1: number;
  PRIMA_VACACIONAL: number;
  SUB_INCAPACIDAD: number;
  AGUINALDO: number;
  TOTAL_PERCEPCIONES: number;
  RET_ISR: number;
  RET_IMSS: number;
  FONACOT: number;
  INFONAVIT: number;
  PENSION_ALIM: number;
  OTROS: number;
  TOTAL_A_PAGAR: number;
  AHORRO: number;
  PRESTAMO: number;
  FACTURAS: number;
  TOTAL_DEPOSITO: number;
  CUENTA_DEPOSITO?: string;
  BANCO?: string;
}

export interface NominaFilters {
  idEmpresa?: number;
  idPeriodo?: number;
  estatus?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface NominaConcepto {
  idConcepto: number;
  idEmpresa: number | null;
  clave: string;
  descripcion: string;
  tipo: string;
  esAutomatico: boolean;
  afectaIMSS: boolean;
  afectaISR: boolean;
  gravado: boolean;
  mostrarEnRecibo: boolean;
  activo: boolean;
  orden: number;
  tipoCalculo: string;
  valorCalculo: number;
  campoOrigen: string | null;
}

export interface PeriodoNomina {
  idPeriodo: number;
  idEmpresa: number;
  empresaNombre: string | null;
  numeroPeriodo: number;
  anio: number;
  mes: number;
  quincena: number;
  fechaInicio: string;
  fechaFin: string;
  fechaPago: string;
  cerrado: boolean;
}

export const nominaService = {
  // Cabecero
  getNominas: async (filters?: NominaFilters): Promise<NominaCabecero[]> => {
    const params: Record<string, string> = {};
    if (filters?.idEmpresa) params.idEmpresa = filters.idEmpresa.toString();
    if (filters?.idPeriodo) params.idPeriodo = filters.idPeriodo.toString();
    if (filters?.estatus) params.estatus = filters.estatus;
    if (filters?.fechaInicio) params.fechaInicio = filters.fechaInicio;
    if (filters?.fechaFin) params.fechaFin = filters.fechaFin;
    
    const res = await api.get<NominaCabecero[]>("/api/Nominas", { params });
    return asArray<NominaCabecero>(res.data);
  },

  getNomina: async (id: number): Promise<NominaCabecero> => {
    const res = await api.get<NominaCabecero>(`/api/Nominas/${id}`);
    return res.data;
  },

  createNomina: async (nomina: NominaCabeceroCreate): Promise<NominaCabecero> => {
    const res = await api.post<NominaCabecero>("/api/Nominas", nomina);
    return res.data;
  },

  updateNomina: async (id: number, nomina: NominaCabeceroCreate): Promise<void> => {
    await api.put(`/api/Nominas/${id}`, nomina);
  },

  deleteNomina: async (id: number): Promise<void> => {
    await api.delete(`/api/Nominas/${id}`);
  },

  cambiarEstatus: async (id: number, estatus: string): Promise<void> => {
    const res = await api.put(`/api/Nominas/${id}/Estatus/${estatus}`);
    if (res.status >= 400) {
      const msg = (res.data as unknown as { message?: string })?.message || "Error al cambiar estatus";
      throw new Error(msg);
    }
  },

  // Detalle
  getDetalles: async (idNomina: number): Promise<NominaDetalle[]> => {
    const res = await api.get<NominaDetalle[]>(`/api/Nominas/${idNomina}/detalles`);
    return asArray<NominaDetalle>(res.data);
  },

  getDetalle: async (id: number): Promise<NominaDetalle> => {
    const res = await api.get<NominaDetalle>(`/api/Nominas/detalle/${id}`);
    return res.data;
  },

  createDetalle: async (idNomina: number, detalle: NominaDetalleCreate): Promise<NominaDetalle> => {
    const res = await api.post<NominaDetalle>(`/api/Nominas/${idNomina}/detalles`, detalle);
    return res.data;
  },

  updateDetalle: async (id: number, detalle: NominaDetalleCreate): Promise<void> => {
    const res = await api.put(`/api/Nominas/detalle/${id}`, detalle);
    if (res.status >= 400) {
      const msg = (res.data as unknown as { message?: string })?.message || "Error al actualizar el renglón";
      throw new Error(typeof msg === "string" ? msg : "Error al actualizar el renglón");
    }
  },

  updateDetalles: async (idNomina: number, detalles: NominaDetalle[]): Promise<void> => {
    const res = await api.put(`/api/Nominas/${idNomina}/detalles`, detalles.map(toDetalleCreate));
    if (res.status >= 400) {
      const msg = (res.data as unknown as { message?: string })?.message || "Error al guardar renglones";
      throw new Error(msg);
    }
  },

  deleteDetalle: async (id: number): Promise<void> => {
    await api.delete(`/api/Nominas/detalle/${id}`);
  },

  marcarPagado: async (id: number): Promise<void> => {
    await api.put(`/api/Nominas/detalle/${id}/pagar`);
  },

  // Excel Import
  importarExcel: async (idNomina: number, datos: NominaExcelRow[]): Promise<NominaCabecero> => {
    const res = await api.post<NominaCabecero>(`/api/Nominas/${idNomina}/importar`, datos);
    return res.data;
  },

  // Conceptos
  getConceptos: async (idEmpresa?: number): Promise<NominaConcepto[]> => {
    const params = idEmpresa ? { idEmpresa: idEmpresa.toString() } : {};
    const res = await api.get<NominaConcepto[]>("/api/Nominas/conceptos", { params });
    return asArray<NominaConcepto>(res.data);
  },

  // Periodos
  getPeriodos: async (idEmpresa?: number): Promise<PeriodoNomina[]> => {
    const params = idEmpresa ? { idEmpresa: idEmpresa.toString() } : {};
    const res = await api.get<PeriodoNomina[]>("/api/Nominas/periodos", { params });
    return asArray<PeriodoNomina>(res.data);
  },

  createPeriodo: async (periodo: Partial<PeriodoNomina>): Promise<PeriodoNomina> => {
    const res = await api.post<PeriodoNomina>("/api/Nominas/periodos", periodo);
    return res.data;
  },

  calcularNomina: async (id: number): Promise<NominaCabecero> => {
    const res = await api.post<NominaCabecero>(`/api/Nominas/${id}/calcular`);
    if (res.status >= 400) {
      const msg = (res.data as unknown as { message?: string })?.message || "Error al calcular nómina";
      throw new Error(msg);
    }
    return res.data;
  },

  generarRenglones: async (id: number): Promise<NominaCabecero> => {
    const res = await api.post<NominaCabecero>(`/api/Nominas/${id}/renglones`);
    if (res.status >= 400) {
      const msg = (res.data as unknown as { message?: string })?.message || "Error al generar renglones";
      throw new Error(msg);
    }
    return res.data;
  },

  timbrarNomina: async (id: number): Promise<TimbradoResultado> => {
    const res = await api.post<TimbradoResultado>(`/api/Nominas/${id}/timbrar`);
    if (res.status >= 400) {
      const msg = (res.data as unknown as { message?: string })?.message || "Error al timbrar nómina";
      throw new Error(msg);
    }
    return res.data;
  },

  descargarPolizaSap: async (id: number): Promise<void> => {
    const res = await api.get(`/api/Nominas/${id}/poliza-sap`, { responseType: "blob" });
    const blob = res.data as Blob;
    if (res.status >= 400) {
      let msg = "No se pudo generar la póliza SAP";
      try {
        const parsed = JSON.parse(await blob.text()) as { message?: string };
        if (parsed.message) msg = parsed.message;
      } catch {
        /* blob no es JSON */
      }
      throw new Error(msg);
    }
    const nombre =
      res.headers["content-disposition"]?.match(/filename="?([^"]+)"?/i)?.[1] ||
      `PolizaSAP_${id}.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = decodeURIComponent(nombre);
    a.click();
    URL.revokeObjectURL(url);
  },
};

export interface TimbradoResultado {
  idNomina: number;
  totalDetalles: number;
  exitosos: number;
  fallidos: number;
  resultados: {
    idNominaDetalle: number;
    idEmpleado: number;
    empleadoNombre?: string;
    exito: boolean;
    uuid?: string;
    facturapiId?: string;
    error?: string;
  }[];
}
