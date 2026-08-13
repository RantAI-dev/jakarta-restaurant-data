# Draft Indikator GCI & GPCI + Pemetaan Data — untuk Validasi

> **Status: DRAFT untuk divalidasi Mas Maulana / Tim Pak Adi.** Disusun dari
> framework publik (Kearney Global Cities Index & Mori Global Power City Index)
> lalu dipetakan ke dataset yang platform sudah punya. **Angka/definisi final
> harus dikonfirmasi.** Sumber:
> - Kearney GCI — dimensi *Cultural Experience* (6 metrik): museum, seni
>   visual & pertunjukan, event olahraga besar, wisatawan internasional,
>   kuliner beragam, sister-city.
> - Mori GPCI — fungsi *Cultural Interaction* (500 poin): jumlah wisatawan
>   asing, jumlah event budaya, jumlah stadion, jumlah kamar hotel, konferensi
>   internasional, daya tarik belanja/kuliner, hotel mewah, resources budaya.

## Ruang lingkup & batasan (penting)

Kita **tidak menghitung skor GCI/GPCI global** Jakarta (itu butuh data pembanding
kota lain + metodologi pemilik indeks). Yang kita bangun = **dashboard readiness**:
untuk tiap indikator budaya/pariwisata GCI/GPCI, *apakah Dispar punya data untuk
mengisinya, berapa nilai terbaru, dan di mana gap-nya*. Ini yang realistis &
langsung berguna — sekaligus jadi peta "data mana yang perlu dilengkapi".

Status readiness:
- 🟢 **Ready** — ada dataset langsung mengisi indikator.
- 🟡 **Partial** — ada proksi/sebagian; perlu penajaman.
- 🔴 **Gap** — belum ada data (mungkin di luar Dispar: Dispora, Biro Kerja Sama, dll).

---

## A. Kearney GCI — Cultural Experience

| # | Indikator GCI | Status | Dataset kita (primer SDI / sekunder Atlas) |
|---|---|---|---|
| A1 | Kuliner beragam (culinary establishments) | 🟢 Ready | *Restoran & Kafe GCI* (Atlas, 2.577) · *Jumlah Usaha Jasa Makanan & Minuman* · *Jumlah Restoran per Kelurahan* · *Usaha Food Court* |
| A2 | Seni visual & pertunjukan | 🟢 Ready | *Data Seni Pertunjukan dan Visual* · *Jumlah Penyelenggaraan Event* · *Rekomendasi Penyelenggaraan Pertunjukan Musik* · *Pertunjukan & Budaya GCI* (Atlas, 308) |
| A3 | Wisatawan internasional | 🟢 Ready | *Wisatawan Mancanegara Berdasarkan Kebangsaan* · *Kunjungan Wisatawan ke TIC* · *Jumlah Kunjungan Wisatawan ke Obyek Wisata* |
| A4 | Museum | 🟡 Partial | Belum ada "jumlah museum" eksplisit; proksi via *Obyek Wisata Unggulan* / *Desa Wisata*. **Perlu data museum** (Dinas Kebudayaan?) |
| A5 | Event olahraga besar | 🔴 Gap | Di luar Dispar → **Dispora**. |
| A6 | Sister-city | 🔴 Gap | Di luar Dispar → **Biro Kerja Sama Daerah**. |

**Coverage GCI Cultural Experience: 3 Ready, 1 Partial, 2 Gap dari 6.**

---

## B. Mori GPCI — Cultural Interaction

| # | Indikator GPCI | Status | Dataset kita |
|---|---|---|---|
| B1 | Jumlah wisatawan asing | 🟢 Ready | *Wisatawan Mancanegara Berdasarkan Kebangsaan* · *Kunjungan Wisman ke Indonesia (bulan/wilayah)* · TIC |
| B2 | Jumlah event budaya | 🟢 Ready | *Penyelenggaraan Event Pariwisata & Budaya* · *Data Seni Pertunjukan & Visual* · *Jumlah Pengunjung Event* |
| B3 | Jumlah kamar hotel | 🟢 Ready | *Rekapitulasi Usaha dan Kamar Hotel* · *Jumlah Usaha Penyediaan Akomodasi* |
| B4 | Konferensi internasional (MICE) | 🟢 Ready | *Usaha Penyelenggaraan Pertemuan/Insentif/Konferensi/Pameran (MICE)* |
| B5 | Daya tarik belanja/kuliner/malam | 🟢 Ready | *Persentase Pengaruh Wisata Belanja/Kuliner/Malam* · *Rata-rata Pengeluaran Wisatawan* · restoran |
| B6 | Hotel mewah / kelas atas | 🟡 Partial | Proksi via *Hotel Berbintang* (*Tingkat Hunian*, *Lama Menginap*). Perlu segmentasi bintang 4–5. |
| B7 | Resources budaya (teater/heritage) | 🟡 Partial | Proksi via *Obyek Wisata* / *Desa Wisata*. Perlu inventori cagar budaya/teater. |
| B8 | Jumlah stadion | 🔴 Gap | Di luar Dispar → **Dispora**. |

**Coverage GPCI Cultural Interaction: 5 Ready, 2 Partial, 1 Gap dari 8.**

---

## C. Indikator konteks ekonomi (bonus, bukan Cultural tapi relevan pariwisata)

Bukan bagian dimensi budaya, tapi datanya kuat & sering diminta:
*PAD Sektor Pariwisata* · *Realisasi Investasi Pariwisata* · *Pertumbuhan PDRB
Sektor Pariwisata* · *Rata-rata Tingkat Hunian Kamar* · *Lama Menginap* ·
*Nilai Kepuasan Pengunjung* · *Usaha Ekonomi Kreatif*. Bisa dijadikan panel
"Kinerja Sektor" terpisah.

---

## D. Ringkasan readiness

| Framework · dimensi | Ready | Partial | Gap | Total |
|---|---|---|---|---|
| GCI · Cultural Experience | 3 | 1 | 2 | 6 |
| GPCI · Cultural Interaction | 5 | 2 | 1 | 8 |

**Kekuatan kita:** wisatawan internasional, kuliner, event/pertunjukan, MICE,
kamar hotel — inti dimensi budaya kedua indeks **bisa diisi sekarang**.
**Gap utama:** event olahraga & stadion (Dispora), sister-city (Biro Kerja Sama),
museum & resources budaya (Dinas Kebudayaan) — lintas-OPD.

---

## E. Yang perlu dikonfirmasi Mas Maulana / Pak Adi

1. **Definisi & satuan resmi** tiap indikator (count? per tahun? per kapita?).
2. **Pemetaan dataset** di atas — sudah benar? ada dataset lebih tepat?
3. **Bobot/prioritas** indikator (kalau mau skor gabungan).
4. **Gap lintas-OPD** — apakah Dispar tarik data Dispora/Kebudayaan/Biro Kerja
   Sama, atau indikator itu di-*mark* "di luar cakupan"?
5. **Periode acuan** (tahun berjalan? rata-rata 3 tahun?) untuk nilai yang ditampilkan.

> Setelah poin di atas dikonfirmasi, engine readiness (lihat plan
> `2026-07-09-plan4-kpi-gci-gpci.md`) tinggal diisi konfigurasinya — strukturnya
> sudah dibuat data-driven.
