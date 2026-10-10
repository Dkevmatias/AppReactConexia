import { api } from "./apiServices";

export interface Articulo {
  sociedad: string;
  articulo: string;
  codigoProveedor: string;
  unidadMedida: string;
  descripcion: string;
  disponible: number;
  precio: number;
  almacen: string;
}

export const articuloService = {
  buscarArticulos: async (
    termino: string,
    exacto = false,
  ): Promise<Articulo[]> => {
    try {
      const qs = new URLSearchParams({ codigo: termino });
      if (exacto) qs.set("exacto", "true");
      const response = await api.get(
        `/api/Inventario/BuscarArticulosCodialub?${qs.toString()}`,
      );
      const data = response.data;
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.data && Array.isArray(data.data)) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error("Error fetching articulos:", error);
      return [];
    }
  },
};
