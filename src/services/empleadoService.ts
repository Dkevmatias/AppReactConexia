/* NOMCONEXIA-UNIFY */
import { api, asArray } from "./apiServices";

export interface Empleado {
  idEmpleado: number;
  idEmpresa: number;
  empresaNombre: string;
  idPuesto: number;
  puestoNombre: string;
  idDepartamento: number;
  departamentoNombre: string;
  nombre: string;
  primerApellido: string;
  segundoApellido: string | null;
  fullName: string;
  nss: number | string | null;
  correo?: string | null;
  rfc: string | null;
  curp: string | null;
  fechaNacimiento: string | null;
  sueldoBase: number;
  tipoContrato: string | null;
  numeroEmpleado?: string | null;
  claveChecador?: string | null;
  claveSucursal?: string | null;
  claveTipoContrato?: string | null;
  claveTipoRegimen?: string | null;
  claveTipoJornada?: string | null;
  claveRiesgoPuesto?: string | null;
  claveBanco?: string | null;
  claveEntidadFederativa?: string | null;
  clavePeriodicidadPago?: string | null;
  claveRegimenFiscal?: string | null;
  cuentaBancaria?: string | null;
  clabe?: string | null;
  sdi?: number | null;
  sbc?: number | null;
  fechaIngreso: string;
  fechaBaja: string | null;
  idJefe?: number | null;
  jefeNombre?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface EmpleadoCreate {
  idEmpresa: number;
  idPuesto: number;
  idDepartamento: number;
  nombre: string;
  primerApellido: string;
  segundoApellido?: string | null;
  nss?: number | string | null;
  correo?: string | null;
  rfc?: string | null;
  curp?: string | null;
  fechaNacimiento?: string | null;
  sueldoBase: number;
  tipoContrato?: string | null;
  numeroEmpleado?: string | null;
  claveSucursal?: string | null;
  claveTipoContrato?: string | null;
  claveTipoRegimen?: string | null;
  claveTipoJornada?: string | null;
  claveRiesgoPuesto?: string | null;
  claveBanco?: string | null;
  claveEntidadFederativa?: string | null;
  clavePeriodicidadPago?: string | null;
  claveRegimenFiscal?: string | null;
  cuentaBancaria?: string | null;
  clabe?: string | null;
  sdi?: number | null;
  sbc?: number | null;
  fechaIngreso: string;
  idJefe?: number | null;
}

export interface EmpleadoUpdate extends EmpleadoCreate {
  idEmpleado: number;
  fechaBaja?: string | null;
}

function vacioANull(value: string | number | null | undefined): string | null {
  const t = String(value ?? "").trim();
  return t ? t : null;
}

function mensajeErrorEmpleado(data: unknown, fallback: string): string {
  if (typeof data === "string" && data.trim()) return data.trim();
  if (!data || typeof data !== "object") return fallback;
  const o = data as Record<string, unknown>;
  const errors = o.errors ?? o.Errors ?? o.modelState ?? o.ModelState;
  if (errors && typeof errors === "object") {
    const msgs = Object.entries(errors as Record<string, unknown>).flatMap(
      ([campo, valor]) => {
        const lista = Array.isArray(valor) ? valor : [valor];
        return lista
          .filter((item): item is string => typeof item === "string" && !!item.trim())
          .map((item) => {
            const nombre = campo.replace(/^\$\.?/, "").trim();
            return nombre && nombre !== "$" ? `${nombre}: ${item.trim()}` : item.trim();
          });
      },
    );
    if (msgs.length > 0) return msgs.join(" ");
  }
  for (const key of ["mensaje", "Mensaje", "message", "Message", "detail", "Detail", "title", "Title"]) {
    const v = o[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return fallback;
}

/** Convierte strings vacíos a null para que ASP.NET no rechace fechas/correo. */
function payloadEmpleado<T extends EmpleadoCreate>(empleado: T): T {
  const nss = vacioANull(
    empleado.nss == null ? "" : String(empleado.nss).replace(/\D/g, ""),
  );
  return {
    ...empleado,
    nombre: empleado.nombre.trim(),
    primerApellido: empleado.primerApellido.trim(),
    segundoApellido: vacioANull(empleado.segundoApellido),
    nss,
    correo: vacioANull(empleado.correo),
    rfc: vacioANull(empleado.rfc)?.toUpperCase() ?? null,
    curp: vacioANull(empleado.curp)?.toUpperCase() ?? null,
    fechaNacimiento: vacioANull(empleado.fechaNacimiento),
    tipoContrato: vacioANull(empleado.tipoContrato),
    numeroEmpleado: vacioANull(empleado.numeroEmpleado),
    claveSucursal: vacioANull(empleado.claveSucursal),
    claveTipoContrato: vacioANull(empleado.claveTipoContrato),
    claveTipoRegimen: vacioANull(empleado.claveTipoRegimen),
    claveTipoJornada: vacioANull(empleado.claveTipoJornada),
    claveRiesgoPuesto: vacioANull(empleado.claveRiesgoPuesto),
    claveBanco: vacioANull(empleado.claveBanco),
    claveEntidadFederativa: vacioANull(empleado.claveEntidadFederativa),
    clavePeriodicidadPago: vacioANull(empleado.clavePeriodicidadPago),
    claveRegimenFiscal: vacioANull(empleado.claveRegimenFiscal),
    cuentaBancaria: vacioANull(empleado.cuentaBancaria),
    clabe: vacioANull(empleado.clabe),
    fechaIngreso: empleado.fechaIngreso,
    fechaBaja:
      "fechaBaja" in empleado
        ? vacioANull((empleado as EmpleadoUpdate).fechaBaja)
        : undefined,
    idJefe: empleado.idJefe && empleado.idJefe > 0 ? empleado.idJefe : null,
    sdi: empleado.sdi ?? 0,
    sbc: empleado.sbc ?? 0,
  };
}

export interface Departamento {
  idDepartamento: number;
  idEmpresa: number;
  nombre: string;
  codigo: string;
  activo: boolean;
}

export interface Puesto {
  idPuesto: number;
  idDepartamento: number;
  nombre: string;
  codigoPuesto: string;
  sueldoBase: number | null;
  activo: boolean;
}

export const empleadoService = {
  getEmpleados: async (idEmpresa?: number): Promise<Empleado[]> => {
    const params = idEmpresa ? { idEmpresa: idEmpresa.toString() } : {};
    const res = await api.get<Empleado[]>("/api/Empleados", { params });
    if (res.status >= 400) {
      throw new Error((res.data as { message?: string })?.message || "No se pudieron cargar los empleados");
    }
    return asArray<Empleado>(res.data);
  },

  getEmpleado: async (id: number): Promise<Empleado> => {
    const res = await api.get<Empleado>(`/api/Empleados/${id}`);
    return res.data;
  },

  createEmpleado: async (empleado: EmpleadoCreate): Promise<{ idEmpleado: number }> => {
    const res = await api.post<{ idEmpleado: number }>(
      "/api/Empleados",
      payloadEmpleado(empleado),
    );
    if (res.status >= 400) {
      throw new Error(mensajeErrorEmpleado(res.data, "No se pudo crear el empleado"));
    }
    return res.data;
  },

  updateEmpleado: async (empleado: EmpleadoUpdate): Promise<void> => {
    const res = await api.put("/api/Empleados", payloadEmpleado(empleado));
    if (res.status >= 400) {
      throw new Error(
        mensajeErrorEmpleado(res.data, "No se pudo actualizar el empleado"),
      );
    }
  },

  deleteEmpleado: async (id: number): Promise<void> => {
    const res = await api.delete(`/api/Empleados/${id}`);
    if (res.status >= 400) {
      throw new Error((res.data as { message?: string })?.message || "No se pudo inactivar el empleado");
    }
  },

  activarEmpleado: async (id: number): Promise<void> => {
    await api.put(`/api/Empleados/Activar/${id}`);
  },

  getDepartamentos: async (idEmpresa: number): Promise<Departamento[]> => {
    const res = await api.get<Departamento[]>(`/api/Empleados/departamentos/${idEmpresa}`);
    return asArray<Departamento>(res.data);
  },

  getPuestos: async (idDepartamento: number): Promise<Puesto[]> => {
    const res = await api.get<Puesto[]>(`/api/Empleados/puestos/${idDepartamento}`);
    return asArray<Puesto>(res.data);
  },

  getPrestamos: async (idEmpleado: number): Promise<EmpleadoPrestamo[]> => {
    const res = await api.get<EmpleadoPrestamo[]>(`/api/Empleados/${idEmpleado}/prestamos`);
    return asArray<EmpleadoPrestamo>(res.data);
  },

  savePrestamo: async (
    idEmpleado: number,
    data: EmpleadoPrestamoSave,
    idPrestamo?: number
  ): Promise<EmpleadoPrestamo> => {
    const res = idPrestamo
      ? await api.put<EmpleadoPrestamo>(`/api/Empleados/${idEmpleado}/prestamos/${idPrestamo}`, data)
      : await api.post<EmpleadoPrestamo>(`/api/Empleados/${idEmpleado}/prestamos`, data);
    if (res.status >= 400) throw new Error((res.data as { message?: string })?.message || "Error al guardar crédito");
    return res.data;
  },

  deletePrestamo: async (idEmpleado: number, idPrestamo: number): Promise<void> => {
    await api.delete(`/api/Empleados/${idEmpleado}/prestamos/${idPrestamo}`);
  },

  getVacaciones: async (idEmpleado: number): Promise<EmpleadoVacacion[]> => {
    const res = await api.get<EmpleadoVacacion[]>(`/api/Empleados/${idEmpleado}/vacaciones`);
    return asArray<EmpleadoVacacion>(res.data);
  },

  saveVacacion: async (idEmpleado: number, data: EmpleadoVacacionSave): Promise<EmpleadoVacacion> => {
    const res = await api.post<EmpleadoVacacion>(`/api/Empleados/${idEmpleado}/vacaciones`, data);
    if (res.status >= 400) throw new Error((res.data as { message?: string })?.message || "Error al guardar vacaciones");
    return res.data;
  },

  generarVacacion: async (idEmpleado: number, anio?: number): Promise<EmpleadoVacacion> => {
    const year = anio ?? new Date().getFullYear();
    const existing = asArray<EmpleadoVacacion>(
      (await api.get<EmpleadoVacacion[]>(`/api/Empleados/${idEmpleado}/vacaciones`)).data
    ).find((v) => v.anio === year);
    if (existing) return existing;

    const res = await api.post<EmpleadoVacacion>(
      `/api/Empleados/${idEmpleado}/generar-vacaciones`,
      {},
      { params: { anio: year } }
    );
    if (res.status < 400) return res.data;

    const payload: EmpleadoVacacionSave = {
      anio: year,
      diasLey: 0,
      diasAdicionales: 0,
      diasTomados: 0,
      diasAplicarNomina: 0,
      primaPorcentaje: 25,
      pagarPrimaEnNomina: false,
      primaAplicarNomina: 0,
      primaPagadaAnio: 0,
      activo: true,
    };
    const fallback = await api.post<EmpleadoVacacion>(`/api/Empleados/${idEmpleado}/vacaciones`, payload);
    if (fallback.status >= 400) {
      const msg =
        (res.data as { message?: string })?.message ||
        (fallback.data as { message?: string })?.message ||
        `Error al generar saldo (${res.status})`;
      throw new Error(msg);
    }
    return fallback.data;
  },
};

export interface EmpleadoPrestamo {
  idPrestamo: number;
  idEmpleado: number;
  idEmpresa: number;
  tipoPrestamo: string;
  claveTipoDeduccionSat?: string | null;
  numeroCredito?: string | null;
  claveTipoDescuento?: string | null;
  valorDescuento: number;
  salarioMinimoReferencia: number;
  importeOriginal: number;
  importeRestante: number;
  numeroPagos: number;
  pagosRestantes: number;
  pagoQuincenal: number;
  tasaInteres: number;
  plazoMeses?: number | null;
  topeDescuento?: number | null;
  fechaInicio: string;
  fechaFin?: string | null;
  fechaAvisoRetencion?: string | null;
  institucion?: string | null;
  activo: boolean;
  observaciones?: string | null;
}

export interface EmpleadoPrestamoSave {
  tipoPrestamo: string;
  claveTipoDeduccionSat?: string | null;
  numeroCredito?: string | null;
  claveTipoDescuento?: string | null;
  valorDescuento: number;
  salarioMinimoReferencia: number;
  importeOriginal: number;
  importeRestante: number;
  numeroPagos: number;
  pagosRestantes: number;
  pagoQuincenal: number;
  tasaInteres: number;
  plazoMeses?: number | null;
  topeDescuento?: number | null;
  fechaInicio: string;
  fechaFin?: string | null;
  fechaAvisoRetencion?: string | null;
  institucion?: string | null;
  activo: boolean;
  observaciones?: string | null;
}

export interface EmpleadoVacacion {
  idVacacion: number;
  idEmpleado: number;
  idEmpresa: number;
  anio: number;
  diasLey: number;
  diasAdicionales: number;
  diasTomados: number;
  diasPendientes: number;
  diasAplicarNomina: number;
  primaPorcentaje: number;
  pagarPrimaEnNomina: boolean;
  primaAplicarNomina: number;
  primaPagadaAnio: number;
  observaciones?: string | null;
  activo: boolean;
  aniosAntiguedad: number;
  fechaIngreso: string;
}

export interface EmpleadoVacacionSave {
  anio: number;
  diasLey: number;
  diasAdicionales: number;
  diasTomados: number;
  diasAplicarNomina: number;
  primaPorcentaje: number;
  pagarPrimaEnNomina: boolean;
  primaAplicarNomina: number;
  primaPagadaAnio: number;
  observaciones?: string | null;
  activo: boolean;
}
