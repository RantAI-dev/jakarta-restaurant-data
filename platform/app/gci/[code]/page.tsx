import { notFound } from "next/navigation";
import { INDICATORS } from "@/lib/gci/indicators";
import { INDICATOR_VIEWS, IndicatorFallback } from "@/components/indicators/registry";

export const dynamic = "force-dynamic";

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
