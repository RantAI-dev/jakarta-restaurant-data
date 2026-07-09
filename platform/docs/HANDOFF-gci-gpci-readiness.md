# Handoff — Modul Readiness GCI / GPCI (Pariwisata)

> Untuk engineer yang melanjutkan. Modul ini **sudah di-scaffold & jalan**.
> Tugasmu = validasi indikator (bareng Mas Maulana), tajamkan Partial, dan
> (opsional) tambah scoring. Bukan bangun dari nol.

## Konteks singkat

Platform `dispar-data-platform` = dashboard data Dinas Pariwisata & Ekraf DKI.
Data primer dari Satu Data Jakarta (SDI) sudah masuk Postgres (lihat plan
Plan 1–3 di `docs/superpowers/plans/`). Modul ini menilai **kesiapan data**
terhadap indikator pariwisata **Kearney GCI** & **Mori GPCI** — bukan menghitung
skor global (itu butuh data pembanding kota lain + metodologi pemilik indeks).

## Yang SUDAH ada (scaffold, sudah jalan)

| File | Isi |
|---|---|
| `data/gci-gpci-indicators.json` | **Sumber kebenaran** — 28 indikator pariwisata (19 data-ada, 9 gaada) + kata kunci pemetaan ke dataset + kolom ukuran |
| `lib/gci/indicators.ts` | Tipe + loader JSON |
| `lib/gci/readiness.ts` | Engine: cocokkan indikator→dataset, hitung status, tarik nilai terbaru dari DB |
| `app/readiness/page.tsx` | Halaman `/readiness` — matriks (Data Ada / Data Gaada) + status + dataset + nilai terbaru |
| nav di `app/page.tsx`, `app/dashboard/page.tsx` | tautan "Readiness GCI/GPCI" |
| `docs/gci-gpci-pariwisata-*.tsv` | Sheet sumber (all / data-ada / data-gaada) — importable ke Google Sheets |
| `docs/indikator-gci-gpci-draft.md` | Draft indikator + batasan untuk validasi |

**Status verifikasi terakhir:** `npx tsc --noEmit` bersih; `/readiness` HTTP 200;
"Data ada: 19 · gaada: 9" benar; engine menarik nilai terbaru dari DB.

## Cara jalanin

```bash
# Postgres lokal (kalau belum nyala):
docker start dispar-pg   # atau lihat plan Plan 1
# .env berisi DATABASE_URL=postgres://postgres:dispar@localhost:5433/dispar
npm install
npm run dev                # http://localhost:3031/readiness
```
> ⚠️ JANGAN `npm run build` sambil `next dev` jalan (share `.next` → korupsi chunk). Stop dev dulu kalau mau build.

## Konsep engine (penting sebelum ngedit)

- Indikator dicocokkan ke tabel `dataset` lewat `match` (kata kunci judul, lowercase).
- `status` efektif dihitung dari DB: `gap` (tak ada match) / `partial` (match tapi belum sync) / `ready` (match + ada baris) — **tapi tidak melebihi `draftReadiness`** (indikator proksi tetap `partial` walau datanya ada).
- `latest` = nilai periode terbaru dari kolom ukuran (`measure` regex, atau whitelist default).
- Semua **data-driven**: ubah perilaku dengan mengedit `data/gci-gpci-indicators.json`, bukan kode.

---

## TUGAS (urut prioritas)

### Task 1 — Verifikasi scaffold (5 menit)
- [ ] `npx tsc --noEmit -p tsconfig.json` → tanpa output.
- [ ] `npm run dev`, buka `/readiness` → tampil matriks, "Data ada: 19 · gaada: 9".
- [ ] Cek beberapa baris data-ada punya "Nilai terbaru".

### Task 2 — Validasi indikator bareng Mas Maulana (BLOCKER kualitas)
Kirim `docs/gci-gpci-pariwisata-sheet.tsv` + `docs/indikator-gci-gpci-draft.md`.
Minta konfirmasi: definisi & satuan resmi, pemetaan dataset benar/tidak, indikator
kurang, periode acuan. Lalu:
- [ ] Update `data/gci-gpci-indicators.json` sesuai hasil validasi
      (`name`/`definition`/`match`/`measure`/`draftReadiness`/`note`).
- [ ] Tambah indikator yang kurang (ikuti bentuk objek yang sama).
- [ ] Reload `/readiness` → status ikut berubah otomatis (tanpa ubah kode).

### Task 3 — Tajamkan indikator Partial (data ada tapi proksi)
Contoh aksi (lihat kolom `note`/Catatan di sheet):
- [ ] **Hotel mewah** (`CI-LH`): segmentasi hotel bintang 4–5 dari dataset hotel berbintang → tambah `match`/`measure` lebih spesifik.
- [ ] **MICE** (`BA-MICE`/`CI-IC`): pisahkan jumlah *konferensi internasional aktual* dari jumlah *usaha* MICE.
- [ ] **Museum/Teater/World Heritage**: koordinasi Dinas Kebudayaan untuk inventori resmi; sementara proksi via Obyek Wisata.

### Task 4 — Data gaada (9 indikator lintas-OPD)
`docs/gci-gpci-pariwisata-DATA-GAADA.tsv` = daftar permintaan data ke OPD lain
(Dispora, Biro Kerja Sama, Disdukcapil, Dishub/AP II, Imigrasi).
- [ ] Sepakati dengan pimpinan: tarik datanya, atau tandai out-of-scope.
- [ ] Bila datanya masuk (mis. jadi dataset baru), tambahkan `match` di indikatornya → otomatis jadi "ready".

### Task 5 — (Opsional) Scoring berbobot
Kalau diminta skor gabungan:
- [ ] Tambah field `weight` per indikator di JSON.
- [ ] Di `lib/gci/readiness.ts`, hitung skor ternormalisasi per dimensi/framework.
- [ ] Catatan: skor GCI/GPCI *resmi* butuh normalisasi vs kota lain — diskusikan lingkupnya dulu (jangan over-claim "ranking").

### Task 6 — Commit
Commit kecil per perubahan. Contoh:
```bash
git add data/gci-gpci-indicators.json && git commit -m "chore(gci): update indicators per Mas Maulana validation"
```

## Definition of Done (handoff dianggap tuntas)
- Indikator di JSON sudah divalidasi (bukan draft lagi).
- `/readiness` menampilkan status + nilai terbaru yang benar.
- Daftar data-gaada sudah dikoordinasikan (ditarik / ditandai out-of-scope).
- `npx tsc` bersih; `npm run build` sukses.

## Referensi
- Sheet: `docs/gci-gpci-pariwisata-sheet.tsv` (+ DATA-ADA / DATA-GAADA)
- Draft & batasan: `docs/indikator-gci-gpci-draft.md`
- Plan platform (DB/ingestion/dashboard): `docs/superpowers/plans/2026-07-09-plan{1,2,3}-*.md`
- Framework: Kearney Global Cities Index · Mori Global Power City Index
