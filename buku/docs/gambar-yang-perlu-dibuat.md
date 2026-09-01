# Gambar yang Perlu Dibuat

Daftar visual yang belum ada di naskah, disusun setelah menghitung sebaran 32
visual yang sudah jadi. Ditujukan untuk dikerjakan di repo naskah
(`bab/assets/scripts/`), memakai `theme.py` yang sudah ada supaya gayanya
seragam dengan visual yang sekarang.

## Di mana kekosongannya

| Bab | Visual | Catatan |
|---|---|---|
| **1. Konseptualisasi GCI** | **0** | 4 sub-bab, ±14 halaman, tanpa satu pun visual |
| **2. Arsitektur & Sumber Data** | **0** | 4 sub-bab, ±16 halaman, tanpa satu pun visual |
| 3. Pengolahan Data | 4 | memadai |
| 4. Atraksi & Aksesibilitas | 5 | memadai |
| Interlude 4.5 | 3 | 4.5.3 (Jakarta) tanpa visual |
| 5. Indikator Proksi | 5 | memadai |
| **6. Perilaku & Sentimen** | 2 | 6.1 dan 6.2 tanpa visual, padahal keduanya paling teknis |
| 7. Ekonometrika | 5 | memadai |
| 8. Visualisasi & Kebijakan | 4 | memadai |
| 9. SDI & Crawling | 4 | 9.3 tanpa visual |

Dua bab pembuka adalah masalah terbesar: pembaca melewati 30 halaman pertama —
justru bagian yang paling menentukan apakah ia lanjut membaca — tanpa satu pun
gambar.

## Aturan main

Mengikuti pemisahan yang terbukti: **diagram berlabel dibuat dengan kode**,
bukan model gambar. Model gambar tidak bisa dipercaya menulis label, apalagi
dalam bahasa Indonesia; hasilnya huruf palsu yang mirip kata tetapi bukan, dan
itu tidak bisa dipakai di dokumen resmi.

- **Kode** (matplotlib / graphviz, ikut `theme.py`) — semua diagram, bagan alir,
  tabel, dan chart. Semua usulan di bawah masuk kategori ini kecuali yang
  ditandai *ilustrasi*.
- **Model gambar** — hanya untuk ilustrasi tanpa teks sama sekali (bagian
  terakhir dokumen ini).

Penomoran mengikuti pola naskah, jadi berkasnya otomatis terpasang oleh importer
edisi web: `grafik-1.1-*.png`, `tabel-2.1-*.png`, dan seterusnya.

## Prioritas 1 — Bab 1 dan 2 (data sudah ada di naskah)

Keempat visual ini tidak butuh data baru: semuanya menggambarkan ulang apa yang
sudah dinyatakan di teks.

| ID | Letak | Jenis | Isi | Sumber |
|---|---|---|---|---|
| GRAFIK 1.1 | 1.1 | Matriks dimensi | Tiga indeks berdampingan: Kearney (5 dimensi), GPCI (6), Resonance (3). Dimensi yang memuat pariwisata ditandai warna aksen | Teks 1.1 |
| GRAFIK 1.2 | 1.2 | Diagram alir | Empat jenis data pariwisata (kunjungan, atraksi/budaya, akomodasi & kuliner, ulasan daring) → dimensi indeks yang memakainya | Teks 1.2 |
| TABEL 1.1 | 1.3 | Tabel | Definisi "wisatawan" menurut IRTS 2008, BPS, dan praktik tingkat kota; kolom: cakupan, yang dihitung, yang luput | Teks 1.3 |
| GRAFIK 1.3 | 1.4 | Diagram alir | Rantai Satu Data Indonesia: produsen data → walidata → pengguna, dengan titik putus yang dibahas di 1.4 ditandai | Teks 1.4 |
| GRAFIK 2.1 | 2.1 | Bagan | Tiga lembaga inti (BPS, Kemenpar, Disparekraf) — apa yang diterbitkan, frekuensi, dan tingkat granularitasnya | Teks 2.1 |
| TABEL 2.1 | 2.2 | Tabel | Sumber tradisional vs *big data*: cakupan, granularitas spasial/temporal, jeda rilis, bias utama | Teks 2.1–2.2 |
| GRAFIK 2.2 | 2.3 | Arsitektur | Lapisan *data lake* pariwisata daerah: mentah → terkurasi → mart, dengan posisi walidata | Teks 2.3 |
| GRAFIK 2.3 | 2.4 | Diagram alir | Mengapa angka antar-instansi berbeda, dan di titik mana direkonsiliasi | Teks 2.4 |

## Prioritas 2 — Bab 6 (sebagian butuh data)

| ID | Letak | Jenis | Isi | Status data |
|---|---|---|---|---|
| GRAFIK 6.1 | 6.1 | Diagram alir | Pipeline *text mining*: ulasan mentah → pembersihan → tokenisasi → *stopword* → *stemming* → skor sentimen | Ada — *walkthrough* TripAdvisor Bali di 6.1 |
| GRAFIK 6.2 | 6.1 | Batang | Distribusi sentimen dan sepuluh aspek yang paling sering muncul dari *walkthrough* yang sama | **Butuh data**: hasil hitung *walkthrough* belum ditabelkan di naskah |
| GRAFIK 6.4 | 6.2 | Peta titik | Sebaran *geotag* unggahan wisatawan di satu kota, menunjukkan konsentrasi kawasan | **Butuh data**: belum ada berkas; perlu ekspor agregat dari sumber media sosial |

## Prioritas 3 — sisanya

| ID | Letak | Jenis | Isi | Status data |
|---|---|---|---|---|
| GRAFIK 4.5.4 | 4.5.3 | Komposisi | Maksud kunjungan ke Jakarta (rekreasi / bisnis / MICE / keluarga) | **Butuh data**: berkas `jakarta-komposisi-kunjungan` sempat ada lalu dihapus |
| GRAFIK 9.3 | 9.3 | Diagram alir | Alur data *crowdsourcing*: kontribusi warga → moderasi → validasi walidata → publikasi | Ada — teks 9.3 |

## Ilustrasi tanpa teks (satu-satunya yang cocok dibuat model gambar)

Empat ilustrasi banner untuk halaman pembatas Bagian I–IV. Halaman itu sekarang
hanya berisi judul, dan ia muncul empat kali di sepanjang buku.

Kerangka prompt yang menahan model dari menulis huruf palsu:

```
Flat vector illustration, clean white background, no text, no letters, no numbers.
<objek dan komposisi, spesifik dan terhitung>
All panels and screens are EMPTY rectangles with no writing inside.
Uniform figure scale and identical line weight across all elements.
Strict palette: deep navy #1F3864, medium blue #2E5C9A, pale blue-grey #EDF1F8,
accent orange #D2601A, white background.
Minimal geometric flat design, corporate infographic style.
Wide banner composition, 2400x900 pixels.
```

Objek per bagian:

| Bagian | Objek |
|---|---|
| I · Fondasi | Siluet kota dengan menara pemeringkatan berundak; tanpa angka |
| II · Metodologi | Aliran titik data dari bandara, pelabuhan, dan menara seluler menuju satu wadah |
| III · Indikator | Timbangan dan slider bobot; kotak indikator kosong tanpa tulisan |
| IV · Aplikasi | Ruang kendali dengan panel kosong dan peta kota tanpa label |

Setiap gambar dinormalisasi sebelum dipasang: ratakan latar ke putih murni,
buang margin kosong (`getbbox`), lalu beri padding seragam. Tanpa langkah ini
ilustrasi tampak mengecil sendiri di tengah halaman.

## Setelah gambar jadi

```bash
cd buku
npm run import:book    # menyalin figure baru + memetakan nomornya
npm run build
npm run pdf:build
npm run pdf:preview    # lihat halamannya
```

Importer mencocokkan nomor placeholder ke nama berkas, jadi penamaan berkas
harus tepat: `grafik-1.1-<slug>.png`. Placeholder `[INSERT GRAFIK 1.1: …]` juga
perlu ditambahkan di naskah pada posisi yang diinginkan — tanpa itu, gambar
tidak punya tempat.
