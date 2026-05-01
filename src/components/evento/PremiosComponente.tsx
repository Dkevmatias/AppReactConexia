import { useEffect, useState } from "react";
import {
  getPremios,
  getPremiosClientes,
  canjearPremio,
  CanjeResponse,
} from "../../services/premiosService";
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
  mesescomprasanteriores,
  onPuntosActualizados,
}: {
  totalPuntos: number;
  vencido: boolean;
  mesescomprasanteriores: boolean;
  onPuntosActualizados?: (puntos: number) => void;
}) {
  const { user } = useAuth();

  const [refresh, setRefresh] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const { periodo, periodoActivo } = usePeriodoActivo();
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mensajeModal, setMensajeModal] = useState("");

  const [premios, setPremios] = useState<Premio[]>([]);
  const [historial, setHistorial] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<Record<number, number>>({});

  const canjear = async (premio: Premio) => {
    const qty = selected[premio.idPremio] || 1;
    const puntosRequeridos = premio.puntos * qty;

    if (!qty) return;
    try {
      const response: CanjeResponse = await canjearPremio(
        user!.cardCode,
        user!.idPersona,
        premio.idPremio,
        periodo!.idPeriodo,
        premio.nombre,
        qty,
        puntosRequeridos,
      );

      if (response.success) {
        // Actualizar puntos si el backend los devuelve
        if (response.puntosRestantes !== undefined && onPuntosActualizados) {
          onPuntosActualizados(response.puntosRestantes);
        }

        setMensajeModal(
          `¡Canjeado! Te quedan ${response.puntosRestantes?.toFixed(2)} puntos.`,
        );
        setRefresh((prev) => !prev);
        setConfetti(true);
        setTimeout(() => {
          setConfetti(false);
        }, 4000);
      } else {
        setMensajeModal(response.message);
      }

      setSelected((prev) => ({
        ...prev,
        [premio.idPremio]: 0,
      }));
      setMostrarModal(true);

      console.log("Canje exitoso", response);
    } catch (error) {
      console.error("Error al canjear", error);
      setMensajeModal("Error al procesar el canje.");
      setMostrarModal(true);
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
    const data: HistorialPremio[] = await getPremiosClientes(user!.cardCode);
    const map = data.reduce((acc: Record<number, number>, x) => {
      acc[x.idPremio] = (acc[x.idPremio] || 0) + x.cantidad;
      return acc;
    }, {});

    setHistorial(map);
  };

  //Total Seleccionado
  const totalSeleccionado = Object.entries(selected).reduce(
    (acc, [id, qty]) => {
      const premio = premios.find((p) => p.idPremio === Number(id));
      return acc + (premio?.puntos || 0) * qty;
    },
    0,
  );

  const restante = totalPuntos - totalSeleccionado;
  const { bloqueoGlobal, puedeInteractuar } = useCanjeControl({
    periodoActivo,
    vencido,
    restante,
    historial,
    mesescomprasanteriores,
  });

  const getQty = (premio: Premio) => selected[premio.idPremio] || 0;

  //Acciones del Selector
  const add = (premio: Premio) => {
    if (bloqueoGlobal) return;

    const qtyActual = getQty(premio);
    const yaCanjeados = getCantidadHistorial(premio.idPremio);

    if (sinPuntos(premio)) return;
    if (sinStock(premio)) return;
    if (yaCanjeados + qtyActual >= premio.limite) return;

    setSelected((prev) => ({
      ...prev,
      [premio.idPremio]: qtyActual + 1,
    }));
  };

  const remove = (premio: Premio) => {
    if (bloqueoGlobal) return;
    setSelected((prev) => ({
      ...prev,
      [premio.idPremio]: Math.max((prev[premio.idPremio] || 0) - 1, 0),
    }));
  };
  const getCantidadHistorial = (idPremio: number) => historial[idPremio] ?? 0;

  const limiteAlcanzado = (premio: Premio) =>
    getCantidadHistorial(premio.idPremio) >= premio.limite;

  const sinStock = (premio: Premio) => premio.existencia <= 0;

  const sinPuntos = (premio: Premio) => premio.puntos > restante;

  return (
    <div className="w-full max-w-6xl mx-auto bg-white dark:bg-[#6F706C] p-6 rounded-2xl">
      {confetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={400}
        />
      )}

      <PeriodoCountdown />

      <PeriodoAlert
        periodoActivo={periodoActivo}
        saldoVencido={vencido}
        mesescomprasanteriores={mesescomprasanteriores}
      />
      {/* Header */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold">🎁 Catálogo Premios</h2>
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
        {premios.map((premio) => {
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
            <h2 className="text-lg font-semibold mb-2">🎉 ¡Canje realizado!</h2>

            <p className="text-gray-600 text-sm mb-4">{mensajeModal}</p>

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
