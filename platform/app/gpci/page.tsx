import { computeReadiness } from "@/lib/gci/readiness";
import { FrameworkView } from "@/components/FrameworkView";

export const dynamic = "force-dynamic";

export default async function GpciPage() {
  const all = await computeReadiness();
  const rows = all.filter((r) => r.framework === "GPCI");
  return (
    <FrameworkView
      title="Mori — Global Power City Index (GPCI)"
      subtitle="Fungsi Cultural Interaction + konektivitas (Accessibility) pariwisata. Kesiapan data Dispar untuk mengisi indikator GPCI."
      rows={rows}
    />
  );
}
