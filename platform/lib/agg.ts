/** Helper agregasi untuk dashboard bespoke per indikator (Plan 7). */

/** Parse angka Indonesia: "51,85"->51.85, "1.234.567"->1234567, "3645837"->3645837. */
export function idNum(v: unknown): number | null {
  let s = String(v ?? "").trim();
  if (!s) return null;
  if (s.includes(",") && !/\.\d/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export type Row = Record<string, unknown>;
export type Point = { label: string; value: number };

/** Jumlahkan `valueKey` per `groupKey`. */
export function groupSum(rows: Row[], groupKey: string, valueKey: string): Point[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[groupKey] ?? "—");
    m.set(k, (m.get(k) ?? 0) + (idNum(r[valueKey]) ?? 0));
  }
  return [...m].map(([label, value]) => ({ label, value }));
}

/** Hitung jumlah baris per `groupKey` (untuk registry/event: tiap baris = 1 record). */
export function groupCount(rows: Row[], groupKey: string): Point[] {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[groupKey] ?? "—");
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m].map(([label, value]) => ({ label, value }));
}

/** Series per periode (sum nilai, atau count baris bila valueKey tak diberi). */
export function byPeriod(rows: Row[], periodKey: string, valueKey?: string): Point[] {
  const agg = valueKey ? groupSum(rows, periodKey, valueKey) : groupCount(rows, periodKey);
  return agg.sort((a, b) => a.label.localeCompare(b.label));
}

export function topN(arr: Point[], n = 10): Point[] {
  return [...arr].sort((a, b) => b.value - a.value).slice(0, n);
}

export function total(arr: Point[]): number {
  return arr.reduce((s, x) => s + x.value, 0);
}
