/* NOMCONEXIA-UNIFY */
import { useEffect, useState } from 'react';
import { traccarService, TraccarDevice } from '../../services/traccarService';
import { MapPin, Phone, Clock, Navigation, List, Map } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const iconMarker = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const GPSPage = () => {
  const [devices, setDevices] = useState<TraccarDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<TraccarDevice | null>(null);
  const [activeTab, setActiveTab] = useState<'list' | 'map'>('list');

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      setLoading(true);
      const data = await traccarService.getDevices();
      setDevices(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar dispositivos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin datos';
    const date = new Date(dateString);
    return date.toLocaleString('es-MX');
  };

  const formatSpeed = (speed: number) => {
    if (!speed || speed < 0) return '0';
    return Math.round(speed * 1.852).toString();
  };

  const devicesWithPosition = devices.filter(d => d.position);

  const getMapCenter = () => {
    if (devicesWithPosition.length === 0) return [16.7335, -93.099] as [number, number];
    const avgLat = devicesWithPosition.reduce((sum, d) => sum + d.position!.latitude, 0) / devicesWithPosition.length;
    const avgLng = devicesWithPosition.reduce((sum, d) => sum + d.position!.longitude, 0) / devicesWithPosition.length;
    return [avgLat, avgLng] as [number, number];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
        <button 
          onClick={loadDevices}
          className="ml-2 underline"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Seguimiento GPS
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Monitorea la ubicación de tus dispositivos en tiempo real
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'list' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <List className="w-4 h-4" />
          Lista
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            activeTab === 'map' 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
        >
          <Map className="w-4 h-4" />
          Mapa
        </button>
      </div>

      {activeTab === 'list' && (
        <>
          {devices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay dispositivos registrados
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map((device) => (
                <div
                  key={device.id}
                  onClick={() => {
                    console.log('Device status:', device.status);
                    setSelectedDevice(device);
                  }}
                  className={`
                    bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 cursor-pointer
                    transition-all hover:shadow-lg border-l-4
                    ${device.status === 'online' || device.status === 'true' ? 'border-green-500' : 'border-gray-400'}
                    ${selectedDevice?.id === device.id ? 'ring-2 ring-blue-500' : ''}
                  `}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {device.name || 'Dispositivo sin nombre'}
                      </span>
                    </div>
                    <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${device.status === 'online' || device.status === 'true' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'}
                    `}>
                      {device.status === 'online' || device.status === 'true' ? 'En línea' : 'Desconectado'} ({device.status})
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {device.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{device.phone}</span>
                      </div>
                    )}

                    {device.position && (
                      <>
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4" />
                          <span>
                            Lat: {device.position.latitude.toFixed(6)}, Lng: {device.position.longitude.toFixed(6)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>Última actualización: {formatDate(device.position.fixTime)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-medium">Velocidad:</span>
                          <span>{formatSpeed(device.position.speed)} km/h</span>
                        </div>
                      </>
                    )}

                    {!device.position && (
                      <div className="text-gray-400 italic">
                        Sin posición disponible
                      </div>
                    )}

                    {device.lastUpdate && (
                      <div className="text-xs text-gray-400 mt-2">
                        Actualizado: {formatDate(device.lastUpdate)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'map' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4">
          <h2 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
            Mapa de Dispositivos
          </h2>
          <div className="h-[500px] rounded-lg overflow-hidden">
            <MapContainer
              center={getMapCenter()}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {devicesWithPosition.map((device) => (
                <Marker
                  key={device.id}
                  position={[device.position!.latitude, device.position!.longitude]}
                  icon={iconMarker}
                >
                  <Popup>
                    <div className="text-sm">
                      <strong className="block text-base">{device.name}</strong>
                      <div>Velocidad: {formatSpeed(device.position!.speed)} km/h</div>
                      <div>Última actualización: {formatDate(device.position!.fixTime)}</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default GPSPage;
