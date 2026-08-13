import { createClient, type ClickHouseClient } from "@clickhouse/client";

/**
 * Klien ClickHouse untuk app v2. Menggantikan koneksi Postgres (lib/db):
 * seluruh data kini berasal dari lakehouse (database lake/silver/serving).
 * Akun read-only. Lazy + memoized supaya `next build` tak konek saat module-load.
 */
let _client: ClickHouseClient | null = null;

export function ch(): ClickHouseClient {
  if (_client) return _client;
  // Batas (readonly, max_execution_time, max_result_rows) sudah dipaksa oleh
  // profil server `app_readonly`. JANGAN set di sini: mengubah setting dalam
  // sesi readonly ditolak ClickHouse (error READONLY).
  _client = createClient({
    url: process.env.CH_URL ?? "http://localhost:18123",
    username: process.env.CH_USER ?? "dispar_app",
    password: process.env.CH_PASSWORD ?? "disparapp",
  });
  return _client;
}

/** SELECT berparameter → array baris bertipe T. */
export async function q<T = Record<string, unknown>>(
  sql: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  const rs = await ch().query({ query: sql, query_params: params, format: "JSONEachRow" });
  return rs.json<T>();
}
