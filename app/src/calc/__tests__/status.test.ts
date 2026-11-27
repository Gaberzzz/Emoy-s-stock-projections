import { calculate } from '../calculate';
import { CalcInputError, type CalcInput } from '../types';

const base: CalcInput = {
  lots: [{ shares: 1000, averagePrice: 1.8 }],
  sales: [],
  targetSellRates: [1.5, 4.53],
  soldSteps: [0.1, 0.5],
  profitZoneThreshold: 350,
};

describe('calculate: status and edge cases', () => {
  it('is EMPTY with no lots, with empty tables', () => {
    const r = calculate({ ...base, lots: [] });
    expect(r.status).toBe('EMPTY');
    expect(r.totalShares).toBe(0);
    expect(r.netExpense).toBe(0);
    expect(r.weightedAp).toBeNull();
    expect(r.projection).toEqual([]);
    expect(r.liquidation).toEqual([]);
    expect(r.classification).toEqual([]);
    expect(r.toPlay).toEqual([]);
  });

  it('shows a TSR below the average price as a loss', () => {
    const row = calculate(base).projection[0]!;
    expect(row.tsr).toBe(1.5);
    expect(row.netProfit).toBeCloseTo(-300, 2);
    expect(row.rateDiffPosition).toBeCloseTo(-0.3, 10);
    expect(row.rateDiffPerLot[0]).toBeCloseTo(-0.3, 10);
  });

  it('throws CalcInputError for invalid input', () => {
    expect(() => calculate({ ...base, lots: [{ shares: -1, averagePrice: 1 }] })).toThrow(
      CalcInputError,
    );
  });

  it('is deterministic', () => {
    expect(calculate(base)).toEqual(calculate(base));
  });
});
