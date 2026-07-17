/**
 * Shared number formatters for the coffee scrollytelling.
 *
 * All functions are pure (no side effects, no imports beyond built-ins).
 * Locale formatting uses 'en-US' for comma separators to ensure consistent
 * output across environments (no browser locale dependency in tests).
 */

/**
 * Format a production value in tonnes with comma separators.
 * Example: formatTonnes(828904) → "828,904 t"
 */
export function formatTonnes(n: number): string {
  return `${n.toLocaleString('en-US')} t`
}

/**
 * Format a year as a plain string (4-digit integer).
 * Example: formatYear(2007) → "2007"
 */
export function formatYear(n: number): string {
  return String(n)
}
