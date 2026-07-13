import { NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { fetchSdiDetail } from "@/lib/sdi-fetch";

const { datasetColumn, record, datasetSync } = schema;

// Halaman dataset di-cache CDN Vercel (kecuali saat ada query pencarian).
const CDN_CACHE = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Detail + isi tabel satu dataset SDI — DI-PAGINASI (offset/limit) + pencarian
 * server (q) agar tidak menarik/merender 25k baris sekaligus.
 * Baca dari Neon dulu; kalau belum tersync, fallback fetch live SDI.
 *   ?offset=0&limit=50&q=term
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const url = new URL(req.url);
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(url.searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  const q = (url.searchParams.get("q") || "").trim();

  // 1) Coba dari DB.
  try {
    const cols = await db
      .select()
      .from(datasetColumn)
      .where(eq(datasetColumn.slug, slug))
      .orderBy(asc(datasetColumn.ordinal));

    if (cols.length) {
      const cond = q
        ? and(
            eq(record.slug, slug),
            sql`${record.data}::text ILIKE ${"%" + q + "%"}`
          )
        : eq(record.slug, slug);

      const pageRows = await db
        .select({ data: record.data })
        .from(record)
        .where(cond)
        .orderBy(asc(record.ordinal))
        .limit(limit)
        .offset(offset);

      const [{ cnt }] = await db
        .select({ cnt: sql<number>`count(*)::int` })
        .from(record)
        .where(cond);

      const sync = await db
        .select()
        .from(datasetSync)
        .where(eq(datasetSync.slug, slug));

      return NextResponse.json(
        {
          source: "db",
          slug,
          title: sync[0]?.title ?? slug,
          description: sync[0]?.description ?? "",
          sumberData: sync[0]?.sumberData ?? [],
          frekuensi: sync[0]?.frekuensi ?? null,
          satuan: sync[0]?.satuan ?? null,
          klasifikasi: sync[0]?.klasifikasi ?? null,
          kontak: sync[0]?.kontak ?? null,
          author: sync[0]?.author ?? null,
          columns: cols.map((c) => ({ key: c.key, desc: c.description, type: c.type })),
          rows: pageRows.map((r) => r.data),
          total: sync[0]?.total ?? cnt, // total dataset penuh
          count: cnt, // total yang cocok filter q (untuk paginasi)
          offset,
          limit,
        },
        { headers: q ? undefined : CDN_CACHE }
      );
    }
  } catch {
    // DB error → jatuh ke fallback live di bawah.
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
            String(v ?? "").toLowerCase().includes(term)
          )
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
      { status: 502 }
    );
  }
}
