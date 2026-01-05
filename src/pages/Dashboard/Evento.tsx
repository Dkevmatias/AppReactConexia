import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import PageMeta from "../../components/common/PageMeta";
import BoletosCards from "../../components/evento/CardBoletos";
import { useVenta } from "../../context/VentaContext";
import { useVencido } from "../../context/SaldoContext";
import { useAuth } from "../../context/useAuth";
import { getPersonas,getVentasCLientes,getSaldoClientes,getPeriodoEvaluar } from "../../services/authService";
import { data } from "react-router";

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

interface Persona {
  idPersona: number;
  cardCode?: string | null;
}

export default function Evento() {
  const { user } = useAuth();
  const { ventaTotal, ventaMesActual,mesAnterior,mesActual, setMesAnterior, setVentaTotal, setVentaMesActual,setmesActual } = useVenta();
  const {saldoVencido, setSaldoVencido } = useVencido();
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
        

    const periodo = await getPeriodoEvaluar();

    const Mes = new Date(periodo.fechaFin);
    const fechaMesAnterior = new Date(Mes.getFullYear(), Mes.getMonth() - 1, 1);
    const nombreMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const mesAnterior = nombreMeses[fechaMesAnterior.getMonth()];
    const mesActual= nombreMeses[Mes.getMonth()];
    setmesActual(mesActual);  
    setMesAnterior(mesAnterior);
        
        // Mes actual
        const inicioMesActual = new Date(periodo.fechaFin);
        inicioMesActual.setDate(1);
        inicioMesActual.setMonth(inicioMesActual.getMonth() + 1);
        const finMesActual = new Date(inicioMesActual);
        finMesActual.setMonth(finMesActual.getMonth() + 1);
        finMesActual.setDate(0);
      
        const fiperiodo= new Date(periodo.fechaInicio)
        fiperiodo.setFullYear(fiperiodo.getFullYear() -1);
        const ffperiodo= new Date(periodo.fechaFin)
        ffperiodo.setFullYear(ffperiodo.getFullYear() -1);

        //año anterior para pruebas
        const fechaIañoanterior = new Date(inicioMesActual);
        fechaIañoanterior.setFullYear(inicioMesActual.getFullYear() - 1);
        const fechaFañoanterior = new Date(finMesActual);
        fechaFañoanterior.setFullYear(finMesActual.getFullYear() - 1);

        //const ventasPeriodo = await getVentasCLientes(periodo.fechaInicio,periodo.fechaFin,cardCodes);
        const ventasPeriodo = await getVentasCLientes(formatDate(fiperiodo),formatDate(ffperiodo), cardCodes); 
             
        //const ventasMesActual = await getVentasCLientes(formatDate(inicioMesActual),formatDate(finMesActual),cardCodes);
        const ventasMesActual = await getVentasCLientes(formatDate(fechaIañoanterior),formatDate(fechaFañoanterior), cardCodes); 
        const saldo = await getSaldoClientes(cardCodes);     
        //const totalVentas = ventasPeriodo?.[0]?.totalVentas ?? 0;
        const totalVentas = 223425;
         const totalMesActual = ventasMesActual?.[0]?.totalVentas ?? 0;     
    
        setVentaTotal(Math.round((totalVentas / 1.16) / 1000));
        setVentaMesActual(Math.round((totalMesActual / 1.16) / 1000));
        setSaldoVencido(saldo[0]?.vencido ?? false);

      } catch (error) {
          if (import.meta.env.DEV) {
          console.error("Error cargando datos del evento", error);
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
          🎉 ¡Bienvenido, Suerte con tu Elección! 🎉
        </h1>

        <div className="p-6 bg-white border rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Gracias por ser parte de nuestros 50 aniversarios.
          </p>

          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Por cada $1000 antes de impuestos recibes 1 punto.
          </p>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
          Monto del Mes en Curso {mesActual}:
          <strong>{ventaMesActual}</strong>
          </p>
       </div>
        
                <BoletosCards totalCompra={ventaTotal ?? 0 }
                            vencido={saldoVencido ?? false }
                            mesRedencion={mesAnterior ?? ""} />

      </div>
    </div>
  );
}
