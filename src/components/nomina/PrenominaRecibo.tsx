/* NOMCONEXIA-UNIFY */
import { NominaCabecero, NominaDetalle } from "../../services/nominaService";
import { Empresa } from "../../services/empresaService";
import { Empleado } from "../../services/empleadoService";
import Button from "../ui/button/Button";
import {
  buildConceptosPrenomina,
  lineTotals,
  money,
  validarEstructuraPrenomina,
} from "./prenomina";

type Props = {
  nomina: NominaCabecero;
  detalle: NominaDetalle;
  empresa?: Empresa | null;
  empleado?: Empleado | null;
  onClose: () => void;
};

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX");
}

export default function PrenominaRecibo({ nomina, detalle, empresa, empleado, onClose }: Props) {
  const anio = new Date(nomina.fechaPago).getFullYear();
  const conceptos = buildConceptosPrenomina(detalle, anio, nomina.tipoNomina);
  const percepciones = conceptos.filter((c) => c.tipo === "P");
  const deducciones = conceptos.filter((c) => c.tipo === "D");
  const totals = lineTotals(detalle);
  const alertas = validarEstructuraPrenomina({
    detalle,
    rfcEmpresa: empresa?.rfc,
    registroPatronal: empresa?.registroPatronal,
    codigoPostal: empresa?.codigoPostal,
    rfcEmpleado: empleado?.rfc || detalle.rfc,
    curp: empleado?.curp,
    nss: empleado?.nss,
  });
  const okEstructura = !alertas.some((a) => a.nivel === "error");

  const imprimir = () => window.print();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Prenómina del empleado</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vista previa del recibo (no fiscal). Sirve para validar conceptos SAT y el armado del PDF antes de timbrar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={imprimir}>
            Imprimir / PDF
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Salir
          </Button>
        </div>
      </div>

      {alertas.length > 0 && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            okEstructura
              ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
              : "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200"
          }`}
        >
          <p className="font-medium mb-1">{okEstructura ? "Estructura usable, con avisos" : "Hay datos que el CFDI va a rechazar"}</p>
          <ul className="list-disc pl-5 space-y-0.5">
            {alertas.map((a) => (
              <li key={a.texto}>
                {a.nivel === "error" ? "Error: " : "Aviso: "}
                {a.texto}
              </li>
            ))}
          </ul>
        </div>
      )}
      {alertas.length === 0 && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
          Estructura lista: RFC, SDI/SBC, percepciones y totales cuadran para un recibo de nómina.
        </p>
      )}

      <div
        id="prenomina-print"
        className="relative mx-auto max-w-[216mm] overflow-hidden rounded-sm border border-gray-300 bg-white p-6 text-gray-900 shadow-sm print:border-0 print:shadow-none"
      >
        <div className="pointer-events-none absolute inset-8 flex items-center justify-center opacity-[0.07] print:opacity-[0.08]">
          <span className="-rotate-[24deg] text-6xl font-black tracking-widest text-rose-700">PRENÓMINA</span>
        </div>

        <div className="relative flex items-start justify-between border-b-2 border-gray-800 pb-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500">Comprobante de prenómina</p>
            <h3 className="text-lg font-bold leading-tight">{empresa?.razonSocial || empresa?.nombre || nomina.empresaNombre}</h3>
            <p className="text-xs">RFC: {empresa?.rfc || "—"} · Reg. patronal: {empresa?.registroPatronal || "—"}</p>
            <p className="text-xs">C.P. {empresa?.codigoPostal || "—"}</p>
          </div>
          <div className="text-right text-xs">
            <p className="inline-block rounded bg-rose-100 px-2 py-0.5 font-semibold text-rose-800">NO FISCAL · SIN UUID</p>
            <p className="mt-1">Folio interno: {nomina.numeroNomina}-{detalle.numeroEmpleado || detalle.idEmpleado}</p>
            <p>Tipo: {nomina.claveTipoNomina === "E" ? "Extraordinaria (E)" : "Ordinaria (O)"}</p>
            <p>Estatus captura: {nomina.estatus}</p>
          </div>
        </div>

        <div className="relative mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded border border-gray-200 p-2">
            <p className="mb-1 font-semibold uppercase text-[10px] text-gray-500">Receptor / empleado</p>
            <p className="font-bold">{empleado?.fullName || detalle.empleadoNombre}</p>
            <p>No. {detalle.numeroEmpleado || empleado?.numeroEmpleado || "—"} · RFC {empleado?.rfc || detalle.rfc || "—"}</p>
            <p>CURP {empleado?.curp || "—"} · NSS {empleado?.nss ?? "—"}</p>
            <p>
              {detalle.puestoNombre || empleado?.puestoNombre || "—"} / {detalle.departamentoNombre || empleado?.departamentoNombre || "—"}
            </p>
          </div>
          <div className="rounded border border-gray-200 p-2">
            <p className="mb-1 font-semibold uppercase text-[10px] text-gray-500">Periodo de pago</p>
            <p>Pago: {fmtDate(nomina.fechaPago)}</p>
            <p>
              Del {fmtDate(nomina.fechaInicio)} al {fmtDate(nomina.fechaFin)}
            </p>
            <p>Días pagados: {detalle.diasQuincena || 15} · Laborales: {detalle.diasLaborales || "—"}</p>
            <p>
              SDI {money(detalle.sdi)} · SBC {money(detalle.sbc)}
            </p>
            <p>Cuenta: {detalle.cuentaDeposito || empleado?.cuentaBancaria || empleado?.clabe || "—"} · Banco {detalle.banco || empleado?.claveBanco || "—"}</p>
          </div>
        </div>

        <div className="relative mt-3 grid grid-cols-2 gap-3 text-xs">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-emerald-800 text-white">
                <th className="px-2 py-1 text-left font-semibold" colSpan={4}>
                  Percepciones
                </th>
              </tr>
              <tr className="bg-emerald-50">
                <th className="border border-gray-200 px-1 py-1 text-left">SAT</th>
                <th className="border border-gray-200 px-1 py-1 text-left">Concepto</th>
                <th className="border border-gray-200 px-1 py-1 text-right">Gravado</th>
                <th className="border border-gray-200 px-1 py-1 text-right">Exento</th>
              </tr>
            </thead>
            <tbody>
              {percepciones.length === 0 ? (
                <tr>
                  <td colSpan={4} className="border border-gray-200 px-2 py-2 text-gray-500">
                    Sin percepciones
                  </td>
                </tr>
              ) : (
                percepciones.map((c) => (
                  <tr key={`${c.claveSat}-${c.clave}-${c.descripcion}`}>
                    <td className="border border-gray-200 px-1 py-1 font-mono">{c.claveSat}</td>
                    <td className="border border-gray-200 px-1 py-1">{c.descripcion}</td>
                    <td className="border border-gray-200 px-1 py-1 text-right">{money(c.gravado)}</td>
                    <td className="border border-gray-200 px-1 py-1 text-right">{money(c.exento)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-rose-800 text-white">
                <th className="px-2 py-1 text-left font-semibold" colSpan={3}>
                  Deducciones
                </th>
              </tr>
              <tr className="bg-rose-50">
                <th className="border border-gray-200 px-1 py-1 text-left">SAT</th>
                <th className="border border-gray-200 px-1 py-1 text-left">Concepto</th>
                <th className="border border-gray-200 px-1 py-1 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {deducciones.length === 0 ? (
                <tr>
                  <td colSpan={3} className="border border-gray-200 px-2 py-2 text-gray-500">
                    Sin deducciones
                  </td>
                </tr>
              ) : (
                deducciones.map((c) => (
                  <tr key={`${c.claveSat}-${c.clave}-${c.descripcion}`}>
                    <td className="border border-gray-200 px-1 py-1 font-mono">{c.claveSat}</td>
                    <td className="border border-gray-200 px-1 py-1">{c.descripcion}</td>
                    <td className="border border-gray-200 px-1 py-1 text-right">{money(c.importe)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="relative mt-3 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-[10px] uppercase text-emerald-800">Total percepciones</p>
            <p className="font-bold text-emerald-900">{money(totals.perc)}</p>
          </div>
          <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2">
            <p className="text-[10px] uppercase text-rose-800">Total deducciones</p>
            <p className="font-bold text-rose-900">{money(totals.ded)}</p>
          </div>
          <div className="rounded border border-blue-300 bg-blue-50 px-3 py-2">
            <p className="text-[10px] uppercase text-blue-800">Neto a recibir</p>
            <p className="font-bold text-blue-900">{money(totals.neto)}</p>
          </div>
        </div>

        <p className="relative mt-4 text-[10px] leading-relaxed text-gray-500">
          Documento de prenómina para validación interna. No es un CFDI, no tiene sello SAT ni UUID. El PDF timbrado se
          genera con Facturapi al cerrar la nómina, con los mismos conceptos SAT (001 sueldo, 010 puntualidad, 021 prima,
          002 ISR, 001 IMSS, 010 Infonavit, 011 Fonacot).
        </p>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #prenomina-print, #prenomina-print * { visibility: visible !important; }
          #prenomina-print {
            position: absolute !important;
            left: 0; top: 0; width: 100%;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
