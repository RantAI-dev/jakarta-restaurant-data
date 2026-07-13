import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const { report } = schema;

/**
 * Akses low-level tabel `report` (snapshot terprecompute). Dipisah dari
 * lib/report.ts agar bisa dipakai lib/indicator-data.ts tanpa circular import.
 */
export async function getReportRaw<T>(
  key: string
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

export async function putReport(key: string, data: unknown): Promise<void> {
  await db
    .insert(report)
    .values({ key, data: data as object, generatedAt: new Date() })
    .onConflictDoUpdate({
      target: report.key,
      set: { data: data as object, generatedAt: new Date() },
    });
}
