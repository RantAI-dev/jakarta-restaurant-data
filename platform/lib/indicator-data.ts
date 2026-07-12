import { db, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { INDICATORS } from "@/lib/gci/indicators";

const { dataset, datasetSync, record } = schema;

/** Semua baris (data JSON) sebuah dataset dari DB, terurut. */
export async function rowsFor(slug: string): Promise<Record<string, unknown>[]> {
  const rs = await db
    .select()
    .from(record)
    .where(eq(record.slug, slug))
    .orderBy(asc(record.ordinal));
  return rs.map((r) => r.data as Record<string, unknown>);
}

/** Dataset tersync yang cocok kata kunci sebuah indikator (paling berisi dulu). */
export async function datasetsFor(
  code: string
): Promise<{ slug: string; title: string; total: number }[]> {
  const ind = INDICATORS.find((i) => i.code === code);
  if (!ind || !ind.match.length) return [];
  const cat = await db
    .select({ slug: dataset.slug, title: dataset.title })
    .from(dataset);
  const syncs = new Map(
    (
      await db
        .select({ slug: datasetSync.slug, total: datasetSync.total })
        .from(datasetSync)
    ).map((s) => [s.slug, s.total ?? 0])
  );
  return cat
    .filter((d) => ind.match.some((kw) => d.title.toLowerCase().includes(kw)))
    .map((d) => ({ ...d, total: syncs.get(d.slug) ?? 0 }))
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);
}

/** Ambil baris dataset utama (paling berisi) sebuah indikator + judulnya. */
export async function primaryData(
  code: string
): Promise<{ title: string; slug: string; rows: Record<string, unknown>[] } | null> {
  const ds = await datasetsFor(code);
  if (!ds.length) return null;
  return { title: ds[0].title, slug: ds[0].slug, rows: await rowsFor(ds[0].slug) };
}

/**
 * Pilih dataset yang BENAR-BENAR punya kolom yang dibutuhkan komponen
 * (bukan sekadar yang barisnya terbanyak). Menghindari kepilihnya dataset
 * registry saat komponen butuh tabel agregat. Fallback: dataset terbesar.
 */
export async function pickData(
  code: string,
  requiredCols: string[]
): Promise<{ title: string; slug: string; rows: Record<string, unknown>[] } | null> {
  const ds = await datasetsFor(code);
  const cand: {
    title: string;
    slug: string;
    rows: Record<string, unknown>[];
    maxP: string;
    total: number;
  }[] = [];
  for (const d of ds) {
    const rows = await rowsFor(d.slug);
    if (rows.length && requiredCols.every((c) => c in (rows[0] as object))) {
      const maxP = rows.reduce((m, r) => {
        const p = String((r as Record<string, unknown>).periode_data ?? "");
        return p > m ? p : m;
      }, "");
      cand.push({ title: d.title, slug: d.slug, rows, maxP, total: d.total });
    }
  }
  if (cand.length) {
    // Prioritas: periode terbaru dulu, lalu jumlah baris terbanyak.
    cand.sort((a, b) => b.maxP.localeCompare(a.maxP) || b.total - a.total);
    const c = cand[0];
    return { title: c.title, slug: c.slug, rows: c.rows };
  }
  if (!ds.length) return null;
  return { title: ds[0].title, slug: ds[0].slug, rows: await rowsFor(ds[0].slug) };
}
