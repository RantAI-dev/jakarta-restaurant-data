import { q } from "./client";

/**
 * Primitif data lakehouse — pengganti tabel Postgres lama (dataset/datasetSync/
 * datasetColumn/record). Bentuk kembalian identik dengan drizzle lama.
 *
 * Dua sumber metadata di-UNION:
 *   bronze_meta.*      — dataset primer SDI (tier=primer)
 *   bronze_meta_sec.*  — dataset sekunder olahan (tier=sekunder)
 *
 * BARIS diambil dari lapisan SILVER (processed: bertipe, dibersihkan) —
 * `silver.<table_name>` — bukan Bronze mentah. Itulah yang ditampilkan.
 */

const META = "lake.`bronze_meta.dataset_catalog`";
const META_SEC = "lake.`bronze_meta_sec.dataset_catalog`";
const SYNC = "lake.`bronze_meta.dataset_sync`";
const SYNC_SEC = "lake.`bronze_meta_sec.dataset_sync`";
const COL = "lake.`bronze_meta.dataset_column`";
const COL_SEC = "lake.`bronze_meta_sec.dataset_column`";

export type CatalogRow = {
  slug: string; title: string; description: string; tags: string[];
  views: number; updated_at: string | null; tier: string; table_name: string;
};

/** Katalog SEMUA dataset (primer + sekunder). */
export async function catalog(): Promise<CatalogRow[]> {
  const rows = await q<{
    slug: string; title: string; description: string; tags: string;
    views: string; updated_at: string; tier: string; table_name: string;
  }>(
    `SELECT slug, title, description, tags, toString(views) AS views, updated_at, tier, table_name FROM ${META}
     UNION ALL
     SELECT slug, title, description, tags, toString(views) AS views, updated_at, tier, table_name FROM ${META_SEC}`,
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

/** Metadata satu dataset (cari di primer, lalu sekunder). */
export async function sync(slug: string): Promise<SyncRow | null> {
  const rows = await q<Record<string, string>>(
    `SELECT slug, title, description, sumber_data, frekuensi, satuan, klasifikasi,
            kontak, author, toString(total) AS total, table_name FROM ${SYNC} WHERE slug={slug:String}
     UNION ALL
     SELECT slug, title, description, sumber_data, frekuensi, satuan, klasifikasi,
            kontak, author, toString(total) AS total, table_name FROM ${SYNC_SEC} WHERE slug={slug:String}
     LIMIT 1`,
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

/** Map slug→total untuk SEMUA dataset (readiness). */
export async function syncTotals(): Promise<Map<string, number>> {
  const rows = await q<{ slug: string; total: string }>(
    `SELECT slug, toString(total) AS total FROM ${SYNC}
     UNION ALL SELECT slug, toString(total) AS total FROM ${SYNC_SEC}`,
  );
  return new Map(rows.map((r) => [r.slug, Number(r.total) || 0]));
}

export type ColumnDef = { key: string; description: string | null; type: string | null; ordinal: number };

/** Definisi kolom satu dataset (primer lalu sekunder). */
export async function columns(slug: string): Promise<ColumnDef[]> {
  const rows = await q<{ key_asli: string; deskripsi: string; tipe: string; ord: string }>(
    `SELECT key_asli, deskripsi, tipe, toString(ord) AS ord FROM ${COL} WHERE slug={slug:String}
     UNION ALL
     SELECT key_asli, deskripsi, tipe, toString(ord) AS ord FROM ${COL_SEC} WHERE slug={slug:String}
     ORDER BY ord`,
    { slug },
  );
  return rows.map((r) => ({
    key: r.key_asli, description: r.deskripsi || null,
    type: r.tipe || null, ordinal: Number(r.ord) || 0,
  }));
}

/** Peta slug→Set(kunci) beberapa dataset (primer + sekunder). */
export async function columnKeys(slugs: string[]): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  if (!slugs.length) return map;
  const rows = await q<{ slug: string; key_asli: string }>(
    `SELECT slug, key_asli FROM ${COL} WHERE slug IN {slugs:Array(String)}
     UNION ALL SELECT slug, key_asli FROM ${COL_SEC} WHERE slug IN {slugs:Array(String)}`,
    { slugs },
  );
  for (const c of rows) {
    let set = map.get(c.slug);
    if (!set) map.set(c.slug, (set = new Set()));
    set.add(c.key_asli);
  }
  return map;
}

/** Peta slug→tier (primer + sekunder). */
export async function tiers(slugs: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!slugs.length) return map;
  const rows = await q<{ slug: string; tier: string }>(
    `SELECT slug, tier FROM ${META} WHERE slug IN {slugs:Array(String)}
     UNION ALL SELECT slug, tier FROM ${META_SEC} WHERE slug IN {slugs:Array(String)}`,
    { slugs },
  );
  for (const r of rows) map.set(r.slug, r.tier);
  return map;
}

/** table_name (nama tabel Silver/Bronze) untuk sebuah slug. */
async function tableFor(slug: string): Promise<string | null> {
  const rows = await q<{ table_name: string }>(
    `SELECT table_name FROM ${META} WHERE slug={slug:String}
     UNION ALL SELECT table_name FROM ${META_SEC} WHERE slug={slug:String} LIMIT 1`,
    { slug },
  );
  return rows[0]?.table_name ?? null;
}

/** Tabel Silver yang tersedia (baris ditampilkan dari sini = processed). */
let _silverCache: Set<string> | null = null;
async function silverAda(): Promise<Set<string>> {
  if (_silverCache) return _silverCache;
  const rows = await q<{ name: string }>(`SHOW TABLES FROM silver`);
  _silverCache = new Set(rows.map((r) => r.name));
  return _silverCache;
}

/* ── Medallion (Bronze / Silver / Gold) ──────────────────────────────────── */

export type Medallion = "bronze" | "silver" | "gold";
export type MedallionInfo = {
  level: Medallion;
  /** Nama tabel di lake (Bronze/Silver). */
  table: string;
  /** Mart penyaji yang memakai dataset ini (hanya untuk level "gold"). */
  mart?: string;
};

/**
 * Sumber tiap mart Gold → tabel dasar yang mengisinya.
 *
 * Diturunkan dari SQL lakehouse (satu-satunya tempat mart dibangun):
 *   lakehouse/clickhouse/sql/20-silver-wisman.sql   → silver.wisman
 *   lakehouse/clickhouse/sql/21-silver-curated.sql  → silver.restoran / kunjungan_dtw / event
 *   lakehouse/clickhouse/sql/22-silver-atlas.sql    → silver.atlas
 *   lakehouse/clickhouse/sql/11-dim-more.sql        → silver.dim_indikator
 *   lakehouse/clickhouse/sql/{30,31}-gold*.sql      → serving.mart_*
 *
 * Ditulis eksplisit (bukan dibaca dari system.tables) karena akun app bersifat
 * readonly + query-cache: membaca system.* ditolak ClickHouse. Keberadaan mart
 * dan tabel Silver-nya tetap diverifikasi ke server sebelum diklaim "gold".
 */
const GOLD_SOURCES: Record<string, string[]> = {
  mart_wisman: [
    "data_jumlah_kunjungan_dan_ranking_wisatawan_mancanegara_ke_provinsi_dki_jakarta_melalui_pintu_soekarno_hatta_berdasarkan_kebangsaan",
  ],
  mart_kuliner: ["data_usaha_jasa_makanan_dan_minuman_jenis_usaha_restoran_di_dki_jakarta"],
  mart_event: ["data_event_pariwisata_dan_kebudayaan_dki_jakarta_2011_2019"],
  mart_kunjungan_dtw: ["kunjungan_31_dtw_juli_2026_sumber_mentah"],
  mart_atlas: ["atlas_restoran", "atlas_souvenir", "atlas_nightlife", "atlas_pertunjukan"],
  mart_gci_readiness: ["gci_gpci_indicators"],
};

/** Mart penyaji yang benar-benar ada di lakehouse. */
let _servingCache: Set<string> | null = null;
async function servingAda(): Promise<Set<string>> {
  if (_servingCache) return _servingCache;
  const rows = await q<{ name: string }>(`SHOW TABLES FROM serving`);
  _servingCache = new Set(rows.map((r) => r.name));
  return _servingCache;
}

/**
 * Peta slug → lapisan medallion tertinggi yang sudah dicapai dataset:
 *   bronze — baru tersalin apa adanya ke lake (belum punya model bertipe),
 *   silver — sudah punya model bersih & bertipe (inilah yang ditampilkan),
 *   gold   — sudah dipakai mart penyaji dashboard.
 */
export async function medallion(): Promise<Map<string, MedallionInfo>> {
  const [rows, silver, serving] = await Promise.all([catalog(), silverAda(), servingAda()]);

  // tabel dasar → mart yang memakainya (hanya mart yang benar-benar ada)
  const goldOf = new Map<string, string>();
  for (const [mart, sources] of Object.entries(GOLD_SOURCES)) {
    if (!serving.has(mart)) continue;
    for (const t of sources) if (!goldOf.has(t)) goldOf.set(t, mart);
  }

  const map = new Map<string, MedallionInfo>();
  for (const r of rows) {
    const table = r.table_name;
    if (!table) continue;
    const mart = goldOf.get(table);
    if (mart) map.set(r.slug, { level: "gold", table, mart });
    else if (silver.has(table)) map.set(r.slug, { level: "silver", table });
    else map.set(r.slug, { level: "bronze", table });
  }
  return map;
}

/**
 * Medallion untuk dataset lokal (halaman Atlas) yang datanya juga ada di lake
 * sebagai berkas Bronze. Kunci = id dataset sekunder pada lib/secondary.ts.
 * Dataset yang belum masuk lake sengaja tidak dipetakan (tidak diberi label).
 */
export const ATLAS_TABLES: Record<string, string> = {
  "sec-gci-resto": "atlas_restoran",
  "sec-events": "atlas_pertunjukan",
};

/** Medallion untuk tabel berkas Atlas (di luar katalog SDI). */
export async function medallionForTables(
  tables: string[],
): Promise<Map<string, MedallionInfo>> {
  const [silver, serving] = await Promise.all([silverAda(), servingAda()]);
  const goldOf = new Map<string, string>();
  for (const [mart, sources] of Object.entries(GOLD_SOURCES)) {
    if (!serving.has(mart)) continue;
    for (const t of sources) if (!goldOf.has(t)) goldOf.set(t, mart);
  }
  const map = new Map<string, MedallionInfo>();
  for (const table of tables) {
    const mart = goldOf.get(table);
    if (mart) map.set(table, { level: "gold", table, mart });
    else if (silver.has(table)) map.set(table, { level: "silver", table });
    else map.set(table, { level: "bronze", table });
  }
  return map;
}

/** Kolom audit lakehouse — disembunyikan dari tampilan. */
const AUDIT = new Set(["_ingested_at", "_source_url", "_batch_id", "_row_hash", "_tenant"]);
function stripAudit(r: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(r)) if (!AUDIT.has(k)) out[k] = r[k];
  return out;
}

/** Seluruh baris dataset dari SILVER (processed). */
export async function rowsForRaw(slug: string): Promise<Record<string, unknown>[]> {
  const table = await tableFor(slug);
  if (!table || !(await silverAda()).has(table)) return [];
  const rows = await q<Record<string, unknown>>(`SELECT * FROM silver.\`${table}\``);
  return rows.map(stripAudit);
}

export const rowsFor = rowsForRaw;

/** Baris dataset dipaginasi + pencarian teks, dari SILVER (processed). */
export async function rowsPage(
  slug: string, offset: number, limit: number, search: string,
): Promise<{ rows: Record<string, unknown>[]; count: number }> {
  const table = await tableFor(slug);
  if (!table || !(await silverAda()).has(table)) return { rows: [], count: 0 };
  const ref = `silver.\`${table}\``;
  const filter = search
    ? `WHERE positionCaseInsensitive(toString(tuple(*)), {q:String}) > 0`
    : "";
  const params: Record<string, unknown> = search ? { q: search } : {};
  const rows = await q<Record<string, unknown>>(
    `SELECT * FROM ${ref} ${filter} LIMIT {limit:UInt32} OFFSET {offset:UInt32}`,
    { ...params, limit, offset },
  );
  const cnt = await q<{ c: string }>(`SELECT toString(count()) AS c FROM ${ref} ${filter}`, params);
  return { rows: rows.map(stripAudit), count: Number(cnt[0]?.c ?? 0) };
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
