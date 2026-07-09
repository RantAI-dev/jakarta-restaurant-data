import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";
import { SDI_DATASETS } from "../lib/sdi";

const { dataset } = schema;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  await db.delete(dataset).where(eq(dataset.tier, "primer"));
  const rows = SDI_DATASETS.map((d) => ({
    slug: d.slug,
    sdiId: d.id,
    tier: "primer" as const,
    title: d.title,
    description: d.description,
    tags: d.tags,
    source: "SDI · Satu Data Jakarta",
    views: d.views,
    datasetCount: d.datasetCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
  for (const batch of chunk(rows, 200)) {
    await db.insert(dataset).values(batch);
  }
  console.log(`Seeded ${rows.length} dataset primer ke tabel dataset.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });