import { query } from "./client";

/**
 * Modul query per domain. Setiap fungsi memetakan satu kebutuhan tampilan ke
 * satu mart Gold. Semua query berparameter.
 */

export type WismanKawasan = { kawasan: string; wisman: number };
export async function wismanPerKawasan(): Promise<WismanKawasan[]> {
  return query<WismanKawasan>(
    `SELECT kawasan, sum(jumlah) AS wisman
     FROM serving.mart_wisman GROUP BY kawasan ORDER BY wisman DESC`,
  );
}

export type WismanNegara = { negara: string; kawasan: string; wisman: number };
export async function wismanTopNegara(limit = 10): Promise<WismanNegara[]> {
  return query<WismanNegara>(
    `SELECT negara, kawasan, sum(jumlah) AS wisman
     FROM serving.mart_wisman GROUP BY negara, kawasan
     ORDER BY wisman DESC LIMIT {limit:UInt32}`,
    { limit },
  );
}

export type Readiness = {
  kode: string; framework: string; dimensi: string; nama: string;
  readiness: string; data_tersedia: number;
};
export async function gciReadiness(framework?: string): Promise<Readiness[]> {
  if (framework) {
    return query<Readiness>(
      `SELECT kode, framework, dimensi, nama, readiness, data_tersedia
       FROM serving.mart_gci_readiness WHERE framework = {fw:String}
       ORDER BY kode`,
      { fw: framework },
    );
  }
  return query<Readiness>(
    `SELECT kode, framework, dimensi, nama, readiness, data_tersedia
     FROM serving.mart_gci_readiness ORDER BY framework, kode`,
  );
}

export type ReadinessRingkas = { readiness: string; jumlah: number };
export async function readinessRingkas(): Promise<ReadinessRingkas[]> {
  return query<ReadinessRingkas>(
    `SELECT readiness, count() AS jumlah FROM serving.mart_gci_readiness
     GROUP BY readiness ORDER BY readiness`,
  );
}

export type Kuliner = {
  wilayah: string; jenis_usaha: string; jumlah_usaha: number;
};
export async function kulinerPerWilayah(): Promise<Kuliner[]> {
  return query<Kuliner>(
    `SELECT wilayah, jenis_usaha, sum(jumlah_usaha) AS jumlah_usaha
     FROM serving.mart_kuliner GROUP BY wilayah, jenis_usaha
     ORDER BY jumlah_usaha DESC`,
  );
}

export type Dtw = { destinasi: string; total: number; sumber: string };
export async function kunjunganDtw(limit = 31): Promise<Dtw[]> {
  return query<Dtw>(
    `SELECT destinasi, total, sumber FROM serving.mart_kunjungan_dtw
     ORDER BY total DESC LIMIT {limit:UInt32}`,
    { limit },
  );
}

/** Angka ringkas untuk kartu KPI beranda. */
export type Kpi = { label: string; nilai: number };
export async function kpiBeranda(): Promise<Kpi[]> {
  const rows = await query<{ metrik: string; nilai: string }>(
    `SELECT 'total_wisman' AS metrik, toString(sum(jumlah)) AS nilai FROM serving.mart_wisman
     UNION ALL SELECT 'indikator_ready', toString(countIf(readiness='ready')) FROM serving.mart_gci_readiness
     UNION ALL SELECT 'destinasi_dtw', toString(count()) FROM serving.mart_kunjungan_dtw
     UNION ALL SELECT 'usaha_kuliner', toString(sum(jumlah_usaha)) FROM serving.mart_kuliner`,
  );
  const map: Record<string, string> = {
    total_wisman: "Total kunjungan wisman",
    indikator_ready: "Indikator GCI/GPCI siap",
    destinasi_dtw: "Destinasi wisata terpantau",
    usaha_kuliner: "Usaha kuliner terdata",
  };
  return rows.map((r) => ({ label: map[r.metrik] ?? r.metrik, nilai: Number(r.nilai) }));
}
