# Plan 8 — Dashboard Index-Aware (Benchmark + Gap + Data-Needed) per Indikator

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development / executing-plans. Steps pakai checkbox.
>
> **Prasyarat:** Plan 1–7 selesai (dashboard bespoke per indikator + ECharts jalan). Baca `docs/analisis-gci-gpci-pariwisata.md` — plan ini meng-operasionalkan analisis itu.

**Goal:** Tiap halaman indikator (`/gci/[code]`, `/gpci/[code]`) — selain chart data kita — juga menampilkan **3 blok baru** yang di-drive config:
1. **Cara indeks mengukur** indikator ini + **sumber data resmi** indeks (UIA, TripAdvisor, La Liste, dst) + rank/skor Jakarta.
2. **Benchmark & Gap:** nilai Jakarta (proksi kita) vs **frontier** (kota terbaik) + selisih.
3. **Data yang perlu dikumpulkan:** checklist data (status: `punya` / `proksi` / `belum ada`) + OPD/sumber. **Boleh kosong dulu** — ini peta pencarian data.

**Prinsip:** config-driven. Enrich 1 file JSON → taruh 3 blok di `IndicatorShell` → **semua 28 indikator otomatis dapat**, tanpa mengubah 19 komponen bespoke. Indikator gap (9) yang belum ada data pun langsung punya "peta data".

**Tech Stack:** Next.js 15 · Tailwind · ECharts (opsional gauge). Tanpa data eksternal baru (placeholder).

---

## Catatan verifikasi
- `npx tsc --noEmit -p tsconfig.json` → tanpa output.
- Smoke test `curl` ke `npm run dev` (:3031). Jangan `build` sambil `dev` jalan.

## File Structure
- **Create** `data/gci-gpci-benchmarks.json` — metadata indeks + benchmark + data-needed per kode (isi lengkap di Task 1).
- **Create** `lib/gci/benchmark.ts` — tipe + loader.
- **Create** `components/indicators/IndexContext.tsx` — 3 blok (cara diukur, benchmark-gap, data-needed).
- **Modify** `components/indicators/IndicatorShell.tsx` — render `<IndexContext code=... />` sebelum `{children}`.

---

## Task 1: Config benchmark & data-needed (`data/gci-gpci-benchmarks.json`)

Sumber angka: `docs/analisis-gci-gpci-pariwisata.md` (terverifikasi). Field per indikator:
`indexMetric` (apa yang diukur indeks) · `indexSource` (sumber data resmi indeks) · `unit` · `frontier` {city,value} · `jakarta` {value,note} (proksi kita / null) · `target` · `dataNeeded` [{label, status: "punya"|"proksi"|"belum", owner}].

- [ ] **Step 1: Buat file** dengan isi:

```json
{
  "CE1": { "indexMetric": "Jumlah wisatawan internasional tahunan", "indexSource": "Kearney GCI — International travelers", "unit": "kunjungan/tahun", "frontier": { "city": "Seoul (GCI)", "value": "18.936.562" }, "jakarta": { "value": "~2 juta/th", "note": "proksi data kebangsaan; perlu normalisasi tahunan" }, "target": "10 juta+/tahun", "dataNeeded": [ { "label": "Wisman tahunan resmi via bandara+pelabuhan", "status": "proksi", "owner": "BPS / Imigrasi" } ] },
  "CE2": { "indexMetric": "Ragam & jumlah usaha kuliner", "indexSource": "Kearney GCI — Culinary offerings", "unit": "usaha", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": "5.937 restoran berizin", "note": "kuantitas; indeks cenderung kualitas" }, "target": "kualitas kelas dunia (La Liste/Michelin)", "dataNeeded": [ { "label": "Restoran masuk La Liste / Michelin", "status": "belum", "owner": "eksternal" } ] },
  "CE3": { "indexMetric": "Venue & penyelenggaraan seni visual/pertunjukan", "indexSource": "Kearney GCI — Visual & performing arts", "unit": "venue/event", "frontier": { "city": "Seoul (GCI)", "value": "10.983" }, "jakarta": { "value": "352 event", "note": "proksi seni pertunjukan" }, "target": "> 5.000 venue/event terdata", "dataNeeded": [ { "label": "Inventori venue seni resmi", "status": "proksi", "owner": "Disparekraf / Disbud" } ] },
  "CE4": { "indexMetric": "Jumlah museum", "indexSource": "GPCI: De Gruyter Saur Int'l Directory of Arts", "unit": "museum", "frontier": { "city": "Seoul (GCI)", "value": "137" }, "jakarta": { "value": "proksi obyek wisata", "note": "belum ada hitung museum resmi" }, "target": "museum terdaftar di direktori internasional", "dataNeeded": [ { "label": "Daftar museum resmi + registrasi De Gruyter", "status": "belum", "owner": "Dinas Kebudayaan" } ] },
  "CE5": { "indexMetric": "Event olahraga internasional yang diselenggarakan", "indexSource": "Kearney GCI — Sporting events", "unit": "event/tahun", "frontier": { "city": "Seoul (GCI)", "value": "8" }, "jakarta": { "value": null, "note": "lintas-OPD" }, "target": "bidding event internasional", "dataNeeded": [ { "label": "Daftar event olahraga internasional di Jakarta", "status": "belum", "owner": "Dispora" } ] },
  "CE6": { "indexMetric": "Jumlah sister city", "indexSource": "Kearney GCI — Sister cities", "unit": "kota", "frontier": { "city": "Seoul (GCI)", "value": "24" }, "jakarta": { "value": null, "note": "lintas-OPD" }, "target": "> 20 kota kembar aktif", "dataNeeded": [ { "label": "Daftar sister city resmi", "status": "belum", "owner": "Biro Kerja Sama Daerah" } ] },
  "BA-MICE": { "indexMetric": "Jumlah konferensi internasional", "indexSource": "UIA Int'l Meetings Statistics / ICCA", "unit": "konferensi/tahun", "frontier": { "city": "Singapura/Tokyo (ICCA APAC teratas)", "value": "ratusan/tahun" }, "jakarta": { "value": "usaha MICE (kepotong 1.000)", "note": "indeks pakai UIA count, bukan jumlah usaha" }, "target": "naik peringkat UIA/ICCA", "dataNeeded": [ { "label": "Posisi & jumlah konferensi Jakarta di UIA/ICCA", "status": "belum", "owner": "eksternal (UIA/ICCA)" } ] },
  "HC-VISA": { "indexMetric": "Kemudahan masuk (visa)", "indexSource": "Kearney GCI — ease of entry", "unit": "kebijakan", "frontier": { "city": "—", "value": "bebas visa luas" }, "jakarta": { "value": null, "note": "kebijakan nasional" }, "target": "perluasan bebas visa/VoA", "dataNeeded": [ { "label": "Cakupan negara bebas visa/VoA", "status": "belum", "owner": "Imigrasi (nasional)" } ] },

  "CI-FV": { "indexMetric": "Jumlah wisatawan asing (Foreign Visitors)", "indexSource": "GPCI — annual foreign visitors", "unit": "kunjungan/tahun", "frontier": { "city": "Bangkok", "value": "~32 juta (2024)" }, "jakarta": { "value": "~2 juta/th", "note": "proksi kebangsaan; PENGUNGKIT #1" }, "target": "10 juta+/tahun", "dataNeeded": [ { "label": "Wisman tahunan resmi (bandara+pelabuhan)", "status": "proksi", "owner": "BPS / Imigrasi" } ] },
  "CI-FR": { "indexMetric": "Jumlah penduduk asing (Foreign Residents)", "indexSource": "GPCI — foreign residents", "unit": "orang", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": null, "note": "lintas-OPD" }, "target": "hub ekspat regional", "dataNeeded": [ { "label": "Jumlah ekspat izin tinggal (KITAS/KITAP)", "status": "belum", "owner": "Disdukcapil / Imigrasi" } ] },
  "CI-IC": { "indexMetric": "Konferensi internasional", "indexSource": "UIA Int'l Meetings Statistics Report", "unit": "konferensi/tahun", "frontier": { "city": "Singapura/Tokyo", "value": "ratusan/tahun" }, "jakarta": { "value": "usaha MICE (kepotong 1.000)", "note": "bukan angka UIA" }, "target": "top-tier UIA APAC", "dataNeeded": [ { "label": "Data UIA/ICCA Jakarta (jumlah & peringkat)", "status": "belum", "owner": "eksternal" } ] },
  "CI-CE": { "indexMetric": "Jumlah event budaya besar", "indexSource": "GPCI — cultural events", "unit": "event/tahun", "frontier": { "city": "London/Tokyo", "value": "—" }, "jakarta": { "value": "352 (seni pertunjukan)", "note": "" }, "target": "event budaya berskala internasional", "dataNeeded": [ { "label": "Kalender event budaya internasional Jakarta", "status": "proksi", "owner": "Disparekraf" } ] },
  "CI-CX": { "indexMetric": "Nilai ekspor konten budaya/kreatif", "indexSource": "GPCI — cultural content export value", "unit": "nilai (USD)", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": "proksi usaha ekraf/HKI", "note": "" }, "target": "ekspor ekraf (film/musik/gim)", "dataNeeded": [ { "label": "Nilai ekspor produk ekraf", "status": "belum", "owner": "Disparekraf (Ekraf) / BPS" } ] },
  "CI-AM": { "indexMetric": "Lingkungan pasar seni", "indexSource": "GPCI — art market environment", "unit": "indeks", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": "proksi seni visual", "note": "" }, "target": "pasar seni/galeri/lelang aktif", "dataNeeded": [ { "label": "Data galeri, lelang, transaksi seni", "status": "belum", "owner": "Disparekraf / Disbud" } ] },
  "CI-TA": { "indexMetric": "Daya tarik wisata (kualitas atraksi)", "indexSource": "GPCI — TripAdvisor rating + survei residen", "unit": "rating", "frontier": { "city": "—", "value": "rating tinggi" }, "jakarta": { "value": "38,9 jt kunjungan", "note": "indeks pakai RATING, bukan jumlah" }, "target": "rating TripAdvisor obyek unggulan naik", "dataNeeded": [ { "label": "Rating TripAdvisor per obyek wisata", "status": "belum", "owner": "eksternal (TripAdvisor)" } ] },
  "CI-WH": { "indexMetric": "Kedekatan situs Warisan Dunia", "indexSource": "GPCI — situs UNESCO radius 100km", "unit": "situs (skor ukuran/tipe)", "frontier": { "city": "kota dgn situs UNESCO", "value": "≥1 situs" }, "jakarta": { "value": "kemungkinan 0", "note": "belum ada situs UNESCO ≤100km" }, "target": "nominasi Kota Tua ke UNESCO", "dataNeeded": [ { "label": "Status nominasi/tentative list UNESCO Kota Tua", "status": "belum", "owner": "Dinas Kebudayaan" } ] },
  "CI-TH": { "indexMetric": "Jumlah teater", "indexSource": "GPCI — TripAdvisor + OpenStreetMap", "unit": "teater", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": "proksi venue (352)", "note": "" }, "target": "inventori teater terpetakan (OSM)", "dataNeeded": [ { "label": "Daftar & pemetaan gedung teater", "status": "proksi", "owner": "Disbud / Disparekraf" } ] },
  "CI-MU": { "indexMetric": "Jumlah museum", "indexSource": "GPCI — De Gruyter Saur Int'l Directory of Arts", "unit": "museum", "frontier": { "city": "Seoul", "value": "137 (GCI)" }, "jakarta": { "value": "proksi obyek wisata", "note": "" }, "target": "museum terdaftar internasional", "dataNeeded": [ { "label": "Daftar museum resmi + registrasi De Gruyter", "status": "belum", "owner": "Dinas Kebudayaan" } ] },
  "CI-ST": { "indexMetric": "Jumlah stadion (kapasitas > 10.000)", "indexSource": "GPCI — World Stadiums (universitas dikecualikan)", "unit": "stadion", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": null, "note": "lintas-OPD (GBK, JIS)" }, "target": "data stadion terkurasi", "dataNeeded": [ { "label": "Daftar stadion >10rb kapasitas", "status": "belum", "owner": "Dispora" } ] },
  "CI-HR": { "indexMetric": "Jumlah kamar hotel (radius ~10km pusat)", "indexSource": "GPCI — rata-rata travelweekly.com + Hotels.com", "unit": "kamar", "frontier": { "city": "kota top", "value": "puluhan ribu++" }, "jakarta": { "value": "25.922 / 130 hotel", "note": "berbintang saja — undercount" }, "target": "inventori akomodasi lengkap", "dataNeeded": [ { "label": "Inventori seluruh akomodasi (non-bintang juga)", "status": "belum", "owner": "Disparekraf" }, { "label": "Kelengkapan listing Hotels.com/travelweekly", "status": "belum", "owner": "eksternal" } ] },
  "CI-LH": { "indexMetric": "Jumlah kamar hotel mewah (bintang-5)", "indexSource": "GPCI — travelweekly class 9/10 radius 10km", "unit": "kamar", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": "hotel bintang-5 (okupansi ~36%)", "note": "relatif kuat" }, "target": "okupansi & rating naik", "dataNeeded": [ { "label": "Jumlah kamar bintang-5 + okupansi", "status": "proksi", "owner": "Disparekraf" } ] },
  "CI-SH": { "indexMetric": "Daya tarik belanja", "indexSource": "GPCI — TripAdvisor rating + survei residen", "unit": "rating", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": "% pengaruh belanja (proksi)", "note": "" }, "target": "rating destinasi belanja naik", "dataNeeded": [ { "label": "Rating TripAdvisor destinasi belanja", "status": "belum", "owner": "eksternal" } ] },
  "CI-DI": { "indexMetric": "Daya tarik kuliner (kualitas)", "indexSource": "GPCI — La Liste Top 1000 + survei residen", "unit": "rating/daftar", "frontier": { "city": "Paris/Tokyo", "value": "banyak resto La Liste" }, "jakarta": { "value": "5.937 restoran", "note": "kuantitas; indeks = kualitas" }, "target": "resto Jakarta masuk La Liste/Michelin", "dataNeeded": [ { "label": "Jumlah resto Jakarta di La Liste/Michelin", "status": "belum", "owner": "eksternal" } ] },
  "CI-NL": { "indexMetric": "Pilihan hiburan malam", "indexSource": "GPCI — TripAdvisor rating + survei residen", "unit": "rating", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": "% wisata malam + usaha hiburan", "note": "" }, "target": "ekosistem & rating nightlife naik", "dataNeeded": [ { "label": "Rating TripAdvisor nightlife", "status": "belum", "owner": "eksternal" } ] },

  "AC-DF": { "indexMetric": "Kota dengan penerbangan langsung internasional", "indexSource": "GPCI — Accessibility", "unit": "kota tujuan", "frontier": { "city": "hub besar", "value": "ratusan rute" }, "jakarta": { "value": null, "note": "lintas-OPD" }, "target": "tambah rute langsung", "dataNeeded": [ { "label": "Daftar kota tujuan penerbangan langsung dari CGK", "status": "belum", "owner": "Dishub / AP II" } ] },
  "AC-AP": { "indexMetric": "Jumlah penumpang udara", "indexSource": "GPCI — Accessibility", "unit": "penumpang/tahun", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": null, "note": "lintas-OPD" }, "target": "—", "dataNeeded": [ { "label": "Statistik penumpang CGK/HLP", "status": "belum", "owner": "AP II" } ] },
  "AC-AR": { "indexMetric": "Kedatangan/keberangkatan bandara", "indexSource": "GPCI — Accessibility", "unit": "pergerakan/tahun", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": null, "note": "lintas-OPD" }, "target": "—", "dataNeeded": [ { "label": "Data pergerakan pesawat", "status": "belum", "owner": "AP II" } ] },
  "AC-TT": { "indexMetric": "Waktu tempuh ke bandara", "indexSource": "GPCI — Accessibility", "unit": "menit", "frontier": { "city": "—", "value": "—" }, "jakarta": { "value": null, "note": "lintas-OPD" }, "target": "akses bandara lebih cepat", "dataNeeded": [ { "label": "Waktu tempuh pusat→CGK", "status": "belum", "owner": "Dishub" } ] }
}
```

- [ ] **Step 2: Commit** — `git add data/gci-gpci-benchmarks.json && git commit -m "data(gci): index metric + benchmark + data-needed per indicator"`

---

## Task 2: Loader `lib/gci/benchmark.ts`

- [ ] **Step 1:**
```ts
import raw from "@/data/gci-gpci-benchmarks.json";

export type DataItem = { label: string; status: "punya" | "proksi" | "belum"; owner: string };
export type Benchmark = {
  indexMetric: string;
  indexSource: string;
  unit: string;
  frontier: { city: string; value: string };
  jakarta: { value: string | null; note: string };
  target: string;
  dataNeeded: DataItem[];
};

const map = raw as Record<string, Benchmark>;
export function benchmarkFor(code: string): Benchmark | null {
  return map[code] ?? null;
}
```
- [ ] **Step 2: tsc + Commit.**

---

## Task 3: Komponen `IndexContext` (3 blok)

- [ ] **Step 1:** `components/indicators/IndexContext.tsx`:
```tsx
import { benchmarkFor } from "@/lib/gci/benchmark";

const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  punya: { label: "Punya", bg: "#e8f5ee", fg: "#0e7c42" },
  proksi: { label: "Proksi", bg: "#fff6e9", fg: "#b5651d" },
  belum: { label: "Belum ada", bg: "#fdecec", fg: "#b3261e" },
};

export function IndexContext({ code }: { code: string }) {
  const b = benchmarkFor(code);
  if (!b) return null;
  return (
    <div className="grid md:grid-cols-3 gap-5">
      {/* 1. Cara indeks mengukur */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Cara indeks mengukur</div>
        <div className="text-[14px] font-medium text-slate-800 mt-1">{b.indexMetric}</div>
        <div className="text-[12px] text-slate-500 mt-2">Sumber resmi indeks: <span className="text-slate-700">{b.indexSource}</span></div>
        <div className="text-[12px] text-slate-400 mt-1">Satuan: {b.unit}</div>
      </div>
      {/* 2. Benchmark & gap */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Jakarta vs frontier</div>
        <div className="mt-2 text-[13px]">
          <div className="flex justify-between"><span className="text-slate-500">Jakarta (proksi kita)</span><span className="font-semibold text-slate-800">{b.jakarta.value ?? "—"}</span></div>
          <div className="flex justify-between mt-1"><span className="text-slate-500">Frontier ({b.frontier.city})</span><span className="font-semibold" style={{ color: "#0f3d7a" }}>{b.frontier.value}</span></div>
          <div className="flex justify-between mt-1"><span className="text-slate-500">Target</span><span className="font-medium" style={{ color: "#e8a33d" }}>{b.target}</span></div>
        </div>
        {b.jakarta.note && <div className="text-[11px] text-slate-400 mt-2">{b.jakarta.note}</div>}
      </div>
      {/* 3. Data yang perlu dikumpulkan */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Data yang perlu dikumpulkan</div>
        <ul className="mt-2 space-y-2">
          {b.dataNeeded.map((d, i) => {
            const s = STATUS[d.status];
            return (
              <li key={i} className="text-[13px]">
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded mr-2" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
                <span className="text-slate-700">{d.label}</span>
                <span className="text-slate-400"> · {d.owner}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
```
- [ ] **Step 2: tsc + Commit.**

---

## Task 4: Sisipkan ke `IndicatorShell` (semua indikator otomatis)

- [ ] **Step 1:** Di `components/indicators/IndicatorShell.tsx`, import `IndexContext` dan render di awal `children` area (setelah title band, sebelum `{children}`):
```tsx
import { IndexContext } from "./IndexContext";
// ... di dalam <section ...> konten, paling atas:
        <IndexContext code={code} />
        {children}
```
- [ ] **Step 2:** Pastikan `IndicatorFallback` (indikator gap) juga pakai `IndicatorShell` → otomatis dapat blok data-needed. (Sudah, karena fallback membungkus IndicatorShell.)
- [ ] **Step 3: tsc + build + smoke.** Buka `/gpci/CI-FV`, `/gci/CE2`, `/gpci/CI-WH` (gap) → muncul 3 blok index-context di atas chart.
- [ ] **Step 4: Commit** — `feat(gci): index-aware context (metric/source/benchmark/gap/data-needed) on every indicator`.

---

## Definition of Done
- Tiap halaman indikator menampilkan: cara indeks mengukur + sumber resmi, Jakarta vs frontier + target, checklist data-needed (status punya/proksi/belum + OPD).
- Indikator gap pun punya "peta data" (apa yang harus dicari + ke siapa).
- Config-driven: update angka/benchmark = edit `data/gci-gpci-benchmarks.json` saja.
- `tsc` bersih; build sukses.

## Lanjutan (opsional)
- Ganti blok "Jakarta vs frontier" jadi **gauge ECharts** (progress ke target).
- Halaman `/benchmark` ringkasan lintas-indikator (Jakarta vs frontier) dari config ini.
- Isi `dataNeeded` yang "belum" begitu datanya ketemu → status → `punya`, otomatis kelihatan.
