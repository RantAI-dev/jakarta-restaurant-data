import { NextResponse } from "next/server";
import { fetchSdiDetail } from "@/lib/sdi-fetch";
import * as store from "@/lib/ch/store";

const CDN_CACHE = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Detail + isi tabel satu dataset SDI — dipaginasi (offset/limit) + pencarian
 * server (q). Baca dari lakehouse dulu; fallback fetch live SDI bila belum ada.
 *   ?offset=0&limit=50&q=term
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
  );
  const q = (url.searchParams.get("q") || "").trim();

  // 1) Coba dari lakehouse.
  try {
    const cols = await store.columns(slug);
    if (cols.length) {
      const { rows, count } = await store.rowsPage(slug, offset, limit, q);
      const sync = await store.sync(slug);
      return NextResponse.json(
        {
          source: "lakehouse",
          slug,
          title: sync?.title ?? slug,
          description: sync?.description ?? "",
          sumberData: sync?.sumberData ?? [],
          frekuensi: sync?.frekuensi ?? null,
          satuan: sync?.satuan ?? null,
          klasifikasi: sync?.klasifikasi ?? null,
          kontak: sync?.kontak ?? null,
          author: sync?.author ?? null,
          columns: cols.map((c) => ({ key: c.key, desc: c.description, type: c.type })),
          rows,
          total: sync?.total ?? count,
          count,
          offset,
          limit,
        },
        { headers: q ? undefined : CDN_CACHE },
      );
    }
  } catch {
    // lakehouse error → fallback live
  }

  // 2) Fallback: fetch live dari SDI (paginasi di memori).
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const d = await fetchSdiDetail(slug, controller.signal);
    clearTimeout(timer);
    const term = q.toLowerCase();
    const all = term
      ? d.rows.filter((r) =>
          Object.values(r as Record<string, unknown>).some((v) =>
            String(v ?? "").toLowerCase().includes(term),
          ),
        )
      : d.rows;
    return NextResponse.json({
      source: "live",
      slug,
      title: d.title,
      description: d.description,
      sumberData: d.sumberData,
      frekuensi: d.frekuensi,
      satuan: d.satuan,
      klasifikasi: d.klasifikasi,
      kontak: d.kontak,
      author: d.author,
      columns: d.columns.map((c) => ({ key: c.key, desc: c.description, type: c.type })),
      rows: all.slice(offset, offset + limit),
      total: d.total,
      count: all.length,
      offset,
      limit,
    });
  } catch (e) {
    clearTimeout(timer);
    return NextResponse.json(
      { error: "Gagal mengambil data dari SDI", detail: String(e) },
      { status: 502 },
    );
  }
}
