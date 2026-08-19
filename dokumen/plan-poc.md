# Plan — POC Dashboard Visualisasi Data Dispar (Vercel)

> Basis: MoM Dashboard Dispar (Kamis, 2 Juli 2026) + `arsitektur-poc.md`.
> Status: rencana POC. Prod = `arsitektur.md` (target, dikerjakan setelah POC).

## 1. Tujuan

Bikin **POC dashboard visualisasi data Dispar** yang jalan **penuh di Vercel**, mirror struktur arsitektur prod tapi disederhanakan:

- Data primer: **Satu Data Indonesia (SDI)** + data yang udah diolah Dispar.
- Data sekunder: **dataset GCI/restoran** (jakarta-restaurant-data) yang udah ada.
- Styling ikut **disparekraf.jakarta.go.id** (MoM Action 3).

Yang **disederhanakan** vs prod:
- Cron → **refresh on-demand** (tombol manual).
- Crawl berat → **per-target** (anti-timeout serverless).
- DB → **Neon Postgres free tier** (data kecil, cukup).

## 2. Strategi / Pendekatan

Dua jalur, sesuai alur MoM (mulai dari data yang mereka punya):

### Jalur A — Data primer (punya mereka / SDI) → bottom-up
1. **Discovery dulu:** cari tahu data apa yang **Dispar / Tim Pak Adi sudah punya & olah**, plus bentuk/akses data SDI.
2. **Analisa:** dari data yang **ADA**, bisa dibikin visualisasi/dashboard apa aja.
3. **Ajukan proposal** ke mereka: "dari data X, kita bisa bikin Y & Z." Dashboard **gak diprescribe duluan** — muncul dari data yang tersedia.

### Jalur B — Data sekunder (kita crawl) → goal-driven menuju GCI/GPCI
1. Petakan indikator **GCI & GPCI** (+ indikator kota) → mana yang **belum ke-cover** data primer.
2. Data sekunder diarahkan buat **nutup gap** indikator itu.
3. Semua pengolahan mengerucut ke **readiness GCI/GPCI** di dashboard.

> Intinya: data primer nentuin "bisa bikin apa", data sekunder nentuin "seberapa jauh kita bisa penuhi GCI/GPCI".

## 3. Pemetaan MoM → Fase

| MoM Action Item | Ditangani di fase |
|---|---|
| 1. Satukan data SDI + data sekunder (konsolidasi & normalisasi) | Fase 2 (schema) + Fase 4 (pipeline) |
| 2. Analisa data & tentukan KPI (GCI, GPCI, dsb.) | Fase 1 (discovery) + Fase 5 (KPI/gap GCI-GPCI) |
| 3. Mockup website (styling web Dispar) | Fase 6 (dashboard) |
| 3a. Visualisasi table-based (fokus awal) | Fase 6 |
| 3b. Sambungkan API ke SDI | Fase 3 (ingestion) |

## 4. Keputusan Teknis

| Area | Pilihan | Alasan |
|---|---|---|
| Platform | Vercel (Next.js, Node/Fluid Compute) | Sesuai arahan "urusan Vercel dulu" |
| DB | Neon Postgres (Vercel Marketplace, free tier) | Data kecil, ada gratisan, cukup |
| Cache | Vercel native (ISR / Runtime Cache) | Gak perlu infra tambahan |
| Refresh data | On-demand (tombol / admin endpoint) | GCI/restoran gak butuh refresh berkala |
| Crawl | Per-target dalam 1 request | Hindari timeout function (max 300s) |
| Data primer | SDI via REST API + spreadsheet + olahan Dispar | Sesuai MoM |
| Data sekunder | Dataset GCI/restoran existing | Reuse kerjaan yang udah ada |

## 5. Data Model (sketsa awal — Neon)

Empat lapis sesuai diagram (`raw · cleaned · KPI · metadata`):

- **raw** — hasil mentah ingestion (SDI response, sheet rows, crawl output) apa adanya, buat audit/re-process.
- **cleaned** — data ternormalisasi & dedup (entitas: tempat/restoran/indikator kota).
- **kpi** — hasil KPI engine + mapping indikator (GCI/GPCI) per entitas/periode.
- **metadata** — sumber, waktu ingest, versi, status readiness indikator.

> Skema detail (kolom, relasi) difinalkan setelah discovery (Fase 1) tahu bentuk data mereka + SDI.

## 6. Urutan Build (fase)

### Fase 0 — Setup
- Link/scaffold Next.js app di Vercel.
- Provision **Neon** dari Marketplace, inject env (`DATABASE_URL`).
- Ambil styling ref dari disparekraf.jakarta.go.id (warna, font, layout).

### Fase 1 — Discovery data + proposal (titik mulai, MoM Action 2)
- Inventarisasi data yang **Dispar / Tim Pak Adi sudah punya & olah**.
- Petakan **bentuk & akses data SDI** (endpoint API / spreadsheet + kredensial).
- Analisa: dari data yang ADA → **dashboard apa yang feasible**.
- **Output: proposal** "dari data X bisa dibikin Y" → diajukan ke mereka.
- Petakan indikator **GCI/GPCI** → mana yang belum ke-cover (jadi target Jalur B).

### Fase 2 — Skema & konsolidasi data (MoM Action 1)
- Definisikan tabel raw/cleaned/kpi/metadata di Neon (berdasar hasil discovery).
- Mapping kolom dataset GCI/restoran existing → skema cleaned.

### Fase 3 — Ingestion layer (MoM Action 3b)
- **API Client → SDI** (retry/backoff), fetch on-demand.
- **Spreadsheet parser** buat export SDI.
- **Crawler per-target** buat data sekunder (reuse logika GCI existing, dipecah per-target).
- Trigger lewat `/admin/refresh` (bukan cron).

### Fase 4 — Processing pipeline (MoM Action 1)
- Clean · normalize · dedup · validate → tulis ke `cleaned`.
- Persist `raw` buat audit.

### Fase 5 — KPI engine / gap GCI-GPCI (Jalur B, MoM Action 2)
- Indicator mapper GCI/GPCI + indikator kota.
- Data sekunder diarahkan buat nutup gap indikator dari Fase 1.
- Output ke tabel `kpi` + status readiness.

### Fase 6 — Dashboard: table-based dulu (MoM Action 3 / 3a)
- **Scope POC = tabel dulu.** Lihat data as tabel (tabel data + filter/search), styling ikut web Dispar.
- **Dashboard existing tetap stay** — gak diutak-atik.
- Bentuk dashboard lanjutan (KPI cards, readiness GCI/GPCI view, chart) → **di-discuss di plan berikutnya** setelah tabel jalan & data kelihatan.

## 7. Di luar scope POC (masuk prod nanti)

- **Cron/scheduler** aktif (refresh otomatis berkala).
- **Crawl berat** dipindah ke worker/offline (bukan Vercel function).
- Analitik / chart lanjutan.
- Auth/role admin (POC cukup endpoint sederhana).

## 8. Risiko & catatan

- **Fase 1 nge-block sisanya** — skema, KPI, & dashboard semua nunggu tahu data riil mereka. Ini dependency utama.
- **Timeout function** kalau crawl gak dipecah per-target → wajib granular.
- **Neon free tier** cukup selama data kecil; pantau kalau membengkak.
- **Akses SDI belum pasti** → endpoint/kredensial jadi blocker Fase 3.

## 9. Referensi

- Data primer (SDI): spreadsheet SDI (lihat MoM).
- Data sekunder: jakarta-restaurant-data.vercel.app
- Styling: disparekraf.jakarta.go.id
- Arsitektur POC: `arsitektur-poc.md` · Arsitektur prod: `arsitektur.md`
