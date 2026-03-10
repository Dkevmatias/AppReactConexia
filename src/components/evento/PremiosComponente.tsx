import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Grid } from "swiper/modules";
import { getPremios, getPremiosClientes, canjearPremio } from "../../services/premiosService";
import { BarraProgreso } from "./BarraProgreso";
import Confetti from "react-confetti";
import { useAuth } from "../../context/useAuth";
import PeriodoAlert from "../../utils/PeriodoAlert";
import { usePeriodoActivo } from "../../hooks/usePeriodoActivo";
import { useCanjeControl } from "../../hooks/useCanjeControl";
import PeriodoCountdown from "../../components/evento/PeriodoCount";
import PremioCard from "../../components/evento/PremioCard";

type Premio = {
  idPremio: number;
  nombre: string;
  puntos: number;
  cantidad: number;
  existencia: number;
  limite: number;
  activo: boolean;
  imagen: string;
};

type HistorialPremio = {
  idPremio: number;
  cantidad: number;
};

export default function PremiosCarousel({
  totalPuntos,
  vencido,
}: {
  totalPuntos: number;
  vencido: boolean;
}) {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => {
    setIsMobile(window.innerWidth < 768);
  };

  checkMobile();
  window.addEventListener("resize", checkMobile);

  return () => window.removeEventListener("resize", checkMobile);
}, []);
  //const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);
  const [confeti, setConfeti] = useState(false);
  const { periodo,periodoActivo: periodoActivo } = usePeriodoActivo();
  const [mostrarModal, setMostrarModal] = useState(false);
  
  const [premios, setPremios] = useState<Premio[]>([]);
  const [historial, setHistorial] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<Record<number, number>>({});
  
 
  const canjear = async (premio: Premio) => {
  const qty = selected[premio.idPremio] || 1;

    if (!qty) return;
    try {
      //Llamada a API
     await canjearPremio(premio.idPremio, 1, premio.nombre, qty, user!.cardCode);
     setRefresh(prev => !prev);
      //Activar confeti      
      setConfeti(true);
      setTimeout(() => {
        setConfeti(false);
      }, 4000);
         

      // 🧹 Limpiar selección
      setSelected(prev => ({
        ...prev,
        [premio.idPremio]: 0,
      }));
      setMostrarModal(true);

      console.log("Canje exitoso");
    } catch (error) {
      console.error("Error al canjear", error);
    }
  };
  // Consumir API
  useEffect(() => {
    obtenerPremios();
    cargarHistorial();
  }, [refresh]);

  const obtenerPremios = async () => {
    try {
      const data = await getPremios();
      setPremios(data);
    } catch (error) {
      console.error("Error cargando premios", error);
    } finally {
      //setLoading(false);
    }
  };
  const cargarHistorial = async () => {
    const data: HistorialPremio[]= await getPremiosClientes(user!.cardCode);
      const map = data.reduce(
    (acc: Record<number, number>, x) => {
      acc[x.idPremio] =
        (acc[x.idPremio] || 0) + x.cantidad;
      return acc;
    },
    {}
  );

    setHistorial(map);
  };   

  //Total Seleccionado
  const totalSeleccionado = Object.entries(selected)
    .reduce((acc, [id, qty]) => {
      const premio = premios.find(
        p => p.idPremio === Number(id)
      );
      return acc + (premio?.puntos || 0) * qty;
    }, 0);

//  const restante = totalPuntos - totalSeleccionado;
  const restante = 50000 - totalSeleccionado; // Para pruebas, se puede reemplazar por totalPuntos
  const { bloqueoGlobal, puedeInteractuar } = useCanjeControl({
  periodoActivo,
  vencido,
  restante,
  historial,
});
  const getQty = (premio: Premio) =>  selected[premio.idPremio] || 0;
 
    //Acciones del Selector 
  const add = (premio: Premio) => {
  if (bloqueoGlobal) return;

  const qtyActual = getQty(premio);
  const yaCanjeados = getCantidadHistorial(premio.idPremio);

  if (sinPuntos(premio)) return;
  if (sinStock(premio)) return;
  if (yaCanjeados + qtyActual >= premio.limite) return;

  setSelected(prev => ({
    ...prev,
    [premio.idPremio]: qtyActual + 1,
    }));
  };

  const remove = (premio: Premio) => {
      if (bloqueoGlobal) return;
      setSelected(prev => ({
        ...prev,
        [premio.idPremio]: Math.max(
          (prev[premio.idPremio] || 0) - 1,
          0
        ),
      }));
  };
  const getCantidadHistorial = (idPremio: number) =>
      historial[idPremio] ?? 0;

  const limiteAlcanzado = (premio: Premio) =>
      getCantidadHistorial(premio.idPremio) >= premio.limite;

  const sinStock = (premio: Premio) =>
      premio.existencia <= 0;

  const sinPuntos = (premio: Premio) =>
      premio.puntos > restante;
   

  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-[#6F706C] p-6 rounded-2xl">
        {confeti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={400}
        />
      )}

      {!periodoActivo && periodo?.fechaInicio && (
      <PeriodoCountdown fechaInicio={periodo.fechaInicio} />
      )}

        <PeriodoAlert periodoActivo={periodoActivo} saldoVencido={vencido} />
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold">
          🎁 Catálogo Premios
        </h2>       
      </div>                       
      <div
        className=" 
          grid
          gap-6
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          justify-items-center
        "
      >
      {premios.map(premio => {
        const qty = getQty(premio);
        const yaCanjeados = getCantidadHistorial(premio.idPremio);
        const puedeCanjear = puedeInteractuar(premio, qty);
        return (
          <PremioCard
            key={premio.idPremio}
            premio={premio}
            qty={qty}
            restante={restante}
            yaCanjeados={yaCanjeados}
            bloqueoGlobal={bloqueoGlobal}
            puedeCanjear={puedeCanjear}
            onAdd={() => add(premio)}
            onRemove={() => remove(premio)}
            onCanjear={() => canjear(premio)}
          />
        );
      })}
    </div>
    {mostrarModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
    
    <div className="bg-white rounded-xl p-6 shadow-lg w-80 text-center">
      
      <h2 className="text-lg font-semibold mb-2">
        🎉 ¡Canje realizado!
      </h2>

      <p className="text-gray-600 text-sm mb-4">
        Has canjeado tu premio correctamente.
      </p>

      <button
        onClick={() => setMostrarModal(false)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
      >
        Aceptar
      </button>

    </div>

  </div>
)}
      </div>
      );
    }
