/**
 * GMTI — Jakarta Ramah Muslim
 * ===========================
 * Satu payung untuk seluruh data wisata ramah muslim Dispar: fasilitas ibadah
 * (SIMAS Kemenag) plus enam dataset halal yang sebelumnya tercecer sebagai
 * entri terpisah di katalog /sdi.
 *
 * Nama "GMTI" merujuk Global Muslim Travel Index (Mastercard–CrescentRating),
 * kerangka yang dipakai Indonesia untuk menilai kesiapan destinasi ramah
 * muslim. PENTING: pengelompokan pilar di bawah adalah kerangka kerja kami
 * untuk menyusun halaman — GMTI resmi menilai di tingkat negara/destinasi,
 * bukan memberi skor per fasilitas. Jangan sajikan angka halaman ini sebagai
 * "skor GMTI Jakarta".
 *
 * Data besar tidak ada di sini: lib/gmti-data.ts hanya memuat agregat dan
 * tempat ber-koordinat. Daftar lengkap 8.331 masjid & mushalla ada di
 * public/gmti-ibadah.json, di-fetch saat pilar Ibadah dibuka.
 */

export const PILLARS = ["ibadah", "makan", "menginap", "destinasi", "program"] as const;
export type Pillar = (typeof PILLARS)[number];

export const PILLAR_LABEL: Record<Pillar, string> = {
  ibadah: "Ibadah",
  makan: "Makan & minum",
  menginap: "Menginap",
  destinasi: "Destinasi & fasilitas",
  program: "Program & inovasi",
};

export const PILLAR_DESC: Record<Pillar, string> = {
  ibadah: "Masjid & mushalla terdaftar SIMAS Kemenag se-DKI Jakarta.",
  makan: "Restoran, RPH, dan produk kuliner bersertifikat halal BPJPH/LPPOM MUI.",
  menginap: "Hotel syariah & ramah muslim — arah kiblat, mushalla, tempat wudhu.",
  destinasi: "Mall, bandara, dan situs warisan Islam dengan fasilitas ramah muslim.",
  program: "Inovasi, kampung wisata, festival, dan program pendukung.",
};

export const PILLAR_COLOR: Record<Pillar, string> = {
  ibadah: "#0f7b6c",
  makan: "#ed6b23",
  menginap: "#7048b6",
  destinasi: "#1e6bb8",
  program: "#c2185b",
};

export type GmtiMeta = {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  ibadahTotal: number;
  masjid: number;
  mushalla: number;
  ibadahNonSignature: number;
  ibadahSignature: number;
  ibadahBerkoordinat: number;
  halalTotal: number;
  halalBerkoordinat: number;
  kecamatan: number;
  kecamatanTanpaPoligon: string[];
  tanpaKecamatan: number;
};

export type GmtiAgg = {
  kecamatan: string;
  kota: string;
  /** Kunci pencocokan ke GeoJSON: huruf kecil tanpa spasi. */
  geoKey: string;
  masjid: number;
  mushalla: number;
  total: number;
};

export type GmtiTipologi = {
  tipologi: string;
  jenis: string;
  count: number;
};

export type GmtiPlace = {
  id: string;
  name: string;
  pillar: Pillar;
  /** Tipologi SIMAS atau jenis usaha dari dataset halal. */
  kind: string;
  /** Label sumber yang ditampilkan di kartu. */
  dataset: string;
  /** Tautan ke dataset asal di katalog /sdi (khusus dataset halal). */
  href?: string;
  address?: string;
  city?: string;
  district?: string;
  lat?: number;
  lon?: number;
  cert?: string;
  note?: string;
};

export type GmtiCapaian = {
  nama: string;
  pemberi?: string;
  tahun?: string;
  tingkat?: string;
  deskripsi?: string;
};

/** Satu baris di public/gmti-ibadah.json. */
export type IbadahRow = {
  id: number;
  card?: string;
  name: string;
  address?: string;
  jenis: "masjid" | "mushalla";
  tipologi: string;
  kota?: string;
  kecamatan?: string;
  lat?: number;
  lon?: number;
  coordSource?: string;
};

export type IbadahFile = {
  source: string;
  sourceUrl: string;
  note: string;
  fetchedAt: string;
  total: number;
  rows: IbadahRow[];
};

export const IBADAH_URL = "/gmti-ibadah.json";

/**
 * Tipologi fasilitas lingkungan — sengaja tidak dicarikan titik peta karena
 * alamatnya pendek/ber-RT-RW dan hasil geocoding-nya rawan meleset. Tetap
 * masuk daftar dan hitungan kecamatan.
 */
export const NON_SIGNATURE_TIPOLOGI = ["Masjid Jami", "Mushalla Perumahan"];

export const isNonSignature = (tipologi: string): boolean =>
  NON_SIGNATURE_TIPOLOGI.includes(tipologi);

/** Angka gaya Indonesia: 8.331 */
export const idNum = (n: number): string => n.toLocaleString("id-ID");

export const gmtiMapsUrl = (p: {
  name: string;
  lat?: number;
  lon?: number;
  address?: string;
  city?: string;
}): string =>
  p.lat != null && p.lon != null
    ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        [p.name, p.address, p.city, "Jakarta"].filter(Boolean).join(", ")
      )}`;

/** Tanggal snapshot untuk banner sumber. */
export const snapshotDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
