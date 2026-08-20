"use client";

import ReactECharts from "echarts-for-react";

const BAR = "#ed6b23";
const LINE = "#0e7c42";
const idfmt = (v: number) => v.toLocaleString("id-ID");

/** Dual-axis: batang (kiri) + garis (kanan) — mis. Jumlah Tamu vs PDRB Ekraf %. */
export function ComboBarLine({
  categories,
  bar,
  line,
  height = 320,
}: {
  categories: string[];
  bar: { name: string; values: number[]; unit?: string };
  line: { name: string; values: number[]; unit?: string };
  height?: number;
}) {
  const option = {
    grid: { left: 6, right: 12, top: 36, bottom: 6, containLabel: true },
    tooltip: { trigger: "axis", axisPointer: { type: "cross" } },
    legend: { top: 0, textStyle: { color: "#475569", fontSize: 11 }, icon: "circle" },
    xAxis: {
      type: "category",
      data: categories,
      axisLabel: { color: "#94a3b8", fontSize: 11 },
      axisLine: { lineStyle: { color: "#e2e8f0" } },
      axisTick: { show: false },
    },
    yAxis: [
      {
        type: "value",
        name: bar.name,
        nameTextStyle: { color: "#94a3b8", fontSize: 10 },
        axisLabel: { color: "#94a3b8", formatter: (v: number) => idfmt(v) },
        splitLine: { lineStyle: { color: "#eef2f7" } },
        alignTicks: false,
      },
      {
        type: "value",
        name: line.name,
        position: "right",
        nameTextStyle: { color: "#94a3b8", fontSize: 10 },
        axisLabel: { color: "#94a3b8", formatter: (v: number) => `${v}${line.unit ?? ""}` },
        splitLine: { show: false },
        alignTicks: false,
      },
    ],
    series: [
      {
        name: bar.name,
        type: "bar",
        data: bar.values,
        barMaxWidth: 34,
        itemStyle: { color: BAR, borderRadius: [4, 4, 0, 0] },
      },
      {
        name: line.name,
        type: "line",
        yAxisIndex: 1,
        smooth: true,
        symbolSize: 7,
        lineStyle: { width: 2, color: LINE },
        itemStyle: { color: LINE },
        data: line.values,
      },
    ],
  };

  return (
    <ReactECharts option={option} style={{ height, width: "100%" }} notMerge lazyUpdate opts={{ renderer: "canvas" }} />
  );
}
