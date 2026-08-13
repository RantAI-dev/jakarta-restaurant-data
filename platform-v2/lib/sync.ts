/**
 * Di app v2, ingesti data dilakukan oleh PIPELINE lakehouse (dlt/Dagster ke
 * Bronze→Silver→Gold), bukan oleh app. Fungsi ini dipertahankan agar route
 * admin lama tetap kompilasi, tetapi mengarahkan ke pipeline.
 */
export async function syncDataset(_slug: string): Promise<number> {
  throw new Error(
    "Sync via app dinonaktifkan di v2. Jalankan pipeline lakehouse " +
      "(mis. `python -m dispar_ingest.refresh all` atau job Dagster `refresh_lakehouse`).",
  );
}
