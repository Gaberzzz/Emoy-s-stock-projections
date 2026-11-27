/**
 * Stored entities. Field rules: specs/001-stock-projection-app/data-model.md
 */

export const SCHEMA_VERSION = 1;

export const DEFAULT_SOLD_STEPS: readonly number[] = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];
export const DEFAULT_PROFIT_ZONE_THRESHOLD = 350;

export const LIMITS = {
  nameMax: 40,
  capitalNoteMax: 80,
  saleNoteMax: 80,
  lotsMax: 50,
  targetSellRatesMax: 20,
  decimalsMax: 4,
} as const;

/** A purchase. */
export interface Lot {
  id: string;
  shares: number;
  averagePrice: number;
}

/** A recorded actual sale (recovery point). */
export interface Sale {
  id: string;
  shares: number;
  price: number;
  /** ISO date, YYYY-MM-DD. */
  date: string;
  note?: string;
}

/** A temporary, unsaved sale used only to preview its effect. */
export type WhatIfSale = Omit<Sale, 'id'>;

/** One stock being analysed. */
export interface Position {
  id: string;
  name: string;
  capitalNote?: string;
  lots: Lot[];
  /** Unique, > 0, sorted ascending. */
  targetSellRates: number[];
  /** Fractions in (0, 1], unique, sorted ascending. */
  soldSteps: number[];
  profitZoneThreshold: number;
  sales: Sale[];
  createdAt: string;
  updatedAt: string;
}

export interface AppData {
  schemaVersion: number;
  positions: Position[];
}

export function emptyAppData(): AppData {
  return { schemaVersion: SCHEMA_VERSION, positions: [] };
}
