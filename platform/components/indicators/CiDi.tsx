import { primaryData } from "@/lib/indicator-data";
import { groupSum, topN, total } from "@/lib/agg";
import { IndicatorShell, Block } from "./IndicatorShell";
import { KpiStat } from "@/components/charts/KpiStat";
import { BarBreakdown } from "@/components/charts/BarBreakdown";
import { RankedList } from "@/components/charts/RankedList";

/** CI-DI — Dining attractiveness (archetype C: breakdown wilayah). */
export default async function CiDiView() {
  const d = await primaryData("CI-DI");
  const rows = d?.rows ?? [];
  const perWilayah = groupSum(rows, "wilayah", "jumlah").sort((a, b) => b.value - a.value);
  const perKecamatan = topN(groupSum(rows, "kecamatan", "jumlah"), 12);
  const grand = total(perWilayah);

  return (
    <IndicatorShell code="CI-DI" source={d?.title}>
      <div className="grid sm:grid-cols-3 gap-4">
        <KpiStat label="Total usaha kuliner" value={grand} />
        <KpiStat label="Wilayah" value={perWilayah.length} />
        <KpiStat label="Kecamatan terdata" value={new Set(rows.map((r) => r.kecamatan)).size} />
      </div>
      <Block title="Sebaran per wilayah (kota)"><BarBreakdown data={perWilayah} /></Block>
      <Block title="Top kecamatan"><RankedList data={perKecamatan} /></Block>
    </IndicatorShell>
  );
}
