import { notFound } from "next/navigation";
import { INDICATORS } from "@/lib/gci/indicators";
import { INDICATOR_VIEWS, IndicatorFallback } from "@/components/indicators/registry";

// ISR: render bespoke view (pickData) paling banyak sekali per 24 jam per
// indikator, lalu dilayani dari cache. Tidak scan `record` tiap request.
export const revalidate = 86400;

export default async function GciIndicatorPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const key = code.toUpperCase();
  if (!INDICATORS.some((i) => i.code === key)) notFound();
  const View = INDICATOR_VIEWS[key];
  return View ? <View /> : <IndicatorFallback code={key} />;
}
