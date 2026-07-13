import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { computeReadiness, type IndicatorResult } from "@/lib/gci/readiness";

const { report } = schema;

/**
 * Report terprecompute. Halaman membaca snapshot kecil ini alih-alih men-scan
 * tabel `record` (besar) tiap request — hemat egress + kompute Neon.
 * Diisi ulang oleh job terjadwal: `POST/GET /api/admin/report` (cron harian)
 * atau setelah sync data.
 */

export type ReportKey = "readiness";

/** Baca satu snapshot report (murah: 1 baris). */
export async function getReport<T>(
  key: ReportKey
): Promise<{ data: T; generatedAt: Date } | null> {
  try {
    const rows = await db
      .select({ data: report.data, generatedAt: report.generatedAt })
      .from(report)
      .where(eq(report.key, key))
      .limit(1);
    if (!rows.length) return null;
    return { data: rows[0].data as T, generatedAt: rows[0].generatedAt };
  } catch {
    return null;
  }
}

async function put(key: ReportKey, data: unknown): Promise<void> {
  await db
    .insert(report)
    .values({ key, data: data as object, generatedAt: new Date() })
    .onConflictDoUpdate({
      target: report.key,
      set: { data: data as object, generatedAt: new Date() },
    });
}

/**
 * Bangun ulang semua report dari data mentah (BERAT — scan `record`).
 * Hanya dipanggil oleh job terjadwal, TIDAK di jalur request.
 */
export async function buildReports(): Promise<{ readiness: number }> {
  const readiness = await computeReadiness();
  await put("readiness", readiness);
  return { readiness: readiness.length };
}

/**
 * Baca readiness dari report. Fallback ke compute langsung HANYA bila report
 * belum ada (cold start) — hasilnya tetap di-cache ISR oleh halaman.
 */
export async function getReadiness(): Promise<IndicatorResult[]> {
  const snap = await getReport<IndicatorResult[]>("readiness");
  if (snap?.data?.length) return snap.data;
  try {
    return await computeReadiness();
  } catch {
    return [];
  }
}
