import {
  validate,
  validateCapitalNote,
  validateLotCount,
  validateName,
  validatePrice,
  validateProfitZoneThreshold,
  validateSaleDate,
  validateSaleNote,
  validateShares,
  validateSoldSteps,
  validateTargetSellRates,
} from '../validate';
import type { CalcInput } from '../types';

const valid: CalcInput = {
  lots: [{ shares: 1000, averagePrice: 1.8 }],
  sales: [],
  targetSellRates: [4.53, 6.53],
  soldSteps: [0.1, 0.2],
  profitZoneThreshold: 350,
};

describe('Position.name', () => {
  it('requires 1-40 characters after trimming', () => {
    expect(validateName('KEEL')).toBeNull();
    expect(validateName('   ')).not.toBeNull();
    expect(validateName('x'.repeat(41))).not.toBeNull();
    expect(validateName(` ${'x'.repeat(40)} `)).toBeNull();
  });
});

describe('Position.capitalNote / Sale.note', () => {
  it('is optional and at most 80 characters', () => {
    expect(validateCapitalNote(undefined)).toBeNull();
    expect(validateCapitalNote('Capital: USD 677')).toBeNull();
    expect(validateCapitalNote('x'.repeat(81))).not.toBeNull();
    expect(validateSaleNote(undefined)).toBeNull();
    expect(validateSaleNote('x'.repeat(81))).not.toBeNull();
  });
});

describe('Position.lots count', () => {
  it('allows at most 50 lots', () => {
    expect(validateLotCount(50)).toBeNull();
    expect(validateLotCount(51)).not.toBeNull();
  });
});

describe('Lot.shares / Sale.shares', () => {
  it('must be > 0 with at most 4 decimals', () => {
    expect(validateShares(1000)).toBeNull();
    expect(validateShares(0.5)).toBeNull();
    expect(validateShares(0)).not.toBeNull();
    expect(validateShares(-5)).not.toBeNull();
    expect(validateShares(1.23456)).not.toBeNull();
    expect(validateShares(Number.NaN)).not.toBeNull();
  });
});

describe('Lot.averagePrice / Sale.price', () => {
  it('must be > 0 with at most 4 decimals', () => {
    expect(validatePrice(1.8)).toBeNull();
    expect(validatePrice(0.0001)).toBeNull();
    expect(validatePrice(0)).not.toBeNull();
    expect(validatePrice(-1.8)).not.toBeNull();
    expect(validatePrice(1.00001)).not.toBeNull();
    expect(validatePrice(Number.POSITIVE_INFINITY)).not.toBeNull();
  });
});

describe('Position.targetSellRates', () => {
  it('allows up to 20 unique positive prices', () => {
    expect(validateTargetSellRates([4.53, 6.53])).toBeNull();
    expect(validateTargetSellRates([])).toBeNull();
    expect(validateTargetSellRates([4.53, 4.53])).not.toBeNull();
    expect(validateTargetSellRates([0])).not.toBeNull();
    expect(validateTargetSellRates(Array.from({ length: 21 }, (_, i) => i + 1))).not.toBeNull();
  });
});

describe('Position.soldSteps', () => {
  it('requires unique fractions in (0, 1]', () => {
    expect(validateSoldSteps([0.1, 0.8, 1])).toBeNull();
    expect(validateSoldSteps([0])).not.toBeNull();
    expect(validateSoldSteps([1.1])).not.toBeNull();
    expect(validateSoldSteps([0.1, 0.1])).not.toBeNull();
  });
});

describe('Position.profitZoneThreshold', () => {
  it('must be >= 0', () => {
    expect(validateProfitZoneThreshold(350)).toBeNull();
    expect(validateProfitZoneThreshold(0)).toBeNull();
    expect(validateProfitZoneThreshold(-1)).not.toBeNull();
  });
});

describe('Sale.date', () => {
  it('must be a real YYYY-MM-DD date', () => {
    expect(validateSaleDate('2026-11-27')).toBeNull();
    expect(validateSaleDate('2026-02-30')).not.toBeNull();
    expect(validateSaleDate('27/11/2026')).not.toBeNull();
  });
});

describe('validate(input)', () => {
  it('returns no issues for a valid input', () => {
    expect(validate(valid)).toEqual([]);
  });

  it('reports the offending field path', () => {
    const issues = validate({ ...valid, lots: [{ shares: 0, averagePrice: 1.8 }] });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.field).toBe('lots[0].shares');
  });

  it('checks TSRs, steps, threshold and sales', () => {
    const issues = validate({
      ...valid,
      targetSellRates: [1, 1],
      soldSteps: [2],
      profitZoneThreshold: -1,
      sales: [{ shares: 1, price: 0 }],
    });
    expect(issues.map((i) => i.field)).toEqual([
      'targetSellRates',
      'soldSteps',
      'profitZoneThreshold',
      'sales[0].price',
    ]);
  });
});
