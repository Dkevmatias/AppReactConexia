/* NOMCONEXIA-UNIFY */
import { api, asArray, apiError } from "./apiServices";

export interface RelojGeocerca {
  idGeocerca: number;
  idEmpresa: number;
  idSucursal: number;
  nombre: string;
  latitud: number;
  longitud: number;
  radioMetros: number;
  precisionMaxMetros: number;
  requiereRostro: boolean;
  requiereDispositivo: boolean;
  activo: boolean;
  fechaAlta: string;
}

export interface RelojGeocercaSave {
  idEmpresa: number;
  idSucursal: number;
  nombre: string;
  latitud: number;
  longitud: number;
  radioMetros: number;
  precisionMaxMetros: number;
  requiereRostro: boolean;
  requiereDispositivo: boolean;
  activo: boolean;
}

export interface RelojDispositivo {
  idDispositivo: number;
  idPersona?: number | null;
  idEmpresa: number;
  alias?: string | null;
  nombrePersona?: string | null;
  plataforma: string;
  estatus: string;
  asignado: boolean;
  fechaAlta: string;
  fechaRevocacion?: string | null;
}

export interface RelojDispositivoSave {
  idPersona?: number | null;
  idEmpleado?: number | null;
  idEmpresa?: number | null;
  idSucursal?: number | null;
  idDispositivo?: number | null;
  alias?: string | null;
  identificadorDispositivo?: string | null;
  plataforma: "Android" | "iOS";
}

export interface RelojSucursal {
  idSucursal: number;
  nombre: string;
  personas: number;
  geocercasActivas: number;
}

export interface RelojPersonal {
  idPersona: number;
  idEmpleado?: number | null;
  nombre: string;
  idEmpresa: number;
  idSucursal: number;
  email?: string | null;
  tieneUsuario: boolean;
  dispositivoActivo: boolean;
  plantillaVigente: boolean;
  consentimientoAceptado: boolean;
  idDispositivoActivo?: number | null;
  idPlantillaVigente?: number | null;
}

export interface RelojChecada {
  idChecada: number;
  idPersona: number;
  nombrePersona?: string | null;
  idEmpresa: number;
  idSucursal: number;
  idDispositivo: number;
  idPlantilla: number;
  idGeocerca: number;
  geocercaNombre?: string | null;
  tipo: string;
  fechaServidor: string;
  fechaDispositivo?: string | null;
  latitud: number;
  longitud: number;
  precisionMetros: number;
  scoreRostro: number;
  pruebaVidaOk: boolean;
  idChecadaPareja?: number | null;
}

export interface RelojIntento {
  idIntento: number;
  idPersona?: number | null;
  idDispositivo?: number | null;
  tipoIntentado: string;
  fechaServidor: string;
  latitud?: number | null;
  longitud?: number | null;
  precisionMetros?: number | null;
  scoreRostro?: number | null;
  pruebaVidaOk: boolean;
  resultado: string;
  motivo?: string | null;
  idChecada?: number | null;
}

async function readOk<T>(res: { status: number; data: T }, fallback: string): Promise<T> {
  if (res.status === 404) throw new Error(apiError(res.data, fallback));
  if (res.status >= 400) throw new Error(apiError(res.data, fallback));
  return res.data;
}

export const relojService = {
  getGeocercas: async (idEmpresa: number, idSucursal?: number, soloActivas = false): Promise<RelojGeocerca[]> => {
    const res = await api.get<RelojGeocerca[]>("/api/Reloj/geocercas", {
      params: { idEmpresa, idSucursal, soloActivas },
    });
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudieron cargar las geocercas"));
    return asArray<RelojGeocerca>(res.data);
  },

  saveGeocerca: async (dto: RelojGeocercaSave, id?: number): Promise<RelojGeocerca> => {
    const res = id
      ? await api.put<RelojGeocerca>(`/api/Reloj/geocercas/${id}`, dto)
      : await api.post<RelojGeocerca>("/api/Reloj/geocercas", dto);
    return readOk(res, "No se pudo guardar la geocerca");
  },

  getSucursales: async (idEmpresa: number): Promise<RelojSucursal[]> => {
    const res = await api.get<RelojSucursal[]>("/api/Reloj/sucursales", { params: { idEmpresa } });
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudieron cargar las sucursales"));
    return asArray<RelojSucursal>(res.data);
  },

  getPersonal: async (idEmpresa: number, idSucursal?: number): Promise<RelojPersonal[]> => {
    const res = await api.get<RelojPersonal[]>("/api/Reloj/personal", {
      params: { idEmpresa, idSucursal },
    });
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo cargar el personal del reloj"));
    return asArray<RelojPersonal>(res.data);
  },

  getDispositivos: async (opts: { idEmpresa?: number; idPersona?: number }): Promise<RelojDispositivo[]> => {
    const res = await api.get<RelojDispositivo[]>("/api/Reloj/dispositivos", { params: opts });
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudieron cargar los dispositivos"));
    return asArray<RelojDispositivo>(res.data);
  },

  autorizarDispositivo: async (dto: RelojDispositivoSave): Promise<RelojDispositivo> => {
    const res = await api.post<RelojDispositivo>("/api/Reloj/dispositivos", dto);
    return readOk(res, "No se pudo guardar el dispositivo");
  },

  asignarDispositivo: async (
    id: number,
    dto: { idPersona?: number | null; idEmpleado?: number | null; idEmpresa?: number; idSucursal?: number }
  ): Promise<RelojDispositivo> => {
    const res = await api.post<RelojDispositivo>(`/api/Reloj/dispositivos/${id}/asignar`, dto);
    return readOk(res, "No se pudo asignar el dispositivo");
  },

  revocarDispositivo: async (id: number): Promise<void> => {
    const res = await api.post(`/api/Reloj/dispositivos/${id}/revocar`);
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo revocar el dispositivo"));
  },

  enrollarPlantilla: async (dto: {
    idPersona?: number | null;
    idEmpleado?: number | null;
    idEmpresa?: number;
    idSucursal?: number;
    vectorCifradoBase64: string;
    versionModelo?: string;
  }): Promise<{ idPlantilla: number }> => {
    const res = await api.post<{ idPlantilla: number }>("/api/Reloj/plantillas", {
      ...dto,
      versionModelo: dto.versionModelo || "web-rh-1.0",
    });
    return readOk(res, "No se pudo guardar la plantilla facial");
  },

  bajaPlantilla: async (id: number): Promise<void> => {
    const res = await api.post(`/api/Reloj/plantillas/${id}/baja`);
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudo dar de baja la plantilla"));
  },

  getChecadas: async (params: {
    idEmpresa?: number;
    idSucursal?: number;
    idPersona?: number;
    desde?: string;
    hasta?: string;
  }): Promise<RelojChecada[]> => {
    const res = await api.get<RelojChecada[]>("/api/Reloj/checadas", { params });
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudieron cargar las checadas"));
    return asArray<RelojChecada>(res.data);
  },

  getIntentos: async (params: {
    idEmpresa?: number;
    idSucursal?: number;
    idPersona?: number;
    desde?: string;
    hasta?: string;
  }): Promise<RelojIntento[]> => {
    const res = await api.get<RelojIntento[]>("/api/Reloj/intentos", { params });
    if (res.status >= 400) throw new Error(apiError(res.data, "No se pudieron cargar los intentos"));
    return asArray<RelojIntento>(res.data);
  },
};
