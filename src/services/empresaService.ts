/* NOMCONEXIA-UNIFY */
import { api, asArray } from "./apiServices";

export interface Empresa {
  idEmpresa: number;
  nombre: string;
  rfc: string;
  regimenFiscal: string | null;
  registroPatronal: string | null;
  representanteLegal: string | null;
  idPeriodicidad: number;
  periodicidadNombre: string | null;
  telefono: string | null;
  correo: string | null;
  razonSocial?: string | null;
  codigoPostal?: string | null;
  claveBancoEmpresa?: string | null;
  cuentaCargo?: string | null;
  clabeEmpresa?: string | null;
  convenioDispersion?: string | null;
  activo: boolean;
  fechaCreacion: string;
}

export interface EmpresaCreate {
  /** NOMCONEXIA-UNIFY: IdEmpresa del CRM (Personas / sucursal), no identity. */
  idEmpresa?: number;
  nombre: string;
  rfc: string;
  regimenFiscal?: string | null;
  registroPatronal?: string | null;
  representanteLegal?: string | null;
  idPeriodicidad: number;
  telefono?: string | null;
  correo?: string | null;
  razonSocial?: string | null;
  codigoPostal?: string | null;
  claveBancoEmpresa?: string | null;
  cuentaCargo?: string | null;
  clabeEmpresa?: string | null;
  convenioDispersion?: string | null;
}

export interface EmpresaUpdate extends EmpresaCreate {
  idEmpresa: number;
}

export interface Periodicidad {
  idPeriodicidad: number;
  nombre: string;
  diasEntrePagos: number;
}

export const empresaService = {
  getEmpresas: async (): Promise<Empresa[]> => {
    const res = await api.get<Empresa[]>("/api/EmpresasNomina");
    if (res.status >= 400) {
      throw new Error((res.data as { message?: string })?.message || "No se pudieron cargar las empresas");
    }
    return asArray<Empresa>(res.data);
  },

  getEmpresa: async (id: number): Promise<Empresa> => {
    const res = await api.get<Empresa>(`/api/EmpresasNomina/${id}`);
    return res.data;
  },

  createEmpresa: async (empresa: EmpresaCreate): Promise<Empresa> => {
    const res = await api.post<Empresa>("/api/EmpresasNomina", empresa);
    return res.data;
  },

  updateEmpresa: async (empresa: EmpresaUpdate): Promise<void> => {
    await api.put("/api/EmpresasNomina", empresa);
  },

  deleteEmpresa: async (id: number): Promise<void> => {
    await api.delete(`/api/EmpresasNomina/${id}`);
  },

  activarEmpresa: async (id: number): Promise<void> => {
    await api.put(`/api/EmpresasNomina/Activar/${id}`);
  },

  getPeriodicidades: async (): Promise<Periodicidad[]> => {
    const res = await api.get<Periodicidad[]>("/api/EmpresasNomina/periodicidades");
    return asArray<Periodicidad>(res.data);
  },
};
