import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/useAuth";
import { getPersonas, getPeriodosActivos,getVentasCLientes } from "../../services/authService";
import CardAcumulado from "../../components/evento/CardAcumulado";
import { useVenta } from "../../context/VentaContext";


const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

interface Persona {
  idPersona: number;
  cardCode?: string | null;
}
interface Periodo {
  idPeriodo: number;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  evaluar: boolean;
};

interface VentaPeriodo {
  mes: number;
  totalVentas: number;
  puntos: number;
}

export default function Acumulado() {
  const { user } = useAuth(); 
  const [ventaACumulado, setAcumulado] = useState<{
   data: VentaPeriodo[];
 }>({ 
   data: []
 }); 
  const [confeti, setConfeti] = useState(false);
  const [loading, setLoading] = useState(true);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

 
  //Cargar datos protegidos
  useEffect(() => {
    if (!user) return;

    const cargarDatos = async () => {
      try {
          setLoading(true);
    const personas: Persona[] = await getPersonas(user.idPersona);
    const cardCodes = personas
          .filter(p => p?.cardCode)
          .map(p => p.cardCode)
          .join(",");
    const periodo: Periodo[] = await getPeriodosActivos();
    const rango = obtenerRangoFechas(periodo);
    if (!rango) return;

    console.log("Fecha inicio:", rango.fechaInicio);
    console.log("Fecha fin:", rango.fechaFin);
    const fechaInicio = "2025-01-01";
    const fechaFin = "2025-02-28";

    const ventasPeriodo = await getVentasCLientes(fechaInicio, fechaFin, cardCodes); 
    //const periodo = await getPeriodosActivos();
    const acumulado= ventasPeriodo.map((v: VentaPeriodo) =>({
      mes: v.mes,
      totalVentas: v.totalVentas,
      puntos:calcularPuntos(v.totalVentas)
    }));

    setAcumulado({data: acumulado});

    console.log("Acumulado de Ventas:", acumulado);   

      } catch (error) {
          if (import.meta.env.DEV) {
          console.error("Error cargando datos de los Puntos", error);
        }
        
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user]);

  
  useEffect(() => {
    setConfeti(true);
    const timer = setTimeout(() => setConfeti(false), 5000);
    return () => clearTimeout(timer);
  }, []);


  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return <div className="text-center p-10">Cargando información...</div>;
  }

  return (
    <div>
      <PageMeta
        title="Evento"
        description="Página de evento protegida"
      />
      {confeti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
        />
      )}

      <div className="grid grid-cols-1 gap-6">
        <h1 className="mb-4 text-3xl font-bold text-center text-gray-700 dark:text-gray-300">
          Puntos Acumulados
        </h1>       

                <CardAcumulado res={ventaACumulado} />

      </div>
    </div>
  );
}
const obtenerRangoFechas = (periodos: Periodo[]) => {
  if (!periodos || periodos.length === 0) return null;
  const ordenados = [...periodos].sort(
    (a, b) =>
      new Date(a.fechaInicio).getTime() -
      new Date(b.fechaInicio).getTime()
  );

  return {
    fechaInicio: ordenados[0].fechaInicio,
    fechaFin: ordenados[ordenados.length - 1].fechaFin,
  };
};

function calcularPuntos(totalVentas: number) {  
  return (Math.round((totalVentas / 1.16) / 1000));
}


