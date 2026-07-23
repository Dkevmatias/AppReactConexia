import type { DocODistribucionDetalle } from "../../services/oDistribucionService";
import { formatCurrency } from "../../utils/format";

/** Placeholder: sustituir cuando agregues la imagen definitiva del encabezado. */
export const LOGO_CORTE_RUTA_URL = "/images/logo/logocodlub_1.svg";

export type DatosPdfCorteRuta = {
  folio: number;
  fechaCorte: string;
  ruta: string;
  recibe: string;
  entrega: string;
  observaciones: string;
  documentos: DocODistribucionDetalle[];
  logoUrl?: string;
};

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function filaTabla(
  docs: DocODistribucionDetalle[],
  montoDe: (doc: DocODistribucionDetalle) => number,
): string {
  if (docs.length === 0) {
    return `<tr><td colspan="3" class="empty">Sin documentos</td></tr>`;
  }
  return docs
    .map(
      (doc) => `
      <tr>
        <td class="center">${escapeHtml(doc.entrega || "—")}</td>
        <td class="money">${escapeHtml(formatCurrency(montoDe(doc)))}</td>
        <td class="center">${escapeHtml(doc.tipoCliente?.trim() || "—")}</td>
      </tr>`,
    )
    .join("");
}

/**
 * Abre una ventana imprimible con el formato de Recepción de Cobranza de Ruta.
 * Retorna false si el navegador bloqueó la ventana emergente.
 */
export function abrirPdfCorteRuta(datos: DatosPdfCorteRuta): boolean {
  const win = window.open("about:blank", "_blank");
  if (!win) return false;

  const docs = [...datos.documentos].sort(
    (a, b) => (a.entrega ?? 0) - (b.entrega ?? 0),
  );
  const docsEfectivo = docs.filter((d) => (d.efectivo || 0) > 0);
  const docsTransferencia = docs.filter((d) => (d.transferencia || 0) > 0);
  const hayTransferencia = docsTransferencia.length > 0;
  const totalEfectivo = docsEfectivo.reduce((s, d) => s + (d.efectivo || 0), 0);
  const totalTransferencia = docsTransferencia.reduce(
    (s, d) => s + (d.transferencia || 0),
    0,
  );
  const totalGeneral = totalEfectivo + totalTransferencia;
  const logoUrl = datos.logoUrl ?? LOGO_CORTE_RUTA_URL;

  const tablaEfectivoHtml = `
      <div class="table-wrap">
        <h2>Efectivo</h2>
        <table class="corte">
          <thead>
            <tr>
              <th>Orden entrega</th>
              <th>Total orden entrega</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            ${filaTabla(docsEfectivo, (d) => d.efectivo || 0)}
          </tbody>
          <tfoot>
            <tr>
              <td class="center">TOTAL</td>
              <td class="money">${escapeHtml(formatCurrency(totalEfectivo))}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>`;

  const tablaTransferenciaHtml = hayTransferencia
    ? `
      <div class="table-wrap">
        <h2>Transferencias</h2>
        <table class="corte">
          <thead>
            <tr>
              <th>Orden entrega</th>
              <th>Total orden entrega</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            ${filaTabla(docsTransferencia, (d) => d.transferencia || 0)}
          </tbody>
          <tfoot>
            <tr>
              <td class="center">TOTAL</td>
              <td class="money">${escapeHtml(formatCurrency(totalTransferencia))}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Recepción de Cobranza de Ruta — Folio ${escapeHtml(datos.folio)}</title>
  <style>
    @page {
      size: letter portrait;
      margin: 0.5in;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #111;
      background: #d4d4d4;
    }
    /* Vista previa en pantalla a tamaño carta (8.5 x 11 in) */
    .sheet {
      width: 8.5in;
      min-height: 11in;
      margin: 0.35in auto 0.6in;
      padding: 0.45in 0.5in;
      background: #fff;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
    }
    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      border-bottom: 1.5px solid #222;
      padding-bottom: 6px;
      margin-bottom: 10px;
    }
    .title-row h1 {
      margin: 0;
      font-size: 13pt;
      font-weight: 700;
      letter-spacing: 0.01em;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .logo-box {
      width: 1.6in;
      height: 0.55in;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed #999;
      flex-shrink: 0;
      overflow: hidden;
    }
    .logo-box img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 18px;
      margin-bottom: 10px;
      font-size: 9pt;
    }
    .meta-col {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .meta-line {
      display: flex;
      gap: 5px;
      align-items: baseline;
    }
    .meta-line .lbl {
      font-weight: 700;
      min-width: 92px;
    }
    .meta-line .val {
      flex: 1;
      border-bottom: 1px solid #333;
      min-height: 14px;
      padding: 0 3px 1px;
    }
    .tables {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      align-items: start;
      margin-bottom: 10px;
    }
    .tables.tables-unica {
      grid-template-columns: 1fr;
      max-width: 100%;
    }
    .total-general {
      margin: 4px 0 10px;
      font-size: 11pt;
      font-weight: 700;
      text-align: right;
    }
    .total-general .monto {
      margin-left: 8px;
    }
    .table-wrap h2 {
      margin: 0 0 4px;
      font-size: 9pt;
      text-align: center;
      text-transform: uppercase;
    }
    table.corte {
      width: 100%;
      border-collapse: collapse;
      font-size: 8pt;
    }
    table.corte th,
    table.corte td {
      border: 1px solid #333;
      padding: 2px 4px;
      vertical-align: middle;
    }
    table.corte th {
      background: #efefef;
      font-size: 7.5pt;
      text-transform: uppercase;
    }
    table.corte .center { text-align: center; }
    table.corte .money { text-align: right; white-space: nowrap; }
    table.corte .empty { text-align: center; color: #666; padding: 6px; }
    table.corte tfoot td {
      font-weight: 700;
      background: #f7f7f7;
    }
    .obs {
      margin-bottom: 14px;
      font-size: 9pt;
    }
    .obs .lbl {
      font-weight: 700;
      margin-bottom: 3px;
    }
    .obs .box {
      min-height: 0.7in;
      border: 1px solid #333;
      padding: 5px 6px;
      white-space: pre-wrap;
      font-size: 8.5pt;
    }
    .firmas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.7in;
      margin-top: 0.45in;
      page-break-inside: avoid;
    }
    .firma {
      text-align: center;
    }
    .firma .line {
      border-top: 1px solid #111;
      margin: 0.55in 0.2in 4px;
    }
    .firma .name {
      font-weight: 700;
      text-transform: none;
      font-size: 9pt;
    }
    .firma .persona {
      margin-top: 2px;
      font-size: 8.5pt;
      font-weight: 400;
      text-transform: uppercase;
      min-height: 1.1em;
    }
    .print-bar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      justify-content: center;
      gap: 8px;
      padding: 10px;
      background: #f3f4f6;
      border-bottom: 1px solid #ccc;
    }
    .print-bar button {
      min-height: 36px;
      padding: 0 14px;
      border-radius: 6px;
      border: 1px solid #1e40af;
      background: #1d4ed8;
      color: #fff;
      font-weight: 600;
      cursor: pointer;
    }
    .print-hint {
      font-size: 12px;
      color: #555;
      align-self: center;
    }
    @media print {
      body { background: #fff; }
      .print-bar { display: none !important; }
      .sheet {
        width: auto;
        min-height: auto;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span class="print-hint">Vista tamaño carta · al imprimir use Letter / Carta</span>
    <button type="button" onclick="window.print()">Imprimir / Guardar PDF</button>
  </div>
  <div class="sheet">
    <div class="title-row">
      <h1>Recepción de Cobranza de Ruta</h1>
      <div class="logo-box">
        <img src="${escapeHtml(logoUrl)}" alt="Logo" onerror="this.style.display='none'" />
      </div>
    </div>

    <div class="meta">
      <div class="meta-col">
        <div class="meta-line">
          <span class="lbl">Fecha:</span>
          <span class="val">${escapeHtml(datos.fechaCorte)}</span>
        </div>
        <div class="meta-line">
          <span class="lbl">Ruta:</span>
          <span class="val">${escapeHtml(datos.ruta || "—")}</span>
        </div>
        <div class="meta-line">
          <span class="lbl">O. Distribución:</span>
          <span class="val">${escapeHtml(datos.folio || "—")}</span>
        </div>
      </div>
      <div class="meta-col">
        <div class="meta-line">
          <span class="lbl">Recibe:</span>
          <span class="val">${escapeHtml((datos.recibe || "—").toUpperCase())}</span>
        </div>
        <div class="meta-line">
          <span class="lbl">Entrega:</span>
          <span class="val">${escapeHtml((datos.entrega || "—").toUpperCase())}</span>
        </div>
      </div>
    </div>

    <div class="tables${hayTransferencia ? "" : " tables-unica"}">
      ${tablaEfectivoHtml}
      ${tablaTransferenciaHtml}
    </div>

    <div class="total-general">
      Total:
      <span class="monto">${escapeHtml(formatCurrency(totalGeneral))}</span>
    </div>

    <div class="obs">
      <div class="lbl">Observaciones</div>
      <div class="box">${escapeHtml(datos.observaciones) || "&nbsp;"}</div>
    </div>

    <div class="firmas">
      <div class="firma">
        <div class="line"></div>
        <div class="name">Entregó</div>
        <div class="persona">${escapeHtml((datos.entrega || "—").toUpperCase())}</div>
      </div>
      <div class="firma">
        <div class="line"></div>
        <div class="name">Recibió</div>
        <div class="persona">${escapeHtml((datos.recibe || "—").toUpperCase())}</div>
      </div>
    </div>
  </div>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  return true;
}
