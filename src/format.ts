import type { FormatOptions } from './types';

const DEFAULT_GROUP_PATTERN = ',ddd';

/**
 * Extracts the grouping separator from a compact odometer-style pattern.
 *
 * The library intentionally supports a small, predictable subset of odometer
 * formatting because OSS consumers rely on stable output across browsers and
 * bundlers. The `d` characters mark the digit group; everything before the
 * first `d` is treated as the group separator.
 */
export function getGroupSeparator(format = DEFAULT_GROUP_PATTERN): string {
  if (!format || format === 'ddd' || format === 'none') return '';
  const digitPatternStart = format.indexOf('d');
  const marker = digitPatternStart > 0 ? format.slice(0, digitPatternStart) : '';
  return marker === ' ' ? '\u00a0' : marker;
}

/**
 * Chooses a decimal separator that does not conflict with the grouping separator.
 */
export function inferDecimalSeparator(groupSeparator: string, explicit?: string): string {
  if (explicit !== undefined) return explicit;
  return groupSeparator === '.' ? ',' : '.';
}

/**
 * Formats a finite number using Reel's lightweight formatting options.
 *
 * This helper is exported so users can pre-format values in tests, SSR code, or
 * custom renderers without creating a DOM-backed {@link Reel} instance.
 */
export function formatNumber(value: number, options: FormatOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Invalid Reel value: ${value}`);
  }

  const groupSeparator = getGroupSeparator(options.format);
  const decimalSeparator = inferDecimalSeparator(groupSeparator, options.decimalSeparator);
  const decimals = options.decimals;
  const negative = value < 0;
  const absolute = Math.abs(value);
  // Use `toFixed` only when requested so non-fixed values keep their natural precision.
  const raw = decimals === undefined ? String(absolute) : absolute.toFixed(decimals);
  const [integer = '0', fraction] = raw.split('.');
  const grouped = groupSeparator
    ? integer.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator)
    : integer;
  const decimal = fraction && fraction.length > 0 ? `${decimalSeparator}${fraction}` : '';
  const sign = negative ? '-' : '';

  return `${options.prefix ?? ''}${sign}${grouped}${decimal}${options.suffix ?? ''}`;
}

/**
 * Formats a number with compact suffixes while preserving Reel's prefix/suffix API.
 */
export function formatCompactNumber(value: number, options: FormatOptions = {}): string {
  if (!Number.isFinite(value)) {
    throw new TypeError(`Invalid Reel value: ${value}`);
  }

  if (Math.abs(value) < 1_000) {
    return formatNumber(value, options);
  }

  const digits =
    options.decimals === undefined
      ? { maximumFractionDigits: 1 }
      : { minimumFractionDigits: options.decimals, maximumFractionDigits: options.decimals };
  const compact = value.toLocaleString('en', {
    notation: 'compact',
    ...digits
  });

  return `${options.prefix ?? ''}${compact}${options.suffix ?? ''}`;
}

/**
 * Formats a value using Reel's highest-level formatting rules.
 *
 * Precedence:
 * 1. `formatter`
 * 2. `notation: 'compact'`
 * 3. regular `formatNumber`
 */
export function formatValue(value: number, options: FormatOptions = {}): string {
  if (options.formatter) {
    return String(
      typeof options.formatter === 'function'
        ? options.formatter(value)
        : options.formatter.format(value)
    );
  }

  if (options.notation === 'compact') {
    return formatCompactNumber(value, options);
  }

  return formatNumber(value, options);
}

/**
 * Reads the first number-like value from markup text or `data-reel`.
 *
 * This deliberately ignores currency symbols and common grouping punctuation so
 * users can migrate existing odometer markup such as `$1,250+` without cleanup.
 */
export function parseNumericValue(input: string | null | undefined, fallback = 0): number {
  if (!input) return fallback;
  const numeric = input.match(/[-+]?\d[\d,._\s]*/) ?? [];
  if (!numeric[0]) return fallback;
  const normalized = (numeric[0] ?? '').replace(/[,_\s]/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}
