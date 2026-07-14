"use client";

import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { fmtPeriode } from "@/lib/agg";

export type Bar = { label: string; value: number };
const NAVY = "#ed6b23";
const idfmt = (v: number) => v.toLocaleString("id-ID");

/** Bar vertikal per periode (ECharts). Dipakai tren framework & detail dataset. */
export function BarChart({ data }: { data: Bar[] }) {
  if (!data.length) return null;

  const option = {
    grid: { left: 6, right: 24, top: 16, bottom: 6, containLabel: true },
    tooltip: { trigger: "axis", valueFormatter: (v: number) => idfmt(v) },
    xAxis: {
      type: "category",
      data: data.map((d) => d.label),
      axisLabel: {
        color: "#94a3b8",
        fontSize: 11,
        hideOverlap: true,
        showMaxLabel: true,
        formatter: (v: string) => fmtPeriode(v),
      },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: "#94a3b8", formatter: (v: number) => idfmt(v) },
      splitLine: { lineStyle: { color: "#eef2f7" } },
    },
    series: [
      {
        type: "bar",
        data: data.map((d) => d.value),
        barMaxWidth: 28,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#1b5aa8" },
            { offset: 1, color: NAVY },
          ]),
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 240 }} notMerge lazyUpdate />;
}
