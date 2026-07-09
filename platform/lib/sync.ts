import { db, schema } from "./db";
import { eq } from "drizzle-orm";
import { fetchSdiDetail } from "./sdi-fetch";

const { datasetColumn, record, datasetSync } = schema;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Sync satu dataset SDI ke DB: ganti kolom + baris + metadata. Idempoten. */
export async function syncDataset(slug: string): Promise<number> {
  const d = await fetchSdiDetail(slug);

  await db.delete(datasetColumn).where(eq(datasetColumn.slug, slug));
  await db.delete(record).where(eq(record.slug, slug));

  if (d.columns.length) {
    await db.insert(datasetColumn).values(
      d.columns.map((c, i) => ({
        slug,
        key: c.key,
        label: c.label,
        type: c.type,
        description: c.description,
        ordinal: i,
      }))
    );
  }

  if (d.rows.length) {
    let ord = 0;
    for (const batch of chunk(d.rows, 500)) {
      await db
        .insert(record)
        .values(batch.map((r) => ({ slug, ordinal: ord++, data: r })));
    }
  }

  const meta = {
    title: d.title,
    description: d.description,
    satuan: d.satuan,
    frekuensi: d.frekuensi,
    klasifikasi: d.klasifikasi ?? null,
    kontak: d.kontak ?? null,
    author: d.author ?? null,
    sumberData: d.sumberData,
    total: d.rows.length,
  };
  await db
    .insert(datasetSync)
    .values({ slug, ...meta })
    .onConflictDoUpdate({
      target: datasetSync.slug,
      set: { ...meta, syncedAt: new Date() },
    });

  return d.rows.length;
}