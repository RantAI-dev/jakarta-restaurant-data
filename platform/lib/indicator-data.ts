import { db, schema } from "@/lib/db";
import { asc, eq, inArray } from "drizzle-orm";
import { INDICATORS } from "@/lib/gci/indicators";
import { getReportRaw } from "@/lib/report-store";

const { dataset, datasetSync, datasetColumn, record } = schema;

type Row = Record<string, unknown>;

/** Baris mentah (scan tabel `record`) — dipakai saat build report / fallback. */
export async function rowsForRaw(slug: string): Promise<Row[]> {
  const rs = await db
    .select()
    .from(record)
    .where(eq(record.slug, slug))
    .orderBy(asc(record.ordinal));
  return rs.map((r) => r.data as Row);
}

/**
 * Baris dataset untuk komponen indikator. Baca dari report snapshot
 * (`rows:<slug>`, diisi cron) — satu baris JSON, cepat. Fallback ke scan
 * `record` bila belum ke-snapshot.
 */
export async function rowsFor(slug: string): Promise<Row[]> {
  const cached = await getReportRaw<Row[]>(`rows:${slug}`);
  if (cached?.data) return cached.data;
  return rowsForRaw(slug);
}

/** Peta slug→kunci-kolom untuk beberapa dataset SEKALIGUS (satu query). */
async function columnKeysFor(slugs: string[]): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  if (!slugs.length) return map;
  const cols = await db
    .select({ slug: datasetColumn.slug, key: datasetColumn.key })
    .from(datasetColumn)
    .where(inArray(datasetColumn.slug, slugs));
  for (const c of cols) {
    let set = map.get(c.slug);
    if (!set) map.set(c.slug, (set = new Set()));
    set.add(c.key);
  }
  return map;
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
): Promise<{ title: string; slug: string; rows: Row[] } | null> {
  const ds = await datasetsFor(code);
  if (!ds.length) return null;
  return { title: ds[0].title, slug: ds[0].slug, rows: await rowsFor(ds[0].slug) };
}

/**
 * Pilih dataset yang BENAR-BENAR punya kolom yang dibutuhkan komponen.
 * Cek kolom lewat `datasetColumn` DULU (murah) — dataset besar seperti registry
 * yang tak punya kolom agregat langsung tersaring, TIDAK di-load barisnya.
 * Baru muat baris (dari snapshot) untuk kandidat yang lolos. Fallback: terbesar.
 */
export async function pickData(
  code: string,
  requiredCols: string[]
): Promise<{ title: string; slug: string; rows: Row[] } | null> {
  const ds = await datasetsFor(code);
  if (!ds.length) return null;
  const keyMap = await columnKeysFor(ds.map((d) => d.slug)); // satu query untuk semua
  const cand: {
    title: string;
    slug: string;
    rows: Row[];
    maxP: string;
    total: number;
  }[] = [];
  for (const d of ds) {
    const keys = keyMap.get(d.slug) ?? new Set<string>();
    if (!requiredCols.every((c) => keys.has(c))) continue; // saring tanpa load baris
    const rows = await rowsFor(d.slug);
    if (!rows.length) continue;
    const maxP = rows.reduce((m, r) => {
      const p = String((r as Row).periode_data ?? "");
      return p > m ? p : m;
    }, "");
    cand.push({ title: d.title, slug: d.slug, rows, maxP, total: d.total });
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
