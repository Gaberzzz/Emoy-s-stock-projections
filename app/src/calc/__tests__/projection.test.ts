import reference from '../__fixtures__/workbook-reference.json';
import { calculate } from '../calculate';
import { CALC_VERSION } from '../version';
import type { CalcInput } from '../types';

const input = reference.input as CalcInput;
const expected = reference.expected;

describe('Projection analysis vs Stocks-Projection.xlsx (SC-001)', () => {
  const r = calculate(input);

  it('reports the calculation version and ACTIVE status', () => {
    expect(r.calcVersion).toBe(CALC_VERSION);
    expect(r.status).toBe('ACTIVE');
  });

  it('matches TS, NE and weighted AP', () => {
    expect(r.totalShares).toBeCloseTo(expected.totalShares, 2);
    expect(r.netExpense).toBeCloseTo(expected.netExpense, 2);
    expect(r.weightedAp).toBeCloseTo(expected.weightedAp, 2);
  });

  it('matches GP, NP and RD for every TSR', () => {
    expect(r.projection.map((p) => p.tsr)).toEqual(input.targetSellRates);
    r.projection.forEach((row, i) => {
      expect(row.grossProfit).toBeCloseTo(expected.grossProfit[i]!, 2);
      expect(row.netProfit).toBeCloseTo(expected.netProfit[i]!, 2);
      expect(row.rateDiffPerLot[0]).toBeCloseTo(expected.rateDiffFirstLot[i]!, 2);
      expect(row.rateDiffPosition).toBeCloseTo(expected.rateDiffFirstLot[i]!, 2);
    });
  });
});

describe('Projection with several lots', () => {
  it('sums two lots (1000 @ 1.80 + 500 @ 2.40)', () => {
    const r = calculate({
      ...input,
      lots: [
        { shares: 1000, averagePrice: 1.8 },
        { shares: 500, averagePrice: 2.4 },
      ],
    });
    expect(r.totalShares).toBe(1500);
    expect(r.netExpense).toBeCloseTo(3000, 2);
    expect(r.projection[0]!.grossProfit).toBeCloseTo(1500 * 4.53, 2);
    expect(r.projection[0]!.rateDiffPerLot).toHaveLength(2);
  });

  it('uses all lots for weighted AP (research.md R5), not just the first two', () => {
    const r = calculate({
      ...input,
      lots: [
        { shares: 100, averagePrice: 1 },
        { shares: 100, averagePrice: 2 },
        { shares: 200, averagePrice: 4 },
      ],
    });
    // NE = 100 + 200 + 800 = 1100; TS = 400
    expect(r.weightedAp).toBeCloseTo(2.75, 10);
    expect(r.projection[0]!.rateDiffPosition).toBeCloseTo(4.53 - 2.75, 10);
  });
});
