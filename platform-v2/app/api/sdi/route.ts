import { NextResponse } from "next/server";
import { SDI_DATASETS, fetchSdiLive, type SdiDataset } from "@/lib/sdi";
import * as store from "@/lib/ch/store";

const CDN_CACHE = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

/**
 * Katalog dataset primer Dinas Pariwisata.
 * Default: baca dari lakehouse (bronze_meta.dataset_catalog). Fallback: snapshot.
 * ?live=1: refresh langsung dari API SDI (list).
 */
export async function GET(req: Request) {
  const live = new URL(req.url).searchParams.get("live");

  if (live) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const datasets = await fetchSdiLive(controller.signal);
      clearTimeout(timer);
      return NextResponse.json({ source: "live", count: datasets.length, datasets });
    } catch {
      clearTimeout(timer);
    }
  }

  try {
    // Hanya primer di list utama; sekunder tampil via kartu lib/secondary.ts.
    const rows = (await store.catalog()).filter((r) => r.tier === "primer");
    if (rows.length) {
      const datasets: SdiDataset[] = rows.map((r) => ({
        id: 0,
        title: r.title,
        description: r.description ?? "",
        slug: r.slug,
        tags: r.tags ?? [],
        views: r.views,
        datasetCount: 0,
        createdAt: null,
        updatedAt: r.updated_at,
      }));
      // Urut terbaru dulu, seperti v1 (orderBy updatedAt desc).
      datasets.sort((a, b) => String(b.updatedAt ?? "").localeCompare(String(a.updatedAt ?? "")));
      return NextResponse.json(
        { source: "lakehouse", count: datasets.length, datasets },
        { headers: CDN_CACHE },
      );
    }
  } catch {
    // jatuh ke statis
  }

  return NextResponse.json(
    { source: "snapshot", count: SDI_DATASETS.length, datasets: SDI_DATASETS },
    { headers: CDN_CACHE },
  );
}
