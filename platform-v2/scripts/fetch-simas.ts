/**
 * Tarik profil masjid & mushalla DKI Jakarta dari SIMAS Kemenag.
 *
 * Sumber: API internal situs SIMAS (situsnya Next.js; daftar profil diambil
 * client-side dari endpoint di bawah — tidak ada scraping HTML).
 *
 *   GET /api/simas/wilayah/profil/{masjid|mushalla}
 *       ?page=&perPage=&tipologi=&prov=&kab=&kec=&tanah=&q=
 *
 * Catatan penting soal sumber:
 * - `prov=11` = Daerah Khusus Ibukota Jakarta.
 * - Tipologi WAJIB diisi satu per satu; tidak ada mode "semua tipologi", jadi
 *   kita iterasi 8 tipologi masjid + 4 tipologi mushalla lalu digabung.
 * - Server mengabaikan perPage yang kita minta dan memakai angkanya sendiri
 *   (~9–36 baris), jadi paginasi mengikuti `meta.totalPages` dari respons,
 *   bukan asumsi kita.
 * - Endpoint daftar TIDAK memuat koordinat, dan endpoint detail
 *   (/api/simas/masjid/{id}) butuh autentikasi (401). Koordinat karena itu
 *   diurus terpisah oleh scripts/geocode-gmti.ts.
 *
 * Keluaran: data/gmti-ibadah.json — snapshot yang di-commit, lengkap dengan
 * fetchedAt dan hitungan per tipologi sebagai jejak audit.
 *
 * Jalankan: npx tsx scripts/fetch-simas.ts
 */

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const out = (p: string) => fileURLToPath(new URL(p, import.meta.url));

const BASE = "https://simas.kemenag.go.id/api/simas/wilayah/profil";
const PROV = "11";
const UA = "Mozilla/5.0 (dispar-data-platform; pendataan GMTI Dinas Pariwisata DKI)";

/** Jeda antar request supaya tidak membebani SIMAS. */
const DELAY_MS = 250;

type Jenis = "masjid" | "mushalla";

const TIPOLOGI: Record<Jenis, Record<number, string>> = {
  masjid: {
    1: "Masjid Negara",
    2: "Masjid Raya",
    3: "Masjid Agung",
    4: "Masjid Besar",
    5: "Masjid Jami",
    6: "Masjid Bersejarah",
    7: "Masjid di Tempat Publik",
    8: "Masjid Nasional",
  },
  mushalla: {
    1: "Mushalla Perumahan",
    2: "Mushalla di Tempat Publik",
    3: "Mushalla Perkantoran",
    4: "Mushalla Pendidikan",
  },
};

type SimasRow = {
  id: number;
  card: string | null;
  name: string | null;
  address: string | null;
  tipologi: string | null;
  provinsi_name: string | null;
  kabupaten_name: string | null;
  kecamatan_name: string | null;
  image: string | null;
};

type SimasResponse = {
  data?: SimasRow[];
  meta?: { page: number; perPage: number; total: number; totalPages: number };
};

/** Baris ibadah yang kita simpan — nama field disederhanakan & di-trim. */
export type IbadahRow = {
  id: number;
  /** Nomor ID masjid SIMAS, mis. "01.2.31.73.01.000090". */
  card?: string;
  name: string;
  address?: string;
  jenis: Jenis;
  tipologi: string;
  kota?: string;
  kecamatan?: string;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const clean = (v: string | null | undefined): string | undefined => {
  const s = (v ?? "").replace(/\s+/g, " ").trim();
  return s.length > 0 ? s : undefined;
};

/** GET dengan 3x percobaan — meniru perilaku klien SIMAS sendiri. */
async function getJson(url: string): Promise<SimasResponse> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as SimasResponse;
    } catch (err) {
      lastErr = err;
      await sleep(400 * (attempt + 1));
    }
  }
  throw new Error(`gagal ambil ${url}: ${String(lastErr)}`);
}

function pageUrl(jenis: Jenis, tipologi: number, page: number): string {
  const q = new URLSearchParams({
    page: String(page),
    perPage: "36",
    tipologi: String(tipologi),
    prov: PROV,
  });
  return `${BASE}/${jenis}?${q}`;
}

/** Ambil seluruh halaman untuk satu (jenis, tipologi). */
async function fetchTipologi(
  jenis: Jenis,
  tipologi: number,
  label: string
): Promise<IbadahRow[]> {
  const first = await getJson(pageUrl(jenis, tipologi, 1));
  const totalPages = first.meta?.totalPages ?? 0;
  const total = first.meta?.total ?? 0;
  const rows: SimasRow[] = [...(first.data ?? [])];

  for (let page = 2; page <= totalPages; page++) {
    await sleep(DELAY_MS);
    const res = await getJson(pageUrl(jenis, tipologi, page));
    rows.push(...(res.data ?? []));
    if (page % 20 === 0 || page === totalPages) {
      process.stdout.write(
        `  ${jenis} ${label}: ${rows.length}/${total} (hal ${page}/${totalPages})\n`
      );
    }
  }

  if (rows.length !== total) {
    console.warn(
      `  ! ${jenis} ${label}: dapat ${rows.length} baris, meta bilang ${total}`
    );
  }

  return rows
    .filter((r) => clean(r.name))
    .map((r) => ({
      id: r.id,
      card: clean(r.card),
      name: clean(r.name)!,
      address: clean(r.address),
      jenis,
      // Pakai label tipologi kita: nama dari server kadang beda kapitalisasi
      // dan ada yang berspasi ganda ("Masjid di Tempat Publik ").
      tipologi: label,
      kota: clean(r.kabupaten_name),
      kecamatan: clean(r.kecamatan_name),
    }));
}

async function main() {
  const started = Date.now();
  const all: IbadahRow[] = [];
  const perTipologi: { jenis: Jenis; tipologi: string; rows: number }[] = [];

  for (const jenis of ["masjid", "mushalla"] as Jenis[]) {
    for (const [id, label] of Object.entries(TIPOLOGI[jenis])) {
      console.log(`→ ${jenis} tip=${id} ${label}`);
      const rows = await fetchTipologi(jenis, Number(id), label);
      perTipologi.push({ jenis, tipologi: label, rows: rows.length });
      all.push(...rows);
      await sleep(DELAY_MS);
    }
  }

  // SIMAS bisa memuat id yang sama di lebih dari satu halaman saat data
  // bergeser di tengah paginasi — buang duplikat berdasarkan id.
  const seen = new Set<number>();
  const rows = all.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });
  const dupes = all.length - rows.length;

  const snapshot = {
    source: "SIMAS Kemenag RI — Sistem Informasi Masjid",
    sourceUrl: "https://simas.kemenag.go.id/page/profilmasjid",
    scope: "Provinsi DKI Jakarta (prov=11), seluruh tipologi masjid & mushalla",
    note:
      "Data registrasi Kemenag, bukan sensus lapangan. Endpoint daftar tidak " +
      "memuat koordinat; titik peta diurus terpisah (lihat gmti-ibadah-coords.json).",
    fetchedAt: new Date().toISOString(),
    counts: {
      total: rows.length,
      masjid: rows.filter((r) => r.jenis === "masjid").length,
      mushalla: rows.filter((r) => r.jenis === "mushalla").length,
      perTipologi,
      duplikatDibuang: dupes,
    },
    rows,
  };

  writeFileSync(out("../data/gmti-ibadah.json"), JSON.stringify(snapshot, null, 1));

  const secs = Math.round((Date.now() - started) / 1000);
  console.log(
    `\n✓ ${rows.length} baris (${snapshot.counts.masjid} masjid, ${snapshot.counts.mushalla} mushalla)` +
      `${dupes ? `, ${dupes} duplikat dibuang` : ""} — ${secs}s`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
