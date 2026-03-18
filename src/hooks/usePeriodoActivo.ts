import { useEffect, useState, useMemo } from "react";
import { api } from "../services/apiServices";
import { useAuth } from "../context/useAuth";

const MES_REDENSION = 5; // Mayo

export function usePeriodoActivo() {
  const [periodo, setPeriodo] = useState<{
    idPeriodo: number;
    fechaInicio: string;
    fechaFin: string;
    activo: boolean;
  } | null>(null);

  const [periodoActivo, setPeriodoActivo] = useState(false);
  const [tieneBoletos, setTieneBoletos] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const esMesRedencion = useMemo(() => {
    if (!periodo?.fechaInicio) return false;
    const mes = new Date(periodo.fechaInicio).getMonth() + 1;
    return mes === MES_REDENSION;
  }, [periodo?.fechaInicio]);

  useEffect(() => {
    if (!user?.cardCode) {
      setLoading(false);
      return;
    }
    const fetchPeriodo = async () => {
      try {
        const response = await api.get("/api/PeriodoBoletos/GetPeriodoActivo");
        const periodoData = response.data ?? null;

        if (!periodoData) {
          setPeriodo(null);
          setPeriodoActivo(false);
          setTieneBoletos(false);
          return;
        }

        setPeriodo(periodoData);
        const mesPeriodo = new Date(periodoData.fechaInicio).getMonth() + 1;
        setPeriodoActivo(periodoData.activo === true && mesPeriodo === MES_REDENSION);

      } catch (error) {
        console.error("Error verificando periodo activo:", error);
        setPeriodo(null);
        setPeriodoActivo(false);
        setTieneBoletos(false);
      } finally {
        setLoading(false);
      }
    };

    fetchPeriodo();
  }, []);

  return { periodoActivo, periodo, tieneBoletos, loading, esMesRedencion };
}
