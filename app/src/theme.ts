import type { ClassBand, PlayBand } from './calc/types';

export const colors = {
  bg: '#F7F8FA',
  card: '#FFFFFF',
  text: '#1A1D21',
  muted: '#5C6470',
  border: '#D9DDE3',
  primary: '#0B5CAD',
  primaryText: '#FFFFFF',
  danger: '#B3261E',
  loss: '#B3261E',
  gain: '#0B6E4F',
  banner: '#FFF4D6',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };

/**
 * Band colours from the Okabe–Ito colour-blind-safe palette (light tints for backgrounds,
 * dark text). Bands are always labelled in text too, never shown by colour alone.
 */
export const bandColors: Record<ClassBand | PlayBand, { bg: string; fg: string }> = {
  PARTIAL_RECOVERY: { bg: '#FBD9C4', fg: '#7A2E00' },
  COST_RECOVERED: { bg: '#FCE7B2', fg: '#5C4100' },
  PROFIT_LOCKED: { bg: '#BFE8DA', fg: '#00513A' },
  OVER_LIQUIDATION: { bg: '#C6DDF0', fg: '#003A63' },
  CAPITAL_GAP: { bg: '#FBD9C4', fg: '#7A2E00' },
  BREAKEVEN: { bg: '#FCE7B2', fg: '#5C4100' },
  PROFIT_ZONE: { bg: '#BFE8DA', fg: '#00513A' },
};
