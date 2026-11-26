/* NOMCONEXIA-UNIFY */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Modal } from "../../components/ui/modal";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import {
  solicitudAusenciaService,
  SolicitudAusencia,
  etiquetaTipoSolicitud,
  etiquetaEstatusSolicitud,
  esSolicitudPendiente,
} from "../../services/solicitudAusenciaService";
import { empresaService, Empresa } from "../../services/empresaService";
import { empleadoService, Empleado } from "../../services/empleadoService";
import { useAuth } from "../../hooks/useAuth";
import { PlusIcon, CheckLineIcon, CloseIcon, ListIcon } from "../../icons";

function diasEntre(inicio: string, fin: string) {
  if (!inicio || !fin) return 1;
  const a = new Date(inicio + "T00:00:00");
  const b = new Date(fin + "T00:00:00");
  const d = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  return d > 0 ? d : 1;
}

function fmtDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("es-MX");
}

export default function Solicitudes() {
  const { user } = useAuth();
  const usuario = user?.fullname || undefined;

  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empleadosFiltro, setEmpleadosFiltro] = useState<Empleado[]>([]);
  const [empleadosForm, setEmpleadosForm] = useState<Empleado[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudAusencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [filtroEmpresa, setFiltroEmpresa] = useState<number | "">("");
  const [filtroEmpleado, setFiltroEmpleado] = useState<number | "">("");
  const [filtroJefe, setFiltroJefe] = useState<number | "">("");
  const [filtroEstatus, setFiltroEstatus] = useState("SOLICITADA");
  const [filtroTipo, setFiltroTipo] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rechazoId, setRechazoId] = useState<number | null>(null);
  const [rechazoMotivo, setRechazoMotivo] = useState("");

  const [form, setForm] = useState({
    idEmpresa: 0,
    idEmpleado: 0,
    tipo: "PERMISO" as "VAC" | "PERMISO",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
    comentario: "",
    origen: "EMPLEADO" as "EMPLEADO" | "RH",
    autorizarAhora: false,
  });

  useEffect(() => {
    loadEmpresas();
  }, []);

  useEffect(() => {
    if (filtroEmpresa) {
      empleadoService.getEmpleados(Number(filtroEmpresa)).then(setEmpleadosFiltro).catch(() => setEmpleadosFiltro([]));
    } else {
      setEmpleadosFiltro([]);
      setFiltroEmpleado("");
      setFiltroJefe("");
    }
  }, [filtroEmpresa]);

  useEffect(() => {
    loadSolicitudes();
  }, [filtroEmpresa, filtroEmpleado, filtroJefe, filtroEstatus, filtroTipo]);

  useEffect(() => {
    if (!form.idEmpresa) {
      setEmpleadosForm([]);
      return;
    }
    empleadoService.getEmpleados(form.idEmpresa).then(setEmpleadosForm).catch(() => setEmpleadosForm([]));
  }, [form.idEmpresa]);

  const loadEmpresas = async () => {
    try {
      const data = await empresaService.getEmpresas();
      setEmpresas(data);
      if (data.length > 0) {
        setForm((prev) => ({ ...prev, idEmpresa: prev.idEmpresa || data[0].idEmpresa }));
      }
    } catch (error) {
      console.error(error);
      setLoadError("No se pudieron cargar las empresas");
    }
  };

  const loadSolicitudes = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await solicitudAusenciaService.getSolicitudes({
        idEmpresa: filtroEmpresa ? Number(filtroEmpresa) : undefined,
        idEmpleado: filtroEmpleado ? Number(filtroEmpleado) : undefined,
        idJefe: filtroJefe ? Number(filtroJefe) : undefined,
        estatus: filtroEstatus || undefined,
        tipo: filtroTipo || undefined,
      });
      setSolicitudes(data);
    } catch (error) {
      setSolicitudes([]);
      setLoadError(error instanceof Error ? error.message : "No se pudieron cargar las solicitudes");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    const empresa = filtroEmpresa ? Number(filtroEmpresa) : empresas[0]?.idEmpresa || 0;
    setForm({
      idEmpresa: empresa,
      idEmpleado: 0,
      tipo: "PERMISO",
      fechaInicio: new Date().toISOString().split("T")[0],
      fechaFin: new Date().toISOString().split("T")[0],
      comentario: "",
      origen: "EMPLEADO",
      autorizarAhora: false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idEmpresa || !form.idEmpleado) {
      alert("Selecciona empresa y empleado");
      return;
    }
    if (form.fechaFin < form.fechaInicio) {
      alert("La fecha fin no puede ser anterior al inicio");
      return;
    }

    setSaving(true);
    try {
      const created = await solicitudAusenciaService.create({
        idEmpresa: form.idEmpresa,
        idEmpleado: form.idEmpleado,
        tipo: form.tipo,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        dias: diasEntre(form.fechaInicio, form.fechaFin),
        comentario: form.comentario || null,
        origen: form.origen,
        creadoPor: usuario,
      });

      if (form.origen === "RH" && form.autorizarAhora) {
        await solicitudAusenciaService.autorizar(created.idSolicitud, usuario);
        setNotice("Solicitud registrada y autorizada. Quedó una incidencia pendiente para que RH la aplique a la nómina.");
      } else {
        setNotice(
          created.idJefe
            ? "Solicitud registrada. El jefe puede autorizarla desde esta misma pantalla."
            : "Solicitud registrada. El empleado no tiene jefe: RH debe autorizarla aquí."
        );
      }
      setIsModalOpen(false);
      await loadSolicitudes();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleAutorizar = async (row: SolicitudAusencia) => {
    if (!confirm(`¿Autorizar ${etiquetaTipoSolicitud(row.tipo)} de ${row.empleadoNombre}?`)) return;
    try {
      await solicitudAusenciaService.autorizar(row.idSolicitud, usuario);
      setNotice(
        row.tipo === "VAC"
          ? "Autorizada: se descontó el saldo de vacaciones y se creó la incidencia pendiente."
          : "Autorizada: se creó la incidencia de permiso en pendiente. RH la aplica a la nómina."
      );
      await loadSolicitudes();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo autorizar");
    }
  };

  const handleRechazar = async () => {
    if (!rechazoId) return;
    if (!rechazoMotivo.trim()) {
      alert("Indica el motivo del rechazo");
      return;
    }
    try {
      await solicitudAusenciaService.rechazar(rechazoId, rechazoMotivo.trim(), usuario);
      setRechazoId(null);
      setRechazoMotivo("");
      setNotice("Solicitud rechazada.");
      await loadSolicitudes();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo rechazar");
    }
  };

  const handleCancelar = async (row: SolicitudAusencia) => {
    if (!confirm("¿Cancelar esta solicitud?")) return;
    try {
      await solicitudAusenciaService.cancelar(row.idSolicitud, usuario);
      setNotice("Solicitud cancelada.");
      await loadSolicitudes();
    } catch (error) {
      alert(error instanceof Error ? error.message : "No se pudo cancelar");
    }
  };

  const diasForm = diasEntre(form.fechaInicio, form.fechaFin);
  const jefesOpciones = empleadosFiltro.filter((e) => empleadosFiltro.some((x) => x.idJefe === e.idEmpleado));
  const jefesSelect = jefesOpciones.length > 0 ? jefesOpciones : empleadosFiltro;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Solicitudes</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400 max-w-3xl">
            El empleado o RH registra vacaciones o permiso. El jefe autoriza. Al autorizar se genera una incidencia
            pendiente (RH la aplica a la nómina) y, si es vacaciones, se descuenta el saldo LFT.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/nomina/incidencias"
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Ir a incidencias
          </Link>
          <Button onClick={openModal} disabled={empresas.length === 0}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Nueva solicitud
          </Button>
        </div>
      </div>

      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          {notice}
        </div>
      )}

      {loadError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
          {loadError}{" "}
          <button type="button" className="underline font-medium" onClick={loadSolicitudes}>
            Reintentar
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5 p-4">
        <div className="flex items-center gap-2 mb-4">
          <ListIcon className="w-5 h-5 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Select
            options={[
              { value: "", label: "Todas las empresas" },
              ...empresas.map((e) => ({ value: String(e.idEmpresa), label: e.nombre })),
            ]}
            placeholder="Empresa"
            value={filtroEmpresa === "" ? "" : String(filtroEmpresa)}
            onChange={(val) => setFiltroEmpresa(val ? parseInt(val) : "")}
          />
          <Select
            options={[
              { value: "", label: "Todos los empleados" },
              ...empleadosFiltro.map((emp) => ({ value: String(emp.idEmpleado), label: emp.fullName })),
            ]}
            placeholder="Empleado"
            value={filtroEmpleado === "" ? "" : String(filtroEmpleado)}
            onChange={(val) => setFiltroEmpleado(val ? parseInt(val) : "")}
          />
          <Select
            options={[
              { value: "", label: "Todos los jefes" },
              ...jefesSelect.map((emp) => ({ value: String(emp.idEmpleado), label: emp.fullName })),
            ]}
            placeholder="Pendientes del jefe"
            value={filtroJefe === "" ? "" : String(filtroJefe)}
            onChange={(val) => setFiltroJefe(val ? parseInt(val) : "")}
          />
          <Select
            options={[
              { value: "", label: "Todos los estatus" },
              { value: "SOLICITADA", label: "Por autorizar" },
              { value: "AUTORIZADA", label: "Autorizada" },
              { value: "RECHAZADA", label: "Rechazada" },
              { value: "CANCELADA", label: "Cancelada" },
            ]}
            placeholder="Estatus"
            value={filtroEstatus}
            onChange={setFiltroEstatus}
          />
          <Select
            options={[
              { value: "", label: "Todos los tipos" },
              { value: "VAC", label: "Vacaciones" },
              { value: "PERMISO", label: "Permiso sin goce" },
            ]}
            placeholder="Tipo"
            value={filtroTipo}
            onChange={setFiltroTipo}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Empleado</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Tipo</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Fechas</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Días</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Jefe</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Origen</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500">Estatus</th>
                  <th className="px-6 py-4 text-sm font-medium text-gray-500 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                      No hay solicitudes con esos filtros
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((row) => {
                    const pendiente = esSolicitudPendiente(row.estatus);
                    const autorizada = (row.estatus || "").toUpperCase() === "AUTORIZADA";
                    return (
                      <tr key={row.idSolicitud} className="hover:bg-gray-50 dark:hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-800 dark:text-white">{row.empleadoNombre}</div>
                          <div className="text-xs text-gray-500">{row.empresaNombre}</div>
                        </td>
                        <td className="px-6 py-4 text-sm">{etiquetaTipoSolicitud(row.tipo)}</td>
                        <td className="px-6 py-4 text-sm whitespace-nowrap">
                          {fmtDate(row.fechaInicio)} – {fmtDate(row.fechaFin)}
                        </td>
                        <td className="px-6 py-4 text-sm">{row.dias}</td>
                        <td className="px-6 py-4 text-sm">{row.jefeNombre || "Sin jefe (RH)"}</td>
                        <td className="px-6 py-4 text-sm">{row.origen}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                              pendiente
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
                                : autorizada
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                                  : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {etiquetaEstatusSolicitud(row.estatus)}
                          </span>
                          {row.rechazoMotivo && (
                            <div className="mt-1 text-xs text-gray-500">{row.rechazoMotivo}</div>
                          )}
                          {row.idIncidencia ? (
                            <div className="mt-1 text-xs">
                              <Link to="/nomina/incidencias" className="text-blue-600 hover:underline">
                                Incidencia #{row.idIncidencia}
                              </Link>
                            </div>
                          ) : null}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            {pendiente && (
                              <>
                                <Button size="xs" variant="primary" onClick={() => handleAutorizar(row)}>
                                  <CheckLineIcon className="w-4 h-4 mr-1" />
                                  Autorizar
                                </Button>
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => {
                                    setRechazoId(row.idSolicitud);
                                    setRechazoMotivo("");
                                  }}
                                >
                                  <CloseIcon className="w-4 h-4 mr-1" />
                                  Rechazar
                                </Button>
                              </>
                            )}
                            {(pendiente || autorizada) && (
                              <Button size="xs" variant="outline" onClick={() => handleCancelar(row)}>
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} className="max-w-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Nueva solicitud</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Quién registra</Label>
              <Select
                options={[
                  { value: "EMPLEADO", label: "Empleado" },
                  { value: "RH", label: "RH" },
                ]}
                value={form.origen}
                onChange={(val) =>
                  setForm({ ...form, origen: val === "RH" ? "RH" : "EMPLEADO", autorizarAhora: val === "RH" ? form.autorizarAhora : false })
                }
              />
            </div>
            <div>
              <Label>Tipo</Label>
              <Select
                options={[
                  { value: "PERMISO", label: "Permiso sin goce" },
                  { value: "VAC", label: "Vacaciones" },
                ]}
                value={form.tipo}
                onChange={(val) => setForm({ ...form, tipo: val === "VAC" ? "VAC" : "PERMISO" })}
              />
            </div>
            <div>
              <Label>Empresa</Label>
              <Select
                options={empresas.map((e) => ({ value: String(e.idEmpresa), label: e.nombre }))}
                value={form.idEmpresa ? String(form.idEmpresa) : ""}
                onChange={(val) => setForm({ ...form, idEmpresa: parseInt(val) || 0, idEmpleado: 0 })}
              />
            </div>
            <div>
              <Label>Empleado</Label>
              <Select
                options={[
                  { value: "", label: "Selecciona empleado" },
                  ...empleadosForm.map((emp) => ({ value: String(emp.idEmpleado), label: emp.fullName })),
                ]}
                value={form.idEmpleado ? String(form.idEmpleado) : ""}
                onChange={(val) => setForm({ ...form, idEmpleado: parseInt(val) || 0 })}
              />
            </div>
            <div>
              <Label>Fecha inicio</Label>
              <Input
                type="date"
                value={form.fechaInicio}
                onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
              />
            </div>
            <div>
              <Label>Fecha fin</Label>
              <Input
                type="date"
                value={form.fechaFin}
                onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
              />
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {diasForm} día(s).{" "}
            {form.tipo === "VAC"
              ? "Al autorizar se descuenta el saldo de vacaciones y se marca para la siguiente nómina."
              : "Al autorizar se crea un PERMISO pendiente: al aplicarlo corta sueldo como falta."}
          </p>
          <div>
            <Label>Comentario</Label>
            <Input
              value={form.comentario}
              onChange={(e) => setForm({ ...form, comentario: e.target.value })}
              placeholder="Motivo u observaciones"
            />
          </div>
          {form.origen === "RH" && (
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={form.autorizarAhora}
                onChange={(e) => setForm({ ...form, autorizarAhora: e.target.checked })}
              />
              Autorizar ahora (sin pasar por el jefe)
            </label>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cerrar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Registrar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={rechazoId != null} onClose={() => setRechazoId(null)} className="max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Rechazar solicitud</h2>
        <Label>Motivo</Label>
        <Input
          value={rechazoMotivo}
          onChange={(e) => setRechazoMotivo(e.target.value)}
          placeholder="Por qué se rechaza"
        />
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setRechazoId(null)}>
            Cerrar
          </Button>
          <Button onClick={handleRechazar}>Rechazar</Button>
        </div>
      </Modal>
    </div>
  );
}
