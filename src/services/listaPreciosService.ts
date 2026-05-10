import { api } from "./apiServices";

/** Endpoints del backend para listas de precio. */
const LISTADO_URL = "/api/ListasPrecio";
const DESCARGAR_URL = "/api/ListasPrecio/descargar";

export interface ArchivoListaPrecios {
  nombre: string;
  extension: string;
  tamanoBytes: number;
  ultimaModificacionUtc: string;
}

export interface MarcaListaPrecios {
  marca: string;
  archivos: ArchivoListaPrecios[];
}

function mimeParaExtension(extension: string): string {
  const e = extension.toLowerCase();
  if (e === ".pdf") return "application/pdf";
  if (e === ".xlsx" || e === ".xls")
    return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  return "application/octet-stream";
}

export const listaPreciosService = {
  getListado: async (): Promise<MarcaListaPrecios[]> => {
    const response = await api.get<MarcaListaPrecios[]>(LISTADO_URL);
    if (response.status !== 200) {
      throw new Error("No se pudo cargar el listado de precios.");
    }
    const data = response.data;
    return Array.isArray(data) ? data : [];
  },

  descargarArchivo: async (
    marca: string,
    archivo: ArchivoListaPrecios,
  ): Promise<void> => {
    const downloadUrl = `${DESCARGAR_URL}/${encodeURIComponent(marca)}/${encodeURIComponent(archivo.nombre)}`;

    const response = await api.get(downloadUrl, {
      responseType: "blob",
      timeout: 120000,
    });

    if (response.status < 200 || response.status >= 300) {
      let mensaje = "Error al descargar el archivo.";
      try {
        const text = await (response.data as Blob).text();
        if (text) mensaje = text;
      } catch {
        /* usar mensaje por defecto */
      }
      throw new Error(mensaje);
    }

    const blob = new Blob([response.data], {
      type: mimeParaExtension(archivo.extension),
    });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = archivo.nombre;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  },
};
