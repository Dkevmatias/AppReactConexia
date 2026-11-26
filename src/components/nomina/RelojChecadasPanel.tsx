/* NOMCONEXIA-UNIFY */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { RelojChecada, RelojIntento, RelojPersonal, relojService } from "../../services/relojService";

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX");
}

function motivoLabel(motivo?: string | null) {
  if (!motivo) return "—";
  const map: Record<string, string> = {
    FueraDeGeocerca: "Fuera de geocerca",
    RostroNoCoincide: "Rostro no coincide",
    SinPruebaVida: "Sin prueba de vida",
    DispositivoNoAutorizado: "Dispositivo no autorizado",
    EntradaAbierta: "Entrada abierta",
    SinEntradaAbierta: "Sin entrada abierta",
    SinConsentimiento: "Sin consentimiento",
    SinPlantilla: "Sin plantilla",
    GpsImpreciso: "GPS impreciso",
    GpsApagado: "GPS apagado",
  };
  return map[motivo] || motivo;
}

type Props = {
  idEmpresa: number;
  idSucursal: number;
  personal: RelojPersonal[];
};

export default function RelojChecadasPanel({ idEmpresa, idSucursal, personal }: Props) {
  const hoy = isoDay(new Date());
  const hace15 = isoDay(new Date(Date.now() - 14 * 86400000));
  const [desde, setDesde] = useState(hace15);
  const [hasta, setHasta] = useState(hoy);
  const [idPersona, setIdPersona] = useState("");
  const [checadas, setChecadas] = useState<RelojChecada[]>([]);
  const [intentos, setIntentos] = useState<RelojIntento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"aceptadas" | "intentos">("aceptadas");

  const params = useMemo(
    () => ({
      idEmpresa,
      idSucursal,
      idPersona: idPersona ? Number(idPersona) : undefined,
      desde: `${desde}T00:00:00`,
      hasta: `${hasta}T23:59:59`,
    }),
    [idEmpresa, idSucursal, idPersona, desde, hasta]
  );

  const load = async () => {
    const [c, i] = await Promise.all([relojService.getChecadas(params), relojService.getIntentos(params)]);
    setChecadas(c);
    setIntentos(i);
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el historial"))
      .finally(() => setLoading(false));
  }, [params]);

  const rechazados = intentos.filter((i) => i.resultado === "Rechazado").length;

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Solo las checadas <strong>aceptadas</strong> quedan en RelojChecada. Los rechazos (fuera de zona, GPS
        impreciso, celular no autorizado) van a intentos. Faltas y retardos se aplican en{" "}
        <Link to="/nomina/incidencias" className="text-blue-600 underline dark:text-blue-400">
          Incidencias
        </Link>{" "}
        con la misma política de asistencia de la empresa.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div>
          <Label>Persona</Label>
          <Select
            options={[
              { value: "", label: "Todas" },
              ...personal.map((p) => ({ value: String(p.idPersona), label: p.nombre })),
            ]}
            value={idPersona}
            onChange={setIdPersona}
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
        <div className="flex items-end">
          <Button variant="outline" onClick={() => load().catch((e) => setError(e instanceof Error ? e.message : ""))}>
            Actualizar
          </Button>
        </div>
      </div>

      <div className="flex gap-2 text-sm">
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200">
          {checadas.length} aceptadas
        </span>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          {rechazados} rechazos
        </span>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</div>
      )}

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setTab("aceptadas")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "aceptadas" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
          }`}
        >
          Checadas
        </button>
        <button
          type="button"
          onClick={() => setTab("intentos")}
          className={`px-4 py-2 text-sm font-medium ${
            tab === "intentos" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
          }`}
        >
          Intentos
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Cargando…</p>
      ) : tab === "aceptadas" ? (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Fecha servidor</th>
                <th className="px-4 py-3">Persona</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Geocerca</th>
                <th className="px-4 py-3">Precisión</th>
                <th className="px-4 py-3">Score</th>
              </tr>
            </thead>
            <tbody>
              {checadas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No hay checadas en el período.
                  </td>
                </tr>
              ) : (
                checadas.map((c) => (
                  <tr key={c.idChecada} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">{fmt(c.fechaServidor)}</td>
                    <td className="px-4 py-3">{c.nombrePersona || `Persona ${c.idPersona}`}</td>
                    <td className="px-4 py-3">{c.tipo}</td>
                    <td className="px-4 py-3">{c.geocercaNombre || c.idGeocerca}</td>
                    <td className="px-4 py-3">{c.precisionMetros} m</td>
                    <td className="px-4 py-3">{c.scoreRostro}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Resultado</th>
                <th className="px-4 py-3">Motivo</th>
                <th className="px-4 py-3">Precisión</th>
              </tr>
            </thead>
            <tbody>
              {intentos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No hay intentos en el período.
                  </td>
                </tr>
              ) : (
                intentos.map((i) => (
                  <tr key={i.idIntento} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">{fmt(i.fechaServidor)}</td>
                    <td className="px-4 py-3">{i.tipoIntentado}</td>
                    <td className="px-4 py-3">{i.resultado}</td>
                    <td className="px-4 py-3">{motivoLabel(i.motivo)}</td>
                    <td className="px-4 py-3">{i.precisionMetros ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
