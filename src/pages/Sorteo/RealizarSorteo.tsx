import { useState } from 'react';
import { useSorteo } from '../../hooks/useSorteo';
import { AnimacionSorteo } from '../../components/Sorteo/AnimacionSorteo';
import { TarjetaGanador } from '../../components/Sorteo/TarjetaGanador';
import { SorteoRequest } from '../../services/sorteoServices';

export default function RealizarSorteo() {
  const {
    loading,
    resultado,
    error,
    mostrandoGanadores,
    realizarSorteo,
    descargarPDF,
    resetear,
  } = useSorteo();

  const [formData, setFormData] = useState<SorteoRequest>({
    idPeriodo: 0,
    cantidadGanadores: 1,
    observaciones: '',
    semillaPublica: '',
  });

  const [descargandoPDF, setDescargandoPDF] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await realizarSorteo(formData);
    } catch (err) {
      console.error('Error al realizar sorteo:', err);
    }
  };

  const handleDescargarPDF = async () => {
    if (!resultado?.datos.idSorteo) return;

    try {
      setDescargandoPDF(true);
      await descargarPDF(resultado.datos.idSorteo);
    } catch (err) {
      alert('Error al descargar el PDF');
    } finally {
      setDescargandoPDF(false);
    }
  };


  const handleNuevoSorteo = () => {
    resetear();
    setFormData(prev =>({
      ...prev,
      idPeriodo: prev.idPeriodo + 1,
      cantidadGanadores: prev.cantidadGanadores,
      observaciones: '',
      semillaPublica: '',
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">
            🎰 Sistema de Sorteos
          </h1>
          <p className="text-xl text-gray-600">
            Realiza sorteos aleatorios y auditables
          </p>
        </div>

        {/* Formulario o Resultados */}
        {!loading && !mostrandoGanadores ? (
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Configurar Sorteo
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ID Periodo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Numero de Sorteo*
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.idPeriodo}
                  onChange={(e) =>
                    setFormData({ ...formData, idPeriodo: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 1"
                />
              </div>

              {/* Cantidad de Ganadores */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad de Ganadores *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max="30"
                  value={formData.cantidadGanadores}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      cantidadGanadores: parseInt(e.target.value),
                    })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: 3"
                />
                <p className="text-sm text-gray-500 mt-1">Máximo 30 ganadores</p>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones (Opcional)
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) =>
                    setFormData({ ...formData, observaciones: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Sorteo mensual de enero 2026"
                />
              </div>

              {/* Semilla Pública */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semilla Pública (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.semillaPublica}
                  onChange={(e) =>
                    setFormData({ ...formData, semillaPublica: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: SORTEO-ENE-2026"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Para reproducibilidad del sorteo
                </p>
              </div>

              {/* Mensaje de Error */}
              {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Botón de Realizar Sorteo */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-3"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Realizando Sorteo...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <span className="mr-2">🎲</span>
                    Realizar Sorteo
                  </span>
                )}
              </button>
            </form>
          </div>
        ) : loading ? (
          /* Animación mientras se realiza el sorteo */
          <div className="bg-white rounded-2xl shadow-2xl p-12">
            <AnimacionSorteo duracion={10} />
          </div>
        ) : (
          /* Resultados del Sorteo */
          mostrandoGanadores &&
          resultado && (
            <div className="space-y-8 animate-fade-in">
              {/* Encabezado de Resultados */}
              <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-4xl font-bold text-gray-800 mb-2">
                  ¡Sorteo Realizado!
                </h2>
                <p className="text-xl text-gray-600 mb-4">
                  Sorteo #{resultado.datos.idSorteo}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(resultado.datos.fechaSorteo).toLocaleString('es-MX')}
                </p>

                {/* Metadata */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total de Boletos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {resultado.datos.metadata.totalBoletosParticipantes.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Total de Clientes</p>
                    <p className="text-2xl font-bold text-green-600">
                      {resultado.datos.metadata.totalClientesParticipantes.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Ganadores</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {resultado.datos.ganadores.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Ganadores */}
              <div className="space-y-6">
                <h3 className="text-3xl font-bold text-gray-800 text-center mb-6">
                  🏆 Ganadores
                </h3>
                {resultado.datos.ganadores.map((ganador, index) => (
                  <TarjetaGanador
                    key={ganador.codigoBoleto}
                    ganador={ganador}
                    delay={index * 300}
                  />
                ))}
              </div>

              {/* Botones de Acción */}
              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                  onClick={handleDescargarPDF}
                  disabled={descargandoPDF}
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold py-4 px-8 rounded-lg hover:from-red-700 hover:to-pink-700 transform transition-all duration-200 hover:scale-105 disabled:opacity-50 shadow-lg"
                >
                  {descargandoPDF ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-3"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Generando PDF...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">📄</span>
                      Descargar Certificado PDF
                    </span>
                  )}
                </button>

                <button
                  onClick={handleNuevoSorteo}
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-4 px-8 rounded-lg hover:from-green-700 hover:to-teal-700 transform transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  <span className="flex items-center justify-center">
                    <span className="mr-2">🔄</span>
                    Realizar Nuevo Sorteo
                  </span>
                </button>
              </div>

              {/* Hash de Verificación */}
              <div className="bg-gray-100 rounded-xl p-6">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Hash de Verificación:
                </p>
                <p className="text-xs font-mono text-gray-600 break-all">
                  {resultado.datos.hashSemilla}
                </p>
              </div>
            </div>
          )
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}