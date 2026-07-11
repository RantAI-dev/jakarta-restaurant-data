import { primaryData } from "@/lib/indicator-data";
import { groupSum, total } from "@/lib/agg";
import { IndicatorShell, Block } from "./IndicatorShell";
import { KpiStat } from "@/components/charts/KpiStat";
import { BarBreakdown } from "@/components/charts/BarBreakdown";
import { Donut } from "@/components/charts/Donut";

/** CI-SH — Shopping attractiveness (archetype G: survei pengeluaran). */
export default async function CiShView() {
  const d = await primaryData("CI-SH");
  const rows = d?.rows ?? [];
  const perNegara = groupSum(rows, "asal_negara", "rata_rata")
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);
  const wisman = groupSum(rows, "jenis_wisatawan", "rata_rata");

  return (
    <IndicatorShell code="CI-SH" source={d?.title}>
      <div className="grid sm:grid-cols-3 gap-4">
        <KpiStat label="Total responden" value={total(groupSum(rows, "asal_negara", "jumlah_responden"))} />
        <KpiStat label="Negara asal" value={perNegara.length} />
        <KpiStat label="Rata-rata keseluruhan" value={Math.round(total(perNegara))} />
      </div>
      <Block title="Rata-rata pengeluaran per negara asal"><BarBreakdown data={perNegara} /></Block>
      {wisman.length > 0 && (
        <Block title="Komposisi wisman / wisnus"><Donut data={wisman} /></Block>
      )}
    </IndicatorShell>
  );
}
