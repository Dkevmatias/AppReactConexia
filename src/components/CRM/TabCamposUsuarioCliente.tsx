import { useEffect, useState } from "react";
import {
  ClienteAltaForm,
  DIAS_VISITA_SAP,
} from "./clienteAltaUtils";
import { prospectoInputClass, prospectoLabelClass } from "./prospectoFormUtils";
import {
  etiquetaSatItem,
  satCatalogoService,
  type SatCatalogoItem,
} from "../../services/satCatalogoService";

type Props = {
  datos: ClienteAltaForm;
  onChange: (parcial: Partial<ClienteAltaForm>) => void;
  soloLectura?: boolean;
};

function porcentajeDesdeDpp(dpp: string): string {
  const v = dpp.trim().toLowerCase();
  if (v === "si" || v === "sí") return "0.05";
  if (v === "no") return "0";
  return "";
}

export default function TabCamposUsuarioCliente({
  datos,
  onChange,
  soloLectura = false,
}: Props) {
  const [regimenes, setRegimenes] = useState<SatCatalogoItem[]>([]);
  const [loadingRegimen, setLoadingRegimen] = useState(true);
  const [errorRegimen, setErrorRegimen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cargar = async () => {
      setLoadingRegimen(true);
      setErrorRegimen(null);
      try {
        const lista = await satCatalogoService.getRegimenesFiscales();
        if (!cancelled) setRegimenes(lista);
      } catch (err) {
        if (!cancelled) {
          setRegimenes([]);
          setErrorRegimen(
            err instanceof Error
              ? err.message
              : "No se pudo cargar el catálogo de régimen fiscal.",
          );
        }
      } finally {
        if (!cancelled) setLoadingRegimen(false);
      }
    };
    void cargar();
    return () => {
      cancelled = true;
    };
  }, []);

  // Si DPP ya viene cargado, asegura el porcentaje fijo
  useEffect(() => {
    if (soloLectura) return;
    const esperado = porcentajeDesdeDpp(datos.uBxpDpp);
    if (!esperado || datos.uBxpPorcDpp === esperado) return;
    onChange({ uBxpPorcDpp: esperado });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datos.uBxpDpp, soloLectura]);

  const cambiarDpp = (valor: string) => {
    onChange({
      uBxpDpp: valor,
      uBxpPorcDpp: porcentajeDesdeDpp(valor),
    });
  };

  return (
    <fieldset
      disabled={soloLectura}
      className="min-w-0 space-y-4 border-0 p-0 disabled:opacity-90"
    >
      {errorRegimen ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          {errorRegimen}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-regimen">
            Régimen fiscal (U_COK1_01REGFIS)
          </label>
          <select
            id="cliente-regimen"
            value={datos.regimenFiscal}
            onChange={(e) => onChange({ regimenFiscal: e.target.value })}
            className={prospectoInputClass}
            disabled={loadingRegimen && regimenes.length === 0}
          >
            <option value="">
              {loadingRegimen
                ? "Cargando régimen fiscal…"
                : "Seleccione régimen fiscal"}
            </option>
            {regimenes.map((r) => (
              <option key={r.clave} value={r.clave}>
                {etiquetaSatItem(r)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-addenda-esp">
            Addenda especial (U_COK1_01ADDENDAESP)
          </label>
          <input
            id="cliente-addenda-esp"
            type="text"
            value={datos.addendaEsp}
            onChange={(e) => onChange({ addendaEsp: e.target.value })}
            placeholder="Ej. CaP_31"
            className={prospectoInputClass}
          />
        </div>

        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-ruta">
            Ruta (U_BXP_RUTA)
          </label>
          <input
            id="cliente-ruta"
            type="text"
            value={datos.uBxpRuta}
            onChange={(e) => onChange({ uBxpRuta: e.target.value })}
            placeholder="Ej. CODIAL14F"
            className={prospectoInputClass}
          />
        </div>

        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-dpp">
            DPP (U_BXP_DPP)
          </label>
          <select
            id="cliente-dpp"
            value={datos.uBxpDpp}
            onChange={(e) => cambiarDpp(e.target.value)}
            className={prospectoInputClass}
          >
            <option value="">Seleccione</option>
            <option value="Si">Sí</option>
            <option value="No">No</option>
          </select>
        </div>

        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-porc-dpp">
            Porcentaje DPP (U_BXP_PorcDPP)
          </label>
          <input
            id="cliente-porc-dpp"
            type="text"
            readOnly
            value={datos.uBxpPorcDpp}
            placeholder={
              datos.uBxpDpp === "Si"
                ? "0.05"
                : datos.uBxpDpp === "No"
                  ? "0"
                  : "Según DPP"
            }
            className={`${prospectoInputClass} bg-gray-50 dark:bg-gray-900/40`}
            title="Se asigna automáticamente: Sí → 0.05, No → 0"
          />
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            Automático: Sí = 0.05 · No = 0 (no editable)
          </p>
        </div>

        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-tipo">
            Tipo cliente (U_TipoCliente)
          </label>
          <input
            id="cliente-tipo"
            type="text"
            value={datos.uTipoCliente}
            onChange={(e) => onChange({ uTipoCliente: e.target.value })}
            placeholder="Ej. S"
            className={prospectoInputClass}
          />
        </div>

        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-visita">
            Día visita (U_DiaVisita)
          </label>
          <select
            id="cliente-visita"
            value={datos.uDiaVisita}
            onChange={(e) => onChange({ uDiaVisita: e.target.value })}
            className={prospectoInputClass}
          >
            <option value="">Seleccione día</option>
            {DIAS_VISITA_SAP.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-slp">
            Vendedor SAP (SalesPersonCode)
          </label>
          <input
            id="cliente-slp"
            type="number"
            min={0}
            value={datos.salesPersonCode}
            onChange={(e) => onChange({ salesPersonCode: e.target.value })}
            placeholder="SlpCode"
            className={prospectoInputClass}
          />
        </div>
      </div>
    </fieldset>
  );
}
