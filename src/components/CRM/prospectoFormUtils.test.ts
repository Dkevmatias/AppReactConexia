import { describe, expect, it } from "vitest";
import {
  ID_EMPRESA_CODIAL,
  ID_EMPRESA_CODIALUB,
  cardCodeBaseCodialub,
  cardCodeParaCodial,
  descuentoEnviadoSap,
  empresasDescuentosEnviadasDesdeDocs,
  empresasSapEnviadasDesdeCliente,
  idEmpresaDescuentoDesdeDoc,
  salesPersonCodeSegunEmpresa,
  vendedorPorUsername,
} from "./prospectoFormUtils";

/**
 * Pruebas unitarias: funciones puras (entrada → salida, sin UI ni red).
 * Patrón AAA: Arrange (preparar) → Act (ejecutar) → Assert (verificar).
 */
describe("CardCode Codialub / Codial", () => {
  it("arma el CardCode de Codial con el prefijo C", () => {
    expect(cardCodeParaCodial("C002899")).toBe("CC002899");
  });

  it("recupera el CardCode de Codialub quitando la C extra", () => {
    expect(cardCodeBaseCodialub("CC002899")).toBe("C002899");
  });

  it("normaliza minúsculas y espacios", () => {
    expect(cardCodeBaseCodialub("  cc002899  ")).toBe("C002899");
  });

  it("no duplica el prefijo si ya es CardCode de Codial", () => {
    expect(cardCodeParaCodial("CC002899")).toBe("CC002899");
  });

  it("devuelve vacío si no hay CardCode", () => {
    expect(cardCodeParaCodial("")).toBe("");
    expect(cardCodeBaseCodialub(null)).toBe("");
  });
});

describe("empresasSapEnviadasDesdeCliente", () => {
  it("no marca empresas si el estatus no es enviado", () => {
    expect(
      empresasSapEnviadasDesdeCliente({
        estatusSap: "pendiente",
        cardCode: "C002899",
      }),
    ).toEqual([]);
  });

  it("marca solo Codialub cuando el CardCode no tiene CC", () => {
    expect(
      empresasSapEnviadasDesdeCliente({
        estatusSap: "Enviado",
        cardCode: "C002899",
      }),
    ).toEqual([ID_EMPRESA_CODIALUB]);
  });

  it("marca Codialub y Codial cuando el CardCode empieza con CC", () => {
    expect(
      empresasSapEnviadasDesdeCliente({
        estatusSap: "enviado",
        cardCode: "CC002899",
      }),
    ).toEqual([ID_EMPRESA_CODIALUB, ID_EMPRESA_CODIAL]);
  });
});

describe("idEmpresaDescuentoDesdeDoc", () => {
  it("respeta idEmpresa si viene en el documento", () => {
    expect(idEmpresaDescuentoDesdeDoc({ idEmpresa: 2, cardCode: "C002899" })).toBe(
      ID_EMPRESA_CODIAL,
    );
  });

  it("infiere Codial cuando el CardCode empieza con CC", () => {
    expect(
      idEmpresaDescuentoDesdeDoc({ idEmpresa: null, cardCode: "CC002899" }),
    ).toBe(ID_EMPRESA_CODIAL);
  });

  it("infiere Codialub cuando el CardCode es C… sin CC", () => {
    expect(
      idEmpresaDescuentoDesdeDoc({ idEmpresa: 0, cardCode: "C002899" }),
    ).toBe(ID_EMPRESA_CODIALUB);
  });
});

describe("descuentos enviados a SAP", () => {
  it("considera enviado si el estatus es enviado o hay AbsEntry", () => {
    expect(descuentoEnviadoSap("Enviado", 0)).toBe(true);
    expect(descuentoEnviadoSap("", 12)).toBe(true);
    expect(descuentoEnviadoSap("pendiente", 0)).toBe(false);
  });

  it("lista las sociedades con documento de descuento ya enviado", () => {
    const ids = empresasDescuentosEnviadasDesdeDocs([
      { idEmpresa: 1, estatusSync: "Enviado", absEntry: 10 },
      { idEmpresa: 2, estatusSync: "pendiente", absEntry: 0 },
    ]);
    expect(ids).toEqual([ID_EMPRESA_CODIALUB]);
  });

  it("asume Codialub si el documento enviado no trae idEmpresa", () => {
    expect(
      empresasDescuentosEnviadasDesdeDocs([
        { idEmpresa: null, estatusSync: "enviado", absEntry: 1 },
      ]),
    ).toEqual([ID_EMPRESA_CODIALUB]);
  });
});

describe("vendedor SAP según empresa", () => {
  const vendedor = {
    idVendedor: 7,
    slpName: "VTX01",
    nombre: "Ana",
    salesPersonCode: 11,
    salesPersonCode2: 22,
  };

  it("usa salesPersonCode en Codialub y salesPersonCode2 en Codial", () => {
    expect(salesPersonCodeSegunEmpresa(vendedor, ID_EMPRESA_CODIALUB)).toBe(
      "11",
    );
    expect(salesPersonCodeSegunEmpresa(vendedor, ID_EMPRESA_CODIAL)).toBe("22");
  });

  it("encuentra el vendedor por username (slpName)", () => {
    expect(vendedorPorUsername([vendedor], "vtx01")?.idVendedor).toBe(7);
    expect(vendedorPorUsername([vendedor], "otro")).toBeNull();
  });
});
