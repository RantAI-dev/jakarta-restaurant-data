/**
 * Isi datamart / reporting: sync dataset PRIMER SDI yang dipakai indikator
 * GCI/GPCI ke DB (record + datasetSync), lalu bangun ulang report snapshot.
 * Aman untuk self-host (DB lokal, tanpa biaya egress Neon).
 *
 *   npx tsx scripts/db-fill-datamart.ts        # hanya dataset yg dibutuhkan indikator
 *   npx tsx scripts/db-fill-datamart.ts all    # semua dataset primer di katalog
 */
import { db, schema } from "../lib/db";
import { INDICATORS } from "../lib/gci/indicators";
import { syncDataset } from "../lib/sync";
import { buildReports } from "../lib/report";

async function neededSlugs(): Promise<string[]> {
  const cat = await db
    .select({ slug: schema.dataset.slug, title: schema.dataset.title, tier: schema.dataset.tier })
    .from(schema.dataset);
  if (process.argv[2] === "all") {
    return cat.filter((d) => d.tier === "primer").map((d) => d.slug);
  }
  const need = new Set<string>();
  for (const ind of INDICATORS) {
    if (!ind.match?.length) continue;
    for (const d of cat) {
      if (d.tier === "primer" && ind.match.some((kw) => d.title.toLowerCase().includes(kw)))
        need.add(d.slug);
    }
  }
  return [...need];
}

async function main() {
  const slugs = await neededSlugs();
  console.log(`Sync ${slugs.length} dataset primer → DB (fill datamart)…`);
  let ok = 0,
    rows = 0,
    fail = 0;
  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    try {
      const n = await syncDataset(slug);
      ok++;
      rows += n;
      console.log(`  [${i + 1}/${slugs.length}] ✓ ${n.toString().padStart(6)} baris  ${slug.slice(0, 60)}`);
    } catch (e) {
      fail++;
      console.log(`  [${i + 1}/${slugs.length}] ✗ ${String(e).slice(0, 80)}  ${slug.slice(0, 50)}`);
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  console.log(`Sync selesai: ${ok} ok / ${fail} gagal, total ${rows} baris.`);
  console.log("Bangun report snapshot…");
  const rep = await buildReports();
  console.log(`Report: readiness=${rep.readiness} indikator, rows-snapshot=${rep.datasets} dataset.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
