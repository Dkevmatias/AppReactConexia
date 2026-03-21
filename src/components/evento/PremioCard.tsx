import { motion } from "framer-motion";
import { BarraProgreso } from "./BarraProgreso";
import { EstadoPremio } from "../../types/EstadoPremio";

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
type Props = {
  premio: Premio;
  qty: number;
  restante: number;
  yaCanjeados: number;
  bloqueoGlobal: boolean;
  puedeCanjear: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onCanjear: () => void;
};

export default function PremioCard({
  premio,
  qty,
  restante,
  yaCanjeados,
  bloqueoGlobal,
  puedeCanjear,
  onAdd,
  onRemove,
  onCanjear,
}: Props) {

  const sinStock = premio.existencia <= 0;
  const limiteAlcanzado = yaCanjeados >= premio.limite;

  let estado: EstadoPremio;

  if (sinStock) {
    estado = "sin_stock";
  } else if (yaCanjeados >= premio.limite) {
    estado = "limite_alcanzado";
  } else if (!puedeCanjear) {
    estado = "esperando_mayo";
  } else {
    estado = "disponible";
  }
  const premioCanjeado = yaCanjeados >= premio.limite;
  const puedeCanjearPremio = estado === "disponible";
  
  const cardDeshabilitado = sinStock || limiteAlcanzado;
  
  return (
<motion.div
  whileHover={{ scale: puedeCanjearPremio ? 1.03 : 1 }}
  className={`w-full max-w-[320px] rounded-xl shadow-md border bg-black overflow-hidden transition
    ${
      cardDeshabilitado
        ? "opacity-50 grayscale pointer-events-none"
        : "hover:shadow-lg"
    }
  `}
>
  {/* Etiquetas de estado 
  {estado === "limite_alcanzado" && (
  <p className="text-xs font-bold text-gray-600">
    Premio canjeado anteriormente
  </p>
)}*/}

  {/*
{estado === "sin_stock" && (
  <p className="text-xs font-bold text-red-600">
    Sin stock disponible
  </p>
)}*/}
    {premioCanjeado && (
  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
    <div className="bg-white px-4 py-2 rounded-lg shadow-md">
      <p className="text-sm font-semibold text-gray-800">
        Premio canjeado anteriormente
      </p>
    </div>
  </div>
)}
 <div className="w-full">

  {/* Imagen */}
  <div className="relative h-40 bg-gray-100 flex items-center justify-center p-2">
    <img
      src={premio.imagen}
      alt={premio.nombre}
      className="h-full object-cover"
    />

    {/* Stock - Inferior derecha */}
    <span className="absolute bottom-2 right-2 bg-yellow-300 text-xs text-black font-semibold px-2 py-1 rounded-full shadow">
      Disponibles: {premio.existencia}
    </span>
  </div>

  {/* Info */}
  <div className="bg-black text-white p-3 relative flex-1">

    {/* Límite - Superior izquierda */}
    <span className="absolute top-2 left-3 text-xs">
      Límite de canje: {premio.limite}
    </span>

    {/* Canjeados - Superior derecha */}
    <span className="absolute top-2 right-3 text-xs">
      Canjeado: {yaCanjeados}
    </span>

    {/* Contenido central */}
    <div className="flex flex-col items-center mt-1 gap-1">

      {/* Nombre */}
      <h3 className="font-semibold text-lg text-center">
        {premio.nombre}
      </h3>

      {/* Puntos */}
      <p className="text-yellow-400 font-bold text-base">
        {premio.puntos.toLocaleString()} pts
      </p>

      {/* Barra progreso */}
      <div className="w-full mt-1">
        <BarraProgreso
          puntosActuales={restante}
          puntosObjetivo={premio.puntos}
          estado={estado}
          onCanjear={onCanjear}
        />
      </div>

      {/* Botón */}
      {puedeCanjearPremio && (
        <button
          onClick={onCanjear}
          className="mt-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          Canjear premio
        </button>
      )}
      

      {/* Selector cantidad */}
      {premio.limite > 1 && (
        <div className="flex justify-center items-center gap-2 mt-2">
          <button
            onClick={onRemove}
            disabled={qty === 0}
            className="w-7 h-7 rounded-full bg-gray-700 text-sm disabled:opacity-40"
          >
            –
          </button>

          <span className="text-base font-semibold">
            {qty}
          </span>

          <button
            onClick={onAdd}
            disabled={bloqueoGlobal || sinStock || limiteAlcanzado}
            className="w-7 h-7 rounded-full bg-blue-600 text-white text-sm disabled:opacity-40"
          >
            +
          </button>
        </div>
      )}
    </div>
  </div>
</div>
</motion.div>
  );
}