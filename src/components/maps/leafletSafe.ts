import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/**
 * OSM.org suele responder 403 en apps. CARTO ahora exige API key (tesela gris).
 * Esri World Street Map no pide clave y permite uso con atribución.
 * Iconos van empaquetados: no se pide nada a unpkg.
 */
const proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown };
delete proto._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export const iconMarcador = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export const TILE_SEGURO = {
  url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
  attribution:
    'Teselas &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Fuente: Esri, OpenStreetMap',
};

export const MEXICO_CENTER: [number, number] = [19.4326, -99.1332];

export function boundsGeocercas(
  puntos: { latitud: number; longitud: number; radioMetros?: number }[],
): L.LatLngBounds | null {
  let bounds: L.LatLngBounds | null = null;
  for (const p of puntos) {
    if (!Number.isFinite(p.latitud) || !Number.isFinite(p.longitud)) continue;
    const radio = Math.max(p.radioMetros ?? 80, 80);
    const caja = L.latLng(p.latitud, p.longitud).toBounds(radio * 2.4);
    bounds = bounds ? bounds.extend(caja) : caja;
  }
  return bounds;
}
