import { formatMoney } from '../format/format';
import type { ClassBand, PlayBand } from '../calc/types';

export const CLASS_BANDS: ClassBand[] = [
  'PARTIAL_RECOVERY',
  'COST_RECOVERED',
  'PROFIT_LOCKED',
  'OVER_LIQUIDATION',
];
export const PLAY_BANDS: PlayBand[] = ['CAPITAL_GAP', 'BREAKEVEN', 'PROFIT_ZONE'];

export const BAND_LABEL: Record<ClassBand | PlayBand, string> = {
  PARTIAL_RECOVERY: 'Partial Recovery',
  COST_RECOVERED: 'Cost Recovered',
  PROFIT_LOCKED: 'Profit Locked',
  OVER_LIQUIDATION: 'Over Liquidation',
  CAPITAL_GAP: 'Capital Gap',
  BREAKEVEN: 'Breakeven',
  PROFIT_ZONE: 'Profit Zone',
};

/** Plain-language rule for each band (FR-008, US2 scenario 4). */
export function bandRule(band: ClassBand | PlayBand, profitZoneThreshold = 350): string {
  const t = formatMoney(profitZoneThreshold);
  switch (band) {
    case 'PARTIAL_RECOVERY':
      return 'M < 1: this sale brings back less than what you paid in total (net expense).';
    case 'COST_RECOVERED':
      return '1 ≤ M < 1.5: this sale brings back everything you paid, and up to 1.5× it.';
    case 'PROFIT_LOCKED':
      return '1.5 ≤ M < 2.5: this sale brings back 1.5× to 2.5× what you paid.';
    case 'OVER_LIQUIDATION':
      return 'M ≥ 2.5: this sale brings back 2.5× or more of what you paid — you may be selling more than needed.';
    case 'CAPITAL_GAP':
      return 'x < 0: after this sale you still have not got back your full net expense.';
    case 'BREAKEVEN':
      return `0 ≤ x < ${t}: you get your full net expense back, plus less than ${t}.`;
    case 'PROFIT_ZONE':
      return `x ≥ ${t}: you get your full net expense back, plus ${t} or more.`;
  }
}
