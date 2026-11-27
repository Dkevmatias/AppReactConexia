import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/**
 * OSM.org suele responder 403 en apps. CARTO exige API key.
 * Esri World Street Map a zoom de geocerca (16–17) pinta “Map data not yet available”.
 * HOT OSM (Francia) sí tiene calles a ese zoom; OSM.de e imagen Esri son respaldo.
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

export type TeselaCfg = {
  id: string;
  url: string;
  attribution: string;
  subdomains?: string;
  maxNativeZoom?: number;
};

export const CAPAS_TESELA: TeselaCfg[] = [
  {
    id: "osm-hot",
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · HOT',
    subdomains: "abc",
    maxNativeZoom: 20,
  },
  {
    id: "osm-de",
    url: "https://tile.openstreetmap.de/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxNativeZoom: 18,
  },
  {
    id: "esri-img",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Teselas &copy; Esri — Earthstar Geographics",
    maxNativeZoom: 19,
  },
];

export const TILE_SEGURO = CAPAS_TESELA[0];

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
