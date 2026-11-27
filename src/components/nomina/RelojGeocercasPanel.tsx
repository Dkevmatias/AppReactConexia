/* NOMCONEXIA-UNIFY */
import { useEffect, useMemo, useState } from "react";
import { Circle, CircleMarker, Marker, Popup } from "react-leaflet";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import { Modal } from "../ui/modal";
import { PlusIcon, PencilIcon } from "../../icons";
import MapaCarto from "../maps/MapaCarto";
import { iconMarcador, MEXICO_CENTER } from "../maps/leafletSafe";
import {
  RelojChecada,
  RelojGeocerca,
  RelojGeocercaSave,
  relojService,
} from "../../services/relojService";

type FormState = {
  nombre: string;
  latitud: string;
  longitud: string;
  radioMetros: string;
  precisionMaxMetros: string;
  requiereRostro: boolean;
  requiereDispositivo: boolean;
  activo: boolean;
};

const emptyForm = (): FormState => ({
  nombre: "",
  latitud: "",
  longitud: "",
  radioMetros: "100",
  precisionMaxMetros: "50",
  requiereRostro: true,
  requiereDispositivo: true,
  activo: true,
});

type Props = {
  idEmpresa: number;
  idSucursal: number;
  sucursalNombre: string;
};

export default function RelojGeocercasPanel({ idEmpresa, idSucursal, sucursalNombre }: Props) {
  const [rows, setRows] = useState<RelojGeocerca[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RelojGeocerca | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [checadas, setChecadas] = useState<RelojChecada[]>([]);

  const load = async () => {
    const data = await relojService.getGeocercas(idEmpresa, idSucursal, false);
    setRows(data.filter((g) => g.idSucursal === idSucursal));
  };

  useEffect(() => {
    setLoading(true);
    setError("");
    load()
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar las geocercas"))
      .finally(() => setLoading(false));

    const hasta = new Date();
    const desde = new Date(Date.now() - 2 * 86400000);
    relojService
      .getChecadas({
        idEmpresa,
        idSucursal,
        desde: desde.toISOString(),
        hasta: hasta.toISOString(),
      })
      .then(setChecadas)
      .catch(() => setChecadas([]));
  }, [idEmpresa, idSucursal]);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm());
    setOpen(true);
  };

  const openEdit = (row: RelojGeocerca) => {
    setEditing(row);
    setForm({
      nombre: row.nombre,
      latitud: String(row.latitud),
      longitud: String(row.longitud),
      radioMetros: String(row.radioMetros),
      precisionMaxMetros: String(row.precisionMaxMetros),
      requiereRostro: row.requiereRostro,
      requiereDispositivo: row.requiereDispositivo,
      activo: row.activo,
    });
    setOpen(true);
  };

  const lat = Number(form.latitud);
  const lng = Number(form.longitud);
  const radio = Number(form.radioMetros) || 100;
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng) && form.latitud !== "" && form.longitud !== "";
  const center = useMemo<[number, number]>(
    () => (hasPoint ? [lat, lng] : MEXICO_CENTER),
    [hasPoint, lat, lng]
  );
  const puntosVista = useMemo(
    () =>
      rows
        .filter((g) => Number.isFinite(g.latitud) && Number.isFinite(g.longitud))
        .map((g) => ({
          latitud: g.latitud,
          longitud: g.longitud,
          radioMetros: g.radioMetros,
        })),
    [rows],
  );

  const save = async () => {
    const latitud = Number(form.latitud);
    const longitud = Number(form.longitud);
    const radioMetros = Number(form.radioMetros);
    const precisionMaxMetros = Number(form.precisionMaxMetros);
    if (!form.nombre.trim()) {
      setError("El nombre es requerido");
      return;
    }
    if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
      setError("Haz clic en el mapa o captura latitud y longitud");
      return;
    }
    if (radioMetros <= 0 || radioMetros > 5000) {
      setError("El radio debe estar entre 1 y 5000 metros");
      return;
    }
    if (precisionMaxMetros <= 0 || precisionMaxMetros > 500) {
      setError("La precisión máxima debe estar entre 1 y 500 metros");
      return;
    }
    const dto: RelojGeocercaSave = {
      idEmpresa,
      idSucursal,
      nombre: form.nombre.trim(),
      latitud,
      longitud,
      radioMetros,
      precisionMaxMetros,
      requiereRostro: form.requiereRostro,
      requiereDispositivo: form.requiereDispositivo,
      activo: form.activo,
    };
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await relojService.saveGeocerca(dto, editing?.idGeocerca);
      setOpen(false);
      await load();
      setNotice(editing ? "Geocerca actualizada." : "Geocerca creada. La app solo checa dentro de este radio.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  };

  const toggleActivo = async (row: RelojGeocerca) => {
    setError("");
    try {
      await relojService.saveGeocerca(
        {
          idEmpresa: row.idEmpresa,
          idSucursal: row.idSucursal,
          nombre: row.nombre,
          latitud: row.latitud,
          longitud: row.longitud,
          radioMetros: row.radioMetros,
          precisionMaxMetros: row.precisionMaxMetros,
          requiereRostro: row.requiereRostro,
          requiereDispositivo: row.requiereDispositivo,
          activo: !row.activo,
        },
        row.idGeocerca
      );
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo actualizar");
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando geocercas…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Oficinas de <strong>{sucursalNombre}</strong>. El servidor compara GPS contra este radio y
          rechaza si la precisión del teléfono es peor que el máximo.
        </p>
        <Button onClick={openNew}>
          <PlusIcon className="mr-2 h-5 w-5" />
          Nueva geocerca
        </Button>
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

      <div className="h-72 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
        <MapaCarto
          key={`geo-${idEmpresa}-${idSucursal}-${rows.length}`}
          puntosAjuste={puntosVista}
          zoom={puntosVista.length ? 16 : 5}
        >
          {rows.map((g) =>
            Number.isFinite(g.latitud) && Number.isFinite(g.longitud) ? (
              <Circle
                key={g.idGeocerca}
                center={[g.latitud, g.longitud]}
                radius={g.radioMetros}
                pathOptions={{
                  color: g.activo ? "#2563eb" : "#9ca3af",
                  fillColor: g.activo ? "#3b82f6" : "#d1d5db",
                  fillOpacity: 0.18,
                }}
                eventHandlers={{ click: () => openEdit(g) }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{g.nombre}</strong>
                    <div>{g.radioMetros} m · {g.activo ? "Activa" : "Inactiva"}</div>
                  </div>
                </Popup>
              </Circle>
            ) : null,
          )}
          {checadas
            .filter((c) => Number.isFinite(c.latitud) && Number.isFinite(c.longitud))
            .slice(0, 80)
            .map((c) => (
              <CircleMarker
                key={c.idChecada}
                center={[c.latitud, c.longitud]}
                radius={6}
                pathOptions={{ color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.9 }}
              >
                <Popup>
                  <div className="text-sm">
                    <strong>{c.nombrePersona || "Checada"}</strong>
                    <div>{c.tipo}</div>
                    <div>{c.geocercaNombre || "Sin geocerca"}</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapaCarto>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Azul: geocerca. Puntos verdes: checadas de los últimos 2 días. Clic en el círculo para editar.
      </p>

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600 dark:bg-white/5 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Coordenadas</th>
              <th className="px-4 py-3">Radio</th>
              <th className="px-4 py-3">Precisión máx.</th>
              <th className="px-4 py-3">Reglas</th>
              <th className="px-4 py-3">Estatus</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No hay geocercas. Agrega la oficina para que la app pueda checar.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.idGeocerca} className="border-t border-gray-100 dark:border-gray-800">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{row.nombre}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {row.latitud.toFixed(6)}, {row.longitud.toFixed(6)}
                  </td>
                  <td className="px-4 py-3">{row.radioMetros} m</td>
                  <td className="px-4 py-3">{row.precisionMaxMetros} m</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                    {row.requiereRostro ? "Rostro" : "Sin rostro"} ·{" "}
                    {row.requiereDispositivo ? "Dispositivo" : "Libre"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleActivo(row)}
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        row.activo
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      }`}
                    >
                      {row.activo ? "Activa" : "Inactiva"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" onClick={() => openEdit(row)} className="text-blue-600 hover:underline">
                      <PencilIcon className="inline h-4 w-4" /> Editar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} className="max-w-3xl p-6">
        <h3 className="mb-1 text-lg font-semibold text-gray-800 dark:text-white">
          {editing ? "Editar geocerca" : "Nueva geocerca"}
        </h3>
        <p className="mb-4 text-sm text-gray-500">
          {sucursalNombre}. Haz clic en el mapa para fijar el punto de la oficina.
        </p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Nombre</Label>
            <Input
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Oficina principal"
            />
          </div>
          <div>
            <Label>Latitud</Label>
            <Input
              type="number"
              step="0.000001"
              value={form.latitud}
              onChange={(e) => setForm({ ...form, latitud: e.target.value })}
            />
          </div>
          <div>
            <Label>Longitud</Label>
            <Input
              type="number"
              step="0.000001"
              value={form.longitud}
              onChange={(e) => setForm({ ...form, longitud: e.target.value })}
            />
          </div>
          <div>
            <Label>Radio (metros)</Label>
            <Input
              type="number"
              min="1"
              max="5000"
              value={form.radioMetros}
              onChange={(e) => setForm({ ...form, radioMetros: e.target.value })}
            />
          </div>
          <div>
            <Label>Precisión GPS máxima (metros)</Label>
            <Input
              type="number"
              min="1"
              max="500"
              value={form.precisionMaxMetros}
              onChange={(e) => setForm({ ...form, precisionMaxMetros: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-3 h-64 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
          {open ? (
            <MapaCarto
              key={`edit-${editing?.idGeocerca ?? "nueva"}-${hasPoint ? "p" : "m"}`}
              center={center}
              zoom={hasPoint ? 16 : 5}
              puntosAjuste={
                hasPoint ? [{ latitud: lat, longitud: lng, radioMetros: radio }] : []
              }
              onPick={(nextLat, nextLng) =>
                setForm((prev) => ({
                  ...prev,
                  latitud: nextLat.toFixed(6),
                  longitud: nextLng.toFixed(6),
                }))
              }
            >
              {hasPoint ? (
                <>
                  <Marker position={[lat, lng]} icon={iconMarcador} />
                  <Circle
                    center={[lat, lng]}
                    radius={radio}
                    pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.15 }}
                  />
                </>
              ) : null}
            </MapaCarto>
          ) : null}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-700 dark:text-gray-300">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.requiereRostro}
              onChange={(e) => setForm({ ...form, requiereRostro: e.target.checked })}
            />
            Requiere rostro
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.requiereDispositivo}
              onChange={(e) => setForm({ ...form, requiereDispositivo: e.target.checked })}
            />
            Requiere dispositivo autorizado
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
            />
            Activa
          </label>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
