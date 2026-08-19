# Plan — Platform Dashboard Dispar di Vercel (POC live → Prod)

> Basis: `arsitektur.md` (target prod) · `arsitektur-poc.md` (POC) · `plan-poc.md` (rencana awal) · MoM 2 Juli 2026.
> Roadmap penuh: dari kondisi yang **sudah live sekarang** menuju arsitektur prod — **semua di Vercel**.
> Status: rencana. Dikerjakan bertahap; tiap fase punya "Definition of Done".

---

## 1. Kondisi sekarang (sudah live)

App `jakarta-restaurant-data` live di Vercel — `https://jakarta-restaurant-data.vercel.app`.

**Sudah ada:**
- `/sdi` — katalog **182 dataset primer SDI** (org8) + **4 dataset sekunder** (Jakarta Atlas GCI). Badge Primer/Sekunder, kolom sumber, filter tier + search.
- `/sdi/[slug]` — **isi tabel per dataset**, live dari SDI (`/detail` + `/get-table-data`).
- `/api/sdi` (snapshot + `?live=1`) · `/api/sdi/[slug]` (detail+rows). Fetch SDI **terbukti jalan dari IP Vercel**.
- Data sekunder Atlas: `/gci`, `/events`, `/restaurants`, `/golf` (file-based di `lib/*.ts`).
- Styling disparekraf (navy/gold) + logo Jakarta.

**Belum ada (gap ke prod):**
- ❌ Database — semua masih **live-fetch** (SDI) atau **file** (Atlas). Tidak ada persistensi.
- ❌ Pipeline clean/normalize/dedup/validate terstruktur.
- ❌ KPI engine / indicator mapper GCI-GPCI + readiness view.
- ❌ Visualisasi lanjutan (KPI cards, chart) — baru tabel.
- ❌ Ingestion terjadwal (cron), caching, sync SDI→DB, admin/auth.

## 2. Prinsip & keputusan teknis

| Area | Keputusan | Catatan |
|---|---|---|
| Platform | **Vercel semua** (Next.js, Fluid Compute/Node) | POC = mirror prod, semua di Vercel |
| DB | **Neon Postgres** (Vercel Marketplace, free tier) | Data kecil; free cukup |
| DB access | **Drizzle ORM + `@neondatabase/serverless`** | Cocok serverless; migrasi terkontrol |
| Cache | **Vercel Runtime Cache / ISR** + `revalidate` | Native, no infra |
| Scheduler | **Vercel Cron Jobs** | Sync berkala (prod); POC manual |
| Berat/lama | Pecah **per-target**, di bawah timeout 300s | Crawl berat → offline saat butuh |
| Auth admin | **Clerk** (Marketplace) atau shared-secret sederhana | Cukup lindungi endpoint refresh |
| Storage file | **Vercel Blob** (kalau perlu simpan export) | Opsional |

## 3. Peta subsystem (workstream)

Empat workstream paralel. Dependensi: **A (DB) fondasi** untuk B, C, D.

```
A. Data & Persistence (Neon)  ──┬─→  B. Ingestion & Operasi
                                ├─→  C. KPI / GCI-GPCI engine
                                └─→  D. Dashboard visualisasi
```

---

## 4. Workstream A — Data & Persistence (Neon)

**Tujuan:** pindah dari live-fetch/file → DB, sesuai lapis `raw · cleaned · KPI · metadata`.

### Skema (sketsa Drizzle / SQL)
```
source                -- registry sumber data
  id, kind('sdi'|'atlas'|'crawl'), name, org_uid, base_url, notes

dataset               -- katalog (gabungan primer + sekunder)
  id, source_id, tier('primer'|'sekunder'), slug, title, description,
  tags(text[]), external_url, updated_at, last_synced_at

dataset_column        -- definisi kolom (dari komponen_data_table SDI)
  id, dataset_id, key, label, type, description, ordinal

raw_record            -- hasil ingestion apa adanya (audit / re-process)
  id, dataset_id, payload(jsonb), fetched_at, batch_id

record                -- data bersih (cleaned), 1 baris tabel dataset
  id, dataset_id, data(jsonb), period, valid, created_at

kpi_value             -- hasil KPI engine (workstream C)
  id, indicator_id, dataset_id, period, value(numeric), unit, readiness

sync_log              -- metadata ingestion (workstream B)
  id, dataset_id, status, rows, started_at, finished_at, error
```

### Langkah
1. Provision Neon dari **Vercel Marketplace** → env `DATABASE_URL` auto-inject.
2. `lib/db/` — client (`@neondatabase/serverless`) + schema Drizzle + migrations.
3. Seed dari yang sudah ada: `lib/sdi-data.json` → `dataset` (primer); `lib/secondary.ts` → `dataset` (sekunder).
4. Ganti sumber `/api/sdi` & `/api/sdi/[slug]` dari live-fetch → **baca DB**, live-fetch jadi *fallback*.

### Definition of Done
- `/sdi` & `/sdi/[slug]` baca dari Neon; SDI live tinggal jadi sumber sync, bukan tiap request.
- Migrasi reproducible (`drizzle-kit`), env terpasang di Vercel.

---

## 5. Workstream B — Ingestion & Operasi

**Tujuan:** data masuk DB terjadwal & aman, tanpa proses berat di request path.

### Komponen
- **API Client SDI** (sudah ada di `lib/sdi.ts`) → tulis ke `raw_record` + upsert `dataset`/`record`.
- **Pipeline** `lib/pipeline/` — clean · normalize · dedup · validate → `record`. Reuse pola dedupe GCI existing.
- **Sync endpoint** `POST /api/admin/sync` — sync 1 dataset atau semua (per-target, chunked).
- **Cron** — `vercel.json`/`vercel.ts` Cron Jobs (mis. harian) manggil sync ringan.
- **Cache** — `revalidate` + tag (`revalidateTag`) di route baca; invalidasi saat sync selesai.
- **Auth** — lindungi `/api/admin/*` (Clerk atau header `x-sync-secret`).

### Batas Vercel (wajib dipatuhi)
- 1 function ≤ **300s** → sync **per-dataset**, jangan 182 sekaligus dalam 1 call.
- Crawl berat (per-hotel GCI) **tetap offline/worker**, bukan Vercel function; hasil di-commit/push atau tulis via endpoint.

### Definition of Done
- Cron sync jalan, `sync_log` kecatat, cache ke-invalidate, endpoint admin ter-auth.

---

## 6. Workstream C — KPI / GCI-GPCI Engine

**Tujuan:** map dataset → indikator GCI/GPCI + hitung readiness. **Goal-driven** (Jalur B MoM).

> ⚠️ **Blocker:** butuh **definisi indikator** GCI/GPCI (dari Mas Maulana / referensi standar). Struktur dibuat **data-driven** biar bisa jalan duluan pakai draft.

### Model
```
indicator             -- katalog indikator
  id, framework('GCI'|'GPCI'), code, name, description, unit, target

indicator_mapping     -- indikator ← dataset/kolom mana
  id, indicator_id, dataset_id, column_key, transform, weight
```
- **Mapper** `lib/kpi/` — baca `record` sesuai `indicator_mapping`, hitung `kpi_value`.
- **Readiness** — per indikator: `ready` / `partial` / `missing` (ada data primer? sekunder nutup gap?).

### Langkah
1. Definisikan katalog indikator (draft dulu — GCI/GPCI publik).
2. Isi `indicator_mapping` (dataset SDI + Atlas mana → indikator mana).
3. Engine hitung `kpi_value` saat sync / on-demand.

### Definition of Done
- Tabel readiness GCI/GPCI terisi dari data riil; gap indikator kelihatan eksplisit.

---

## 7. Workstream D — Dashboard Visualisasi

**Tujuan:** naik dari tabel → KPI cards + chart + readiness view (MoM Action 3 lanjutan).

### Halaman
- `/sdi` (katalog) — **tetap**, jadi entry.
- `/sdi/[slug]` — tabel + **chart per dataset** (deteksi kolom numerik/periode → line/bar).
- `/dashboard` **(baru)** — ringkasan eksekutif:
  - **KPI cards** (indikator kunci GCI/GPCI dari `kpi_value`).
  - **Readiness matrix** GCI/GPCI (ready/partial/missing).
  - Tren periode, top dataset, cakupan.

### Teknis
- Chart: **Recharts** atau **visx** (SSR-friendly). Hindari lib berat.
- Server Components ambil dari DB; chart interaktif = client island.
- Styling konsisten disparekraf (navy/gold) + logo Jakarta.

### Definition of Done
- `/dashboard` nampilin KPI cards + readiness dari `kpi_value`; chart di detail dataset.

---

## 8. Roadmap bertahap

| Fase | Isi | Workstream | Ketergantungan |
|---|---|---|---|
| **0** | ✅ *(live)* Katalog SDI + tabel detail + data sekunder | — | selesai |
| **1** | Provision Neon + skema + seed + baca DB | A | — |
| **2** | Sync SDI→DB + pipeline + cache + admin auth | B | Fase 1 |
| **3** | Cron scheduled sync + `sync_log` + invalidasi cache | B | Fase 2 |
| **4** | Katalog indikator + mapping (draft) + engine `kpi_value` | C | Fase 1; *butuh definisi indikator* |
| **5** | `/dashboard`: KPI cards + readiness matrix | D | Fase 4 |
| **6** | Chart per dataset + polish + tren | D | Fase 1 |
| **7** | Hardening: rate-limit, error states, observability | B | semua |

> Bisa paralel: **Fase 1→2→3** (data/ops) jalan bareng **Fase 6** (chart, gak butuh KPI). **Fase 4→5** nunggu definisi indikator.

## 9. Dependensi & blocker

- 🔴 **Definisi indikator GCI/GPCI** — nge-block Fase 4–5. Mulai draft dari standar publik.
- 🟠 **Bentuk data SDI beragam** — schema `record` pakai `jsonb` biar fleksibel lintas dataset.
- 🟠 **Crawl berat GCI** — tetap offline; jangan dipaksa jadi Vercel function.
- 🟢 **Akses SDI** — sudah terbukti (endpoint terdokumentasi, jalan dari Vercel).

## 10. Checklist infra / env (Vercel)

- [ ] Neon dari Marketplace → `DATABASE_URL` (Production + Preview).
- [ ] `drizzle-kit` migrate di build/CI.
- [ ] Cron Jobs di `vercel.json` / `vercel.ts`.
- [ ] Secret `SYNC_SECRET` (atau Clerk) untuk `/api/admin/*`.
- [ ] (Opsional) Vercel Blob kalau simpan export file.

## 11. Risiko

- **Timeout** kalau sync gak per-target → wajib chunk per-dataset.
- **Neon free tier** cukup selama data kecil; pantau storage/compute.
- **Fase 4 ter-block** definisi indikator — jangan jadi jalur kritis; kerjakan A/B/D dulu.
- **Konsistensi cache** — pastikan invalidasi tag saat sync, biar dashboard gak basi.

## 12. Referensi

- Target arsitektur: `arsitektur.md` · POC: `arsitektur-poc.md` · Rencana POC: `plan-poc.md`
- Endpoint SDI: lihat memory `sdi-jakarta-api` · implementasi `lib/sdi.ts`, `app/api/sdi/*`
- Data sekunder: `lib/secondary.ts`, `lib/{gci,events,restaurants,golf}.ts`
- Styling ref: disparekraf.jakarta.go.id
