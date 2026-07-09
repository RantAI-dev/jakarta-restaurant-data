import Link from "next/link";
import { db, schema } from "@/lib/db";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";

export const dynamic = "force-dynamic";

async function load() {
  try {
    const datasets = await db.select().from(schema.dataset);
    const syncs = await db.select().from(schema.datasetSync);
    return { datasets, syncs };
  } catch {
    return { datasets: [], syncs: [] };
  }
}

export default async function DashboardPage() {
  const { datasets, syncs } = await load();
  const primer = datasets.filter((d) => d.tier === "primer").length;
  const totalRows = syncs.reduce((s, x) => s + (x.total ?? 0), 0);
  const lastSync = syncs
    .map((s) => s.syncedAt)
    .filter(Boolean)
    .map((d) => new Date(d as unknown as string).getTime())
    .sort((a, b) => b - a)[0];

  const recent = [...syncs]
    .sort(
      (a, b) =>
        new Date(b.syncedAt as unknown as string).getTime() -
        new Date(a.syncedAt as unknown as string).getTime()
    )
    .slice(0, 15);

  return (
    <main className="min-h-screen bg-[#f4f6fa]">
      <header style={{ background: NAVY }} className="text-white">
        <div className="mx-auto max-w-[1320px] px-6 h-[76px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-jakarta.png"
              alt="Logo Jakarta"
              className="h-11 w-auto bg-white rounded-md p-1"
            />
            <div className="leading-tight">
              <div className="font-semibold tracking-tight text-[15px]">
                Dinas Pariwisata &amp; Ekonomi Kreatif
              </div>
              <div className="text-[12px] text-white/70">
                Provinsi DKI Jakarta · Dashboard
              </div>
            </div>
          </div>
          <nav className="flex items-center gap-5 text-[13px] font-medium text-white/85">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/readiness" className="hover:text-white transition-colors">
              Readiness GCI/GPCI
            </Link>
            <Link href="/sdi" className="hover:text-white transition-colors">
              Katalog Data →
            </Link>
          </nav>
        </div>
      </header>

      <section
        style={{
          background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`,
        }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-8 pb-12">
          <div className="text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: GOLD }}>●</span> Ringkasan Platform
          </div>
          <h1 className="mt-3 text-[30px] md:text-[36px] font-bold tracking-tight">
            Dashboard Data
          </h1>
          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-[760px]">
            <Stat label="DATASET PRIMER" value={String(primer)} />
            <Stat label="DATASET TERSYNC" value={String(syncs.length)} />
            <Stat
              label="TOTAL BARIS DATA"
              value={totalRows.toLocaleString("id-ID")}
            />
            <Stat
              label="SYNC TERAKHIR"
              value={
                lastSync
                  ? new Date(lastSync).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                    })
                  : "—"
              }
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-8 pb-20">
        <h2 className="text-[15px] font-semibold text-slate-800 mb-3">
          Dataset terakhir disinkronkan
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr
                style={{ background: NAVY }}
                className="text-white text-left text-[12px] uppercase tracking-wider"
              >
                <th className="px-4 py-3 font-semibold">Dataset</th>
                <th className="px-4 py-3 font-semibold text-right w-28">Baris</th>
                <th className="px-4 py-3 font-semibold w-40">Sync</th>
                <th className="px-4 py-3 font-semibold w-24 text-center">Buka</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.slug} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-800">{s.title ?? s.slug}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {(s.total ?? 0).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[13px] tabular-nums">
                    {s.syncedAt
                      ? new Date(
                          s.syncedAt as unknown as string
                        ).toLocaleString("id-ID")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/sdi/${s.slug}`}
                      style={{ color: NAVY }}
                      className="text-[13px] font-medium hover:underline"
                    >
                      Lihat →
                    </Link>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    Belum ada dataset tersync. Jalankan sync dulu (Plan 1/2).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 border border-white/15 px-4 py-3">
      <div className="text-[11px] font-mono tracking-wider text-white/60">
        {label}
      </div>
      <div className="text-[22px] font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}