import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function makeDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum di-set (lihat Task 0).");
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

// Lazy + memoized: error/koneksi baru muncul saat handler query,
// bukan saat module-load (memecah `next build` collect page data).
let _db: ReturnType<typeof makeDb> | null = null;
const getDb = () => (_db ??= makeDb());

export const db = new Proxy({} as ReturnType<typeof makeDb>, {
  get(_t, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[
      prop as string
    ];
  },
});
export { schema };