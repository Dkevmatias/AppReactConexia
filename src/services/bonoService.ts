/* NOMCONEXIA-UNIFY */
import { api, asArray } from "./apiServices";

export interface BonoRegla {
  idBonoRegla: number;
  idEmpresa: number;
  empresaNombre?: string | null;
  idPuesto?: number | null;
  puestoNombre?: string | null;
  clave: string;
  tipoCalculo: string;
  montoBase?: number | null;
  porcentajeSueldo?: number | null;
  retardosMax?: number | null;
  faltasMax?: number | null;
  activo: boolean;
}

export const bonoService = {
  getReglas: async (idEmpresa?: number): Promise<BonoRegla[]> => {
    const params = idEmpresa ? { idEmpresa: String(idEmpresa) } : {};
    const res = await api.get("/api/Bonos", { params });
    if (res.status >= 400) return [];
    return asArray<BonoRegla>(res.data);
  },
};

export function montoBonoPuntualidad(reglas: BonoRegla[], sueldoBase = 0, idPuesto?: number | null) {
  const activas = reglas.filter((r) => r.activo !== false && (r.clave || "").toUpperCase() === "PUNTUALIDAD");
  const regla =
    (idPuesto ? activas.find((r) => r.idPuesto === idPuesto) : undefined) ||
    activas.find((r) => !r.idPuesto) ||
    activas[0];
  if (!regla) return 0;
  if ((regla.tipoCalculo || "").toUpperCase() === "PORCENTAJE_SUELDO") {
    return Math.round(sueldoBase * (Number(regla.porcentajeSueldo) || 0) / 100 * 100) / 100;
  }
  return Number(regla.montoBase) || 0;
}
