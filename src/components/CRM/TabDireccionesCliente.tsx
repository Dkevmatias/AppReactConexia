import { Copy, MapPin, Plus, Trash2 } from "lucide-react";
import {
  clonarDireccionComoEntrega,
  direccionVacia,
  DireccionClienteForm,
  etiquetaTipoDireccion,
  TipoDireccionCliente,
} from "./clienteAltaUtils";
import { prospectoInputClass, prospectoLabelClass } from "./prospectoFormUtils";

type TabDireccionesClienteProps = {
  direcciones: DireccionClienteForm[];
  onChange: (direcciones: DireccionClienteForm[]) => void;
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

function FormularioDireccion({
  direccion,
  indice,
  onChange,
  onEliminar,
  onClonarEntrega,
}: {
  direccion: DireccionClienteForm;
  indice: number;
  onChange: (parcial: Partial<DireccionClienteForm>) => void;
  onEliminar: () => void;
  onClonarEntrega?: () => void;
}) {
  const campo = (key: keyof DireccionClienteForm, label: string, id: string) => (
    <div key={key}>
      <label className={prospectoLabelClass} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        value={String(direccion[key] ?? "")}
        onChange={(e) => onChange({ [key]: e.target.value } as Partial<DireccionClienteForm>)}
        className={prospectoInputClass}
      />
    </div>
  );

  return (
    <article className="rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-800/80">
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
        </div>
        <div className="flex flex-wrap gap-2">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campo("nombre", "Nombre", `${direccion.idLocal}-nombre`)}
          {campo("calle", "Calle", `${direccion.idLocal}-calle`)}
          {campo("numero", "Número", `${direccion.idLocal}-numero`)}
          {campo("colonia", "Colonia", `${direccion.idLocal}-colonia`)}
          {campo("ciudad", "Ciudad", `${direccion.idLocal}-ciudad`)}
          {campo("estado", "Estado", `${direccion.idLocal}-estado`)}
          {campo("pais", "País", `${direccion.idLocal}-pais`)}
          {campo("cp", "CP", `${direccion.idLocal}-cp`)}
          {campo("iva", "IVA", `${direccion.idLocal}-iva`)}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Catálogo SAT
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campo("coloniaSat", "Colonia SAT", `${direccion.idLocal}-colonia-sat`)}
            {campo("localidadSat", "Localidad SAT", `${direccion.idLocal}-localidad-sat`)}
            {campo("municipioSat", "Municipio SAT", `${direccion.idLocal}-municipio-sat`)}
            {campo("estadoSat", "Estado SAT", `${direccion.idLocal}-estado-sat`)}
            {campo("paisSat", "País SAT", `${direccion.idLocal}-pais-sat`)}
            {campo("cpSat", "CP SAT", `${direccion.idLocal}-cp-sat`)}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function TabDireccionesCliente({
  direcciones,
  onChange,
}: TabDireccionesClienteProps) {
  const agregar = (tipo: TipoDireccionCliente) => {
    onChange([...direcciones, direccionVacia(tipo)]);
  };

  const actualizar = (idLocal: string, parcial: Partial<DireccionClienteForm>) => {
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
