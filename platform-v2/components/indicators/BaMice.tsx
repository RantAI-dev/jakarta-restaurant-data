import { primaryData } from "@/lib/indicator-data";
import { groupCount, topN } from "@/lib/agg";
import { IndicatorShell, Block } from "./IndicatorShell";
import { KpiStat } from "@/components/charts/KpiStat";
import { BarBreakdown } from "@/components/charts/BarBreakdown";

/** BA-MICE — Konferensi internasional (archetype D: registry count). */
export default async function BaMiceView() {
  const d = await primaryData("BA-MICE");
  const rows = d?.rows ?? [];
  const perJenis = topN(groupCount(rows, "uraian_kbli"), 10);
  const perSkala = groupCount(rows, "skala_usaha").sort((a, b) => b.value - a.value);
  const perKota = groupCount(rows, "kabupaten_atau_kota").sort((a, b) => b.value - a.value);

  return (
    <IndicatorShell code="BA-MICE" sources={d ? [{ slug: d.slug, title: d.title }] : []}>
      <div className="grid sm:grid-cols-3 gap-4">
        <KpiStat label="Total usaha MICE" value={rows.length} />
        <KpiStat label="Jenis (KBLI)" value={new Set(rows.map((r) => r.uraian_kbli)).size} />
        <KpiStat label="Kota/Kab" value={perKota.length} />
      </div>
      <Block title="Per jenis usaha MICE (KBLI)"><BarBreakdown data={perJenis} /></Block>
      <div className="grid md:grid-cols-2 gap-5">
        <Block title="Per skala usaha"><BarBreakdown data={perSkala} color="#0e7c42" /></Block>
        <Block title="Per kota/kabupaten"><BarBreakdown data={perKota} color="#e8a33d" /></Block>
      </div>
    </IndicatorShell>
  );
}
