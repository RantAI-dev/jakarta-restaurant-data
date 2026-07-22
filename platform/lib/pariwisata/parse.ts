/** Helper murni untuk agregasi dashboard pariwisata GCI. */

/**
 * Klasifikasi wilayah Jakarta dari alamat venue panjang (datamart-quality).
 * Cascade: (1) kata wilayah ID, (2) kata wilayah Inggris/singkatan, (3) prefiks
 * kode pos 5-digit (10–14 → Pusat/Barat/Selatan/Timur/Utara), (4) luar Jakarta.
 * Diverifikasi menutup 100% baris data-seni-pertunjukan-dan-visual.
 */
export function wilayahFromAddress(addr: unknown): string {
  const a = String(addr ?? "").toUpperCase();
  if (/SERIBU/.test(a)) return "Kepulauan Seribu";
  if (/JAKARTA SELATAN|SOUTH JAKARTA|JKT SELATAN|JAKSEL/.test(a)) return "Jakarta Selatan";
  if (/JAKARTA PUSAT|CENTRAL JAKARTA|JKT PUSAT|JAKPUS/.test(a)) return "Jakarta Pusat";
  if (/JAKARTA BARAT|WEST JAKARTA|JKT BARAT|JAKBAR/.test(a)) return "Jakarta Barat";
  if (/JAKARTA TIMUR|EAST JAKARTA|JKT TIMUR|JAKTIM/.test(a)) return "Jakarta Timur";
  if (/JAKARTA UTARA|NORTH JAKARTA|JKT UTARA|JAKUT/.test(a)) return "Jakarta Utara";
  // Kawasan perbatasan yang dicatat sbg venue event Jakarta → wilayah terdekat.
  if (/CIBUBUR|CILANGKAP|PONDOK GEDE/.test(a)) return "Jakarta Timur";
  const pos = a.match(/(?:^|[^0-9])(1[0-4][0-9]{3})(?:[^0-9]|$)/);
  if (pos) {
    const p = pos[1].slice(0, 2);
    if (p === "10") return "Jakarta Pusat";
    if (p === "11") return "Jakarta Barat";
    if (p === "12") return "Jakarta Selatan";
    if (p === "13") return "Jakarta Timur";
    if (p === "14") return "Jakarta Utara";
  }
  return "Jakarta (tidak terinci)";
}

/**
 * Set artis yang NAMANYA muncul di korpus nama-event Jakarta (word-boundary,
 * hindari false-positive substring). Untuk cek "sudah pernah didatangkan ke Jakarta".
 */
export function playedArtists(corpus: string[], artists: string[]): Set<string> {
  const big = corpus.map((s) => String(s ?? "").toUpperCase());
  const out = new Set<string>();
  for (const artist of artists) {
    const A = String(artist ?? "").toUpperCase().trim();
    if (A.length < 3) continue; // nama terlalu pendek → rawan false-positive
    const esc = A.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp("(^|[^A-Z0-9])" + esc + "([^A-Z0-9]|$)");
    if (big.some((e) => re.test(e))) out.add(artist);
  }
  return out;
}

const BULAN = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** YYYYMM / YYYY-MM / MM → "Mmm 'YY" atau "Mmm". */
export function bulanLabel(periode: unknown): string {
  const s = String(periode ?? "").replace(/[^0-9]/g, "");
  if (s.length >= 6) {
    const y = s.slice(0, 4);
    const m = parseInt(s.slice(4, 6), 10);
    return `${BULAN[m] ?? s.slice(4, 6)} '${y.slice(2)}`;
  }
  const m = parseInt(s, 10);
  return BULAN[m] ?? s;
}

/** Title-case string ALLCAPS → "Kata Kata" (untuk label chart yang rapi). */
export function titleCase(v: unknown): string {
  return String(v ?? "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/** Ember catch-all yang harus dibuang dari agregasi (bukan kategori nyata). */
const CATCHALL = new Set(["LAINNYA", "JUMLAH", "TOTAL", "-", "", "PINTU LAINNYA"]);
export function isCatchAll(v: unknown): boolean {
  return CATCHALL.has(String(v ?? "").trim().toUpperCase());
}

/**
 * Normalisasi pintu masuk → gerbang Jakarta saja (Soekarno-Hatta, Tanjung Priok,
 * Halim). Non-Jakarta → null (dibuang). Dataset sumber bercampur skala nasional.
 */
export function jakartaGate(pintu: unknown): string | null {
  const s = String(pintu ?? "").toUpperCase();
  if (s.includes("SOEKARNO") || s.includes("HATTA")) return "Soekarno-Hatta";
  if (s.includes("TANJUNG PRIOK")) return "Tanjung Priok";
  if (s.includes("HALIM")) return "Halim Perdanakusuma";
  return null;
}
