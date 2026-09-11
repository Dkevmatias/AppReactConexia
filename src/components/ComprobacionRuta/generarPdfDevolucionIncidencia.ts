/**
 * Formato imprimible basado en:
 * Formatos/FORMATO DE DEVOLUCIONES.pdf
 *
 * Los valores se pasan en `DatosPdfDevolucionIncidencia`.
 * Ajusta el mapeo en el modal cuando confirmes de dónde sale cada campo.
 */

export const LOGO_DEVOLUCION_URL = "/images/logo/logocodlub_1.svg";

export type LineaPdfDevolucion = {
  codigoProveedor: string;
  cantidad: number | string;
  descripcion: string;
  /** Marca NC (nota de crédito) — suele ir vacío para marcar a mano. */
  nc?: boolean;
  /** Marca C — suele ir vacío para marcar a mano. */
  c?: boolean;
};

export type DatosPdfDevolucionIncidencia = {
  nombreCliente: string;
  folio: string;
  odistribucion: number;
  vendedor: string;
  fecha: string;
  ruta: string;
  noCuenta: string;
  productos: LineaPdfDevolucion[];
  /** Si no se envía, se calcula con la suma de cantidades. */
  totalArticulos?: number | string;
  importe?: string;
  observaciones: string;
  logoUrl?: string;
  /** Filas fijas del formato original (1–10). */
  filasTabla?: number;
};

function escapeHtml(value: string | number | null | undefined): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function totalDesdeProductos(productos: LineaPdfDevolucion[]): number {
  return productos.reduce((suma, p) => {
    const n = Number(p.cantidad);
    return suma + (Number.isFinite(n) ? n : 0);
  }, 0);
}

/**
 * Abre ventana imprimible con el formato de Devolución de producto físico.
 * Retorna false si el navegador bloqueó la ventana emergente.
 */
export function abrirPdfDevolucionIncidencia(
  datos: DatosPdfDevolucionIncidencia,
): boolean {
  const win = window.open("about:blank", "_blank");
  if (!win) return false;

  const filasFijas = Math.max(10, datos.filasTabla ?? 10);
  const productos = datos.productos ?? [];
  const totalArticulos = datos.totalArticulos ?? totalDesdeProductos(productos);
  const importe = (datos.importe ?? "").trim();
  const logoUrl = datos.logoUrl ?? LOGO_DEVOLUCION_URL;

  const filasHtml = Array.from({ length: filasFijas }, (_, i) => {
    const p = productos[i];
    const zebra = i % 2 === 1 ? "zebra" : "plain";
    return `
      <tr class="${zebra}">
        <td class="code">${escapeHtml(p?.codigoProveedor ?? "") || "&nbsp;"}</td>
        <td class="qty center">${escapeHtml(p?.cantidad ?? "") || "&nbsp;"}</td>
        <td class="desc">${escapeHtml(p?.descripcion ?? "") || "&nbsp;"}</td>
        <td class="mark center">${p?.nc ? "X" : "&nbsp;"}</td>
        <td class="mark center">${p?.c ? "X" : "&nbsp;"}</td>
      </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title >Devolución de producto físico — Folio ${escapeHtml(datos.folio)}</title>
  <style>
    @page { size: letter; margin: 12mm 12mm 14mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      font-size: 11px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet { width: 100%; max-width: 190mm; margin: 0 auto; }
    .header {
      position: relative;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      gap: 16px;
      margin-bottom: 14px;
    }
    .title {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.02em;
      line-height: 1.15;
      text-transform: uppercase;
      text-align: center;
    }
    .logo {
      height: 80px;
      width: auto;
      object-fit: contain;
    }
    .meta {
      width: 100%;
      border-collapse: separate;
      border-spacing: 10px 8px;
      margin: 0 0 10px;
    }
    .meta td { vertical-align: bottom; padding: 0; }
    .meta .label {
      display: block;
      text-align: center;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      margin-bottom: 3px;
      text-transform: uppercase;
    }
    .meta .box {
      min-height: 28px;
      border: 1.5px solid #222;
      background: #e8e8e8;
      padding: 5px 8px;
      font-size: 12px;
      font-weight: 600;
    }
    .section-label {
      text-align: center;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.06em;
      margin: 8px 0 6px;
      text-transform: uppercase;
    }
    table.prod {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    table.prod th,
    table.prod td {
      border: 1.25px solid #222;
      padding: 4px 5px;
      vertical-align: middle;
    }
    table.prod thead th {
      background: #5a5a5a;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      line-height: 1.2;
    }
    table.prod th.code,
    table.prod td.code { width: 16%; font-weight: 600; }
    table.prod th.qty,
    table.prod td.qty { width: 6%; }
    table.prod th.desc,
    table.prod td.desc {
      width: auto;
      font-size: 10px;
      line-height: 1.15;
      word-break: normal;
      overflow-wrap: anywhere;
    }
    table.prod th.mark,
    table.prod td.mark { width: 3.5%; padding: 2px 1px; }
    table.prod tbody tr.plain td {
      background: #ffffff !important;
      height: 22px;
    }
    table.prod tbody tr.zebra td {
      background: #d9d9d9 !important;
      height: 22px;
    }
    .totals {
      display: flex;
      justify-content: flex-end;
      gap: 18px;
      margin: 8px 0 12px;
      align-items: center;
    }
    .totals .item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 800;
      font-size: 12px;
      letter-spacing: 0.03em;
    }
    .totals .yellow {
      min-width: 88px;
      min-height: 26px;
      padding: 4px 8px;
      background: #ffe600;
      border: 1.5px solid #222;
      text-align: center;
      font-weight: 800;
    }
    .obs-head {
      background: #5a5a5a;
      color: #fff;
      text-align: center;
      font-weight: 800;
      letter-spacing: 0.08em;
      padding: 6px;
      border: 1.5px solid #222;
      border-bottom: none;
      text-transform: uppercase;
    }
    .obs-body {
      min-height: 72px;
      border: 1.5px solid #222;
      padding: 8px 10px;
      white-space: pre-wrap;
      font-size: 12px;
      margin-bottom: 28px;
    }
    .firmas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 8px;
    }
    .firma {
      text-align: center;
    }
    .firma .cap {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.04em;
      margin-bottom: 28px;
      text-transform: uppercase;
    }
    .firma .line {
      border-top: 1.5px solid #111;
      margin: 0 18px 6px;
    }
    .firma .sub {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <h1 class="title">Devolución de producto físico</h1>
      <img class="logo" src="${escapeHtml(logoUrl)}" alt="CODIALUB" />
    </div>

    <table class="meta">
      <tr>
        <td style="width:68%">
          <span class="label">Nombre del cliente</span>
          <div class="box">${escapeHtml(datos.nombreCliente)}</div>
        </td>
        <td style="width:32%">
          <span class="label">Folio</span>
          <div class="box">${escapeHtml(datos.folio)}</div>
        </td>
      </tr>
      <tr>
        <td>
          <span class="label">Vendedor</span>
          <div class="box">${escapeHtml(datos.vendedor)}</div>
        </td>
        <td>
          <span class="label">ODistribucion</span>
          <div class="box">${escapeHtml(datos.odistribucion)}</div>
        </td>
      </tr>
      <tr>
        <td>
          <span class="label">Ruta</span>
          <div class="box">${escapeHtml(datos.ruta)}</div>
        </td>
        <td>
          <span class="label">Fecha</span>
          <div class="box">${escapeHtml(datos.fecha)}</div>
        </td>
      </tr>
    </table>

    <div class="section-label">Productos devueltos</div>
    <table class="prod">
      <thead>
        <tr>
          <th class="code">Código de<br/>proveedor</th>
          <th class="qty">Cant.</th>
          <th class="desc">Descripción del producto</th>
          <th class="mark">NC</th>
          <th class="mark">C</th>
        </tr>
      </thead>
      <tbody>
        ${filasHtml}
      </tbody>
    </table>

    <div class="totals">
      <div class="item">
        <span>TOTAL DE ARTÍCULOS:</span>
        <span class="yellow">${escapeHtml(totalArticulos)}</span>
      </div>
      <div class="item">
        <span>IMPORTE:</span>
        <span class="yellow">${escapeHtml(importe)}</span>
      </div>
    </div>

    <div class="obs-head">Observaciones</div>
    <div class="obs-body">${escapeHtml(datos.observaciones)}</div>

    <div class="firmas">
      <div class="firma">
        <div class="cap">Entregó (repartidor)</div>
        <div class="line"></div>
        <div class="sub">Nombre y firma</div>
      </div>
      <div class="firma">
        <div class="cap">Recibió (almacén)</div>
        <div class="line"></div>
        <div class="sub">Nombre y firma</div>
      </div>
    </div>
  </div>
  <script>
    window.onload = function () {
      setTimeout(function () { window.print(); }, 250);
    };
  </script>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();
  return true;
}
