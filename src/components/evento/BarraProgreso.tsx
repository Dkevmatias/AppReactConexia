import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import { EstadoPremio } from "../../types/EstadoPremio";

interface BarraProgresoProps {
  puntosActuales: number;
  puntosObjetivo: number;
  estado: EstadoPremio;
  onCanjear: () => void;
}

/**
 * BarraProgreso — carrito animado que avanza hacia la meta 🛒 → 🎯
 *
 * Arquitectura:
 *  ┌─────────────────────────────────────────────────┐  ← wrapper con padding superior
 *  │  🛒  (posición absoluta, encima de la barra)    │
 *  │  ══════════════╠══════════════════╣  🎯          │
 *  │  barra rellena           barra vacía            │
 *  └─────────────────────────────────────────────────┘
 *
 * Claves de la solución:
 *  1. El wrapper tiene `overflow-visible` + `padding-top` para que los iconos
 *     flotantes nunca queden recortados.
 *  2. El carrito usa `left` en % calculado desde el centro del icono (translateX -50%)
 *     y se mueve con un spring suave.
 *  3. La pista de la barra es gruesa (h-5) para que sea visible.
 *  4. Se usa `useSpring` para el valor numérico → animación fluida sin saltos.
 */
export function BarraProgreso({
  puntosActuales,
  puntosObjetivo,
  estado,
  onCanjear,
}: BarraProgresoProps) {
  // Progreso real en 0‥100
  //const progresoReal = Math.min((puntosActuales / puntosObjetivo) * 100, 100);
 const esDisponible = estado === "disponible";
const esInsuficiente = estado === "insuficiente_puntos";
const esLimite = estado === "limite_alcanzado";
const esSinStock = estado === "sin_stock";

const progresoReal =
  esLimite
    ? 100
    : Math.min((puntosActuales / puntosObjetivo) * 100, 100);

const faltan = Math.max(puntosObjetivo - puntosActuales, 0);

  // Spring sobre el valor de progreso: arranque suave al montar
  const spring = useSpring(0, { stiffness: 60, damping: 18, mass: 1 });

  useEffect(() => {
    spring.set(progresoReal);
  }, [progresoReal, spring]);

   

return (
  <div className="w-full px-1 pt-1 pb-1 select-none">

    {/* ── Etiquetas superiores ── */}
    <div className="flex justify-between text-[11px] font-semibold mb-3">
     {/*  <span className="text-gray-500">
        {puntosActuales.toLocaleString()} pts
      </span> */}

      <motion.span
        key={estado}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          esDisponible
            ? "bg-green-100 text-green-700"
            : "bg-blue-50 text-blue-600"
        }`}
      >
        {esDisponible
          ? "🎉 ¡Listo para canjear!"
          : `${Math.floor(progresoReal)}% completado`}
      </motion.span>
    </div>

    {/* ── Barra ── */}
    <div className="relative w-full" style={{ height: 18 }}>

      {/* Fondo */}
      <div
        className="absolute bottom-0 left-0 right-0 rounded-full bg-gray-200"
        style={{ height: 10 }}
      />

      {/* Relleno */}
      <motion.div
        className={`absolute bottom-0 left-0 rounded-full ${
          esDisponible
            ? "bg-gradient-to-r from-green-400 to-green-600"
            : "bg-gradient-to-r from-blue-400 to-blue-600"
        }`}
        style={{ height: 10, width: `${progresoReal}%` }}
      />

      {/* Carrito */}
      <motion.div
        className="absolute"
        style={{
          left: `${progresoReal}%`,
          bottom: 10,
          x: "-50%",
        }}
      >
        <motion.div
          animate={
            esDisponible
              ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }
              : {}
          }
          transition={{
            duration: 0.6,
            repeat: esDisponible ? Infinity : 0,
            repeatDelay: 1.5
          }}
          className="text-2xl drop-shadow-md leading-none"
        >
          🛒
        </motion.div>
      </motion.div>

      {/* Meta */}
      <div
        className="absolute right-0 flex flex-col items-center gap-1"
        style={{ bottom: 6 }}
      >
        <motion.div
          animate={esDisponible ? { rotate: [0, -12, 12, -12, 0] } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-xl leading-none drop-shadow"
        >
          🎯
        </motion.div>
      </div>
    </div>

    {/* ── Mensajes inferiores ── */}
    <div className="mt-3 text-center space-y-2">

      {esInsuficiente && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-500"
        >
          Te faltan{" "}
          <span className="font-bold text-blue-600">
            {faltan.toLocaleString()} pts
          </span>{" "}
          para desbloquear este premio
        </motion.p>
      )}
      
      {esLimite && (
        <motion.p className="text-xs font-semibold text-gray-600">
          Premio canjeado anteriormente
        </motion.p>
      )}

      {esSinStock && (
        <motion.p className="text-xs font-semibold text-red-600">
          Premio Agotado
        </motion.p>
      )}

    </div>
  </div>
);
}
