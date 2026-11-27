/**
 * Field-level validation. Canonical rules: specs/001-stock-projection-app/data-model.md
 * Messages are user-facing.
 */
import { LIMITS } from '../domain/types';
import type { CalcInput, ValidationIssue } from './types';

type Check = string | null;

function hasAtMostDecimals(value: number, decimals: number): boolean {
  const scaled = value * 10 ** decimals;
  return Math.abs(scaled - Math.round(scaled)) < 1e-6;
}

function positiveAmount(value: number, what: string): Check {
  if (!Number.isFinite(value)) return `Enter a number for ${what}.`;
  if (value <= 0) return `${capitalize(what)} must be greater than 0.`;
  if (!hasAtMostDecimals(value, LIMITS.decimalsMax))
    return `${capitalize(what)} can have at most ${LIMITS.decimalsMax} decimals.`;
  return null;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function hasDuplicates(values: number[]): boolean {
  return new Set(values).size !== values.length;
}

/** Position.name: required, 1–40 chars after trimming. */
export function validateName(name: string): Check {
  const t = name.trim();
  if (t.length === 0) return 'Enter a name or ticker.';
  if (t.length > LIMITS.nameMax) return `Use at most ${LIMITS.nameMax} characters.`;
  return null;
}

/** Position.capitalNote: optional, ≤ 80 chars. */
export function validateCapitalNote(note: string | undefined): Check {
  if (note && note.length > LIMITS.capitalNoteMax)
    return `Use at most ${LIMITS.capitalNoteMax} characters.`;
  return null;
}

/** Sale.note: optional, ≤ 80 chars. */
export function validateSaleNote(note: string | undefined): Check {
  if (note && note.length > LIMITS.saleNoteMax)
    return `Use at most ${LIMITS.saleNoteMax} characters.`;
  return null;
}

/** Position.lots: 0–50 lots. */
export function validateLotCount(count: number): Check {
  if (count > LIMITS.lotsMax) return `A position can have at most ${LIMITS.lotsMax} lots.`;
  return null;
}

/** Lot.shares and Sale.shares: > 0, ≤ 4 decimals. */
export function validateShares(shares: number): Check {
  return positiveAmount(shares, 'number of shares');
}

/** Lot.averagePrice and Sale.price: > 0, ≤ 4 decimals. */
export function validatePrice(price: number): Check {
  return positiveAmount(price, 'price');
}

/** Position.targetSellRates: 0–20 values, each > 0, unique. */
export function validateTargetSellRates(rates: number[]): Check {
  if (rates.length > LIMITS.targetSellRatesMax)
    return `Use at most ${LIMITS.targetSellRatesMax} target sell rates.`;
  for (const r of rates) {
    const issue = positiveAmount(r, 'target sell rate');
    if (issue) return issue;
  }
  if (hasDuplicates(rates)) return 'Each target sell rate can be used only once.';
  return null;
}

/** Position.soldSteps: fractions in (0, 1], unique. */
export function validateSoldSteps(steps: number[]): Check {
  for (const s of steps) {
    if (!Number.isFinite(s) || s <= 0 || s > 1) return '% sold must be between 1% and 100%.';
  }
  if (hasDuplicates(steps)) return 'Each % sold step can be used only once.';
  return null;
}

/** Position.profitZoneThreshold: ≥ 0. */
export function validateProfitZoneThreshold(threshold: number): Check {
  if (!Number.isFinite(threshold)) return 'Enter a number for the Profit Zone threshold.';
  if (threshold < 0) return 'The Profit Zone threshold cannot be negative.';
  return null;
}

/** Sale.date: a real calendar date, YYYY-MM-DD. */
export function validateSaleDate(date: string): Check {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return 'Use the date format YYYY-MM-DD.';
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d)
    return 'Enter a real date.';
  return null;
}

/** Validate a whole calculation input. Share-count feasibility of sales is checked by calculate(). */
export function validate(input: CalcInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const add = (field: string, message: Check) => {
    if (message) issues.push({ field, message });
  };

  add('lots', validateLotCount(input.lots.length));
  input.lots.forEach((lot, i) => {
    add(`lots[${i}].shares`, validateShares(lot.shares));
    add(`lots[${i}].averagePrice`, validatePrice(lot.averagePrice));
  });
  add('targetSellRates', validateTargetSellRates(input.targetSellRates));
  add('soldSteps', validateSoldSteps(input.soldSteps));
  add('profitZoneThreshold', validateProfitZoneThreshold(input.profitZoneThreshold));
  input.sales.forEach((sale, i) => {
    add(`sales[${i}].shares`, validateShares(sale.shares));
    add(`sales[${i}].price`, validatePrice(sale.price));
  });
  return issues;
}
