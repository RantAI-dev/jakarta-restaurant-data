import { NextResponse } from "next/server";
import * as store from "@/lib/ch/store";

const CDN_CACHE = {
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
};

/**
 * Lapisan medallion tiap dataset — dihitung langsung dari keadaan lakehouse:
 *   bronze = tersalin apa adanya ke lake, belum punya model bertipe
 *   silver = punya model bersih & bertipe (yang ditampilkan di halaman dataset)
 *   gold   = sudah dipakai mart penyaji dashboard (serving.mart_*)
 *
 * Kunci respons: slug dataset katalog + nama tabel berkas Atlas.
 */
export async function GET() {
  try {
    const [bySlug, byTable] = await Promise.all([
      store.medallion(),
      store.medallionForTables(Object.values(store.ATLAS_TABLES)),
    ]);

    const datasets: Record<string, { level: string; mart?: string }> = {};
    for (const [slug, info] of bySlug) datasets[slug] = { level: info.level, mart: info.mart };

    // Dataset lokal halaman Atlas → dipetakan lewat nama tabel berkasnya di lake.
    for (const [id, table] of Object.entries(store.ATLAS_TABLES)) {
      const info = byTable.get(table);
      if (info) datasets[id] = { level: info.level, mart: info.mart };
    }

    const counts = { bronze: 0, silver: 0, gold: 0 } as Record<string, number>;
    for (const v of Object.values(datasets)) counts[v.level] = (counts[v.level] ?? 0) + 1;

    return NextResponse.json(
      { source: "lakehouse", counts, datasets },
      { headers: CDN_CACHE },
    );
  } catch (e) {
    return NextResponse.json(
      { source: "lakehouse", counts: {}, datasets: {}, error: String(e) },
      { status: 503 },
    );
  }
}
