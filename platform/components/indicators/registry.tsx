import type { ComponentType } from "react";
import Ce2View from "./Ce2";
import CiHrView from "./CiHr";
import { IndicatorShell } from "./IndicatorShell";
import { INDICATORS } from "@/lib/gci/indicators";

/**
 * Registry komponen bespoke per indikator. Tambah entri saat komponen dibuat
 * (Plan 7 Task 5). Kode yang belum ada → IndicatorFallback (placeholder rapi).
 */
export const INDICATOR_VIEWS: Record<string, ComponentType> = {
  CE2: Ce2View,
  "CI-HR": CiHrView,
  // TODO Plan 7: CE1, CE3, CE4, BA-MICE, CI-FV, CI-IC, CI-CE, CI-CX, CI-AM,
  // CI-TA, CI-WH, CI-TH, CI-MU, CI-LH, CI-SH, CI-DI, CI-NL
};

export function IndicatorFallback({ code }: { code: string }) {
  const ind = INDICATORS.find((i) => i.code === code);
  return (
    <IndicatorShell code={code}>
      <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white/50 p-8 text-center">
        <div className="text-[15px] font-semibold text-slate-600">
          Dashboard indikator sedang dibangun
        </div>
        <div className="text-[13px] text-slate-500 mt-1 max-w-[60ch] mx-auto">
          {ind
            ? `${ind.code} · ${ind.name} — bespoke view belum dibuat. Lihat Plan 7 (archetype ${ind.group}). ${ind.note || ""}`
            : "Indikator tidak dikenal."}
        </div>
        <div className="mt-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
          TODO · Plan 7 Task 5
        </div>
      </div>
    </IndicatorShell>
  );
}
