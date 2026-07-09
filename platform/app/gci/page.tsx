import { computeReadiness } from "@/lib/gci/readiness";
import { FrameworkView } from "@/components/FrameworkView";

export const dynamic = "force-dynamic";

export default async function GciPage() {
  const all = await computeReadiness();
  const rows = all.filter((r) => r.framework === "GCI");
  return (
    <FrameworkView
      title="Kearney — Global Cities Index (GCI)"
      subtitle="Dimensi Cultural Experience + indikator pariwisata terkait. Kesiapan data Dispar untuk mengisi indikator GCI."
      rows={rows}
    />
  );
}
