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
