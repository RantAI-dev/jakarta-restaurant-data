/** Angka besar + label (+ sub opsional). */
export function KpiStat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
        {label}
      </div>
      <div className="text-[30px] font-bold tabular-nums text-slate-900 mt-1">
        {typeof value === "number" ? value.toLocaleString("id-ID") : value}
      </div>
      {sub && <div className="text-[12px] text-slate-500 mt-0.5">{sub}</div>}
    </div>
  );
}
