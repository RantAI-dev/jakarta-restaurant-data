# Plan 7 — Dashboard Bespoke per Indikator GCI/GPCI

> **For agentic workers:** REQUIRED SUB-SKILL: subagent-driven-development / executing-plans. Steps pakai checkbox.
>
> **Prasyarat:** Plan 1–5 selesai (DB terisi). Plan 6 (nav 4-menu) boleh paralel. Baca `docs/HANDOFF-gci-gpci-readiness.md`.

**Goal:** Tiap indikator GCI/GPCI punya **dashboard sendiri yang dirancang khusus** sesuai bentuk datanya (peta, breakdown wilayah, count kategori, occupancy, dll) — bukan satu chart generik. Struktur: primitif chart reusable + komponen bespoke per indikator.

**Prinsip:** hand-code per indikator, TAPI render pakai ~7 primitif bersama biar konsisten & tak menulis ulang SVG. Setiap indikator = 1 komponen di `components/indicators/<CODE>.tsx`.

**Tech Stack:** Next.js 15 · postgres.js · Tailwind · (map) Leaflet. Data dari DB (tabel `record`) via helper agregasi.

---

## Fakta data (hasil inspeksi — dipakai merancang viz)

7 archetype (dataset per indikator sudah dicek kolomnya):

| Archetype | Kolom kunci | Agregasi | Indikator |
|---|---|---|---|
| **A. Peta titik** | `obyek_wisata, longitude, latitude, jenis_wisatawan, jumlah_kunjungan` | sum kunjungan per obyek; split wisman/wisnus | CE4, CI-TA, CI-WH, CI-MU |
| **B. Tren + lokasi** | `periode_data, lokasi, jumlah` | sum per periode; breakdown per lokasi | CE1, CI-FV |
| **C. Breakdown wilayah** | `periode_data, wilayah, kecamatan, kelurahan, jumlah` | sum jumlah per wilayah/kecamatan | CE2, CI-DI, CI-CX |
| **D. Registry usaha** | `kbli, uraian_kbli, jenis_usaha, skala_usaha, kabupaten_atau_kota` | **COUNT** baris per kategori | BA-MICE, CI-IC, CI-HR, CI-NL |
| **E. List event** | `periode_data, nama_event, nama_venue` | **COUNT** event per periode; top venue | CE3, CI-CE, CI-AM, CI-TH |
| **F. Occupancy/bintang** | `periode_data, jenis_hotel, rata_rata` (persen, koma desimal) | series per jenis_hotel | CI-LH |
| **G. Survei pengeluaran** | `periode_data, jenis_wisatawan, asal_negara, jumlah_responden, rata_rata` | avg/nilai per asal_negara | CI-SH |

⚠️ **Catatan parsing:** angka bisa `"51,85"` (koma desimal) atau `"3645837"` (polos). Registry & event = **count baris** (tiap baris 1 record), bukan kolom angka.

---

## File Structure

- `lib/agg.ts` — helper agregasi (parse angka ID, groupSum, groupCount, byPeriod, topN).
- `components/charts/` — primitif: `LineTrend`, `BarBreakdown`, `GroupedLines`, `RankedList`, `KpiStat`, `Donut`, `PointMap`.
- `lib/indicator-data.ts` — loader: ambil baris dataset indikator dari DB (server).
- `app/gci/[code]/page.tsx`, `app/gpci/[code]/page.tsx` — route detail; dispatch ke komponen indikator.
- `components/indicators/<CODE>.tsx` — 19 komponen bespoke (1 per indikator data-ada).
- (dep) tambah `leaflet` + `react-leaflet` untuk PointMap.

---

## Task 1: Helper agregasi `lib/agg.ts`

**Files:** Create `lib/agg.ts`.

- [ ] **Step 1: Tulis helper**
```ts
/** Parse angka Indonesia: "51,85"->51.85, "1.234.567"->1234567, "3645837"->3645837. */
export function idNum(v: unknown): number | null {
  let s = String(v ?? "").trim();
  if (!s) return null;
  if (s.includes(",") && !/\.\d/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s.replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}
export type Row = Record<string, unknown>;

/** Jumlahkan `valueKey` per `groupKey`. */
export function groupSum(rows: Row[], groupKey: string, valueKey: string) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[groupKey] ?? "—");
    m.set(k, (m.get(k) ?? 0) + (idNum(r[valueKey]) ?? 0));
  }
  return [...m].map(([label, value]) => ({ label, value }));
}
/** Hitung jumlah baris per `groupKey` (untuk registry/event). */
export function groupCount(rows: Row[], groupKey: string) {
  const m = new Map<string, number>();
  for (const r of rows) {
    const k = String(r[groupKey] ?? "—");
    m.set(k, (m.get(k) ?? 0) + 1);
  }
  return [...m].map(([label, value]) => ({ label, value }));
}
/** Series per periode (sum nilai, atau count bila valueKey null). */
export function byPeriod(rows: Row[], periodKey: string, valueKey?: string) {
  const agg = valueKey ? groupSum(rows, periodKey, valueKey) : groupCount(rows, periodKey);
  return agg.sort((a, b) => a.label.localeCompare(b.label));
}
export function topN<T extends { value: number }>(arr: T[], n = 10) {
  return [...arr].sort((a, b) => b.value - a.value).slice(0, n);
}
```
- [ ] **Step 2: tsc + Commit.**

---

## Task 2: Loader data indikator `lib/indicator-data.ts`

**Files:** Create `lib/indicator-data.ts`.

- [ ] **Step 1:** Fungsi ambil baris dataset dari DB (server-side) berdasar slug, plus resolver "dataset utama indikator".
```ts
import { db, schema } from "@/lib/db";
import { eq, asc } from "drizzle-orm";
import { INDICATORS } from "@/lib/gci/indicators";
const { dataset, datasetSync, record } = schema;

export async function rowsFor(slug: string): Promise<Record<string, unknown>[]> {
  const rs = await db.select().from(record).where(eq(record.slug, slug)).orderBy(asc(record.ordinal));
  return rs.map((r) => r.data as Record<string, unknown>);
}
/** Semua dataset (tersync) yang cocok kata kunci sebuah indikator, judul → slug. */
export async function datasetsFor(code: string) {
  const ind = INDICATORS.find((i) => i.code === code);
  if (!ind) return [];
  const cat = await db.select({ slug: dataset.slug, title: dataset.title }).from(dataset);
  const syncs = new Map((await db.select({ slug: datasetSync.slug, total: datasetSync.total }).from(datasetSync)).map((s) => [s.slug, s.total ?? 0]));
  return cat
    .filter((d) => ind.match.some((kw) => d.title.toLowerCase().includes(kw)))
    .map((d) => ({ ...d, total: syncs.get(d.slug) ?? 0 }))
    .filter((d) => d.total > 0)
    .sort((a, b) => b.total - a.total);
}
```
- [ ] **Step 2: tsc + Commit.**

---

## Task 3: Primitif chart `components/charts/*`

Bikin komponen presentational (client bila interaktif). Semua terima `data:{label,value}[]` kecuali disebut lain.

**Files:** Create `components/charts/{LineTrend,BarBreakdown,GroupedLines,RankedList,KpiStat,Donut,PointMap}.tsx`.

- [ ] **Step 1: Yang non-map** (pure SVG/CSS, tanpa dep). Contoh `BarBreakdown` (horizontal bar, cocok breakdown wilayah/kategori):
```tsx
export function BarBreakdown({ data, unit = "" }: { data: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => (
        <div key={i} className="flex items-center gap-2 text-[13px]">
          <div className="w-40 truncate text-slate-600" title={d.label}>{d.label}</div>
          <div className="flex-1 bg-slate-100 rounded h-5 relative">
            <div className="h-5 rounded" style={{ width: `${(d.value / max) * 100}%`, background: "#0f3d7a" }} />
          </div>
          <div className="w-24 text-right tabular-nums text-slate-700">{d.value.toLocaleString("id-ID")}{unit}</div>
        </div>
      ))}
    </div>
  );
}
```
Bikin juga: `LineTrend` (garis/area per periode), `GroupedLines` (banyak seri, mis. occupancy per bintang), `RankedList` (leaderboard top-N dengan angka), `KpiStat` (angka besar + label + delta opsional), `Donut` (proporsi, mis. wisman vs wisnus). Boleh reuse pola `BarChart` yang sudah ada untuk yang batang.

- [ ] **Step 2: `PointMap`** (peta titik) — pakai Leaflet:
```bash
npm install leaflet react-leaflet && npm install -D @types/leaflet
```
`components/charts/PointMap.tsx` = client component, `dynamic(() => ..., { ssr: false })` di halaman pemakainya. Terima `points:{lat,lng,label,value}[]`, radius marker ∝ value. Center Jakarta [-6.2, 106.84].

- [ ] **Step 3: tsc + Commit per beberapa komponen.**

---

## Task 4: Route detail + dispatcher

**Files:** Create `app/gci/[code]/page.tsx`, `app/gpci/[code]/page.tsx`, `components/indicators/registry.tsx`.

- [ ] **Step 1: Registry** — peta `code → komponen indikator`:
```tsx
import type { ComponentType } from "react";
// import tiap komponen indikator saat sudah dibuat (Task 5)
export const INDICATOR_VIEWS: Record<string, ComponentType> = {
  // "CE1": Ce1View, ...
};
```
- [ ] **Step 2: Halaman detail** `app/gci/[code]/page.tsx`:
```tsx
import { notFound } from "next/navigation";
import { INDICATOR_VIEWS } from "@/components/indicators/registry";
export const dynamic = "force-dynamic";
export default async function Page({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const View = INDICATOR_VIEWS[code.toUpperCase()];
  if (!View) notFound();
  return <View />;
}
```
(Sama untuk `app/gpci/[code]/page.tsx`.)
- [ ] **Step 3:** Di `FrameworkView` (Plan 6), jadikan tiap baris indikator **tertaut** ke `/{framework}/{code}`.
- [ ] **Step 4: tsc + Commit.**

---

## Task 5: Komponen bespoke per indikator (19 — inti "hand-code")

Tiap komponen = Server Component async: ambil data via `datasetsFor(code)`+`rowsFor(slug)`, agregasi via `lib/agg`, render primitif. **Bungkus dengan header indikator** (nama, definisi, status, dataset sumber). Kerjakan **per archetype** (satu contoh penuh, sisanya ikut pola).

### 5A · Archetype PETA TITIK — CE4, CI-TA, CI-WH, CI-MU
Dataset: *Kunjungan Wisatawan ke Obyek Wisata* (`obyek_wisata, longitude, latitude, jenis_wisatawan, jumlah_kunjungan`).
Recipe: filter khusus per indikator → `PointMap` + `RankedList` top obyek + `LineTrend` total per periode + `Donut` wisman/wisnus.
- **CI-TA** (semua obyek), **CE4/CI-MU** filter `obyek_wisata` mengandung `museum|monumen`, **CI-WH** filter `kota tua|heritage|fatahillah|onrust`.
Contoh penuh `components/indicators/CI-TA.tsx`:
```tsx
import { datasetsFor, rowsFor } from "@/lib/indicator-data";
import { groupSum, byPeriod, topN, idNum } from "@/lib/agg";
import { RankedList } from "@/components/charts/RankedList";
import { LineTrend } from "@/components/charts/LineTrend";
import { Donut } from "@/components/charts/Donut";
import dynamic from "next/dynamic";
const PointMap = dynamic(() => import("@/components/charts/PointMap").then(m => m.PointMap), { ssr: false });
export default async function CiTaView() {
  const ds = await datasetsFor("CI-TA");
  const rows = ds.length ? await rowsFor(ds[0].slug) : [];
  const byObyek = topN(groupSum(rows, "obyek_wisata", "jumlah_kunjungan"), 15);
  const trend = byPeriod(rows, "periode_data", "jumlah_kunjungan");
  const points = rows.map(r => ({ lat: Number(r.latitude), lng: Number(r.longitude), label: String(r.obyek_wisata), value: idNum(r.jumlah_kunjungan) ?? 0 })).filter(p => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  const wisman = groupSum(rows, "jenis_wisatawan", "jumlah_kunjungan");
  // ...render header + <PointMap points/> + <RankedList data={byObyek}/> + <LineTrend data={trend}/> + <Donut data={wisman}/>
}
```
> ⚠️ Cek orientasi lat/long (sampel `longitude:"-5.7…"` justru latitude — kolomnya kebalik di sumber). **Tukar** lat/lng saat mapping.

### 5B · TREN + LOKASI — CE1, CI-FV
Dataset utama TIC (`periode_data, lokasi, jumlah`) + gabung *Wisman per Kebangsaan* untuk breakdown negara.
Recipe: `LineTrend` total per periode + `BarBreakdown` per lokasi TIC + `RankedList` top negara asal (dari dataset kebangsaan).

### 5C · BREAKDOWN WILAYAH — CE2, CI-DI, CI-CX
Dataset per kelurahan (`wilayah, kecamatan, kelurahan, jumlah`).
Recipe: `KpiStat` total + `BarBreakdown` per `wilayah` (5 kota) + `RankedList` top kecamatan/kelurahan. (CE2 kuliner & CI-DI dining bisa share komponen dgn judul beda.)

### 5D · REGISTRY USAHA — BA-MICE, CI-IC, CI-HR, CI-NL
Dataset izin usaha (`uraian_kbli, jenis_usaha, skala_usaha, kabupaten_atau_kota`). **COUNT baris.**
Recipe: `KpiStat` total usaha + `BarBreakdown` `groupCount` per `uraian_kbli` (jenis) + per `skala_usaha` + per `kabupaten_atau_kota`. Untuk CI-HR tambah `Data Rekapitulasi Usaha dan Kamar Hotel` untuk angka kamar bila ada.

### 5E · LIST EVENT — CE3, CI-CE, CI-AM, CI-TH
Dataset seni pertunjukan (`nama_event, nama_venue`). **COUNT event.**
Recipe: `LineTrend` count event per periode + `RankedList` top `nama_venue` (venue tersibuk) + tabel event terbaru. CI-TH (teater): `groupCount` per `nama_venue` sebagai proksi jumlah venue.

### 5F · OCCUPANCY/BINTANG — CI-LH
Dataset hunian hotel berbintang (`jenis_hotel`, `rata_rata` %, koma desimal → `idNum`).
Recipe: `GroupedLines` occupancy % per `jenis_hotel` sepanjang periode + `KpiStat` bintang-5 terbaru. Fokus bintang 4–5 = proksi hotel mewah.

### 5G · SURVEI PENGELUARAN — CI-SH
Dataset *Rata-rata Pengeluaran Wisatawan* (`asal_negara, jumlah_responden, rata_rata`).
Recipe: `BarBreakdown` rata-rata pengeluaran per `asal_negara` + `Donut` wisman/wisnus + `KpiStat` rata-rata keseluruhan.

- [ ] **Langkah pengerjaan Task 5:**
  - [ ] Buat 1 komponen penuh per archetype (7 komponen "acuan"), daftarkan di registry, verifikasi `/{fw}/{code}` render.
  - [ ] Replikasi ke indikator lain dalam archetype yang sama (ganti dataset/filter/judul).
  - [ ] Commit per indikator (`feat(ind): dashboard <CODE> <nama>`).

---

## Task 6: Rapikan
- [ ] Indikator **Gap** (9): halaman detail cukup kartu "data belum tersedia" + OPD pemilik + aksi (dari `note`). Tidak perlu chart.
- [ ] `npx tsc` bersih; stop dev → `npm run build` sukses.

## Definition of Done
- Tiap indikator data-ada punya halaman `/{gci|gpci}/{code}` dengan viz **sesuai bentuk datanya** (peta/breakdown/count/occupancy/survei), bukan chart seragam.
- Agregasi benar (count untuk registry/event, sum untuk wilayah, parse koma desimal untuk persen).
- Tertaut dari FrameworkView. tsc bersih, build sukses.

## Catatan
- Prioritas kerjakan yang **Ready** dulu (paling berdata), lalu Partial.
- Lat/long di dataset obyek wisata **terbalik** — tukar saat dipetakan.
- Semua bespoke tapi reuse 7 primitif → konsisten & cepat direplikasi.
