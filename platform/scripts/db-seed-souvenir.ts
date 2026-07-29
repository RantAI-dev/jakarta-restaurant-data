/**
 * Seed dataset sekunder "Toko Suvenir Jakarta (TripAdvisor)" ke DB platform,
 * sehingga muncul di katalog /sdi dan punya halaman detail internal /sdi/<slug>.
 *
 *   npx tsx --env-file=.env scripts/db-seed-souvenir.ts
 *
 * Idempoten: hapus baris slug ini dulu, lalu insert ulang.
 * Sumber data: data/souvenir-tripadvisor-2026.json (dibangun oleh
 * scripts/build-souvenir.ts dari data-souvenir-GCI-jakarta.tsv).
 */
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const SLUG = "toko-suvenir-tripadvisor-2026";
const TITLE = "Toko Suvenir Jakarta (TripAdvisor)";
const DESCRIPTION =
  "Toko suvenir, oleh-oleh, dan kerajinan di DKI Jakarta yang terdaftar di " +
  "TripAdvisor (kategori Shopping: Gift & Specialty Shops, Antique Stores, " +
  "Flea & Street Markets). Alamat, koordinat, telepon, rating dan jumlah " +
  "ulasan bersumber dari halaman detail TripAdvisor; kolom relevansi suvenir, " +
  "produk utama, kota/kecamatan dan status operasional diverifikasi lewat " +
  "penelusuran sumber terbuka. Mendukung indikator GPCI CI-SH (daya tarik belanja).";

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
  const file = join(process.cwd(), "data", "souvenir-tripadvisor-2026.json");
  const { columns, rows } = JSON.parse(readFileSync(file, "utf8")) as Data;

  // Bersihkan entri lama untuk slug ini (idempoten).
  await sql`DELETE FROM dataset_column WHERE slug = ${SLUG}`;
  await sql`DELETE FROM record WHERE slug = ${SLUG}`;

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

  let ord = 0;
  for (const batch of chunk(rows, 500)) {
    const values = batch.map((r) => ({
      slug: SLUG,
      ordinal: ord++,
      data: sql.json(r as never),
    }));
    await sql`INSERT INTO record ${sql(values, "slug", "ordinal", "data")}`;
  }

  await sql`
    INSERT INTO dataset_sync (slug, title, description, satuan, frekuensi, klasifikasi, kontak, author, sumber_data, total, synced_at)
    VALUES (
      ${SLUG}, ${TITLE}, ${DESCRIPTION}, ${"toko"}, ${"Ad-hoc"},
      ${"Pariwisata"}, ${null}, ${"Dinas Pariwisata & Ekonomi Kreatif DKI Jakarta"},
      ${sql.json([
        "TripAdvisor (geo g294229 Jakarta, kategori Shopping c26)",
        "Verifikasi: penelusuran sumber terbuka (Google Maps, situs/IG toko, artikel berita)",
      ] as never)},
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

  await sql`
    INSERT INTO dataset (slug, sdi_id, tier, title, description, tags, source, views, dataset_count, created_at, updated_at)
    VALUES (
      ${SLUG}, ${null}, ${"sekunder"}, ${TITLE}, ${DESCRIPTION},
      ${sql.json([
        "suvenir",
        "oleh-oleh",
        "kerajinan",
        "belanja",
        "tripadvisor",
        "gpci",
        "sekunder",
      ] as never)},
      ${"TripAdvisor + verifikasi Dispar"}, ${0}, ${1}, ${null}, ${null}
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
