# GCI — Pertunjukan & Acara Budaya Jakarta 2025 (Atlas section)

**Tanggal:** 2026-06-21
**Status:** Disetujui (Pendekatan A)

## Konteks

Indikator GCI baru: *"Jumlah pertunjukan musik internasional dan acara budaya
besar lainnya di Jakarta dalam setahun"*. Dibutuhkan daftar pertunjukan/acara
budaya besar di **DKI Jakarta, tahun 2025**: konser & festival musik
(internasional + nasional; indie bila mudah ditemukan), plus seni tari, seni
rupa, teater, film, dan acara budaya besar lainnya.

Ditambahkan sebagai **section baru di atlas web** (`/events`), mengikuti pola
halaman GCI restoran yang sudah ada.

## Pendekatan

**A — Mirror pola `GciView`.** Section baru berdiri sendiri; tidak merombak
`GciView` (hindari abstraksi prematur). Duplikasi tabel/ekspor diterima demi
perubahan yang surgical dan rendah risiko.

## Kolom data (final)

Inti (bilingual ID-EN, sesuai template Disparekraf):
`Nama Penyelenggara - Organizer | Nama Pertunjukan - Name of Performance |
Tanggal Pertunjukan - Date of Performance | Tempat Pertunjukan - Place of
Performance | Jenis Pertunjukan - Type of Performance | Jumlah Pengunjung -
Number of Visitor`

Kolom bantu (boleh dihapus sebelum submit): **No.** (paling kiri), **Sumber**
(link bukti, paling kanan). **Tidak ada kolom Skala** (info internasional/
nasional cukup tersirat di "Jenis Pertunjukan").

## Komponen & file

- `lib/events.ts` — tipe `GciEvent` + array `GCI_EVENTS` (hasil riset), plus
  helper kecil (mis. `eventSourceUrl`, stats). Pola identik `lib/gci.ts`.
  - `GciEvent = { id, organizer, name, date, venue, type, visitors?, visitorsNote?, needsVerify?, source? }`
  - `date` disimpan sebagai string yang dapat dibaca (mis. "2025-08-15" atau
    "Agustus 2025" jika hanya bulan yang diketahui).
- `components/EventsView.tsx` — meniru `GciView`: hero (indikator + jumlah
  total), filter strip (filter **Jenis Pertunjukan** + kotak cari; opsional
  filter bulan), tabel 8 kolom, tombol Ekspor Excel (CSV/XLSX via `lib/export.ts`),
  pagination "muat lagi".
- `app/events/page.tsx` — route, render `<EventsView/>`.
- `components/atlas/AtlasNav.tsx` — tambah `"events"` ke tipe `Section` + link nav.
- `lib/i18n.ts` — key label baru (mis. `nav.section_events`).
- `data-pertunjukan-GCI-jakarta-2025.tsv` — deliverable (urutan kolom seperti di
  atas; `Area`-style helper di kanan).
- `CARA-PAKAI-data-pertunjukan.md` — catatan cara pakai + caveat.

## Data sourcing & kejujuran data

- Dikompilasi via riset web (berita, Loket/Tiket.com, Wikipedia, situs
  penyelenggara). **Best-effort, bukan final** — perlu spot-check tim.
- **Jumlah Pengunjung** sering tidak dipublikasikan: diisi hanya bila ada
  sumber; bila perkiraan (mis. kapasitas venue) ditandai `needsVerify`; bila
  tak ada, dikosongkan. Tidak pernah dikarang.
- Hanya venue di **DKI Jakarta**; event di luar DKI (Bodetabek) dikecualikan.
- Setiap baris idealnya punya `source` (link) untuk verifikasi.

## Success criteria

1. `bunx tsc --noEmit` bersih & `bunx next build` sukses (route `/events` ada).
2. Halaman `/events` menampilkan tabel event dengan filter Jenis + cari berfungsi.
3. Ekspor Excel menghasilkan 6 kolom inti (+ No./Sumber) sesuai template.
4. `data-pertunjukan-GCI-jakarta-2025.tsv` terisi dataset hasil riset, semua
   venue di DKI, dengan caveat terdokumentasi.
5. Nav menampilkan section baru dan berpindah halaman dengan benar.

## Non-goals

- Tidak merombak GciView / komponen tabel jadi generik (YAGNI).
- Tidak ada kolom Skala.
- Tidak menjamin kelengkapan 100% daftar event (best-effort + verifikasi tim).
