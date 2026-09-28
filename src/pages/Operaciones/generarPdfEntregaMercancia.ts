import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const LOGO_ENTREGA_MERCANCIA_URL = "/images/logo/logoReportes.png";

export type LineaPdfEntregaMercancia = {
  itemCode: string;
  codigoProveedor: string;
  descripcion: string;
  almacen: string;
  cantidad: number;
  enviada: number;
};

export type DatosPdfEntregaMercancia = {
  /** idTraspaso (PK) */
  folio: string | number;
  /** FolioRetail / DocNum del documento origen */
  docNum: string | number;
  fecha: string;
  cliente: string;
  operador: string;
  lineas: LineaPdfEntregaMercancia[];
};

type ImagenHeaderPdf = {
  dataUrl: string;
  widthPx: number;
  heightPx: number;
  format: "JPEG" | "PNG";
};

let cacheLogoEntrega: ImagenHeaderPdf | null = null;

function resolverUrlLogo(): string {
  const base = (import.meta.env.BASE_URL || "/").replace(/\/?$/, "/");
  return `${base}images/logo/logoReportes.png`.replace(/([^:]\/)\/+/g, "$1");
}

/**
 * Carga el logo, lo rasteriza en canvas y exporta JPEG
 * (más compatible con jsPDF que PNG grandes / especiales).
 */
async function cargarLogoEntregaMercancia(): Promise<ImagenHeaderPdf | null> {
  if (cacheLogoEntrega) return cacheLogoEntrega;

  const url = resolverUrlLogo();
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.decoding = "async";
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`No se pudo cargar el logo: ${url}`));
      el.src = `${url}${url.includes("?") ? "&" : "?"}v=1`;
    });

    const maxW = 900;
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

    cacheLogoEntrega = {
      dataUrl,
      widthPx,
      heightPx,
      format: "JPEG",
    };
    return cacheLogoEntrega;
  } catch (err) {
    console.warn("[Entrega Mercancía PDF] No se cargó el logo:", err);
    return null;
  }
}

function formatFechaEs(value: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Genera PDF "Entrega Mercancía" y lo abre en una pestaña nueva.
 */
export async function generarPdfEntregaMercancia(
  datos: DatosPdfEntregaMercancia,
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "letter",
  });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentW = pageW - marginX * 2;
  let y = 10;

  const logo = await cargarLogoEntregaMercancia();
  if (logo && logo.widthPx > 0 && logo.heightPx > 0) {
    const maxLogoH = 28;
    const maxLogoW = 55;
    const ratio = logo.widthPx / logo.heightPx;
    let imgW = maxLogoW;
    let imgH = imgW / ratio;
    if (imgH > maxLogoH) {
      imgH = maxLogoH;
      imgW = imgH * ratio;
    }
    //Lado Derecho
    // doc.addImage(logo.dataUrl, logo.format, marginX, y, imgW, imgH);
    doc.addImage(
      logo.dataUrl,
      logo.format,
      pageW - marginX - imgW,
      y,
      imgW,
      imgH,
    );
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("CODIALUB S.A.P.I DE C.V", pageW / 2, y + 10, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("COD1606073H5", pageW / 2, y + 14, { align: "center" });
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("Entrega de Mercancía", pageW / 2, y + 20, { align: "center" });
  y += 24;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  const meta: Array<[string, string]> = [
    ["Fecha", formatFechaEs(datos.fecha)],
    ["Folio", String(datos.folio || "—")],
    ["Documento", datos.docNum ? String(datos.docNum) : "—"],
    ["Cliente", datos.cliente || "—"],
    ["Operador", datos.operador || "—"],
  ];
  for (const [label, value] of meta) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, marginX, y);
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(value, contentW - 32);
    doc.text(lines, marginX + 28, y);
    y += Math.max(6, lines.length * 4.5);
  }

  y += 2;

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Artículo",
        "Código proveedor",
        "Descripción",
        "Almacén",
        "Cantidad",
        "Enviada",
      ],
    ],
    body: datos.lineas.map((l) => [
      l.itemCode || "—",
      l.codigoProveedor || "—",
      l.descripcion || "—",
      l.almacen || "—",
      String(l.cantidad ?? 0),
      String(l.enviada ?? 0),
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2,
      valign: "middle",
    },
    headStyles: {
      fillColor: [40, 40, 40],
      textColor: 255,
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 28 },
      2: { cellWidth: "auto" },
      3: { cellWidth: 32 },
      4: { cellWidth: 18, halign: "right" },
      5: { cellWidth: 18, halign: "right" },
    },
    margin: { left: marginX, right: marginX },
  });

  const lastTable = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
    .lastAutoTable;
  let firmasY = (lastTable?.finalY ?? y) + 16;
  const firmaBoxH = 38;
  if (firmasY + firmaBoxH + 10 > pageH) {
    doc.addPage();
    firmasY = 20;
  }

  const gap = 6;
  const boxW = (contentW - gap * 2) / 3;
  const boxes: Array<{ titulo: string; campos: string[] }> = [
    {
      titulo: "Almacén",
      campos: ["Nombre:", "Firma:", "Fecha:"],
    },
    {
      titulo: "Cliente",
      campos: ["Nombre:", "Firma:"],
    },
    {
      titulo: "Operador",
      campos: ["Nombre:", "Firma:"],
    },
  ];

  boxes.forEach((box, i) => {
    const x = marginX + i * (boxW + gap);
    doc.setDrawColor(80);
    doc.rect(x, firmasY, boxW, firmaBoxH);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(box.titulo, x + boxW / 2, firmasY + 5, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    let lineY = firmasY + 12;
    for (const campo of box.campos) {
      doc.text(campo, x + 3, lineY);
      doc.line(x + 18, lineY + 0.5, x + boxW - 3, lineY + 0.5);
      lineY += 9;
    }
  });

  const blobUrl = doc.output("bloburl");
  window.open(blobUrl, "_blank");
}
