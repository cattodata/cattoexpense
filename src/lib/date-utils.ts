/**
 * Convert a Thai Buddhist Era year (พ.ศ.) to a Gregorian (AD) year.
 * Also handles 2-digit years by adding 2000.
 */
export function thaiYearToAD(y: number): number {
  if (y > 2400) return y - 543;
  if (y < 100) return y + 2000;
  return y;
}
