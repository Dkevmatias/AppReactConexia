import { api } from "./apiServices";

export type EstatusCrm = "A" | "I" | string;

export interface EntidadNegocio {
  idEntidadNegocio: number;
  nombre: string;
  estatus: EstatusCrm;
}

export interface EntidadNegocioPayload {
  nombre: string;
  estatus: EstatusCrm;
}

export interface EntidadServicio {
  idEntidadServicio?: number;
  idEntidadNegocio?: number;
  nombre: string;
  estatus: EstatusCrm;
}

export interface EntidadServicioPayload {
  nombre: string;
  estatus: EstatusCrm;
  idEntidadNegocio?: number;
}

export interface Etapa {
  idEtapa: number;
  nombre: string;
  estatus: EstatusCrm;
}

export interface EtapaPayload {
  nombre: string;
  estatus: EstatusCrm;
}

export interface EtapaConfiguracion {
  idEtapaConfiguracion: number;
  idEtapa: number;
  orden: number;
  estatus: EstatusCrm;
  nombre?: string;
  etapa?: Etapa;
}

export interface EtapaConfiguracionPayload {
  idEtapa: number;
  orden: number;
  estatus: EstatusCrm;
}

export interface Fuente {
  idFuente: number;
  nombre: string;
  estatus: EstatusCrm;
  tipoFuente: string;
}

export interface FuentePayload {
  nombre: string;
  estatus: EstatusCrm;
  tipoFuente: string;
}

export interface Seguimiento {
  idSeguimiento: number;
  nombre: string;
  estatus: EstatusCrm;
}

export interface SeguimientoPayload {
  nombre: string;
  estatus: EstatusCrm;
}

export interface EstatusCatalogo {
  idEstatus: number;
  idTipoEstatus: number;
  nombre: string;
  estatus: EstatusCrm;
  tipoEstatus?: TipoEstatusCatalogo;
}

export interface EstatusCatalogoPayload {
  idTipoEstatus: number;
  nombre: string;
  estatus: EstatusCrm;
}

export interface TipoEstatusCatalogo {
  idTipoEstatus: number;
  nombre: string;
  estatus: EstatusCrm;
}

export interface TipoEstatusCatalogoPayload {
  nombre: string;
  estatus: EstatusCrm;
}

function errorDesdeRespuesta(data: unknown, fallback: string): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    if (typeof o.mensaje === "string" && o.mensaje) return o.mensaje;
  }
  return fallback;
}

function assertOk<T>(response: { status: number; data: T }, fallback: string): T {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(errorDesdeRespuesta(response.data, fallback));
  }
  return response.data;
}

function normalizeArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as T[];
    if (Array.isArray(o.items)) return o.items as T[];
  }
  return [];
}

export const ESTATUS_ACTIVO: EstatusCrm = "A";
export const ESTATUS_INACTIVO: EstatusCrm = "I";

export const crmService = {
  getEntidadesNegocio: async (): Promise<EntidadNegocio[]> => {
    const response = await api.get<unknown>(
      "/api/EntidadNegocio/GetEntidadesNegocio",
    );
    return normalizeArray<EntidadNegocio>(
      assertOk(response, "No se pudieron cargar las entidades de negocio."),
    );
  },

  getEntidadNegocio: async (id: number): Promise<EntidadNegocio> => {
    const response = await api.get<EntidadNegocio>(`/api/EntidadNegocio/${id}`);
    return assertOk(response, "No se pudo cargar la entidad de negocio.");
  },

  crearEntidadNegocio: async (
    payload: EntidadNegocioPayload,
  ): Promise<EntidadNegocio> => {
    const response = await api.post<EntidadNegocio>(
      "/api/EntidadNegocio",
      payload,
    );
    return assertOk(response, "No se pudo crear la entidad de negocio.");
  },

  actualizarEntidadNegocio: async (
    id: number,
    payload: EntidadNegocioPayload,
  ): Promise<EntidadNegocio> => {
    const response = await api.put<EntidadNegocio>(
      `/api/EntidadNegocio/${id}`,
      payload,
    );
    return assertOk(response, "No se pudo actualizar la entidad de negocio.");
  },

  eliminarEntidadNegocio: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/EntidadNegocio/${id}`);
    assertOk(response, "No se pudo eliminar la entidad de negocio.");
  },

  getEntidadesServicio: async (): Promise<EntidadServicio[]> => {
    const response = await api.get<unknown>(
      "/api/EntidadServicios/GetEntidadesServicio",
    );
    return normalizeArray<EntidadServicio>(
      assertOk(response, "No se pudieron cargar los tipos de servicio."),
    );
  },

  getEntidadServicio: async (id: number): Promise<EntidadServicio> => {
    const response = await api.get<EntidadServicio>(
      `/api/EntidadServicios/${id}`,
    );
    return assertOk(response, "No se pudo cargar el tipo de servicio.");
  },

  crearEntidadServicio: async (
    payload: EntidadServicioPayload,
  ): Promise<EntidadServicio> => {
    const response = await api.post<EntidadServicio>(
      "/api/EntidadServicios",
      payload,
    );
    return assertOk(response, "No se pudo crear el tipo de servicio.");
  },

  actualizarEntidadServicio: async (
    id: number,
    payload: EntidadServicioPayload,
  ): Promise<EntidadServicio> => {
    const response = await api.put<EntidadServicio>(
      `/api/EntidadServicios/${id}`,
      payload,
    );
    return assertOk(response, "No se pudo actualizar el tipo de servicio.");
  },

  eliminarEntidadServicio: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/EntidadServicios/${id}`);
    assertOk(response, "No se pudo eliminar el tipo de servicio.");
  },

  getEtapas: async (): Promise<Etapa[]> => {
    const response = await api.get<unknown>("/api/Etapas/GetEtapas");
    return normalizeArray<Etapa>(assertOk(response, "No se pudieron cargar las etapas."));
  },

  getEtapa: async (id: number): Promise<Etapa> => {
    const response = await api.get<Etapa>(`/api/Etapas/${id}`);
    return assertOk(response, "No se pudo cargar la etapa.");
  },

  crearEtapa: async (payload: EtapaPayload): Promise<Etapa> => {
    const response = await api.post<Etapa>("/api/Etapas", payload);
    return assertOk(response, "No se pudo crear la etapa.");
  },

  actualizarEtapa: async (id: number, payload: EtapaPayload): Promise<Etapa> => {
    const response = await api.put<Etapa>(`/api/Etapas/${id}`, payload);
    return assertOk(response, "No se pudo actualizar la etapa.");
  },

  eliminarEtapa: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/Etapas/${id}`);
    assertOk(response, "No se pudo eliminar la etapa.");
  },

  getEtapaConfiguraciones: async (): Promise<EtapaConfiguracion[]> => {
    const response = await api.get<unknown>("/api/EtapaConfiguracion");
    return normalizeArray<EtapaConfiguracion>(
      assertOk(response, "No se pudo cargar la configuración del funnel."),
    );
  },

  getEtapaConfiguracion: async (id: number): Promise<EtapaConfiguracion> => {
    const response = await api.get<EtapaConfiguracion>(
      `/api/EtapaConfiguracion/${id}`,
    );
    return assertOk(response, "No se pudo cargar la configuración del funnel.");
  },

  getEtapaConfiguracionPorEtapa: async (
    idEtapa: number,
  ): Promise<EtapaConfiguracion[]> => {
    const response = await api.get<unknown>(
      `/api/EtapaConfiguracion/etapa/${idEtapa}`,
    );
    return normalizeArray<EtapaConfiguracion>(
      assertOk(
        response,
        "No se pudo cargar la configuración del funnel para la etapa.",
      ),
    );
  },

  crearEtapaConfiguracion: async (
    payload: EtapaConfiguracionPayload,
  ): Promise<EtapaConfiguracion> => {
    const response = await api.post<EtapaConfiguracion>(
      "/api/EtapaConfiguracion",
      payload,
    );
    return assertOk(response, "No se pudo agregar la etapa al funnel.");
  },

  actualizarEtapaConfiguracion: async (
    id: number,
    payload: EtapaConfiguracionPayload,
  ): Promise<EtapaConfiguracion> => {
    const response = await api.put<EtapaConfiguracion>(
      `/api/EtapaConfiguracion/${id}`,
      payload,
    );
    return assertOk(response, "No se pudo actualizar la configuración del funnel.");
  },

  eliminarEtapaConfiguracion: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/EtapaConfiguracion/${id}`);
    assertOk(response, "No se pudo quitar la etapa del funnel.");
  },

  getFuentes: async (): Promise<Fuente[]> => {
    const response = await api.get<unknown>("/api/Fuentes");
    return normalizeArray<Fuente>(
      assertOk(response, "No se pudieron cargar las fuentes."),
    );
  },

  getFuente: async (id: number): Promise<Fuente> => {
    const response = await api.get<Fuente>(`/api/Fuentes/${id}`);
    return assertOk(response, "No se pudo cargar la fuente.");
  },

  crearFuente: async (payload: FuentePayload): Promise<Fuente> => {
    const response = await api.post<Fuente>("/api/Fuentes", payload);
    return assertOk(response, "No se pudo crear la fuente.");
  },

  actualizarFuente: async (id: number, payload: FuentePayload): Promise<Fuente> => {
    const response = await api.put<Fuente>(`/api/Fuentes/${id}`, payload);
    return assertOk(response, "No se pudo actualizar la fuente.");
  },

  eliminarFuente: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/Fuentes/${id}`);
    assertOk(response, "No se pudo eliminar la fuente.");
  },

  getSeguimientos: async (): Promise<Seguimiento[]> => {
    const response = await api.get<unknown>("/api/Seguimientos");
    return normalizeArray<Seguimiento>(
      assertOk(response, "No se pudieron cargar los seguimientos."),
    );
  },

  getSeguimiento: async (id: number): Promise<Seguimiento> => {
    const response = await api.get<Seguimiento>(`/api/Seguimientos/${id}`);
    return assertOk(response, "No se pudo cargar el seguimiento.");
  },

  crearSeguimiento: async (payload: SeguimientoPayload): Promise<Seguimiento> => {
    const response = await api.post<Seguimiento>("/api/Seguimientos", payload);
    return assertOk(response, "No se pudo crear el seguimiento.");
  },

  actualizarSeguimiento: async (
    id: number,
    payload: SeguimientoPayload,
  ): Promise<Seguimiento> => {
    const response = await api.put<Seguimiento>(
      `/api/Seguimientos/${id}`,
      payload,
    );
    return assertOk(response, "No se pudo actualizar el seguimiento.");
  },

  eliminarSeguimiento: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/Seguimientos/${id}`);
    assertOk(response, "No se pudo eliminar el seguimiento.");
  },

  getEstatusCatalogo: async (): Promise<EstatusCatalogo[]> => {
    const response = await api.get<unknown>("/api/Estatus/GetEstatus");
    return normalizeArray<EstatusCatalogo>(
      assertOk(response, "No se pudieron cargar los estatus."),
    );
  },

  getEstatusCatalogoPorId: async (id: number): Promise<EstatusCatalogo> => {
    const response = await api.get<EstatusCatalogo>(`/api/Estatus/${id}`);
    return assertOk(response, "No se pudo cargar el estatus.");
  },

  crearEstatusCatalogo: async (
    payload: EstatusCatalogoPayload,
  ): Promise<EstatusCatalogo> => {
    const response = await api.post<EstatusCatalogo>("/api/Estatus", payload);
    return assertOk(response, "No se pudo crear el estatus.");
  },

  actualizarEstatusCatalogo: async (
    id: number,
    payload: EstatusCatalogoPayload,
  ): Promise<EstatusCatalogo> => {
    const response = await api.put<EstatusCatalogo>(`/api/Estatus/${id}`, payload);
    return assertOk(response, "No se pudo actualizar el estatus.");
  },

  eliminarEstatusCatalogo: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/Estatus/${id}`);
    assertOk(response, "No se pudo eliminar el estatus.");
  },

  getTipoEstatusCatalogo: async (): Promise<TipoEstatusCatalogo[]> => {
    const response = await api.get<unknown>("/api/TipoEstatus/GetTipoEstatus");
    return normalizeArray<TipoEstatusCatalogo>(
      assertOk(response, "No se pudieron cargar los tipos de estatus."),
    );
  },

  getTipoEstatusCatalogoPorId: async (id: number): Promise<TipoEstatusCatalogo> => {
    const response = await api.get<TipoEstatusCatalogo>(`/api/TipoEstatus/${id}`);
    return assertOk(response, "No se pudo cargar el tipo de estatus.");
  },

  crearTipoEstatusCatalogo: async (
    payload: TipoEstatusCatalogoPayload,
  ): Promise<TipoEstatusCatalogo> => {
    const response = await api.post<TipoEstatusCatalogo>(
      "/api/TipoEstatus",
      payload,
    );
    return assertOk(response, "No se pudo crear el tipo de estatus.");
  },

  actualizarTipoEstatusCatalogo: async (
    id: number,
    payload: TipoEstatusCatalogoPayload,
  ): Promise<TipoEstatusCatalogo> => {
    const response = await api.put<TipoEstatusCatalogo>(
      `/api/TipoEstatus/${id}`,
      payload,
    );
    return assertOk(response, "No se pudo actualizar el tipo de estatus.");
  },

  eliminarTipoEstatusCatalogo: async (id: number): Promise<void> => {
    const response = await api.delete<unknown>(`/api/TipoEstatus/${id}`);
    assertOk(response, "No se pudo eliminar el tipo de estatus.");
  },
};
