import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatCurrency } from "../../utils/format";
import type { CotizadorCanastaItem } from "../../services/cotizadorService";

/** Banner / encabezado del PDF de cotización (public/). */
export const LOGO_COTIZACION_URL = "/images/logo/CodialubCotizacion.png";

type ImagenHeaderPdf = {
  dataUrl: string;
  widthPx: number;
  heightPx: number;
  format: "JPEG" | "PNG";
};

/** Solo cachea cargas exitosas (no bloquea reintentos si falló antes). */
let cacheHeaderCotizacion: ImagenHeaderPdf | null = null;

function resolverUrlLogoCotizacion(): string {
  const base = import.meta.env.BASE_URL || "/";
  const path = "images/logo/CodialubCotizacion.png";
  if (/^https?:\/\//i.test(base)) {
    return new URL(path, base.endsWith("/") ? base : `${base}/`).href;
  }
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return `${prefix}${path}`.replace(/\/{2,}/g, "/").replace(/^\/+/, "/");
}

/**
 * Carga el logo, lo rasteriza en canvas y exporta JPEG
 * (más compatible con jsPDF que PNG grandes / especiales).
 */
async function cargarImagenHeaderCotizacion(): Promise<ImagenHeaderPdf | null> {
  if (cacheHeaderCotizacion) return cacheHeaderCotizacion;

  const url = resolverUrlLogoCotizacion();

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.decoding = "async";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`No se pudo cargar el logo: ${url}`));
      el.src = `${url}${url.includes("?") ? "&" : "?"}v=1`;
    });

    const maxW = 1400;
    const scale = Math.min(1, maxW / Math.max(1, img.naturalWidth));
    const widthPx = Math.max(1, Math.round(img.naturalWidth * scale));
    const heightPx = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas no disponible");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, widthPx, heightPx);
    ctx.drawImage(img, 0, 0, widthPx, heightPx);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    if (!dataUrl.startsWith("data:image/jpeg")) {
      throw new Error("No se pudo convertir el logo a JPEG");
    }

    cacheHeaderCotizacion = {
      dataUrl,
      widthPx,
      heightPx,
      format: "JPEG",
    };
    return cacheHeaderCotizacion;
  } catch (err) {
    console.warn("[Cotizacion PDF] No se cargó el encabezado:", err);
    return null;
  }
}

/** Encabezado de empresa fijo hasta existir endpoint de datos de empresa. */
export const EMPRESA_COTIZACION_FIJA = {
  razonSocial: "CODIALUB S.A.P.I. DE C.V.",
  rfc: "COD1606073H5",
  direccion: "CALZADA EL PENCIL NO.803, COL. SANTA MARIA LA RIBERA",
  ciudadEstado: "TUXTLA GUTIERREZ, CHIAPAS",
  regimenFiscal: "Régimen General de Ley Personas Morales",
  lugarExpedicion: "30362",
};

export type DatosClienteCotizacion = {
  nombre: string;
  cardCode?: string | null;
  entregarEn: string;
  ordenCompra?: string | null;
  vendedor?: string | null;
};

export type DatosPdfCotizacion = {
  folio: string;
  fechaEmision: string;
  cliente: DatosClienteCotizacion;
  items: CotizadorCanastaItem[];
  /** Porcentaje IVA, ej. 16 */
  ivaPorcentaje: number;
  observaciones?: string | null;
  /**
   * Sucursal del vendedor (contexto operativo).
   * 1 Tuxtla · 2 Arriaga · 3 Tapachula · 4 Espinal · 5 Comitán
   */
  idSucursal?: number | null;
};

/** Datos de aviso de pago por sucursal (equivalente a fórmula Crystal Report). */
type AvisoPagoSucursal = {
  cuentas: string;
  comprobante: string;
};

/**
 * 1 Tuxtla · 2 Arriaga · 3 Tapachula · 4 Espinal · 5 Comitán
 */
const AVISO_PAGO_POR_ID_SUCURSAL: Record<number, AvisoPagoSucursal> = {
  1: {
    cuentas:
      "BBVA = 0110891525   Banamex = 7011587900    Banco Azteca = 01720137714324",
    comprobante: "creditoycobranza@codialub.com  Tel. 961 215 3314",
  },
  2: {
    cuentas: "BBVA = 0117154658    Banco Azteca = 01720137714324",
    comprobante: "jefaturacomitan@codialub.com  Tel. 966  664 0126",
  },
  3: {
    cuentas: "BBVA = 0110892262    Banco Azteca = 01720137714324",
    comprobante: "jefaturatapachula@codialub.com  Tel. 962 121 8865",
  },
  4: {
    cuentas: "BBVA = 0110892203    Banco Azteca = 01720137714324",
    comprobante: "jefaturaespinal@codialub.com  Tel. 971 116 5434",
  },
  5: {
    cuentas: "BBVA = 0117154658    Banco Azteca = 01720137714324",
    comprobante: "jefaturacomitan@codialub.com  Tel. 963 159 9127",
  },
};

/** Construye las líneas del aviso de pago según idSucursal. */
export function avisoPagoLinesPorSucursal(
  idSucursal?: number | null,
): string[] {
  const aviso =
    (idSucursal != null && AVISO_PAGO_POR_ID_SUCURSAL[idSucursal]) ||
    AVISO_PAGO_POR_ID_SUCURSAL[1];

  return [
    "AGRADECEMOS SU PAGO A:",
    aviso.cuentas,
    "",
    "FAVOR DE ENVIAR SU COMPROBANTE DE PAGO A :",
    aviso.comprobante,
    "",
    "***PRECIOS SUJETOS A CAMBIO SIN PREVIO AVISO. VIGENCIA AL",
    "TEMINO DE MES.",
  ];
}

export type ResultadoWhatsAppCotizacion = {
  ok: boolean;
  mode?: "share" | "wa-link";
  error?: string;
};

function formatMoneyMx(valor: number): string {
  return formatCurrency(valor).replace("$", "").trim() + " MXN";
}

function formatMoneySimple(valor: number): string {
  return formatCurrency(valor).replace("$", "").trim();
}

const UNIDADES = [
  "",
  "UN",
  "DOS",
  "TRES",
  "CUATRO",
  "CINCO",
  "SEIS",
  "SIETE",
  "OCHO",
  "NUEVE",
  "DIEZ",
  "ONCE",
  "DOCE",
  "TRECE",
  "CATORCE",
  "QUINCE",
  "DIECISEIS",
  "DIECISIETE",
  "DIECIOCHO",
  "DIECINUEVE",
  "VEINTE",
  "VEINTIUNO",
  "VEINTIDOS",
  "VEINTITRES",
  "VEINTICUATRO",
  "VEINTICINCO",
  "VEINTISEIS",
  "VEINTISIETE",
  "VEINTIOCHO",
  "VEINTINUEVE",
];

const DECENAS = [
  "",
  "",
  "VEINTE",
  "TREINTA",
  "CUARENTA",
  "CINCUENTA",
  "SESENTA",
  "SETENTA",
  "OCHENTA",
  "NOVENTA",
];

const CENTENAS = [
  "",
  "CIENTO",
  "DOSCIENTOS",
  "TRESCIENTOS",
  "CUATROCIENTOS",
  "QUINIENTOS",
  "SEISCIENTOS",
  "SETECIENTOS",
  "OCHOCIENTOS",
  "NOVECIENTOS",
];

function seccionCentenas(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "CIEN";
  if (n < 30) return UNIDADES[n];
  if (n < 100) {
    const d = Math.floor(n / 10);
    const u = n % 10;
    if (u === 0) return DECENAS[d];
    return `${DECENAS[d]} Y ${UNIDADES[u]}`;
  }
  const c = Math.floor(n / 100);
  const resto = n % 100;
  if (resto === 0) return CENTENAS[c].replace("CIENTO", "CIEN");
  return `${CENTENAS[c]} ${seccionCentenas(resto)}`.trim();
}

/** Convierte monto a texto en español (MXN). */
export function numeroALetrasMx(monto: number): string {
  const total = Math.round((Number.isFinite(monto) ? monto : 0) * 100) / 100;
  const entero = Math.floor(total);
  const centavos = Math.round((total - entero) * 100);
  const centavosTxt = String(centavos).padStart(2, "0");

  if (entero === 0) {
    return `CERO PESOS CON ${centavosTxt}/100 M.N.`;
  }

  const millones = Math.floor(entero / 1_000_000);
  const miles = Math.floor((entero % 1_000_000) / 1000);
  const resto = entero % 1000;

  const partes: string[] = [];
  if (millones > 0) {
    partes.push(
      millones === 1 ? "UN MILLON" : `${seccionCentenas(millones)} MILLONES`,
    );
  }
  if (miles > 0) {
    partes.push(miles === 1 ? "MIL" : `${seccionCentenas(miles)} MIL`);
  }
  if (resto > 0) {
    partes.push(seccionCentenas(resto));
  }

  return `${partes.join(" ").trim()} PESOS CON ${centavosTxt}/100 M.N.`;
}

function calcularTotales(datos: DatosPdfCotizacion) {
  const subtotal = datos.items.reduce((s, i) => s + (i.importe || 0), 0);
  const ivaPct = Number.isFinite(datos.ivaPorcentaje)
    ? Math.max(0, datos.ivaPorcentaje)
    : 16;
  const iva = subtotal * (ivaPct / 100);
  const total = subtotal + iva;
  return { subtotal, ivaPct, iva, total };
}

function drawWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

/**
 * Genera un PDF real (jsPDF) con el formato de cotización.
 */
export async function crearDocPdfCotizacion(
  datos: DatosPdfCotizacion,
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 10;
  const contentW = pageW - marginX * 2;
  const emp = EMPRESA_COTIZACION_FIJA;
  const cliente = datos.cliente;
  const { subtotal, ivaPct, iva, total } = calcularTotales(datos);

  let y = 8;

  // —— Logo alineado a la izquierda, arriba del nombre de empresa ——
  const headerImg = await cargarImagenHeaderCotizacion();
  if (headerImg && headerImg.widthPx > 0 && headerImg.heightPx > 0) {
    const maxHeaderH = 22;
    const maxHeaderW = contentW * 0.55; // misma columna que la empresa
    const ratio = headerImg.widthPx / headerImg.heightPx;
    let imgW = maxHeaderW;
    let imgH = imgW / ratio;
    if (imgH > maxHeaderH) {
      imgH = maxHeaderH;
      imgW = imgH * ratio;
    }
    doc.addImage(headerImg.dataUrl, headerImg.format, marginX, y, imgW, imgH);
    y += imgH + 3;
  }

  const headerTopY = y;

  // —— Empresa (izquierda) ——
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(emp.razonSocial, marginX, y);
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`R.F.C. ${emp.rfc}`, marginX, y);
  y += 3.5;
  y = drawWrappedText(doc, emp.direccion, marginX, y, contentW * 0.55, 3.5);
  doc.text(emp.ciudadEstado, marginX, y);
  y += 3.5;
  doc.text(`Régimen Fiscal: ${emp.regimenFiscal}`, marginX, y);
  y += 3.5;
  doc.text(`Lugar de Expedición: ${emp.lugarExpedicion}`, marginX, y);

  // —— Cliente (derecha) ——
  const boxX = marginX + contentW * 0.58;
  const boxW = contentW * 0.42;
  const boxY = headerTopY - 2;
  let boxInnerY = boxY + 5;
  doc.setDrawColor(30);
  doc.rect(boxX, boxY, boxW, 38);

  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text("CLIENTE", boxX + 2, boxInnerY);
  boxInnerY += 4;
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  boxInnerY = drawWrappedText(
    doc,
    cliente.nombre || "—",
    boxX + 2,
    boxInnerY,
    boxW - 4,
    3.5,
  );
  if (cliente.cardCode) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(String(cliente.cardCode), boxX + 2, boxInnerY);
    boxInnerY += 3.5;
  }
  doc.setFontSize(7);
  doc.setTextColor(80);
  doc.text("ENTREGAR EN:", boxX + 2, boxInnerY);
  boxInnerY += 3.5;
  doc.setTextColor(0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  boxInnerY = drawWrappedText(
    doc,
    cliente.entregarEn || "—",
    boxX + 2,
    boxInnerY,
    boxW - 4,
    3.2,
  );
  doc.setFontSize(7);
  doc.text(
    `OC: ${cliente.ordenCompra || "—"}  |  Vend: ${cliente.vendedor || "—"}`,
    boxX + 2,
    Math.min(boxInnerY, boxY + 36),
  );

  y = Math.max(y + 6, boxY + 42);

  // —— Título / folio / fecha ——
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("COTIZACIÓN", marginX, y);
  doc.setFontSize(12);
  doc.rect(marginX + 42, y - 5, 42, 7);
  doc.text(datos.folio, marginX + 44, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Fecha de emisión", pageW - marginX, y - 4, { align: "right" });
  doc.setFont("helvetica", "bold");
  doc.text(datos.fechaEmision, pageW - marginX, y + 1, { align: "right" });
  y += 6;

  // —— Tabla de artículos ——
  const body = datos.items.map((item) => [
    item.cantidad.toFixed(2),
    item.codigo?.trim() || "—",
    item.codigoCodialub?.trim() || "—",
    item.unidad?.trim() || "—",
    item.descripcion?.trim() || "—",
    formatMoneySimple(item.precioLista),
    formatMoneySimple(item.importe),
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Cantidad",
        "Clave Prov.",
        "Clave",
        "Unidad",
        "Descripción",
        "Valor Unitario",
        "Importe",
      ],
    ],
    body: body.length
      ? body
      : [["—", "—", "—", "—", "Sin artículos", "—", "—"]],
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 7,
      cellPadding: 1.2,
      valign: "top",
      textColor: 20,
      lineColor: 60,
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [239, 239, 239],
      textColor: 20,
      fontStyle: "bold",
      fontSize: 7,
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 16, halign: "center" },
      1: { cellWidth: 22, halign: "center" },
      2: { cellWidth: 22, halign: "center" },
      3: { cellWidth: 16, halign: "center" },
      4: { cellWidth: "auto" },
      5: { cellWidth: 24, halign: "right" },
      6: { cellWidth: 24, halign: "right" },
    },
    margin: { left: marginX, right: marginX },
  });

  // jspdf-autotable adjunta lastAutoTable al documento
  const lastTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  y = lastTable?.finalY ?? y + 10;
  y += 4;

  const avisoW = contentW * 0.58;
  const totalesW = contentW * 0.4;
  const totalesX = pageW - marginX - totalesW;

  // Aviso de pago (cuentas / correo según idSucursal)
  const avisoRaw = avisoPagoLinesPorSucursal(datos.idSucursal);
  doc.setFontSize(7);
  const avisoMaxW = avisoW - 4;
  const avisoDrawn: { text: string; bold: boolean }[] = [];
  avisoRaw.forEach((line, idx) => {
    const bold = idx === 0;
    if (!line) {
      avisoDrawn.push({ text: "", bold: false });
      return;
    }
    const wrapped = doc.splitTextToSize(line, avisoMaxW) as string[];
    wrapped.forEach((w, wi) => {
      avisoDrawn.push({ text: w, bold: bold && wi === 0 });
    });
  });
  const avisoH = 4 + avisoDrawn.length * 3.2;
  doc.rect(marginX, y, avisoW, avisoH);
  let ay = y + 4;
  avisoDrawn.forEach(({ text, bold }) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    if (text) doc.text(text, marginX + 2, ay);
    ay += 3.2;
  });

  // Totales
  const rowH = 7;
  const totals = [
    ["SUBTOTAL", formatMoneyMx(subtotal)],
    [`IVA ${ivaPct}%`, formatMoneyMx(iva)],
    ["TOTAL", formatMoneyMx(total)],
  ];
  totals.forEach((row, i) => {
    const ty = y + i * rowH;
    if (i === 2) doc.setFillColor(243, 244, 246);
    else doc.setFillColor(255, 255, 255);
    doc.rect(totalesX, ty, totalesW, rowH, "FD");
    doc.setFont("helvetica", i === 2 ? "bold" : "normal");
    doc.setFontSize(i === 2 ? 9 : 8);
    doc.text(row[0], totalesX + 2, ty + 4.5);
    doc.text(row[1], totalesX + totalesW - 2, ty + 4.5, { align: "right" });
  });

  y = Math.max(y + avisoH, y + totals.length * rowH) + 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  const letras = doc.splitTextToSize(
    numeroALetrasMx(total),
    contentW,
  ) as string[];
  doc.text(letras, marginX, y);
  y += letras.length * 3.5 + 4;

  // Observaciones / moneda
  const half = (contentW - 4) / 2;
  const boxH = 18;
  doc.rect(marginX, y, half, boxH);
  doc.rect(marginX + half + 4, y, half, boxH);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.text("OBSERVACIONES:", marginX + 2, y + 4);
  doc.setFont("helvetica", "normal");
  drawWrappedText(
    doc,
    datos.observaciones || "",
    marginX + 2,
    y + 8,
    half - 4,
    3,
  );
  doc.setFont("helvetica", "normal");
  doc.text("Moneda / Tipo de cambio: MXN / 1.00", marginX + half + 6, y + 6);
  doc.text("Condiciones: Contado", marginX + half + 6, y + 11);

  y += boxH + 18;
  const firmaW = half;
  doc.setDrawColor(0);
  doc.line(marginX + 10, y, marginX + firmaW - 10, y);
  doc.line(marginX + half + 14, y, pageW - marginX - 10, y);
  doc.setFontSize(8);
  doc.text("ORDENÓ", marginX + firmaW / 2, y + 5, { align: "center" });
  doc.text("ENTREGÓ", marginX + half + 4 + firmaW / 2, y + 5, {
    align: "center",
  });

  return doc;
}

export async function crearBlobPdfCotizacion(
  datos: DatosPdfCotizacion,
): Promise<Blob> {
  const doc = await crearDocPdfCotizacion(datos);
  return doc.output("blob");
}

export function nombreArchivoCotizacion(folio: string): string {
  const safe = (folio.trim() || "sin_folio").replace(/[^\w.-]+/g, "_");
  return `Cotizacion-${safe}.pdf`;
}

export function descargarBlobPdf(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/**
 * Abre el PDF en una pestaña nueva (o descarga si el popup está bloqueado).
 */
export async function abrirPdfCotizacion(
  datos: DatosPdfCotizacion,
): Promise<boolean> {
  const blob = await crearBlobPdfCotizacion(datos);
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    descargarBlobPdf(blob, nombreArchivoCotizacion(datos.folio));
    URL.revokeObjectURL(url);
    return false;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}

export async function descargarPdfCotizacion(
  datos: DatosPdfCotizacion,
): Promise<void> {
  const blob = await crearBlobPdfCotizacion(datos);
  descargarBlobPdf(blob, nombreArchivoCotizacion(datos.folio));
}

/**
 * Normaliza teléfono a dígitos internacionales.
 * 10 dígitos → asume México (+52).
 */
export function normalizarTelefonoWhatsApp(
  raw: string,
  defaultCountry = "52",
): string | null {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.length === 10) digits = `${defaultCountry}${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) {
    // possible US; leave as-is
  }
  if (digits.length < 11 || digits.length > 15) return null;
  return digits;
}

export function urlWhatsAppMensaje(
  telefonoE164: string,
  mensaje: string,
): string {
  return `https://wa.me/${telefonoE164}?text=${encodeURIComponent(mensaje)}`;
}

function mensajeWhatsAppCotizacion(datos: DatosPdfCotizacion): string {
  const { total } = calcularTotales(datos);
  const folioTxt = datos.folio.trim()
    ? `cotización ${datos.folio}`
    : "cotización";
  return [
    `Hola, le compartimos la ${folioTxt}.`,
    `Cliente: ${datos.cliente.nombre}`,
    `Total: ${formatMoneyMx(total)}`,
    "",
    "Adjunto el PDF de la cotización. ¡Gracias!",
  ].join("\n");
}

/**
 * Descarga/comparte el PDF y abre WhatsApp (Web o app) con el número indicado.
 * En móvil intenta Web Share API con el archivo; si no, descarga + wa.me.
 */
export async function enviarCotizacionPorWhatsApp(
  datos: DatosPdfCotizacion,
  telefonoRaw: string,
): Promise<ResultadoWhatsAppCotizacion> {
  const telefono = normalizarTelefonoWhatsApp(telefonoRaw);
  if (!telefono) {
    return {
      ok: false,
      error:
        "Teléfono inválido. Usa 10 dígitos (México) o con código de país, ej. 9711165434 o 529711165434.",
    };
  }

  const blob = await crearBlobPdfCotizacion(datos);
  const fileName = nombreArchivoCotizacion(datos.folio);
  const mensaje = mensajeWhatsAppCotizacion(datos);
  const file = new File([blob], fileName, { type: "application/pdf" });

  const canShareFiles =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    navigator.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      await navigator.share({
        files: [file],
        title: `Cotización ${datos.folio}`,
        text: mensaje,
      });
      return { ok: true, mode: "share" };
    } catch (err) {
      // Usuario canceló el share → no forzar WhatsApp
      if (err instanceof DOMException && err.name === "AbortError") {
        return { ok: false, error: "Envío cancelado." };
      }
      // Continúa con fallback wa.me
    }
  }

  descargarBlobPdf(blob, fileName);
  const waUrl = urlWhatsAppMensaje(telefono, mensaje);
  const win = window.open(waUrl, "_blank");
  if (!win) {
    window.location.href = waUrl;
  }

  return { ok: true, mode: "wa-link" };
}

export function folioCotizacionTemporal(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const n = String(now.getTime()).slice(-5);
  return `${y}${m}${d}-${n}`;
}

export function fechaEmisionCotizacion(fecha = new Date()): string {
  return fecha.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
