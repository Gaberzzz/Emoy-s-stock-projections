import reference from '../__fixtures__/workbook-reference.json';
import { calculate } from '../calculate';
import type { CalcInput, ClassBand, PlayBand } from '../types';

const input = reference.input as CalcInput;
const expected = reference.expected;
const r = calculate(input);

/** Band rules from the workbook legend, applied independently of the engine. */
function workbookClassBand(m: number): ClassBand {
  if (m < 1) return 'PARTIAL_RECOVERY';
  if (m < 1.5) return 'COST_RECOVERED';
  if (m < 2.5) return 'PROFIT_LOCKED';
  return 'OVER_LIQUIDATION';
}
function workbookPlayBand(x: number): PlayBand {
  if (x < 0) return 'CAPITAL_GAP';
  if (x < 350) return 'BREAKEVEN';
  return 'PROFIT_ZONE';
}

describe('Liquidation, Classification and To Play vs Stocks-Projection.xlsx (SC-001)', () => {
  it('has one row per % sold step and one column per TSR', () => {
    for (const grid of [r.liquidation, r.classification, r.toPlay]) {
      expect(grid.map((row) => row[0]!.step)).toEqual(input.soldSteps);
      expect(grid[0]!.map((c) => c.tsr)).toEqual(input.targetSellRates);
    }
  });

  it('matches every realized-profit cell', () => {
    r.liquidation.forEach((row, i) =>
      row.forEach((cell, j) => expect(cell.value).toBeCloseTo(expected.liquidation[i]![j]!, 2)),
    );
  });

  it('matches every Classification multiple and band', () => {
    r.classification.forEach((row, i) =>
      row.forEach((cell, j) => {
        const m = expected.classificationM[i]![j]!;
        expect(cell.value.m).toBeCloseTo(m, 2);
        expect(cell.value.band).toBe(workbookClassBand(m));
      }),
    );
  });

  it('matches every To Play value and band', () => {
    r.toPlay.forEach((row, i) =>
      row.forEach((cell, j) => {
        const x = expected.toPlay[i]![j]!;
        expect(cell.value.x).toBeCloseTo(x, 2);
        expect(cell.value.band).toBe(workbookPlayBand(x));
      }),
    );
  });

  it('reproduces the spec acceptance examples', () => {
    const at = <T>(grid: { step: number; tsr: number; value: T }[][], step: number, tsr: number) =>
      grid.flat().find((c) => c.step === step && c.tsr === tsr)!.value;
    expect(at(r.liquidation, 0.4, 4.53)).toBeCloseTo(1812, 2);
    expect(at(r.liquidation, 0.3, 6.53)).toBeCloseTo(1959, 2);
    expect(at(r.classification, 0.3, 6.53)).toEqual({
      m: expect.closeTo(1.0883, 3),
      band: 'COST_RECOVERED',
    });
    expect(at(r.classification, 0.5, 10.53).band).toBe('OVER_LIQUIDATION');
    expect(at(r.toPlay, 0.3, 6.53)).toEqual({ x: expect.closeTo(159, 2), band: 'BREAKEVEN' });
    expect(at(r.toPlay, 0.2, 8.53)).toEqual({ x: expect.closeTo(-94, 2), band: 'CAPITAL_GAP' });
    expect(at(r.toPlay, 0.2, 10.53)).toEqual({ x: expect.closeTo(306, 2), band: 'BREAKEVEN' });
  });

  it('uses the position profit-zone threshold', () => {
    const custom = calculate({ ...input, profitZoneThreshold: 300 });
    const cell = custom.toPlay.flat().find((c) => c.step === 0.2 && c.tsr === 10.53)!;
    expect(cell.value.band).toBe('PROFIT_ZONE');
  });
});
