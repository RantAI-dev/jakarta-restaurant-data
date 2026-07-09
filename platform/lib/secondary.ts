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
};

export const ATLAS_BASE = "https://jakarta-restaurant-data.vercel.app";

export function secondaryDatasets(): SecondaryDataset[] {
  return [
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