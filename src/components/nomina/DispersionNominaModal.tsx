/* NOMCONEXIA-UNIFY */
import { useEffect, useState } from "react";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Label from "../form/Label";
import Select from "../form/Select";
import {
  dispersionService,
  DispersionPreview,
  PlantillaDispersion,
} from "../../services/dispersionService";

type Props = {
  isOpen: boolean;
  idNomina: number | null;
  onClose: () => void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(value || 0);

export default function DispersionNominaModal({ isOpen, idNomina, onClose }: Props) {
  const [plantillas, setPlantillas] = useState<PlantillaDispersion[]>([]);
  const [clave, setClave] = useState("CSV_GENERICO");
  const [preview, setPreview] = useState<DispersionPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    dispersionService.getPlantillas().then((list) => {
      setPlantillas(list);
      if (list.length && !list.some((p) => p.clave === clave)) {
        setClave(list[0].clave);
      }
    }).catch(() => setPlantillas([]));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !idNomina || !clave) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    dispersionService
      .preview(idNomina, clave)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setPreview(null);
          setError(err instanceof Error ? err.message : "Error al previsualizar");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, idNomina, clave]);

  const plantilla = plantillas.find((p) => p.clave === clave);
  const omitidos = preview?.renglones.filter((r) => !r.incluido) ?? [];

  const handleDescargar = async () => {
    if (!idNomina || !preview) return;
    setDownloading(true);
    try {
      await dispersionService.descargar(idNomina, clave, preview.nombreArchivo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al descargar");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-5xl w-full p-6">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white pr-10">
        Dispersión bancaria
      </h2>
      <p className="mt-1 mb-4 text-sm text-gray-500 dark:text-gray-400">
        Genera el archivo plano para cargar en el portal del banco. Para Bancomer usa la plantilla por cuenta (como el Excel validado). La póliza contable SAP se descarga aparte con el botón Póliza SAP.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <Label>Plantilla / banco</Label>
          <Select
            key={plantillas.map((p) => p.clave).join("|")}
            options={plantillas.map((p) => ({ value: p.clave, label: p.nombre }))}
            placeholder="Selecciona plantilla"
            onChange={(val) => setClave(val)}
            defaultValue={clave}
          />
        </div>
        {preview && (
          <div className="flex items-end">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {preview.totalRegistros} pagos · {formatCurrency(preview.totalImporte)}
              {preview.totalOmitidos > 0 ? ` · ${preview.totalOmitidos} omitidos` : ""}
            </p>
          </div>
        )}
      </div>

      {plantilla?.notas && (
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">{plantilla.notas}</p>
      )}
      {preview?.advertenciaEmpresa && (
        <p className="mb-3 text-sm text-amber-700 dark:text-amber-300">{preview.advertenciaEmpresa}</p>
      )}
      {error && <p className="mb-3 text-sm text-red-500">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : preview ? (
        <div className="space-y-4">
          <div className="overflow-x-auto max-h-64 rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-3 py-2 text-gray-500">Empleado</th>
                  <th className="px-3 py-2 text-gray-500">CLABE / cuenta</th>
                  <th className="px-3 py-2 text-gray-500 text-right">Importe</th>
                  <th className="px-3 py-2 text-gray-500">Estado</th>
                </tr>
              </thead>
              <tbody>
                {preview.renglones.map((r) => (
                  <tr key={r.idNominaDetalle} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="px-3 py-2 text-gray-800 dark:text-white">
                      {r.nombre}
                      <span className="block text-xs text-gray-400">{r.rfc || "sin RFC"}</span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-gray-600 dark:text-gray-300">
                      {r.clabe || r.cuenta || "—"}
                    </td>
                    <td className="px-3 py-2 text-right">{formatCurrency(r.importe)}</td>
                    <td className="px-3 py-2">
                      {r.incluido ? (
                        <span className="text-green-700 dark:text-green-400">Incluido</span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400">{r.motivoOmitido}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {omitidos.length > 0 && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Completa CLABE en Empleados → Pago para los omitidos. SPEI no se carga incompleto.
            </p>
          )}

          <pre className="max-h-40 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-900 dark:text-gray-300">
            {(preview.lineasPreview || []).join("\n")}
          </pre>
        </div>
      ) : null}

      <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
        <Button onClick={handleDescargar} disabled={!preview || preview.totalRegistros === 0 || downloading}>
          {downloading ? "Generando..." : "Descargar archivo"}
        </Button>
      </div>
    </Modal>
  );
}
