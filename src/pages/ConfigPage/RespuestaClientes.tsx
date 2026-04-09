import { useEffect, useMemo, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import { useAuth } from "../../context/useAuth";
import { getPersonasTelefono } from "../../services/authService";
import {
  Conversacion,
  getConversaciones,
  marcarRespuesta,
} from "../../services/conversacionesService";
import { FaWhatsapp } from "react-icons/fa";

interface Persona {
  idPersona: number;
  cardCode: string;
  fullName: string | null;
  telefono: string | null;
  activo?: boolean;
}

interface ConversacionEnriquecida extends Conversacion {
  nombreReal?: string | null;
}
const normalizarTelefono = (telefono?: string | null): string => {
  if (!telefono) return "";
  const soloDigitos = telefono.replace(/\D/g, "");
  return soloDigitos.slice(-10);
};
const getWhatsappNumber = (telefono?: string | null): string | null => {
  if (!telefono) return null;
  const soloDigitos = telefono.replace(/\D/g, "");
  return soloDigitos || null;
};
const formatFechaHora = (fechaIso: string) => {
  if (!fechaIso) return "-";
  const fecha = new Date(fechaIso);
  return fecha.toLocaleString("es-MX", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

export default function RespuestaClientes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [marcandoId, setMarcandoId] = useState<number | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      if (!user?.idPersona) return;
      setLoading(true);
      setError(null);

      try {
        const [convs, personas] = await Promise.all([
          getConversaciones(),
          getPersonasTelefono(),
        ]);

        setConversaciones(convs || []);
        setPersonas(personas || []);
      } catch (err) {
        console.error("Error cargando conversaciones o personas:", err);
        setError("No se pudieron cargar las conversaciones.");
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [user?.idPersona]);

  const conversacionesEnriquecidas: ConversacionEnriquecida[] = useMemo(() => {
    if (!conversaciones.length) return [];

    const mapaPersonasPorTelefono = new Map<string, Persona>();
    personas.forEach((p) => {
      const key = normalizarTelefono(p.telefono);

      if (key) {
        mapaPersonasPorTelefono.set(key, p);
      }
    });

    return conversaciones.map((c) => {
      const key = normalizarTelefono(c.telefono);
      const persona = mapaPersonasPorTelefono.get(key);

      return {
        ...c,
        nombreReal: persona?.fullName ?? null,
      };
    });
  }, [conversaciones, personas]);

  const handleWhatsappClick = async (
    e: React.MouseEvent,
    conv: ConversacionEnriquecida,
  ) => {
    e.preventDefault();
    const num = getWhatsappNumber(conv.telefono);
    if (!num) return;

    if (!conv.respondido) {
      setError(null);
      setMarcandoId(conv.idConversacion);
      try {
        await marcarRespuesta(conv.idConversacion, user?.idPersona || 0);
        setConversaciones((prev) =>
          prev.map((c) =>
            c.idConversacion === conv.idConversacion
              ? { ...c, respondido: true }
              : c,
          ),
        );
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "No se pudo marcar como respondido.",
        );
        setMarcandoId(null);
        return;
      } finally {
        setMarcandoId(null);
      }
    }

    window.open(`https://wa.me/${num}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <PageMeta
        title="Conversaciones de Clientes"
        description="Listado de conversaciones de WhatsApp vinculadas a clientes."
      />

      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Conversaciones de clientes
      </h1>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/30 p-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      ) : conversacionesEnriquecidas.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No hay conversaciones registradas.
        </p>
      ) : (
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">Teléfono</th>
                <th className="px-3 py-2 text-left">Nombre WhatsApp</th>
                <th className="px-3 py-2 text-left">Nombre cliente</th>
                <th className="px-3 py-2 text-left">Último mensaje</th>
                <th className="px-3 py-2 text-left">Fecha último mensaje</th>
                <th className="px-3 py-2 text-left">Estado</th>
                <th className="px-3 py-2 text-center">Acciones</th>
                <th className="px-3 py-2 text-center">WhatsApp</th>
              </tr>
            </thead>
            <tbody>
              {conversacionesEnriquecidas.map((conv) => (
                <tr
                  key={conv.idConversacion}
                  className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-3 py-2">{conv.telefono}</td>
                  <td className="px-3 py-2">{conv.nombre || "-"}</td>
                  <td className="px-3 py-2">
                    {conv.nombreReal || (
                      <span className="text-gray-400">Sin coincidencia</span>
                    )}
                  </td>
                  <td className="px-3 py-2 align-top whitespace-pre-wrap break-words">
                    {conv.ultimoMensaje || (
                      <span className="text-gray-400">Sin mensaje</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {formatFechaHora(conv.fechaUltimoMensaje)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        conv.noLeido
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {conv.noLeido ? "No leído" : conv.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        conv.respondido
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      }`}
                    >
                      {conv.respondido ? "Respondido" : "No respondido"}
                    </span>
                  </td>

                  <td className="px-3 py-2 text-center">
                    {getWhatsappNumber(conv.telefono) ? (
                      <button
                        type="button"
                        disabled={marcandoId === conv.idConversacion}
                        onClick={(e) => handleWhatsappClick(e, conv)}
                        className="inline-flex items-center justify-center rounded-full p-1.5 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:pointer-events-none"
                        title={
                          conv.respondido
                            ? "Abrir WhatsApp"
                            : "Marcar respondido y abrir WhatsApp"
                        }
                      >
                        {marcandoId === conv.idConversacion ? (
                          <span className="inline-block h-5 w-5 animate-pulse rounded-full bg-green-200 dark:bg-green-800" />
                        ) : (
                          <FaWhatsapp className="h-5 w-5 text-green-500" />
                        )}
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs">
                        Sin teléfono
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
