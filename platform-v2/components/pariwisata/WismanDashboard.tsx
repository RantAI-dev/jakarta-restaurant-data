"use client";

/**
 * Dashboard interaktif wisman: pemilih TAHUN yang mengganti KPI + chart bagian
 * atas (per tahun), plus tren lintas-tahun full-width di bawah. Data dihitung
 * server-side lalu dioper sebagai props (JSON) — komponen ini murni presentasi.
 */
import { useState } from "react";
import { KpiRow, Kpi, ChartCard, ChartGrid, PALETTE } from "./DashboardKit";
import { bulanLabel } from "@/lib/pariwisata/parse";
import { BarBreakdown } from "@/components/charts/BarBreakdown";
import { Donut } from "@/components/charts/Donut";
import { LineTrend } from "@/components/charts/LineTrend";

type Point = { label: string; value: number };
export type YearData = {
  total: number;
  monthly: Point[];
  topNegara: Point[];
  donutNegara: Point[];
  peakMonth: Point | null;
  partial?: boolean;
};

export function WismanDashboard({
  years,
  byYear,
  yearlyTotals,
  defaultYear,
}: {
  years: string[];
  byYear: Record<string, YearData>;
  yearlyTotals: Point[];
  defaultYear: string;
}) {
  const [year, setYear] = useState(defaultYear);
  const activeYear = byYear[year] ? year : years[0];
  const d = activeYear ? byYear[activeYear] : null;

  if (!years.length || !d) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-400">
        Data wisman belum tersedia.
      </section>
    );
  }

  const idx = years.indexOf(activeYear);
  const prev = idx > 0 ? byYear[years[idx - 1]] : null;
  const yoy = prev && prev.total ? ((d.total - prev.total) / prev.total) * 100 : null;

  return (
    <section>
      {/* Pemilih tahun */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="apple-fine uppercase tracking-wider text-ink-muted-48">Pilih tahun</span>
        <div className="inline-flex rounded-xl border border-hairline bg-white p-1 shadow-sm">
          {years.map((y) => {
            const active = y === year;
            return (
              <button
                key={y}
                onClick={() => setYear(y)}
                aria-pressed={active}
                className={`rounded-lg px-4 py-1.5 text-[13px] font-semibold tabular-nums transition-colors ${
                  active ? "text-white" : "text-ink-muted-48 hover:text-ink"
                }`}
                style={active ? { background: "#ed6b23" } : undefined}
              >
                {y}
                {byYear[y]?.partial && <span className="ml-1 text-[10px] opacity-70">•</span>}
              </button>
            );
          })}
        </div>
        {d.partial && (
          <span className="apple-fine text-ink-muted-48">• {year} masih berjalan (data parsial)</span>
        )}
      </div>

      <KpiRow>
        <Kpi label={`Total wisman ${year}`} value={d.total} sub="akumulasi bulanan" />
        <Kpi
          label="Negara asal terbanyak"
          value={d.topNegara[0]?.label ?? "—"}
          sub={d.topNegara[0] ? d.topNegara[0].value.toLocaleString("id-ID") + " kunjungan" : undefined}
        />
        <Kpi
          label="Puncak bulan"
          value={d.peakMonth ? bulanLabel(d.peakMonth.label) : "—"}
          sub={d.peakMonth ? d.peakMonth.value.toLocaleString("id-ID") + " kunjungan" : undefined}
        />
        <Kpi label="Pertumbuhan YoY" value={yoy != null ? `${yoy.toFixed(1)}%` : "—"} delta={yoy} sub={prev ? `vs ${years[idx - 1]}` : "—"} />
      </KpiRow>

      <div className="mt-4">
        <ChartGrid>
          <ChartCard title={`Tren bulanan ${year}`} sub="kunjungan per bulan">
            <LineTrend data={d.monthly} />
          </ChartCard>
          <ChartCard title={`Top 10 negara asal ${year}`}>
            <BarBreakdown data={d.topNegara} unit=" kunjungan" />
          </ChartCard>
          <ChartCard title={`Komposisi negara ${year}`} sub="top 10 + lainnya">
            <Donut data={d.donutNegara} />
          </ChartCard>
        </ChartGrid>
      </div>

      {/* Tren lintas-tahun (full width, di bawah) */}
      <div className="mt-4">
        <ChartCard
          title="Tren wisman per tahun"
          sub={`total kunjungan tahunan${
            yearlyTotals.some((y) => byYear[y.label]?.partial) ? " · tahun berjalan ditandai •" : ""
          }`}
        >
          <BarBreakdown
            data={yearlyTotals.map((y) => ({
              label: byYear[y.label]?.partial ? `${y.label} •` : y.label,
              value: y.value,
            }))}
            unit=" kunjungan"
            color={PALETTE[2]}
          />
        </ChartCard>
      </div>
    </section>
  );
}
