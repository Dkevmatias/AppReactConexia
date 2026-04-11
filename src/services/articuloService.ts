import { api } from "./apiServices";

export interface Articulo {
  sociedad: string;
  articulo: string;
  descripcion: string;
  disponible: number;
  precio: number;
  almacen: string;
}

export const articuloService = {
  buscarArticulos: async (termino: string): Promise<Articulo[]> => {
    try {
      const response = await api.get(
        `/api/Inventario/BuscarArticulosCodialub?codigo=${encodeURIComponent(termino)}`,
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
