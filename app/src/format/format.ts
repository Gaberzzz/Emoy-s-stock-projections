/**
 * Display formatting. Calculations use plain doubles; rounding happens only here and in band
 * decisions, which use the same `round2` so labels always agree with the number shown
 * (research.md R4).
 */

/** Round to 2 decimals, half away from zero, tolerant of binary floating-point error. */
export function round2(value: number): number {
  const sign = value < 0 ? -1 : 1;
  const rounded = (sign * Math.round(Math.abs(value) * 100 + 1e-7)) / 100;
  return rounded === 0 ? 0 : rounded;
}

function group(intDigits: string): string {
  return intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 2 decimals with thousands separators, e.g. "1,959.00" or "-94.00". */
export function formatMoney(value: number): string {
  const r = round2(value);
  const [int = '0', frac = '00'] = Math.abs(r).toFixed(2).split('.');
  return `${r < 0 ? '-' : ''}${group(int)}.${frac}`;
}

/** The Classification multiple M, 2 decimals. */
export function formatMultiple(value: number): string {
  return formatMoney(value);
}

/** A share price as entered (up to 4 decimals, at least 2). */
export function formatPrice(value: number): string {
  const fixed = value.toFixed(4).replace(/0{1,2}$/, '');
  const [int = '0', frac = ''] = fixed.split('.');
  return `${group(int)}.${frac}`;
}

/** A share count: whole numbers without decimals, fractions up to 4 decimals. */
export function formatShares(value: number): string {
  const fixed = Number.isInteger(value) ? value.toFixed(0) : value.toFixed(4).replace(/0+$/, '');
  const [int = '0', frac] = fixed.split('.');
  return frac ? `${group(int)}.${frac}` : group(int);
}

/** A fraction as a percentage, e.g. 0.3 → "30%", 0.125 → "12.5%". */
export function formatPercent(fraction: number): string {
  const pct = Math.round(fraction * 1000) / 10;
  return `${pct}%`;
}

/** Parse user-typed text; accepts "1,000" and surrounding spaces. Returns null if invalid. */
export function parseNumber(text: string): number | null {
  const cleaned = text.trim().replace(/,/g, '');
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}
