import { NextResponse } from "next/server";
import { SDI_DATASETS, fetchSdiLive } from "@/lib/sdi";

/**
 * Katalog dataset Dinas Pariwisata & Ekonomi Kreatif dari Satu Data Jakarta.
 *
 * GET            → snapshot statis (cepat, selalu tersedia).
 * GET ?live=1    → refresh on-demand langsung dari API SDI.
 */
export async function GET(req: Request) {
  const live = new URL(req.url).searchParams.get("live");
  if (!live) {
    return NextResponse.json({
      source: "snapshot",
      count: SDI_DATASETS.length,
      datasets: SDI_DATASETS,
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const datasets = await fetchSdiLive(controller.signal);
    clearTimeout(timer);
    return NextResponse.json({
      source: "live",
      fetchedAt: new Date().toISOString(),
      count: datasets.length,
      datasets,
    });
  } catch {
    clearTimeout(timer);
    return NextResponse.json({
      source: "snapshot-fallback",
      count: SDI_DATASETS.length,
      datasets: SDI_DATASETS,
    });
  }
}
