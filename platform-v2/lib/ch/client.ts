import { createClient, type ClickHouseClient } from "@clickhouse/client";

/**
 * Klien ClickHouse untuk app v2. Membaca dari database `serving` (mart Gold
 * MergeTree), BUKAN dari Iceberg langsung — dashboard butuh latensi milidetik.
 *
 * Akun yang dipakai read-only & dibatasi (profil app_readonly di ClickHouse):
 * app tidak pernah punya izin tulis ke lake. Semua query di modul lib/ch
 * berparameter — tidak ada interpolasi string — karena /explorer & filter
 * menerima input pengguna.
 */

let _client: ClickHouseClient | null = null;

export function ch(): ClickHouseClient {
  if (_client) return _client;
  _client = createClient({
    url: process.env.CH_URL ?? "http://localhost:18123",
    username: process.env.CH_USER ?? "dispar_app",
    password: process.env.CH_PASSWORD ?? "disparapp",
    database: "serving",
    clickhouse_settings: {
      // Batas pengaman tambahan di sisi klien (profil server juga membatasi).
      max_execution_time: 30,
      max_result_rows: "100000",
      readonly: "1",
    },
  });
  return _client;
}

/** Jalankan query SELECT berparameter, kembalikan array baris bertipe T. */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  const rs = await ch().query({
    query: sql,
    query_params: params,
    format: "JSONEachRow",
  });
  return rs.json<T>();
}
