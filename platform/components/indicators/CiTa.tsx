import { pickData } from "@/lib/indicator-data";
import { groupSum, byPeriod, topN, total, idNum } from "@/lib/agg";
import { IndicatorShell, Block } from "./IndicatorShell";
import { KpiStat } from "@/components/charts/KpiStat";
import { RankedList } from "@/components/charts/RankedList";
import { LineTrend } from "@/components/charts/LineTrend";
import { Donut } from "@/components/charts/Donut";
import { PointMap } from "@/components/charts/PointMapClient";
import type { MapPoint } from "@/components/charts/PointMap";

/** CI-TA — Tourist Attractions (archetype A: peta titik, semua obyek). */
export default async function CiTaView() {
  const d = await pickData("CI-TA", ["obyek_wisata", "jumlah_kunjungan"]);
  const rows = d?.rows ?? [];
  const byObyek = topN(groupSum(rows, "obyek_wisata", "jumlah_kunjungan"), 15);
  const trend = byPeriod(rows, "periode_data", "jumlah_kunjungan");
  // SWAP lat/lng — kolom dataset obyek_wisata TERBALIK.
  const points: MapPoint[] = rows
    .map((r) => ({
      lat: Number(r.longitude),
      lng: Number(r.latitude),
      label: String(r.obyek_wisata ?? ""),
      value: idNum(r.jumlah_kunjungan) ?? 0,
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const wisman = groupSum(rows, "jenis_wisatawan", "jumlah_kunjungan");

  return (
    <IndicatorShell code="CI-TA" source={d?.title}>
      <div className="grid sm:grid-cols-3 gap-4">
        <KpiStat label="Total kunjungan" value={total(byObyek)} />
        <KpiStat label="Obyek wisata" value={byObyek.length} />
        <KpiStat label="Titik terpetakan" value={points.length} />
      </div>
      <Block title="Sebaran titik obyek wisata"><PointMap points={points} /></Block>
      <div className="grid md:grid-cols-2 gap-5">
        <Block title="Top 15 obyek (kunjungan)"><RankedList data={byObyek} /></Block>
        <Block title="Komposisi wisman / wisnus"><Donut data={wisman} /></Block>
      </div>
      {trend.length >= 2 && (
        <Block title="Tren kunjungan per periode"><LineTrend data={trend} /></Block>
      )}
    </IndicatorShell>
  );
}
