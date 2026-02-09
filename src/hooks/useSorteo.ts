// hooks/useSorteo.ts
import { useState } from 'react';
import { sorteoService, SorteoRequest, SorteoResponse } from '../services/sorteoServices';

export const useSorteo = () => {
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<SorteoResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrandoGanadores, setMostrandoGanadores] = useState(false);

  const realizarSorteo = async (data: SorteoRequest) => {
    try {
      setLoading(true);
      setError(null);

      // Llamar a la API
      const response = await sorteoService.realizarSorteo(data);

      // Delay de 10 segundos para efecto de suspenso
      await new Promise(resolve => setTimeout(resolve, 10000));

      setResultado(response);
      setMostrandoGanadores(true);
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Error al realizar el sorteo';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const descargarPDF = async (idSorteo: number) => {
    try {
      await sorteoService.descargarPDF(idSorteo);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      throw err;
    }
  };

  const resetear = () => {
    setResultado(null);
    setError(null);
    setMostrandoGanadores(false);
  };

  return {
    loading,
    resultado,
    error,
    mostrandoGanadores,
    realizarSorteo,
    descargarPDF,
    resetear,
  };
};