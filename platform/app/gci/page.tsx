import { getReadiness } from "@/lib/report";
import { FrameworkView } from "@/components/FrameworkView";

// ISR: baca report snapshot, cache 24 jam. Tidak scan `record` tiap request.
export const revalidate = 86400;

export default async function GciPage() {
  const all = await getReadiness();
  const rows = all.filter((r) => r.framework === "GCI");
  return (
    <FrameworkView
      title="Kearney — Global Cities Index (GCI)"
      subtitle="Dimensi Cultural Experience + indikator pariwisata terkait. Kesiapan data Dispar untuk mengisi indikator GCI."
      rows={rows}
    />
  );
}
