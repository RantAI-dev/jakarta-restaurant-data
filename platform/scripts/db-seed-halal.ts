/**
 * Seed 6 dataset sekunder "Wisata Ramah Muslim / Halal" DKI Jakarta ke DB platform.
 * Sumber = crawl web bersumber (BPJPH/LPPOM MUI, situs resmi, media) + geocode OSM.
 *
 *   npx tsx --env-file=.env.local scripts/db-seed-halal.ts
 *
 * Idempoten per-slug. Mengisi dataset_column + record + dataset_sync + baris katalog (tier sekunder).
 */
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const FILES = [
  { file: "halal-restoran-halal.json", satuan: "restoran", tags: ["halal", "restoran", "kuliner", "ramah-muslim", "sekunder"] },
  { file: "halal-hotel-ramah-muslim.json", satuan: "hotel", tags: ["halal", "hotel", "ramah-muslim", "pariwisata", "sekunder"] },
  { file: "halal-inovasi-ramah-muslim.json", satuan: "program", tags: ["halal", "inovasi", "program", "ramah-muslim", "sekunder"] },
  { file: "halal-mall-fasilitas-halal.json", satuan: "mall", tags: ["halal", "mall", "fasilitas", "ramah-muslim", "sekunder"] },
  { file: "halal-rph-halal.json", satuan: "RPH", tags: ["halal", "rph", "ramah-muslim", "sekunder"] },
  { file: "halal-produk-kreatif-halal.json", satuan: "produk", tags: ["halal", "produk", "ekraf", "kuliner", "sekunder"] },
];

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum di-set (lihat .env.local).");
const sql = postgres(url, { prepare: false });

type Col = { key: string; label: string; type: string; description: string | null };
type DS = { slug: string; title: string; description: string; columns: Col[]; rows: Record<string, unknown>[] };

function chunk<T>(a: T[], n: number): T[][] {
  const o: T[][] = [];
  for (let i = 0; i < a.length; i += n) o.push(a.slice(i, i + n));
  return o;
}

async function seedOne(ds: DS, satuan: string, tags: string[]) {
  const { slug, title, description, columns, rows } = ds;
  await sql`DELETE FROM dataset_column WHERE slug = ${slug}`;
  await sql`DELETE FROM record WHERE slug = ${slug}`;

  const cols = columns.map((c, i) => ({ slug, key: c.key, label: c.label, type: c.type, description: c.description, ordinal: i }));
  await sql`INSERT INTO dataset_column ${sql(cols, "slug", "key", "label", "type", "description", "ordinal")}`;

  let ord = 0;
  for (const batch of chunk(rows, 500)) {
    const values = batch.map((r) => ({ slug, ordinal: ord++, data: sql.json(r as never) }));
    await sql`INSERT INTO record ${sql(values, "slug", "ordinal", "data")}`;
  }

  const sumber = ["Crawl web bersumber: BPJPH / LPPOM MUI, situs resmi, media", "Geocode: OpenStreetMap / Nominatim"];
  await sql`
    INSERT INTO dataset_sync (slug, title, description, satuan, frekuensi, klasifikasi, kontak, author, sumber_data, total, synced_at)
    VALUES (${slug}, ${title}, ${description}, ${satuan}, ${"Insidental"}, ${"Pariwisata"}, ${null},
      ${"Dinas Pariwisata & Ekonomi Kreatif DKI Jakarta"}, ${sql.json(sumber as never)}, ${rows.length}, now())
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, description = EXCLUDED.description, satuan = EXCLUDED.satuan,
      frekuensi = EXCLUDED.frekuensi, klasifikasi = EXCLUDED.klasifikasi, author = EXCLUDED.author,
      sumber_data = EXCLUDED.sumber_data, total = EXCLUDED.total, synced_at = now()`;

  await sql`
    INSERT INTO dataset (slug, sdi_id, tier, title, description, tags, source, views, dataset_count, created_at, updated_at)
    VALUES (${slug}, ${null}, ${"sekunder"}, ${title}, ${description}, ${sql.json(tags as never)},
      ${"Dinas Pariwisata & Ekraf DKI Jakarta"}, ${0}, ${1}, ${null}, ${null})
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title, description = EXCLUDED.description, tags = EXCLUDED.tags, source = EXCLUDED.source`;

  console.log(`  ${slug}: ${columns.length} kolom, ${rows.length} baris`);
}

async function main() {
  for (const f of FILES) {
    const ds = JSON.parse(readFileSync(join(process.cwd(), "data", f.file), "utf8")) as DS;
    await seedOne(ds, f.satuan, f.tags);
  }
  console.log(`Selesai seed ${FILES.length} dataset halal.`);
}

main()
  .then(() => sql.end())
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error(e);
    await sql.end().catch(() => {});
    process.exit(1);
  });
