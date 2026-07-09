import Link from "next/link";
import { Nav } from "@/components/Nav";
import { INDICATORS } from "@/lib/gci/indicators";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";

/** Kerangka halaman detail indikator: Nav + title band (dari katalog indikator). */
export function IndicatorShell({
  code,
  source,
  children,
}: {
  code: string;
  source?: string;
  children: React.ReactNode;
}) {
  const ind = INDICATORS.find((i) => i.code === code);
  const fw = ind?.framework ?? "GCI";
  return (
    <main className="min-h-screen bg-[#f4f6fa]">
      <Nav />
      <section
        style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-7 pb-10">
          <Link
            href={`/${fw.toLowerCase()}`}
            className="text-[12px] font-mono uppercase tracking-widest text-white/60 hover:text-white"
          >
            ← {fw} · {ind?.dimension}
          </Link>
          <h1 className="mt-3 text-[26px] md:text-[32px] font-bold tracking-tight max-w-[30ch]">
            {ind?.name ?? code}
          </h1>
          {ind?.definition && (
            <p className="mt-2 text-white/75 max-w-[75ch] text-[14px]">
              {ind.definition}
            </p>
          )}
          {source && (
            <p className="mt-2 text-[12px]" style={{ color: GOLD }}>
              Sumber: {source}
            </p>
          )}
        </div>
      </section>
      <section className="mx-auto max-w-[1320px] px-6 py-8 pb-20 space-y-8">
        {children}
      </section>
    </main>
  );
}

/** Judul sub-section di dalam halaman indikator. */
export function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[15px] font-semibold text-slate-800 mb-3">{title}</h2>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">{children}</div>
    </div>
  );
}
