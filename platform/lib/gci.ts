/**
 * GCI — Pendataan Restoran Kelas Atas Jakarta
 * ============================================
 * Dataset terpisah untuk Inventarisasi & Monitoring Data Capaian Kota Jakarta
 * berdasarkan Global City Index (GCI), indikator:
 * "Jumlah restoran kelas atas dan keberagaman kuliner internasional di Jakarta".
 *
 * Fokus permintaan: restoran di hotel bintang 3 & 4, serta restoran & cafe
 * kelas atas di seluruh Jakarta. Data restoran hotel bintang 5 sudah diperoleh
 * dari JHA (via bidang PA) — di sini ditandai tier "Hotel ★5" agar mudah
 * dipisahkan / dikecualikan supaya tidak dobel.
 *
 * Rating & jumlah ulasan = perkiraan per Juni 2026 dari agregator publik
 * (Wanderlog/TripAdvisor yang menarik data Google). Angka Google berubah tiap
 * hari — verifikasi cepat di Google Maps sebelum submit final.
 *
 * Berbeda dari direktori "Restoran Internasional" (lib/restaurants.ts) yang
 * bersifat katalog umum: dataset ini disusun khusus untuk format kolom Google
 * Sheet GCI dan diorganisir berdasarkan tier hotel.
 */

import { GCI_OSM } from "./gci-osm";
import { GCI_RATINGS } from "./gci-ratings";
import { GCI_ADDRESSES } from "./gci-addresses";
import { GCI_PRICELEVELS } from "./gci-pricelevels";
import { GCI_HOTEL_RESTOS } from "./gci-hotel-restos";

export type GciTier =
  | "Hotel ★5"
  | "Hotel ★4"
  | "Hotel ★3"
  | "Restoran"
  | "Cafe";

// Hotel ★5 sengaja TIDAK ditampilkan: sudah dari JHA, dan permintaan hanya
// restoran hotel bintang 3 & 4.
export const TIER_ORDER: GciTier[] = [
  "Hotel ★4",
  "Hotel ★3",
  "Restoran",
  "Cafe",
];

export type GciRestaurant = {
  id: string;
  /** Kolom "Nama" */
  name: string;
  /** Kolom "Jenis Cuisine" */
  cuisine: string;
  /** Kawasan + sub-wilayah (mis. "SCBD, Jakarta Selatan") — fallback bila
   *  alamat jalan tidak tersedia. */
  area: string;
  /** Kolom "Alamat" — alamat jalan dari OSM addr:* (kosong bila OSM tak punya). */
  address?: string;
  /** Sub-wilayah DKI (diturunkan dari area) */
  city: string;
  /** Hotel induk bila restoran berada di dalam hotel */
  hotel?: string;
  tier: GciTier;
  /** Kolom "Rating" (0–5). Kosong untuk entri massal OSM (diisi tim). */
  rating?: number;
  /** Kolom "Jumlah Ulasan" */
  reviewCount?: number;
  /** Kolom "Sumber Rating" */
  ratingSource?: "Google";
  /** "curated" = ada rating terkurasi · "osm" = massal dari OpenStreetMap */
  source: "curated" | "osm";
  lat?: number;
  lng?: number;
  /** Google Place ID (bila rating berhasil di-resolve) — untuk link Maps akurat & dedup. */
  placeId?: string;
  /** Tingkat harga ($–$$$$). Lihat lib/gci-pricelevels.ts. */
  priceLevel?: "$" | "$$" | "$$$" | "$$$$";
  /** Asal price level: Google Places, reuse lokal, atau perkiraan editorial. */
  priceSource?: "Google" | "local" | "editorial";
  /** true bila angka rating/ulasan masih perlu diverifikasi tim */
  needsVerify?: boolean;
};

export const CITY_ORDER = [
  "Jakarta Pusat",
  "Jakarta Selatan",
  "Jakarta Utara",
  "Jakarta Barat",
  "Jakarta Timur",
  "Kepulauan Seribu",
] as const;

/** Turunkan sub-wilayah DKI dari teks area. */
function deriveCity(area: string): string {
  const a = area.toLowerCase();
  if (a.includes("jakarta selatan")) return "Jakarta Selatan";
  if (a.includes("jakarta pusat")) return "Jakarta Pusat";
  if (a.includes("jakarta utara")) return "Jakarta Utara";
  if (a.includes("jakarta barat")) return "Jakarta Barat";
  if (a.includes("jakarta timur")) return "Jakarta Timur";
  const SELATAN = ["senopati", "kemang", "scbd", "kebayoran", "kuningan", "setiabudi", "gunawarman", "cilandak", "cipete", "tebet", "wijaya", "pondok indah", "senayan"];
  const PUSAT = ["thamrin", "menteng", "sudirman", "tanah abang", "plaza indonesia", "grand indonesia", "cikini", "gondangdia", "kemayoran"];
  const UTARA = ["kelapa gading", "pik", "pantai indah kapuk", "pluit", "ancol"];
  const BARAT = ["ketapang", "glodok", "puri", "kota tua", "grogol", "kembangan"];
  if (SELATAN.some((k) => a.includes(k))) return "Jakarta Selatan";
  if (PUSAT.some((k) => a.includes(k))) return "Jakarta Pusat";
  if (UTARA.some((k) => a.includes(k))) return "Jakarta Utara";
  if (BARAT.some((k) => a.includes(k))) return "Jakarta Barat";
  return "Jakarta Pusat";
}

/** Tautan Google Maps. Pakai place_id (paling akurat) bila ada, lalu koordinat,
 *  terakhir baru pencarian nama+area. */
export function gciMapsUrl(r: GciRestaurant): string {
  if (r.placeId) {
    const q = encodeURIComponent(`${r.name} ${r.area}`);
    return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${r.placeId}`;
  }
  if (r.lat !== undefined && r.lng !== undefined) {
    return `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lng}`;
  }
  const q = encodeURIComponent(`${r.name} ${r.area} Jakarta`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/** Isi kolom "Alamat": alamat jalan bila ada, jika tidak fallback ke kawasan. */
export function gciAddress(r: GciRestaurant): string {
  return r.address && r.address.trim() ? r.address : r.area;
}

type Seed = Omit<GciRestaurant, "city" | "ratingSource" | "source"> & {
  ratingSource?: "Google";
};

// Subset KURASI — restoran & cafe kelas atas dengan rating Google terverifikasi.
// Digabung dengan ribuan entri massal OSM (semua restoran & cafe + hotel ★3/★4).
const SEED: Seed[] = [
  // ───────── RESTORAN DI HOTEL BINTANG 4 ─────────
  // Nama restoran (BUKAN nama hotel) yang berada di dalam hotel bintang 4.
  // Sumber nama: situs resmi hotel / Accor / Chope. Angka rating & ulasan
  // dikosongkan (needsVerify) untuk dicek tim di Google Maps. Daftar ini SEED —
  // tim Kasudin/KSK menambah restoran hotel ★3 & ★4 lain sesuai wilayah.
  { id: "h-food-exchange-cikini", name: "Food Exchange", cuisine: "International Buffet", area: "Cikini, Jakarta Pusat", hotel: "Novotel Jakarta Cikini (★4)", tier: "Hotel ★4", needsVerify: true },
  { id: "h-the-square-gajahmada", name: "The Square", cuisine: "International", area: "Gajah Mada, Jakarta Barat", hotel: "Novotel Jakarta Gajah Mada (★4)", tier: "Hotel ★4", needsVerify: true },
  { id: "h-food-exchange-mangga2", name: "Food Exchange", cuisine: "International Buffet", area: "Mangga Dua, Jakarta Utara", hotel: "Novotel Jakarta Mangga Dua Square (★4)", tier: "Hotel ★4", needsVerify: true },
  { id: "h-gourmet-bar-mangga2", name: "Gourmet Bar", cuisine: "Bar & Grill", area: "Mangga Dua, Jakarta Utara", hotel: "Novotel Jakarta Mangga Dua Square (★4)", tier: "Hotel ★4", needsVerify: true },
  { id: "h-spice-mercure-kota", name: "Spice Restaurant", cuisine: "All Day Dining / International", area: "Hayam Wuruk, Jakarta Barat", hotel: "Mercure Jakarta Kota (★4)", tier: "Hotel ★4", needsVerify: true },
  { id: "h-lobby-mercure-sabang", name: "The Lobby Restaurant", cuisine: "International", area: "Sabang, Jakarta Pusat", hotel: "Mercure Jakarta Sabang (★4)", tier: "Hotel ★4", needsVerify: true },
  { id: "h-botany-holidayinn-kemayoran", name: "Botany Restaurant", cuisine: "International / Local", area: "Kemayoran, Jakarta Pusat", hotel: "Holiday Inn Jakarta Kemayoran (★4)", tier: "Hotel ★4", needsVerify: true },
  { id: "h-silangit-aston-kemayoran", name: "Silangit Restaurant", cuisine: "International", area: "Kemayoran, Jakarta Pusat", hotel: "Aston Kemayoran City Hotel (★4)", tier: "Hotel ★4", needsVerify: true },
  { id: "h-adele-ashley", name: "Adele Dining", cuisine: "Continental", area: "Wahid Hasyim, Jakarta Pusat", hotel: "Ashley Hotel Jakarta (★4)", tier: "Hotel ★4", needsVerify: true },

  // ───────── ITALIAN ─────────
  { id: "osteria-gia", name: "Osteria GIA", cuisine: "Italian", area: "Plaza Indonesia, Jakarta Pusat", tier: "Restoran", rating: 4.9, reviewCount: 4877 },
  { id: "bistecca", name: "Bistecca", cuisine: "Italian / Steakhouse", area: "SCBD, Jakarta Selatan", tier: "Restoran", rating: 4.6, reviewCount: 1792 },
  { id: "bottega", name: "Bottega Ristorante", cuisine: "Italian / European", area: "SCBD, Jakarta Selatan", tier: "Restoran", rating: 4.5, reviewCount: 1502 },
  { id: "garden-osteria", name: "The Garden Osteria", cuisine: "Italian", area: "Kebayoran Baru, Jakarta Selatan", tier: "Restoran", rating: 4.7, reviewCount: 3058 },
  { id: "oro", name: "ORO Italian Restaurant", cuisine: "Italian", area: "Kemang, Jakarta Selatan", tier: "Restoran", rating: 4.8, reviewCount: 1467 },
  { id: "emilia", name: "Emilia Cucina Italiana", cuisine: "Italian", area: "Senopati, Jakarta Selatan", tier: "Restoran", rating: 4.8, reviewCount: 4776 },
  { id: "caffe-milano", name: "Caffe Milano", cuisine: "Italian", area: "Grand Indonesia, Jakarta Pusat", tier: "Restoran", rating: 4.7, reviewCount: 3046 },
  { id: "toscana", name: "Toscana", cuisine: "Italian", area: "Kemang, Jakarta Selatan", tier: "Restoran", rating: 4.5, reviewCount: 1476 },
  { id: "mamma-rosy", name: "Mamma Rosy", cuisine: "Italian", area: "Kemang, Jakarta Selatan", tier: "Restoran", rating: 4.5, reviewCount: 3749 },
  { id: "casa-cuomo", name: "Casa Cuomo Ristorante", cuisine: "Italian", area: "Gunawarman, Jakarta Selatan", tier: "Restoran", rating: 4.5, reviewCount: 806 },

  // ───────── FRENCH ─────────
  { id: "amuz", name: "AMUZ Gourmet Restaurant", cuisine: "French Fine Dining", area: "SCBD, Jakarta Selatan", tier: "Restoran", rating: 4.6, reviewCount: 482 },
  { id: "le-quartier", name: "Le Quartier", cuisine: "French Brasserie", area: "Kebayoran Baru, Jakarta Selatan", tier: "Restoran", rating: 4.6, reviewCount: 3188 },
  { id: "pierre", name: "PIERRE", cuisine: "French Bistro", area: "Senopati, Jakarta Selatan", tier: "Restoran", rating: 4.7, reviewCount: 1267 },
  { id: "vk", name: "VK SCBD (Vong Kitchen)", cuisine: "Modern French", area: "SCBD, Jakarta Selatan", tier: "Restoran", rating: 4.6, reviewCount: 1809 },
  { id: "alice", name: "Alice by Tom Aikens", cuisine: "Modern French", area: "SCBD, Jakarta Selatan", tier: "Restoran", rating: 4.8, reviewCount: 968 },
  { id: "bistro-baron", name: "Bistro Baron", cuisine: "French Bistro", area: "Plaza Indonesia, Jakarta Pusat", tier: "Restoran", rating: 4.4, reviewCount: 483 },

  // ───────── JAPANESE ─────────
  { id: "sushi-hiro", name: "Sushi Hiro", cuisine: "Japanese / Sushi", area: "Senopati, Jakarta Selatan", tier: "Restoran", rating: 4.8, reviewCount: 6849 },
  { id: "okuzono", name: "Okuzono Japanese Dining", cuisine: "Japanese / Izakaya", area: "Senopati, Jakarta Selatan", tier: "Restoran", rating: 4.6, reviewCount: 2923 },
  { id: "kikugawa", name: "Kikugawa", cuisine: "Japanese", area: "Cikini, Jakarta Pusat", tier: "Restoran", rating: 4.6, reviewCount: 1815 },
  { id: "enmaru", name: "Enmaru", cuisine: "Japanese / Omakase", area: "Sudirman, Jakarta Pusat", tier: "Restoran", rating: 4.6, reviewCount: 322 },
  { id: "asuka", name: "Asuka Japanese Dining", cuisine: "Japanese / Omakase", area: "Kuningan, Jakarta Selatan", tier: "Restoran", rating: 4.6, reviewCount: 227 },
  { id: "sakana", name: "Sakana Midplaza", cuisine: "Japanese / Izakaya", area: "Tanah Abang, Jakarta Pusat", tier: "Restoran", rating: 4.5, reviewCount: 891 },

  // ───────── CHINESE ─────────
  { id: "twelve", name: "Twelve Chinese Dining", cuisine: "Modern Chinese", area: "Menteng, Jakarta Pusat", tier: "Restoran", rating: 4.6, reviewCount: 1632 },
  { id: "taste-paradise", name: "Taste Paradise", cuisine: "Chinese / Dim Sum", area: "Menteng, Jakarta Pusat", tier: "Restoran", rating: 4.6, reviewCount: 993 },
  { id: "din-tai-fung", name: "Din Tai Fung", cuisine: "Taiwanese / Chinese", area: "PIK, Jakarta Utara", tier: "Restoran", rating: 4.9, reviewCount: 2025 },
  { id: "angke", name: "Angke Restaurant", cuisine: "Hakka Chinese", area: "Ketapang, Jakarta Barat", tier: "Restoran", rating: 4.5, reviewCount: 6630 },

  // ───────── STEAKHOUSE ─────────
  { id: "ruths-chris", name: "Ruth's Chris Steak House", cuisine: "Steakhouse", area: "Kuningan, Jakarta Selatan", tier: "Restoran", rating: 4.6, reviewCount: 1405 },
  { id: "wolfgangs", name: "Wolfgang's Steakhouse", cuisine: "Steakhouse", area: "SCBD, Jakarta Selatan", tier: "Restoran", rating: 4.5, reviewCount: 1246 },
  { id: "aged-butchered", name: "Aged + Butchered", cuisine: "Steakhouse", area: "Setiabudi, Jakarta Selatan", tier: "Restoran", rating: 4.8, reviewCount: 2038 },
  { id: "cutt-grill", name: "Cutt & Grill", cuisine: "Steakhouse / Grill", area: "Senopati, Jakarta Selatan", tier: "Restoran", rating: 4.8, reviewCount: 2220 },
  { id: "tokyo-skipjack", name: "Tokyo Skipjack", cuisine: "Japanese Steakhouse", area: "Kebayoran Baru, Jakarta Selatan", tier: "Restoran", rating: 4.6, reviewCount: 4320 },
  { id: "sir-loin", name: "Sir Loin", cuisine: "Steakhouse", area: "Kebayoran Baru, Jakarta Selatan", tier: "Restoran", rating: 4.7, reviewCount: 1144 },
  { id: "absteak", name: "AB Steak by Akira Back", cuisine: "Korean Steakhouse", area: "Senayan, Jakarta Pusat", tier: "Restoran", rating: 4.6, reviewCount: 612, needsVerify: true },

  // ───────── KOREAN ─────────
  { id: "bornga", name: "Bornga", cuisine: "Korean BBQ", area: "Kebayoran Baru, Jakarta Selatan", tier: "Restoran", rating: 4.7, reviewCount: 2138 },
  { id: "cheongdam", name: "Cheongdam Garden", cuisine: "Korean BBQ", area: "Senopati, Jakarta Selatan", tier: "Restoran", rating: 4.6, reviewCount: 2245 },
  { id: "ojju", name: "Ojju", cuisine: "Korean", area: "Tebet, Jakarta Selatan", tier: "Restoran", rating: 4.6, reviewCount: 4342 },
  { id: "seo-seo-galbi", name: "Seo Seo Galbi", cuisine: "Korean BBQ", area: "PIK, Jakarta Utara", tier: "Restoran", rating: 4.7, reviewCount: 2165 },

  // ───────── THAI ─────────
  { id: "chandara", name: "Chandara Fine Thai Cuisine", cuisine: "Thai", area: "Menteng, Jakarta Pusat", tier: "Restoran", rating: 4.5, reviewCount: 684 },
  { id: "thai-street", name: "Thai Street Citywalk", cuisine: "Thai", area: "Sudirman, Jakarta Pusat", tier: "Restoran", rating: 4.8, reviewCount: 1996 },
  { id: "jittlada-gi", name: "Jittlada Thai Cuisine", cuisine: "Thai", area: "Grand Indonesia, Jakarta Pusat", tier: "Restoran", rating: 4.6, reviewCount: 1099 },
  { id: "greyhound", name: "Greyhound Cafe", cuisine: "Thai", area: "Menteng, Jakarta Pusat", tier: "Restoran", rating: 4.6, reviewCount: 838 },

  // ───────── INDIAN ─────────
  { id: "royal-kitchen", name: "The Royal Kitchen", cuisine: "North Indian Fine Dining", area: "Kuningan, Jakarta Selatan", tier: "Restoran", rating: 4.4, reviewCount: 1622 },
  { id: "babooji", name: "Babooji", cuisine: "Indian Contemporary", area: "Gunawarman, Jakarta Selatan", tier: "Restoran", rating: 4.3, reviewCount: 579 },
  { id: "ganesha", name: "Ganesha Ek Sanskriti", cuisine: "Indian", area: "Sudirman, Jakarta Pusat", tier: "Restoran", rating: 4.4, reviewCount: 1005 },

  // ───────── INTERNASIONAL LAIN ─────────
  { id: "caspar", name: "Caspar Jakarta", cuisine: "Spanish", area: "SCBD, Jakarta Selatan", tier: "Restoran", rating: 4.6, reviewCount: 1754 },
  { id: "animale", name: "Animale Restaurant", cuisine: "Mediterranean / New American", area: "Setiabudi, Jakarta Selatan", tier: "Restoran", rating: 4.7, reviewCount: 1405 },
  { id: "skye", name: "SKYE Rooftop", cuisine: "International", area: "Thamrin, Jakarta Pusat", tier: "Restoran", rating: 4.6, reviewCount: 6276 },
  { id: "el-asador", name: "El Asador", cuisine: "South American / Steak", area: "Kemang, Jakarta Selatan", tier: "Restoran", rating: 4.5, reviewCount: 1465 },

  // ───────── CAFE ─────────
  { id: "giyanti", name: "Giyanti Coffee Roastery", cuisine: "Cafe / Coffee", area: "Menteng, Jakarta Pusat", tier: "Cafe", rating: 4.6, reviewCount: 4278 },
  { id: "anomali", name: "Anomali Coffee", cuisine: "Cafe / Coffee", area: "Menteng, Jakarta Pusat", tier: "Cafe", rating: 4.5, reviewCount: 5024 },
  { id: "one-fifteenth", name: "1/15 Coffee", cuisine: "Cafe / Coffee", area: "Menteng, Jakarta Pusat", tier: "Cafe", rating: 4.5, reviewCount: 2708 },
  { id: "lucky-cat", name: "Lucky Cat Coffee & Kitchen", cuisine: "Cafe", area: "Kuningan, Jakarta Selatan", tier: "Cafe", rating: 4.4, reviewCount: 5626 },
  { id: "bakoel", name: "Bakoel Koffie", cuisine: "Cafe / Coffee", area: "Cikini, Jakarta Pusat", tier: "Cafe", rating: 4.4, reviewCount: 6119 },
  { id: "arborea", name: "Arborea Cafe", cuisine: "Cafe", area: "Gatot Subroto, Jakarta Pusat", tier: "Cafe", rating: 4.5, reviewCount: 3501 },
  { id: "blumchen", name: "Blumchen Coffee", cuisine: "Cafe", area: "SCBD, Jakarta Selatan", tier: "Cafe", rating: 4.5, reviewCount: 435 },
  { id: "paul", name: "PAUL Classic", cuisine: "French Bakery / Cafe", area: "Pacific Place, Jakarta Selatan", tier: "Cafe", rating: 4.6, reviewCount: 4051 },
];

const CURATED: GciRestaurant[] = SEED.map((s) => {
  // SEED rating (aggregator-verified) wins; otherwise fall back to a real
  // Google rating from the enrichment pass if one was resolved for this id.
  const rt = s.rating === undefined ? GCI_RATINGS[s.id] : undefined;
  return {
    ...s,
    rating: s.rating ?? (rt?.found ? rt.rating : undefined),
    reviewCount: s.reviewCount ?? (rt?.found ? rt.reviewCount : undefined),
    ratingSource:
      s.rating !== undefined || rt?.found ? ("Google" as const) : undefined,
    placeId: rt?.found ? rt.placeId : undefined,
    priceLevel: GCI_PRICELEVELS[s.id]?.priceLevel,
    priceSource: GCI_PRICELEVELS[s.id]?.source,
    source: "curated" as const,
    city: deriveCity(s.area),
  };
});

/** Nama yang dinormalisasi untuk dedup curated vs OSM. */
function nameKey(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

const CURATED_KEYS = new Set(CURATED.map((r) => nameKey(r.name)));

// Hotel-hotel yang restorannya sudah dikurasi dengan nama (mis. "Food Exchange
// @ Novotel Cikini") — baris hotel-generik OSM untuk hotel ini dilewati supaya
// tidak dobel dengan entri bernama.
const CURATED_HOTEL_KEYS = new Set(
  CURATED.filter((r) => r.hotel).map((r) =>
    nameKey(r.hotel!.replace(/\s*\(★\d\)\s*$/, ""))
  )
);

// Pinjam alamat OSM untuk entri kurasi (kurasi tak punya alamat jalan sendiri).
// Cocokkan via Google place_id (paling akurat) lalu nama; untuk restoran di
// hotel, pakai nama hotel induk karena alamatnya ada di baris hotel OSM.
// Tidak pernah mengarang — bila OSM tak punya alamat, biarkan kosong (fallback
// ke kawasan/area saat ditampilkan).
const OSM_ADDR_BY_PID = new Map<string, string>();
const OSM_ADDR_BY_NAME = new Map<string, string>();
for (const o of GCI_OSM) {
  if (!o.address) continue;
  const pid = GCI_RATINGS[o.id]?.placeId;
  if (pid && !OSM_ADDR_BY_PID.has(pid)) OSM_ADDR_BY_PID.set(pid, o.address);
  const k = nameKey(o.name);
  // Simpan alamat terpanjang (paling lengkap) per nama.
  const prev = OSM_ADDR_BY_NAME.get(k);
  if (!prev || o.address.length > prev.length) OSM_ADDR_BY_NAME.set(k, o.address);
}
for (const r of CURATED) {
  const google = GCI_ADDRESSES[r.id]?.address; // alamat Google (paling akurat)
  const byPid = r.placeId ? OSM_ADDR_BY_PID.get(r.placeId) : undefined;
  const byName = OSM_ADDR_BY_NAME.get(nameKey(r.name));
  const byHotel = r.hotel
    ? OSM_ADDR_BY_NAME.get(nameKey(r.hotel.replace(/\s*\(★\d\)\s*$/, "")))
    : undefined;
  r.address = google ?? byPid ?? byName ?? byHotel ?? undefined;
}

// Entri massal dari OpenStreetMap — semua restoran & cafe + hotel ★3/★4.
const OSM: GciRestaurant[] = GCI_OSM.filter((o) => {
  if (CURATED_KEYS.has(nameKey(o.name))) return false; // sudah ada di kurasi
  // Lewati baris hotel-generik bila restoran bernama sudah dikurasi.
  if (o.tier.startsWith("Hotel") && CURATED_HOTEL_KEYS.has(nameKey(o.name)))
    return false;
  return true;
}).map((o) => {
  const rt = GCI_RATINGS[o.id];
  // Nama restoran di dalam hotel (hasil crawl per-hotel) supaya kolom Nama bukan
  // sekadar nama hotel; nama hotel asli dipindah ke field `hotel` (subbaris).
  const resto = GCI_HOTEL_RESTOS[o.id]?.name;
  return {
    id: o.id,
    name: resto ?? o.name,
    cuisine: o.cuisine,
    area: o.area,
    // Alamat asli Google (Places) lebih akurat; fallback ke addr:* OSM.
    address: GCI_ADDRESSES[o.id]?.address ?? (o.address || undefined),
    city: o.city,
    hotel: resto ? o.hotel ?? o.name : o.hotel,
    tier: o.tier,
    source: "osm" as const,
    lat: o.lat,
    lng: o.lng,
    // Rating asli dari Google Places (bila sudah di-enrich); tidak pernah dikarang.
    rating: rt?.found ? rt.rating : undefined,
    reviewCount: rt?.found ? rt.reviewCount : undefined,
    ratingSource: rt?.found ? ("Google" as const) : undefined,
    placeId: rt?.found ? rt.placeId : undefined,
    priceLevel: GCI_PRICELEVELS[o.id]?.priceLevel,
    priceSource: GCI_PRICELEVELS[o.id]?.source,
  };
});

/** Jarak meter kasar antar dua titik (cukup untuk dedup jarak-dekat). */
function metersBetween(a: GciRestaurant, b: GciRestaurant): number {
  if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) return Infinity;
  const dx = (a.lat - b.lat) * 111000;
  const dy = (a.lng - b.lng) * 111000 * Math.cos((a.lat * Math.PI) / 180);
  return Math.hypot(dx, dy);
}

/**
 * Dedup berbasis bukti, bukan cleansing kasar:
 *  1. place_id Google sama → tempat fisik yang sama (mis. OSM node+way, atau
 *     nama generik vs nama lengkap). Simpan SATU: utamakan entri kurasi, lalu
 *     nama paling deskriptif (terpanjang).
 *  2. Tanpa place_id → dedup hanya bila nama (ternormalisasi) sama DAN jaraknya
 *     ≤60 m. Chain dengan nama sama di lokasi berbeda TIDAK digabung.
 */
function dedupe(list: GciRestaurant[]): GciRestaurant[] {
  const ranked = [...list].sort((a, b) => {
    const ca = a.source === "curated" ? 0 : 1;
    const cb = b.source === "curated" ? 0 : 1;
    if (ca !== cb) return ca - cb; // kurasi dulu
    return b.name.length - a.name.length; // nama lebih deskriptif menang
  });
  const seenPid = new Set<string>();
  const kept: GciRestaurant[] = [];
  let removed = 0;
  for (const r of ranked) {
    if (r.placeId) {
      if (seenPid.has(r.placeId)) {
        removed++;
        continue;
      }
      seenPid.add(r.placeId);
      kept.push(r);
      continue;
    }
    const k = nameKey(r.name);
    const dup = kept.find(
      (o) => !o.placeId && nameKey(o.name) === k && metersBetween(o, r) <= 60
    );
    if (dup) {
      removed++;
      continue;
    }
    kept.push(r);
  }
  // Urutan tampil: per tier, lalu yang ber-rating dulu, lalu ulasan terbanyak.
  const tierRank: Record<GciTier, number> = {
    "Hotel ★5": 0,
    "Hotel ★4": 1,
    "Hotel ★3": 2,
    Restoran: 3,
    Cafe: 4,
  };
  kept.sort(
    (a, b) =>
      tierRank[a.tier] - tierRank[b.tier] ||
      (a.rating === undefined ? 1 : 0) - (b.rating === undefined ? 1 : 0) ||
      (b.reviewCount ?? 0) - (a.reviewCount ?? 0) ||
      a.name.localeCompare(b.name)
  );
  GCI_DEDUPE_REMOVED = removed;
  return kept;
}

export let GCI_DEDUPE_REMOVED = 0;
export const GCI_RESTAURANTS: GciRestaurant[] = dedupe([...CURATED, ...OSM]);

export const GCI_CURATED_COUNT = CURATED.length;

export function gciStats() {
  const byTier = (t: GciTier) => GCI_RESTAURANTS.filter((r) => r.tier === t).length;
  return {
    total: GCI_RESTAURANTS.length,
    hotel: GCI_RESTAURANTS.filter((r) => r.tier.startsWith("Hotel")).length,
    rated: GCI_RESTAURANTS.filter((r) => r.rating !== undefined).length,
    cafe: byTier("Cafe"),
    restoran: byTier("Restoran"),
  };
}
