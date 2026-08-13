import { INDICATORS } from "@/lib/gci/indicators";
import * as store from "@/lib/ch/store";

type Row = Record<string, unknown>;

/** Baris mentah dataset (dari lakehouse). */
export async function rowsForRaw(slug: string): Promise<Row[]> {
  return store.rowsForRaw(slug);
}

/** Baris dataset untuk komponen indikator. Di v2 selalu baca dari lakehouse. */
export async function rowsFor(slug: string): Promise<Row[]> {
  return store.rowsFor(slug);
}

/** Peta slug→kunci-kolom untuk beberapa dataset sekaligus. */
async function columnKeysFor(slugs: string[]): Promise<Map<string, Set<string>>> {
  return store.columnKeys(slugs);
}

/** Dataset tersync yang cocok kata kunci sebuah indikator (paling berisi dulu). */
export async function datasetsFor(
  code: string,
): Promise<{ slug: string; title: string; total: number }[]> {
  const ind = INDICATORS.find((i) => i.code === code);
  if (!ind || !ind.match.length) return [];
  const cat = await store.catalog();
  const totals = await store.syncTotals();
  return cat
    .filter((d) => ind.match.some((kw) => d.title.toLowerCase().includes(kw)))
    .map((d) => ({ slug: d.slug, title: d.title, total: totals.get(d.slug) ?? 0 }))
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);
}

/** Ambil baris dataset utama (paling berisi) sebuah indikator + judulnya. */
export async function primaryData(
  code: string,
): Promise<{ title: string; slug: string; rows: Row[] } | null> {
  const ds = await datasetsFor(code);
  if (!ds.length) return null;
  return { title: ds[0].title, slug: ds[0].slug, rows: await rowsFor(ds[0].slug) };
}

/**
 * Pilih dataset yang BENAR-BENAR punya kolom yang dibutuhkan komponen.
 * Cek kolom (murah) dulu, baru muat baris kandidat yang lolos. Fallback: terbesar.
 */
export async function pickData(
  code: string,
  requiredCols: string[],
): Promise<{ title: string; slug: string; rows: Row[] } | null> {
  const ds = await datasetsFor(code);
  if (!ds.length) return null;
  const keyMap = await columnKeysFor(ds.map((d) => d.slug));
  const cand: { title: string; slug: string; rows: Row[]; maxP: string; total: number }[] = [];
  for (const d of ds) {
    const keys = keyMap.get(d.slug) ?? new Set<string>();
    if (!requiredCols.every((c) => keys.has(c))) continue;
    const rows = await rowsFor(d.slug);
    if (!rows.length) continue;
    const maxP = rows.reduce((m, r) => {
      const p = String((r as Row).periode_data ?? "");
      return p > m ? p : m;
    }, "");
    cand.push({ title: d.title, slug: d.slug, rows, maxP, total: d.total });
  }
  if (cand.length) {
    cand.sort((a, b) => b.maxP.localeCompare(a.maxP) || b.total - a.total);
    const c = cand[0];
    return { title: c.title, slug: c.slug, rows: c.rows };
  }
  return { title: ds[0].title, slug: ds[0].slug, rows: await rowsFor(ds[0].slug) };
}
