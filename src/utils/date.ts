export function toDayNumber(isoDate: string): number {
  // Parses YYYY-MM-DD as UTC day index (stable, timezone-safe for comparisons)
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return NaN;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const ms = Date.UTC(y, mo, d);
  return Math.floor(ms / 86400000);
}
