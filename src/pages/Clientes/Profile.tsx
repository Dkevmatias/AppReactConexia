import { useEffect, useState } from "react";
import { useAuth } from "../../context/useAuth";
import { getPersonas, getDatosCliente, getCarteraCliente, DatosCliente, DocumentoCartera } from "../../services/authService";
import PageMeta from "../../components/common/PageMeta";

interface PersonaRelacionada {
  idPersonaRelacion: number;
  idPersona: number;
  cardCode: string;
  fullname: string | null;
  activo: boolean;
}

const formatCurrency = (value: number) => 
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0);

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-MX');
};

const Profile = () => {
  const { user } = useAuth();
  const [datosCliente, setDatosCliente] = useState<DatosCliente | null>(null);
  const [personasRelacionadas, setPersonasRelacionadas] = useState<PersonaRelacionada[]>([]);
  const [cartera, setCartera] = useState<DocumentoCartera[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.idPersona) {
      cargarDatos();
    }
  }, [user?.idPersona]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [cliente, personas] = await Promise.all([
        getDatosCliente(user!.idPersona),
        getPersonas(user!.idPersona)
      ]);
      setDatosCliente(cliente);
      setPersonasRelacionadas(personas);

      // Armar array de cardCodes (cliente principal + relacionados)
      const cardCodes = [
        cliente?.cardCode,
        ...personas.map((p: PersonaRelacionada) => p.cardCode).filter(Boolean)
      ].filter(Boolean) as string[];

      console.log("CardCodes a enviar:", JSON.stringify(cardCodes));

      if (cardCodes.length > 0) {
        try {
          const response = await getCarteraCliente(cardCodes);
           console.log("Cartera :", response);
          console.log("Cartera response:", cardCodes);
          const carteraData = response || [];
          setCartera(carteraData);
        } catch (error) {
          console.error("Error cargando cartera:", error);
          setCartera([]);
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalVencido = cartera
    .filter(d => d.diasVencido > 0)
    .reduce((acc, d) => acc + d.saldoDocumento, 0);

  const totalPorVencer = cartera
    .filter(d => d.diasVencido <= 0)
    .reduce((acc, d) => acc + d.saldoDocumento, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageMeta title="Perfil | 50 Aniversario" description="Perfil del cliente" />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6"> Cuenta Principal</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Nombre Completo
            </label>
            <p className="text-lg font-semibold">{datosCliente?.nombre?.trim() || user?.fullname || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Código de Cliente
            </label>
            <p className="text-lg font-semibold">{datosCliente?.cardCode || user?.cardCode || 'N/A'}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Sociedad
            </label>
            <p className="text-lg font-semibold">{datosCliente?.sociedad || '-'}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Correo Electrónico
            </label>
            <p className="text-lg font-semibold">{datosCliente?.email || '-'}</p>
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">
              Teléfono
            </label>
            <p className="text-lg font-semibold">{datosCliente?.telefono || '-'}</p>
          </div>
        </div>
      </div>

      {cartera.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px] bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">Total Vencido</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalVencido)}</p>
            </div>
            <div className="flex-1 min-w-[200px] bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">Total Por Vencer</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPorVencer)}</p>
            </div>
            <div className="flex-1 min-w-[200px] bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">Total Cartera</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalVencido + totalPorVencer)}</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-4">Estado de Cartera</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Documentos de tu cuenta
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Folio</th>
                  <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                  <th className="px-3 py-2 text-left font-semibold">Vencimiento</th>
                  <th className="px-3 py-2 text-right font-semibold">Importe</th>
                  <th className="px-3 py-2 text-right font-semibold">Días</th>
                  <th className="px-3 py-2 text-center font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cartera.map((doc, index) => (
                  <tr 
                    key={index} 
                    className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-3 py-2 font-medium">{doc.docNum}</td>
                    <td className="px-3 py-2">{formatDate(doc.docDate)}</td>
                    <td className="px-3 py-2">{formatDate(doc.docDueDate)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(doc.saldoDocumento)}</td>
                    <td className="px-3 py-2 text-right">
                      {doc.diasVencido > 0 ? (
                        <span className="text-red-600 font-medium">{doc.diasVencido}</span>
                      ) : (
                        <span className="text-green-600">{Math.abs(doc.diasVencido)}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {doc.diasVencido > 0 ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                          Vencido
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                          Por Vencer
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {personasRelacionadas.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Cuentas Relacionadas</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            Cuentas relacionadas a tu cuenta principal
          </p>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Código</th>
                  <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-center font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody>
                {personasRelacionadas.map((persona, index) => (
                  <tr 
                    key={persona.idPersonaRelacion || index} 
                    className="border-t dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-3 font-medium">{persona.cardCode}</td>
                    <td className="px-4 py-3">{persona.fullname || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        persona.activo 
                          ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                          : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                      }`}>
                        {persona.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {personasRelacionadas.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <p className="text-gray-500 text-center">
            No tienes cuentas relacionadas asociadas a tu perfil.
          </p>
        </div>
      )}
    </div>
  );
};

export default Profile;
