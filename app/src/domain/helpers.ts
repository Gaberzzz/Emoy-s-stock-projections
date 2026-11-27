import { randomUUID } from 'expo-crypto';
import { calculate } from '../calc/calculate';
import { applySale, orderSales } from '../calc/sales';
import { CalcInputError, type CalcInput, type CalcResult } from '../calc/types';
import type { Position, WhatIfSale } from './types';

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Today's local date as YYYY-MM-DD. */
export function todayIsoDate(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toCalcInput(position: Position, whatIf?: WhatIfSale): CalcInput {
  const input: CalcInput = {
    lots: position.lots.map((l) => ({ shares: l.shares, averagePrice: l.averagePrice })),
    sales: orderSales(position.sales).map((s) => ({ shares: s.shares, price: s.price })),
    targetSellRates: position.targetSellRates,
    soldSteps: position.soldSteps,
    profitZoneThreshold: position.profitZoneThreshold,
  };
  return whatIf ? applySale(input, whatIf) : input;
}

export type CalcOutcome = { result: CalcResult; error: null } | { result: null; error: string };

/** Never throws: invalid input becomes a user-facing message. */
export function safeCalculate(position: Position, whatIf?: WhatIfSale): CalcOutcome {
  try {
    return { result: calculate(toCalcInput(position, whatIf)), error: null };
  } catch (e) {
    if (e instanceof CalcInputError) return { result: null, error: e.issue.message };
    throw e;
  }
}
