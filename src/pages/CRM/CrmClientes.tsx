import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Loader2, Pencil, Search } from "lucide-react";
import PageMeta from "../../components/common/PageMeta";
import PaginacionTabla from "../../components/common/PaginacionTabla";
import ModalDetalleRegistro, {
  CampoDetalle,
} from "../../components/common/ModalDetalleRegistro";
import { useClientPagination } from "../../hooks/useClientPagination";
import {
  clienteService,
  type ClienteResumen,
} from "../../services/clienteService";
import { formatearFechaLead } from "../../services/leadsService";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white";

const rowClass =
  "cursor-pointer border-t dark:border-gray-800 hover:bg-blue-50/50 dark:hover:bg-blue-950/20";

function badgeEstatusSap(estatus: string | null): string {
  const e = (estatus ?? "").trim().toLowerCase();
  if (e === "enviado") {
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200";
  }
  if (e.includes("error") || e === "fallido") {
    return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
  }
  return "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
}

export default function CrmClientes() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estatusSap, setEstatusSap] = useState("");
  const [soloDesdeProspecto, setSoloDesdeProspecto] = useState(true);
  const [clientes, setClientes] = useState<ClienteResumen[]>([]);
  const [detalle, setDetalle] = useState<ClienteResumen | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clienteService.getListado({
        soloActivos: true,
        estatusSap: estatusSap || null,
      });
      setClientes(data);
    } catch (err) {
      console.error(err);
      setClientes([]);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los clientes.",
      );
    } finally {
      setLoading(false);
    }
  }, [estatusSap]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const filtrados = useMemo(() => {
    let rows = clientes;
    if (soloDesdeProspecto) {
      rows = rows.filter((c) => (c.idLeadOrigen ?? 0) > 0);
    }
    const q = busqueda.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => {
      const texto = [
        row.cardName,
        row.cardCode,
        row.phone1,
        row.emailAddress,
        row.federalTaxID,
        row.estatusSap,
        row.idLeadOrigen != null ? String(row.idLeadOrigen) : "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return texto.includes(q);
    });
  }, [clientes, busqueda, soloDesdeProspecto]);

  const pagination = useClientPagination(filtrados, 50);

  const abrirDetalle = (row: ClienteResumen) => {
    setDetalle(row);
    setModalAbierto(true);
  };

  return (
    <div className="space-y-6 p-6">
      <PageMeta
        title="Clientes CRM"
        description="Prospectos convertidos a cliente en el CRM."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Clientes
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Clientes desde prospectos. Doble clic para ver el detalle.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void cargar()}
          disabled={loading}
          className="text-sm font-medium text-blue-600 hover:underline disabled:opacity-50 dark:text-blue-400"
        >
          Actualizar
        </button>
      </div>

      {error ? (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            placeholder="Buscar por nombre, CardCode, RFC, teléfono…"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="w-full max-w-xs">
          <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
            Estatus SAP
          </label>
          <select
            value={estatusSap}
            onChange={(e) => setEstatusSap(e.target.value)}
            className={inputClass}
          >
            <option value="">Todos</option>
            <option value="Borrador">Borrador</option>
            <option value="Enviado">Enviado</option>
            <option value="Error">Error</option>
          </select>
        </div>
        <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={soloDesdeProspecto}
            onChange={(e) => setSoloDesdeProspecto(e.target.checked)}
            className="rounded border-gray-300"
          />
          Solo desde prospecto
        </label>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        {!loading && filtrados.length > 0 ? (
          <PaginacionTabla
            pagination={pagination}
            etiqueta="cliente(s)"
            posicion="arriba"
          />
        ) : null}
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-500">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="text-sm">Cargando clientes…</p>
          </div>
        ) : filtrados.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            {busqueda || estatusSap || soloDesdeProspecto
              ? "No hay clientes que coincidan con los filtros."
              : "No hay clientes registrados."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Cliente
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    CardCode
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    SAP
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Prospecto
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">
                    Alta
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-gray-700 dark:text-gray-300">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagination.pageItems.map((row) => (
                  <tr
                    key={row.idCliente}
                    className={rowClass}
                    title="Doble clic para ver detalle"
                    onDoubleClick={() => abrirDetalle(row)}
                  >
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {row.cardName || "Sin nombre"}
                      </div>
                      {row.phone1 || row.federalTaxID ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {[row.phone1, row.federalTaxID]
                            .filter(Boolean)
                            .join(" · ")}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      {row.cardCode || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${badgeEstatusSap(row.estatusSap)}`}
                      >
                        {row.estatusSap || "Borrador"}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {row.idLeadOrigen ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/CRM/Prospectos/${row.idLeadOrigen}`);
                          }}
                          onDoubleClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline dark:text-blue-400"
                        >
                          #{row.idLeadOrigen}
                        </button>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {formatearFechaLead(row.fechaCreacion)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {row.idLeadOrigen ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/CRM/Prospectos/${row.idLeadOrigen}`);
                          }}
                          onDoubleClick={(e) => e.stopPropagation()}
                          title="Abrir prospecto / cliente"
                          className="rounded p-1.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtrados.length > 0 ? (
          <PaginacionTabla
            pagination={pagination}
            etiqueta="cliente(s)"
            posicion="abajo"
          />
        ) : null}
      </div>

      <ModalDetalleRegistro
        abierto={modalAbierto}
        titulo="Detalle del cliente"
        subtitulo={detalle?.cardName || null}
        onCerrar={() => setModalAbierto(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setModalAbierto(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200"
            >
              Cerrar
            </button>
            {detalle?.idLeadOrigen ? (
              <button
                type="button"
                onClick={() =>
                  navigate(`/CRM/Prospectos/${detalle.idLeadOrigen}`)
                }
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Abrir prospecto
              </button>
            ) : null}
          </>
        }
      >
        {detalle ? (
          <dl className="grid gap-3 sm:grid-cols-2">
            <CampoDetalle label="Nombre" valor={detalle.cardName} />
            <CampoDetalle label="CardCode" valor={detalle.cardCode} />
            <CampoDetalle label="Estatus SAP" valor={detalle.estatusSap} />
            <CampoDetalle label="RFC" valor={detalle.federalTaxID} />
            <CampoDetalle label="Teléfono" valor={detalle.phone1} />
            <CampoDetalle label="Correo" valor={detalle.emailAddress} />
            <CampoDetalle
              label="Prospecto origen"
              valor={
                detalle.idLeadOrigen ? `#${detalle.idLeadOrigen}` : null
              }
            />
            <CampoDetalle
              label="Alta"
              valor={formatearFechaLead(detalle.fechaCreacion)}
            />
            <CampoDetalle
              label="Envío SAP"
              valor={formatearFechaLead(detalle.fechaEnvioSap)}
            />
          </dl>
        ) : null}
      </ModalDetalleRegistro>
    </div>
  );
}
