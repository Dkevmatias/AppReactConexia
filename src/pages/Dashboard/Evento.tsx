

import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import PageMeta from "../../components/common/PageMeta";
import BoletosCards from "../../components/evento/CardBoletos";
import { useVenta } from "../../context/VentaContext";
import { useVencido } from "../../context/SaldoContext";


export default function Evento() {
  const [confeti, setConfeti] = useState(false);
  const { ventaTotal } = useVenta();
  const {saldoVencido}= useVencido();
  const getdate = new Date();
 // const mesanterior= getdate.getMonth() - 1;
  const fechaMesAnterior = new Date(getdate.getFullYear(), getdate.getMonth() - 1, 1);
  const nombreMeses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const mesAnterior = nombreMeses[fechaMesAnterior.getMonth()];
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

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
    const timer = setTimeout(() => setConfeti(false), 5000); //duracion de animación
    return () => clearTimeout(timer);
  }, []); 


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
     {/*  <PageBreadcrumb pageTitle="Evento" /> */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-1">        
        {/* text-gray-700 dark:text-gray-300 Para Controlar el Cambio de Tema */}
          <h1 className="mb-4 text-3xl text-gray-700 dark:text-gray-300 font-bold text-center">🎉 ¡Bienvenido, Suerte con tu Elección! 🎉</h1>
        <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Gracias por ser parte de nuestros 50 aniversarios.Tu participación es muy importante para nosotros.
            </p>
        {/*     <p className="mb-4 text-gray-700 dark:text-gray-300">
              Compras Totales del periodo: <strong>$1,250.00</strong>
            </p> */}
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Mes: <strong>{mesAnterior} {fechaMesAnterior.getFullYear()}</strong>
            </p>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              ¡Recuerda que cada compra aumenta tus posibilidades de ganar!
            </p>

            <p className="mb-4 text-gray-700 dark:text-gray-300">
              Por cada $1000.00 de compras antes de impuesto en el mes, recibes 1 punto.         
            </p>
        </div> 
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-1">        
            <div className="space-y-6">
              <BoletosCards totalCompra={ventaTotal ?? 0 }
                            vencido={!saldoVencido } />
          </div>       
        </div>
      </div>
    </div>
  );
}
