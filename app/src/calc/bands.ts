import { round2 } from '../format/format';
import type { ClassBand, PlayBand } from './types';

/** Classification bands from the workbook legend, decided on M rounded to 2 dp. */
export const CLASS_THRESHOLDS = { costRecovered: 1, profitLocked: 1.5, overLiquidation: 2.5 };

export function classify(m: number): ClassBand {
  const r = round2(m);
  if (r < CLASS_THRESHOLDS.costRecovered) return 'PARTIAL_RECOVERY';
  if (r < CLASS_THRESHOLDS.profitLocked) return 'COST_RECOVERED';
  if (r < CLASS_THRESHOLDS.overLiquidation) return 'PROFIT_LOCKED';
  return 'OVER_LIQUIDATION';
}

/** To Play bands: x < 0 Capital Gap; 0 ≤ x < threshold Breakeven; x ≥ threshold Profit Zone. */
export function playBand(x: number, profitZoneThreshold: number): PlayBand {
  const r = round2(x);
  if (r < 0) return 'CAPITAL_GAP';
  if (r < round2(profitZoneThreshold)) return 'BREAKEVEN';
  return 'PROFIT_ZONE';
}
