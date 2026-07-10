import Link from "next/link";
import { sdiStats } from "@/lib/sdi";
import { secondaryDatasets } from "@/lib/secondary";
import { computeReadiness } from "@/lib/gci/readiness";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const s = sdiStats();
  const r = await computeReadiness();
  const gci = r.filter((x) => x.framework === "GCI");
  const gpci = r.filter((x) => x.framework === "GPCI");
  const ready = (a: typeof r) => a.filter((x) => x.status === "ready").length;

  const secondary = secondaryDatasets();
  const secondaryTotalRows = secondary.reduce((a, d) => a + d.rows, 0);

  const MENUS = [
    {
      href: "/sdi",
      title: "Katalog",
      desc: `${s.total} dataset primer SDI + ${secondary.length} sekunder`,
      stat: `${s.total} dataset`,
    },
    {
      href: "/gci",
      title: "GCI",
      desc: "Kearney Global Cities Index — readiness pariwisata",
      stat: `${ready(gci)}/${gci.length} ready`,
    },
    {
      href: "/gpci",
      title: "GPCI",
      desc: "Mori Global Power City Index — readiness pariwisata",
      stat: `${ready(gpci)}/${gpci.length} ready`,
    },
    {
      href: "/atlas",
      title: "Atlas",
      desc: "Data sekunder pendataan lapangan (GCI)",
      stat: `${secondaryTotalRows.toLocaleString("id-ID")} baris`,
    },
  ];

  return (
    <main className="min-h-screen bg-[#f4f6fa]">
      <section
        style={{
          background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`,
        }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-16 pb-14">
          <div className="text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: GOLD }}>●</span> Dashboard Visualisasi Data
            Terkonsolidasi
          </div>
          <h1 className="mt-4 text-[34px] md:text-[46px] font-bold tracking-tight max-w-[20ch]">
            Data Pariwisata{" "}
            <span style={{ color: GOLD }}>&amp; Ekonomi Kreatif</span> Jakarta
          </h1>
          <p className="mt-4 text-white/75 max-w-[68ch] text-[16px]">
            Empat pintu masuk ke data Dispar — katalog SDI, readiness GCI/GPCI,
            dan pendataan lapangan. Memilih menu untuk membuka visualisasi.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-10 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MENUS.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:-translate-y-0.5 transition-transform"
            >
              <div className="text-[18px] font-bold text-slate-800">
                {m.title}
              </div>
              <p className="text-[13px] text-slate-500 mt-1 min-h-[40px]">
                {m.desc}
              </p>
              <div
                className="mt-4 text-[13px] font-semibold"
                style={{ color: NAVY }}
              >
                {m.stat} →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}