import { NextResponse } from "next/server";
import * as store from "@/lib/ch/store";

const CDN_CACHE = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Detail + isi tabel satu dataset — SUMBER TUNGGAL: lakehouse (bronze_meta +
 * lapisan silver). App TIDAK memanggil API SDI; kalau dataset belum ada di
 * lakehouse, kembalikan "belum tersedia" (pipeline yang mengisinya, terjadwal).
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

  try {
    const cols = await store.columns(slug);
    if (!cols.length) {
      return NextResponse.json(
        { source: "lakehouse", slug, error: "Dataset belum tersedia di lakehouse", columns: [], rows: [], total: 0, count: 0, offset, limit },
        { status: 404 },
      );
    }
    const { rows, count } = await store.rowsPage(slug, offset, limit, q);
    const sync = await store.sync(slug);
    const medal = (await store.medallion()).get(slug) ?? null;
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
        // Lapisan medallion (bronze/silver/gold) + mart penyaji bila sudah Gold.
        medallion: medal,
        columns: cols.map((c) => ({ key: c.key, desc: c.description, type: c.type })),
        rows,
        total: sync?.total ?? count,
        count,
        offset,
        limit,
      },
      { headers: q ? undefined : CDN_CACHE },
    );
  } catch (e) {
    return NextResponse.json(
      { error: "Gagal membaca dari lakehouse", detail: String(e) },
      { status: 503 },
    );
  }
}
