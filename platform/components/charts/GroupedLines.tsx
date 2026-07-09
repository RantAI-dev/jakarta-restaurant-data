import type { Point } from "@/lib/agg";
import { LineTrend } from "./LineTrend";

/** Beberapa seri per periode (mis. occupancy per jenis hotel) — small multiples. */
export function GroupedLines({
  series,
}: {
  series: { name: string; data: Point[] }[];
}) {
  if (!series.length)
    return <div className="text-[13px] text-slate-400 py-6 text-center">Tidak ada data.</div>;
  return (
    <div className="grid md:grid-cols-2 gap-5">
      {series.map((s) => (
        <div key={s.name}>
          <div className="text-[13px] font-medium text-slate-700 mb-2">{s.name}</div>
          <LineTrend data={s.data} />
        </div>
      ))}
    </div>
  );
}
