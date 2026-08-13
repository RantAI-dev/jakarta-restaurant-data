import { NextResponse } from "next/server";
import { syncDataset } from "@/lib/sync";
import { SDI_DATASETS } from "@/lib/sdi";

export const maxDuration = 300;

/**
 * Trigger sync dataset SDI → DB via HTTP.
 * Auth: header `x-sync-secret` harus sama dengan env SYNC_SECRET.
 * Query: ?slug=<slug> untuk 1 dataset (default). ?slug=all untuk semua
 * (hati-hati durasi; di serverless batasi per-dataset).
 */
export async function POST(req: Request) {
  const secret = process.env.SYNC_SECRET;
  if (!secret || req.headers.get("x-sync-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) {
    return NextResponse.json({ error: "slug wajib diisi" }, { status: 400 });
  }

  const slugs =
    slug === "all" ? SDI_DATASETS.map((d) => d.slug) : [slug];
  const results: { slug: string; rows?: number; error?: string }[] = [];
  for (const s of slugs) {
    try {
      const rows = await syncDataset(s);
      results.push({ slug: s, rows });
    } catch (e) {
      results.push({ slug: s, error: String(e) });
    }
  }
  const ok = results.filter((r) => r.rows !== undefined).length;
  return NextResponse.json({ synced: ok, total: slugs.length, results });
}