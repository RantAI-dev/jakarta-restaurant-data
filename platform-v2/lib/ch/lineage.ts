import { query } from "./client";

/**
 * Silsilah data untuk halaman /lineage. Diambil dari metadata nyata:
 * - _silver_meta.kolom_tipe: keputusan inferensi tipe per kolom Silver
 * - serving.system.tables: mart Gold + jumlah baris
 * Bukan digambar tangan — berubah sendiri saat pipeline jalan ulang.
 */

export type LapisanRingkas = {
  lapisan: string;
  jumlah_objek: number;
  keterangan: string;
};

export async function ringkasLapisan(): Promise<LapisanRingkas[]> {
  const [bronze] = await query<{ n: string }>(
    `SELECT toString(count()) AS n FROM system.tables
     WHERE database='lake' AND name LIKE 'bronze_%'`,
  );
  const [silver] = await query<{ n: string }>(
    `SELECT toString(count()) AS n FROM system.tables WHERE database='silver'`,
  );
  const [gold] = await query<{ n: string }>(
    `SELECT toString(count()) AS n FROM system.tables
     WHERE database='serving' AND name LIKE 'mart_%' AND name NOT LIKE '%_baru'`,
  );
  return [
    { lapisan: "Bronze", jumlah_objek: Number(bronze?.n ?? 0), keterangan: "Tabel Iceberg mentah (semua String + audit) di RustFS" },
    { lapisan: "Silver", jumlah_objek: Number(silver?.n ?? 0), keterangan: "View bertipe + dimensi bersih (dim_negara/bulan/wilayah/periode/indikator)" },
    { lapisan: "Gold", jumlah_objek: Number(gold?.n ?? 0), keterangan: "Mart MergeTree siap-saji yang dibaca dashboard" },
  ];
}

export type TipeRingkas = { tipe: string; jumlah: number };
export async function ringkasTipe(): Promise<TipeRingkas[]> {
  return query<TipeRingkas>(
    `SELECT tipe, count() AS jumlah FROM _silver_meta.kolom_tipe
     GROUP BY tipe ORDER BY jumlah DESC`,
  );
}

/** Kolom yang dipromosikan ke angka/tanggal dengan rasio konversi tertinggi. */
export type KolomTipe = {
  tabel: string; kolom: string; tipe: string; rasio_sukses: number;
};
export async function contohInferensi(limit = 25): Promise<KolomTipe[]> {
  return query<KolomTipe>(
    `SELECT tabel, kolom, tipe, rasio_sukses FROM _silver_meta.kolom_tipe
     WHERE dipromosikan = 1 ORDER BY rasio_sukses DESC, tabel LIMIT {limit:UInt32}`,
    { limit },
  );
}

/** Silsilah indikator: Gold ← Silver ← Bronze, contoh untuk halaman lineage. */
export type Silsilah = {
  indikator: string;
  gold: string;
  silver: string;
  bronze: string;
};
export function silsilahIndikator(): Silsilah[] {
  // Peta kurasi (statis: mendokumentasikan model tulis-tangan). Bagian otomatis
  // (contohInferensi) datang dari metadata; ini melengkapi untuk indikator kunci.
  return [
    {
      indikator: "Wisman per negara/bulan (CI-FV)",
      gold: "serving.mart_wisman",
      silver: "silver.wisman ← dim_negara + dim_bulan",
      bronze: "bronze_sdi.…ranking_wisatawan_mancanegara…kebangsaan",
    },
    {
      indikator: "Kesiapan GCI/GPCI (28 indikator)",
      gold: "serving.mart_gci_readiness",
      silver: "silver.dim_indikator",
      bronze: "bronze_file.gci_gpci_indicators",
    },
    {
      indikator: "Kuliner per wilayah (CE2)",
      gold: "serving.mart_kuliner",
      silver: "silver.restoran ← dim_wilayah",
      bronze: "bronze_sdi.…restoran_di_dki_jakarta",
    },
    {
      indikator: "Kunjungan 31 DTW",
      gold: "serving.mart_kunjungan_dtw",
      silver: "silver.kunjungan_dtw",
      bronze: "bronze_file.kunjungan_31_dtw_juli_2026_sumber_mentah",
    },
  ];
}
