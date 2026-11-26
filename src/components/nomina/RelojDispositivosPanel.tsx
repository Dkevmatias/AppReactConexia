/* NOMCONEXIA-UNIFY */
import { useEffect, useMemo, useState } from "react";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import { Modal } from "../ui/modal";
import { PlusIcon } from "../../icons";
import RelojEnrolarRostroModal from "./RelojEnrolarRostroModal";
import {
  RelojDispositivo,
  RelojPersonal,
  relojService,
} from "../../services/relojService";

function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("es-MX");
}

type Props = {
  idEmpresa: number;
  idSucursal: number;
};

type ModalMode = "capturar" | "asignar";

export default function RelojDispositivosPanel({ idEmpresa, idSucursal }: Props) {
  const [personal, setPersonal] = useState<RelojPersonal[]>([]);
  const [dispositivos, setDispositivos] = useState<RelojDispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("capturar");
  const [saving, setSaving] = useState(false);
  const [personaKey, setPersonaKey] = useState("");
  const [idDispositivo, setIdDispositivo] = useState("");
  const [identificador, setIdentificador] = useState("");
  const [alias, setAlias] = useState("");
  const [plataforma, setPlataforma] = useState<"Android" | "iOS">("Android");
  const [enrolar, setEnrolar] = useState<RelojPersonal | null>(null);

  const libres = useMemo(
    () => dispositivos.filter((d) => d.estatus === "Activo" && !d.idPersona),
    [dispositivos]
  );

  const load = async () => {
    const [people, devices] = await Promise.all([
      relojService.getPersonal(idEmpresa),
      relojService.getDispositivos({ idEmpresa }),
    ]);
    setPersonal(people);
    setDispositivos(devices);
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo cargar"))
      .finally(() => setLoading(false));
  }, [idEmpresa]);

  const personaDe = (key: string) => {
    const [tipo, raw] = key.split(":");
    const id = Number(raw);
    if (tipo === "e") return personal.find((p) => p.idEmpleado === id);
    if (tipo === "p") return personal.find((p) => p.idPersona === id);
    return personal.find((p) => p.idPersona === id || p.idEmpleado === id);
  };

  const personaKeyOf = (p: RelojPersonal) =>
    p.idEmpleado ? `e:${p.idEmpleado}` : `p:${p.idPersona}`;

  const openCapturar = () => {
    setMode("capturar");
    setPersonaKey("");
    setIdDispositivo("");
    setIdentificador("");
    setAlias("");
    setPlataforma("Android");
    setError("");
    setOpen(true);
  };

  const openAsignar = (p?: RelojPersonal) => {
    setMode("asignar");
    setPersonaKey(p ? personaKeyOf(p) : "");
    setIdDispositivo(libres[0] ? String(libres[0].idDispositivo) : "");
    setIdentificador("");
    setAlias("");
    setPlataforma("Android");
    setError("");
    setOpen(true);
  };

  const guardar = async () => {
    const persona = personaDe(personaKey);
    setSaving(true);
    setError("");
    setNotice("");
    try {
      if (mode === "capturar") {
        if (!identificador.trim()) {
          setError("Captura el identificador del celular.");
          return;
        }
        await relojService.autorizarDispositivo({
          idEmpresa,
          idSucursal,
          alias: alias.trim() || null,
          identificadorDispositivo: identificador.trim(),
          plataforma,
        });
        setNotice("Dispositivo capturado. Ya puedes asignarlo a una persona.");
      } else {
        if (!persona) {
          setError("Selecciona a la persona.");
          return;
        }
        const payload = {
          idEmpresa,
          idSucursal,
          idPersona: persona.idPersona || null,
          idEmpleado: persona.idEmpleado || null,
        };
        if (idDispositivo) {
          await relojService.asignarDispositivo(Number(idDispositivo), payload);
        } else if (identificador.trim()) {
          await relojService.autorizarDispositivo({
            ...payload,
            identificadorDispositivo: identificador.trim(),
            alias: alias.trim() || null,
            plataforma,
          });
        } else {
          setError("Elige un dispositivo del inventario o captura uno nuevo.");
          return;
        }
        setNotice("Celular asignado a " + persona.nombre + ".");
      }
      setOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const revocar = async (id: number) => {
    if (!confirm("¿Revocar este celular? Quedará libre para asignar otro.")) return;
    setError("");
    try {
      await relojService.revocarDispositivo(id);
      await load();
      setNotice("Dispositivo revocado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo revocar");
    }
  };

  const bajaPlantilla = async (id: number) => {
    if (!confirm("¿Dar de baja la plantilla facial? Tendrá que enrolarse de nuevo en la app.")) return;
    setError("");
    try {
      await relojService.bajaPlantilla(id);
      await load();
      setNotice("Plantilla dada de baja.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo dar de baja");
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Cargando personal y dispositivos…</p>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Primero captura el celular y asígnalo. Enrolar el rostro deja la plantilla lista antes de que chequen en la
          app. Un celular activo y una plantilla vigente por persona.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={openCapturar}>
            <PlusIcon className="mr-2 h-5 w-5" />
            Capturar dispositivo
          </Button>
          <Button onClick={() => openAsignar()} disabled={personal.length === 0}>
            Asignar a persona
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          {notice}
        </div>
      )}

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Personal de la empresa</h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Persona</th>
                <th className="px-4 py-3">Celular</th>
                <th className="px-4 py-3">Plantilla</th>
                <th className="px-4 py-3">Aviso</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {personal.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No hay empleados activos en esta empresa.
                  </td>
                </tr>
              ) : (
                personal.map((p) => (
                  <tr key={personaKeyOf(p)} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 dark:text-white">{p.nombre}</div>
                      <div className="text-xs text-gray-500">
                        {p.email || "Sin correo"}
                        {!p.tieneUsuario ? " · sin usuario de app" : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {p.dispositivoActivo ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
                          Asignado
                        </span>
                      ) : (
                        <span className="text-xs text-amber-700 dark:text-amber-300">Sin celular</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {p.plantillaVigente ? (
                        <div className="flex flex-col items-start gap-1">
                          <button
                            type="button"
                            className="text-xs text-blue-600 hover:underline"
                            onClick={() => setEnrolar(p)}
                          >
                            Vigente · reemplazar
                          </button>
                          <button
                            type="button"
                            className="text-xs text-red-600 hover:underline"
                            onClick={() => p.idPlantillaVigente && bajaPlantilla(p.idPlantillaVigente)}
                          >
                            Dar de baja
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => setEnrolar(p)}
                        >
                          Enrolar rostro
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3">{p.consentimientoAceptado ? "Aceptado" : "Pendiente"}</td>
                    <td className="px-4 py-3 text-right">
                      {p.idDispositivoActivo ? (
                        <button
                          type="button"
                          className="text-xs text-red-600 hover:underline"
                          onClick={() => revocar(p.idDispositivoActivo!)}
                        >
                          Revocar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-blue-600 hover:underline"
                          onClick={() => openAsignar(p)}
                        >
                          Asignar celular
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
          Inventario de celulares {libres.length > 0 ? `(${libres.length} sin asignar)` : ""}
        </h3>
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-300">
              <tr>
                <th className="px-4 py-3">Alias</th>
                <th className="px-4 py-3">Plataforma</th>
                <th className="px-4 py-3">Asignado a</th>
                <th className="px-4 py-3">Estatus</th>
                <th className="px-4 py-3">Alta</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {dispositivos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    Aún no hay celulares. Usa <strong>Capturar dispositivo</strong> e ingresa el ID que usará la app.
                  </td>
                </tr>
              ) : (
                dispositivos.map((d) => (
                  <tr key={d.idDispositivo} className="border-t border-gray-100 dark:border-gray-800">
                    <td className="px-4 py-3">{d.alias || `Dispositivo ${d.idDispositivo}`}</td>
                    <td className="px-4 py-3">{d.plataforma}</td>
                    <td className="px-4 py-3">{d.nombrePersona || "Sin asignar"}</td>
                    <td className="px-4 py-3">{d.estatus}</td>
                    <td className="px-4 py-3">{fmt(d.fechaAlta)}</td>
                    <td className="px-4 py-3 text-right">
                      {d.estatus === "Activo" && d.idPersona ? (
                        <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => revocar(d.idDispositivo)}>
                          Revocar
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} className="max-w-lg p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white">
          {mode === "capturar" ? "Capturar dispositivo" : "Asignar celular"}
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          {mode === "capturar"
            ? "Registra el identificador estable del teléfono. Después lo asignas a un empleado."
            : "Usa un celular ya capturado o registra uno nuevo para esta persona."}
        </p>
        <div className="space-y-4">
          {mode === "asignar" && (
            <div>
              <Label>Persona</Label>
              <Select
                options={personal.map((p) => ({ value: personaKeyOf(p), label: p.nombre }))}
                value={personaKey}
                placeholder="Selecciona"
                onChange={setPersonaKey}
              />
            </div>
          )}
          {mode === "asignar" && (
            <div>
              <Label>Dispositivo existente</Label>
              <Select
                options={[
                  { value: "", label: libres.length ? "Selecciona o captura uno nuevo" : "No hay libres · captura uno nuevo" },
                  ...libres.map((d) => ({
                    value: String(d.idDispositivo),
                    label: d.alias || `${d.plataforma} #${d.idDispositivo}`,
                  })),
                ]}
                value={idDispositivo}
                onChange={(v) => {
                  setIdDispositivo(v);
                  if (v) setIdentificador("");
                }}
              />
            </div>
          )}
          {mode === "capturar" || !idDispositivo ? (
            <>
              <div>
                <Label>{mode === "capturar" ? "Alias (opcional)" : "O captura uno nuevo"}</Label>
                {mode === "capturar" ? (
                  <Input value={alias} onChange={(e) => setAlias(e.target.value)} placeholder="iPhone recepción" />
                ) : (
                  <Input
                    value={identificador}
                    onChange={(e) => {
                      setIdentificador(e.target.value);
                      if (e.target.value) setIdDispositivo("");
                    }}
                    placeholder="Identificador del celular"
                  />
                )}
              </div>
              {mode === "capturar" && (
                <div>
                  <Label>Identificador del dispositivo</Label>
                  <Input
                    value={identificador}
                    onChange={(e) => setIdentificador(e.target.value)}
                    placeholder="El ID estable que enviará la app"
                  />
                  <p className="mt-1 text-xs text-gray-500">El API lo convierte a SHA-256. No se guarda el ID en claro.</p>
                </div>
              )}
              <div>
                <Label>Plataforma</Label>
                <Select
                  options={[
                    { value: "Android", label: "Android" },
                    { value: "iOS", label: "iOS" },
                  ]}
                  value={plataforma}
                  onChange={(v) => setPlataforma(v === "iOS" ? "iOS" : "Android")}
                />
              </div>
            </>
          ) : null}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={guardar} disabled={saving}>
            {saving ? "Guardando…" : mode === "capturar" ? "Capturar" : "Asignar"}
          </Button>
        </div>
      </Modal>

      <RelojEnrolarRostroModal
        open={!!enrolar}
        persona={enrolar}
        idEmpresa={idEmpresa}
        idSucursal={idSucursal}
        onClose={() => setEnrolar(null)}
        onSaved={async (mensaje) => {
          setNotice(mensaje);
          await load();
        }}
      />
    </div>
  );
}
