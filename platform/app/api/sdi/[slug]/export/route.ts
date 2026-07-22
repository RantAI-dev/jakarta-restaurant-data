import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { fetchSdiDetail } from "@/lib/sdi-fetch";
import * as XLSX from "xlsx";

const { datasetColumn, record, datasetSync } = schema;

// Export SELURUH baris satu dataset (tanpa paginasi) sebagai CSV atau XLSX.
//   /api/sdi/<slug>/export?format=csv|xlsx
// Baca dari DB dulu; kalau belum tersync, fallback fetch live SDI.
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const format = (new URL(req.url).searchParams.get("format") || "csv").toLowerCase();

  let columns: string[] = [];
  let rows: Record<string, unknown>[] = [];

  // 1) Dari DB (dataset sekunder + primer yang sudah tersync).
  try {
    const cols = await db
      .select({ key: datasetColumn.key })
      .from(datasetColumn)
      .where(eq(datasetColumn.slug, slug))
      .orderBy(asc(datasetColumn.ordinal));
    if (cols.length) {
      columns = cols.map((c) => c.key);
      const recs = await db
        .select({ data: record.data })
        .from(record)
        .where(eq(record.slug, slug))
        .orderBy(asc(record.ordinal));
      rows = recs.map((r) => r.data as Record<string, unknown>);
      // pastikan slug ada metadatanya (biar tidak salah 404 diam-diam)
      await db.select({ slug: datasetSync.slug }).from(datasetSync).where(eq(datasetSync.slug, slug));
    }
  } catch {
    /* jatuh ke live */
  }

  // 2) Fallback: live SDI (primer belum tersync).
  if (!columns.length) {
    try {
      const d = await fetchSdiDetail(slug);
      columns = d.columns.map((c) => c.key);
      rows = d.rows as Record<string, unknown>[];
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Dataset tidak ditemukan / gagal diambil", detail: String(e) }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  const cell = (r: Record<string, unknown>, k: string) => {
    const v = r[k];
    return v === null || v === undefined ? "" : v;
  };
  const aoa: unknown[][] = [columns, ...rows.map((r) => columns.map((k) => cell(r, k)))];

  if (format === "xlsx") {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    const buf: Buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${slug}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  }

  // CSV (default) — BOM UTF-8 agar Excel membaca aksen dengan benar.
  const esc = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = "﻿" + aoa.map((row) => row.map(esc).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
