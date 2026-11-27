/**
 * Pure state transitions for AppData. Invalid actions return the state unchanged; screens
 * validate first and show the message, so the reducer is only a safety net.
 */
import { sortedUnique } from '../domain/position';
import type { AppData, Lot, Position, Sale } from '../domain/types';
import {
  validateCapitalNote,
  validateLotCount,
  validateName,
  validatePrice,
  validateProfitZoneThreshold,
  validateShares,
  validateSoldSteps,
  validateTargetSellRates,
} from '../calc/validate';
import { findSaleConflict } from '../calc/sales';

export type PositionPatch = Partial<
  Pick<Position, 'name' | 'capitalNote' | 'targetSellRates' | 'soldSteps' | 'profitZoneThreshold'>
>;

export type Action =
  | { type: 'hydrate'; data: AppData }
  | { type: 'addPosition'; position: Position }
  | { type: 'updatePosition'; id: string; now: string; patch: PositionPatch }
  | { type: 'duplicatePosition'; id: string; newId: string; now: string }
  | { type: 'removePosition'; id: string }
  | { type: 'addLot'; positionId: string; now: string; lot: Lot }
  | { type: 'updateLot'; positionId: string; now: string; lot: Lot }
  | { type: 'removeLot'; positionId: string; now: string; lotId: string }
  | { type: 'addSale'; positionId: string; now: string; sale: Sale }
  | { type: 'removeSale'; positionId: string; now: string; saleId: string };

function lotIsValid(lot: Lot): boolean {
  return validateShares(lot.shares) === null && validatePrice(lot.averagePrice) === null;
}

function patchIsValid(patch: PositionPatch): boolean {
  return (
    (patch.name === undefined || validateName(patch.name) === null) &&
    validateCapitalNote(patch.capitalNote) === null &&
    (patch.targetSellRates === undefined ||
      validateTargetSellRates(patch.targetSellRates) === null) &&
    (patch.soldSteps === undefined || validateSoldSteps(patch.soldSteps) === null) &&
    (patch.profitZoneThreshold === undefined ||
      validateProfitZoneThreshold(patch.profitZoneThreshold) === null)
  );
}

/** Lots/sales changes must leave every recorded sale feasible. */
function holdingsAreConsistent(p: Position): boolean {
  return findSaleConflict(p.lots, p.sales) === null;
}

function mapPosition(
  state: AppData,
  id: string,
  now: string,
  change: (p: Position) => Position | null,
): AppData {
  let changed = false;
  const positions = state.positions.map((p) => {
    if (p.id !== id) return p;
    const next = change(p);
    if (!next || !holdingsAreConsistent(next)) return p;
    changed = true;
    return { ...next, updatedAt: now };
  });
  return changed ? { ...state, positions } : state;
}

export function reducer(state: AppData, action: Action): AppData {
  switch (action.type) {
    case 'hydrate':
      return action.data;

    case 'addPosition':
      if (validateName(action.position.name) !== null) return state;
      return { ...state, positions: [action.position, ...state.positions] };

    case 'updatePosition':
      if (!patchIsValid(action.patch)) return state;
      return mapPosition(state, action.id, action.now, (p) => {
        const { capitalNote, ...rest } = action.patch;
        const next: Position = { ...p, ...rest };
        if (rest.name !== undefined) next.name = rest.name.trim();
        if ('capitalNote' in action.patch) {
          const note = capitalNote?.trim();
          if (note) next.capitalNote = note;
          else delete next.capitalNote;
        }
        if (rest.targetSellRates) next.targetSellRates = sortedUnique(rest.targetSellRates);
        if (rest.soldSteps) next.soldSteps = sortedUnique(rest.soldSteps);
        return next;
      });

    case 'duplicatePosition': {
      const src = state.positions.find((p) => p.id === action.id);
      if (!src) return state;
      const name = `${src.name} (copy)`.slice(0, 40);
      const copy: Position = {
        ...structuredCloneSafe(src),
        id: action.newId,
        name,
        createdAt: action.now,
        updatedAt: action.now,
      };
      const index = state.positions.indexOf(src);
      const positions = [...state.positions];
      positions.splice(index, 0, copy);
      return { ...state, positions };
    }

    case 'removePosition':
      return { ...state, positions: state.positions.filter((p) => p.id !== action.id) };

    case 'addLot':
      if (!lotIsValid(action.lot)) return state;
      return mapPosition(state, action.positionId, action.now, (p) =>
        validateLotCount(p.lots.length + 1) === null
          ? { ...p, lots: [...p.lots, action.lot] }
          : null,
      );

    case 'updateLot':
      if (!lotIsValid(action.lot)) return state;
      return mapPosition(state, action.positionId, action.now, (p) =>
        p.lots.some((l) => l.id === action.lot.id)
          ? { ...p, lots: p.lots.map((l) => (l.id === action.lot.id ? action.lot : l)) }
          : null,
      );

    case 'removeLot':
      return mapPosition(state, action.positionId, action.now, (p) => ({
        ...p,
        lots: p.lots.filter((l) => l.id !== action.lotId),
      }));

    case 'addSale':
      if (validateShares(action.sale.shares) !== null || validatePrice(action.sale.price) !== null)
        return state;
      return mapPosition(state, action.positionId, action.now, (p) => ({
        ...p,
        sales: [...p.sales, action.sale],
      }));

    case 'removeSale':
      return mapPosition(state, action.positionId, action.now, (p) => ({
        ...p,
        sales: p.sales.filter((s) => s.id !== action.saleId),
      }));
  }
}

function structuredCloneSafe<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
