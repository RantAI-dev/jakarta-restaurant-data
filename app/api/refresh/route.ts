import { NextResponse } from "next/server";
import { RESTAURANTS } from "@/lib/restaurants";

/**
 * Lightweight liveness check for the public source URLs that back the
 * directory. Hits each unique source with HEAD and reports how many are
 * still reachable. This lets the dashboard confirm in real time that the
 * underlying citations are still valid without re-scraping content.
 */
export async function GET() {
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const r of RESTAURANTS) {
    for (const s of r.sources) {
      if (!seen.has(s.url)) {
        seen.add(s.url);
        urls.push(s.url);
      }
    }
  }

  // Use GET (not HEAD) — many publisher sites (TripAdvisor, Chope, etc.)
  // reject HEAD with 4xx, which would misreport them as dead. We abort the
  // response body immediately after the headers arrive so we don't actually
  // download the page.
  const results = await Promise.all(
    urls.map(async (url) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const r = await fetch(url, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (compatible; DinasPariwisataDirectoryBot/1.0)",
            Accept: "text/html,application/xhtml+xml",
          },
        });
        controller.abort();
        clearTimeout(timer);
        return { url, ok: r.ok, status: r.status };
      } catch {
        clearTimeout(timer);
        return { url, ok: false, status: 0 };
      }
    })
  );

  const reachable = results.filter((r) => r.ok).length;

  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    totalSources: urls.length,
    reachable,
    message: `${reachable}/${urls.length} source URLs reachable just now.`,
    results,
  });
}
