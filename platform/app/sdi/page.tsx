"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  SDI_DATASETS,
  SDI_ORG_NAME,
  SDI_PORTAL,
  sdiStats,
  type SdiDataset,
} from "@/lib/sdi";
import { secondaryDatasets } from "@/lib/secondary";

const NAVY = "#ed6b23";
const GOLD = "#f0a13a";
const GREEN = "#0e7c42";
const LINK = "#2563eb";
const HERO = "radial-gradient(900px 320px at 88% -25%, rgba(237,107,35,0.28), transparent 62%), linear-gradient(160deg, #2a2521 0%, #16130f 100%)";

type Tier = "primer" | "sekunder";
type CatalogRow = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  tier: Tier;
  source: string;
  size: string; // teks ukuran (dilihat / baris)
  href: string;
  external: boolean;
};

function buildCatalog(sdi: SdiDataset[]): CatalogRow[] {
  const primer: CatalogRow[] = sdi.map((r) => ({
    id: `sdi-${r.id}`,
    title: r.title,
    description: r.description,
    tags: r.tags,
    tier: "primer",
    source: "SDI · Satu Data Jakarta",
    size: `${r.views.toLocaleString("id-ID")} dilihat`,
    href: `/sdi/${r.slug}`,
    external: false,
  }));
  const sekunder: CatalogRow[] = secondaryDatasets().map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    tags: s.tags,
    tier: "sekunder",
    source: s.external === false ? "Dinas Pariwisata & Ekraf DKI Jakarta" : "Jakarta Atlas",
    size: `${s.rows.toLocaleString("id-ID")} baris`,
    href: s.href,
    external: s.external ?? true,
  }));
  return [...primer, ...sekunder];
}

export default function SdiPage() {
  const [rows, setRows] = useState<SdiDataset[]>(SDI_DATASETS);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<"all" | Tier>("all");
  const [source, setSource] = useState<"snapshot" | "live">("snapshot");
  const [refreshing, setRefreshing] = useState(false);

  const catalog = useMemo(() => buildCatalog(rows), [rows]);

  useEffect(() => {
    let alive = true;
    fetch("/api/sdi")
      .then((r) => r.json())
      .then((json) => {
        if (alive && json.datasets?.length) {
          setRows(json.datasets);
          setSource(json.source === "live" ? "live" : "snapshot");
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return catalog.filter((r) => {
      if (tier !== "all" && r.tier !== tier) return false;
      if (!term) return true;
      return (
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.source.toLowerCase().includes(term) ||
        r.tags.some((t) => t.toLowerCase().includes(term))
      );
    });
  }, [catalog, q, tier]);

  const stats = useMemo(() => sdiStats(rows), [rows]);
  const secondaryCount = secondaryDatasets().length;

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/sdi?live=1");
      const json = await res.json();
      if (json.datasets?.length) {
        setRows(json.datasets);
        setSource(json.source === "live" ? "live" : "snapshot");
      }
    } catch {
      /* keep current rows */
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#faf6f2]">
      {/* ── TITLE BAND ── */}
      <section
        style={{ background: HERO }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-8 pb-12">
          <div className="flex items-center gap-2 text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: GOLD }}>●</span> Katalog Data Terkonsolidasi
          </div>
          <h1 className="mt-3 text-[30px] md:text-[38px] font-bold tracking-tight max-w-[22ch]">
            Data Pariwisata{" "}
            <span style={{ color: GOLD }}>&amp; Ekonomi Kreatif</span>
          </h1>
          <p className="mt-3 text-white/75 max-w-[72ch] text-[15px]">
            Data primer dari Satu Data Jakarta ({SDI_ORG_NAME}) digabung dengan
            data sekunder hasil pendataan Jakarta Atlas (GCI). Fokus tahap awal:
            menampilkan data sebagai tabel — visualisasi KPI &amp; readiness
            GCI/GPCI menyusul.
          </p>

          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-[720px]">
            <Stat
              label="DATA PRIMER (SDI)"
              value={String(stats.total)}
              dot={NAVY}
            />
            <Stat
              label="DATA SEKUNDER"
              value={String(secondaryCount)}
              dot={GREEN}
            />
            <Stat label="TOPIK / TAG" value={String(stats.tags)} />
            <Stat
              label="TOTAL DILIHAT"
              value={stats.views.toLocaleString("id-ID")}
            />
          </div>
        </div>
      </section>

      {/* ── TOOLBAR ── */}
      <div className="mx-auto max-w-[1320px] px-6 -mt-6 relative z-10">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col lg:flex-row lg:items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari dataset, deskripsi, sumber, atau tag…"
            className="flex-1 rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-[14px] outline-none focus:border-[#ed6b23] focus:bg-white transition-colors"
          />
          {/* Segmented filter tier */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            {(
              [
                ["all", "Semua"],
                ["primer", "Primer"],
                ["sekunder", "Sekunder"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTier(val)}
                className="px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors"
                style={
                  tier === val
                    ? { background: NAVY, color: "#fff" }
                    : { color: "#475569" }
                }
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-slate-500 tabular-nums whitespace-nowrap">
              {filtered.length} baris
            </span>
            <span
              className="text-[11px] font-medium px-2 py-1 rounded-full whitespace-nowrap"
              style={{
                background: source === "live" ? "#e8f5ee" : "#eef2f9",
                color: source === "live" ? GREEN : NAVY,
              }}
            >
              {source === "live" ? "● LIVE SDI" : "○ SNAPSHOT"}
            </span>
            <button
              onClick={refresh}
              disabled={refreshing}
              style={{ background: NAVY }}
              className="text-white text-[13px] font-medium px-4 py-2.5 rounded-lg hover:opacity-90 disabled:opacity-60 transition-opacity whitespace-nowrap"
            >
              {refreshing ? "Menarik data…" : "↻ Refresh SDI"}
            </button>
          </div>
        </div>
      </div>

      {/* ── TABLE ── */}
      <section className="mx-auto max-w-[1320px] px-6 py-6 pb-20">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[14px] border-collapse">
              <thead>
                <tr
                  style={{ background: NAVY }}
                  className="text-white text-left text-[12px] uppercase tracking-wider"
                >
                  <th className="px-4 py-3 font-semibold w-12">#</th>
                  <th className="px-4 py-3 font-semibold">Nama Dataset</th>
                  <th className="px-4 py-3 font-semibold hidden md:table-cell">
                    Tag
                  </th>
                  <th className="px-4 py-3 font-semibold w-48">Sumber</th>
                  <th className="px-4 py-3 font-semibold text-right w-32 hidden sm:table-cell">
                    Ukuran
                  </th>
                  <th className="px-4 py-3 font-semibold w-28 text-center">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr
                    key={r.id}
                    className="border-t border-slate-100 hover:bg-slate-50 transition-colors align-top"
                  >
                    <td className="px-4 py-3 text-slate-400 tabular-nums">
                      {i + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-slate-900">
                          {r.title}
                        </span>
                        <TierBadge tier={r.tier} />
                      </div>
                      {r.description && (
                        <div className="text-[13px] text-slate-500 mt-0.5 max-w-[60ch] line-clamp-2">
                          {r.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {r.tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[13px] text-slate-600">
                        {r.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-600 hidden sm:table-cell">
                      {r.size}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {r.external ? (
                        <a
                          href={r.href}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: LINK }}
                          className="text-[13px] font-medium hover:underline whitespace-nowrap"
                        >
                          Lihat data ↗
                        </a>
                      ) : (
                        <Link
                          href={r.href}
                          style={{ color: LINK }}
                          className="text-[13px] font-medium hover:underline whitespace-nowrap"
                        >
                          Lihat data →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-slate-400"
                    >
                      Tidak ada dataset yang cocok.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <p className="text-[12px] text-slate-400 mt-4">
          <span className="inline-flex items-center gap-1.5 mr-4">
            <TierBadge tier="primer" /> = Satu Data Jakarta (
            <a href={SDI_PORTAL} target="_blank" rel="noreferrer" className="underline">
              satudata.jakarta.go.id
            </a>
            )
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TierBadge tier="sekunder" /> = pendataan Jakarta Atlas (GCI)
          </span>
        </p>
      </section>
    </main>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  const primer = tier === "primer";
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
      style={{
        background: primer ? "#eef2f9" : "#e8f5ee",
        color: primer ? NAVY : GREEN,
      }}
    >
      {primer ? "Data Primer" : "Data Sekunder"}
    </span>
  );
}

function Stat({
  label,
  value,
  dot,
}: {
  label: string;
  value: string;
  dot?: string;
}) {
  return (
    <div className="rounded-lg bg-white/10 border border-white/15 px-4 py-3">
      <div className="text-[11px] font-mono tracking-wider text-white/60 flex items-center gap-1.5">
        {dot && (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: dot === NAVY ? GOLD : dot }}
          />
        )}
        {label}
      </div>
      <div className="text-[22px] font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}
