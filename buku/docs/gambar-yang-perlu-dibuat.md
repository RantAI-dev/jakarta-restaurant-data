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

Ini tidak bisa dibuat dari teks yang ada: angkanya belum ada di mana pun.
Begitu datanya tersedia sebagai CSV di repo naskah, visualnya bisa dibuat
dengan kode seperti figure lainnya.

| ID | Letak | Isi | Data yang dibutuhkan |
|---|---|---|---|
| Grafik 6.2 | 6.1 | Distribusi sentimen dan sepuluh aspek yang paling sering muncul | Hasil hitung *walkthrough* ulasan TripAdvisor Bali yang dibahas di 6.1, tetapi angkanya tidak ditabelkan di naskah |
| Grafik 6.4 | 6.2 | Sebaran *geotag* unggahan wisatawan di satu kota | Ekspor agregat titik geotag; belum ada berkasnya sama sekali |
| Grafik 4.5.4 | 4.5.3 | Komposisi maksud kunjungan ke Jakarta | `jakarta-komposisi-kunjungan` sempat ada di repo naskah lalu dihapus |

## Perlu Anda buat — 4 ilustrasi (model gambar)

Halaman pembatas Bagian I–IV sekarang hanya berisi judul, dan muncul empat kali
sepanjang buku. Ini satu-satunya tempat model gambar layak dipakai, karena
ilustrasinya **tidak boleh memuat teks sama sekali**.

Model gambar tidak bisa dipercaya menulis label, apalagi bahasa Indonesia:
hasilnya huruf palsu yang mirip kata tetapi bukan. Karena itu semua diagram di
atas dibuat dengan kode, dan ilustrasi ini dirancang supaya tidak butuh huruf.

Kerangka prompt:

```
Flat vector illustration, clean white background, no text, no letters, no numbers.
<objek dan komposisi, spesifik dan terhitung>
All panels and screens are EMPTY rectangles with no writing inside.
Uniform figure scale and identical line weight across all elements.
Strict palette: deep navy #1a2b42, medium blue #4a6fa5, pale blue-grey #eef4f9,
accent terracotta #b5651d, white background.
Minimal geometric flat design, corporate infographic style.
Wide banner composition, 2400x900 pixels.
```

Objek per bagian:

| Bagian | Objek |
|---|---|
| I · Fondasi | Siluet kota dengan podium peringkat berundak di latar depan |
| II · Metodologi | Aliran titik data dari pesawat, kapal, dan menara seluler menuju satu wadah |
| III · Indikator | Timbangan dan deretan slider bobot; kotak indikator kosong |
| IV · Aplikasi | Ruang kendali dengan panel kosong dan peta kota tanpa label |

Tiga hal yang menentukan hasilnya:

- `no text, no letters, no numbers` — diulang tiga cara; sekali saja sering bocor.
- Palet disebut sebagai hex, diambil dari `theme.py`, supaya nyambung dengan
  seluruh visual lain.
- Rasio lebar 2400×900, supaya tidak memakan setengah halaman.

Sebelum dipasang, tiap gambar dinormalisasi: ratakan latar ke putih murni
(`im.point(lambda v: 255 if v > 246 else v)`), buang margin kosong (`getbbox`),
lalu beri padding seragam. Tanpa langkah ini ilustrasi tampak mengecil sendiri
di tengah halaman.

Kirimkan berkasnya, dan pemasangannya saya urus.
