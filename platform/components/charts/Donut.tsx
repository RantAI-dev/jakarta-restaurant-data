"use client";

import ReactECharts from "echarts-for-react";
import type { Point } from "@/lib/agg";

const PALETTE = ["#0f3d7a", "#e8a33d", "#0e7c42", "#b3261e", "#7c3aed", "#0891b2", "#64748b"];
const idfmt = (v: number) => v.toLocaleString("id-ID");

/** Proporsi (donut ECharts). */
export function Donut({ data }: { data: Point[] }) {
  if (!data.length)
    return (
      <div className="text-[13px] text-slate-400 py-6 text-center">
        Tidak ada data.
      </div>
    );

  const option = {
    color: PALETTE,
    tooltip: {
      trigger: "item",
      valueFormatter: (v: number) => idfmt(v),
    },
    legend: {
      orient: "vertical",
      right: 0,
      top: "center",
      textStyle: { color: "#475569", fontSize: 12 },
    },
    series: [
      {
        type: "pie",
        radius: ["52%", "74%"],
        center: ["32%", "50%"],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: "#fff", borderWidth: 2 },
        label: { show: false },
        data: data.map((d) => ({ name: d.label, value: d.value })),
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 240 }} notMerge lazyUpdate />;
}
