import Link from "next/link";
import { SDI_DATASETS, sdiStats } from "@/lib/sdi";
import { secondaryDatasets } from "@/lib/secondary";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";

export default function HomePage() {
  const stats = sdiStats();
  const secondary = secondaryDatasets();
  const secondaryRows = secondary.reduce((s, d) => s + d.rows, 0);

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
                Provinsi DKI Jakarta · Platform Data
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
        <div className="mx-auto max-w-[1320px] px-6 pt-16 pb-20">
          <div className="text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: GOLD }}>●</span> Dashboard Visualisasi Data
            Terkonsolidasi
          </div>
          <h1 className="mt-4 text-[34px] md:text-[46px] font-bold tracking-tight max-w-[20ch]">
            Data Pariwisata{" "}
            <span style={{ color: GOLD }}>&amp; Ekonomi Kreatif</span> Jakarta
          </h1>
          <p className="mt-4 text-white/75 max-w-[68ch] text-[16px]">
            Menyatukan data primer dari Satu Data Jakarta dengan data sekunder
            pendataan lapangan, diarahkan untuk memenuhi indikator Global City
            Index (GCI) &amp; GPCI.
          </p>

          <div className="mt-9 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-[560px]">
            <Stat label="DATASET PRIMER" value={String(stats.total)} />
            <Stat label="DATASET SEKUNDER" value={String(secondary.length)} />
            <Stat
              label="BARIS DATA SEKUNDER"
              value={secondaryRows.toLocaleString("id-ID")}
            />
          </div>

          <div className="mt-10">
            <Link
              href="/sdi"
              className="inline-flex items-center gap-2 bg-white text-[15px] font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              style={{ color: NAVY }}
            >
              Buka Katalog Data →
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-[1320px] px-6 py-10 text-[13px] text-slate-500">
        <p>
          Sumber primer: Satu Data Indonesia — Jakarta ·{" "}
          <a
            href="https://satudata.jakarta.go.id"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            satudata.jakarta.go.id
          </a>
          . Data sekunder: pendataan Jakarta Atlas (GCI).
        </p>
        <p className="mt-1 text-slate-400">
          © 2026 Dinas Pariwisata &amp; Ekonomi Kreatif Provinsi DKI Jakarta
        </p>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 border border-white/15 px-4 py-3">
      <div className="text-[11px] font-mono tracking-wider text-white/60">
        {label}
      </div>
      <div className="text-[24px] font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}