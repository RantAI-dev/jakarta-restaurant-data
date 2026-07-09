import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { SDI_DATASETS, fetchSdiLive, type SdiDataset } from "@/lib/sdi";

const { dataset } = schema;

/**
 * Katalog dataset primer Dinas Pariwisata.
 * Default: baca dari DB (tabel dataset). Fallback: snapshot statis.
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
      return NextResponse.json({
        source: "live",
        count: datasets.length,
        datasets,
      });
    } catch {
      clearTimeout(timer);
      // jatuh ke DB / statis di bawah
    }
  }

  // Baca dari DB.
  try {
    const rows = await db
      .select()
      .from(dataset)
      .where(eq(dataset.tier, "primer"))
      .orderBy(desc(dataset.updatedAt));
    if (rows.length) {
      const datasets: SdiDataset[] = rows.map((r) => ({
        id: r.sdiId ?? 0,
        title: r.title,
        description: r.description ?? "",
        slug: r.slug,
        tags: r.tags ?? [],
        views: r.views,
        datasetCount: r.datasetCount,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
      return NextResponse.json({ source: "db", count: datasets.length, datasets });
    }
  } catch {
    // jatuh ke statis
  }

  return NextResponse.json({
    source: "snapshot",
    count: SDI_DATASETS.length,
    datasets: SDI_DATASETS,
  });
}