/* NOMCONEXIA-UNIFY */
import { api, asArray } from "./apiServices";

// Departamentos
export interface Departamento {
  idDepartamento: number;
  idEmpresa: number;
  empresaNombre: string;
  nombre: string;
  codigo: string;
  centroCosto: string | null;
  categoria: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface DepartamentoCreate {
  idEmpresa: number;
  nombre: string;
  codigo: string;
  centroCosto?: string | null;
  categoria?: string | null;
}

export interface DepartamentoUpdate extends DepartamentoCreate {
  idDepartamento: number;
}

// Puestos
export interface Puesto {
  idPuesto: number;
  idDepartamento: number;
  departamentoNombre: string;
  idEmpresa: number;
  empresaNombre: string;
  nombre: string;
  codigoPuesto: string;
  jerarquia: number | null;
  sueldoBase: number | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface PuestoCreate {
  idDepartamento: number;
  nombre: string;
  codigoPuesto: string;
  jerarquia?: number | null;
  sueldoBase?: number | null;
}

export interface PuestoUpdate extends PuestoCreate {
  idPuesto: number;
}

// Conceptos
export interface Concepto {
  idConcepto: number;
  clave: string;
  descripcion: string;
  tipoConcepto: string;
  tipoConceptoNombre: string;
  gravado: boolean;
  claveSat?: string | null;
  tipoCalculo: string;
  valorCalculo: number;
  esAutomatico: boolean;
  campoOrigen?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface ConceptoCreate {
  clave: string;
  descripcion: string;
  tipoConcepto: string;
  gravado: boolean;
  claveSat?: string | null;
  tipoCalculo: string;
  valorCalculo: number;
  esAutomatico: boolean;
  campoOrigen?: string | null;
}

export interface ConceptoUpdate extends ConceptoCreate {
  idConcepto: number;
}

// Servicios
export const catalogoService = {
  // Departamentos
  getDepartamentos: async (idEmpresa?: number): Promise<Departamento[]> => {
    const params = idEmpresa ? { idEmpresa: idEmpresa.toString() } : {};
    const res = await api.get<Departamento[]>("/api/Departamentos", { params });
    return asArray<Departamento>(res.data);
  },

  getDepartamento: async (id: number): Promise<Departamento> => {
    const res = await api.get<Departamento>(`/api/Departamentos/${id}`);
    return res.data;
  },

  createDepartamento: async (departamento: DepartamentoCreate): Promise<Departamento> => {
    const res = await api.post<Departamento>("/api/Departamentos", departamento);
    return res.data;
  },

  updateDepartamento: async (departamento: DepartamentoUpdate): Promise<void> => {
    await api.put("/api/Departamentos", departamento);
  },

  deleteDepartamento: async (id: number): Promise<void> => {
    await api.delete(`/api/Departamentos/${id}`);
  },

  // Puestos
  getPuestos: async (idEmpresa?: number, idDepartamento?: number): Promise<Puesto[]> => {
    const params: Record<string, string> = {};
    if (idEmpresa) params.idEmpresa = idEmpresa.toString();
    if (idDepartamento) params.idDepartamento = idDepartamento.toString();
    const res = await api.get<Puesto[]>("/api/Puestos", { params });
    return asArray<Puesto>(res.data);
  },

  getPuesto: async (id: number): Promise<Puesto> => {
    const res = await api.get<Puesto>(`/api/Puestos/${id}`);
    return res.data;
  },

  createPuesto: async (puesto: PuestoCreate): Promise<Puesto> => {
    const res = await api.post<Puesto>("/api/Puestos", puesto);
    return res.data;
  },

  updatePuesto: async (puesto: PuestoUpdate): Promise<void> => {
    await api.put("/api/Puestos", puesto);
  },

  deletePuesto: async (id: number): Promise<void> => {
    await api.delete(`/api/Puestos/${id}`);
  },

  // Conceptos
  getConceptos: async (tipo?: string): Promise<Concepto[]> => {
    const params = tipo ? { tipo } : {};
    const res = await api.get<Concepto[]>("/api/Conceptos", { params });
    return asArray<Concepto>(res.data);
  },

  getConcepto: async (id: number): Promise<Concepto> => {
    const res = await api.get<Concepto>(`/api/Conceptos/${id}`);
    return res.data;
  },

  createConcepto: async (concepto: ConceptoCreate): Promise<Concepto> => {
    const res = await api.post<Concepto>("/api/Conceptos", concepto);
    return res.data;
  },

  updateConcepto: async (concepto: ConceptoUpdate): Promise<void> => {
    await api.put("/api/Conceptos", concepto);
  },

  deleteConcepto: async (id: number): Promise<void> => {
    await api.delete(`/api/Conceptos/${id}`);
  },
};
