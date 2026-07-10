import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import {
  INDICATORS,
  READINESS_ORDER,
  type Indicator,
  type Readiness,
} from "./indicators";

const { dataset, datasetSync, datasetColumn, record } = schema;

export type IndicatorResult = Indicator & {
  /** Status efektif dari isi DB (di-cap oleh draftReadiness untuk proksi). */
  status: Readiness;
  datasets: { slug: string; title: string; total: number }[];
  latest: { label: string; value: number; datasetSlug: string } | null;
  /** Seri periode→nilai (maks 24 titik) untuk chart tren. */
  trend: { label: string; value: number }[];
};

const num = (v: unknown): number | null => {
  const s = String(v ?? "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/**
 * Hitung readiness semua indikator dari isi DB.
 * - Cocokkan indikator → dataset (by kata kunci judul).
 * - Status efektif = data-driven, TAPI tidak melebihi draftReadiness
 *   (indikator proksi tetap "partial" walau datanya ada).
 * - Tarik nilai terbaru dari dataset paling berisi.
 * Aman bila DB belum siap (semua jadi gap).
 */
export async function computeReadiness(): Promise<IndicatorResult[]> {
  let catalog: { slug: string; title: string }[] = [];
  let syncs: { slug: string; total: number | null }[] = [];
  try {
    catalog = await db
      .select({ slug: dataset.slug, title: dataset.title })
      .from(dataset);
    syncs = await db
      .select({ slug: datasetSync.slug, total: datasetSync.total })
      .from(datasetSync);
  } catch {
    // DB belum siap
  }
  const syncTotal = new Map(syncs.map((s) => [s.slug, s.total ?? 0]));

  const results: IndicatorResult[] = [];
  for (const ind of INDICATORS) {
    const matched = ind.match.length
      ? catalog.filter((d) =>
          ind.match.some((kw) => d.title.toLowerCase().includes(kw))
        )
      : [];
    const withData = matched
      .map((d) => ({ ...d, total: syncTotal.get(d.slug) ?? 0 }))
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total);

    let status: Readiness;
    if (matched.length === 0) status = "gap";
    else if (withData.length > 0) status = "ready";
    else status = "partial";
    // Jangan naikkan di atas draft (proksi tetap partial meski ada data).
    if (READINESS_ORDER[status] > READINESS_ORDER[ind.draftReadiness]) {
      status = ind.draftReadiness;
    }

    let latest: IndicatorResult["latest"] = null;
    let trend: IndicatorResult["trend"] = [];
    if (withData.length > 0) {
      try {
        latest = await latestValue(withData[0].slug, ind.measure);
        trend = await trendSeries(withData[0].slug, ind.measure);
      } catch {
        latest = null;
        trend = [];
      }
    }

    results.push({
      ...ind,
      status,
      datasets: withData
        .slice(0, 5)
        .map((d) => ({ slug: d.slug, title: d.title, total: d.total })),
      latest,
      trend,
    });
  }
  return results;
}

/** Nilai terbaru (periode maks) dari kolom ukuran sebuah dataset. */
async function latestValue(
  slug: string,
  measure: string | null
): Promise<IndicatorResult["latest"]> {
  const cols = await db
    .select()
    .from(datasetColumn)
    .where(eq(datasetColumn.slug, slug))
    .orderBy(asc(datasetColumn.ordinal));
  const rows = (
    await db.select().from(record).where(eq(record.slug, slug))
  ).map((r) => r.data as Record<string, unknown>);
  if (!rows.length || !cols.length) return null;

  const labelRe = /periode|tahun|bulan|tanggal/i;
  const measureRe = measure
    ? new RegExp(measure, "i")
    : /jumlah|total|nilai|pajak|pendapatan|kunjungan|pengunjung|wisatawan|persen|rata|kamar|realisasi/i;
  const isNum = (key: string) =>
    rows.filter((r) => num(r[key]) !== null).length >= rows.length * 0.9;

  const valueCol =
    cols.find(
      (c) => measureRe.test(c.key) && !labelRe.test(c.key) && isNum(c.key)
    ) ?? cols.find((c) => !labelRe.test(c.key) && isNum(c.key));
  if (!valueCol) return null;
  const labelCol = cols.find((c) => labelRe.test(c.key)) ?? cols[0];

  const sorted = [...rows].sort((a, b) =>
    String(b[labelCol.key] ?? "").localeCompare(String(a[labelCol.key] ?? ""))
  );
  for (const r of sorted) {
    const v = num(r[valueCol.key]);
    if (v !== null)
      return { label: String(r[labelCol.key] ?? ""), value: v, datasetSlug: slug };
  }
  return null;
}

/** Seri tren (label periode → value) dari sebuah dataset, max 24 titik terakhir. */
async function trendSeries(
  slug: string,
  measure: string | null
): Promise<IndicatorResult["trend"]> {
  const cols = await db
    .select()
    .from(datasetColumn)
    .where(eq(datasetColumn.slug, slug))
    .orderBy(asc(datasetColumn.ordinal));
  const rows = (
    await db.select().from(record).where(eq(record.slug, slug))
  ).map((r) => r.data as Record<string, unknown>);
  if (!rows.length || !cols.length) return [];

  const labelRe = /periode|tahun|bulan|tanggal/i;
  const measureRe = measure
    ? new RegExp(measure, "i")
    : /jumlah|total|nilai|kunjungan|pengunjung|wisatawan|kamar|realisasi|persen|rata/i;
  const isNum = (key: string) =>
    rows.filter((r) => num(r[key]) !== null).length >= rows.length * 0.9;

  const valueCol =
    cols.find(
      (c) => measureRe.test(c.key) && !labelRe.test(c.key) && isNum(c.key)
    ) ?? cols.find((c) => !labelRe.test(c.key) && isNum(c.key));
  if (!valueCol) return [];
  const labelCol = cols.find((c) => labelRe.test(c.key)) ?? cols[0];

  return rows
    .map((r) => ({
      label: String(r[labelCol.key] ?? ""),
      value: num(r[valueCol.key]) ?? 0,
    }))
    .filter((b) => b.label !== "")
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-24);
}
