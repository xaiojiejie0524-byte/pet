export function text(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const v = value.trim(); return v.length && v.length <= max ? v : null;
}
export function isoDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.valueOf()) || d.toISOString().slice(0, 10) !== value ? null : value;
}
export function number(value: unknown, min = 0, max = 100000): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
export function tags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).filter((x): x is string => typeof x === "string").map(x => x.trim().slice(0, 30)).filter(Boolean);
}
