import { primaryData } from "@/lib/indicator-data";
import { groupCount, topN } from "@/lib/agg";
import { IndicatorShell, Block } from "./IndicatorShell";
import { KpiStat } from "@/components/charts/KpiStat";
import { BarBreakdown } from "@/components/charts/BarBreakdown";

/**
 * CI-HR — Jumlah kamar hotel (archetype D: registry usaha, COUNT baris).
 * Dataset: Usaha Penyediaan Akomodasi (uraian_kbli, jenis_usaha, skala_usaha,
 * kabupaten_atau_kota). Tiap baris = 1 usaha → count.
 */
export default async function CiHrView() {
  const d = await primaryData("CI-HR");
  const rows = d?.rows ?? [];
  const perJenis = topN(groupCount(rows, "uraian_kbli"), 10);
  const perSkala = groupCount(rows, "skala_usaha").sort((a, b) => b.value - a.value);
  const perKota = groupCount(rows, "kabupaten_atau_kota").sort((a, b) => b.value - a.value);

  return (
    <IndicatorShell code="CI-HR" source={d?.title}>
      <div className="grid sm:grid-cols-3 gap-4">
        <KpiStat label="Total usaha akomodasi" value={rows.length} />
        <KpiStat label="Jenis (KBLI)" value={new Set(rows.map((r) => r.uraian_kbli)).size} />
        <KpiStat label="Kota/Kab" value={perKota.length} />
      </div>
      <Block title="Per jenis akomodasi (KBLI)">
        <BarBreakdown data={perJenis} />
      </Block>
      <div className="grid md:grid-cols-2 gap-5">
        <Block title="Per skala usaha">
          <BarBreakdown data={perSkala} color="#0e7c42" />
        </Block>
        <Block title="Per kota/kabupaten">
          <BarBreakdown data={perKota} color="#e8a33d" />
        </Block>
      </div>
    </IndicatorShell>
  );
}
