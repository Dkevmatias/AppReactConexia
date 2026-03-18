import { useEffect, useState } from "react";

interface TimeLeft {
  dias: number;
  horas: number;
  minutos: number;
  segundos: number;
}

const AÑO_REDENSION = 2026;
const MES_REDENSION = 4; // Mayo (0-indexed = 4)

const getFechaRedencion = () => {
  const fecha = new Date(AÑO_REDENSION, MES_REDENSION, 1, 0, 0, 0);
  return fecha;
};

export default function PeriodoCount({ fechaInicio }: { fechaInicio?: string }) {
  const [tiempoRestante, setTiempoRestante] = useState<TimeLeft | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const fechaDestino = fechaInicio ? new Date(fechaInicio) : getFechaRedencion();

    const calcularTiempo = () => {
      const ahora = new Date().getTime();
      const apertura = fechaDestino.getTime();
      const diferencia = apertura - ahora;

      if (diferencia <= 0) {
        setIsActive(true);
        return null;
      }

      return {
        dias: Math.floor(diferencia / (1000 * 60 * 60 * 24)),
        horas: Math.floor((diferencia / (1000 * 60 * 60)) % 24),
        minutos: Math.floor((diferencia / (1000 * 60)) % 60),
        segundos: Math.floor((diferencia / 1000) % 60),
      };
    };

    setTiempoRestante(calcularTiempo());

    const intervalo = setInterval(() => {
      const tiempo = calcularTiempo();
      if (tiempo) {
        setTiempoRestante(tiempo);
      } else {
        clearInterval(intervalo);
      }
    }, 1000);

    return () => clearInterval(intervalo);
  }, [fechaInicio]);

  if (isActive) {
    return (
      <div className="bg-green-100 border-2 border-green-500 text-green-800 p-4 rounded-xl text-center mb-4">
        <div className="text-2xl mb-1">🎉</div>
        <div className="font-bold text-lg">¡El periodo de canje ya está activo!</div>
      </div>
    );
  }

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-3 min-w-[60px]">
        <span className="text-2xl font-bold text-blue-600">
          {value.toString().padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  );

  const esFechaFija = !fechaInicio;
  const mensajeFecha = esFechaFija 
    ? `El canje de premios estará disponible a partir de Mayo ${AÑO_REDENSION}`
    : `El canje de premios estará disponible a partir del ${new Date(fechaInicio).toLocaleDateString('es-MX', { month: 'long', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white p-6 rounded-2xl mb-6 shadow-lg">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold">⏰ Tiempo restante para canjear</h3>
        <p className="text-blue-100 text-sm">{mensajeFecha}</p>
      </div>
      
      {tiempoRestante && (
        <div className="flex justify-center gap-3">
          <TimeBox value={tiempoRestante.dias} label="Días" />
          <div className="flex items-center text-2xl font-bold text-blue-200">:</div>
          <TimeBox value={tiempoRestante.horas} label="Horas" />
          <div className="flex items-center text-2xl font-bold text-blue-200">:</div>
          <TimeBox value={tiempoRestante.minutos} label="Min" />
          <div className="flex items-center text-2xl font-bold text-blue-200">:</div>
          <TimeBox value={tiempoRestante.segundos} label="Seg" />
        </div>
      )}
    </div>
  );
}