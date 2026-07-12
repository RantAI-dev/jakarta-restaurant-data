"use client";

import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import { fmtPeriode, type Point } from "@/lib/agg";

const NAVY = "#0f3d7a";
const idfmt = (v: number) => v.toLocaleString("id-ID");

/** Tren per periode (ECharts area line). */
export function LineTrend({ data }: { data: Point[] }) {
  if (data.length < 2)
    return (
      <div className="text-[13px] text-slate-400 py-6 text-center">
        Data tren belum cukup.
      </div>
    );

  const option = {
    grid: { left: 6, right: 30, top: 16, bottom: 24, containLabel: true },
    tooltip: {
      trigger: "axis",
      valueFormatter: (v: number) => idfmt(v) + " kunjungan",
    },
    xAxis: {
      type: "category",
      name: "Periode",
      nameLocation: "middle",
      nameGap: 34,
      nameTextStyle: { color: "#94a3b8", fontSize: 11 },
      data: data.map((d) => d.label),
      boundaryGap: false,
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
      name: "Kunjungan",
      nameTextStyle: { color: "#94a3b8", fontSize: 11, align: "left" },
      axisLabel: { color: "#94a3b8", formatter: (v: number) => idfmt(v) },
      splitLine: { lineStyle: { color: "#eef2f7" } },
    },
    series: [
      {
        type: "line",
        data: data.map((d) => d.value),
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: NAVY, width: 2.5 },
        itemStyle: { color: NAVY },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(15,61,122,0.28)" },
            { offset: 1, color: "rgba(15,61,122,0.02)" },
          ]),
        },
      },
    ],
  };

  return <ReactECharts option={option} style={{ height: 260 }} notMerge lazyUpdate />;
}
