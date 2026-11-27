/* NOMCONEXIA-UNIFY */
import { useEffect, useMemo, useState } from "react";
import { Circle, CircleMarker, Tooltip } from "react-leaflet";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import MapaCarto from "../maps/MapaCarto";
import { Empresa } from "../../services/empresaService";
import {
  RelojChecada,
  RelojDispositivo,
  RelojGeocerca,
  RelojPersonal,
  RelojSucursal,
  relojService,
} from "../../services/relojService";

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmt(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-MX");
}

function esEntrada(tipo: string) {
  return tipo.trim().toLowerCase().startsWith("entrada");
}

function esSalida(tipo: string) {
  return tipo.trim().toLowerCase().startsWith("salida");
}

type TipoFiltro = "todos" | "Entrada" | "Salida";

type Props = {
  empresas: Empresa[];
  idEmpresaInicial: number;
  idSucursalInicial: number;
};

export default function RelojAnalisisGeocercasPanel({
  empresas,
  idEmpresaInicial,
  idSucursalInicial,
}: Props) {
  const hoy = isoDay(new Date());
  const hace15 = isoDay(new Date(Date.now() - 14 * 86400000));

  const [idEmpresa, setIdEmpresa] = useState(idEmpresaInicial ? String(idEmpresaInicial) : "todas");
  const [idSucursal, setIdSucursal] = useState(
    idSucursalInicial || idSucursalInicial === 0 ? String(idSucursalInicial) : "todas",
  );
  const [idPersona, setIdPersona] = useState("todas");
  const [tipo, setTipo] = useState<TipoFiltro>("todos");
  const [desde, setDesde] = useState(hace15);
  const [hasta, setHasta] = useState(hoy);

  const [sucursales, setSucursales] = useState<RelojSucursal[]>([]);
  const [personal, setPersonal] = useState<RelojPersonal[]>([]);
  const [dispositivos, setDispositivos] = useState<RelojDispositivo[]>([]);
  const [geocercas, setGeocercas] = useState<RelojGeocerca[]>([]);
  const [checadas, setChecadas] = useState<RelojChecada[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIdEmpresa(idEmpresaInicial ? String(idEmpresaInicial) : "todas");
    setIdSucursal(idSucursalInicial || idSucursalInicial === 0 ? String(idSucursalInicial) : "todas");
    setIdPersona("todas");
  }, [idEmpresaInicial, idSucursalInicial]);

  const empresaNum = idEmpresa === "todas" ? undefined : Number(idEmpresa) || undefined;
  const sucursalNum = idSucursal === "todas" ? undefined : Number(idSucursal);
  const personaNum = idPersona === "todas" ? undefined : Number(idPersona) || undefined;

  useEffect(() => {
    if (!empresaNum) {
      setSucursales([]);
      setPersonal([]);
      setDispositivos([]);
      setGeocercas([]);
      return;
    }
    let cancel = false;
    Promise.all([
      relojService.getSucursales(empresaNum),
      relojService.getPersonal(empresaNum),
      relojService.getDispositivos({ idEmpresa: empresaNum }).catch(() => [] as RelojDispositivo[]),
      relojService.getGeocercas(empresaNum, sucursalNum, true).catch(() => [] as RelojGeocerca[]),
    ])
      .then(([sucs, people, devices, geos]) => {
        if (cancel) return;
        setSucursales(sucs);
        setPersonal(people);
        setDispositivos(devices);
        setGeocercas(
          sucursalNum === undefined ? geos : geos.filter((g) => g.idSucursal === sucursalNum),
        );
        setIdSucursal((actual) => {
          if (actual === "todas") return actual;
          if (sucs.some((s) => String(s.idSucursal) === actual)) return actual;
          return sucs[0] ? String(sucs[0].idSucursal) : "todas";
        });
      })
      .catch((e) => {
        if (!cancel) setError(e instanceof Error ? e.message : "No se pudieron cargar catálogos");
      });
    return () => {
      cancel = true;
    };
  }, [empresaNum, sucursalNum]);

  const params = useMemo(
    () => ({
      idEmpresa: empresaNum,
      idSucursal: sucursalNum,
      idPersona: personaNum,
      desde: `${desde}T00:00:00`,
      hasta: `${hasta}T23:59:59`,
    }),
    [empresaNum, sucursalNum, personaNum, desde, hasta],
  );

  const loadChecadas = async () => {
    const data = await relojService.getChecadas(params);
    setChecadas(data);
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    loadChecadas()
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar las checadas"))
      .finally(() => setLoading(false));
  }, [params]);

  const personalFiltrado = useMemo(
    () =>
      sucursalNum === undefined ? personal : personal.filter((p) => p.idSucursal === sucursalNum),
    [personal, sucursalNum],
  );

  const sucursalPorId = useMemo(() => {
    const m = new Map<number, string>();
    for (const s of sucursales) m.set(s.idSucursal, s.nombre);
    return m;
  }, [sucursales]);

  const dispositivoPorId = useMemo(() => {
    const m = new Map<number, string>();
    for (const d of dispositivos) {
      m.set(d.idDispositivo, d.alias?.trim() || d.nombrePersona?.trim() || `Dispositivo ${d.idDispositivo}`);
    }
    return m;
  }, [dispositivos]);

  const checadasPorId = useMemo(() => {
    const m = new Map<number, RelojChecada>();
    for (const c of checadas) m.set(c.idChecada, c);
    return m;
  }, [checadas]);

  const parejaDe = (c: RelojChecada): RelojChecada | undefined => {
    if (c.idChecadaPareja) return checadasPorId.get(c.idChecadaPareja);
    return checadas.find((x) => x.idChecadaPareja === c.idChecada);
  };

  const visibles = useMemo(() => {
    return checadas.filter((c) => {
      if (!Number.isFinite(c.latitud) || !Number.isFinite(c.longitud)) return false;
      if (c.latitud === 0 && c.longitud === 0) return false;
      if (tipo === "Entrada") return esEntrada(c.tipo);
      if (tipo === "Salida") return esSalida(c.tipo);
      return esEntrada(c.tipo) || esSalida(c.tipo);
    });
  }, [checadas, tipo]);

  const puntosVista = useMemo(
    () => [
      ...geocercas
        .filter((g) => Number.isFinite(g.latitud) && Number.isFinite(g.longitud))
        .map((g) => ({ latitud: g.latitud, longitud: g.longitud, radioMetros: g.radioMetros })),
      ...visibles.map((c) => ({ latitud: c.latitud, longitud: c.longitud, radioMetros: 60 })),
    ],
    [geocercas, visibles],
  );

  const entradas = visibles.filter((c) => esEntrada(c.tipo)).length;
  const salidas = visibles.filter((c) => esSalida(c.tipo)).length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Ubicación real de checadas aceptadas. <span className="font-medium text-emerald-700 dark:text-emerald-300">Verde</span> =
        entrada, <span className="font-medium text-red-700 dark:text-red-300">rojo</span> = salida. Pasa el cursor
        sobre el punto para ver empleado, dispositivo, sucursal y horario.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <Label>Empresa</Label>
          <Select
            options={[
              { value: "todas", label: "Todas" },
              ...empresas.map((e) => ({ value: String(e.idEmpresa), label: e.nombre })),
            ]}
            value={idEmpresa}
            onChange={(v) => {
              setIdEmpresa(v);
              setIdSucursal("todas");
              setIdPersona("todas");
            }}
          />
        </div>
        <div>
          <Label>Sucursal</Label>
          <Select
            options={[
              { value: "todas", label: "Todas" },
              ...sucursales.map((s) => ({ value: String(s.idSucursal), label: s.nombre })),
            ]}
            value={idSucursal}
            onChange={(v) => {
              setIdSucursal(v);
              setIdPersona("todas");
            }}
          />
        </div>
        <div>
          <Label>Empleado</Label>
          <Select
            options={[
              { value: "todas", label: "Todos" },
              ...personalFiltrado.map((p) => ({ value: String(p.idPersona), label: p.nombre })),
            ]}
            value={idPersona}
            onChange={setIdPersona}
          />
        </div>
        <div>
          <Label>Tipo de registro</Label>
          <Select
            options={[
              { value: "todos", label: "Entrada y salida" },
              { value: "Entrada", label: "Entrada" },
              { value: "Salida", label: "Salida" },
            ]}
            value={tipo}
            onChange={(v) => setTipo(v as TipoFiltro)}
          />
        </div>
        <div>
          <Label>Desde</Label>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div>
          <Label>Hasta</Label>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          {entradas} entrada(s)
        </span>
        <span className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-200">
          {salidas} salida(s)
        </span>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          {geocercas.length} geocerca(s)
        </span>
        <Button
          variant="outline"
          onClick={() =>
            loadChecadas().catch((e) => setError(e instanceof Error ? e.message : "No se pudo actualizar"))
          }
        >
          Actualizar
        </Button>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-gray-500">Cargando mapa de checadas…</p>
      ) : (
        <div className="h-[520px] overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
          <MapaCarto
            key={`analisis-${empresaNum ?? 0}-${sucursalNum ?? "t"}-${personaNum ?? "t"}-${tipo}-${visibles.length}`}
            puntosAjuste={puntosVista}
            zoom={puntosVista.length ? 16 : 5}
          >
            {geocercas.map((g) =>
              Number.isFinite(g.latitud) && Number.isFinite(g.longitud) ? (
                <Circle
                  key={`geo-${g.idGeocerca}`}
                  center={[g.latitud, g.longitud]}
                  radius={g.radioMetros}
                  pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.08, weight: 1 }}
                >
                  <Tooltip direction="center" permanent={false}>
                    <span className="text-xs">{g.nombre}</span>
                  </Tooltip>
                </Circle>
              ) : null,
            )}
            {visibles.map((c) => {
              const entrada = esEntrada(c.tipo);
              const pareja = parejaDe(c);
              const horaEste = fmt(c.fechaServidor);
              const horaPar = pareja ? fmt(pareja.fechaServidor) : "—";
              const horaEntrada =
                entrada ? horaEste : pareja && esEntrada(pareja.tipo) ? horaPar : "—";
              const horaSalida =
                !entrada ? horaEste : pareja && esSalida(pareja.tipo) ? horaPar : "—";
              const sucursalNombre =
                sucursalPorId.get(c.idSucursal) || `Sucursal ${c.idSucursal}`;
              const dispositivoNombre =
                dispositivoPorId.get(c.idDispositivo) || `Dispositivo ${c.idDispositivo}`;
              const lat = c.latitud + (entrada ? 0 : 0.000035);
              const lng = c.longitud + (entrada ? 0 : 0.000035);
              return (
                <CircleMarker
                  key={c.idChecada}
                  center={[lat, lng]}
                  radius={9}
                  pathOptions={{
                    color: entrada ? "#047857" : "#b91c1c",
                    fillColor: entrada ? "#22c55e" : "#ef4444",
                    fillOpacity: 0.95,
                    weight: 2,
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]} opacity={1} sticky>
                    <div className="min-w-[220px] text-sm leading-5 text-gray-800">
                      <div className="font-semibold">{c.nombrePersona || `Persona ${c.idPersona}`}</div>
                      <div>
                        <span className="text-gray-500">Dispositivo:</span> {dispositivoNombre}
                      </div>
                      <div>
                        <span className="text-gray-500">Sucursal:</span> {sucursalNombre}
                      </div>
                      <div>
                        <span className="text-gray-500">Tipo:</span> {entrada ? "Entrada" : "Salida"}
                      </div>
                      <div>
                        <span className="text-emerald-700">Entrada:</span> {horaEntrada}
                      </div>
                      <div>
                        <span className="text-red-700">Salida:</span> {horaSalida}
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
          </MapaCarto>
        </div>
      )}

      {!loading && visibles.length === 0 ? (
        <p className="text-sm text-gray-500">
          No hay checadas con GPS en el período y filtros elegidos.
        </p>
      ) : null}
    </div>
  );
}
