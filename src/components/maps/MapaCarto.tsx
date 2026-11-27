import { useEffect, useRef, useState, type ReactNode } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import { CAPAS_TESELA, boundsGeocercas, MEXICO_CENTER } from "./leafletSafe";

type PuntoGeo = { latitud: number; longitud: number; radioMetros?: number };

const SIN_PUNTOS: PuntoGeo[] = [];

function TeselaSegura() {
  const map = useMap();
  const [idx, setIdx] = useState(0);
  const fallos = useRef(0);
  const capa = CAPAS_TESELA[idx] ?? CAPAS_TESELA[0];

  useEffect(() => {
    fallos.current = 0;
    const onError = () => {
      fallos.current += 1;
      if (fallos.current >= 3 && idx < CAPAS_TESELA.length - 1) {
        setIdx((n) => n + 1);
      }
    };
    map.on("tileerror", onError);
    return () => {
      map.off("tileerror", onError);
    };
  }, [map, idx]);

  return (
    <TileLayer
      key={capa.id}
      url={capa.url}
      attribution={capa.attribution}
      subdomains={capa.subdomains ?? "abc"}
      maxZoom={19}
      maxNativeZoom={capa.maxNativeZoom ?? 19}
    />
  );
}

function ClicMapa({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function AjustarVista({
  center,
  zoom,
  puntos,
}: {
  center: LatLngExpression;
  zoom: number;
  puntos: PuntoGeo[];
}) {
  const map = useMap();
  const clave = JSON.stringify(puntos);
  useEffect(() => {
    const bounds = boundsGeocercas(puntos);
    if (bounds) {
      map.fitBounds(bounds, { padding: [28, 28], maxZoom: 17 });
    } else {
      map.setView(center, zoom);
    }
    const t = window.setTimeout(() => map.invalidateSize(), 220);
    return () => window.clearTimeout(t);
  }, [map, center, zoom, clave, puntos]);
  return null;
}

type Props = {
  center?: LatLngExpression;
  zoom?: number;
  puntosAjuste?: PuntoGeo[];
  onPick?: (lat: number, lng: number) => void;
  children?: ReactNode;
  className?: string;
};

export default function MapaCarto({
  center = MEXICO_CENTER,
  zoom = 5,
  puntosAjuste = SIN_PUNTOS,
  onPick,
  children,
  className = "h-full w-full",
}: Props) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      maxZoom={19}
      className={className}
      scrollWheelZoom
      style={{ zIndex: 0, background: "#e8eef2" }}
    >
      <TeselaSegura />
      <AjustarVista center={center} zoom={zoom} puntos={puntosAjuste} />
      {onPick ? <ClicMapa onPick={onPick} /> : null}
      {children}
    </MapContainer>
  );
}
