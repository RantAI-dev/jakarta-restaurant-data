/**
 * Minimal i18n for the dashboard chrome. Restaurant data (names,
 * descriptions, addresses) stays in English; only the UI strings are
 * translated. Default language is Indonesian.
 */

export type Lang = "id" | "en";
export const LANGS: Lang[] = ["id", "en"];
export const DEFAULT_LANG: Lang = "id";
export const STORAGE_KEY = "dpj.lang";

export type Dict = Record<string, string>;

const id: Dict = {
  "nav.title": "Direktori Kuliner Internasional",
  "nav.switch_to": "EN",

  "hero.eyebrow": "JAKARTA · KULINER INTERNASIONAL",
  "hero.title_a": "Kuliner Internasional.",
  "hero.title_b": "Pilihan kami untuk Anda.",
  "hero.lead_prefix": "Daftar dari",
  "hero.lead_count": "{n} restoran dan bar",
  "hero.lead_suffix":
    "di Jakarta yang menyajikan makanan atau minuman internasional, dirangkum dari sumber publik. Setiap entri menyertakan tautan ke sumber aslinya — dan ke Google Maps.",
  "hero.cta_browse": "Telusuri direktori",
  "hero.cta_how": "Cara dibuat",

  "stat.establishments": "Tempat",
  "stat.cuisines": "Jenis kuliner",
  "stat.avg_rating": "Rata-rata rating",
  "stat.rated_count": "Sudah dinilai publik",

  "toolbar.search_placeholder": "Cari restoran di Jakarta…",
  "toolbar.cuisine_all": "Semua kuliner",
  "toolbar.cat.all": "Semua",
  "toolbar.cat.food": "Makanan",
  "toolbar.cat.beverage": "Minuman",
  "toolbar.cat.both": "Keduanya",
  "toolbar.sort.rating": "Rating tertinggi",
  "toolbar.sort.reviews": "Paling banyak diulas",
  "toolbar.sort.name": "A–Z",

  "card.open_maps": "Buka di Maps",
  "card.source": "Sumber",
  "card.reviews": "ulasan",
  "card.open_chip": "Buka ↗",
  "card.price.$": "Hemat",
  "card.price.$$": "Kasual",
  "card.price.$$$": "Premium",
  "card.price.$$$$": "Fine dining",

  "empty.title": "Tidak ada hasil.",
  "empty.hint": "Coba hapus filter, atau cari",

  "verify.idle": "Verifikasi sumber",
  "verify.loading": "Memverifikasi sumber…",
  "verify.retry": "Coba lagi ↗",
  "verify.sources_live": "sumber aktif",
  "verify.error": "Tidak dapat menghubungi endpoint verifikasi.",
  "verify.reverify": "Verifikasi ulang",
  "verify.time_seconds": "{n}d lalu",
  "verify.time_minutes": "{n}m lalu",
  "verify.time_hours": "{n}j lalu",
  "verify.details.title": "Laporan ketersediaan sumber",
  "verify.details.checked": "diperiksa {date}",
  "verify.details.summary_ok":
    "Semua {total} halaman sumber merespons dengan sukses.",
  "verify.details.summary_partial":
    "{reachable} dari {total} halaman sumber merespons. {failed} diblokir atau tidak dapat dijangkau — biasanya TripAdvisor / RestaurantGuru, yang menolak pengambilan oleh bot dari sisi server. Tautan tetap berfungsi di browser.",
  "verify.details.close": "Tutup detail",
  "verify.details.status_ok": "OK",
  "verify.details.status_blocked": "blokir",

  "footer.about_title": "Tentang direktori ini",
  "footer.about_body":
    "Dirangkum dari halaman agregator publik (Wanderlog, TripAdvisor, Chope, What's New Indonesia, NOW! Jakarta) dan ulasan Google. Rating dan jumlah ulasan diambil dari sumber tersebut pada saat kompilasi. Setiap kartu menyertakan tautan kutipan. Tempat yang sudah tutup permanen telah dihapus dari daftar.",
  "footer.inspect": "Periksa",
  "footer.raw_json": "JSON mentah ↗",
  "footer.source_liveness": "Ketersediaan sumber ↗",
  "footer.coverage": "Cakupan",
  "footer.coverage.estab": "{n} tempat",
  "footer.coverage.cuisines": "{n} jenis kuliner",
  "footer.coverage.rated": "{n} dengan rating publik",
  "footer.copyright":
    "© {year} Jakarta Restaurant Data — proyek direktori publik.",
  "footer.typeface": "Diset dengan SF Pro · Inter sebagai cadangan.",
};

const en: Dict = {
  "nav.title": "International Cuisine Directory",
  "nav.switch_to": "ID",

  "hero.eyebrow": "JAKARTA · INTERNATIONAL CUISINE",
  "hero.title_a": "International Cuisine.",
  "hero.title_b": "Curated for you.",
  "hero.lead_prefix": "A web-sourced register of",
  "hero.lead_count": "{n} restaurants and bars",
  "hero.lead_suffix":
    "in Jakarta serving international food or beverages. Every entry links to its public source — and to Google Maps.",
  "hero.cta_browse": "Browse the directory",
  "hero.cta_how": "How this was built",

  "stat.establishments": "Establishments",
  "stat.cuisines": "Cuisines covered",
  "stat.avg_rating": "Average rating",
  "stat.rated_count": "Publicly rated",

  "toolbar.search_placeholder": "Search Jakarta restaurants…",
  "toolbar.cuisine_all": "All cuisines",
  "toolbar.cat.all": "All",
  "toolbar.cat.food": "Food",
  "toolbar.cat.beverage": "Beverage",
  "toolbar.cat.both": "Both",
  "toolbar.sort.rating": "Top rated",
  "toolbar.sort.reviews": "Most reviewed",
  "toolbar.sort.name": "A–Z",

  "card.open_maps": "Open in Maps",
  "card.source": "Source",
  "card.reviews": "reviews",
  "card.open_chip": "Open ↗",
  "card.price.$": "Budget",
  "card.price.$$": "Casual",
  "card.price.$$$": "Premium",
  "card.price.$$$$": "Fine dining",

  "empty.title": "No matches.",
  "empty.hint": "Try clearing a filter, or searching",

  "verify.idle": "Verify sources",
  "verify.loading": "Verifying sources…",
  "verify.retry": "Retry ↗",
  "verify.sources_live": "sources live",
  "verify.error": "Could not reach the verification endpoint.",
  "verify.reverify": "Re-verify",
  "verify.time_seconds": "{n}s ago",
  "verify.time_minutes": "{n}m ago",
  "verify.time_hours": "{n}h ago",
  "verify.details.title": "Source liveness report",
  "verify.details.checked": "checked {date}",
  "verify.details.summary_ok":
    "All {total} source pages responded successfully.",
  "verify.details.summary_partial":
    "{reachable} of {total} source pages responded. {failed} blocked or unreachable — typically TripAdvisor / RestaurantGuru, which refuse server-side bot fetches. Links still work in a browser.",
  "verify.details.close": "Close details",
  "verify.details.status_ok": "OK",
  "verify.details.status_blocked": "blocked",

  "footer.about_title": "About this directory",
  "footer.about_body":
    "Compiled from public aggregator pages (Wanderlog, TripAdvisor, Chope, What's New Indonesia, NOW! Jakarta) and Google reviews. Ratings and review counts are taken from those sources at the time of compilation. Every card carries citation links. Permanently-closed venues from those lists have been omitted.",
  "footer.inspect": "Inspect",
  "footer.raw_json": "Raw JSON ↗",
  "footer.source_liveness": "Source liveness ↗",
  "footer.coverage": "Coverage",
  "footer.coverage.estab": "{n} establishments",
  "footer.coverage.cuisines": "{n} cuisine labels",
  "footer.coverage.rated": "{n} with public ratings",
  "footer.copyright":
    "© {year} Jakarta Restaurant Data — public directory project.",
  "footer.typeface": "Set in SF Pro · Inter fallback.",
};

export const DICT: Record<Lang, Dict> = { id, en };

export function translate(
  lang: Lang,
  key: string,
  vars?: Record<string, string | number>
): string {
  let s = DICT[lang]?.[key] ?? DICT.en[key] ?? key;
  if (vars) {
    Object.entries(vars).forEach(([k, v]) => {
      s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    });
  }
  return s;
}
