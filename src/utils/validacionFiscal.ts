/* NOMCONEXIA-UNIFY */
export interface ResultadoValidacion {
  valido: boolean;
  error?: string;
}

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const CURP_REGEX = /^[A-Z][AEIOUX][A-Z]{2}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizarTexto(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

export function validarRfc(value: unknown, tipo?: "fisica" | "moral"): ResultadoValidacion {
  const rfc = normalizarTexto(value);
  if (!rfc) return { valido: false, error: "El RFC es requerido" };
  const longitudEsperada = tipo === "fisica" ? 13 : tipo === "moral" ? 12 : undefined;
  if (longitudEsperada && rfc.length !== longitudEsperada) {
    return { valido: false, error: `El RFC debe tener ${longitudEsperada} caracteres` };
  }
  if (!RFC_REGEX.test(rfc)) {
    return { valido: false, error: "El RFC no tiene un formato válido" };
  }
  return { valido: true };
}

export function validarCurp(value: unknown): ResultadoValidacion {
  const curp = normalizarTexto(value);
  if (!curp) return { valido: false, error: "La CURP es requerida" };
  if (!CURP_REGEX.test(curp)) {
    return { valido: false, error: "La CURP no tiene un formato válido" };
  }
  return { valido: true };
}

export function validarNss(value: unknown): ResultadoValidacion {
  const nss = String(value ?? "").replace(/\s/g, "");
  if (!nss) return { valido: false, error: "El NSS es requerido" };
  if (!/^\d{11}$/.test(nss)) {
    return { valido: false, error: "El NSS debe tener 11 dígitos" };
  }
  return { valido: true };
}

export function validarClabe(value: unknown): ResultadoValidacion {
  const clabe = String(value ?? "").replace(/\s/g, "");
  if (!clabe) return { valido: false, error: "La CLABE es requerida" };
  if (!/^\d{18}$/.test(clabe)) {
    return { valido: false, error: "La CLABE debe tener 18 dígitos" };
  }
  return digitoVerificadorClabe(clabe) === Number(clabe[17])
    ? { valido: true }
    : { valido: false, error: "El dígito verificador de la CLABE no coincide" };
}

export function digitoVerificadorClabe(clabe: string): number {
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) {
    suma += (Number(clabe[i]) * pesos[i % 3]) % 10;
  }
  return (10 - (suma % 10)) % 10;
}

export function validarCodigoPostal(value: unknown): ResultadoValidacion {
  const cp = String(value ?? "").replace(/\s/g, "");
  if (!cp) return { valido: false, error: "El código postal es requerido" };
  if (!/^\d{5}$/.test(cp)) {
    return { valido: false, error: "El código postal debe tener 5 dígitos" };
  }
  return { valido: true };
}

export function validarCorreo(value: unknown): ResultadoValidacion {
  const correo = String(value ?? "").trim();
  if (!correo) return { valido: false, error: "El correo es requerido" };
  if (!CORREO_REGEX.test(correo)) {
    return { valido: false, error: "Correo inválido" };
  }
  return { valido: true };
}
