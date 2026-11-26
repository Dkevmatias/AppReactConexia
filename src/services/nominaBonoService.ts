/* NOMCONEXIA-UNIFY */
import { api, asArray, apiError } from "./apiServices";

export interface NominaBono {
  idBono: number;
  idEmpresa: number | null;
  empresaNombre?: string | null;
  anio: number;
  monto: number;
  activo: boolean;
}

export interface NominaBonoSave {
  idEmpresa: number;
  anio: number;
  monto: number;
  activo: boolean;
}

export const nominaBonoService = {
  getByEmpresa: async (idEmpresa: number, anio?: number): Promise<NominaBono[]> => {
    const params: Record<string, string> = { empresa: String(idEmpresa) };
    if (anio) params.anio = String(anio);
    const res = await api.get<NominaBono[]>("/api/NominaBonos", { params });
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudieron cargar los bonos"));
    return asArray<NominaBono>(res.data);
  },

  resolver: async (idEmpresa: number, anio?: number): Promise<NominaBono | null> => {
    const params: Record<string, string> = { empresa: String(idEmpresa) };
    if (anio) params.anio = String(anio);
    const res = await api.get<NominaBono | null>("/api/NominaBonos/resolver", { params });
    if (res.status === 404 || res.status === 204 || !res.data) return null;
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo resolver el bono"));
    return res.data;
  },

  create: async (dto: NominaBonoSave): Promise<NominaBono> => {
    const res = await api.post<NominaBono>("/api/NominaBonos", dto);
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo crear el bono"));
    return res.data;
  },

  update: async (dto: NominaBonoSave & { idBono: number }): Promise<void> => {
    const res = await api.put("/api/NominaBonos", dto);
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo actualizar el bono"));
  },

  inactivar: async (idBono: number): Promise<void> => {
    const res = await api.delete(`/api/NominaBonos/${idBono}`);
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo inactivar el bono"));
  },
};
