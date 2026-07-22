/**
 * GCI utama Jakarta — FOKUS PARIWISATA (domain Dispar).
 * Di GCI Kearney, kontribusi pariwisata diukur lewat dimensi "Pengalaman Budaya"
 * (Cultural Experience). Section ini menyorot dimensi itu; peringkat GCI
 * keseluruhan hanya konteks. Sumber: https://www.jakarta.go.id/competitiveness.
 * Tampil di ATAS /gci; dashboard kesiapan data ada di bawahnya.
 */
const HERO =
  "radial-gradient(900px 320px at 88% -25%, rgba(237,107,35,0.28), transparent 62%), linear-gradient(160deg, #2a2521 0%, #16130f 100%)";
const ACCENT = "#ed6b23";
const GREEN = "#0e7c42";
const RED = "#b3261e";
const LINK = "#8ab4ff";

// Peringkat resmi Kearney GCI 2024→2025 (jakarta.go.id/competitiveness).
const OVERALL = { y2024: 74, y2025: 71 };
// Dimensi pariwisata Dispar:
const PARIWISATA = {
  name: "Pengalaman Budaya",
  en: "Cultural Experience",
  desc: "Daya tarik Jakarta bagi pengunjung internasional — kuliner, seni pertunjukan, budaya, dan kunjungan wisatawan. Inilah dimensi GCI yang menjadi domain Dinas Pariwisata & Ekraf.",
  y2024: 52,
  y2025: 58,
};

/** Peringkat: makin kecil makin baik → delta positif = naik peringkat. */
function trend(y2024: number, y2025: number) {
  const delta = y2024 - y2025;
  if (delta > 0) return { color: GREEN, chip: "rgba(14,124,66,0.22)", chipFg: "#7ee2a8", arrow: "▲", label: `naik ${delta} peringkat` };
  if (delta < 0) return { color: RED, chip: "rgba(179,38,30,0.22)", chipFg: "#f7a6a1", arrow: "▼", label: `turun ${-delta} peringkat` };
  return { color: "#9c948a", chip: "rgba(255,255,255,0.1)", chipFg: "#cfc8bf", arrow: "▬", label: "tetap" };
}

export function GciOfficial() {
  const pt = trend(PARIWISATA.y2024, PARIWISATA.y2025);
  const ot = trend(OVERALL.y2024, OVERALL.y2025);
  return (
    <>
      {/* ── HERO: dimensi pariwisata ── */}
      <section style={{ background: HERO }} className="text-white">
        <div className="mx-auto max-w-[1320px] px-6 pt-9 pb-11">
          <div className="text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: "#f0a13a" }}>●</span> Kearney · Global Cities Index — Dimensi Pariwisata (Dispar)
          </div>
          <h1 className="mt-3 atlas-display max-w-[18ch] text-white">
            GCI Jakarta ·{" "}
            <span className="atlas-italic" style={{ color: "#f0a13a" }}>
              Pengalaman Budaya
            </span>
          </h1>
          <p className="mt-3 apple-lead max-w-[64ch] text-white/75">
            Kontribusi pariwisata Jakarta pada daya saing global diukur lewat dimensi{" "}
            <span className="text-white/90">Pengalaman Budaya (Cultural Experience)</span> — daya tarik kota
            bagi pengunjung internasional. Angka = peringkat dunia; makin kecil makin baik.
          </p>

          {/* Stat utama: Pengalaman Budaya */}
          <div className="mt-8 flex flex-wrap items-end gap-x-10 gap-y-5">
            <div className="flex items-end gap-4">
              <div className="text-center">
                <div className="apple-fine text-white/50">2024</div>
                <div className="text-[34px] font-bold leading-none text-white/45 tabular">{PARIWISATA.y2024}</div>
              </div>
              <div className="pb-2 text-white/30 text-2xl">→</div>
              <div className="text-center">
                <div className="apple-fine text-white/60">2025</div>
                <div className="text-[64px] font-bold leading-none tabular text-white">{PARIWISATA.y2025}</div>
              </div>
              <span
                className="mb-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold"
                style={{ background: pt.chip, color: pt.chipFg }}
              >
                {pt.arrow} {pt.label}
              </span>
            </div>
            <div className="apple-caption text-white/55 max-w-[30ch]">
              Peringkat dimensi <b className="text-white/80">Pengalaman Budaya</b> — domain Dinas Pariwisata &amp; Ekraf.
            </div>
          </div>

          {/* Konteks: GCI keseluruhan */}
          <div className="mt-6 inline-flex items-center gap-3 rounded-xl border border-white/12 bg-white/[0.04] px-4 py-2.5">
            <span className="apple-fine text-white/50">Peringkat GCI keseluruhan Jakarta</span>
            <span className="text-[15px] font-semibold text-white/45 tabular">{OVERALL.y2024}</span>
            <span className="text-white/30">→</span>
            <span className="text-[20px] font-bold text-white tabular">{OVERALL.y2025}</span>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold" style={{ color: ot.chipFg }}>
              {ot.arrow} {ot.label}
            </span>
          </div>

          <p className="mt-6 text-[12px] text-white/50">
            Sumber:{" "}
            <a href="https://www.jakarta.go.id/competitiveness" target="_blank" rel="noreferrer" className="hover:underline" style={{ color: LINK }}>
              jakarta.go.id/competitiveness ↗
            </a>{" "}
            · Kearney Global Cities Index 2025.
          </p>
        </div>
      </section>

      {/* ── Penjelasan domain Dispar ── */}
      <section className="mx-auto max-w-[1320px] px-6 pt-9 pb-12">
        <div className="utility-card p-6 md:p-7">
          <div
            className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white"
            style={{ background: ACCENT }}
          >
            Domain Dispar dalam GCI
          </div>
          <p className="mt-3 apple-body text-ink max-w-[80ch]">{PARIWISATA.desc}</p>
          <p className="mt-3 apple-caption text-ink-muted-48 max-w-[80ch]">
            Indikator Dispar yang mengisi dimensi ini — kuliner (restoran TripAdvisor), wisatawan mancanegara,
            dan seni pertunjukan — beserta status kesiapan datanya ada di dashboard di bawah. Catatan: pada 2025
            peringkat Pengalaman Budaya {pt.arrow === "▼" ? "turun" : "berubah"}, jadi jadi prioritas perbaikan data &amp; program.
          </p>
        </div>
      </section>
    </>
  );
}
