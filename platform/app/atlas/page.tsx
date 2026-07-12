import Link from "next/link";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";

/**
 * ATLAS — data sekunder (pendataan lapangan GCI) di dalam platform, gaya kita.
 * 4 section 1:1 dengan Jakarta Atlas; detail di /atlas/[section] menarik data
 * dari Atlas app via endpoint JSON.
 */
const SECTIONS = [
  {
    key: "gci",
    title: "Restoran GCI",
    desc: "Seluruh restoran & kafe se-Jakarta (termasuk restoran hotel bintang 3–4) untuk Global City Index — dengan tier, rating, harga.",
    hint: "≈ 2.577 entri",
  },
  {
    key: "restaurants",
    title: "Direktori Restoran",
    desc: "Restoran & kafe pilihan Jakarta dengan sumber sitasi publik terverifikasi.",
    hint: "≈ 604 entri",
  },
  {
    key: "pertunjukan",
    title: "Pertunjukan & Budaya",
    desc: "Konser, festival, tari, teater, seni rupa, film 2025–2026.",
    hint: "≈ 308 entri",
  },
  {
    key: "golf",
    title: "Lapangan Golf",
    desc: "Lapangan & driving range golf di Jakarta dan sekitarnya.",
    hint: "≈ 14 entri",
  },
];

export default function AtlasPage() {
  return (
    <main className="min-h-screen bg-[#f4f6fa]">
      <section
        style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-9 pb-12">
          <div className="text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: GOLD }}>●</span> Data Sekunder · Pendataan Lapangan
          </div>
          <h1 className="mt-3 text-[32px] md:text-[42px] font-bold tracking-tight">
            Jakarta Atlas
          </h1>
          <p className="mt-3 text-white/70 max-w-[70ch] text-[15px]">
            Data hasil pendataan lapangan (GCI) yang melengkapi data primer SDI —
            ditampilkan di dalam platform dengan tampilan seragam.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-8 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SECTIONS.map((s) => (
            <Link
              key={s.key}
              href={`/atlas/${s.key}`}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col hover:-translate-y-0.5 transition-transform"
            >
              <div className="text-[16px] font-semibold text-slate-800">{s.title}</div>
              <p className="text-[13px] text-slate-500 mt-1 flex-1">{s.desc}</p>
              <div className="text-[12px] text-slate-400 mt-3">{s.hint}</div>
              <div className="mt-3 text-[13px] font-medium" style={{ color: NAVY }}>
                Lihat data →
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
