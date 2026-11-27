import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";

/** Worker empaquetado (mismo origen). En Azure SWA hace falta worker-src 'self' blob: */
setWorkerUrl(workerUrl);
