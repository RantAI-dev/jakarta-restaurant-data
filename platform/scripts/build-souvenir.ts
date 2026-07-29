/**
 * Bangun datamart toko suvenir Jakarta (hasil crawl TripAdvisor + verifikasi
 * riset) dari TSV deliverable di root repo menjadi dua artefak:
 *
 *   1. platform/data/souvenir-tripadvisor-2026.json — {columns, rows} untuk
 *      katalog /sdi (dibaca scripts/db-seed-souvenir.ts).
 *   2. platform/lib/souvenir.ts — array in-code SOUVENIR_SHOPS untuk view
 *      Atlas + mirror atlas_record (pola sama seperti lib/golf.ts).
 *
 *   npx tsx scripts/build-souvenir.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SRC = join(process.cwd(), "..", "data-souvenir-GCI-jakarta.tsv");

type Raw = Record<string, string>;

const lines = readFileSync(SRC, "utf8").split("\n").filter((l) => l.trim() !== "");
const header = lines[0].split("\t");
const raw: Raw[] = lines.slice(1).map((l) => {
  const cells = l.split("\t");
  return Object.fromEntries(header.map((h, i) => [h, (cells[i] ?? "").trim()]));
});

/** Kolom bermakna untuk halaman detail /sdi (label = header TSV). */
const columns = [
  { key: "no", label: "No.", type: "number", description: null },
  { key: "nama", label: "Nama Toko", type: "string", description: null },
  {
    key: "kategori_tripadvisor",
    label: "Kategori TripAdvisor",
    type: "string",
    description: "Subkategori Shopping pada TripAdvisor (c26).",
  },
  {
    key: "relevan_suvenir",
    label: "Relevan Suvenir",
    type: "string",
    description:
      "Ya = toko suvenir/oleh-oleh/kerajinan; Sebagian = pasar/mal yang sebagian menjual suvenir; Tidak = bukan toko suvenir meski dikategorikan demikian oleh TripAdvisor.",
  },
  { key: "produk_utama", label: "Produk Utama", type: "string", description: null },
  { key: "alamat", label: "Alamat", type: "string", description: null },
  { key: "kota_administrasi", label: "Kota Administrasi", type: "string", description: null },
  { key: "kecamatan", label: "Kecamatan", type: "string", description: null },
  { key: "lat", label: "Lintang (lat)", type: "number", description: null },
  { key: "lon", label: "Bujur (lon)", type: "number", description: null },
  {
    key: "sumber_koordinat",
    label: "Sumber Koordinat",
    type: "string",
    description:
      "TripAdvisor = koordinat asli; Koreksi riset = koordinat TripAdvisor salah dan diperbaiki lewat penelusuran sumber.",
  },
  { key: "telepon", label: "Telepon", type: "string", description: null },
  { key: "rating", label: "Rating TripAdvisor", type: "number", description: null },
  { key: "jumlah_ulasan", label: "Jumlah Ulasan", type: "number", description: null },
  { key: "status", label: "Status Operasional", type: "string", description: null },
  { key: "catatan", label: "Catatan & Sumber", type: "string", description: null },
  { key: "url_tripadvisor", label: "URL TripAdvisor", type: "string", description: null },
];

const num = (v: string): number | null => {
  if (!v) return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
};

const splitCoord = (v: string): [number | null, number | null] => {
  if (!v.includes(",")) return [null, null];
  const [a, b] = v.split(",");
  const la = Number(a);
  const lo = Number(b);
  return [Number.isFinite(la) ? la : null, Number.isFinite(lo) ? lo : null];
};

const rows = raw.map((r) => {
  const [lat, lon] = splitCoord(r["Koordinat"]);
  return {
    no: Number(r["No."]),
    nama: r["Nama"],
    kategori_tripadvisor: r["Kategori TripAdvisor"],
    relevan_suvenir: r["Relevan Suvenir"],
    produk_utama: r["Produk Utama"],
    alamat: r["Alamat"],
    kota_administrasi: r["Kota Administrasi"],
    kecamatan: r["Kecamatan"],
    lat,
    lon,
    sumber_koordinat: r["Sumber Koordinat"],
    telepon: r["Telepon"],
    rating: num(r["Rating"]),
    jumlah_ulasan: num(r["Jumlah Ulasan"]),
    status: r["Status"],
    catatan: r["Catatan"],
    url_tripadvisor: r["URL TripAdvisor"],
  };
});

writeFileSync(
  join(process.cwd(), "data", "souvenir-tripadvisor-2026.json"),
  JSON.stringify({ columns, rows }, null, 2) + "\n"
);

/* ---------- lib/souvenir.ts (sumber view Atlas) ---------- */

const slugId = (s: string, i: number) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || `toko-${i}`;

const shops = rows.map((r, i) => ({
  id: slugId(r.nama, i),
  name: r.nama,
  category: r.kategori_tripadvisor,
  relevance: r.relevan_suvenir,
  product: r.produk_utama || undefined,
  address: r.alamat || undefined,
  city: r.kota_administrasi || undefined,
  district: r.kecamatan || undefined,
  lat: r.lat ?? undefined,
  lng: r.lon ?? undefined,
  coordSource: r.sumber_koordinat || undefined,
  phone: r.telepon || undefined,
  rating: r.rating ?? undefined,
  reviews: r.jumlah_ulasan ?? undefined,
  status: r.status || undefined,
  note: r.catatan || undefined,
  url: r.url_tripadvisor || undefined,
}));

const ts = `/**
 * Toko suvenir, oleh-oleh & kerajinan Jakarta yang terdaftar di TripAdvisor.
 *
 * Sumber: crawl TripAdvisor geo g294229 (Jakarta), kategori Shopping (c26),
 * subkategori Gift & Specialty Shops + Antique Stores + Flea & Street Markets.
 * Alamat, koordinat, telepon, rating & jumlah ulasan diambil dari JSON-LD
 * halaman detail TripAdvisor; \`relevance\`, \`product\`, kota/kecamatan, status
 * dan validasi koordinat diverifikasi lewat penelusuran sumber terbuka
 * (Google Maps, situs/IG toko, artikel berita).
 *
 * CATATAN PENTING: TripAdvisor memasukkan banyak usaha yang BUKAN toko suvenir
 * ke kategori "Gift & Specialty Shops" (money changer, service HP, toko
 * elektronik, toko sepeda). Field \`relevance\` memisahkannya — pakai
 * \`souvenirShops()\` untuk hanya mengambil yang relevan.
 *
 * Dibangun otomatis oleh scripts/build-souvenir.ts dari
 * data-souvenir-GCI-jakarta.tsv — jangan diedit manual.
 */

export type SouvenirShop = {
  id: string;
  name: string;
  /** Subkategori Shopping TripAdvisor. */
  category: string;
  /** Ya = toko suvenir sungguhan; Sebagian = sebagian menjual suvenir; Tidak = bukan. */
  relevance: string;
  product?: string;
  address?: string;
  city?: string;
  district?: string;
  lat?: number;
  lng?: number;
  coordSource?: string;
  phone?: string;
  rating?: number;
  reviews?: number;
  status?: string;
  note?: string;
  url?: string;
};

export const SOUVENIR_SHOPS: SouvenirShop[] = ${JSON.stringify(shops, null, 2)};

/** Hanya toko yang benar-benar menjual suvenir/oleh-oleh (Ya + Sebagian). */
export function souvenirShops(): SouvenirShop[] {
  return SOUVENIR_SHOPS.filter(
    (s) => s.relevance === "Ya" || s.relevance === "Sebagian"
  );
}

export function souvenirMapsUrl(s: SouvenirShop): string {
  if (s.lat != null && s.lng != null) {
    return \`https://www.google.com/maps/search/?api=1&query=\${s.lat},\${s.lng}\`;
  }
  return \`https://www.google.com/maps/search/?api=1&query=\${encodeURIComponent(
    \`\${s.name} \${s.address ?? "Jakarta"}\`
  )}\`;
}

/** Embed peta untuk slot "gambar produk" di kartu (pola sama lib/restaurants). */
export function souvenirEmbedUrl(s: SouvenirShop): string {
  if (s.lat != null && s.lng != null) {
    return \`https://www.google.com/maps?q=\${s.lat},\${s.lng}&hl=id&z=17&output=embed\`;
  }
  const q = [s.name, s.address, "Jakarta"].filter(Boolean).join(", ");
  return \`https://www.google.com/maps?q=\${encodeURIComponent(q)}&hl=id&z=16&output=embed\`;
}

/** Daftar produk unik (untuk filter), urut alfabetis. "?" = belum terverifikasi,
 *  dibuang dari opsi filter karena bukan kategori produk yang bermakna. */
export function souvenirProducts(): string[] {
  const set = new Set(
    SOUVENIR_SHOPS.map((s) => s.product).filter(
      (p): p is string => !!p && p !== "?"
    )
  );
  return [...set].sort((a, b) => a.localeCompare(b, "id"));
}
`;

writeFileSync(join(process.cwd(), "lib", "souvenir.ts"), ts);

const by = (k: keyof (typeof rows)[number]) => {
  const m = new Map<string, number>();
  for (const r of rows) m.set(String(r[k]), (m.get(String(r[k])) ?? 0) + 1);
  return Object.fromEntries([...m].sort((a, b) => b[1] - a[1]));
};
console.log(`souvenir: ${rows.length} baris`);
console.log("relevansi:", by("relevan_suvenir"));
console.log("kota:", by("kota_administrasi"));
console.log("berkoordinat:", rows.filter((r) => r.lat != null).length);
