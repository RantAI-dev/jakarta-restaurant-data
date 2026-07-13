import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { buildReports } from "@/lib/report";

/**
 * Bangun ulang report snapshot (readiness, dst.) dari data mentah.
 * Ini jalur BERAT (scan `record`) yang sengaja dipindah ke jadwal, bukan
 * request user. Dipanggil oleh:
 *   - Vercel Cron (GET, header `Authorization: Bearer $CRON_SECRET`), atau
 *   - manual (POST/GET, header `x-sync-secret: $SYNC_SECRET`).
 */
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function run(req: Request): Promise<Response> {
  const auth = req.headers.get("authorization") ?? "";
  const cronOk =
    !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
  const manualOk =
    !!process.env.SYNC_SECRET &&
    req.headers.get("x-sync-secret") === process.env.SYNC_SECRET;
  if (!cronOk && !manualOk) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const res = await buildReports();
    // Segarkan halaman ISR yang membaca report agar langsung tampil data baru.
    revalidatePath("/gci");
    revalidatePath("/gpci");
    return NextResponse.json({ ok: true, ...res });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e) },
      { status: 500 }
    );
  }
}

export const GET = run;
export const POST = run;
