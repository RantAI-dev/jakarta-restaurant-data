# Data Restoran GCI Jakarta — Cara Pakai

Dibuat untuk: Inventarisasi & Monitoring Data Capaian Kota Jakarta (Global City Index / GCI)
Indikator: *"Jumlah restoran kelas atas dan keberagaman kuliner internasional di Jakarta"*
Deadline pengumpulan: **Senin, 22 Juni 2026, 16.00 WIB**
Link tujuan: https://docs.google.com/spreadsheets/d/1yNNEluakDM8tgr9hvTfq-6b76ZTAboic0-9RDbIjelg/edit

## File
- **`data-restoran-GCI-jakarta.tsv`** — 84 restoran/kafe, 8 kolom:
  `No. | Nama | Jenis Cuisine | Alamat | Rating | Jumlah Ulasan | Sumber Rating | Area`
  - Kolom **Area** (kawasan) sengaja dipindah ke paling kanan supaya gampang
    **disembunyikan/hide** di Google Sheet — datanya TIDAK dihapus, masih ada.
  - **Alamat** = alamat jalan asli dari Google (Places API), terisi 83/84.
    Satu baris (Salvatore Cuomo) dikosongkan karena Google tidak mengembalikan
    kecocokan yang meyakinkan — silakan isi manual bila perlu.
  - Untuk restoran **chain/multi-outlet**, alamat bisa menunjuk cabang lain dari
    yang tertera di kolom *Area* (mis. Osteria GIA) — cek cepat bila krusial.
  - Semua alamat sudah dipastikan **di dalam DKI Jakarta** (bukan Bodetabek).

## Cara memasukkan ke Google Sheet (paling cepat)
1. Buka file `.tsv` (bisa lewat Notepad / VS Code), pilih semua (Ctrl+A), copy (Ctrl+C).
2. Di Google Sheet, klik sel **A1**, lalu **Ctrl+V** (paste).
3. Karena formatnya dipisah Tab, tiap kolom otomatis masuk ke kolomnya sendiri — tidak perlu "Split text to columns".

## Cakupan (keberagaman kuliner internasional)
Italian, French, Japanese, Chinese/Cantonese, Korean, Thai, Indian, Spanish, Mediterranean,
Steakhouse, Indonesian fine dining, dan Cafe — tersebar di Jakarta Pusat, Selatan, Barat, Utara.

## Catatan penting (mohon dibaca sebelum submit)
1. **Rating & Jumlah Ulasan = perkiraan per Juni 2026** dari agregator publik (Wanderlog/TripAdvisor
   yang menarik data Google). Angka Google berubah tiap hari — idealnya **dicek ulang cepat di Google
   Maps** untuk baris-baris utama sebelum final. Tanda `-` artinya jumlah ulasan belum terverifikasi.
2. **Restoran di hotel bintang 5 sudah didapat dari JHA (via bidang PA).** Beberapa baris di sini
   kebetulan berada di hotel bintang 5 (mis. Edogin & Table8 — Hotel Mulia; Li Feng — Mandarin Oriental;
   OKU — Kempinski; Henshin — The Westin; Pearl — JW Marriott; Rosso — Shangri-La). **Silakan hapus
   yang sudah masuk data JHA agar tidak dobel.** Sisanya (restoran/kafe berdiri sendiri + restoran di
   hotel bintang 3 & 4) adalah fokus permintaan ini.
3. Daftar ini **dasar yang kuat, bukan final** — silakan tambah temuan dari tim Kasudin/Kasi IP/KSK
   sesuai wilayah masing-masing.

## Sumber
- Wanderlog — daftar restoran Jakarta (famous, fine dining, Italian, French, Japanese, Chinese, Korean, Thai, Indian, steak, cafe)
- TripAdvisor & Chope — daftar fine dining / per-kawasan
- Four Seasons Jakarta — laman dining resmi
