/**
 * Seed dataset sekunder "Jumlah Pengunjung Event Jakarta 2026" (hasil geocode
 * kolom lokasi → alamat/lat/lon + sumber) ke DB platform, sehingga muncul di
 * katalog /sdi dan punya halaman detail internal /sdi/<slug>.
 *
 *   npx tsx --env-file=.env scripts/db-seed-event-visitors.ts
 *
 * Idempoten: hapus baris slug ini dulu, lalu insert ulang.
 */
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SLUG = "jumlah-pengunjung-event-2026";
const TITLE = "Jumlah Pengunjung Event Jakarta 2026";
const DESCRIPTION =
  "Jumlah pengunjung event pariwisata & ekraf DKI Jakarta (Semester I 2026). " +
  "Kolom lokasi diperkaya dengan alamat, titik koordinat (lat/lon), dan sumber " +
  "alamat via geocoding (OpenStreetMap + penelusuran web bersumber).";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL belum di-set (lihat .env).");
const sql = postgres(url, { prepare: false });

type Col = { key: string; label: string; type: string; description: string | null };
type Data = { columns: Col[]; rows: Record<string, unknown>[] };

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  const file = join(process.cwd(), "data", "event-visitors-2026.json");
  const { columns, rows } = JSON.parse(readFileSync(file, "utf8")) as Data;

  // Bersihkan entri lama untuk slug ini (idempoten).
  await sql`DELETE FROM dataset_column WHERE slug = ${SLUG}`;
  await sql`DELETE FROM record WHERE slug = ${SLUG}`;

  // Kolom bermakna dataset.
  const colValues = columns.map((c, i) => ({
    slug: SLUG,
    key: c.key,
    label: c.label,
    type: c.type,
    description: c.description,
    ordinal: i,
  }));
  await sql`INSERT INTO dataset_column ${sql(
    colValues,
    "slug",
    "key",
    "label",
    "type",
    "description",
    "ordinal"
  )}`;

  // Baris data.
  let ord = 0;
  for (const batch of chunk(rows, 500)) {
    const values = batch.map((r) => ({
      slug: SLUG,
      ordinal: ord++,
      data: sql.json(r as never),
    }));
    await sql`INSERT INTO record ${sql(values, "slug", "ordinal", "data")}`;
  }

  // Metadata sync (dibaca halaman detail).
  await sql`
    INSERT INTO dataset_sync (slug, title, description, satuan, frekuensi, klasifikasi, kontak, author, sumber_data, total, synced_at)
    VALUES (
      ${SLUG}, ${TITLE}, ${DESCRIPTION}, ${"pengunjung"}, ${"Semesteran"},
      ${"Pariwisata"}, ${null}, ${"Dinas Pariwisata & Ekonomi Kreatif DKI Jakarta"},
      ${sql.json(["Dinas Pariwisata & Ekonomi Kreatif DKI Jakarta", "Geocode: OpenStreetMap + penelusuran web"] as never)},
      ${rows.length}, now()
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      satuan = EXCLUDED.satuan,
      frekuensi = EXCLUDED.frekuensi,
      klasifikasi = EXCLUDED.klasifikasi,
      author = EXCLUDED.author,
      sumber_data = EXCLUDED.sumber_data,
      total = EXCLUDED.total,
      synced_at = now()`;

  // Entri katalog (tier sekunder) — untuk kelengkapan/searchability.
  await sql`
    INSERT INTO dataset (slug, sdi_id, tier, title, description, tags, source, views, dataset_count, created_at, updated_at)
    VALUES (
      ${SLUG}, ${null}, ${"sekunder"}, ${TITLE}, ${DESCRIPTION},
      ${sql.json(["event", "pengunjung", "pariwisata", "geocoded", "sekunder"] as never)},
      ${"Dinas Pariwisata & Ekraf DKI Jakarta"}, ${0}, ${1}, ${null}, ${null}
    )
    ON CONFLICT (slug) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      tags = EXCLUDED.tags,
      source = EXCLUDED.source`;

  console.log(`Seeded '${SLUG}': ${columns.length} kolom, ${rows.length} baris.`);
}

main()
  .then(() => sql.end())
  .then(() => process.exit(0))
  .catch(async (e) => {
    console.error(e);
    await sql.end().catch(() => {});
    process.exit(1);
  });
