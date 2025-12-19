

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import PageMeta from "../../components/common/PageMeta";
import TableBoletos from "../../components/evento/TableBoletos";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { getBoletosPorUsuario } from "../../services/boletoServices";




export default function Boletos() {
   //No debe de haber un if antes de un hook para no causar errores
  const { user } = useAuth();
  const location = useLocation();
  const [boletos, setBoletos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confeti, setConfeti] = useState(false); 
  
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
//Boleto Recien Creados
  useEffect(() => {
    if(location.state?.boletos)
    {setBoletos( location.state.boletos);}
  }, [location.state]);
//BD Boletos
 useEffect(() => {
   if (!user?.cardCode) return console.log("Usuario login:", user?.cardCode);

    const fetchBoletos = async () => {
      try {
        const response = await getBoletosPorUsuario(user!.cardCode);
        setBoletos(response);
      } catch (error) {
        console.error("Error cargando boletos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBoletos();
  }, [user]);
  
// Detecta cambio de tamaño
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lanza confeti automáticamente al cargar la página
  useEffect(() => {
    setConfeti(true);
    const timer = setTimeout(() => setConfeti(false), 5000); // duracion de animación
    return () => clearTimeout(timer);
  }, []); 

  if (loading && boletos.length === 0) {
    return <p>Cargando boletos...</p>;
  }

  return (
    
 <div>
      <PageMeta
        title="React.js Form Elements Dashboard | TailAdmin - React.js Admin Dashboard Template"
        description="This is React.js Form Elements  Dashboard page for TailAdmin - React.js Tailwind CSS Admin Dashboard Template"
      />
      {confeti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={400}
        />
      )}

       <div className="grid grid-cols-1 gap-6 xl:grid-cols-1">        
        {/* text-gray-700 dark:text-gray-300 Para Controlar el Cambio de Tema */}
          <h1 className="mb-4 text-3xl text-gray-700 dark:text-gray-300 font-bold text-center">Historial de Boletos Seleccionados</h1>
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
          
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-1">        
                  <div className="space-y-6">
                    <TableBoletos res={boletos} />
                </div>       
              </div>
          </div>
        </div>
    </div>
  );
}
