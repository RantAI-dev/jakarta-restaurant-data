import type { Point } from "@/lib/agg";

/** Leaderboard top-N dengan peringkat + nilai. */
export function RankedList({ data, unit = "" }: { data: Point[]; unit?: string }) {
  if (!data.length)
    return <div className="text-[13px] text-slate-400 py-6 text-center">Tidak ada data.</div>;
  return (
    <ol className="divide-y divide-slate-100">
      {data.map((d, i) => (
        <li key={i} className="flex items-center gap-3 py-2 text-[13px]">
          <span className="w-6 text-right tabular-nums text-slate-400">{i + 1}</span>
          <span className="flex-1 truncate text-slate-700" title={d.label}>
            {d.label}
          </span>
          <span className="tabular-nums font-medium text-slate-900">
            {d.value.toLocaleString("id-ID")}
            {unit}
          </span>
        </li>
      ))}
    </ol>
  );
}
