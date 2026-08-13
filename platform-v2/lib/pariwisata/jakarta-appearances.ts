/**
 * Kehadiran TERVERIFIKASI (sumber publik) artis Top-10 Global Chart di Jakarta.
 * Dipakai untuk menandai "sudah pernah tampil di Jakarta" pada indikator seni
 * pertunjukan — melengkapi data event Dispar (SDI) yang TIDAK mencatat konser
 * besar internasional ini (gap pencatatan).
 *
 * Key = nama artis UPPERCASE (harus sama dgn nilai kolom `artis` di dataset
 * artis-top-global-chart). Tambah entri baru bila terverifikasi dari sumber.
 */
export type Appearance = { years: number[]; venue?: string; source: string };

export const JAKARTA_APPEARANCES: Record<string, Appearance> = {
  "ED SHEERAN": {
    years: [2019, 2024],
    venue: "GBK (2019) · JIS (2024)",
    source: "https://jakartaglobe.id/lifestyle/ed-sheerans-jakarta-concert-venue-shifted-to-jakarta-international-stadium",
  },
  "BRUNO MARS": {
    years: [2014, 2024],
    venue: "GBK (2014) · JIS (2024)",
    source: "https://en.tempo.co/read/565500/bruno-mars-thrills-jakarta",
  },
  "JUSTIN BIEBER": {
    years: [2013, 2022],
    venue: "GBK",
    source: "https://www.sportskeeda.com/pop-culture/justin-bieber-justice-world-tour-2022-kuala-lumpur-jakarta-dates-tickets-price",
  },
};

/** Ambil data kehadiran (case-insensitive) untuk satu nama artis. */
export function appearanceFor(artist: unknown): Appearance | null {
  const key = String(artist ?? "").toUpperCase().trim();
  return JAKARTA_APPEARANCES[key] ?? null;
}
