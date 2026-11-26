/* NOMCONEXIA-UNIFY */
import { api, asArray } from "./apiServices";

export interface CuotaImss {
  idCuota: number;
  anio: number;
  tipo: string;
  concepto: string;
  ramo: string | null;
  tipoCalculo: string;
  porcentaje: number;
  cuotaFija: number;
  umaDesde: number;
  topeUma: number;
  smdf: number;
  factorIntegracion: number;
  activo: boolean;
}

export interface MapeoContable {
  idMapeo: number;
  idEmpresa: number | null;
  empresaNombre: string | null;
  claveConcepto: string;
  descripcion: string;
  cuentaMayor: string;
  nombreCuenta: string | null;
  naturaleza: string;
  campoNomina: string | null;
  orden: number;
  activo: boolean;
}

export const fiscalCatalogoService = {
  getCuotas: async (anio?: number, tipo?: string): Promise<CuotaImss[]> => {
    const res = await api.get("/api/cuotas-imss", { params: { anio, tipo } });
    return asArray<CuotaImss>(res.data);
  },

  getAniosCuotas: async (): Promise<number[]> => {
    const res = await api.get<number[]>("/api/cuotas-imss/anios");
    return asArray<number>(res.data);
  },

  createCuota: async (dto: Partial<CuotaImss>): Promise<CuotaImss> => {
    const res = await api.post<CuotaImss>("/api/cuotas-imss", dto);
    return res.data;
  },

  updateCuota: async (dto: CuotaImss): Promise<void> => {
    await api.put("/api/cuotas-imss", dto);
  },

  deleteCuota: async (id: number): Promise<void> => {
    await api.delete(`/api/cuotas-imss/${id}`);
  },

  copiarAnio: async (anioOrigen: number, anioDestino: number): Promise<string> => {
    const res = await api.post<{ message?: string }>("/api/cuotas-imss/copiar", {
      anioOrigen,
      anioDestino,
    });
    if (res.status >= 400) {
      const msg = (res.data as { message?: string })?.message || "No se pudo copiar el año";
      throw new Error(msg);
    }
    return res.data?.message || "Copiado";
  },

  getMapeo: async (idEmpresa?: number): Promise<MapeoContable[]> => {
    const res = await api.get("/api/mapeo-contable", {
      params: idEmpresa ? { idEmpresa } : {},
    });
    return asArray<MapeoContable>(res.data);
  },

  createMapeo: async (dto: Partial<MapeoContable>): Promise<MapeoContable> => {
    const res = await api.post<MapeoContable>("/api/mapeo-contable", dto);
    return res.data;
  },

  updateMapeo: async (dto: MapeoContable): Promise<void> => {
    await api.put("/api/mapeo-contable", dto);
  },

  deleteMapeo: async (id: number): Promise<void> => {
    await api.delete(`/api/mapeo-contable/${id}`);
  },

  sembrarMapeo: async (idEmpresa: number): Promise<string> => {
    const res = await api.post<{ message?: string }>(`/api/mapeo-contable/sembrar/${idEmpresa}`);
    if (res.status >= 400) {
      const msg = (res.data as { message?: string })?.message || "No se pudo sembrar el mapeo";
      throw new Error(msg);
    }
    return res.data?.message || "Listo";
  },
};
