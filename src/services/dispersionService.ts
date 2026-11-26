/* NOMCONEXIA-UNIFY */
import { api, asArray } from "./apiServices";

export interface PlantillaDispersion {
  idPlantilla: number;
  clave: string;
  nombre: string;
  banco: string | null;
  tipoFormato: string;
  extension: string;
  requiereClabe: boolean;
  notas: string | null;
}

export interface DispersionRenglon {
  idNominaDetalle: number;
  idEmpleado: number;
  numeroEmpleado: string | null;
  nombre: string;
  rfc: string | null;
  banco: string | null;
  cuenta: string | null;
  clabe: string | null;
  importe: number;
  referencia: string | null;
  incluido: boolean;
  motivoOmitido: string | null;
}

export interface DispersionPreview {
  idNomina: number;
  numeroNomina: string;
  empresaNombre: string;
  clavePlantilla: string;
  plantillaNombre: string;
  nombreArchivo: string;
  totalRegistros: number;
  totalOmitidos: number;
  totalImporte: number;
  advertenciaEmpresa: string | null;
  renglones: DispersionRenglon[];
  lineasPreview: string[];
}

export const dispersionService = {
  getPlantillas: async (): Promise<PlantillaDispersion[]> => {
    const res = await api.get("/api/dispersion/plantillas");
    return asArray<PlantillaDispersion>(res.data);
  },

  preview: async (idNomina: number, clave: string): Promise<DispersionPreview> => {
    const res = await api.get(`/api/nominas/${idNomina}/dispersion`, { params: { clave } });
    if (res.status >= 400) {
      const msg = (res.data as { message?: string })?.message || "No se pudo armar la dispersión";
      throw new Error(msg);
    }
    return res.data as DispersionPreview;
  },

  descargar: async (idNomina: number, clave: string, nombreArchivo: string): Promise<void> => {
    const res = await api.get(`/api/nominas/${idNomina}/dispersion/archivo`, {
      params: { clave },
      responseType: "blob",
    });
    if (res.status >= 400) {
      throw new Error("No se pudo generar el archivo de dispersión");
    }
    const blob = res.data as Blob;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo || "dispersion.txt";
    a.click();
    URL.revokeObjectURL(url);
  },
};
