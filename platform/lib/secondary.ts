/**
 * Data sekunder — dataset pendataan Jakarta Atlas (GCI) yang melengkapi data
 * primer SDI. Atlas adalah app terpisah (jakarta-restaurant-data); di sini
 * cukup tautan. `rows` snapshot; fase lanjut ambil via API Atlas.
 */
export type SecondaryDataset = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  rows: number;
  href: string;
  /** true = tautan ke app Atlas eksternal; false = halaman detail internal /sdi. */
  external?: boolean;
};

export const ATLAS_BASE = "https://jakarta-restaurant-data.vercel.app";

export function secondaryDatasets(): SecondaryDataset[] {
  return [
    {
      id: "sec-wisman-negara",
      title: "Wisman DKI Jakarta per Negara (BPS dibersihkan)",
      description:
        "Kunjungan wisatawan mancanegara ke DKI Jakarta per negara asal, klasifikasi negara BPS distandarkan (mis. China≡Tiongkok, Filipina≡Philipina).",
      tags: ["wisman", "wisatawan", "mancanegara", "negara", "sekunder"],
      rows: 604,
      href: "/sdi/wisman-jakarta-per-negara",
      external: false,
    },
    {
      id: "sec-wisman-bulan",
      title: "Wisman DKI Jakarta per Bulan (total)",
      description:
        "Total kunjungan wisatawan mancanegara ke DKI Jakarta per bulan (agregasi seluruh negara asal).",
      tags: ["wisman", "wisatawan", "mancanegara", "bulanan", "sekunder"],
      rows: 28,
      href: "/sdi/wisman-jakarta-per-bulan",
      external: false,
    },
    {
      id: "sec-wisman-pintu",
      title: "Wisman per Pintu Masuk (dinormalisasi)",
      description:
        "Kunjungan wisman menurut pintu masuk dengan nama pintu distandarkan (mis. 'BANDAR UDARA SOEKARNO HATTA'≡'Soekarno-Hatta').",
      tags: ["wisman", "pintu-masuk", "sekunder"],
      rows: 480,
      href: "/sdi/wisman-jakarta-per-pintu-masuk",
      external: false,
    },
    {
      id: "sec-tripadvisor",
      title: "Restoran Jakarta TripAdvisor (Kuliner GCI)",
      description:
        "Restoran DKI Jakarta bersumber TripAdvisor untuk indikator kuliner GCI (kriteria Kearney: TripAdvisor & Michelin). Rating, ulasan, peringkat, koordinat, URL.",
      tags: ["kuliner", "restoran", "tripadvisor", "gci", "sekunder"],
      rows: 38,
      href: "/sdi/restoran-tripadvisor-jakarta",
      external: false,
    },
    {
      id: "sec-artis-chart",
      title: "Artis Top 10 Global Chart (Billboard & Spotify, 2021–2025)",
      description:
        "Tabel referensi artis Top 10 Global Chart (Billboard & Spotify Year-End) 2021–2025 untuk verifikasi kriteria Kearney pada indikator seni pertunjukan.",
      tags: ["seni-pertunjukan", "musik", "chart", "gci", "sekunder"],
      rows: 100,
      href: "/sdi/artis-top-global-chart",
      external: false,
    },
    {
      id: "sec-halal-restoran",
      title: "Restoran & Zona KHAS Tersertifikasi Halal Jakarta",
      description:
        "Restoran/rumah makan & sentra Zona KHAS di DKI Jakarta tersertifikasi halal (BPJPH/LPPOM MUI) — profil, titik koordinat, dan nomor sertifikat halal bila tersedia.",
      tags: ["halal", "restoran", "kuliner", "zona-khas", "ramah-muslim", "sekunder"],
      rows: 114,
      href: "/sdi/restoran-halal-jakarta",
      external: false,
    },
    {
      id: "sec-halal-hotel",
      title: "Hotel Ramah Muslim Jakarta",
      description:
        "Hotel syariah & ramah muslim DKI Jakarta (arah kiblat, musholla, tempat wudhu, restoran halal) — profil, koordinat, dan nomor sertifikat halal restoran bila tersedia.",
      tags: ["halal", "hotel", "ramah-muslim", "pariwisata", "sekunder"],
      rows: 29,
      href: "/sdi/hotel-ramah-muslim-jakarta",
      external: false,
    },
    {
      id: "sec-halal-inovasi",
      title: "Inovasi & Program Wisata Ramah Muslim Jakarta",
      description:
        "Inovasi, program unggulan, dan praktik baik pendukung wisatawan muslim — desa/kampung wisata ramah muslim, kampung halal, aplikasi digital, event/festival, branding, paket wisata.",
      tags: ["halal", "inovasi", "program", "ramah-muslim", "sekunder"],
      rows: 29,
      href: "/sdi/inovasi-wisata-ramah-muslim-jakarta",
      external: false,
    },
    {
      id: "sec-halal-mall",
      title: "Mall & Fasilitas Ramah Muslim Jakarta",
      description:
        "Mall/pusat perbelanjaan DKI Jakarta dengan fasilitas ramah muslim (musholla, tempat wudhu, restoran halal, toko produk halal) — profil, koordinat, dan foto fasilitas bila tersedia.",
      tags: ["halal", "mall", "fasilitas", "ramah-muslim", "sekunder"],
      rows: 28,
      href: "/sdi/mall-ramah-muslim-jakarta",
      external: false,
    },
    {
      id: "sec-halal-rph",
      title: "RPH Tersertifikasi Halal Jakarta",
      description:
        "Rumah Potong Hewan/Unggas (RPH/RPU) tersertifikasi halal di DKI Jakarta — profil, pengelola, koordinat, dan nomor sertifikat halal bila tersedia.",
      tags: ["halal", "rph", "ramah-muslim", "sekunder"],
      rows: 12,
      href: "/sdi/rph-halal-jakarta",
      external: false,
    },
    {
      id: "sec-halal-produk",
      title: "Produk Kreatif Makanan Tersertifikasi Halal Jakarta",
      description:
        "Produk kreatif makanan/UMKM kuliner asal DKI Jakarta yang tersertifikasi halal — profil, penyelenggara, dan nomor sertifikat halal bila tersedia.",
      tags: ["halal", "produk", "ekraf", "kuliner", "sekunder"],
      rows: 12,
      href: "/sdi/produk-kreatif-makanan-halal-jakarta",
      external: false,
    },
    {
      id: "sec-event-visitor",
      title: "Jumlah Pengunjung Event Jakarta 2026",
      description:
        "Jumlah pengunjung event pariwisata & ekraf DKI Jakarta (Semester I 2026), diperkaya alamat, titik koordinat (lat/lon), dan sumber alamat via geocoding.",
      tags: ["event", "pengunjung", "pariwisata", "geocoded", "sekunder"],
      rows: 804,
      href: "/sdi/jumlah-pengunjung-event-2026",
      external: false,
    },
    {
      id: "sec-gci-resto",
      title: "Restoran & Kafe GCI Jakarta",
      description:
        "Pendataan seluruh restoran & kafe se-Jakarta (termasuk restoran hotel bintang 3–4) untuk Global City Index.",
      tags: ["gci", "restoran", "kuliner", "sekunder"],
      rows: 2577,
      href: `${ATLAS_BASE}/gci`,
    },
    {
      id: "sec-events",
      title: "Pertunjukan & Budaya GCI",
      description:
        "Pertunjukan musik internasional/nasional & acara budaya besar di Jakarta 2025–2026 (konser, festival, tari, teater, seni rupa, film) untuk Global City Index.",
      tags: ["gci", "event", "pertunjukan", "budaya", "sekunder"],
      rows: 308,
      href: `${ATLAS_BASE}/events`,
    },
    {
      id: "sec-resto-dir",
      title: "Direktori Restoran Kurasi",
      description:
        "Direktori restoran & kafe pilihan Jakarta dengan sumber sitasi publik yang terverifikasi.",
      tags: ["restoran", "kuliner", "direktori", "sekunder"],
      rows: 604,
      href: `${ATLAS_BASE}/restaurants`,
    },
    {
      id: "sec-golf",
      title: "Lapangan Golf Jakarta",
      description:
        "Pendataan lapangan & driving range golf di Jakarta dan sekitarnya.",
      tags: ["golf", "olahraga", "wisata", "sekunder"],
      rows: 14,
      href: `${ATLAS_BASE}/golf`,
    },
  ];
}