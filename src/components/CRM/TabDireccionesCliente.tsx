import { useEffect, useRef, useState } from "react";
import { Copy, MapPin, Plus, Save, Trash2 } from "lucide-react";
import {
  clonarDireccionComoEntrega,
  direccionVacia,
  DireccionClienteForm,
  ESTADOS_MEXICO,
  etiquetaTipoDireccion,
  TipoDireccionCliente,
} from "./clienteAltaUtils";
import { prospectoInputClass, prospectoLabelClass } from "./prospectoFormUtils";
import {
  etiquetaSatItem,
  normalizarPaisClaveSat,
  PAIS_SAT_DEFAULT,
  satCatalogoService,
  type SatCatalogoItem,
} from "../../services/satCatalogoService";

type TabDireccionesClienteProps = {
  direcciones: DireccionClienteForm[];
  onChange: (direcciones: DireccionClienteForm[]) => void;
  /** Cliente ya existe en CRM: permite POST/PUT inmediato. */
  clientePersistido?: boolean;
  onGuardarDireccion?: (
    direccion: DireccionClienteForm,
  ) => void | Promise<void>;
  soloLectura?: boolean;
};

function actualizarDireccion(
  lista: DireccionClienteForm[],
  idLocal: string,
  parcial: Partial<DireccionClienteForm>,
): DireccionClienteForm[] {
  return lista.map((d) =>
    d.idLocal === idLocal ? { ...d, ...parcial } : d,
  );
}

/** Un combo visible: clave SAT → también escribe State SAP (CHS, JAL…). */
function sapDesdeEstadoSat(clave: string, nombre: string): string {
  const n = nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const byName = ESTADOS_MEXICO.find((e) => {
    const en = e.nombre
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    return en === n || en.includes(n) || n.includes(en);
  });
  if (byName) return byName.sap;
  const bySat = ESTADOS_MEXICO.find((e) => e.sat === clave || e.sap === clave);
  return bySat?.sap ?? clave;
}

function FormularioDireccion({
  direccion,
  indice,
  onChange,
  onEliminar,
  onClonarEntrega,
  clientePersistido,
  onGuardarDireccion,
  soloLectura = false,
}: {
  direccion: DireccionClienteForm;
  indice: number;
  onChange: (parcial: Partial<DireccionClienteForm>) => void;
  onEliminar: () => void;
  onClonarEntrega?: () => void;
  clientePersistido?: boolean;
  onGuardarDireccion?: (
    direccion: DireccionClienteForm,
  ) => void | Promise<void>;
  soloLectura?: boolean;
}) {
  const paisClave = normalizarPaisClaveSat(
    direccion.paisSat || PAIS_SAT_DEFAULT,
  );
  const estadoClave = (direccion.estadoSat || "").trim();
  const municipioClave = (direccion.municipioSat || "").trim();
  const cpClave = (direccion.cpSat || direccion.cp || "").trim();

  const [estados, setEstados] = useState<SatCatalogoItem[]>([]);
  const [municipios, setMunicipios] = useState<SatCatalogoItem[]>([]);
  const [localidades, setLocalidades] = useState<SatCatalogoItem[]>([]);
  const [colonias, setColonias] = useState<SatCatalogoItem[]>([]);
  const [loadingEstados, setLoadingEstados] = useState(false);
  const [loadingMunLoc, setLoadingMunLoc] = useState(false);
  const [loadingCp, setLoadingCp] = useState(false);
  const [loadingColonias, setLoadingColonias] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);
  const [infoCp, setInfoCp] = useState<string | null>(null);
  const ultimoCpResuelto = useRef<string>("");

  const pendientePersistir =
    !direccion.idClienteDireccion || direccion.idClienteDireccion <= 0;

  useEffect(() => {
    if (soloLectura) return;
    const actual = (direccion.paisSat || "").trim().toUpperCase();
    if (actual === "MEX") return;
    onChange({
      paisSat: PAIS_SAT_DEFAULT,
      pais: direccion.pais?.trim() || "MX",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direccion.paisSat, soloLectura]);

  useEffect(() => {
    let cancelled = false;
    const cargar = async () => {
      setLoadingEstados(true);
      setErrorCatalogo(null);
      try {
        const lista = await satCatalogoService.getEstados(paisClave);
        if (cancelled) return;
        setEstados(lista);
        if (lista.length === 0) {
          setErrorCatalogo(
            `Sin estados para paisClave=${paisClave}. Verifique GET /api/SatEstado`,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setEstados([]);
          setErrorCatalogo(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar estados SAT.",
          );
        }
      } finally {
        if (!cancelled) setLoadingEstados(false);
      }
    };
    void cargar();
    return () => {
      cancelled = true;
    };
  }, [paisClave]);

  useEffect(() => {
    let cancelled = false;
    const cp = cpClave.replace(/\D/g, "").slice(0, 5);
    if (cp.length !== 5) {
      setInfoCp(null);
      return;
    }
    if (ultimoCpResuelto.current === cp) return;

    const yaResuelto =
      (direccion.cpSat === cp || direccion.cp === cp) &&
      !!direccion.estadoSat &&
      !!direccion.municipioSat;
    if (yaResuelto && !loadingCp) {
      ultimoCpResuelto.current = cp;
      setInfoCp(
        [
          direccion.estadoSat,
          direccion.municipioSat,
          direccion.localidadSat
            ? `Loc. ${direccion.localidadSat}`
            : null,
        ]
          .filter(Boolean)
          .join(" · "),
      );
      return;
    }

    const resolver = async () => {
      setLoadingCp(true);
      setErrorCatalogo(null);
      setInfoCp(null);
      try {
        const det = await satCatalogoService.getByCodigoPostal(cp);
        if (cancelled) return;
        if (!det) {
          setInfoCp(`CP ${cp} no encontrado en catálogo SAT.`);
          return;
        }
        ultimoCpResuelto.current = cp;
        const nombreEstado =
          estados.find((e) => e.clave === det.estadoClave)?.nombre ||
          det.estadoNombre ||
          "";
        onChange({
          cp: cp,
          cpSat: cp,
          paisSat: PAIS_SAT_DEFAULT,
          pais: "MX",
          estadoSat: det.estadoClave,
          estado: sapDesdeEstadoSat(det.estadoClave, nombreEstado),
          municipioSat: det.municipioClave,
          localidadSat: det.localidadClave,
          coloniaSat: "",
        });
        setInfoCp(
          [
            det.estadoNombre || det.estadoClave,
            det.municipioNombre || det.municipioClave,
            det.localidadClave ? `Loc. ${det.localidadClave}` : null,
          ]
            .filter(Boolean)
            .join(" · "),
        );
      } catch (err) {
        if (!cancelled) {
          setErrorCatalogo(
            err instanceof Error
              ? err.message
              : "No se pudo resolver el código postal.",
          );
        }
      } finally {
        if (!cancelled) setLoadingCp(false);
      }
    };
    void resolver();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpClave]);

  useEffect(() => {
    let cancelled = false;
    if (!estadoClave) {
      setMunicipios([]);
      setLocalidades([]);
      return;
    }
    const cargar = async () => {
      setLoadingMunLoc(true);
      const [munRes, locRes] = await Promise.allSettled([
        satCatalogoService.getMunicipios(estadoClave),
        satCatalogoService.getLocalidades(estadoClave),
      ]);
      if (cancelled) return;
      setMunicipios(munRes.status === "fulfilled" ? munRes.value : []);
      setLocalidades(locRes.status === "fulfilled" ? locRes.value : []);
      setLoadingMunLoc(false);
    };
    void cargar();
    return () => {
      cancelled = true;
    };
  }, [estadoClave]);

  useEffect(() => {
    let cancelled = false;
    if (cpClave.length !== 5) {
      setColonias([]);
      return;
    }
    const cargar = async () => {
      setLoadingColonias(true);
      try {
        const lista = await satCatalogoService.getColonias(cpClave);
        if (!cancelled) setColonias(lista);
      } catch (err) {
        if (!cancelled) {
          setColonias([]);
          setErrorCatalogo(
            err instanceof Error
              ? err.message
              : "No se pudieron cargar colonias.",
          );
        }
      } finally {
        if (!cancelled) setLoadingColonias(false);
      }
    };
    void cargar();
    return () => {
      cancelled = true;
    };
  }, [cpClave]);

  const campo = (
    key: keyof DireccionClienteForm,
    label: string,
    id: string,
  ) => (
    <div key={key}>
      <label className={prospectoLabelClass} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={String(direccion[key] ?? "")}
        onChange={(e) =>
          onChange({ [key]: e.target.value } as Partial<DireccionClienteForm>)
        }
        className={prospectoInputClass}
      />
    </div>
  );

  const cambiarCp = (valor: string) => {
    const cp = valor.replace(/\D/g, "").slice(0, 5);
    const cambioRespectoResuelto = cp !== ultimoCpResuelto.current;
    if (cambioRespectoResuelto) {
      ultimoCpResuelto.current = "";
    }
    onChange({
      cp,
      cpSat: cp,
      ...(cambioRespectoResuelto
        ? {
            estadoSat: "",
            estado: "",
            municipioSat: "",
            localidadSat: "",
            coloniaSat: "",
            colonia: "",
          }
        : {}),
    });
  };

  const cambiarEstado = (clave: string) => {
    const item = estados.find((e) => e.clave === clave);
    onChange({
      estadoSat: clave,
      estado: item ? sapDesdeEstadoSat(clave, item.nombre) : clave,
      municipioSat: "",
      localidadSat: "",
      coloniaSat: "",
      colonia: "",
    });
  };

  const cambiarMunicipioSat = (clave: string) => {
    onChange({
      municipioSat: clave,
      coloniaSat: "",
    });
  };

  const cambiarColoniaSat = (clave: string) => {
    const item = colonias.find((c) => c.clave === clave);
    onChange({
      coloniaSat: clave,
      colonia: item?.nombre || direccion.colonia,
    });
  };

  const guardar = async () => {
    if (!onGuardarDireccion) return;
    setGuardando(true);
    try {
      await onGuardarDireccion(direccion);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "No se pudo guardar la dirección.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const etiquetaEstadoSap =
    direccion.estado?.trim() ||
    (estadoClave
      ? sapDesdeEstadoSat(
          estadoClave,
          estados.find((e) => e.clave === estadoClave)?.nombre || "",
        )
      : "");

  return (
    <fieldset
      disabled={soloLectura}
      className="min-w-0 rounded-lg border border-gray-200 bg-white p-0 disabled:opacity-90 dark:border-gray-600 dark:bg-gray-800/80"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-700">
        <div className="flex flex-wrap items-center gap-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            Dirección {indice + 1}
          </span>
          <select
            value={direccion.tipo}
            onChange={(e) =>
              onChange({ tipo: e.target.value as TipoDireccionCliente })
            }
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-medium dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          >
            <option value="FISCAL">Fiscal</option>
            <option value="ENTREGA">Entrega</option>
          </select>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {etiquetaTipoDireccion(direccion.tipo)}
          </span>
          {pendientePersistir ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
              Sin guardar en CRM
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">
              Guardada
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {onGuardarDireccion ? (
            <button
              type="button"
              onClick={() => void guardar()}
              disabled={guardando}
              className="inline-flex items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-800 hover:bg-blue-100 disabled:opacity-50 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-200"
              title={
                clientePersistido
                  ? pendientePersistir
                    ? "Crear dirección en CRM (POST)"
                    : "Actualizar dirección en CRM"
                  : "Se guardará al Guardar el prospecto si aún no hay cliente"
              }
            >
              <Save className="h-3.5 w-3.5" />
              {guardando
                ? "Guardando…"
                : pendientePersistir
                  ? "Guardar dirección"
                  : "Actualizar"}
            </button>
          ) : null}
          {direccion.tipo === "FISCAL" && onClonarEntrega ? (
            <button
              type="button"
              onClick={onClonarEntrega}
              className="inline-flex items-center gap-1 rounded-lg border border-sky-300 bg-sky-50 px-2.5 py-1.5 text-xs font-medium text-sky-800 hover:bg-sky-100 dark:border-sky-700 dark:bg-sky-950/40 dark:text-sky-200"
            >
              <Copy className="h-3.5 w-3.5" />
              Clonar como entrega
            </button>
          ) : null}
          <button
            type="button"
            onClick={onEliminar}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/30"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Quitar
          </button>
        </div>
      </div>

      <div className="space-y-4 p-4">
        {errorCatalogo ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
            {errorCatalogo}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campo("nombre", "Nombre", `${direccion.idLocal}-nombre`)}
          {campo("calle", "Calle", `${direccion.idLocal}-calle`)}
          {campo("numero", "Número", `${direccion.idLocal}-numero`)}

          <div>
            <label
              className={prospectoLabelClass}
              htmlFor={`${direccion.idLocal}-cp`}
            >
              Código postal
            </label>
            <input
              id={`${direccion.idLocal}-cp`}
              type="text"
              inputMode="numeric"
              maxLength={5}
              placeholder="Ej. 44100"
              value={direccion.cp}
              onChange={(e) => cambiarCp(e.target.value)}
              className={prospectoInputClass}
            />
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              {loadingCp
                ? "Buscando CP…"
                : infoCp
                  ? infoCp
                  : "Al capturar 5 dígitos se llenan estado, municipio y localidad."}
            </p>
          </div>

          <div>
            <label
              className={prospectoLabelClass}
              htmlFor={`${direccion.idLocal}-colonia-sat`}
            >
              Colonia
            </label>
            <select
              id={`${direccion.idLocal}-colonia-sat`}
              value={direccion.coloniaSat}
              onChange={(e) => cambiarColoniaSat(e.target.value)}
              className={prospectoInputClass}
              disabled={cpClave.length !== 5 || loadingColonias}
            >
              <option value="">
                {cpClave.length !== 5
                  ? "Capture CP primero"
                  : loadingColonias
                    ? "Cargando colonias…"
                    : "Seleccione colonia"}
              </option>
              {colonias.map((c) => (
                <option key={c.clave} value={c.clave}>
                  {etiquetaSatItem(c)}
                </option>
              ))}
            </select>
          </div>

          {campo("ciudad", "Ciudad", `${direccion.idLocal}-ciudad`)}

          <div>
            <label
              className={prospectoLabelClass}
              htmlFor={`${direccion.idLocal}-estado`}
            >
              Estado
            </label>
            <select
              id={`${direccion.idLocal}-estado`}
              value={estadoClave}
              onChange={(e) => cambiarEstado(e.target.value)}
              className={prospectoInputClass}
              disabled={loadingEstados}
            >
              <option value="">
                {loadingEstados ? "Cargando estados…" : "Seleccione estado"}
              </option>
              {estados.map((e) => (
                <option key={e.clave} value={e.clave}>
                  {etiquetaSatItem(e)}
                </option>
              ))}
            </select>
            {etiquetaEstadoSap ? (
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                SAP State: <span className="font-medium">{etiquetaEstadoSap}</span>
                {" · "}
                SAT: <span className="font-medium">{estadoClave || "—"}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Un solo combo llena State (SAP) y Estado SAT.
              </p>
            )}
          </div>

          <div>
            <label
              className={prospectoLabelClass}
              htmlFor={`${direccion.idLocal}-pais`}
            >
              País
            </label>
            <input
              id={`${direccion.idLocal}-pais`}
              type="text"
              value={direccion.pais || "MX"}
              readOnly
              className={`${prospectoInputClass} bg-gray-50 dark:bg-gray-900/40`}
            />
          </div>

          {campo("iva", "IVA", `${direccion.idLocal}-iva`)}
          {campo("referencia", "Referencia", `${direccion.idLocal}-ref`)}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Detalle SAT (editable)
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label
                className={prospectoLabelClass}
                htmlFor={`${direccion.idLocal}-pais-sat`}
              >
                País SAT
              </label>
              <select
                id={`${direccion.idLocal}-pais-sat`}
                value={paisClave}
                onChange={(e) =>
                  onChange({
                    paisSat: normalizarPaisClaveSat(e.target.value),
                    pais: "MX",
                  })
                }
                className={prospectoInputClass}
              >
                <option value="MEX">MEX — México</option>
              </select>
            </div>

            <div>
              <label
                className={prospectoLabelClass}
                htmlFor={`${direccion.idLocal}-municipio-sat`}
              >
                Municipio SAT
              </label>
              <select
                id={`${direccion.idLocal}-municipio-sat`}
                value={municipioClave}
                onChange={(e) => cambiarMunicipioSat(e.target.value)}
                className={prospectoInputClass}
                disabled={!estadoClave || loadingMunLoc}
              >
                <option value="">
                  {!estadoClave
                    ? "Estado primero"
                    : loadingMunLoc
                      ? "Cargando…"
                      : "Seleccione municipio"}
                </option>
                {municipios.map((m) => (
                  <option key={m.clave} value={m.clave}>
                    {etiquetaSatItem(m)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                className={prospectoLabelClass}
                htmlFor={`${direccion.idLocal}-localidad-sat`}
              >
                Localidad SAT
              </label>
              <select
                id={`${direccion.idLocal}-localidad-sat`}
                value={direccion.localidadSat}
                onChange={(e) => onChange({ localidadSat: e.target.value })}
                className={prospectoInputClass}
                disabled={!estadoClave || loadingMunLoc}
              >
                <option value="">
                  {!estadoClave
                    ? "Estado primero"
                    : loadingMunLoc
                      ? "Cargando…"
                      : "Seleccione localidad"}
                </option>
                {localidades.map((l) => (
                  <option key={l.clave} value={l.clave}>
                    {etiquetaSatItem(l)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </fieldset>
  );
}

export default function TabDireccionesCliente({
  direcciones,
  onChange,
  clientePersistido = false,
  onGuardarDireccion,
  soloLectura = false,
}: TabDireccionesClienteProps) {
  const agregar = (tipo: TipoDireccionCliente) => {
    onChange([...direcciones, direccionVacia(tipo)]);
  };

  const actualizar = (
    idLocal: string,
    parcial: Partial<DireccionClienteForm>,
  ) => {
    onChange(actualizarDireccion(direcciones, idLocal, parcial));
  };

  const eliminar = (idLocal: string) => {
    onChange(direcciones.filter((d) => d.idLocal !== idLocal));
  };

  const clonarEntrega = (origen: DireccionClienteForm) => {
    onChange([...direcciones, clonarDireccionComoEntrega(origen)]);
  };

  return (
    <div className="space-y-4">
      {!soloLectura ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => agregar("FISCAL")}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              <Plus className="h-4 w-4" />
              Agregar fiscal
            </button>
            <button
              type="button"
              onClick={() => agregar("ENTREGA")}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
            >
              <Plus className="h-4 w-4" />
              Agregar entrega
            </button>
          </div>
          {clientePersistido ? (
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              Tras clonar o editar, use{" "}
              <span className="font-medium">Guardar dirección</span> para
              persistir en CRM.
            </p>
          ) : null}
        </div>
      ) : null}

      {direcciones.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-300 py-10 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
          No hay direcciones. Agregue al menos una fiscal o de entrega.
        </p>
      ) : (
        <div className="space-y-4">
          {direcciones.map((direccion, indice) => (
            <FormularioDireccion
              key={direccion.idLocal}
              direccion={direccion}
              indice={indice}
              onChange={(parcial) => actualizar(direccion.idLocal, parcial)}
              onEliminar={() => eliminar(direccion.idLocal)}
              onClonarEntrega={
                direccion.tipo === "FISCAL"
                  ? () => clonarEntrega(direccion)
                  : undefined
              }
              clientePersistido={clientePersistido}
              onGuardarDireccion={soloLectura ? undefined : onGuardarDireccion}
              soloLectura={soloLectura}
            />
          ))}
        </div>
      )}
    </div>
  );
}
