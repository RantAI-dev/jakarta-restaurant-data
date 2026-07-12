import { primaryData } from "@/lib/indicator-data";
import { byPeriod, idNum } from "@/lib/agg";
import { IndicatorShell, Block } from "./IndicatorShell";
import { KpiStat } from "@/components/charts/KpiStat";
import { GroupedLines } from "@/components/charts/GroupedLines";

/** CI-LH — Luxury hotel occupancy (archetype F: occupancy hotel).
 *  Pakai idNum() — occupancy disimpan dengan koma desimal ("51,85").
 */
export default async function CiLhView() {
  const d = await primaryData("CI-LH");
  const rows = d?.rows ?? [];
  const byHotel = new Map<string, Record<string, unknown>[]>();
  for (const r of rows) {
    const k = String(r.jenis_hotel ?? "—");
    if (!byHotel.has(k)) byHotel.set(k, []);
    byHotel.get(k)!.push(r);
  }
  const series = [...byHotel.entries()].map(([name, rs]) => ({
    name,
    data: byPeriod(rs, "periode_data", "rata_rata").map((p) => ({ label: p.label, value: idNum(p.value) ?? 0 })),
  }));
  const star5 = rows
    .filter((r) => /5\s*[★*]?|bintang\s*5/i.test(String(r.jenis_hotel ?? "")))
    .sort((a, b) => String(b.periode_data ?? "").localeCompare(String(a.periode_data ?? "")))[0];
  const latest5 = star5 ? idNum(star5.rata_rata) : null;

  return (
    <IndicatorShell code="CI-LH" sources={d ? [{ slug: d.slug, title: d.title }] : []}>
      <div className="grid sm:grid-cols-3 gap-4">
        <KpiStat label="Jenis hotel" value={byHotel.size} />
        <KpiStat label="Baris data" value={rows.length} />
        <KpiStat
          label="Okupansi bintang 5 (terbaru)"
          value={latest5 === null ? "—" : `${latest5.toFixed(2)}%`}
          sub={star5 ? String(star5.periode_data ?? "") : undefined}
        />
      </div>
      <Block title="Okupansi per jenis hotel (% rata-rata)"><GroupedLines series={series} /></Block>
    </IndicatorShell>
  );
}
