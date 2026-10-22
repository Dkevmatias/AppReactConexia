import { describe, expect, it } from "vitest";
import {
  aplicarDescuentoApiAFilas,
  aplicarLimitePorcentaje,
  armarPayloadDescuentoLocal,
  descuentoVacio,
  extraerDocumentosDescuentoApi,
  descuentoApiDesdeRaw,
  esDescuentoDeEmpresa,
  fusionarDocumentosDescuento,
  mergeDocumentosDescuentoAFilas,
  partirDocumentosPorEmpresaDetalle,
  porcentajeADiscRelEntero,
  sanitizarPorcentajeDescuento,
  sincronizarDescuentosConMarcas,
  type ClienteDescuentoApi,
} from "./clienteAltaUtils";

describe("sanitizarPorcentajeDescuento", () => {
  it("quita letras y deja un solo separador decimal", () => {
    expect(sanitizarPorcentajeDescuento("12a.3b.4")).toBe("12.34");
  });

  it("acepta coma mientras se escribe", () => {
    expect(sanitizarPorcentajeDescuento("10,5")).toBe("10,5");
  });
});

describe("límites de porcentaje", () => {
  it("recorta al tope de la marca y avisa que excedió", () => {
    expect(aplicarLimitePorcentaje("25", 10)).toEqual({
      valor: "10",
      excedio: true,
    });
  });

  it("conserva el valor si está dentro del límite", () => {
    expect(aplicarLimitePorcentaje("8,5", 10)).toEqual({
      valor: "8,5",
      excedio: false,
    });
  });

  it("redondea a entero DiscRel respetando el tope", () => {
    expect(porcentajeADiscRelEntero("15.4", 20)).toBe("15");
    expect(porcentajeADiscRelEntero("15.5", 20)).toBe("16");
    expect(porcentajeADiscRelEntero("25", 10)).toBe("10");
    expect(porcentajeADiscRelEntero("0", 10)).toBe("");
  });
});

describe("esDescuentoDeEmpresa", () => {
  it("trata filas sin idEmpresa como Codialub", () => {
    expect(esDescuentoDeEmpresa(null, 1)).toBe(true);
    expect(esDescuentoDeEmpresa(undefined, 1)).toBe(true);
    expect(esDescuentoDeEmpresa(null, 2)).toBe(false);
    expect(esDescuentoDeEmpresa(1, 1)).toBe(true);
    expect(esDescuentoDeEmpresa(2, 1)).toBe(false);
  });
});

describe("sincronizarDescuentosConMarcas", () => {
  const marcas = [
    { idMarca: 1, firmCode: 10, firmName: "Marca A", discountLimit: 20 },
    { idMarca: 2, firmCode: 20, firmName: "Marca B", discountLimit: 15 },
  ];

  it("crea una fila por marca y conserva el porcentaje ya capturado", () => {
    const actuales = [
      descuentoVacio({
        firmCode: 10,
        firmName: "Marca A",
        porcentaje: "8",
        idEmpresa: 1,
      }),
    ];

    const filas = sincronizarDescuentosConMarcas(actuales, marcas, 1);

    expect(filas).toHaveLength(2);
    expect(filas[0].porcentaje).toBe("8");
    expect(filas[0].idEmpresa).toBe(1);
    expect(filas[1].firmName).toBe("Marca B");
    expect(filas[1].porcentaje).toBe("");
  });

  it("conserva % de CRM aunque la fila no traiga idEmpresa (Codialub)", () => {
    const actuales = [
      descuentoVacio({
        firmCode: 10,
        firmName: "Marca A",
        porcentaje: "12",
      }),
    ];
    const filas = sincronizarDescuentosConMarcas(actuales, marcas, 1);
    expect(filas[0].porcentaje).toBe("12");
    expect(filas[0].idEmpresa).toBe(1);
  });
});

describe("payload y merge de descuentos por empresa", () => {
  it("arma el payload CRM solo con marcas de esa sociedad y % > 0", () => {
    const filas = [
      descuentoVacio({
        firmCode: 10,
        porcentaje: "12",
        discountLimit: 20,
        idEmpresa: 1,
      }),
      descuentoVacio({
        firmCode: 20,
        porcentaje: "0",
        discountLimit: 15,
        idEmpresa: 1,
      }),
      descuentoVacio({
        firmCode: 30,
        porcentaje: "9",
        discountLimit: 20,
        idEmpresa: 2,
      }),
    ];

    const payloadCodialub = armarPayloadDescuentoLocal(filas, {
      idCliente: 50,
      idEmpresa: 1,
      idSucursal: 3,
      idLeadOrigen: 9,
      idUsuario: 4,
    });

    expect(payloadCodialub.idEmpresa).toBe(1);
    expect(payloadCodialub.IdEmpresa).toBe(1);
    expect(payloadCodialub.type).toBe("C");
    expect(payloadCodialub.objType).toBe("4");
    expect(payloadCodialub.discRel).toBe("A");
    expect(payloadCodialub.detalles).toHaveLength(1);
    expect(payloadCodialub.detalles[0]).toMatchObject({
      objKey: "10",
      objType: "4",
      discount: 12,
      idEmpresa: 1,
      IdEmpresa: 1,
    });
    expect(typeof payloadCodialub.detalles[0].objKey).toBe("string");

    const payloadCodial = armarPayloadDescuentoLocal(filas, {
      idCliente: 50,
      idEmpresa: 2,
      idSucursal: 3,
      idLeadOrigen: 9,
      idUsuario: 4,
    });

    expect(payloadCodial.idEmpresa).toBe(2);
    expect(payloadCodial.IdEmpresa).toBe(2);
    expect(payloadCodial.detalles).toHaveLength(1);
    expect(payloadCodial.detalles[0]).toMatchObject({
      objKey: "30",
      discount: 9,
      idEmpresa: 2,
      IdEmpresa: 2,
    });
  });

  it("estampa idEmpresa 1 o 2 en cada detalle según el check, no el de la fila", () => {
    const payloadCodialub = armarPayloadDescuentoLocal(
      [
        descuentoVacio({
          firmCode: 10,
          porcentaje: "5",
          discountLimit: 20,
        }),
      ],
      { idCliente: 50, idEmpresa: 1, idSucursal: 3, idLeadOrigen: 9 },
    );
    expect(payloadCodialub.detalles[0].idEmpresa).toBe(1);
    expect(payloadCodialub.detalles[0].IdEmpresa).toBe(1);

    const payloadCodial = armarPayloadDescuentoLocal(
      [
        descuentoVacio({
          firmCode: 30,
          porcentaje: "6",
          discountLimit: 20,
          idEmpresa: 1,
        }),
      ],
      { idCliente: 50, idEmpresa: 2, idSucursal: 3, idLeadOrigen: 9 },
    );
    expect(payloadCodial.detalles).toHaveLength(0);

    const payloadCodialFilas = armarPayloadDescuentoLocal(
      [
        descuentoVacio({
          firmCode: 30,
          porcentaje: "6",
          discountLimit: 20,
          idEmpresa: 2,
        }),
      ],
      { idCliente: 50, idEmpresa: 2, idSucursal: 3, idLeadOrigen: 9 },
    );
    expect(payloadCodialFilas.detalles[0].idEmpresa).toBe(2);
  });

  it("al aplicar un documento de Codial no pisa las filas de Codialub", () => {
    const actuales = [
      descuentoVacio({
        firmCode: 10,
        porcentaje: "8",
        idEmpresa: 1,
      }),
    ];
    const docCodial: ClienteDescuentoApi = {
      idDescuento: 88,
      idCliente: 50,
      idEmpresa: 2,
      cardCode: "CC002899",
      absEntry: 0,
      type: "C",
      objType: "4",
      objCode: null,
      discRel: "A",
      validFor: "Y",
      estatusSync: "",
      fechaSync: "",
      errorSync: "",
      detalles: [
        {
          idDescuentoDetalle: 1,
          objType: "4",
          objKey: "30",
          discType: "D",
          discount: 5,
          payFor: 0,
          forFree: 0,
          upTo: 0,
        },
      ],
    };

    const merged = aplicarDescuentoApiAFilas(actuales, docCodial, 2);
    const codialub = merged.filter((d) => d.idEmpresa === 1);
    const codial = merged.filter((d) => d.idEmpresa === 2);

    expect(codialub).toHaveLength(1);
    expect(codialub[0].porcentaje).toBe("8");
    expect(codial).toHaveLength(1);
    expect(codial[0].ObjCode).toBe("30");
    expect(codial[0].idClienteDescuento).toBe(88);
  });

  it("al guardar Codial usa la empresa indicada aunque el API devuelva idEmpresa 1", () => {
    const actuales = [
      descuentoVacio({ firmCode: 10, porcentaje: "8", idEmpresa: 1 }),
    ];
    const savedCodial: ClienteDescuentoApi = {
      idDescuento: 90,
      idCliente: 50,
      idEmpresa: 1,
      cardCode: "CC002899",
      absEntry: 0,
      type: "C",
      objType: "4",
      objCode: null,
      discRel: "A",
      validFor: "Y",
      estatusSync: "",
      fechaSync: "",
      errorSync: "",
      detalles: [
        {
          idDescuentoDetalle: 2,
          objType: "4",
          objKey: "30",
          discType: "D",
          discount: 7,
          payFor: 0,
          forFree: 0,
          upTo: 0,
        },
      ],
    };

    const merged = aplicarDescuentoApiAFilas(actuales, savedCodial, 2);
    expect(merged.filter((d) => d.idEmpresa === 1)[0].porcentaje).toBe("8");
    expect(merged.filter((d) => d.idEmpresa === 2)[0].idClienteDescuento).toBe(
      90,
    );
    expect(merged.filter((d) => d.idEmpresa === 2)[0].porcentaje).toBe("7");
  });
});

describe("descuentoApiDesdeRaw", () => {
  it("lee objKey numérico y Detalles con $values (formato .NET)", () => {
    const doc = descuentoApiDesdeRaw({
      IdDescuento: 22,
      IdEmpresa: 2,
      CardCode: "CC002899",
      Detalles: {
        $values: [{ ObjKey: 30, Discount: 9 }],
      },
    });
    expect(doc.idDescuento).toBe(22);
    expect(doc.idEmpresa).toBe(2);
    expect(doc.detalles).toHaveLength(1);
    expect(doc.detalles[0].objKey).toBe("30");
    expect(doc.detalles[0].discount).toBe(9);
    expect(doc.detalles[0].idEmpresa).toBeNull();
  });

  it("lee idEmpresa de cada ClienteDescuentoDetalle", () => {
    const doc = descuentoApiDesdeRaw({
      IdDescuento: 22,
      Detalles: [
        { ObjKey: 10, Discount: 8, IdEmpresa: 1 },
        { ObjKey: 30, Discount: 9, IdEmpresa: 2 },
      ],
    });
    expect(doc.detalles.map((d) => d.idEmpresa)).toEqual([1, 2]);
  });

  it("infiere Codial por CardCode CC si no trae idEmpresa", () => {
    const doc = descuentoApiDesdeRaw({
      idDescuento: 8,
      cardCode: "CC002899",
      detalles: [{ objKey: "11", discount: 4 }],
    });
    expect(doc.idEmpresa).toBe(2);
  });
});

describe("partirDocumentosPorEmpresaDetalle", () => {
  it("separa líneas Codialub y Codial aunque vengan en el mismo documento", () => {
    const doc = descuentoApiDesdeRaw({
      idDescuento: 10,
      cardCode: "C002899",
      detalles: [
        { objKey: "10", discount: 8, idEmpresa: 1 },
        { objKey: "30", discount: 9, idEmpresa: 2 },
      ],
    });
    const partidos = partirDocumentosPorEmpresaDetalle([doc]);
    expect(partidos).toHaveLength(2);
    const e1 = partidos.find((d) => d.idEmpresa === 1);
    const e2 = partidos.find((d) => d.idEmpresa === 2);
    expect(e1?.detalles.map((x) => x.objKey)).toEqual(["10"]);
    expect(e2?.detalles.map((x) => x.objKey)).toEqual(["30"]);
  });

  it("si el detalle no trae idEmpresa, lo toma del catálogo de marcas", () => {
    const doc = descuentoApiDesdeRaw({
      idDescuento: 11,
      detalles: [{ objKey: "30", discount: 5 }],
    });
    const partidos = partirDocumentosPorEmpresaDetalle([doc], [
      { firmCode: 10, idEmpresa: 1 },
      { firmCode: 30, idEmpresa: 2 },
    ]);
    expect(partidos).toHaveLength(1);
    expect(partidos[0].idEmpresa).toBe(2);
    expect(partidos[0].detalles[0].idEmpresa).toBe(2);
  });
});

describe("extraerDocumentosDescuentoApi", () => {
  it("acepta un documento suelto, no solo un array", () => {
    const docs = extraerDocumentosDescuentoApi({
      idDescuento: 5,
      idEmpresa: 1,
      detalles: [{ objKey: "10", discount: 12 }],
    });
    expect(docs).toHaveLength(1);
  });

  it("no pierde un documento de Codial al fusionar con Codialub", () => {
    const fusionados = fusionarDocumentosDescuento([
      descuentoApiDesdeRaw({
        idDescuento: 1,
        idEmpresa: 1,
        cardCode: "C002899",
        detalles: [{ objKey: "10", discount: 8 }],
      }),
      descuentoApiDesdeRaw({
        idDescuento: 2,
        idEmpresa: 2,
        cardCode: "CC002899",
        detalles: [{ objKey: "30", discount: 9 }],
      }),
    ]);
    expect(fusionados.map((d) => d.idEmpresa).sort()).toEqual([1, 2]);
  });

  it("lee ClienteDescuentoDetalles y pinta idEmpresa del detalle", () => {
    const docs = extraerDocumentosDescuentoApi({
      IdClienteDescuento: 44,
      ClienteDescuentoDetalles: [
        { ObjKey: 10, Discount: 12, IdEmpresa: 1, IdDescuentoDetalle: 7 },
      ],
    }).map(descuentoApiDesdeRaw);
    expect(docs).toHaveLength(1);
    expect(docs[0].idDescuento).toBe(44);
    expect(docs[0].detalles[0]).toMatchObject({
      objKey: "10",
      discount: 12,
      idEmpresa: 1,
    });
    const filas = mergeDocumentosDescuentoAFilas(docs, [], 1);
    expect(filas.some((d) => d.porcentaje === "12" && d.idEmpresa === 1)).toBe(
      true,
    );
    expect(filas[0].idClienteDescuento).toBe(44);
  });

  it("agrupa líneas sueltas de detalle en un documento", () => {
    const docs = extraerDocumentosDescuentoApi([
      { idDescuento: 8, objKey: "10", discount: 12, idEmpresa: 1 },
      { idDescuento: 8, objKey: "20", discount: 5, idEmpresa: 1 },
    ]).map(descuentoApiDesdeRaw);
    expect(docs).toHaveLength(1);
    expect(docs[0].detalles).toHaveLength(2);
  });

  it("acepta wrapper data/items de .NET", () => {
    expect(
      extraerDocumentosDescuentoApi({
        data: [{ idDescuento: 1 }, { idDescuento: 2 }],
      }),
    ).toHaveLength(2);
  });
});

describe("mergeDocumentosDescuentoAFilas", () => {
  it("conserva Codialub si el GET solo trae el documento de Codial", () => {
    const actuales = [
      descuentoVacio({ firmCode: 10, porcentaje: "8", idEmpresa: 1 }),
    ];
    const docCodial: ClienteDescuentoApi = {
      idDescuento: 91,
      idCliente: 50,
      idEmpresa: 2,
      cardCode: "CC002899",
      absEntry: 0,
      type: "C",
      objType: "4",
      objCode: null,
      discRel: "A",
      validFor: "Y",
      estatusSync: "",
      fechaSync: "",
      errorSync: "",
      detalles: [
        {
          idDescuentoDetalle: 3,
          objType: "4",
          objKey: "20",
          discType: "D",
          discount: 4,
          payFor: 0,
          forFree: 0,
          upTo: 0,
        },
      ],
    };

    const merged = mergeDocumentosDescuentoAFilas([docCodial], actuales, 2);
    expect(merged.some((d) => d.idEmpresa === 1 && d.porcentaje === "8")).toBe(
      true,
    );
    expect(merged.some((d) => d.idEmpresa === 2 && d.porcentaje === "4")).toBe(
      true,
    );
  });
});
