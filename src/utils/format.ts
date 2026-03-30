const esMx = "es-MX";

export const formatCurrency = (value: number | undefined) =>
  new Intl.NumberFormat(esMx, { style: "currency", currency: "MXN" }).format(value ?? 0);

export const formatNumber = (value: number | undefined) =>
  new Intl.NumberFormat(esMx).format(value ?? 0);

export const formatPercent = (value: number | undefined) =>
  `${value != null ? value.toFixed(1) : "0.0"}%`;
