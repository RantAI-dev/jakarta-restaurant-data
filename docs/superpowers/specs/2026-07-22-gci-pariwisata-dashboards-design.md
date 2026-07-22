# GCI Pariwisata — Dashboard Visual per Indikator

**Date:** 2026-07-22
**Status:** Approved (design), pending implementation plan
**Working dir:** `/home/shiro/rantai/Dinas-Pariwisata/platform`
**Branch:** `deploy/portainer-selfhost` (JANGAN push ke `main`/Vercel)

## Tujuan

Mengubah 3 halaman indikator pariwisata GCI (`/gci/pariwisata/*`) dari
"tabel doang" menjadi **dashboard visual** — KPI + grafik house-style di atas,
tabel data mentah dilipat (collapsible) di bawah. Tema putih + oranye (`#ed6b23`),
link biru (`#2563eb`). "Secakep mungkin": polish tinggi tapi tetap konsisten
dengan design system yang ada.

## Prinsip & Keputusan

- **Server-rendered, reuse chart kit.** Mirror pola `components/indicators/BaMice.tsx`:
  server component → `rowsFor(slug)` → agregasi `lib/agg` → render chart kit
  (`KpiStat`, `BarBreakdown`, `Donut`, `LineTrend`, `GroupedLines`, `RankedList`).
  Tidak menambah dependency (echarts + Leaflet sudah ada).
- **Charts di atas, tabel mentah collapsible di bawah** (`<details>` membungkus `SdiTable`).
- **Kerjakan Seni Pertunjukan dulu**, review, lalu wisman + kuliner pola sama.
- **Tanpa peta** — dataset tak punya koordinat; pakai bar per wilayah/kecamatan.
- **Angka resmi = headline.** 156 / 2.767.622 / 0 tetap sebagai angka indikator resmi
  di hero (dari `PariwisataShell`), terpisah dari agregasi data pendukung (cakupan bisa beda).

## Infrastruktur yang sudah ada (dipakai ulang)

- `lib/indicator-data.ts` → `rowsFor(slug)` (server, DB-backed, snapshot+fallback).
- `lib/agg.ts` → `idNum`, `groupSum(rows,groupKey,valueKey)`, `groupCount(rows,groupKey)`,
  `byPeriod(rows,periodKey,valueKey?)`, `topN(arr,n)`, `total(arr)`, `fmtPeriode`.
- `components/charts/*` → `KpiStat{label,value,sub}`, `BarBreakdown{data,unit?,color?}`,
  `Donut{data}`, `LineTrend{data}`, `GroupedLines`, `RankedList{data,unit?}`.
  Semua chart makan `Point[] = {label,value}`.
- `components/pariwisata/PariwisataShell.tsx` (hero + headline) & `Section`.
- `components/SdiTable.tsx` (tabel embed + search + lazy-load).

## Building blocks baru (dibuat sekali, dipakai 3 halaman)

1. **`components/pariwisata/DashboardKit.tsx`**
   - `KpiRow` — strip responsif berisi `KpiStat` cards (grid `sm:grid-cols-2 lg:grid-cols-4`).
   - `ChartCard{title, sub?, children, span?}` — kartu putih (`.utility-card`) pembungkus
     satu grafik; header judul + garis oranye tipis. `span` untuk lebar kolom di grid.
   - `ChartGrid` — grid `md:grid-cols-2` / `lg:grid-cols-3` untuk menata ChartCard.
   - `RawDataDisclosure{slug, title, columns?, count}` — `<details>` tertutup default,
     summary "▸ Lihat data mentah · {count} baris", isi `SdiTable`.
2. **`lib/pariwisata/parse.ts`** (helper kecil, murni):
   - `kotaFromAddress(addr)` — regex ambil "JAKARTA {SELATAN|PUSAT|...}" / "KEP. SERIBU"
     dari `lokasi_venue`; fallback "Lainnya".
   - `bulanLabel(periode)` — YYYYMM / MM → nama bulan pendek (untuk sumbu / label).
   - reuse `fmtPeriode` bila cukup.

## Polish "cakep" (konsisten, tidak norak)

- **Palet oranye bertingkat** untuk seri chart: `#ed6b23`, `#f0a13a`, `#c2410c`, `#f4a672`,
  `#9a3412` (definisikan sekali di DashboardKit, oper via prop `color`).
- **KPI cards**: angka besar `tabular`, label mono uppercase, `sub` untuk konteks
  (mis. "+2,3% YoY"), aksen kiri tipis oranye. Reuse `KpiStat` (extend `sub` untuk tren
  ▲/▼ berwarna hijau/merah bila ada delta).
- **ChartCard**: border hairline, shadow-sm, hover shadow-md, judul + kapsul kategori oranye.
- **Hero**: tambah 1 sparkline/mini-metric ringkas bila murah (opsional, tidak wajib).
- Semua grafik pakai formatter angka `id-ID` (sudah ada di chart kit).

## Halaman 1 — Seni Visual & Pertunjukan (BUILD DULU)

Data: `data-seni-pertunjukan-dan-visual` (352: `periode_data`,`nama_event`,`lokasi_venue`,`nama_venue`)
+ `artis-top-global-chart` (100).

- **KpiRow:** `156` Karya/kegiatan (resmi 2024, headline juga di hero) · Total event terdata (352)
  · Venue unik (`new Set(nama_venue).size`) · Tahun tercakup (`byPeriod` distinct).
- **ChartGrid:**
  - *Event per tahun* — `byPeriod(rows,"periode_data")` → `BarBreakdown` (atau `LineTrend` jika ≥3 titik).
  - *Top 10 venue tersibuk* — `topN(groupCount(rows,"nama_venue"),10)` → `BarBreakdown`.
  - *Event per wilayah Jakarta* — `groupCount(map(kotaFromAddress(lokasi_venue)))` → `Donut`.
- **Matriks Artis Top-10** (Billboard & Spotify 2021–2025) — PERTAHANKAN yang sudah ada
  (rank×tahun) + kalimat konteks kriteria Kearney.
- **RawDataDisclosure** untuk `data-seni-pertunjukan-dan-visual` + blok tautan dataset pendukung.

## Halaman 2 — Wisatawan Internasional

Headline `2.767.622` (2025, jakarta.bps.go.id). Datasets:
- `...-berdasarkan-kebangsaan` (604: `periode_data` YYYYMM,`kebangsaan`,`jumlah_kunjungan`,`perbandingan_tahun_sebelumnya`)
- `...-berdasarkan-bulan` (480) & `...-berdasarkan-pintu-masuk-...` (480: `periode_data`,`bulan`,`pintu_masuk`,`jumlah`)

- **KpiRow:** `2.767.622` (2025) · Negara asal terbanyak (top `groupSum kebangsaan`) ·
  Pintu masuk utama (top `groupSum pintu_masuk`) · Δ YoY (rata-rata `perbandingan_tahun_sebelumnya`, ▲/▼).
- **ChartGrid:**
  - *Tren bulanan kunjungan* — `byPeriod(kebangsaan-rows,"periode_data","jumlah_kunjungan")` → `LineTrend`.
  - *Top 10 negara asal* — `topN(groupSum(rows,"kebangsaan","jumlah_kunjungan"),10)` → `BarBreakdown`.
  - *Share per pintu masuk* — `groupSum(pintu-rows,"pintu_masuk","jumlah")` → `Donut`.
- **RawDataDisclosure** untuk 3 dataset.

## Halaman 3 — Kuliner (Michelin)

Headline `0` Michelin (2025). Datasets:
- `data-resto-cafe-dan-cakes` (3151: `jenis_usaha`,`kelurahan`,`kecamatan`,`wilayah`)
- `jumlah-restoran-per-kelurahan` (517: `wilayah`,`kecamatan`,`kelurahan`,`jumlah`)

- **Callout `0 Michelin`** — kartu penjelasan (Panduan Michelin belum masuk Indonesia).
- **KpiRow:** `0` Michelin · Total resto terdata (3.151) · Kelurahan tercakup · Wilayah terpadat.
- **ChartGrid:**
  - *Resto per wilayah* — `groupCount(resto,"wilayah")` → `BarBreakdown`.
  - *Top 10 kecamatan* — `topN(groupCount(resto,"kecamatan"),10)` → `BarBreakdown`.
  - *Jumlah resto per wilayah (dataset agregat)* — `groupSum(perKel,"wilayah","jumlah")` → `Donut`.
- **RawDataDisclosure** untuk 2 dataset.

## Arsitektur file

```
components/pariwisata/DashboardKit.tsx   (KpiRow, ChartCard, ChartGrid, RawDataDisclosure, PALETTE)
lib/pariwisata/parse.ts                  (kotaFromAddress, bulanLabel)
app/gci/pariwisata/seni-pertunjukan/page.tsx        (refactor: dashboard + matriks + disclosure)
app/gci/pariwisata/wisatawan-internasional/page.tsx (refactor: dashboard)
app/gci/pariwisata/kuliner-michelin/page.tsx        (refactor: dashboard)
```

Setiap page = server component, `revalidate = 86400`. Agregasi di server (rows dari `rowsFor`),
chart kit dirender; `SdiTable` (client) hanya di dalam `RawDataDisclosure`.

## Batasan & error handling

- `rowsFor` gagal / kosong → chart kit sudah punya empty-state ("Tidak ada data."); KpiRow tampil 0.
- Angka resmi headline TIDAK diturunkan dari agregasi (beda cakupan) — tetap literal di `PariwisataShell`.
- Tetap: skip Museum, jangan ubah `FrameworkView`, jangan sentuh main/Vercel.

## Verifikasi

- `tsc --noEmit` bersih; `npm run build` sukses (server components + echarts SSR aman).
- Dev server (self-host DB): ketiga `/gci/pariwisata/*` HTTP 200, grafik terisi angka nyata.
- Cek visual di browser: KPI, ≥3 chart per halaman, matriks artis, disclosure buka/tutup.

## Rollout

1. Building blocks (`DashboardKit`, `parse`).
2. Seni Pertunjukan — build, verify, review.
3. Wisatawan Internasional — pola sama.
4. Kuliner — pola sama.
5. Verifikasi akhir + (opsional) commit ke `deploy/portainer-selfhost` setelah user oke.
