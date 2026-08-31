# GMTI — Jakarta Ramah Muslim (section Atlas)

Tanggal: 31 Agustus 2026 · Status: diimplementasikan di `platform-v2`

## Masalah

Enam dataset halal Dispar (restoran, hotel, mall, RPH, produk kreatif, inovasi)
plus bandara & warisan Islam tercecer sebagai entri terpisah di katalog `/sdi`.
Tidak ada satu halaman yang menyajikannya sebagai satu cerita, dan tidak ada
data fasilitas ibadah sama sekali — padahal itu indikator paling dasar untuk
kesiapan destinasi ramah muslim.

## Sumber baru: SIMAS Kemenag

Situs SIMAS adalah aplikasi Next.js; daftar profil diambil client-side dari
endpoint internal yang terbuka:

```
GET /api/simas/wilayah/profil/{masjid|mushalla}
    ?page=&perPage=&tipologi=&prov=&kab=&kec=&tanah=&q=
```

Tidak perlu scraping HTML. Catatan penting:

- `prov=11` = DKI Jakarta.
- `tipologi` wajib diisi satu per satu — tidak ada mode "semua tipologi".
  Masjid punya tipologi 1–8, mushalla 1–4.
- Server mengabaikan `perPage` yang diminta (dipakai ~9–36), jadi paginasi
  harus mengikuti `meta.totalPages` dari respons.
- Endpoint daftar **tidak memuat koordinat**; endpoint detail
  `/api/simas/masjid/{id}` butuh autentikasi (401).

Dua URL yang jadi titik awal permintaan ternyata bukan datanya: `tip=2` pada
masjid = Masjid Raya (2 baris di DKI), dan `tip=88` pada mushalla tidak ada
sehingga mengembalikan 0 baris. Cakupan yang dipakai: seluruh tipologi.

Hasil tarikan: **8.331 baris** (4.041 masjid, 4.290 mushalla) setelah 32
duplikat id dibuang.

## Keputusan desain

**Satu section Atlas, lima pilar.** `/atlas/gmti` menyatukan ibadah, makan,
menginap, destinasi, dan program. Pengelompokan pilar adalah kerangka kerja
untuk menyusun halaman — bukan klaim skor GMTI resmi, yang dinilai di tingkat
negara/destinasi oleh Mastercard–CrescentRating.

**Data besar lewat `public/`, bukan `import`.** Pola Atlas yang lama
meng-`import` dataset jadi modul TS sehingga seluruhnya masuk bundle JS
halaman. Untuk 8.331 baris (~2 MB) itu terlalu berat. Karena itu:

- `lib/gmti-data.ts` — agregat per kecamatan, tempat ber-koordinat, capaian.
  Kecil, di-`import`, jadi hero/angka/peta tampil tanpa menunggu.
- `public/gmti-ibadah.json` — daftar lengkap, di-`fetch` hanya saat pilar
  Ibadah dibuka.

**Peta = choropleth kecamatan + pin selektif.** SIMAS tidak punya koordinat,
tapi setiap baris punya kecamatan, sehingga sebaran seluruh 8.331 fasilitas
tetap terbaca jujur lewat choropleth. Pin hanya untuk baris yang titiknya
benar-benar ditemukan.

**Geocoding hemat dan selektif.** Masjid Jami (3.712) dan Mushalla Perumahan
(3.214) adalah fasilitas lingkungan RT/RW; alamatnya pendek dan hasil
geocoding-nya rawan meleset, jadi sengaja tidak dicarikan titik — titik yang
salah lebih merugikan daripada tidak ada titik. Sisanya (1.405 baris) dicari
lewat Nominatim (gratis, 1 req/detik) setelah lebih dulu dicocokkan ke dataset
warisan Islam yang koordinatnya sudah diverifikasi manual. Hasil di luar kotak
batas DKI dibuang. Cache permanen di `data/gmti-ibadah-coords.json` — baris
yang sudah pernah dicek tidak pernah dicari ulang, jadi skripnya aman
dijalankan berkali-kali dan bisa dilanjutkan bertahap.

## Berkas

| Berkas | Peran |
|---|---|
| `scripts/fetch-simas.ts` | Tarik 12 kombinasi tipologi → `data/gmti-ibadah.json` |
| `scripts/geocode-gmti.ts` | Cari koordinat baris signature → `data/gmti-ibadah-coords.json` |
| `scripts/build-gmti.ts` | Gabung semua → `lib/gmti-data.ts` + `public/gmti-ibadah.json` |
| `lib/gmti.ts` | Tipe, label pilar, warna, helper |
| `components/GmtiView.tsx` | Halaman daftar |
| `components/GmtiMapView.tsx` | Halaman peta |
| `public/geo/dki-jakarta.geojson` | 42 poligon kecamatan (disalin dari submodule console) |

Urutan jalan ulang: `fetch-simas` → `geocode-gmti` → `build-gmti`.

## Batasan yang disadari

- SIMAS adalah data **registrasi** Kemenag, bukan sensus lapangan.
- GeoJSON hanya memuat 42 kecamatan Jakarta daratan; Kepulauan Seribu
  Utara & Selatan (52 fasilitas) tidak punya poligon. Ini ditampilkan di
  legenda peta, bukan dihilangkan diam-diam.
- Nama kecamatan SIMAS dan GeoJSON beda spasi pada tiga kasus (Kramatjati,
  Pal Merah, Pulogadung); pencocokan memakai kunci huruf-kecil-tanpa-spasi.
- Geocoding berjalan bertahap. Jumlah pin bertambah setiap kali
  `geocode-gmti` + `build-gmti` dijalankan ulang; halaman tidak rusak saat
  cache belum lengkap.
