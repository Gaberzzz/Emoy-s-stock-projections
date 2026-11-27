import { classify, playBand } from '../bands';

describe('classify (bands on M rounded to 2 dp, research.md R4)', () => {
  it.each([
    [0.5, 'PARTIAL_RECOVERY'],
    [0.994, 'PARTIAL_RECOVERY'],
    [0.995, 'COST_RECOVERED'],
    [1.0, 'COST_RECOVERED'],
    [1.494, 'COST_RECOVERED'],
    [1.495, 'PROFIT_LOCKED'],
    [1.5, 'PROFIT_LOCKED'],
    [2.494, 'PROFIT_LOCKED'],
    [2.495, 'OVER_LIQUIDATION'],
    [2.5, 'OVER_LIQUIDATION'],
  ])('M = %p → %s', (m, band) => {
    expect(classify(m)).toBe(band);
  });
});

describe('playBand (data-model.md Position.profitZoneThreshold)', () => {
  it.each([
    [-0.006, 350, 'CAPITAL_GAP'],
    [-0.004, 350, 'BREAKEVEN'],
    [0, 350, 'BREAKEVEN'],
    [349.99, 350, 'BREAKEVEN'],
    [349.996, 350, 'PROFIT_ZONE'],
    [350, 350, 'PROFIT_ZONE'],
    [100, 100, 'PROFIT_ZONE'],
    [99.99, 100, 'BREAKEVEN'],
    [0, 0, 'PROFIT_ZONE'],
  ])('x = %p, threshold %p → %s', (x, threshold, band) => {
    expect(playBand(x, threshold)).toBe(band);
  });
});
