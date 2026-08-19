"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";

/**
 * Pembungkus tipis Apache ECharts untuk React 19 (tanpa echarts-for-react yang
 * memakai findDOMNode). Menerima `option` jadi, urus init/setOption/resize/dispose.
 */
export function EChart({
  option,
  height = 300,
  className,
}: {
  option: echarts.EChartsOption;
  height?: number | string;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!elRef.current) return;
    const chart = echarts.init(elRef.current, undefined, { renderer: "canvas" });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(elRef.current);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return <div ref={elRef} style={{ width: "100%", height }} className={className} />;
}
