/* NOMCONEXIA-UNIFY */
import { api, asArray } from "./apiServices";

export interface DashboardKpi {
  totalEmpresas: number;
  totalEmpleados: number;
  totalNominas: number;
  nominasPendientes: number;
  totalNominaMes: number;
  empleadosPorEmpresa: EmpresaEmpleados[];
  nominasPorEstatus: NominaPorEstatus[];
  nominasPorMes: NominaPorMes[];
}

export interface EmpresaEmpleados {
  empresa: string;
  totalEmpleados: number;
}

export interface NominaPorEstatus {
  estatus: string;
  total: number;
}

export interface NominaPorMes {
  mes: string;
  total: number;
  cantidad: number;
}

const emptyDashboard = (): DashboardKpi => ({
  totalEmpresas: 0,
  totalEmpleados: 0,
  totalNominas: 0,
  nominasPendientes: 0,
  totalNominaMes: 0,
  empleadosPorEmpresa: [],
  nominasPorEstatus: [],
  nominasPorMes: [],
});

export const dashboardService = {
  getDashboard: async (): Promise<DashboardKpi> => {
    const res = await api.get<DashboardKpi>("/api/NominaDashboard");
    if (res.status >= 400) {
      const data = res.data as unknown as { message?: string } | string;
      const msg =
        typeof data === "string"
          ? data
          : data?.message || `Error al cargar el dashboard (${res.status})`;
      throw new Error(msg);
    }
    const d = res.data;
    if (!d || typeof d !== "object") return emptyDashboard();
    return {
      totalEmpresas: d.totalEmpresas ?? 0,
      totalEmpleados: d.totalEmpleados ?? 0,
      totalNominas: d.totalNominas ?? 0,
      nominasPendientes: d.nominasPendientes ?? 0,
      totalNominaMes: d.totalNominaMes ?? 0,
      empleadosPorEmpresa: asArray<EmpresaEmpleados>(d.empleadosPorEmpresa),
      nominasPorEstatus: asArray<NominaPorEstatus>(d.nominasPorEstatus),
      nominasPorMes: asArray<NominaPorMes>(d.nominasPorMes),
    };
  },
};
