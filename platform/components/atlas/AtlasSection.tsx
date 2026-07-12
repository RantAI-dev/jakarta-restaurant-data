"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";

export type Row = Record<string, unknown>;
export type Col = {
  header: string;
  align?: "left" | "right" | "center";
  className?: string;
  cell: (r: Row, i: number) => ReactNode;
};
export type Segmented = {
  options: string[];
  match: (r: Row, opt: string) => boolean;
};
export type SelectFilter = {
  label: string;
  options: string[];
  match: (r: Row, opt: string) => boolean;
};

/**
 * Tampilan section Atlas (Jakarta Atlas) di design system platform.
 * Struktur 1:1 dengan Atlas: hero + stats · filter (segmented/select/cari) ·
 * tabel · pagination · footer. Hanya beda styling (navy/gold).
 */
export function AtlasSection({
  eyebrow,
  title,
  titleAccent,
  desc,
  stats,
  rows,
  loading,
  error,
  search,
  segmented,
  selects = [],
  columns,
  footer,
  pageSize = 200,
}: {
  eyebrow: string;
  title: string;
  titleAccent?: string;
  desc: string;
  stats: { label: string; value: string | number }[];
  rows: Row[];
  loading?: boolean;
  error?: string | null;
  search: (r: Row) => string;
  segmented?: Segmented;
  selects?: SelectFilter[];
  columns: Col[];
  footer?: string;
  pageSize?: number;
}) {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("Semua");
  const [sels, setSels] = useState<string[]>(() => selects.map(() => "Semua"));
  const [visible, setVisible] = useState(pageSize);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (segmented && seg !== "Semua" && !segmented.match(r, seg)) return false;
      for (let i = 0; i < selects.length; i++) {
        if (sels[i] !== "Semua" && !selects[i].match(r, sels[i])) return false;
      }
      if (n && !search(r).toLowerCase().includes(n)) return false;
      return true;
    });
  }, [rows, q, seg, sels, segmented, selects, search]);

  useEffect(() => setVisible(pageSize), [q, seg, sels, pageSize]);
  const paged = filtered.slice(0, visible);

  return (
    <main className="min-h-screen bg-[#f4f6fa]">
      {/* HERO */}
      <section
        style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-9 pb-12">
          <Link
            href="/atlas"
            className="text-[12px] font-mono uppercase tracking-widest text-white/60 hover:text-white"
          >
            ← Atlas · {eyebrow}
          </Link>
          <div className="mt-4 grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-7">
              <h1 className="text-[32px] md:text-[42px] font-bold tracking-tight">
                {title}{" "}
                {titleAccent && (
                  <span style={{ color: GOLD }}>{titleAccent}</span>
                )}
              </h1>
              <p className="mt-3 text-white/70 max-w-[62ch] text-[15px]">{desc}</p>
            </div>
            <dl className="md:col-span-5 grid grid-cols-4 gap-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg bg-white/10 border border-white/15 px-3 py-2.5"
                >
                  <dt className="text-[10px] font-mono tracking-wider text-white/55">
                    {s.label}
                  </dt>
                  <dd className="text-[20px] font-bold tabular-nums mt-0.5">
                    {typeof s.value === "number"
                      ? s.value.toLocaleString("id-ID")
                      : s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* FILTER STRIP (sticky) */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="mx-auto max-w-[1320px] px-6 py-3 flex flex-wrap items-center gap-3">
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Filter
          </span>

          {segmented && (
            <div className="inline-flex flex-wrap gap-1 bg-slate-100 rounded-full p-1">
              {["Semua", ...segmented.options].map((k) => (
                <button
                  key={k}
                  onClick={() => setSeg(k)}
                  className="px-3 py-1 rounded-full text-[12px] font-medium transition-colors"
                  style={
                    seg === k
                      ? { background: NAVY, color: "#fff" }
                      : { color: "#475569" }
                  }
                >
                  {k}
                </button>
              ))}
            </div>
          )}

          {selects.map((sf, i) => (
            <select
              key={sf.label}
              value={sels[i]}
              onChange={(e) =>
                setSels((s) => s.map((v, j) => (j === i ? e.target.value : v)))
              }
              className="rounded-full border border-slate-300 bg-white h-9 pl-4 pr-8 text-[13px] text-slate-600 focus:outline-none focus:border-[#0f3d7a] cursor-pointer"
            >
              {["Semua", ...sf.options].map((o) => (
                <option key={o} value={o}>
                  {o === "Semua" ? sf.label : o}
                </option>
              ))}
            </select>
          ))}

          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari…"
            className="rounded-full border border-slate-300 bg-white h-9 px-4 text-[13px] focus:outline-none focus:border-[#0f3d7a] min-w-[200px]"
          />

          <span className="ml-auto text-[11px] font-mono uppercase tracking-wider text-slate-400 tabular-nums">
            {filtered.length}/{rows.length} entri
          </span>
        </div>
      </div>

      {/* TABLE */}
      <section className="mx-auto max-w-[1320px] px-6 py-6 pb-20">
        {error ? (
          <div className="bg-white rounded-xl border border-red-200 p-8 text-center text-red-600 text-[14px]">
            {error}
          </div>
        ) : loading ? (
          <div className="bg-white rounded-xl border border-slate-200 p-16 text-center text-slate-400">
            Memuat data dari Jakarta Atlas…
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[14px] border-collapse">
                  <thead>
                    <tr
                      style={{ background: NAVY }}
                      className="text-white text-left text-[12px] uppercase tracking-wider"
                    >
                      {columns.map((c) => (
                        <th
                          key={c.header}
                          className={`px-3 py-3 font-semibold whitespace-nowrap ${
                            c.align === "right"
                              ? "text-right"
                              : c.align === "center"
                              ? "text-center"
                              : ""
                          } ${c.className ?? ""}`}
                        >
                          {c.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r, i) => (
                      <tr
                        key={String(r.id ?? i)}
                        className="border-t border-slate-100 hover:bg-slate-50 transition-colors align-top"
                      >
                        {columns.map((c) => (
                          <td
                            key={c.header}
                            className={`px-3 py-3 ${
                              c.align === "right"
                                ? "text-right tabular-nums"
                                : c.align === "center"
                                ? "text-center"
                                : ""
                            } ${c.className ?? ""}`}
                          >
                            {c.cell(r, i)}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="px-3 py-12 text-center text-slate-400"
                        >
                          Tidak ada entri yang cocok dengan filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {filtered.length > visible && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() => setVisible((v) => v + pageSize)}
                  className="rounded-full border border-slate-300 bg-white px-5 py-2 text-[13px] font-medium text-slate-700 hover:border-[#0f3d7a] hover:text-[#0f3d7a] transition-colors"
                >
                  Muat {Math.min(pageSize, filtered.length - visible)} lagi
                </button>
                <button
                  onClick={() => setVisible(filtered.length)}
                  className="text-[13px] text-slate-500 hover:text-[#0f3d7a]"
                >
                  Tampilkan semua ({filtered.length})
                </button>
              </div>
            )}

            <p className="text-[12px] text-slate-400 mt-3 text-center">
              Menampilkan {paged.length} dari {filtered.length} entri terfilter.
              {footer ? ` ${footer}` : ""}
            </p>
          </>
        )}
      </section>
    </main>
  );
}
