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