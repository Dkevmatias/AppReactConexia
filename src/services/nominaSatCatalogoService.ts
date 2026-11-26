/* NOMCONEXIA-UNIFY */
import { api, asArray } from "./apiServices";

export interface CatalogoSatItem {
  clave: string;
  descripcion: string;
}

export interface SatCatalogosTodos {
  tipoNomina: CatalogoSatItem[];
  periodicidadPago: CatalogoSatItem[];
  tipoRegimen: CatalogoSatItem[];
  tipoContrato: CatalogoSatItem[];
  tipoJornada: CatalogoSatItem[];
  riesgoPuesto: CatalogoSatItem[];
  tipoPercepcion: CatalogoSatItem[];
  tipoHoraExtra: CatalogoSatItem[];
  tipoIncapacidad: CatalogoSatItem[];
  tipoDeduccion: CatalogoSatItem[];
  tipoOtroPago: CatalogoSatItem[];
  bancos: CatalogoSatItem[];
  origenRecurso: CatalogoSatItem[];
  regimenFiscal: CatalogoSatItem[];
  estados: CatalogoSatItem[];
  tipoCreditoInfonavit: CatalogoSatItem[];
}

function asSatList(data: unknown): CatalogoSatItem[] {
  return asArray<CatalogoSatItem>(data);
}

export function satSelectOptions(items: CatalogoSatItem[], emptyLabel?: string) {
  const opts = asSatList(items).map((c) => ({
    value: c.clave,
    label: `${c.clave} - ${c.descripcion}`,
  }));
  return emptyLabel ? [{ value: "", label: emptyLabel }, ...opts] : opts;
}

const emptyTodos = (): SatCatalogosTodos => ({
  tipoNomina: [],
  periodicidadPago: [],
  tipoRegimen: [],
  tipoContrato: [],
  tipoJornada: [],
  riesgoPuesto: [],
  tipoPercepcion: [],
  tipoHoraExtra: [],
  tipoIncapacidad: [],
  tipoDeduccion: [],
  tipoOtroPago: [],
  bancos: [],
  origenRecurso: [],
  regimenFiscal: [],
  estados: [],
  tipoCreditoInfonavit: [],
});

export const satCatalogoService = {
  getTodos: async (): Promise<SatCatalogosTodos> => {
    const res = await api.get<SatCatalogosTodos>("/api/SatCatalogos/Todos");
    const data = res.data;
    if (!data || typeof data !== "object") return emptyTodos();
    return {
      tipoNomina: asSatList(data.tipoNomina),
      periodicidadPago: asSatList(data.periodicidadPago),
      tipoRegimen: asSatList(data.tipoRegimen),
      tipoContrato: asSatList(data.tipoContrato),
      tipoJornada: asSatList(data.tipoJornada),
      riesgoPuesto: asSatList(data.riesgoPuesto),
      tipoPercepcion: asSatList(data.tipoPercepcion),
      tipoHoraExtra: asSatList(data.tipoHoraExtra),
      tipoIncapacidad: asSatList(data.tipoIncapacidad),
      tipoDeduccion: asSatList(data.tipoDeduccion),
      tipoOtroPago: asSatList(data.tipoOtroPago),
      bancos: asSatList(data.bancos),
      origenRecurso: asSatList(data.origenRecurso),
      regimenFiscal: asSatList(data.regimenFiscal),
      estados: asSatList(data.estados),
      tipoCreditoInfonavit: asSatList(data.tipoCreditoInfonavit),
    };
  },

  getTipoContrato: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/TipoContrato");
    return asSatList(res.data);
  },

  getTipoRegimen: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/TipoRegimen");
    return asSatList(res.data);
  },

  getTipoJornada: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/TipoJornada");
    return asSatList(res.data);
  },

  getRiesgoPuesto: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/RiesgoPuesto");
    return asSatList(res.data);
  },

  getBancos: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/Bancos");
    return asSatList(res.data);
  },

  getRegimenFiscal: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/RegimenFiscal");
    return asSatList(res.data);
  },

  getEstados: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/Estados");
    return asSatList(res.data);
  },

  getPeriodicidadPago: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/PeriodicidadPago");
    return asSatList(res.data);
  },

  getTipoNomina: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/TipoNomina");
    return asSatList(res.data);
  },

  getTipoCreditoInfonavit: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/TipoCreditoInfonavit");
    return asSatList(res.data);
  },

  getTipoPercepcion: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/TipoPercepcion");
    return asSatList(res.data);
  },

  getTipoDeduccion: async (): Promise<CatalogoSatItem[]> => {
    const res = await api.get("/api/SatCatalogos/TipoDeduccion");
    return asSatList(res.data);
  },

  seedDemo: async (): Promise<{
    message?: string;
    idEmpresa: number;
    idPeriodo: number;
    idNomina: number;
    empleadosActivos: number;
  }> => {
    const res = await api.post<{
      message?: string;
      idEmpresa: number;
      idPeriodo: number;
      idNomina: number;
      empleadosActivos: number;
    }>("/api/Seed/demo");
    if (res.status >= 400) {
      const msg =
        (res.data as { message?: string })?.message ||
        `Error al cargar demo (${res.status})`;
      throw new Error(msg);
    }
    return res.data;
  },
};
