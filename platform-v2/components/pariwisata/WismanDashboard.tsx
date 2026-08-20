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
import { VerticalBars } from "@/components/charts/VerticalBars";
import { GroupedBars } from "@/components/charts/GroupedBars";
import { Treemap } from "@/components/charts/Treemap";
import { ComboBarLine } from "@/components/charts/ComboBarLine";

type Point = { label: string; value: number };
export type YearData = {
  total: number;
  monthly: Point[];
  quarterly: Point[];
  topNegara: Point[];
  donutNegara: Point[];
  peakMonth: Point | null;
  partial?: boolean;
};

/**
 * Target GCI 2.1.c — "Hadirnya Kota Destinasi Dunia dengan Ragam Amenitas".
 * Jumlah Tamu Mancanegara (orang) & kontribusi PDRB Ekraf (persen) dari dokumen
 * indikator. Tahun = asumsi (deret dari dokumen) — koreksi bila label berbeda.
 */
const TARGET_2_1_C = {
  tahun: ["2017", "2018", "2019", "2020", "2021", "2022", "2023", "2024"],
  tamu: [1273358, 1286092, 1289257, 1594162, 1848874, 2105833, 2332494, 2332494],
  pdrbEkraf: [10.63, 10.75, 10.87, 11, 11.12, 11.25, 11.36, 11.36],
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

  // Perbandingan kuartal antar tahun (Q1–Q4 per tahun) — hanya tahun yg ada kuartalnya.
  const quarterSeries = years
    .filter((y) => byYear[y]?.quarterly?.length)
    .map((y) => ({ name: byYear[y].partial ? `${y} •` : y, data: byYear[y].quarterly }));
  const quarterCats = ["Q1", "Q2", "Q3", "Q4"].filter((q) =>
    quarterSeries.some((s) => s.data.some((p) => p.label === q)),
  );

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
        <Kpi label="Pertumbuhan tahunan" value={yoy != null ? `${yoy.toFixed(1)}%` : "—"} delta={yoy} sub={prev ? `vs ${years[idx - 1]}` : "—"} />
      </KpiRow>

      <div className="mt-4">
        <ChartGrid>
          <ChartCard title={`Tren bulanan ${year}`} sub="kunjungan per bulan (batang)">
            <VerticalBars data={d.monthly} unit=" kunjungan" labelFmt={bulanLabel} />
          </ChartCard>
          <ChartCard title={`Top 15 negara asal ${year}`} sub="kunjungan per negara">
            <BarBreakdown data={d.topNegara} unit=" kunjungan" />
          </ChartCard>
          <ChartCard title={`Peta komposisi negara ${year}`} sub="treemap · proporsi & detail">
            <Treemap data={d.donutNegara} />
          </ChartCard>
          <ChartCard title={`Komposisi negara ${year}`} sub="top 8 + lainnya (donut)">
            <Donut data={d.donutNegara} />
          </ChartCard>
        </ChartGrid>
      </div>

      {/* Perbandingan kuartal antar tahun (Q1–Q4) */}
      {quarterSeries.length > 0 && quarterCats.length > 0 && (
        <div className="mt-4">
          <ChartCard
            title="Perbandingan kuartal antar tahun"
            sub={`Q1–Q4 dibandingkan lintas tahun${quarterSeries.some((s) => s.name.includes("•")) ? " · tahun berjalan ditandai •" : ""}`}
          >
            <GroupedBars series={quarterSeries} categories={quarterCats} unit=" kunjungan" />
          </ChartCard>
        </div>
      )}

      {/* Tren lintas-tahun (full width) */}
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

      {/* Perbandingan target GCI 2.1.c: Jumlah Tamu Mancanegara vs PDRB Ekraf */}
      <div className="mt-4">
        <ChartCard
          title="Target GCI 2.1.c — Tamu Mancanegara & PDRB Ekraf"
          sub="Jumlah tamu mancanegara (orang, batang) vs kontribusi PDRB Ekraf (persen, garis)"
        >
          <ComboBarLine
            categories={TARGET_2_1_C.tahun}
            bar={{ name: "Jumlah Tamu Mancanegara", values: TARGET_2_1_C.tamu, unit: " org" }}
            line={{ name: "PDRB Ekraf", values: TARGET_2_1_C.pdrbEkraf, unit: "%" }}
          />
          <p className="mt-2 apple-fine text-ink-muted-48">
            Sumber: dokumen indikator 2.1.c. Label tahun asumsi (deret dokumen) — sesuaikan bila berbeda.
          </p>
        </ChartCard>
      </div>
    </section>
  );
}
