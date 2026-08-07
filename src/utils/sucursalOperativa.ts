/** Config de sucursal operativa (Por surtir / reportes). */
export type SucursalOperativaConfig = {
  nombre: string;
  almacenes: string[];
};

/**
 * idSucursal → nombre + almacenes SAP del usuario.
 * 1 Tuxtla · 2 Arriaga · 3 Tapachula · 4 Espinal · 5 Comitán
 */
export const SUCURSAL_POR_ID: Record<number, SucursalOperativaConfig> = {
  1: { nombre: "TUXTLA", almacenes: ["AM1TX01", "AM1TX05"] },
  2: { nombre: "ARRIAGA", almacenes: ["AM1AR01"] },
  3: { nombre: "TAPACHULA", almacenes: ["AM3TA01"] },
  4: { nombre: "ESPINAL", almacenes: ["AM4ES01"] },
  5: { nombre: "COMITAN", almacenes: ["AM5C001"] },
};

export function configSucursalPorId(
  idSucursal: number | null | undefined,
): SucursalOperativaConfig | null {
  if (idSucursal == null || idSucursal <= 0) return null;
  return SUCURSAL_POR_ID[idSucursal] ?? null;
}

export function sameCode(a: string, b: string): boolean {
  return a.trim().toUpperCase() === b.trim().toUpperCase();
}

/** Etiqueta UI: "TUXTLA · AM1TX01" */
export function etiquetaSucursalAlmacen(
  sucursal: string | null | undefined,
  almacen: string | null | undefined,
): string {
  const s = (sucursal ?? "").trim();
  const a = (almacen ?? "").trim();
  if (s && a) return `${s} · ${a}`;
  return s || a || "—";
}

/** ¿La fila pertenece a la sucursal del usuario (por almacén o nombre)? */
export function perteneceASucursalUsuario(
  row: { sucursal?: string | null; almacen?: string | null },
  idSucursal: number | null | undefined,
): boolean {
  const cfg = configSucursalPorId(idSucursal);
  if (!cfg) return false;
  const alm = (row.almacen ?? "").trim();
  if (alm && cfg.almacenes.some((a) => sameCode(a, alm))) return true;
  const suc = (row.sucursal ?? "").trim();
  return Boolean(suc && sameCode(suc, cfg.nombre));
}
