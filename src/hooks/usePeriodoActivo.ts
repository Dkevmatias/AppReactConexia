import { useEffect, useState } from "react";
import { api } from "../services/apiServices";
import { useAuth } from "../context/useAuth";

export function usePeriodoActivo() {
  const [periodo, setPeriodo] = useState<{
    idPeriodo: number;
    fechaInicio: string;
    fechaFin: string;
    activo: boolean;
  } | null>(null);

  const [periodoActivo, setPeriodoActivo] = useState(false);
  const [tieneBoletos, setTieneBoletos] = useState(false);
  //const [tieneSaldoVencido, setTieneSaldoVencido] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
useEffect(() => {
  if (!user?.cardCode) {
    setLoading(false);
    return;
  }
    const fetchPeriodo = async () => {
      try {
        const response = await api.get("/api/PeriodoBoletos/GetPeriodoActivo");
        const periodoData = response.data ?? null;

        // Si NO hay periodo
        if (!periodoData) {
          setPeriodo(null);
          setPeriodoActivo(false);
          setTieneBoletos(false);
          return;
        }

        // Sí hay periodo
        setPeriodo(periodoData);
        setPeriodoActivo(periodoData.activo === true); // <-- este sí es boolean

        // Obtener boletos en ese periodo
        const responseBoletos = await api.get(
          `/api/Boletos/GetBoletosPeriodo/${user?.cardCode}/${response.data.idPeriodo}`
        );

        setTieneBoletos(responseBoletos.data.total > 0);
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

  return { periodoActivo, periodo, tieneBoletos, loading };
}
