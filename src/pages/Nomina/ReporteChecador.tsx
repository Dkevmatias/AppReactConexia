/* NOMCONEXIA-UNIFY */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import { empresaService, Empresa } from "../../services/empresaService";
import { empleadoService, Empleado } from "../../services/empleadoService";
import { incidenciaService } from "../../services/nominaIncidenciaService";
import { nominaBonoService } from "../../services/nominaBonoService";
import { readXlsxChecador } from "../../utils/xlsxGrid";
import {
  FilaChecador,
  PeriodoChecador,
  LineaChecador,
  buildReporteChecador,
  filasToIncidencias,
  normalizarNombre,
} from "../../utils/checadorReporte";
import {
  ESCALA_PUNTUALIDAD_DEFAULT,
  etiquetaEscala,
  EscalaPuntualidadTramo,
} from "../../utils/escalaPuntualidad";
import {
  PoliticaRetardoEmpresa,
  POLITICA_RETARDO_DEFAULT,
  politicaRetardoService,
} from "../../services/politicaRetardoService";
import { FileIcon, ListIcon } from "../../icons";

function money(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n || 0);
}

export default function ReporteChecador() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empleadosEmpresa, setEmpleadosEmpresa] = useState<number | null>(null);
  const [politica, setPolitica] = useState<PoliticaRetardoEmpresa | null>(null);
  const [idEmpresa, setIdEmpresa] = useState(0);
  const [sheetName, setSheetName] = useState("");
  const [montoBono, setMontoBono] = useState(0);
  const [escala] = useState<EscalaPuntualidadTramo[]>(ESCALA_PUNTUALIDAD_DEFAULT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [periodo, setPeriodo] = useState<PeriodoChecador | null>(null);
  const [filas, setFilas] = useState<FilaChecador[]>([]);
  const [otras, setOtras] = useState<LineaChecador[]>([]);
  const [overrideMatch, setOverrideMatch] = useState<Record<string, number>>({});
  const [lastGrid, setLastGrid] = useState<string[][] | null>(null);

  useEffect(() => {
    empresaService
      .getEmpresas()
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setEmpresas(list);
        setIdEmpresa((actual) => actual || list[0]?.idEmpresa || 0);
      })
      .catch(() => setError("No se pudieron cargar las empresas. Revisa que la API esté encendida."));
  }, []);

  useEffect(() => {
    if (!idEmpresa) {
      setEmpleados([]);
      setEmpleadosEmpresa(null);
      setPolitica(null);
      setMontoBono(0);
      return;
    }
    setEmpleados([]);
    setEmpleadosEmpresa(null);
    let cancelled = false;
    empleadoService
      .getEmpleados(idEmpresa)
      .then((data) => {
        if (cancelled) return;
        setEmpleados(Array.isArray(data) ? data : []);
        setEmpleadosEmpresa(idEmpresa);
      })
      .catch(() => {
        if (cancelled) return;
        setEmpleados([]);
        setEmpleadosEmpresa(idEmpresa);
      });
    politicaRetardoService
      .getByEmpresa(idEmpresa)
      .then((p) => {
        if (!cancelled) setPolitica(p);
      })
      .catch(() => {
        if (!cancelled) {
          setPolitica({
            empresa: { ...POLITICA_RETARDO_DEFAULT, idEmpresa },
            excepciones: [],
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [idEmpresa]);

  useEffect(() => {
    if (!idEmpresa) {
      setMontoBono(0);
      return;
    }
    let cancelled = false;
    nominaBonoService
      .resolver(idEmpresa, periodo?.anio)
      .then((bono) => {
        if (!cancelled) setMontoBono(bono?.monto ?? 0);
      })
      .catch(() => {
        if (!cancelled) setMontoBono(0);
      });
    return () => {
      cancelled = true;
    };
  }, [idEmpresa, periodo?.anio]);

  useEffect(() => {
    if (!lastGrid || !idEmpresa || empleadosEmpresa !== idEmpresa) return;
    const reporte = buildReporteChecador({
      grid: lastGrid,
      empleados,
      idEmpresa,
      montoBono,
      escala,
      overrideMatch,
      politicaRetardo: politica,
    });
    setPeriodo(reporte.periodo);
    const leidos = reporte.filas.filter((f) => f.origenExcel !== false);
    setFilas(leidos);
    setOtras(reporte.otras);
    const nombres = leidos.map((f) => f.nombre).slice(0, 8).join(", ");
    const sinMatch = leidos.filter((f) => !f.matched);
    setNotice(
      `Del Excel se leyeron ${leidos.length} persona(s): ${nombres}${leidos.length > 8 ? "…" : ""}.` +
        (sinMatch.length
          ? ` ${sinMatch.length} no coinciden con la empresa seleccionada; asígnalas a mano.`
          : " Todas coincidieron por nombre con la empresa seleccionada.")
    );
  }, [empleados, empleadosEmpresa, lastGrid, idEmpresa, montoBono, overrideMatch, escala, politica]);

  const handleFile = async (file: File) => {
    setError(null);
    setNotice(null);
    setFileName(file.name);
    setLoading(true);
    try {
      if (!file.name.match(/\.xlsx$/i)) {
        throw new Error("Usa ReporteAjustes.xlsx del checador (hoja Asistencia y puntualidad).");
      }
      if (!idEmpresa) throw new Error("Selecciona la empresa antes de cargar el archivo");
      const { grid, sheetName: hoja } = await readXlsxChecador(await file.arrayBuffer());
      setSheetName(hoja);
      setLastGrid(grid);
      setOverrideMatch({});
    } catch (e) {
      setLastGrid(null);
      setFilas([]);
      setPeriodo(null);
      setSheetName("");
      setError(e instanceof Error ? e.message : "No se pudo leer el Excel");
    } finally {
      setLoading(false);
    }
  };

  const aplicarMatch = (fila: FilaChecador, idEmpleado: number) => {
    setOverrideMatch((prev) => ({
      ...prev,
      [normalizarNombre(fila.nombre)]: idEmpleado,
      ...(fila.numeroReloj ? { [`n:${String(fila.numeroReloj).replace(/^0+/, "").trim()}`]: idEmpleado } : {}),
    }));
  };

  const persistir = async () => {
    if (!periodo) return;
    const pendientes = filas.filter((f) => (f.faltas > 0 || f.retardos > 0) && !f.idEmpleado);
    if (pendientes.length) {
      alert(`Hay ${pendientes.length} renglón(es) sin empleado asignado.`);
      return;
    }
    const items = filasToIncidencias(filas, periodo);
    if (!items.length) {
      alert("No hay faltas ni retardos para guardar.");
      return;
    }
    if (!confirm(`Se crearán ${items.length} incidencia(s) en PENDIENTE (una por día). ¿Continuar?`)) return;
    setSaving(true);
    try {
      const result = await incidenciaService.createMasiva(items);
      if (typeof result.creados !== "number") {
        throw new Error((result as { message?: string }).message || "No se pudieron guardar las incidencias");
      }
      const extras = (result.mensajes || []).slice(0, 6).join(" ");
      setNotice(
        `${result.message || `Se importaron ${result.creados} incidencias.`} ${extras} Quedan en PENDIENTE: RH las aplica a la nómina.`
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : "No se pudieron guardar las incidencias");
    } finally {
      setSaving(false);
    }
  };

  const totales = useMemo(
    () =>
      filas.reduce(
        (acc, f) => ({
          faltas: acc.faltas + f.faltas,
          retardos: acc.retardos + f.retardos,
          descuento: acc.descuento + f.descuento,
          bono: acc.bono + f.bono,
        }),
        { faltas: 0, retardos: 0, descuento: 0, bono: 0 }
      ),
    [filas]
  );

  const escalaUi = etiquetaEscala(escala);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Reporte del checador</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400 max-w-3xl">
            Importa <strong>ReporteAjustes.xlsx</strong> (asistencia y puntualidad). La tabla muestra solo a las
            personas del Excel y las cruza con los empleados de la empresa que elijas (por número de reloj y nombre).
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link to="/nomina/reloj" className="text-blue-600 hover:underline dark:text-blue-400">
            Reloj oficina
          </Link>
          <Link to="/nomina/incidencias" className="text-blue-600 hover:underline dark:text-blue-400">
            Volver a incidencias
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/5">
        <div className="mb-4 flex items-center gap-2">
          <ListIcon className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Quincena</span>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Label>Empresa</Label>
            <Select
              options={empresas.map((e) => ({ value: String(e.idEmpresa), label: e.nombre }))}
              value={idEmpresa ? String(idEmpresa) : ""}
              onChange={(val) => setIdEmpresa(parseInt(val) || 0)}
            />
          </div>
          <div>
            <Label>Monto bono puntualidad</Label>
            <Input
              type="number"
              value={montoBono}
              onChange={(e) => setMontoBono(Number(e.target.value) || 0)}
            />
            <p className="mt-1 text-xs text-gray-500">
              Se carga desde NominaBono (empresa + año de la quincena). Puedes ajustarlo para este reporte.
            </p>
          </div>
          <div>
            <Label>Excel del checador</Label>
            <label className="flex h-11 cursor-pointer items-center gap-2 overflow-hidden rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
              <FileIcon className="h-4 w-4 shrink-0" />
              <span className="truncate">{fileName || "ReporteAjustes.xlsx"}</span>
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = "";
                }}
              />
            </label>
            {sheetName && (
              <p className="mt-1 text-xs text-gray-500">Hoja leída: {sheetName}</p>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
          {escalaUi.map((t) => (
            <span key={t.rango} className="rounded-full bg-gray-100 px-2 py-1 dark:bg-white/10">
              {t.rango} retardo(s) → paga {t.pagar}%
            </span>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
          {error}
        </div>
      )}
      {notice && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-200">
          {notice}
        </div>
      )}

      {loading && (
        <div className="flex h-40 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
        </div>
      )}

      {periodo && !loading && (
        <>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">{periodo.titulo}</h2>
              <p className="text-sm text-gray-500">
                {periodo.quincena === 1 ? "1ª" : "2ª"} quincena · {periodo.fechaInicio} a {periodo.fechaFin}
                {sheetName ? ` · hoja “${sheetName}”` : ""}
                {` · ${filas.filter((f) => f.origenExcel).length} del Excel`}
              </p>
            </div>
            <Button onClick={persistir} disabled={saving || filas.length === 0}>
              {saving ? "Guardando..." : "Crear incidencias pendientes"}
            </Button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/5">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 font-medium text-gray-500">No.</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Empleado (reloj)</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Empleado</th>
                  <th className="px-4 py-3 font-medium text-gray-500">SDI</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Faltas</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Retardos</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Descuento</th>
                  <th className="px-4 py-3 font-medium text-gray-500">Bono</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No se leyeron renglones de puntualidad ni de sin goce
                    </td>
                  </tr>
                ) : (
                  filas.map((fila) => (
                    <tr key={`${fila.numeroReloj || ""}-${fila.nombre}`} className="align-top">
                    <td className="px-4 py-3 whitespace-nowrap text-gray-500">{fila.numeroReloj || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 dark:text-white">{fila.nombre}</div>
                        {(fila.detalleFalta || fila.detalleRetardo) && (
                          <div className="mt-1 max-w-xs text-xs text-gray-500">
                            {fila.detalleRetardo}
                            {fila.detalleFalta ? ` · ${fila.detalleFalta}` : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 min-w-[220px]">
                        {fila.matched && !fila.conflictoNombre ? (
                          <span className="text-gray-700 dark:text-gray-200">{fila.empleadoNombre}</span>
                        ) : (
                          <Select
                            options={[
                              { value: "", label: "Asignar empleado de esta empresa" },
                              ...empleados.map((e) => ({ value: String(e.idEmpleado), label: e.fullName })),
                            ]}
                            value={fila.idEmpleado ? String(fila.idEmpleado) : ""}
                            onChange={(val) => aplicarMatch(fila, parseInt(val) || 0)}
                          />
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{money(fila.sdi)}</td>
                      <td className="px-4 py-3">{fila.faltas}</td>
                      <td className="px-4 py-3">
                        {fila.retardos}
                        <div className="text-xs text-gray-500">{Math.round(fila.pctBono * 100)}% del bono</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-red-700 dark:text-red-300">
                        {money(fila.descuento)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-emerald-700 dark:text-emerald-300">
                        {money(fila.bono)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filas.length > 0 && (
                <tfoot>
                  <tr className="border-t border-gray-200 bg-gray-50 font-medium dark:border-gray-700 dark:bg-white/5">
                    <td className="px-4 py-3" colSpan={4}>
                      Totales
                    </td>
                    <td className="px-4 py-3">{totales.faltas}</td>
                    <td className="px-4 py-3">{totales.retardos}</td>
                    <td className="px-4 py-3">{money(totales.descuento)}</td>
                    <td className="px-4 py-3">{money(totales.bono)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {otras.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/5">
              <h3 className="mb-3 font-medium text-gray-800 dark:text-white">Otras secciones (no entran al descuento SDI)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 py-2 text-gray-500">Sección</th>
                      <th className="px-3 py-2 text-gray-500">Nombre</th>
                      <th className="px-3 py-2 text-gray-500">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {otras.map((l, i) => (
                      <tr key={`${l.nombre}-${i}`}>
                        <td className="px-3 py-2">{l.seccion}</td>
                        <td className="px-3 py-2">{l.nombre}</td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                          {l.detalle}
                          {l.extra ? ` · ${l.extra}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
