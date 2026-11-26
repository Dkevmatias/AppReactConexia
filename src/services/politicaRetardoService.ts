/* NOMCONEXIA-UNIFY */
import { api, asArray, apiError } from "./apiServices";

export interface PoliticaRetardo {
  idPolitica: number;
  idEmpresa: number;
  idEmpleado: number | null;
  empleadoNombre?: string | null;
  horaEntrada: string;
  toleranciaMinutos: number;
  minutosFalta: number;
  horaLimiteRetardo?: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  motivo: string | null;
  activo: boolean;
}

export interface PoliticaRetardoEmpresa {
  empresa: PoliticaRetardo;
  excepciones: PoliticaRetardo[];
}

export interface PoliticaRetardoSave {
  idEmpleado?: number | null;
  horaEntrada: string;
  toleranciaMinutos: number;
  minutosFalta: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  motivo?: string | null;
  activo: boolean;
}

export function horaToInput(value?: string | null) {
  const m = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "08:30";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export function horaToApi(value: string) {
  const m = String(value || "").match(/^(\d{1,2}):(\d{2})/);
  if (!m) return "08:30:00";
  return `${m[1].padStart(2, "0")}:${m[2]}:00`;
}

export function fechaToInput(value?: string | null) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

export const POLITICA_RETARDO_DEFAULT: PoliticaRetardo = {
  idPolitica: 0,
  idEmpresa: 0,
  idEmpleado: null,
  horaEntrada: "08:30:00",
  toleranciaMinutos: 10,
  minutosFalta: 60,
  horaLimiteRetardo: "08:40",
  fechaInicio: null,
  fechaFin: null,
  motivo: null,
  activo: true,
};

export const politicaRetardoService = {
  getByEmpresa: async (idEmpresa: number): Promise<PoliticaRetardoEmpresa> => {
    const res = await api.get<PoliticaRetardoEmpresa>(`/api/EmpresasNomina/${idEmpresa}/politica-retardo`);
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo cargar la política de retardo"));
    return {
      empresa: res.data.empresa,
      excepciones: asArray<PoliticaRetardo>(res.data.excepciones),
    };
  },

  saveEmpresa: async (idEmpresa: number, dto: PoliticaRetardoSave): Promise<PoliticaRetardo> => {
    const res = await api.put<PoliticaRetardo>(`/api/EmpresasNomina/${idEmpresa}/politica-retardo`, dto);
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo guardar la política de la empresa"));
    return res.data;
  },

  saveExcepcion: async (
    idEmpresa: number,
    dto: PoliticaRetardoSave,
    idPolitica?: number | null
  ): Promise<PoliticaRetardo> => {
    const res = idPolitica
      ? await api.put<PoliticaRetardo>(
          `/api/EmpresasNomina/${idEmpresa}/politica-retardo/excepciones/${idPolitica}`,
          dto
        )
      : await api.post<PoliticaRetardo>(`/api/EmpresasNomina/${idEmpresa}/politica-retardo/excepciones`, dto);
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo guardar la excepción"));
    return res.data;
  },

  deleteExcepcion: async (idEmpresa: number, idPolitica: number): Promise<void> => {
    const res = await api.delete(`/api/EmpresasNomina/${idEmpresa}/politica-retardo/excepciones/${idPolitica}`);
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo eliminar la excepción"));
  },
};
