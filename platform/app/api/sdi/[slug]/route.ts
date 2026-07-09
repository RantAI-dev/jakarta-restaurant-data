import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { fetchSdiDetail } from "@/lib/sdi-fetch";

const { datasetColumn, record, datasetSync } = schema;

/**
 * Detail + isi tabel satu dataset SDI.
 * Baca dari Neon dulu; kalau dataset belum tersync, fallback fetch live SDI.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1) Coba dari DB.
  try {
    const cols = await db
      .select()
      .from(datasetColumn)
      .where(eq(datasetColumn.slug, slug))
      .orderBy(asc(datasetColumn.ordinal));

    if (cols.length) {
      const rows = await db
        .select()
        .from(record)
        .where(eq(record.slug, slug))
        .orderBy(asc(record.ordinal));
      const sync = await db
        .select()
        .from(datasetSync)
        .where(eq(datasetSync.slug, slug));

      return NextResponse.json({
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
        columns: cols.map((c) => ({
          key: c.key,
          desc: c.description,
          type: c.type,
        })),
        rows: rows.map((r) => r.data),
        total: sync[0]?.total ?? rows.length,
      });
    }
  } catch {
    // DB error → jatuh ke fallback live di bawah.
  }

  // 2) Fallback: fetch live dari SDI.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const d = await fetchSdiDetail(slug, controller.signal);
    clearTimeout(timer);
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
      columns: d.columns.map((c) => ({
        key: c.key,
        desc: c.description,
        type: c.type,
      })),
      rows: d.rows,
      total: d.total,
    });
  } catch (e) {
    clearTimeout(timer);
    return NextResponse.json(
      { error: "Gagal mengambil data dari SDI", detail: String(e) },
      { status: 502 }
    );
  }
}