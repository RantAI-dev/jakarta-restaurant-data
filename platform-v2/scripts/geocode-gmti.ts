/**
 * Cari koordinat untuk masjid/mushalla "signature" hasil fetch-simas.ts.
 *
 * SIMAS tidak memuat lat/lon di endpoint publiknya, jadi titik peta harus
 * dicari sendiri. Kita TIDAK meng-geocode seluruh 8.331 baris:
 *
 * - Masjid Jami (3.712) dan Mushalla Perumahan (3.214) adalah fasilitas
 *   lingkungan RT/RW dengan alamat pendek/ber-RT-RW; hasil geocoding-nya
 *   rawan meleset, dan titik yang salah lebih merugikan daripada tidak ada
 *   titik sama sekali. Keduanya tetap tampil di daftar & hitungan kecamatan.
 * - Sisanya (1.405 baris) di-geocode: Masjid Negara/Raya/Agung/Besar/
 *   Bersejarah/di Tempat Publik + Mushalla di Tempat Publik/Perkantoran/
 *   Pendidikan.
 *
 * Urutan sumber, dari yang paling murah:
 *   1. Cocokkan nama ke dataset warisan Islam yang koordinatnya sudah
 *      diverifikasi manual (Istiqlal dkk) — gratis dan lebih tepat.
 *   2. Nominatim OpenStreetMap — gratis, dibatasi 1 request/detik sesuai
 *      kebijakan pemakaiannya.
 *
 * Hasil ditulis ke data/gmti-ibadah-coords.json sebagai CACHE PERMANEN:
 * baris yang sudah punya entri tidak pernah dicari ulang, termasuk yang
 * sudah pernah gagal (ditandai found:false). Aman dijalankan berkali-kali.
 *
 * Jalankan: npx tsx scripts/geocode-gmti.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import ibadah from "../data/gmti-ibadah.json";
import warisan from "../data/warisan-islam-wisata-budaya-muslim-jakarta.json";

const COORDS_PATH = fileURLToPath(
  new URL("../data/gmti-ibadah-coords.json", import.meta.url)
);

const UA =
  "dispar-data-platform/1.0 (Dinas Pariwisata DKI Jakarta; pendataan GMTI; kleopasevan@gmail.com)";

/** Kebijakan Nominatim: maksimal 1 request per detik. */
const NOMINATIM_DELAY_MS = 1100;

/** Tipologi yang TIDAK di-geocode — lihat catatan di atas. */
const SKIP_TIPOLOGI = new Set(["Masjid Jami", "Mushalla Perumahan"]);

/**
 * Kotak batas DKI Jakarta termasuk Kepulauan Seribu (yang menjulur jauh ke
 * utara). Hasil di luar kotak ini dibuang, bukan dipaksa masuk peta.
 */
const DKI_BBOX = { minLat: -6.42, maxLat: -5.0, minLon: 106.3, maxLon: 107.1 };

/** Kotak Jakarta daratan — dipakai sebagai `viewbox` pencarian Nominatim. */
const MAINLAND_VIEWBOX = "106.68,-6.38,107.01,-6.08";

type IbadahRow = {
  id: number;
  name: string;
  address?: string;
  jenis: string;
  tipologi: string;
  kota?: string;
  kecamatan?: string;
};

type CoordEntry = {
  found: boolean;
  lat?: number;
  lon?: number;
  /** "warisan-islam" | "nominatim" */
  source?: string;
  /** Kueri yang berhasil — supaya hasilnya bisa ditelusuri ulang. */
  query?: string;
  checkedAt: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Normalisasi nama untuk pencocokan: buang gelar, tanda baca, spasi ganda. */
function normName(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,'"`\-–—()]/g, " ")
    .replace(/\b(masjid|mushalla|musholla|mushola|jami|jamik|raya|agung|besar|nasional|negara)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inDki(lat: number, lon: number): boolean {
  return (
    lat >= DKI_BBOX.minLat &&
    lat <= DKI_BBOX.maxLat &&
    lon >= DKI_BBOX.minLon &&
    lon <= DKI_BBOX.maxLon
  );
}

/** Alamat SIMAS sering berisi RT/RW & singkatan yang mengacaukan geocoder. */
function cleanAddress(addr: string): string {
  return addr
    .replace(/\brt\.?\s*\d+[\/\s]*rw\.?\s*\d+\b/gi, " ")
    .replace(/\brt\.?\s*\d+\b/gi, " ")
    .replace(/\brw\.?\s*\d+\b/gi, " ")
    .replace(/\bno\.?\s*\d+[a-z]?\b/gi, " ")
    .replace(/\bkm\.?\s*[\d.,]+\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type NominatimHit = { lat: string; lon: string };

async function nominatim(q: string): Promise<NominatimHit | null> {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q,
      format: "json",
      limit: "1",
      countrycodes: "id",
      viewbox: MAINLAND_VIEWBOX,
      bounded: "0",
    });
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`nominatim HTTP ${res.status}`);
  const hits = (await res.json()) as NominatimHit[];
  return hits[0] ?? null;
}

async function main() {
  const rows = (ibadah.rows as IbadahRow[]).filter(
    (r) => !SKIP_TIPOLOGI.has(r.tipologi)
  );
  console.log(
    `${rows.length} baris signature dari ${ibadah.rows.length} total ` +
      `(lewati ${[...SKIP_TIPOLOGI].join(" & ")})`
  );

  // Cache yang sudah ada — jangan pernah cari ulang.
  let cache: Record<string, CoordEntry> = {};
  try {
    cache = JSON.parse(readFileSync(COORDS_PATH, "utf8"));
    console.log(`cache lama: ${Object.keys(cache).length} entri`);
  } catch {
    console.log("cache lama: belum ada");
  }

  // Sumber 1 — koordinat yang sudah diverifikasi manual di dataset warisan.
  const verified = new Map<string, { lat: number; lon: number }>();
  for (const w of warisan.rows as { nama: string; lat?: string; lon?: string }[]) {
    const lat = Number(w.lat);
    const lon = Number(w.lon);
    if (!w.nama || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    verified.set(normName(w.nama), { lat, lon });
  }

  let fromCache = 0;
  let fromVerified = 0;
  let fromNominatim = 0;
  let failed = 0;
  let done = 0;

  for (const r of rows) {
    const key = String(r.id);
    if (cache[key]) {
      fromCache++;
      continue;
    }

    const hit = verified.get(normName(r.name));
    if (hit) {
      cache[key] = {
        found: true,
        lat: hit.lat,
        lon: hit.lon,
        source: "warisan-islam",
        checkedAt: new Date().toISOString(),
      };
      fromVerified++;
      continue;
    }

    // Sumber 2 — Nominatim. Coba alamat dulu (lebih spesifik), lalu
    // nama + kecamatan sebagai cadangan.
    const queries: string[] = [];
    if (r.address) {
      queries.push(
        [cleanAddress(r.address), r.kecamatan, r.kota, "DKI Jakarta"]
          .filter(Boolean)
          .join(", ")
      );
    }
    queries.push(
      [r.name, r.kecamatan, r.kota, "DKI Jakarta"].filter(Boolean).join(", ")
    );

    let entry: CoordEntry = { found: false, checkedAt: new Date().toISOString() };
    for (const q of queries) {
      await sleep(NOMINATIM_DELAY_MS);
      try {
        const res = await nominatim(q);
        if (!res) continue;
        const lat = Number(res.lat);
        const lon = Number(res.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        // Hasil di luar DKI dibuang — lebih baik tanpa titik daripada salah.
        if (!inDki(lat, lon)) continue;
        entry = {
          found: true,
          lat,
          lon,
          source: "nominatim",
          query: q,
          checkedAt: new Date().toISOString(),
        };
        break;
      } catch (err) {
        console.warn(`  ! ${r.name}: ${String(err)}`);
        await sleep(2000);
      }
    }

    cache[key] = entry;
    if (entry.found) fromNominatim++;
    else failed++;

    done++;
    if (done % 25 === 0) {
      console.log(
        `  ${done}/${rows.length - fromCache} dicari — ` +
          `${fromNominatim} ketemu, ${failed} gagal`
      );
      // Simpan berkala supaya kerja tidak hilang kalau proses terputus.
      writeFileSync(COORDS_PATH, JSON.stringify(cache, null, 1));
    }
  }

  writeFileSync(COORDS_PATH, JSON.stringify(cache, null, 1));

  const total = Object.values(cache).filter((c) => c.found).length;
  console.log(
    `\n✓ ${total} dari ${rows.length} baris signature punya koordinat\n` +
      `  dari cache: ${fromCache} · warisan-islam: ${fromVerified} · ` +
      `nominatim: ${fromNominatim} · gagal: ${failed}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
