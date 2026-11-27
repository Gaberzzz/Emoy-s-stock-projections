import reference from '../__fixtures__/workbook-reference.json';
import { calculate } from '../calculate';
import { applySale } from '../sales';
import { CalcInputError, type CalcInput } from '../types';

const rp = reference.recoveryPoint;

const base: CalcInput = {
  lots: rp.lots,
  sales: [],
  targetSellRates: [4.53, 6.53],
  soldSteps: [0.1, 0.5],
  profitZoneThreshold: 350,
};

describe('Recorded sales (recovery point)', () => {
  it('matches the workbook recovery-point example (161 shares, NE 135.20)', () => {
    const r = calculate({ ...base, sales: [rp.sale] });
    expect(r.totalShares).toBeCloseTo(rp.expected.totalShares, 6);
    expect(r.netExpense).toBeCloseTo(rp.expected.netExpense, 2);
    expect(r.netExpense).toBeCloseTo(135.2, 2);
    expect(r.status).toBe('ACTIVE');
    expect(r.weightedAp).toBeCloseTo(135.2 / 161, 10);
  });

  it('rejects a sale of more shares than are held', () => {
    expect(() => calculate({ ...base, sales: [{ shares: 282, price: 1 }] })).toThrow(
      CalcInputError,
    );
  });

  it('becomes HOUSE_MONEY when sales recover the full cost', () => {
    const r = calculate({ ...base, sales: [{ shares: 200, price: 4 }] }); // NE 678.80 − 800 < 0
    expect(r.status).toBe('HOUSE_MONEY');
    expect(r.totalShares).toBe(81);
    expect(r.netExpense).toBeCloseTo(-121.2, 2);
    expect(r.weightedAp).toBeNull();
    expect(r.projection[0]!.rateDiffPosition).toBeNull();
    expect(r.classification.flat().every((c) => c.value.m === null && c.value.band === null)).toBe(
      true,
    );
    // Liquidation and To Play are still computed.
    expect(r.liquidation[0]![0]!.value).toBeCloseTo(81 * 0.1 * 4.53, 6);
    expect(r.toPlay[0]![0]!.value.band).toBe('BREAKEVEN');
  });

  it('is FULLY_SOLD when no shares remain, with empty tables', () => {
    const r = calculate({ ...base, sales: [{ shares: 281, price: 3 }] });
    expect(r.status).toBe('FULLY_SOLD');
    expect(r.totalShares).toBe(0);
    expect(r.netExpense).toBeCloseTo(678.8 - 843, 2);
    expect(r.projection).toEqual([]);
    expect(r.liquidation).toEqual([]);
  });
});

describe('applySale (what-if)', () => {
  it('appends the sale without changing the original input', () => {
    const what = applySale(base, { shares: 120, price: 4.53 });
    expect(base.sales).toEqual([]);
    expect(calculate(what).netExpense).toBeCloseTo(135.2, 2);
  });

  it('throws if the what-if sale exceeds the shares held', () => {
    expect(() => applySale(base, { shares: 300, price: 1 })).toThrow(CalcInputError);
  });
});
