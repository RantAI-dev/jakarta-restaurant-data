import { getReadiness } from "@/lib/report";
import { FrameworkView } from "@/components/FrameworkView";
import { GciOfficial } from "@/components/GciOfficial";

// ISR: baca report snapshot, cache 24 jam. Tidak scan `record` tiap request.
export const revalidate = 86400;

export default async function GciPage() {
  const all = await getReadiness();
  const rows = all.filter((r) => r.framework === "GCI");
  return (
    <>
      {/* GCI utama Jakarta (peringkat resmi Kearney) di atas */}
      <GciOfficial />
      {/* Dashboard kesiapan data indikator — digeser ke bawah */}
      <FrameworkView
        title="Kesiapan Data Indikator GCI"
        subtitle="Status kesiapan data Dispar untuk mengisi tiap indikator GCI (Kearney) — sumber dataset, tren, dan gap."
        rows={rows}
      />
    </>
  );
}
