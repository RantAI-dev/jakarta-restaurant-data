/**
 * Rakit data section Atlas "GMTI" dari sumber-sumber yang sudah ada.
 *
 * Masukan:
 *   data/gmti-ibadah.json          — 8.331 masjid & mushalla SIMAS (fetch-simas.ts)
 *   data/gmti-ibadah-coords.json   — koordinat baris signature (geocode-gmti.ts)
 *   data/halal-*.json, bandara-*, warisan-islam-*, capaian-*  — dataset halal
 *
 * Keluaran:
 *   lib/gmti-data.ts        — agregat + tempat ber-koordinat + capaian.
 *                             Kecil, di-import langsung oleh halaman.
 *   public/gmti-ibadah.json — daftar lengkap 8.331 baris. Di-fetch hanya saat
 *                             pengguna membuka pilar Ibadah, jadi tidak
 *                             membebani bundle JS halaman.
 *
 * Jalankan: npx tsx scripts/build-gmti.ts
 */

import { readFileSync, writeFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

import ibadahRaw from "../data/gmti-ibadah.json";
import restoran from "../data/halal-restoran-halal.json";
import hotel from "../data/halal-hotel-ramah-muslim.json";
import mall from "../data/halal-mall-fasilitas-halal.json";
import rph from "../data/halal-rph-halal.json";
import produk from "../data/halal-produk-kreatif-halal.json";
import inovasi from "../data/halal-inovasi-ramah-muslim.json";
import bandara from "../data/bandara-ramah-muslim-jakarta.json";
import warisan from "../data/warisan-islam-wisata-budaya-muslim-jakarta.json";
import capaian from "../data/capaian-pariwisata-ramah-muslim.json";

const at = (p: string) => fileURLToPath(new URL(p, import.meta.url));

type HalalRow = Record<string, string | undefined>;
type HalalFile = {
  slug: string;
  title: string;
  description: string;
  rows: HalalRow[];
};

type IbadahRow = {
  id: number;
  card?: string;
  name: string;
  address?: string;
  jenis: "masjid" | "mushalla";
  tipologi: string;
  kota?: string;
  kecamatan?: string;
};

type CoordEntry = { found: boolean; lat?: number; lon?: number; source?: string };

/**
 * Lima pilar tampilan. Ini pengelompokan kerja untuk halaman, bukan klaim
 * skor GMTI resmi — GMTI (Mastercard–CrescentRating) menilai di tingkat
 * negara/destinasi, bukan per fasilitas.
 */
const PILLARS = ["ibadah", "makan", "menginap", "destinasi", "program"] as const;
type Pillar = (typeof PILLARS)[number];

/** Dataset halal → pilar + label sumbernya di kartu. */
const HALAL_SOURCES: {
  file: HalalFile;
  pillar: Pillar;
  label: string;
  href: string;
}[] = [
  { file: restoran as HalalFile, pillar: "makan", label: "Restoran halal", href: "/sdi/restoran-halal-jakarta" },
  { file: rph as HalalFile, pillar: "makan", label: "RPH halal", href: "/sdi/rph-halal-jakarta" },
  { file: produk as HalalFile, pillar: "makan", label: "Produk kreatif halal", href: "/sdi/produk-kreatif-makanan-halal-jakarta" },
  { file: hotel as HalalFile, pillar: "menginap", label: "Hotel ramah muslim", href: "/sdi/hotel-ramah-muslim-jakarta" },
  { file: mall as HalalFile, pillar: "destinasi", label: "Mall ramah muslim", href: "/sdi/mall-ramah-muslim-jakarta" },
  { file: warisan as HalalFile, pillar: "destinasi", label: "Warisan Islam", href: "/sdi/warisan-islam-wisata-budaya-muslim-jakarta" },
  { file: bandara as HalalFile, pillar: "destinasi", label: "Bandara ramah muslim", href: "/sdi/bandara-ramah-muslim-jakarta" },
  { file: inovasi as HalalFile, pillar: "program", label: "Inovasi & program", href: "/sdi/inovasi-wisata-ramah-muslim-jakarta" },
];

/**
 * Tipologi yang tidak di-geocode (lihat geocode-gmti.ts) — dipakai di sini
 * untuk menandai baris mana yang memang tidak diharapkan punya titik.
 */
const NON_SIGNATURE = new Set(["Masjid Jami", "Mushalla Perumahan"]);

/**
 * Pencocokan nama kecamatan SIMAS ↔ GeoJSON. Bedanya cuma spasi
 * ("Kramatjati" vs "Kramat Jati", "Pal Merah" vs "Palmerah", "Pulogadung" vs
 * "Pulo Gadung"), jadi kunci pencocokan = huruf kecil tanpa spasi.
 * Kepulauan Seribu Utara/Selatan memang tidak ada poligonnya di GeoJSON
 * (42 fitur, hanya Jakarta daratan) — itu dilaporkan, bukan didiamkan.
 */
const geoKey = (s: string) => s.toLowerCase().replace(/[^a-z]/g, "");

const num = (v: string | undefined): number | undefined => {
  if (v == null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const clean = (v: string | undefined): string | undefined => {
  const s = (v ?? "").replace(/\s+/g, " ").trim();
  return s.length > 0 ? s : undefined;
};

/** Potong deskripsi panjang jadi satu kalimat ringkas untuk kartu. */
function shortNote(v: string | undefined): string | undefined {
  const s = clean(v);
  if (!s) return undefined;
  if (s.length <= 180) return s;
  const cut = s.slice(0, 180);
  const stop = cut.lastIndexOf(". ");
  return (stop > 80 ? cut.slice(0, stop + 1) : cut.trimEnd() + "…").trim();
}

function slugId(prefix: string, name: string, i: number): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${prefix}-${base || "x"}-${i}`;
}

async function main() {
  const ibadah = ibadahRaw.rows as IbadahRow[];

  let coords: Record<string, CoordEntry> = {};
  try {
    coords = JSON.parse(readFileSync(at("../data/gmti-ibadah-coords.json"), "utf8"));
  } catch {
    console.warn("! gmti-ibadah-coords.json belum ada — peta jalan tanpa pin ibadah");
  }

  // ── Daftar lengkap ibadah → public/ ──────────────────────────────────────
  const ibadahOut = ibadah.map((r) => {
    const c = coords[String(r.id)];
    return {
      id: r.id,
      card: r.card,
      name: r.name,
      address: r.address,
      jenis: r.jenis,
      tipologi: r.tipologi,
      kota: r.kota,
      kecamatan: r.kecamatan,
      lat: c?.found ? c.lat : undefined,
      lon: c?.found ? c.lon : undefined,
      coordSource: c?.found ? c.source : undefined,
    };
  });

  writeFileSync(
    at("../public/gmti-ibadah.json"),
    JSON.stringify({
      source: ibadahRaw.source,
      sourceUrl: ibadahRaw.sourceUrl,
      note: ibadahRaw.note,
      fetchedAt: ibadahRaw.fetchedAt,
      total: ibadahOut.length,
      rows: ibadahOut,
    })
  );

  // ── Agregat per kecamatan ────────────────────────────────────────────────
  type Agg = {
    kecamatan: string;
    kota: string;
    geoKey: string;
    masjid: number;
    mushalla: number;
    total: number;
  };
  const aggMap = new Map<string, Agg>();
  let tanpaKecamatan = 0;

  for (const r of ibadah) {
    const kec = clean(r.kecamatan);
    const kota = clean(r.kota) ?? "—";
    if (!kec) {
      tanpaKecamatan++;
      continue;
    }
    const key = `${kota}||${kec}`;
    let a = aggMap.get(key);
    if (!a) {
      a = { kecamatan: kec, kota, geoKey: geoKey(kec), masjid: 0, mushalla: 0, total: 0 };
      aggMap.set(key, a);
    }
    if (r.jenis === "masjid") a.masjid++;
    else a.mushalla++;
    a.total++;
  }
  const agg = [...aggMap.values()].sort((a, b) => b.total - a.total);

  // Laporkan kecamatan yang tidak punya poligon — eksplisit, bukan diam-diam.
  const geo = JSON.parse(
    readFileSync(at("../public/geo/dki-jakarta.geojson"), "utf8")
  ) as { features: { properties: { kecamatan: string } }[] };
  const geoKeys = new Set(geo.features.map((f) => geoKey(f.properties.kecamatan)));
  const tanpaPoligon = agg.filter((a) => !geoKeys.has(a.geoKey));
  if (tanpaPoligon.length) {
    console.log(
      `  catatan: ${tanpaPoligon.length} kecamatan tanpa poligon di GeoJSON — ` +
        tanpaPoligon.map((a) => `${a.kecamatan} (${a.total})`).join(", ")
    );
  }

  // ── Per tipologi ─────────────────────────────────────────────────────────
  const tipMap = new Map<string, { tipologi: string; jenis: string; count: number }>();
  for (const r of ibadah) {
    const t = tipMap.get(r.tipologi) ?? { tipologi: r.tipologi, jenis: r.jenis, count: 0 };
    t.count++;
    tipMap.set(r.tipologi, t);
  }
  const tipologi = [...tipMap.values()].sort((a, b) => b.count - a.count);

  // ── Tempat ber-koordinat: ibadah signature + seluruh dataset halal ───────
  type Place = {
    id: string;
    name: string;
    pillar: Pillar;
    kind: string;
    dataset: string;
    href?: string;
    address?: string;
    city?: string;
    district?: string;
    lat?: number;
    lon?: number;
    cert?: string;
    note?: string;
  };

  const places: Place[] = [];

  for (const r of ibadah) {
    const c = coords[String(r.id)];
    if (!c?.found || c.lat == null || c.lon == null) continue;
    places.push({
      id: `simas-${r.id}`,
      name: r.name,
      pillar: "ibadah",
      kind: r.tipologi,
      dataset: "SIMAS Kemenag",
      address: r.address,
      city: r.kota,
      district: r.kecamatan,
      lat: c.lat,
      lon: c.lon,
    });
  }

  for (const src of HALAL_SOURCES) {
    src.file.rows.forEach((row, i) => {
      const name = clean(row.nama);
      if (!name) return;
      places.push({
        id: slugId(src.file.slug.slice(0, 12), name, i),
        name,
        pillar: src.pillar,
        kind: clean(row.jenis) ?? src.label,
        dataset: src.label,
        href: src.href,
        address: clean(row.alamat),
        city: clean(row.kota),
        lat: num(row.lat),
        lon: num(row.lon),
        cert: clean(row.no_sertifikat_halal),
        note: shortNote(row.deskripsi),
      });
    });
  }

  // ── Capaian GMTI (bahan hero, bukan baris daftar) ────────────────────────
  const capaianRows = (capaian as HalalFile).rows
    .map((r) => ({
      nama: clean(r.nama) ?? "",
      pemberi: clean(r.pemberi),
      tahun: clean(r.tahun),
      tingkat: clean(r.tingkat),
      deskripsi: shortNote(r.deskripsi),
    }))
    .filter((r) => r.nama);

  // ── Tulis modul TS ───────────────────────────────────────────────────────
  const meta = {
    source: ibadahRaw.source,
    sourceUrl: ibadahRaw.sourceUrl,
    fetchedAt: ibadahRaw.fetchedAt,
    ibadahTotal: ibadah.length,
    masjid: ibadah.filter((r) => r.jenis === "masjid").length,
    mushalla: ibadah.filter((r) => r.jenis === "mushalla").length,
    /** Baris yang memang tidak di-geocode (fasilitas lingkungan). */
    ibadahNonSignature: ibadah.filter((r) => NON_SIGNATURE.has(r.tipologi)).length,
    ibadahSignature: ibadah.filter((r) => !NON_SIGNATURE.has(r.tipologi)).length,
    ibadahBerkoordinat: places.filter((p) => p.pillar === "ibadah").length,
    halalTotal: places.filter((p) => p.pillar !== "ibadah").length,
    halalBerkoordinat: places.filter(
      (p) => p.pillar !== "ibadah" && p.lat != null && p.lon != null
    ).length,
    kecamatan: agg.length,
    kecamatanTanpaPoligon: tanpaPoligon.map((a) => a.kecamatan),
    tanpaKecamatan,
  };

  const header = `/**
 * DIBUAT OTOMATIS oleh scripts/build-gmti.ts — jangan diedit manual.
 *
 * Sumber:
 * - Masjid & mushalla: SIMAS Kemenag RI, seluruh tipologi DKI Jakarta,
 *   snapshot ${meta.fetchedAt}.
 * - Ekosistem halal: dataset sekunder Dispar yang sudah tayang di katalog /sdi.
 *
 * Isi berkas ini sengaja KECIL (agregat + tempat ber-koordinat saja). Daftar
 * lengkap ${meta.ibadahTotal} baris ibadah ada di public/gmti-ibadah.json dan
 * di-fetch saat dibutuhkan, supaya tidak masuk bundle JS halaman.
 */

import type { GmtiAgg, GmtiCapaian, GmtiMeta, GmtiPlace, GmtiTipologi } from "./gmti";
`;

  const body =
    `\nexport const GMTI_META: GmtiMeta = ${JSON.stringify(meta, null, 2)};\n` +
    `\nexport const GMTI_AGG: GmtiAgg[] = ${JSON.stringify(agg, null, 1)};\n` +
    `\nexport const GMTI_TIPOLOGI: GmtiTipologi[] = ${JSON.stringify(tipologi, null, 1)};\n` +
    `\nexport const GMTI_PLACES: GmtiPlace[] = ${JSON.stringify(places, null, 1)};\n` +
    `\nexport const GMTI_CAPAIAN: GmtiCapaian[] = ${JSON.stringify(capaianRows, null, 1)};\n`;

  writeFileSync(at("../lib/gmti-data.ts"), header + body);

  const kb = (n: number) => `${Math.round(n / 1024)} KB`;
  console.log(
    `✓ lib/gmti-data.ts — ${places.length} tempat ` +
      `(${meta.ibadahBerkoordinat} ibadah + ${meta.halalTotal} halal), ` +
      `${agg.length} kecamatan, ${capaianRows.length} capaian ` +
      `[${kb((header + body).length)}]`
  );
  console.log(
    `✓ public/gmti-ibadah.json — ${ibadahOut.length} baris ` +
      `[${kb(statSync(at("../public/gmti-ibadah.json")).size)}]`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
