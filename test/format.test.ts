import { describe, expect, it } from 'vitest';
import { formatNumber, getGroupSeparator, parseNumericValue } from '../src';
import { formatValue } from '../src/format';

describe('formatNumber', () => {
  it('formats comma grouped integers', () => {
    expect(formatNumber(1000000)).toBe('1,000,000');
  });

  it('formats dot grouped integers', () => {
    expect(formatNumber(1000000, { format: '.ddd' })).toBe('1.000.000');
  });

  it('can disable grouping', () => {
    expect(formatNumber(1000000, { format: 'ddd' })).toBe('1000000');
  });

  it('supports decimals, signs, prefixes, and suffixes', () => {
    expect(formatNumber(-1234.5, { decimals: 2, prefix: '$', suffix: '+' })).toBe('$-1,234.50+');
  });

  it('uses comma decimals when dot is used for grouping', () => {
    expect(formatNumber(1234.56, { format: '.ddd', decimals: 2 })).toBe('1.234,56');
  });

  it('rejects non-finite values', () => {
    expect(() => formatNumber(Number.NaN)).toThrow(TypeError);
  });
});

describe('format helpers', () => {
  it('detects group separators', () => {
    expect(getGroupSeparator(',ddd')).toBe(',');
    expect(getGroupSeparator('ddd')).toBe('');
  });

  it('parses numeric text safely', () => {
    expect(parseNumericValue('$1,250+')).toBe(1250);
    expect(parseNumericValue('not a number', 42)).toBe(42);
  });
});

describe('formatValue', () => {
  it('prefers custom formatter functions', () => {
    expect(formatValue(12, { formatter: (value) => `${value} pts`, prefix: '$' })).toBe('12 pts');
  });

  it('supports Intl.NumberFormat instances', () => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });

    expect(formatValue(1200, { formatter })).toBe('$1,200');
  });

  it('supports compact notation', () => {
    expect(formatValue(1200000, { notation: 'compact' })).toBe('1.2M');
    expect(formatValue(1200000, { notation: 'compact', decimals: 0, suffix: '+' })).toBe('1M+');
  });
});
