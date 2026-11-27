/**
 * Structural + rule validation of stored data (data-model.md: AppData.*, Position.*, Lot.*, Sale.*).
 * Used when loading from storage and before saving.
 */
import { findSaleConflict } from '../calc/sales';
import {
  validateCapitalNote,
  validateLotCount,
  validateName,
  validatePrice,
  validateProfitZoneThreshold,
  validateSaleDate,
  validateSaleNote,
  validateShares,
  validateSoldSteps,
  validateTargetSellRates,
} from '../calc/validate';
import type { AppData, Position } from './types';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isNumArray = (v: unknown): v is number[] => Array.isArray(v) && v.every(isNum);

function uniqueIds(items: { id: string }[]): boolean {
  return new Set(items.map((i) => i.id)).size === items.length;
}

/** Returns a problem description, or null if the position is valid. */
export function positionProblem(p: unknown): string | null {
  if (!isObj(p)) return 'not an object';
  if (!isStr(p.id) || p.id === '') return 'missing id';
  if (!isStr(p.name) || validateName(p.name)) return 'invalid name';
  if (p.capitalNote !== undefined && (!isStr(p.capitalNote) || validateCapitalNote(p.capitalNote)))
    return 'invalid capitalNote';
  if (!isStr(p.createdAt) || !isStr(p.updatedAt)) return 'missing timestamps';

  if (!Array.isArray(p.lots) || validateLotCount(p.lots.length)) return 'invalid lots';
  for (const l of p.lots as unknown[]) {
    if (!isObj(l) || !isStr(l.id) || !isNum(l.shares) || !isNum(l.averagePrice))
      return 'invalid lot';
    if (validateShares(l.shares) || validatePrice(l.averagePrice)) return 'invalid lot values';
  }
  if (!uniqueIds(p.lots as { id: string }[])) return 'duplicate lot ids';

  if (!isNumArray(p.targetSellRates) || validateTargetSellRates(p.targetSellRates))
    return 'invalid targetSellRates';
  if (!isNumArray(p.soldSteps) || validateSoldSteps(p.soldSteps)) return 'invalid soldSteps';
  if (!isNum(p.profitZoneThreshold) || validateProfitZoneThreshold(p.profitZoneThreshold))
    return 'invalid profitZoneThreshold';

  if (!Array.isArray(p.sales)) return 'invalid sales';
  for (const s of p.sales as unknown[]) {
    if (!isObj(s) || !isStr(s.id) || !isNum(s.shares) || !isNum(s.price) || !isStr(s.date))
      return 'invalid sale';
    if (validateShares(s.shares) || validatePrice(s.price) || validateSaleDate(s.date))
      return 'invalid sale values';
    if (s.note !== undefined && (!isStr(s.note) || validateSaleNote(s.note)))
      return 'invalid sale note';
  }
  if (!uniqueIds(p.sales as { id: string }[])) return 'duplicate sale ids';
  const typed = p as unknown as Position;
  if (findSaleConflict(typed.lots, typed.sales)) return 'sales exceed shares held';
  return null;
}

export function appDataProblem(d: unknown, schemaVersion: number): string | null {
  if (!isObj(d)) return 'not an object';
  if (d.schemaVersion !== schemaVersion) return `schemaVersion ${String(d.schemaVersion)}`;
  if (!Array.isArray(d.positions)) return 'positions missing';
  for (const [i, p] of (d.positions as unknown[]).entries()) {
    const problem = positionProblem(p);
    if (problem) return `positions[${i}]: ${problem}`;
  }
  if (!uniqueIds(d.positions as { id: string }[])) return 'duplicate position ids';
  return null;
}

export function isValidAppData(d: unknown, schemaVersion: number): d is AppData {
  return appDataProblem(d, schemaVersion) === null;
}
