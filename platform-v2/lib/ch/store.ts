import { q } from "./client";

/**
 * Primitif data lakehouse — pengganti langsung tabel Postgres yang lama
 * (dataset / datasetSync / datasetColumn / record). Bentuk kembalian dijaga
 * identik dengan yang dulu dihasilkan drizzle, sehingga lib bisnis (readiness,
 * indicator-data) dan route SDI tetap 1:1.
 *
 * Sumber:
 *   bronze_meta.dataset_catalog / dataset_sync / dataset_column
 *   lake.`bronze_sdi.<table_name>`  (baris mentah)
 */

export type CatalogRow = {
  slug: string; title: string; description: string; tags: string[];
  views: number; updated_at: string | null; tier: string; table_name: string;
};

/** Katalog dataset primer (untuk /sdi + matching indikator). */
export async function catalog(): Promise<CatalogRow[]> {
  const rows = await q<{
    slug: string; title: string; description: string; tags: string;
    views: string; updated_at: string; tier: string; table_name: string;
  }>(
    `SELECT slug, title, description, tags, toString(views) AS views,
            updated_at, tier, table_name
     FROM lake.\`bronze_meta.dataset_catalog\``,
  );
  return rows.map((r) => ({
    slug: r.slug, title: r.title, description: r.description,
    tags: safeJsonArray(r.tags), views: Number(r.views) || 0,
    updated_at: r.updated_at || null, tier: r.tier, table_name: r.table_name,
  }));
}

export type SyncRow = {
  slug: string; title: string; description: string; sumberData: string[];
  frekuensi: string | null; satuan: string | null; klasifikasi: string | null;
  kontak: string | null; author: string | null; total: number; table_name: string;
};

/** Metadata satu dataset (frekuensi/satuan/sumber/total). */
export async function sync(slug: string): Promise<SyncRow | null> {
  const rows = await q<Record<string, string>>(
    `SELECT slug, title, description, sumber_data, frekuensi, satuan,
            klasifikasi, kontak, author, toString(total) AS total, table_name
     FROM lake.\`bronze_meta.dataset_sync\` WHERE slug = {slug:String} LIMIT 1`,
    { slug },
  );
  const r = rows[0];
  if (!r) return null;
  return {
    slug: r.slug, title: r.title, description: r.description,
    sumberData: safeJsonArray(r.sumber_data),
    frekuensi: r.frekuensi || null, satuan: r.satuan || null,
    klasifikasi: r.klasifikasi || null, kontak: r.kontak || null,
    author: r.author || null, total: Number(r.total) || 0, table_name: r.table_name,
  };
}

/** Map slug→total baris untuk SEMUA dataset (readiness). */
export async function syncTotals(): Promise<Map<string, number>> {
  const rows = await q<{ slug: string; total: string }>(
    `SELECT slug, toString(total) AS total FROM lake.\`bronze_meta.dataset_sync\``,
  );
  return new Map(rows.map((r) => [r.slug, Number(r.total) || 0]));
}

export type ColumnDef = { key: string; description: string | null; type: string | null; ordinal: number };

/** Definisi kolom satu dataset (urut). */
export async function columns(slug: string): Promise<ColumnDef[]> {
  const rows = await q<{ key_asli: string; deskripsi: string; tipe: string; ord: string }>(
    `SELECT key_asli, deskripsi, tipe, toString(ord) AS ord
     FROM lake.\`bronze_meta.dataset_column\` WHERE slug = {slug:String} ORDER BY ord`,
    { slug },
  );
  return rows.map((r) => ({
    key: r.key_asli, description: r.deskripsi || null,
    type: r.tipe || null, ordinal: Number(r.ord) || 0,
  }));
}

/** Peta slug→Set(kunci-kolom) untuk beberapa dataset sekaligus. */
export async function columnKeys(slugs: string[]): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  if (!slugs.length) return map;
  const rows = await q<{ slug: string; key_asli: string }>(
    `SELECT slug, key_asli FROM lake.\`bronze_meta.dataset_column\`
     WHERE slug IN {slugs:Array(String)}`,
    { slugs },
  );
  for (const c of rows) {
    let set = map.get(c.slug);
    if (!set) map.set(c.slug, (set = new Set()));
    set.add(c.key_asli);
  }
  return map;
}

/** table_name (nama tabel Bronze aman) untuk sebuah slug. */
async function tableFor(slug: string): Promise<string | null> {
  const rows = await q<{ table_name: string }>(
    `SELECT table_name FROM lake.\`bronze_meta.dataset_catalog\` WHERE slug={slug:String} LIMIT 1`,
    { slug },
  );
  return rows[0]?.table_name ?? null;
}

/** Cache tabel Bronze yang benar-benar ada (hindari query gagal utk dataset kosong). */
let _adaCache: Set<string> | null = null;
async function bronzeAda(): Promise<Set<string>> {
  if (_adaCache) return _adaCache;
  const rows = await q<{ name: string }>(`SHOW TABLES FROM lake`);
  _adaCache = new Set(
    rows.map((r) => r.name).filter((n) => n.startsWith("bronze_sdi.")).map((n) => n.slice("bronze_sdi.".length)),
  );
  return _adaCache;
}

/** Seluruh baris mentah satu dataset (dict berkunci sama seperti record.data lama). */
export async function rowsForRaw(slug: string): Promise<Record<string, unknown>[]> {
  const table = await tableFor(slug);
  if (!table) return [];
  if (!(await bronzeAda()).has(table)) return [];
  // SELECT * memberi semua kolom (termasuk audit _*) — komponen membaca hanya
  // kunci yang relevan, jadi kolom ekstra tak masalah (sama seperti record.data).
  return q<Record<string, unknown>>(
    `SELECT * FROM lake.\`bronze_sdi.${table}\``,
  );
}

/** Alias: di lakehouse tak ada snapshot terpisah, selalu baca mentah. */
export const rowsFor = rowsForRaw;

/** Baris dataset dipaginasi + pencarian teks (route SDI detail). */
export async function rowsPage(
  slug: string, offset: number, limit: number, search: string,
): Promise<{ rows: Record<string, unknown>[]; count: number }> {
  const table = await tableFor(slug);
  if (!table || !(await bronzeAda()).has(table)) return { rows: [], count: 0 };
  const ref = `lake.\`bronze_sdi.${table}\``;
  // Pencarian teks: setara record.data::text ILIKE '%q%' lama. toString(tuple(*))
  // menyerialisasi seluruh kolom baris jadi satu string yang bisa dicari.
  const filter = search
    ? `WHERE positionCaseInsensitive(toString(tuple(*)), {q:String}) > 0`
    : "";
  const params: Record<string, unknown> = search ? { q: search } : {};
  const rows = await q<Record<string, unknown>>(
    `SELECT * FROM ${ref} ${filter} LIMIT {limit:UInt32} OFFSET {offset:UInt32}`,
    { ...params, limit, offset },
  );
  const cnt = await q<{ c: string }>(
    `SELECT toString(count()) AS c FROM ${ref} ${filter}`,
    params,
  );
  return { rows, count: Number(cnt[0]?.c ?? 0) };
}

function safeJsonArray(s: string): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

/** Peta slug→tier untuk beberapa dataset (badge primer/sekunder). */
export async function tiers(slugs: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!slugs.length) return map;
  const rows = await q<{ slug: string; tier: string }>(
    `SELECT slug, tier FROM lake.\`bronze_meta.dataset_catalog\`
     WHERE slug IN {slugs:Array(String)}`,
    { slugs },
  );
  for (const r of rows) map.set(r.slug, r.tier);
  return map;
}
