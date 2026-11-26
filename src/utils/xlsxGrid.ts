/* NOMCONEXIA-UNIFY */
/** Lee la primera hoja de un .xlsx (OOXML) sin dependencias. */

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const cs = new DecompressionStream("deflate-raw");
  const stream = new Blob([bytes]).stream().pipeThrough(cs);
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

function readU16(view: DataView, offset: number) {
  return view.getUint16(offset, true);
}

function readU32(view: DataView, offset: number) {
  return view.getUint32(offset, true);
}

async function unzip(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const files = new Map<string, Uint8Array>();
  let offset = 0;
  const decoder = new TextDecoder("utf-8");

  while (offset + 30 <= bytes.length) {
    const sig = readU32(view, offset);
    if (sig !== 0x04034b50) break;
    const method = readU16(view, offset + 8);
    const compSize = readU32(view, offset + 18);
    const nameLen = readU16(view, offset + 26);
    const extraLen = readU16(view, offset + 28);
    const nameStart = offset + 30;
    const name = decoder.decode(bytes.subarray(nameStart, nameStart + nameLen));
    const dataStart = nameStart + nameLen + extraLen;
    const data = bytes.subarray(dataStart, dataStart + compSize);
    if (method === 0) files.set(name, data.slice());
    else if (method === 8) files.set(name, await inflateRaw(data));
    offset = dataStart + compSize;
  }

  return files;
}

function xml(text: string) {
  return new DOMParser().parseFromString(text, "application/xml");
}

function colIndex(ref: string) {
  const letters = (ref.match(/^[A-Z]+/i) || ["A"])[0].toUpperCase();
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function rowIndex(ref: string) {
  return parseInt(ref.replace(/^[A-Z]+/i, ""), 10) || 1;
}

function cellText(el: Element, strings: string[]) {
  const t = el.getAttribute("t");
  const isEl = el.getElementsByTagName("is")[0];
  if (isEl) {
    return Array.from(isEl.getElementsByTagName("t"))
      .map((n) => n.textContent || "")
      .join("");
  }
  const v = el.getElementsByTagName("v")[0]?.textContent;
  if (v == null || v === "") return "";
  if (t === "s") return strings[Number(v)] ?? "";
  if (t === "inlineStr") return v;
  if (t === "b") return v === "1" ? "TRUE" : "FALSE";
  return v;
}

function sharedStringText(si: Element) {
  const parts: string[] = [];
  for (const child of Array.from(si.childNodes)) {
    if (child.nodeType !== 1) continue;
    const el = child as Element;
    const tag = (el.localName || el.tagName).replace(/^.*:/, "").toLowerCase();
    if (tag === "t") parts.push(el.textContent || "");
    else if (tag === "r") {
      for (const t of Array.from(el.getElementsByTagName("t"))) parts.push(t.textContent || "");
    }
  }
  return parts.join("");
}

function parseSheet(doc: Document, strings: string[]): string[][] {
  const cells = Array.from(doc.getElementsByTagName("c"));
  let maxRow = 0;
  let maxCol = 0;
  const map = new Map<string, string>();
  for (const c of cells) {
    const ref = c.getAttribute("r");
    if (!ref) continue;
    const r = rowIndex(ref);
    const col = colIndex(ref);
    maxRow = Math.max(maxRow, r);
    maxCol = Math.max(maxCol, col);
    map.set(`${r}:${col}`, cellText(c, strings).replace(/\s+/g, " ").trim());
  }
  const grid: string[][] = [];
  for (let r = 1; r <= maxRow; r++) {
    const row: string[] = [];
    for (let c = 0; c <= maxCol; c++) row.push(map.get(`${r}:${c}`) || "");
    grid.push(row);
  }
  return grid;
}

function listWorkbookSheets(files: Map<string, Uint8Array>): { name: string; path: string }[] {
  const wb = files.get("xl/workbook.xml");
  const rels = files.get("xl/_rels/workbook.xml.rels");
  if (!wb) return [];
  const decoder = new TextDecoder("utf-8");
  const relDoc = rels ? xml(decoder.decode(rels)) : null;
  const relById = new Map<string, string>();
  if (relDoc) {
    for (const rel of Array.from(relDoc.getElementsByTagName("Relationship"))) {
      const id = rel.getAttribute("Id") || "";
      const target = (rel.getAttribute("Target") || "").replace(/^\/+/, "");
      if (!id || !target) continue;
      const path = target.startsWith("xl/") ? target : `xl/${target.replace(/^\.\//, "")}`;
      relById.set(id, path);
    }
  }

  const wbDoc = xml(decoder.decode(wb));
  const out: { name: string; path: string }[] = [];
  for (const sheet of Array.from(wbDoc.getElementsByTagName("sheet"))) {
    const name = sheet.getAttribute("name") || "";
    const rid =
      sheet.getAttribute("r:id") ||
      sheet.getAttribute("id") ||
      sheet.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id") ||
      "";
    const path = relById.get(rid);
    if (name && path) out.push({ name, path });
  }
  return out;
}

function sheetLooksLikeAjustes(grid: string[][]) {
  for (const row of grid.slice(0, 20)) {
    const joined = row.join(" ").toLowerCase();
    if (joined.includes("nombre") && (joined.includes("faltas") || joined.includes("retardos"))) return true;
  }
  return false;
}

export async function readXlsxChecador(buffer: ArrayBuffer): Promise<{ grid: string[][]; sheetName: string }> {
  const files = await unzip(buffer);
  const ssFile = files.get("xl/sharedStrings.xml");
  const strings: string[] = [];
  if (ssFile) {
    const ssDoc = xml(new TextDecoder("utf-8").decode(ssFile));
    for (const si of Array.from(ssDoc.getElementsByTagName("si"))) {
      strings.push(sharedStringText(si));
    }
  }

  const decodeSheet = (path: string) => {
    const bytes = files.get(path);
    if (!bytes) return null;
    return parseSheet(xml(new TextDecoder("utf-8").decode(bytes)), strings);
  };

  const listed = listWorkbookSheets(files);
  const ordered = [
    ...listed.filter((s) => /asistencia y puntualidad/i.test(s.name)),
    ...listed.filter((s) => /asistencia|puntualidad|ajustes/i.test(s.name)),
    ...listed,
  ];
  const seen = new Set<string>();
  for (const candidate of ordered) {
    if (!candidate.path || seen.has(candidate.path)) continue;
    seen.add(candidate.path);
    const grid = decodeSheet(candidate.path);
    if (grid && sheetLooksLikeAjustes(grid)) return { grid, sheetName: candidate.name };
  }

  const zipSheets = [...files.keys()]
    .filter((k) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(k))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  for (const path of zipSheets) {
    const grid = decodeSheet(path);
    if (grid && sheetLooksLikeAjustes(grid)) {
      const namedSheet = listed.find((s) => s.path === path);
      return { grid, sheetName: namedSheet?.name || path };
    }
  }

  const fallbackPath = listed[0]?.path || zipSheets[0] || "xl/worksheets/sheet1.xml";
  const fallback = decodeSheet(fallbackPath);
  if (!fallback) throw new Error("No se encontró la hoja del Excel");
  return { grid: fallback, sheetName: listed[0]?.name || "Hoja 1" };
}

export async function readXlsxFirstSheet(buffer: ArrayBuffer): Promise<string[][]> {
  const { grid } = await readXlsxChecador(buffer);
  return grid;
}
