import type { Point } from "@/lib/agg";

const COLORS = ["#0f3d7a", "#e8a33d", "#0e7c42", "#b3261e", "#7c3aed", "#0891b2"];

/** Proporsi (mis. wisman vs wisnus). Donut SVG sederhana + legenda. */
export function Donut({ data }: { data: Point[] }) {
  const sum = data.reduce((s, d) => s + d.value, 0) || 1;
  let acc = 0;
  const R = 60;
  const C = 2 * Math.PI * R;
  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 160 160" width="140" height="140" className="-rotate-90">
        {data.map((d, i) => {
          const frac = d.value / sum;
          const dash = frac * C;
          const seg = (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={COLORS[i % COLORS.length]}
              strokeWidth="24"
              strokeDasharray={`${dash} ${C - dash}`}
              strokeDashoffset={-acc * C}
            />
          );
          acc += frac;
          return seg;
        })}
      </svg>
      <ul className="text-[13px] space-y-1">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-sm"
              style={{ background: COLORS[i % COLORS.length] }}
            />
            <span className="text-slate-600">{d.label}</span>
            <span className="tabular-nums text-slate-900 font-medium">
              {((d.value / sum) * 100).toFixed(1)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
