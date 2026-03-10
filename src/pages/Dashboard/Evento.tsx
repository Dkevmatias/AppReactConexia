import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import PageMeta from "../../components/common/PageMeta";
import PremiosComponente from "../../components/evento/PremiosComponente";
import SidebarEvento from "../../components/evento/SidebarEvento";
import { useVenta } from "../../context/VentaContext";
import { useVencido } from "../../context/SaldoContext";
import { useAuth } from "../../context/useAuth";

import {
  getPersonas,
  getVentasCLientes,
  getSaldoClientes,
  getPeriodoEvaluar,
  AsignarPuntos
} from "../../services/authService";

const formatDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

interface Persona {
  idPersona: number;
  cardCode?: string | null;
}

export default function Evento() {
  const { user } = useAuth();
  const { ventaTotal, setVentaTotal } = useVenta();
  const { saldoVencido, setSaldoVencido } = useVencido();

  const [confeti, setConfeti] = useState(false);
  const [loading, setLoading] = useState(true);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // ================================
  // CARGAR DATOS
  // ================================

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

        const inicio = new Date(periodo.fechaInicio);
        const fin = new Date(periodo.fechaFin);

        inicio.setFullYear(inicio.getFullYear() - 1);
        fin.setFullYear(fin.getFullYear() - 1);

        const ventas = await getVentasCLientes(
          formatDate(inicio),
          formatDate(fin),
          cardCodes
        );

        const saldo = await getSaldoClientes(cardCodes);

        const totalVentas = ventas?.[0]?.totalVentas ?? 0;

        const puntos = Math.round(totalVentas / 5000);

        await AsignarPuntos(1, puntos, 0, user.cardCode!);

        //setVentaTotal(Math.round(totalVentas / 1.16 / 5000));
        setVentaTotal(50);
        setSaldoVencido(saldo?.[0]?.vencido ?? false);
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

  // ================================
  // CONFETTI
  // ================================

  useEffect(() => {
    setConfeti(true);
    const timer = setTimeout(() => setConfeti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // ================================
  // WINDOW SIZE
  // ================================

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading) {
    return (
      <div className="text-center p-10">
        Cargando información...
      </div>
    );
  }

  return (
    <>
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

      {/* HEADER */}
      <div className="mb-10 text-center space-y-3">
        <h1
          className="text-3xl font-bold text-gray-700 dark:text-gray-300"
          style={{ fontFamily: "Conthrax" }}
        >
          Bienvenido a tus recompensas 🎉
        </h1>

        <p className="text-gray-600 dark:text-gray-300">
          Tus puntos acumulados te han abierto la puerta a beneficios exclusivos.
        </p>

        <p className="text-gray-600 dark:text-gray-300">
          Canjéalos y disfruta todo lo que tenemos preparado para ti.
        </p>
      </div>

      {/* LAYOUT */}
      <div className="grid grid-cols-12 gap-8">

        {/* PREMIOS */}
        <div className="col-span-12 lg:col-span-9">
          <PremiosComponente
            totalPuntos={ventaTotal ?? 0}
            vencido={saldoVencido ?? false}
          />
        </div>

        {/* SIDEBAR */}
          <div className="col-span-12 lg:col-span-3">
            <SidebarEvento puntos={ventaTotal ?? 0} />
          </div>
        

      </div>
    </>
  );
}