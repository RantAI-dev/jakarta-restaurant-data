# START HERE — Briefing Engineer (Platform Data Dispar)

Baca ini dulu sebelum ngoding. Semua ada di subfolder `platform/` dalam repo
`jakarta-restaurant-data`.

## Apa ini
Dashboard data Dinas Pariwisata & Ekraf DKI. Data primer dari Satu Data Jakarta
(SDI, sudah masuk Postgres), data sekunder dari pendataan Jakarta Atlas. Tujuan
akhir: 4 menu — **Katalog · GCI · GPCI · Atlas** — dengan dashboard bespoke per
indikator GCI/GPCI. Ini **readiness data** (kesiapan Jakarta mengisi indikator
GCI/GPCI), bukan menghitung ranking global.

## Cara jalanin (lokal)
```bash
docker start dispar-pg          # Postgres 16 di localhost:5433 (db=dispar, pass=dispar)
cd platform && npm install
# .env berisi: DATABASE_URL=postgres://postgres:dispar@localhost:5433/dispar
npm run dev                     # http://localhost:3031
```
⚠️ **JANGAN `npm run build` sambil `next dev` jalan** (share `.next` → korup chunk). Stop dev dulu.
⚠️ Script pakai `bun` + `process.exit(0)` di akhir (postgres.js pool nahan exit).

## Sudah jadi (jangan bangun ulang)
| Area | Status |
|---|---|
| DB Postgres (dataset/record/dataset_sync/dataset_column) | ✅ terisi (172/182 dataset tersync) |
| `/sdi` katalog + `/sdi/[slug]` tabel detail (dari DB, fallback live) | ✅ |
| `/dashboard` ringkasan · `/readiness` matriks GCI/GPCI | ✅ |
| Engine readiness `lib/gci/*` + `data/gci-gpci-indicators.json` (28 indikator) | ✅ |
| `/gci` `/gpci` framework dashboard (cards + tabel readiness) | ✅ |
| Nav 4-menu (`components/Nav.tsx`) | ✅ scaffold (belum global — Plan 6 Task 1) |
| Atlas `/atlas` | ✅ kerangka; detail TODO (Plan 6 Task 5) |
| Bespoke indikator: infra + primitif + **2 contoh jalan** (CE2, CI-HR) | ✅ scaffold (Plan 7) |

## Antrean kerjaan (urut)
1. **Plan 6** (`docs/superpowers/plans/2026-07-09-plan6-*.md`) — jadikan Nav global (buang header dobel), beranda landing 4-menu, bangun Atlas.
2. **Plan 7** (`...plan7-*.md`) — **inti**: 17 dashboard indikator bespoke sisanya. Pola per archetype sudah ada (CE2 = breakdown wilayah, CI-HR = registry count). Tinggal replikasi + wire Leaflet untuk archetype peta.
3. **Robustness** — retry sync 10 dataset yang masih gagal (SDI sempat maintenance); `bun run scripts/db-sync-dataset.ts all` (idempoten).
4. **Validasi indikator** — kirim `docs/gci-gpci-pariwisata-sheet.tsv` + `docs/indikator-gci-gpci-draft.md` ke Mas Maulana; update `data/gci-gpci-indicators.json` sesuai hasil.

## Cara nambah 1 dashboard indikator (Plan 7)
1. Buat `components/indicators/<Code>.tsx` (server component async) — ambil data `primaryData("CODE")`, agregasi via `lib/agg`, render primitif dari `components/charts/*`, bungkus `IndicatorShell`.
2. Daftarkan di `components/indicators/registry.tsx`.
3. Buka `/gci/CODE` atau `/gpci/CODE` → langsung nongol. (Contoh acuan: `Ce2.tsx`, `CiHr.tsx`.)

## Gotcha penting
- **Agregasi beda per indikator**: registry/event = `groupCount` (tiap baris 1 record), wilayah = `groupSum`, occupancy = parse koma desimal (`idNum`).
- **Lat/long dataset obyek wisata TERBALIK** — tukar saat dipetakan.
- **Config data-driven**: ubah indikator/pemetaan = edit `data/gci-gpci-indicators.json`, bukan kode engine.

## Sumber kebenaran
- Indikator: `data/gci-gpci-indicators.json` · Sheet: `docs/gci-gpci-pariwisata-*.tsv`
- Semua plan: `docs/superpowers/plans/` (Plan 1–7) · Handoff readiness: `docs/HANDOFF-gci-gpci-readiness.md`
- Framework: Kearney Global Cities Index · Mori Global Power City Index
