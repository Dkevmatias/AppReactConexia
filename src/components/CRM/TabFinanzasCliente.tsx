import { ClienteAltaForm, SI_NO_SAP } from "./clienteAltaUtils";
import { prospectoInputClass, prospectoLabelClass } from "./prospectoFormUtils";

type Props = {
  datos: ClienteAltaForm;
  onChange: (parcial: Partial<ClienteAltaForm>) => void;
};

function SelectSiNo({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className={prospectoLabelClass} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={prospectoInputClass}
      >
        {SI_NO_SAP.map((opt) => (
          <option key={`${id}-${opt.value || "empty"}`} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default function TabFinanzasCliente({ datos, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-regimen">
            Régimen fiscal (U_COK1_01REGFIS)
          </label>
          <input
            id="cliente-regimen"
            type="text"
            value={datos.regimenFiscal}
            onChange={(e) => onChange({ regimenFiscal: e.target.value })}
            placeholder="Ej. 616"
            className={prospectoInputClass}
          />
        </div>
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-addenda">
            Addenda
          </label>
          <input
            id="cliente-addenda"
            type="text"
            value={datos.addenda}
            onChange={(e) => onChange({ addenda: e.target.value })}
            className={prospectoInputClass}
          />
        </div>
        <div>
          <label className={prospectoLabelClass} htmlFor="cliente-addenda-esp">
            Addenda especial
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectSiNo
          id="cliente-usmap"
          label="Usa mapa especial"
          value={datos.usaMapEsp}
          onChange={(usaMapEsp) => onChange({ usaMapEsp })}
        />
        <SelectSiNo
          id="cliente-envaut"
          label="Envío automático CE"
          value={datos.envioAutCe}
          onChange={(envioAutCe) => onChange({ envioAutCe })}
        />
        <SelectSiNo
          id="cliente-ieps"
          label="IEPS"
          value={datos.ieps}
          onChange={(ieps) => onChange({ ieps })}
        />
        <SelectSiNo
          id="cliente-comedu"
          label="Comisión educativa"
          value={datos.comEdu}
          onChange={(comEdu) => onChange({ comEdu })}
        />
        <SelectSiNo
          id="cliente-agrpar"
          label="Agrupar partidas MOS"
          value={datos.agrParMos}
          onChange={(agrParMos) => onChange({ agrParMos })}
        />
      </div>
    </div>
  );
}
