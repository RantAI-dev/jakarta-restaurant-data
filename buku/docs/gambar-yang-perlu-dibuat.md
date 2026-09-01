# Gambar Buku

Naskah membawa 32 figure, dan tidak satu pun berada di Bab 1 dan Bab 2 — 30
halaman pertama buku. Dokumen ini mencatat apa yang ditambahkan untuk menutup
kekosongan itu, dari mana angkanya, dan apa yang masih terbuka.

Buku kini memuat **50 visual**: 32 dari naskah, 10 diagram konseptual, 4 grafik
dari data yang dikumpulkan sendiri, dan 4 ilustrasi pembatas bagian.

## 10 diagram konseptual — `scripts/build-diagrams.mjs`

Isinya sepenuhnya dari pernyataan yang sudah ada di naskah; tidak ada angka atau
klaim baru.

| ID | Letak | Isi |
|---|---|---|
| Grafik 1.1 | 1.1 | Struktur dimensi Kearney, GPCI, dan Resonance; dimensi yang memuat pariwisata ditandai |
| Grafik 1.2 | 1.2 | Empat jenis data pariwisata → dimensi indeks yang memakainya |
| Tabel 1.1 | 1.3 | Siapa menghitung kunjungan atas dasar apa, dan apa yang tidak tercakup |
| Grafik 1.3 | 1.4 | Rantai Satu Data Indonesia, tiga prasyaratnya, dan titik yang masih putus |
| Grafik 2.1 | 2.1 | Tiga lembaga inti: terbitan, frekuensi, granularitas |
| Tabel 2.1 | 2.2 | Sumber tradisional vs big data pada enam aspek |
| Grafik 2.2 | 2.3 | Lapisan data lake daerah, dari zona mentah sampai data mart |
| Grafik 2.3 | 2.4 | Dua angka kunjungan Bali 2024 yang sama-sama benar, dan mekanisme yang mendamaikannya |
| Grafik 6.1 | 6.1 | Enam langkah pra-pemrosesan ulasan daring |
| Grafik 9.3 | 9.3 | Alur data crowdsourcing dari kontributor sampai publikasi |

## 4 grafik dari data sendiri — `scripts/build-charts.mjs`

Tiga visual dalam naskah menunggu data yang tidak pernah ada. Alih-alih
mengarang angka, ketiganya diganti dengan data yang benar-benar dikumpulkan dan
diolah tim data Dinas Pariwisata di repo ini. Setiap keterangan menyebut
cakupan dan baris yang tidak terpakai.

| ID | Letak | Isi | Sumber di repo |
|---|---|---|---|
| Grafik 2.4 | 2.4 | 141 nilai berbeda untuk jenis event; 42 ejaan merujuk kategori musik yang sama, mencakup 528 dari 804 event | `platform/data/event-visitors-2026.json` |
| Grafik 4.5.4 | 4.5.3 | Kunjungan ke 15 destinasi wisata Jakarta teratas, Juli 2025 (25 destinasi melapor, rentang empat orde besaran) | `data/kunjungan-31-dtw-juli-2026-KERJA.tsv` |
| Grafik 4.5.5 | 4.5.3 | Peta sebaran 610 event Jakarta semester I 2026 di atas batas kecamatan | katalog event + `platform-v2/public/geo/dki-jakarta.geojson` |
| Grafik 6.2 | 6.1 | Jumlah ulasan per venue pada sumbu logaritmik: median restoran 1.632, nightlife 2, suvenir 4 | `data-restoran/nightlife/souvenir-*.tsv` |

Grafik 2.4 bukan sekadar penambal: ia bukti dari katalog sendiri untuk masalah
yang dibahas subbab 2.4 — kolomnya ada, terisi, dan tetap tidak bisa dijumlahkan.

## 4 ilustrasi pembatas bagian — `scripts/normalize-illustrations.py`

Dibangkitkan dengan model gambar, tanpa teks sama sekali, lalu dinormalisasi:
latar diratakan ke putih murni, margin kosong dibuang, padding diseragamkan.
Sumber mentahnya di `docs/generation/`, hasil terpasang di `public/gambar/`.
Muncul di halaman pembatas versi cetak dan di daftar isi halaman depan web.

## Yang masih terbuka

| Yang dibutuhkan | Untuk apa | Kenapa belum bisa |
|---|---|---|
| Teks ulasan (bukan hanya rating) | Analisis sentimen sungguhan di 6.1 | Kurasi yang ada hanya menyimpan rating dan jumlah ulasan |
| Agregat titik geotag media sosial | Jejak spasial digital di 6.2 | Peta event yang ada berasal dari katalog resmi, bukan jejak media sosial — dua hal berbeda dan tidak boleh dilabeli sama |
| Maksud kunjungan wisatawan Jakarta | Komposisi rekreasi/bisnis/MICE di 4.5.3 | Tidak ada di sumber mana pun yang kita punya; kunjungan per destinasi sudah menggantikannya |

Kalau salah satu datanya muncul, grafiknya tinggal ditambahkan ke
`scripts/build-charts.mjs`.

## Membangun ulang semuanya

```bash
npm run diagrams:build      # 10 diagram konseptual
npm run charts:build        # 4 grafik dari data sendiri
npm run illustrations:build # 4 ilustrasi pembatas (butuh Pillow)
npm run import:book         # pasang ke halaman
npm run build && npm run pdf:build && npm run pdf:preview
```

Posisi tiap gambar ditentukan di `scripts/import-book.mjs` (konstanta
`DIAGRAM`), dicocokkan dengan judul sub-bagian naskah. Kalau judulnya berubah,
impor berhenti dengan galat alih-alih diam-diam menghilangkan gambar.
