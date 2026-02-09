
import { Ganador } from '../../services/sorteoServices';

interface Props {
  ganador: Ganador;
  delay?: number;
}

export const TarjetaGanador = ({ ganador, delay = 0 }: Props) => {
  const getMedalEmoji = (posicion: number) => {
    switch (posicion) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🎯';
    }
  };

  const getBorderColor = (posicion: number) => {
    switch (posicion) {
      case 1:
        return 'border-yellow-400 bg-yellow-50';
      case 2:
        return 'border-gray-400 bg-gray-50';
      case 3:
        return 'border-orange-400 bg-orange-50';
      default:
        return 'border-blue-400 bg-blue-50';
    }
  };

  return (
    <div
      className={`
        border-4 rounded-xl p-6 shadow-lg transform transition-all duration-500
        hover:scale-105 hover:shadow-2xl animate-fade-in-up
        ${getBorderColor(ganador.posicion)}
      `}
      style={{
        animationDelay: `${delay}ms`,
      }}
    >
      <div className="flex items-start space-x-4">
        {/* Medalla/Posición */}
        <div className="flex flex-col items-center">
          <div className="text-5xl mb-2">{getMedalEmoji(ganador.posicion)}</div>
          <div className="text-sm font-bold text-gray-600">
            {ganador.posicion}° Lugar
          </div>
        </div>

        {/* Información del ganador */}
        <div className="flex-1 space-y-2">
          <div>
            <span className="text-sm text-gray-500 font-medium">Cliente:</span>
            <p className="text-lg font-bold text-gray-800">
              {ganador.cardCode} - {ganador.nombreCliente}
            </p>
          </div>

          <div>
            <span className="text-sm text-gray-500 font-medium">Boleto Ganador:</span>
            <p className="text-xl font-mono font-bold text-green-600">
              {ganador.codigoBoleto}
            </p>
          </div>

          <div>
            <span className="text-sm text-gray-500 font-medium">Hash de Validación:</span>
            <p className="text-xs font-mono text-gray-500 break-all">
              {ganador.hashValidacion.substring(0, 40)}...
            </p>
          </div>

          <div className="text-xs text-gray-400">
            {new Date(ganador.fechaGeneracion).toLocaleString('es-MX')}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};