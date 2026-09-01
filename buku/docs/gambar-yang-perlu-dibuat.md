# Gambar Buku: yang Sudah Dibuat dan yang Perlu Anda Buat

Naskah membawa 32 figure. Setelah dihitung sebarannya, dua bab pembuka —
Bab 1 dan Bab 2, sekitar 30 halaman pertama — tidak punya satu pun visual, dan
6.1, 6.2, 9.3, serta 4.5.3 juga kosong.

Sepuluh di antaranya sudah dibuat di repo ini. Sisanya butuh data baru atau
model gambar, dan itu bagian Anda.

## Sudah jadi — 10 diagram SVG

Dibangun oleh `scripts/build-diagrams.mjs`, memakai palet dan huruf yang sama
dengan `theme.py` di repo naskah, sehingga duduk berdampingan dengan 32 figure
matplotlib tanpa terlihat berasal dari dua dunia berbeda. Semuanya SVG: teksnya
tetap bisa diseleksi dan dicari di dalam PDF, dan tajam di semua ukuran cetak.

| ID | Letak | Isi |
|---|---|---|
| Grafik 1.1 | 1.1 | Struktur dimensi Kearney, GPCI, dan Resonance; dimensi yang memuat pariwisata ditandai |
| Grafik 1.2 | 1.2 | Empat jenis data pariwisata → dimensi indeks yang memakainya |
| Tabel 1.1 | 1.3 | Siapa menghitung kunjungan atas dasar apa, dan apa yang tidak tercakup |
| Grafik 1.3 | 1.4 | Rantai Satu Data Indonesia, tiga prasyarat Perpres 39/2019, dan titik yang masih putus |
| Grafik 2.1 | 2.1 | Tiga lembaga inti: terbitan, frekuensi, granularitas |
| Tabel 2.1 | 2.2 | Sumber tradisional vs big data pada enam aspek |
| Grafik 2.2 | 2.3 | Lapisan data lake daerah, dari zona mentah sampai data mart |
| Grafik 2.3 | 2.4 | Dua angka kunjungan Bali 2024 yang sama-sama benar, dan mekanisme yang mendamaikannya |
| Grafik 6.1 | 6.1 | Enam langkah pra-pemrosesan ulasan daring |
| Grafik 9.3 | 9.3 | Alur data crowdsourcing dari kontributor sampai publikasi |

Semua isinya diambil dari pernyataan yang sudah ada di naskah — tidak ada angka
atau klaim baru. Sumbernya dicantumkan di dalam tiap gambar.

Untuk mengubahnya: sunting `scripts/build-diagrams.mjs`, lalu

```bash
npm run diagrams:build && npm run import:book && npm run build && npm run pdf:build
```

Posisi tiap diagram ditentukan di `scripts/import-book.mjs` (konstanta
`DIAGRAM`), dicocokkan dengan judul sub-bagian di naskah. Kalau judul di naskah
berubah, impor **berhenti dengan galat** alih-alih diam-diam menghilangkan
diagram.

## Perlu Anda buat — 3 visual yang menunggu data

Tidak bisa dibuat dari teks yang ada: angkanya belum ada di mana pun. Kirimkan
CSV dengan kolom persis seperti di bawah, taruh di `bab/assets/data/` pada repo
naskah, dan grafiknya saya yang buat.

### 1. Grafik 6.2 — distribusi sentimen dan aspek ulasan (subbab 6.1)

Hasil hitung *walkthrough* ulasan TripAdvisor Bali yang sudah dibahas di naskah,
tetapi angkanya tidak pernah ditabelkan.

```
sentimen-ulasan-bali.csv
kategori,jumlah_ulasan,proporsi_persen
Positif,…,…
Netral,…,…
Negatif,…,…

aspek-ulasan-bali.csv
peringkat,aspek,jumlah_sebutan,sentimen_rata2
1,…,…,…
```

### 2. Grafik 6.4 — sebaran geotag unggahan wisatawan (subbab 6.2)

Belum ada berkasnya sama sekali. Cukup agregat, bukan titik per unggahan —
lebih aman secara privasi dan cukup untuk peta panas.

```
geotag-agregat-<kota>.csv
kelurahan,lat,lon,jumlah_unggahan,periode
```

### 3. Grafik 4.5.4 — komposisi maksud kunjungan ke Jakarta (subbab 4.5.3)

Berkas `jakarta-komposisi-kunjungan` sempat ada di repo naskah lalu dihapus.
Kalau masih tersimpan, kirim apa adanya; kalau tidak:

```
jakarta-komposisi-kunjungan-2023.csv
kategori,proporsi_persen
Rekreasi,…
Bisnis,…
MICE,…
Keluarga,…
Lain-lain,…
```

## Perlu Anda buat — 4 ilustrasi (model gambar)

Halaman pembatas Bagian I–IV sekarang hanya berisi judul, dan muncul empat kali
sepanjang buku. Ini satu-satunya tempat model gambar layak dipakai, karena
ilustrasinya **tidak boleh memuat teks sama sekali**.

Model gambar tidak bisa dipercaya menulis label, apalagi bahasa Indonesia:
hasilnya huruf palsu yang mirip kata tetapi bukan. Karena itu seluruh diagram di
atas dibuat dengan kode, dan keempat ilustrasi ini dirancang supaya tidak
membutuhkan huruf sama sekali.

Nama berkas yang ditunggu: `pembatas-bagian-1.png` … `pembatas-bagian-4.png`,
2400×900 piksel, latar putih.

### Bagian I — Fondasi Pariwisata dan Kota Global

```
Flat vector illustration, clean white background, no text, no letters, no numbers.
A city skyline of simple geometric buildings on the right, and three stepped
podium blocks of different heights on the left, as in a ranking podium. A few
small human figures at uniform scale stand near the podium. All building windows
and podium faces are EMPTY shapes with no writing inside.
Identical line weight across all elements.
Strict palette: deep navy #1a2b42, medium blue #4a6fa5, pale blue-grey #eef4f9,
accent terracotta #b5651d, white background.
Minimal geometric flat design, corporate infographic style.
Wide banner composition, 2400x900 pixels.
```

### Bagian II — Metodologi dan Teknik Pengolahan Data

```
Flat vector illustration, clean white background, no text, no letters, no numbers.
An airplane, a ship, and a cell tower on the left, each emitting a stream of small
dots that flow rightward and converge into a single large container shape.
The dots are uniform circles; the container is an EMPTY outlined vessel with no
writing inside. Identical line weight across all elements.
Strict palette: deep navy #1a2b42, medium blue #4a6fa5, pale blue-grey #eef4f9,
accent terracotta #b5651d, white background.
Minimal geometric flat design, corporate infographic style.
Wide banner composition, 2400x900 pixels.
```

### Bagian III — Indikator dan Pembobotan Global City Index

```
Flat vector illustration, clean white background, no text, no letters, no numbers.
A balance scale in the centre with an empty square tray on each side, and a row of
four horizontal slider controls on the right, each with a round knob at a different
position. Small EMPTY rounded rectangles float above the scale as indicator cards
with no writing inside. Identical line weight across all elements.
Strict palette: deep navy #1a2b42, medium blue #4a6fa5, pale blue-grey #eef4f9,
accent terracotta #b5651d, white background.
Minimal geometric flat design, corporate infographic style.
Wide banner composition, 2400x900 pixels.
```

### Bagian IV — Aplikasi Statistika, Pemodelan, dan Kebijakan

```
Flat vector illustration, clean white background, no text, no letters, no numbers.
A control room seen from behind: two human figures at uniform scale facing a wall
of EMPTY rectangular panels, and a simplified city map outline on the largest
panel with no labels. Panels contain only plain geometric shapes — no charts with
numbers, no writing. Identical line weight across all elements.
Strict palette: deep navy #1a2b42, medium blue #4a6fa5, pale blue-grey #eef4f9,
accent terracotta #b5651d, white background.
Minimal geometric flat design, corporate infographic style.
Wide banner composition, 2400x900 pixels.
```

### Sebelum dikirim

Tiga hal yang menentukan hasilnya:

- `no text, no letters, no numbers` diulang tiga cara; sekali saja sering bocor.
  Kalau hasilnya tetap memuat huruf, buang dan bangkitkan ulang — jangan ditambal.
- Palet disebut sebagai hex, diambil dari `theme.py`, supaya nyambung dengan
  seluruh visual lain.
- Rasio lebar 2400×900 supaya tidak memakan setengah halaman.

Normalisasi sebelum dipasang: ratakan latar ke putih murni
(`im.point(lambda v: 255 if v > 246 else v)`), buang margin kosong (`getbbox`),
lalu beri padding seragam. Tanpa langkah ini ilustrasi tampak mengecil sendiri di
tengah halaman.

Kirimkan berkasnya, dan pemasangannya saya urus.
