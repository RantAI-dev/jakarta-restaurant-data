import Link from "next/link";
import { Nav } from "@/components/Nav";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";

/**
 * ATLAS — data sekunder (pendataan lapangan GCI) dibangun ULANG di dalam platform
 * dengan style kita (bukan link keluar).
 *
 * STATUS: SCAFFOLD. Kerangka + kartu placeholder. Agent mengisi datanya —
 * lihat Plan 6 Task 5 (strategi akses data Atlas + view Restoran/Event/Golf).
 */

const SECTIONS = [
  {
    key: "restoran",
    title: "Restoran & Kafe GCI",
    desc: "Pendataan restoran & kafe se-Jakarta (termasuk restoran hotel bintang 3–4) untuk Global City Index.",
    hint: "≈ 2.577 baris",
  },
  {
    key: "pertunjukan",
    title: "Pertunjukan & Budaya",
    desc: "Konser, festival, tari, teater, seni rupa, film 2025–2026.",
    hint: "≈ 308 baris",
  },
  {
    key: "golf",
    title: "Lapangan Golf",
    desc: "Lapangan & driving range golf di Jakarta dan sekitarnya.",
    hint: "≈ 14 baris",
  },
];

export default function AtlasPage() {
  return (
    <main className="min-h-screen bg-[#f4f6fa]">
      <Nav />

      <section
        style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-8 pb-10">
          <div className="text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: GOLD }}>●</span> Data Sekunder · Pendataan Lapangan
          </div>
          <h1 className="mt-3 text-[28px] md:text-[36px] font-bold tracking-tight">
            Jakarta Atlas
          </h1>
          <p className="mt-2 text-white/70 max-w-[80ch] text-[14px]">
            Data hasil pendataan lapangan (GCI) yang melengkapi data primer SDI —
            dibangun ulang di dalam platform dengan tampilan seragam.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-8 pb-20">
        <div className="grid md:grid-cols-3 gap-5">
          {SECTIONS.map((s) => (
            <div
              key={s.key}
              className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col"
            >
              <div className="text-[15px] font-semibold text-slate-800">
                {s.title}
              </div>
              <p className="text-[13px] text-slate-500 mt-1 flex-1">{s.desc}</p>
              <div className="text-[12px] text-slate-400 mt-3">{s.hint}</div>
              <Link
                href={`/atlas/${s.key}`}
                className="mt-4 text-[13px] font-medium"
                style={{ color: NAVY }}
              >
                Lihat data → <span className="text-slate-400">(TODO Plan 6)</span>
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border-2 border-dashed border-slate-300 bg-white/50 p-6">
          <div className="text-[14px] font-semibold text-slate-600">
            🏗️ Scaffold — dibangun agent (Plan 6 Task 5)
          </div>
          <div className="text-[13px] text-slate-500 mt-1 max-w-[80ch]">
            Halaman detail tiap section (<code>/atlas/[section]</code>) + tabel
            data + filter/search, styling seragam platform. Strategi akses data
            (impor dari app Atlas root / fetch API / snapshot) dibahas di Plan 6.
          </div>
        </div>
      </section>
    </main>
  );
}
