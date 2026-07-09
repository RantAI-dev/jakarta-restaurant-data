export type Bar = { label: string; value: number };

/** Chart batang sederhana tanpa library — tinggi bar relatif ke nilai maks. */
export function BarChart({ data }: { data: Bar[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-64 border-l border-b border-slate-200 pl-2">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center justify-end h-full group min-w-0"
        >
          <div className="text-[10px] text-slate-500 mb-1 opacity-0 group-hover:opacity-100 whitespace-nowrap">
            {d.value.toLocaleString("id-ID")}
          </div>
          <div
            className="w-full rounded-t"
            style={{
              height: `${(d.value / max) * 100}%`,
              minHeight: 2,
              background: "#0f3d7a",
            }}
            title={`${d.label}: ${d.value.toLocaleString("id-ID")}`}
          />
          <div className="text-[10px] text-slate-500 mt-1 truncate max-w-full w-full text-center">
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}