import raw from "@/data/gci-gpci-benchmarks.json";

export type DataStatus = "punya" | "proksi" | "belum";
export type DataItem = { label: string; status: DataStatus; owner: string };

export type Benchmark = {
  indexMetric: string;
  indexSource: string;
  unit: string;
  frontier: { city: string; value: string };
  jakarta: { value: string | null; note: string };
  target: string;
  dataNeeded: DataItem[];
};

const map = raw as Record<string, Benchmark>;

export function benchmarkFor(code: string): Benchmark | null {
  return map[code] ?? null;
}
