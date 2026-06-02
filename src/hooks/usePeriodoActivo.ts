import { useEffect, useState } from "react";
import { api } from "../services/apiServices";
import { estaEnRangoCanje } from "../utils/date";

export type PeriodoBoletosActivo = {
  idPeriodo: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
};

export function usePeriodoActivo() {
  const [periodo, setPeriodo] = useState<PeriodoBoletosActivo | null>(null);
  const [periodoActivo, setPeriodoActivo] = useState(false);
  const [tieneBoletos, setTieneBoletos] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPeriodo = async () => {
      try {
        const response = await api.get("/api/PeriodoBoletos/GetPeriodoActivo");
        const periodoData = (response.data ?? null) as PeriodoBoletosActivo | null;

        if (!periodoData?.fechaInicio || !periodoData?.fechaFin) {
          setPeriodo(null);
          setPeriodoActivo(false);
          setTieneBoletos(false);
          return;
        }

        setPeriodo(periodoData);
        const enRango = estaEnRangoCanje(
          periodoData.fechaInicio,
          periodoData.fechaFin,
        );
        setPeriodoActivo(periodoData.activo === true && enRango);
      } catch (error) {
        console.error("Error verificando periodo activo:", error);
        setPeriodo(null);
        setPeriodoActivo(false);
        setTieneBoletos(false);
      } finally {
        setLoading(false);
      }
    };

    void fetchPeriodo();
  }, []);

  return { periodoActivo, periodo, tieneBoletos, loading };
}
