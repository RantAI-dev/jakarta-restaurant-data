/**
 * Bangun report snapshot (readiness, dst.) dari data mentah di DB.
 *   npx tsx --env-file=.env.local scripts/db-build-report.ts
 * Setara memanggil GET/POST /api/admin/report — dipakai untuk isi awal / lokal.
 */
import { buildReports } from "../lib/report";

buildReports()
  .then((res) => {
    console.log("report dibangun:", res);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
