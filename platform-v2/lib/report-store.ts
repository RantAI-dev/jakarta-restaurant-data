/**
 * Di app v2, data berasal dari lakehouse (ClickHouse) — tidak ada tabel `report`
 * snapshot Postgres. Cache dinonaktifkan: getReportRaw selalu null sehingga
 * getReadiness()/rowsFor() menghitung langsung dari lakehouse (di-cache lagi oleh
 * ISR halaman). putReport jadi no-op. Kontrak fungsi dipertahankan agar
 * lib/report.ts & lib/indicator-data.ts tetap 1:1.
 */

export async function getReportRaw<T>(
  _key: string,
): Promise<{ data: T; generatedAt: Date } | null> {
  return null;
}

export async function putReport(_key: string, _data: unknown): Promise<void> {
  // no-op: lakehouse (Dagster) yang mengelola pembangunan data.
}
