import { getReadiness } from "@/lib/report";
import { FrameworkView } from "@/components/FrameworkView";

// ISR: baca report snapshot, cache 24 jam. Tidak scan `record` tiap request.
export const revalidate = 86400;

export default async function GpciPage() {
  const all = await getReadiness();
  const rows = all.filter((r) => r.framework === "GPCI");
  return (
    <FrameworkView
      title="Mori — Global Power City Index (GPCI)"
      subtitle="Fungsi Cultural Interaction + konektivitas (Accessibility) pariwisata. Kesiapan data Dispar untuk mengisi indikator GPCI."
      rows={rows}
    />
  );
}
