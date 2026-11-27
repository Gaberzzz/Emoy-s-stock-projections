/**
 * Calculation engine contract: specs/001-stock-projection-app/contracts/calc-engine.md
 */

export interface CalcInput {
  lots: { shares: number; averagePrice: number }[];
  /** Already in applied order. */
  sales: { shares: number; price: number }[];
  targetSellRates: number[];
  soldSteps: number[];
  profitZoneThreshold: number;
}

export type ClassBand =
  'PARTIAL_RECOVERY' | 'COST_RECOVERED' | 'PROFIT_LOCKED' | 'OVER_LIQUIDATION';
export type PlayBand = 'CAPITAL_GAP' | 'BREAKEVEN' | 'PROFIT_ZONE';
export type CalcStatus = 'EMPTY' | 'ACTIVE' | 'HOUSE_MONEY' | 'FULLY_SOLD';

export interface Cell<T> {
  step: number;
  tsr: number;
  value: T;
}

export interface ProjectionRow {
  tsr: number;
  grossProfit: number;
  netProfit: number;
  rateDiffPosition: number | null;
  rateDiffPerLot: number[];
}

export interface CalcResult {
  calcVersion: string;
  status: CalcStatus;
  totalShares: number;
  netExpense: number;
  weightedAp: number | null;
  projection: ProjectionRow[];
  liquidation: Cell<number>[][];
  classification: Cell<{ m: number | null; band: ClassBand | null }>[][];
  toPlay: Cell<{ x: number; band: PlayBand }>[][];
}

export interface ValidationIssue {
  /** Dotted path of the offending field, e.g. "lots[0].shares". */
  field: string;
  message: string;
}

export class CalcInputError extends Error {
  readonly issue: ValidationIssue;

  constructor(issue: ValidationIssue) {
    super(`${issue.field}: ${issue.message}`);
    this.name = 'CalcInputError';
    this.issue = issue;
  }
}
