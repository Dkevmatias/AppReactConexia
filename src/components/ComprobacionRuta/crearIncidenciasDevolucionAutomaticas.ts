import type { DocODistribucionDetalle } from "../../services/oDistribucionService";
import { devolucionesService } from "../../services/devolucionesService";
import {
  ESTADO_ITEM_DEVOLUCION_DEFAULT,
  ESTATUS_INCIDENCIA_PENDIENTE,
  incidenciaService,
  OBSERVACIONES_INCIDENCIA_AUTOMATICA,
  TIPO_INCIDENCIA_DEVOLUCION,
} from "../../services/incidenciaService";
import { getReportesService } from "../../services/reportesService";
import { documentoTieneIncidencia } from "./utils";

export type ContextoIncidenciaDevolucionAuto = {
  idEmpresa: number;
  idSucursal: number;
  /** Fallback si no se resuelve idVendedor por slpName. */
  idUsuarioCreacionFallback: number;
};

/**
 * Crea incidencias tipo 7 para filas con DV- sin incidencia previa.
 * Retorna cuántas incidencias se crearon.
 */
export async function crearIncidenciasDevolucionAutomaticas(
  documentos: DocODistribucionDetalle[],
  ctx: ContextoIncidenciaDevolucionAuto,
): Promise<number> {
  const candidatos = documentos.filter(
    (doc) =>
      (doc.devolucionEntrega ?? 0) > 0 &&
      (doc.entrega ?? 0) > 0 &&
      (doc.folio ?? 0) > 0 &&
      !documentoTieneIncidencia(doc),
  );

  if (candidatos.length === 0) return 0;

  let vendedoresCache: Awaited<
    ReturnType<typeof getReportesService.getVendedoresReparto>
  > | null = null;

  const resolverIdUsuarioCreacion = async (
    slpName: string | null | undefined,
  ): Promise<number> => {
    const codigo = (slpName ?? "").trim();
    if (codigo) {
      if (!vendedoresCache) {
        vendedoresCache = await getReportesService.getVendedoresReparto(true);
      }
      const vendedor = vendedoresCache.find(
        (v) => (v.slpName ?? "").trim() === codigo,
      );
      if (vendedor && vendedor.idVendedor > 0) {
        return vendedor.idVendedor;
      }
    }
    return ctx.idUsuarioCreacionFallback;
  };

  let creadas = 0;

  for (const doc of candidatos) {
    const docNum = doc.devolucionEntrega!;
    const lineas = await devolucionesService.getByDocNum(docNum);
    if (lineas.length === 0) {
      console.warn(
        `[Devolución automática] Sin líneas para DV-${docNum}; se omite.`,
      );
      continue;
    }

    const idUsuarioCreacion = await resolverIdUsuarioCreacion(doc.slpName);
    if (!idUsuarioCreacion || idUsuarioCreacion <= 0) {
      throw new Error(
        `No se pudo resolver idUsuarioCreacion/idVendedor para la entrega ${doc.entrega}.`,
      );
    }

    const vendedor = (doc.slpName ?? "").trim();

    await incidenciaService.crearIncidencia({
      idTipoIncidencia: TIPO_INCIDENCIA_DEVOLUCION,
      idOrdenEntrega: doc.entrega,
      idODistribucion: doc.folio,
      idUsuarioCreacion,
      idEmpresa: ctx.idEmpresa,
      idSucursal: ctx.idSucursal,
      observaciones: OBSERVACIONES_INCIDENCIA_AUTOMATICA,
      estatus: ESTATUS_INCIDENCIA_PENDIENTE,
      activo: true,
      cardCode: doc.cardCode?.trim() || null,
      cardName: doc.cardName?.trim() || null,
      detalles: lineas.map((linea) => ({
        idOrdenEntrega: doc.entrega,
        itemCode: linea.itemCode,
        codigoProveedor: linea.codigoProveedor ?? "",
        itemName: linea.descripcion,
        cantidad: linea.quantity,
        idEstado: ESTADO_ITEM_DEVOLUCION_DEFAULT,
        vendedor,
        observaciones: OBSERVACIONES_INCIDENCIA_AUTOMATICA,
        estatus: ESTATUS_INCIDENCIA_PENDIENTE,
        activo: true,
      })),
    });

    creadas += 1;
  }

  return creadas;
}
