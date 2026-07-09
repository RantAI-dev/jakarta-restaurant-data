import type { Point } from "@/lib/agg";

/** Tren per periode (bar vertikal sederhana, pure CSS). */
export function LineTrend({ data }: { data: Point[] }) {
  if (data.length < 2)
    return <div className="text-[13px] text-slate-400 py-6 text-center">Data tren belum cukup.</div>;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-56 border-l border-b border-slate-200 pl-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group min-w-0">
          <div className="text-[10px] text-slate-500 mb-1 opacity-0 group-hover:opacity-100 whitespace-nowrap">
            {d.value.toLocaleString("id-ID")}
          </div>
          <div
            className="w-full rounded-t"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: 2, background: "#0f3d7a" }}
            title={`${d.label}: ${d.value.toLocaleString("id-ID")}`}
          />
          <div className="text-[10px] text-slate-500 mt-1 truncate w-full text-center">
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}
