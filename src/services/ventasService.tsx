import { api } from "./apiServices";

export const getValidarClientesVentas = async (
  clientes: string,
): Promise<boolean> => {
  const response = await api.get<boolean>(
    `api/Clientes/GetValidarVentasClientes`,
    { params: { clientes } },
  );

  return response.data;
};
