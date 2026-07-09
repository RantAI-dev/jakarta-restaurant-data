import type { Point } from "@/lib/agg";

/** Bar horizontal untuk breakdown kategori/wilayah. */
export function BarBreakdown({
  data,
  unit = "",
  color = "#0f3d7a",
}: {
  data: Point[];
  unit?: string;
  color?: string;
}) {
  if (!data.length) return <Empty />;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-[13px]">
          <div className="w-44 truncate text-slate-600" title={d.label}>
            {d.label}
          </div>
          <div className="flex-1 bg-slate-100 rounded h-5">
            <div
              className="h-5 rounded"
              style={{ width: `${(d.value / max) * 100}%`, background: color, minWidth: 2 }}
            />
          </div>
          <div className="w-28 text-right tabular-nums text-slate-700">
            {d.value.toLocaleString("id-ID")}
            {unit}
          </div>
        </div>
      ))}
    </div>
  );
}

function Empty() {
  return <div className="text-[13px] text-slate-400 py-6 text-center">Tidak ada data.</div>;
}
