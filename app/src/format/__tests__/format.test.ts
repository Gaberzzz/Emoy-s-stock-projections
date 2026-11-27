import { formatMoney, formatMultiple, formatPercent, parseNumber, round2 } from '../format';

describe('round2', () => {
  it('rounds half away from zero despite binary floating point', () => {
    expect(round2(0.995)).toBe(1);
    expect(round2(1.005)).toBe(1.01);
    expect(round2(2.925)).toBe(2.93);
    expect(round2(-94.00000000000023)).toBe(-94);
  });

  it('never returns negative zero', () => {
    expect(Object.is(round2(-0.004), 0)).toBe(true);
  });
});

describe('formatMoney', () => {
  it('uses 2 decimals and thousands separators', () => {
    expect(formatMoney(1959)).toBe('1,959.00');
    expect(formatMoney(852.9999999999999)).toBe('853.00');
    expect(formatMoney(1234567.891)).toBe('1,234,567.89');
    expect(formatMoney(0)).toBe('0.00');
  });

  it('formats negatives with a leading minus', () => {
    expect(formatMoney(-94.00000000000023)).toBe('-94.00');
    expect(formatMoney(-1347)).toBe('-1,347.00');
  });

  it('shows tiny negatives as 0.00', () => {
    expect(formatMoney(-0.004)).toBe('0.00');
  });
});

describe('formatMultiple', () => {
  it('uses 2 decimals', () => {
    expect(formatMultiple(1.0883333333333334)).toBe('1.09');
    expect(formatMultiple(2.925)).toBe('2.93');
  });
});

describe('formatPercent', () => {
  it('formats fractions as percentages', () => {
    expect(formatPercent(0.3)).toBe('30%');
    expect(formatPercent(0.125)).toBe('12.5%');
    expect(formatPercent(1)).toBe('100%');
  });
});

describe('parseNumber', () => {
  it('parses plain and comma-grouped numbers', () => {
    expect(parseNumber('1.80')).toBe(1.8);
    expect(parseNumber(' 1,000 ')).toBe(1000);
  });

  it('returns null for empty or invalid text', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1.2.3')).toBeNull();
  });
});
