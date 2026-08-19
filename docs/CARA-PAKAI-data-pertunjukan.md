# Data Pertunjukan & Acara Budaya GCI Jakarta 2025 — Cara Pakai

Dibuat untuk: Inventarisasi & Monitoring Data Capaian Kota Jakarta (Global City Index / GCI)
Indikator: *"Jumlah pertunjukan musik internasional dan acara budaya besar lainnya di Jakarta dalam setahun"*
Cakupan: **DKI Jakarta · Tahun 2025**

## File
- **`data-pertunjukan-GCI-jakarta-2025.tsv`** — 95 event, 9 kolom:
  `No. | Nama Penyelenggara | Nama Pertunjukan | Tanggal Pertunjukan | Tempat Pertunjukan | Jenis Pertunjukan | Jumlah Pengunjung | Keterangan | Sumber`
  - Header inti **bilingual ID-EN** sesuai template. `No.`, `Keterangan` & `Sumber` = kolom bantu (boleh dihapus sebelum submit).
  - **Format seragam:** `Tanggal` = satu hari (`YYYY-MM-DD`) atau rentang (`A s/d B`);
    `Jumlah Pengunjung` = angka saja; konteks (kapasitas/perkiraan/target/total/2 hari)
    pindah ke **`Keterangan`**.
  - Di-generate dari `lib/events.ts` (`bun scripts/export-events-tsv.ts`).

## Cara memasukkan ke Google Sheet (paling cepat)
1. Buka file `.tsv` (Notepad / VS Code), pilih semua (Ctrl+A), copy (Ctrl+C).
2. Di Google Sheet, klik sel **A1**, lalu **Ctrl+V** (paste). Karena dipisah Tab,
   tiap kolom otomatis masuk ke kolomnya sendiri.

Atau dari web atlas (section **Pertunjukan**) klik **Ekspor Excel** untuk file
`.xlsx`/`.csv` siap pakai (mengikuti filter yang aktif).

## Cakupan (apa saja yang masuk)
- **Konser musik internasional** (artis/band internasional, K-pop/J-pop) — 44.
- **Festival musik** nasional & internasional (Java Jazz, Pestapora, Synchronize,
  Joyland, dll) — 8.
- **Acara budaya besar lainnya** — 43: seni tari, teater/drama musikal,
  orkestra/musik klasik, opera, seni tradisional, seni rupa/art fair, festival
  film, fashion week, dan festival budaya.

## Catatan penting (mohon dibaca sebelum submit)
1. **Daftar ini DASAR yang kuat, BUKAN final.** Dikompilasi dari sumber publik
   (berita, platform tiket, situs penyelenggara, Wikipedia) — silakan tambah /
   koreksi sesuai temuan tim. Tiap baris punya link **Sumber** untuk verifikasi.
2. **Jumlah Pengunjung sebagian besar kosong.** Banyak event tidak
   mempublikasikan angka penonton. Yang ada angkanya: bila bertanda *kapasitas /
   perkiraan / target / tiket terjual* berarti **belum terverifikasi** —
   idealnya dikonfirmasi ke penyelenggara. Angka tidak pernah dikarang.
3. **Hanya DKI Jakarta.** Event di luar DKI sengaja dikeluarkan, mis.: konser di
   ICE BSD / NICE PIK2 (Kab. Tangerang), SICC Sentul (Bogor); DWP 2025 (pindah
   ke Bali); Head in the Clouds Jakarta 2025 (PIK2, Tangerang); ARTJOG & JAFF
   (Yogyakarta). Bila kebijakan indikator ingin memasukkan Jabodetabek, beri tahu
   — datanya bisa ditambah.
4. **Hanya tahun 2025** (Januari–Desember 2025).

## Sumber
Berita (Kompas, Detik, Tempo, CNN Indonesia, Jakarta Post), platform tiket
(Loket, Tiket.com, Artatix), situs resmi penyelenggara & venue (Ciputra
Artpreneur, Aula Simfonia, TIM, JIExpo), dan Wikipedia. Link lengkap ada di
kolom **Sumber** tiap baris.
