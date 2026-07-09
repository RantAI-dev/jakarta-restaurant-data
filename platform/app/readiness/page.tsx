import Link from "next/link";
import { computeReadiness, type IndicatorResult } from "@/lib/gci/readiness";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";
const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  ready: { label: "Ready", bg: "#e8f5ee", fg: "#0e7c42" },
  partial: { label: "Partial", bg: "#fff6e9", fg: "#b5651d" },
  gap: { label: "Gap", bg: "#fdecec", fg: "#b3261e" },
};

export const dynamic = "force-dynamic";

export default async function ReadinessPage() {
  const all = await computeReadiness();
  const ada = all.filter((x) => x.dataAvailable);
  const gaada = all.filter((x) => !x.dataAvailable);
  const count = (s: string) => all.filter((x) => x.status === s).length;

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
                Readiness GCI / GPCI · Pariwisata
              </div>
            </div>
          </div>
          <Link href="/dashboard" className="text-[13px] font-medium text-white/85 hover:text-white">
            Dashboard →
          </Link>
        </div>
      </header>

      <section
        style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-8 pb-10">
          <div className="text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: GOLD }}>●</span> Kesiapan Data Indikator Pariwisata
          </div>
          <h1 className="mt-3 text-[28px] md:text-[34px] font-bold tracking-tight">
            Readiness GCI &amp; GPCI
          </h1>
          <p className="mt-2 text-white/70 max-w-[80ch] text-[14px]">
            {all.length} indikator pariwisata dari Kearney GCI &amp; Mori GPCI.{" "}
            <span style={{ color: GOLD }}>Status &amp; pemetaan masih draft</span>{" "}
            — menunggu validasi indikator resmi.
          </p>
          <div className="mt-5 flex flex-wrap gap-3 text-[13px]">
            <Badge s="ready" n={count("ready")} />
            <Badge s="partial" n={count("partial")} />
            <Badge s="gap" n={count("gap")} />
            <span className="px-3 py-1 rounded-full font-medium bg-white/10 border border-white/15">
              Data ada: {ada.length} · gaada: {gaada.length}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-8 pb-20 space-y-10">
        <Group
          title="✅ Data ada — Dispar bisa mengisi"
          subtitle="Indikator dengan data (langsung/proksi) di platform."
          rows={ada}
          showValue
        />
        <Group
          title="❌ Data belum ada — lintas-OPD"
          subtitle="Tourism-related tapi datanya di OPD lain — daftar permintaan data."
          rows={gaada}
          showValue={false}
        />
        <p className="text-[12px] text-slate-400">
          Sumber definisi: Kearney Global Cities Index &amp; Mori Global Power
          City Index. Sumber kebenaran indikator: <code>data/gci-gpci-indicators.json</code>.
        </p>
      </section>
    </main>
  );
}

function Group({
  title,
  subtitle,
  rows,
  showValue,
}: {
  title: string;
  subtitle: string;
  rows: IndicatorResult[];
  showValue: boolean;
}) {
  return (
    <div>
      <h2 className="text-[16px] font-bold text-slate-800">{title}</h2>
      <p className="text-[13px] text-slate-500 mb-3">{subtitle}</p>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr style={{ background: NAVY }} className="text-white text-left text-[12px] uppercase tracking-wider">
                <th className="px-4 py-3 font-semibold w-16">Kode</th>
                <th className="px-4 py-3 font-semibold w-16">Frmwk</th>
                <th className="px-4 py-3 font-semibold">Indikator</th>
                <th className="px-4 py-3 font-semibold w-24">Status</th>
                <th className="px-4 py-3 font-semibold">
                  {showValue ? "Dataset pengisi" : "Pemilik data (OPD)"}
                </th>
                {showValue && (
                  <th className="px-4 py-3 font-semibold w-44 text-right">
                    Nilai terbaru
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((x) => (
                <Row key={x.code} x={x} showValue={showValue} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Row({ x, showValue }: { x: IndicatorResult; showValue: boolean }) {
  const st = STATUS[x.status];
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-3 text-slate-400 tabular-nums">{x.code}</td>
      <td className="px-4 py-3 text-slate-500">{x.framework}</td>
      <td className="px-4 py-3">
        <div className="font-medium text-slate-800">{x.name}</div>
        <div className="text-[12px] text-slate-400">{x.dimension}</div>
        {x.note && (
          <div className="text-[12px] text-slate-500 mt-0.5 max-w-[52ch]">
            {x.note}
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: st.bg, color: st.fg }}
        >
          {st.label}
        </span>
      </td>
      <td className="px-4 py-3">
        {showValue ? (
          x.datasets.length ? (
            <div className="flex flex-col gap-1">
              {x.datasets.map((d) => (
                <Link
                  key={d.slug}
                  href={`/sdi/${d.slug}`}
                  className="text-[13px] hover:underline"
                  style={{ color: NAVY }}
                >
                  {d.title}
                </Link>
              ))}
            </div>
          ) : (
            <span className="text-[13px] text-slate-400">
              {x.owner} — perlu sync / penajaman
            </span>
          )
        ) : (
          <span className="text-[13px] text-slate-600">{x.owner}</span>
        )}
      </td>
      {showValue && (
        <td className="px-4 py-3 text-right tabular-nums text-slate-700">
          {x.latest ? (
            <>
              <div className="font-semibold">
                {x.latest.value.toLocaleString("id-ID")}
              </div>
              <div className="text-[11px] text-slate-400">
                periode {x.latest.label}
              </div>
            </>
          ) : (
            <span className="text-slate-300">—</span>
          )}
        </td>
      )}
    </tr>
  );
}

function Badge({ s, n }: { s: string; n: number }) {
  const st = STATUS[s];
  return (
    <span className="px-3 py-1 rounded-full font-medium" style={{ background: st.bg, color: st.fg }}>
      {st.label}: {n}
    </span>
  );
}
