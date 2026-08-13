import { primaryData } from "@/lib/indicator-data";
import { groupSum, byPeriod, topN, total, idNum } from "@/lib/agg";
import { IndicatorShell, Block } from "./IndicatorShell";
import { KpiStat } from "@/components/charts/KpiStat";
import { RankedList } from "@/components/charts/RankedList";
import { LineTrend } from "@/components/charts/LineTrend";
import { Donut } from "@/components/charts/Donut";
import { PointMap } from "@/components/charts/PointMapClient";
import type { MapPoint } from "@/components/charts/PointMap";

/** CI-WH — World Heritage proximity (archetype A: peta, filter heritage). */
function filterByObyek(rows: Record<string, unknown>[], pattern: RegExp) {
  return rows.filter((r) => pattern.test(String(r.obyek_wisata ?? "")));
}

export default async function CiWhView() {
  const d = await primaryData("CI-WH");
  const rows = d?.rows ?? [];
  const filtered = filterByObyek(rows, /kota tua|heritage|fatahillah|onrust/i);
  const byObyek = topN(groupSum(filtered, "obyek_wisata", "jumlah_kunjungan"), 15);
  const trend = byPeriod(filtered, "periode_data", "jumlah_kunjungan");
  const points: MapPoint[] = filtered
    .map((r) => ({
      lat: Number(r.longitude),
      lng: Number(r.latitude),
      label: String(r.obyek_wisata ?? ""),
      value: idNum(r.jumlah_kunjungan) ?? 0,
    }))
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const wisman = groupSum(filtered, "jenis_wisatawan", "jumlah_kunjungan");

  return (
    <IndicatorShell code="CI-WH" sources={d ? [{ slug: d.slug, title: d.title }] : []}>
      <div className="grid sm:grid-cols-3 gap-4">
        <KpiStat label="Total kunjungan" value={total(byObyek)} />
        <KpiStat label="Obyek heritage" value={byObyek.length} />
        <KpiStat label="Titik terpetakan" value={points.length} />
      </div>
      <Block title="Sebaran titik obyek heritage"><PointMap points={points} /></Block>
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
