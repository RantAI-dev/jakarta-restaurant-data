/**
 * Bangun data mart Wisman (dibersihkan) dari data mentah SDI di DB:
 *  1. Per NEGARA — normalisasi klasifikasi negara BPS (CHINA≡TIONGKOK, FILIPINA≡PHILIPINA, dll).
 *  2. Per BULAN — total wisman per periode.
 *  3. Per PINTU MASUK — normalisasi nama pintu (BANDAR UDARA SOEKARNO HATTA≡SOEKARNO-HATTA, dll).
 * Output → platform/data/wisman-*.json (dipakai seed katalog).
 *
 *   npx tsx scripts/build-wisman-mart.ts   (butuh DATABASE_URL)
 */
import { db, schema } from "../lib/db";
import { eq, asc } from "drizzle-orm";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const rowsOf = async (slug: string) =>
  (await db.select({ data: schema.record.data }).from(schema.record).where(eq(schema.record.slug, slug)).orderBy(asc(schema.record.ordinal))).map((r) => r.data as Record<string, string>);

const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

// — Normalisasi negara (klasifikasi BPS tidak konsisten) —
const NEGARA: Record<string, string> = {
  CHINA: "Tiongkok", TIONGKOK: "Tiongkok",
  FILIPINA: "Filipina", PHILIPINA: "Filipina",
  AMERIKA: "Amerika Serikat", "AMERIKA SERIKAT": "Amerika Serikat",
  HONGKONG: "Hongkong", "HONG KONG": "Hongkong",
  "SAUDI ARABIA": "Arab Saudi", "ARAB SAUDI": "Arab Saudi",
  "UNI EMIRAT ARAB": "Uni Emirat Arab", INGGRIS: "Inggris", BELANDA: "Belanda",
  PERANCIS: "Prancis", PRANCIS: "Prancis", JERMAN: "Jerman", JEPANG: "Jepang",
  "KOREA SELATAN": "Korea Selatan", MALAYSIA: "Malaysia", SINGAPURA: "Singapura",
  AUSTRALIA: "Australia", INDIA: "India", THAILAND: "Thailand", TAIWAN: "Taiwan",
  RUSIA: "Rusia", MESIR: "Mesir", BAHRAIN: "Bahrain", LAINNYA: "Lainnya",
};
const cleanNegara = (s: string) => {
  const k = String(s || "").trim().toUpperCase().replace(/\s+/g, " ");
  return NEGARA[k] || k.charAt(0) + k.slice(1).toLowerCase();
};

// — Normalisasi pintu masuk —
const cleanPintu = (s: string) => {
  let k = String(s || "").trim().toUpperCase().split(",")[0].split("/")[0].trim();
  k = k.replace(/^BANDAR UDARA\s+/, "").replace(/^BANDARA\s+/, "").replace(/^PELABUHAN\s+/, "").replace(/\s+INT'?L?\.?$/, "").trim();
  const MAP: Record<string, string> = {
    "SOEKARNO HATTA": "Soekarno-Hatta", "SOEKARNO-HATTA": "Soekarno-Hatta",
    "NGURAH RAI": "Ngurah Rai", KUALANAMU: "Kualanamu", BATAM: "Batam",
    "HANG NADIM": "Batam (Hang Nadim)", "SAM RATULANGI": "Sam Ratulangi",
    "SULTAN SYARIF KASIM II": "Sultan Syarif Kasim II", "SIMPANG TIGA": "Sultan Syarif Kasim II",
    ADISUCIPTO: "Adisucipto", "HUSEIN SASTRANEGARA": "Husein Sastranegara",
    "TANJUNG UBAN": "Tanjung Uban", "BALAI KARIMUN": "Balai Karimun", "PINTU LAINNYA": "Lainnya",
    JUANDA: "Juanda", "ADI SUMARMO": "Adi Sumarmo", MINANGKABAU: "Minangkabau",
    "TANJUNG PRIOK": "Tanjung Priok", "TANJUNG PINANG": "Tanjung Pinang",
    SELAPARANG: "Selaparang", "SULTAN HASANUDDIN": "Sultan Hasanuddin", MAKASAR: "Makassar",
    SEPINGGAN: "Sepinggan", ENTIKONG: "Entikong", "BANDARA INT LOMBOK": "Lombok", LOMBOK: "Lombok",
  };
  return MAP[k] || (k.charAt(0) + k.slice(1).toLowerCase());
};

const P = (o: object) => JSON.stringify(o);
function writeDs(file: string, slug: string, title: string, description: string, cols: [string, string, string][], rows: Record<string, unknown>[]) {
  const columns = cols.map(([key, label, type]) => ({ key, label, type, description: null }));
  writeFileSync(join(process.cwd(), "data", file), P({ slug, title, description, columns, rows }));
  console.log(`  ${file}: ${rows.length} baris`);
}

async function main() {
  // 1) per negara (dibersihkan) — dari dataset kebangsaan terbaru
  const keb = await rowsOf("data-jumlah-wisatawan-mancanegara-berdasarkan-kebangsaan");
  const negAgg = new Map<string, { periode: string; negara: string; jumlah: number }>();
  for (const r of keb) {
    const periode = r.periode_data, negara = cleanNegara(r.kebangsaan);
    const key = periode + "|" + negara;
    const cur = negAgg.get(key) || { periode, negara, jumlah: 0 };
    cur.jumlah += num(r.jumlah_kunjungan);
    negAgg.set(key, cur);
  }
  const negRows = [...negAgg.values()].sort((a, b) => b.periode.localeCompare(a.periode) || b.jumlah - a.jumlah)
    .map((x) => ({ periode_data: x.periode, negara: x.negara, jumlah_kunjungan: x.jumlah }));
  writeDs("wisman-per-negara.json", "wisman-jakarta-per-negara", "Wisman DKI Jakarta per Negara (BPS dibersihkan)",
    "Kunjungan wisatawan mancanegara ke DKI Jakarta per negara asal, klasifikasi negara BPS distandarkan (mis. China≡Tiongkok, Filipina≡Philipina).",
    [["periode_data", "Periode", "string"], ["negara", "Negara Asal", "string"], ["jumlah_kunjungan", "Jumlah Kunjungan", "number"]], negRows);

  // 2) per bulan (total) — agregasi kebangsaan
  const blnAgg = new Map<string, number>();
  for (const r of keb) blnAgg.set(r.periode_data, (blnAgg.get(r.periode_data) || 0) + num(r.jumlah_kunjungan));
  const blnRows = [...blnAgg.entries()].sort((a, b) => b[0].localeCompare(a[0]))
    .map(([periode, jml]) => ({ periode_data: periode, bulan: periode.slice(4, 6), tahun: periode.slice(0, 4), jumlah_kunjungan: jml }));
  writeDs("wisman-per-bulan.json", "wisman-jakarta-per-bulan", "Wisman DKI Jakarta per Bulan (total)",
    "Total kunjungan wisatawan mancanegara ke DKI Jakarta per bulan (agregasi seluruh negara asal).",
    [["periode_data", "Periode", "string"], ["tahun", "Tahun", "string"], ["bulan", "Bulan", "string"], ["jumlah_kunjungan", "Jumlah Kunjungan", "number"]], blnRows);

  // 3) per pintu masuk (dinormalisasi) — dari dataset pintu masuk
  const pin = await rowsOf("data-jumlah-kunjungan-wisman-ke-indonesia-berdasarkan-pintu-masuk-di-dki-jakarta");
  const pinAgg = new Map<string, { periode: string; bulan: string; pintu: string; jumlah: number }>();
  for (const r of pin) {
    const periode = r.periode_data, bulan = r.bulan, pintu = cleanPintu(r.pintu_masuk);
    const key = periode + "|" + pintu;
    const cur = pinAgg.get(key) || { periode, bulan, pintu, jumlah: 0 };
    cur.jumlah += num(r.jumlah);
    pinAgg.set(key, cur);
  }
  const pinRows = [...pinAgg.values()].sort((a, b) => b.periode.localeCompare(a.periode) || b.jumlah - a.jumlah)
    .map((x) => ({ periode_data: x.periode, bulan: x.bulan, pintu_masuk: x.pintu, jumlah_kunjungan: x.jumlah }));
  writeDs("wisman-per-pintu-masuk.json", "wisman-jakarta-per-pintu-masuk", "Wisman per Pintu Masuk (dinormalisasi)",
    "Kunjungan wisman menurut pintu masuk, nama pintu distandarkan (mis. 'BANDAR UDARA SOEKARNO HATTA'≡'Soekarno-Hatta'). Catatan: periode SDI terbatas (2010 & 2014).",
    [["periode_data", "Periode", "string"], ["bulan", "Bulan", "string"], ["pintu_masuk", "Pintu Masuk", "string"], ["jumlah_kunjungan", "Jumlah Kunjungan", "number"]], pinRows);

  console.log("Wisman mart selesai.");
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(1); });
