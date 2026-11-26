/* NOMCONEXIA-UNIFY */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import RelojGeocercasPanel from "../../components/nomina/RelojGeocercasPanel";
import RelojDispositivosPanel from "../../components/nomina/RelojDispositivosPanel";
import RelojChecadasPanel from "../../components/nomina/RelojChecadasPanel";
import { empresaService, Empresa } from "../../services/empresaService";
import {
  horaToInput,
  politicaRetardoService,
  PoliticaRetardo,
} from "../../services/politicaRetardoService";
import { RelojPersonal, RelojSucursal, relojService } from "../../services/relojService";

type Tab = "geocercas" | "dispositivos" | "checadas";

function limiteRetardo(hora: string, tolerancia: number) {
  const [h, m] = horaToInput(hora).split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + (tolerancia || 0);
  const hh = Math.floor(total / 60) % 24;
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function RelojAdmin() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [idEmpresa, setIdEmpresa] = useState(0);
  const [sucursales, setSucursales] = useState<RelojSucursal[]>([]);
  const [idSucursal, setIdSucursal] = useState(0);
  const [nuevaSucursal, setNuevaSucursal] = useState("");
  const [personal, setPersonal] = useState<RelojPersonal[]>([]);
  const [politica, setPolitica] = useState<PoliticaRetardo | null>(null);
  const [tab, setTab] = useState<Tab>("geocercas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    empresaService
      .getEmpresas()
      .then((list) => {
        const activas = list.filter((e) => e.activo !== false);
        setEmpresas(activas);
        setIdEmpresa((actual) => actual || activas[0]?.idEmpresa || 0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar las empresas"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!idEmpresa) return;
    setError("");
    Promise.all([
      relojService.getSucursales(idEmpresa),
      relojService.getPersonal(idEmpresa),
      politicaRetardoService.getByEmpresa(idEmpresa).catch(() => null),
    ])
      .then(([sucs, people, pack]) => {
        setSucursales(sucs);
        setPersonal(people);
        setPolitica(pack?.empresa ?? null);
        setIdSucursal((actual) => {
          if (sucs.some((s) => s.idSucursal === actual)) return actual;
          return sucs[0]?.idSucursal ?? 0;
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar el reloj"));
  }, [idEmpresa]);

  const sucursal = sucursales.find((s) => s.idSucursal === idSucursal);
  const personalSucursal = useMemo(
    () => personal.filter((p) => p.idSucursal === idSucursal),
    [personal, idSucursal]
  );

  const agregarSucursal = () => {
    const id = Number(nuevaSucursal);
    if (!Number.isInteger(id) || id < 0) {
      setError("La sucursal debe ser un número entero (el IdSucursal de Personas).");
      return;
    }
    if (!sucursales.some((s) => s.idSucursal === id)) {
      setSucursales((prev) =>
        [...prev, { idSucursal: id, nombre: id === 0 ? "Matriz" : `Sucursal ${id}`, personas: 0, geocercasActivas: 0 }].sort(
          (a, b) => a.idSucursal - b.idSucursal
        )
      );
    }
    setIdSucursal(id);
    setNuevaSucursal("");
    setTab("geocercas");
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Reloj de oficina</h1>
          <p className="mt-1 max-w-3xl text-gray-500 dark:text-gray-400">
            Administra geocercas y celulares autorizados por sucursal. Las checadas de la app se validan en el
            servidor; faltas y retardos siguen la política de asistencia y se capturan en incidencias.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/nomina/incidencias">
            <Button variant="outline">Incidencias</Button>
          </Link>
          <Link to="/nomina/incidencias/checador">
            <Button variant="outline">Importar Excel</Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <Label>Empresa</Label>
            <Select
              options={empresas.map((e) => ({ value: String(e.idEmpresa), label: e.nombre }))}
              value={idEmpresa ? String(idEmpresa) : ""}
              onChange={(v) => setIdEmpresa(Number(v) || 0)}
            />
          </div>
          <div>
            <Label>Sucursal</Label>
            <Select
              options={sucursales.map((s) => ({
                value: String(s.idSucursal),
                label: `${s.nombre} · ${s.geocercasActivas} geocerca(s)`,
              }))}
              value={String(idSucursal)}
              onChange={(v) => setIdSucursal(Number(v))}
            />
          </div>
          <div>
            <Label>Agregar IdSucursal</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                value={nuevaSucursal}
                onChange={(e) => setNuevaSucursal(e.target.value)}
                placeholder="Ej. 1"
              />
              <Button variant="outline" onClick={agregarSucursal}>
                Usar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {idEmpresa > 0 && politica && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900 dark:bg-blue-950/20">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-white">Política de asistencia (nómina)</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Entrada {horaToInput(politica.horaEntrada)} · tolerancia {politica.toleranciaMinutos} min · retardo
                después de las {limiteRetardo(politica.horaEntrada, politica.toleranciaMinutos)} · falta a los{" "}
                {politica.minutosFalta} min.
              </p>
            </div>
            <Link to="/nomina/empresas" className="text-sm text-blue-700 underline dark:text-blue-400">
              Editar en Empresas → Asistencia
            </Link>
          </div>
        </div>
      )}

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {(
          [
            ["geocercas", "Geocercas"],
            ["dispositivos", "Dispositivos y personal"],
            ["checadas", "Checadas"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === key ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {idEmpresa > 0 && tab === "geocercas" && (
        <RelojGeocercasPanel
          idEmpresa={idEmpresa}
          idSucursal={idSucursal}
          sucursalNombre={sucursal?.nombre || `Sucursal ${idSucursal}`}
        />
      )}
      {idEmpresa > 0 && tab === "dispositivos" && (
        <RelojDispositivosPanel idEmpresa={idEmpresa} idSucursal={idSucursal} />
      )}
      {idEmpresa > 0 && tab === "checadas" && (
        <RelojChecadasPanel idEmpresa={idEmpresa} idSucursal={idSucursal} personal={personalSucursal} />
      )}
    </div>
  );
}
