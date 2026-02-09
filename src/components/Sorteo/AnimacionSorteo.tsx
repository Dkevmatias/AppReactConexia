import { useEffect, useState } from 'react';

interface Props {
  duracion?: number; // en segundos
}

export const AnimacionSorteo = ({ duracion = 10 }: Props) => {
  const [tiempo, setTiempo] = useState(duracion);
  const [boletos, setBoletos] = useState<number[]>([]);

  useEffect(() => {
    // Generar números aleatorios para simular boletos girando
    const interval = setInterval(() => {
      setBoletos(Array.from({ length: 5 }, () => Math.floor(Math.random() * 99999)));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tiempo <= 0) return;

    const timer = setTimeout(() => {
      setTiempo(tiempo - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [tiempo]);

  return (
    <div className="flex flex-col items-center justify-center space-y-8 py-12">
      {/* Animación de Tambor/Ruleta */}
      <div className="relative">
        <div className="w-64 h-64 border-8 border-yellow-400 rounded-full flex items-center justify-center bg-gradient-to-br from-yellow-100 to-yellow-300 shadow-2xl animate-spin-slow">
          <div className="text-center">
            <div className="text-6xl font-bold text-yellow-800 animate-pulse">
              🎰
            </div>
          </div>
        </div>

        {/* Boletos girando */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="space-y-2 animate-bounce">
            {boletos.map((num, index) => (
              <div
                key={index}
                className="text-2xl font-mono font-bold text-blue-600 blur-sm"
                style={{
                  animation: `fadeInOut 0.5s ease-in-out ${index * 0.1}s infinite`,
                }}
              >
                {num.toString().padStart(5, '0')}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contador regresivo */}
      <div className="text-center space-y-4">
        <div className="text-5xl font-bold text-gray-800 animate-pulse">
          {tiempo}
        </div>
        <p className="text-xl text-gray-600 animate-pulse">
          Seleccionando ganadores...
        </p>

        {/* Barra de progreso */}
        <div className="w-64 h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-1000 ease-linear"
            style={{ width: `${((duracion - tiempo) / duracion) * 100}%` }}
          />
        </div>
      </div>

      {/* Efecto de confetti (decorativo) */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }

        @keyframes fadeInOut {
          0%, 100% {
            opacity: 0;
            transform: translateY(-10px);
          }
          50% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }

        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </div>
  );
};