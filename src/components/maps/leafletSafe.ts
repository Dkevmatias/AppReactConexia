import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/**
 * Teselas raster públicas (OSM.org, OSM.fr, Esri streets) se bloquean o
 * degradan en el dominio de producción. OpenFreeMap + MapLibre no pide API key
 * y permite uso comercial. Iconos van empaquetados (no unpkg).
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

export const ESTILO_OPENFREEMAP = "https://tiles.openfreemap.org/styles/liberty";

export const TILE_SEGURO = {
  url: ESTILO_OPENFREEMAP,
  attribution:
    '<a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> © <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
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
