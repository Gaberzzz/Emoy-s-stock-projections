import { DEFAULT_PROFIT_ZONE_THRESHOLD, DEFAULT_SOLD_STEPS, type Position } from './types';

export function newPosition(args: {
  id: string;
  now: string;
  name: string;
  capitalNote?: string;
}): Position {
  const capitalNote = args.capitalNote?.trim();
  return {
    id: args.id,
    name: args.name.trim(),
    ...(capitalNote ? { capitalNote } : {}),
    lots: [],
    targetSellRates: [],
    soldSteps: [...DEFAULT_SOLD_STEPS],
    profitZoneThreshold: DEFAULT_PROFIT_ZONE_THRESHOLD,
    sales: [],
    createdAt: args.now,
    updatedAt: args.now,
  };
}

export function sortedUnique(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}
