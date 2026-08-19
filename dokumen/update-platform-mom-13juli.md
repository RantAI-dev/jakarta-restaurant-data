# Pembaruan Platform — tindak lanjut MoM 13 Juli 2026

Ringkasan perubahan platform (`dispar-data-platform.vercel.app`) sesuai keputusan
Notulen Rapat 13 Juli 2026. Untuk demo pertemuan luring **20 Juli 2026 (Cikini)**.

## Sudah dikerjakan (live di platform)

| # | Keputusan MoM | Realisasi di platform |
|---|---|---|
| 6 | **Tema visual → dominan putih & oranye** (branding enjoy.jakarta.id, tidak lagi "biru seperti JSC") | Sistem desain di-flip dari navy ke **putih + oranye** (`#ed6b23`): navbar putih dengan aksen oranye, hero oranye, kartu/chart/aksen oranye, latar putih hangat. |
| 4 | **Prioritaskan GCI, khususnya competitiveness** di atas GPCI & PDRB | Kartu GCI di beranda diberi badge **"Prioritas"** + deskripsi "prioritas indikator competitiveness". |
| 5 | **Kuliner: pakai & pisahkan data TripAdvisor** (Google belum diakui Kearney; belum ada Michelin di Jakarta) | Catatan MoM di indikator **Kuliner (CE2)**: kriteria Michelin/TripAdvisor, Google belum diakui, gunakan & pisahkan TripAdvisor untuk ekspor Bappeda. |
| — | **Wisman: total per bulan & per pintu masuk** (bukan hanya per kebangsaan); data BPS perlu dibersihkan | Catatan MoM di indikator **Wisman (CI-FV)** + tren per periode ditonjolkan. |
| — | **Seni pertunjukan: hanya artis Top 10 Global Chart** (Billboard/Spotify, 5 tahun berturut) | Catatan MoM di indikator **Seni & Pertunjukan (CE3)** — perlu tabel terpisah daftar artis global. |

Catatan MoM tampil sebagai callout oranye di tiap indikator terkait (komponen `MomNote`).

## Belum dikerjakan (butuh infrastruktur / pihak lain)

| # | Keputusan MoM | Status |
|---|---|---|
| 2 | **Migrasi Vercel → server lokal (on-premise) Depok**, Ubuntu 24.04 | Menunggu perangkat keras dari Pak Umar (target 19 Juli). Platform masih di Vercel sampai server siap. |
| 3 | **Arsitektur Lake House** (Bronze/Silver/Gold) berbasis **DuckDB/ClickHouse**, fleksibel ke Oracle | Tiering Bronze/Silver/Gold sudah ada secara konsep (skema `record`/`report`); migrasi ke DuckDB/ClickHouse = pekerjaan lanjutan di server lokal. |
| 5 | **Verifikasi Michelin** via situs resmi + tabel artis global | Perlu pengumpulan data (Bappeda/tim). |
| — | **Color palette resmi DKI** dari tim web | Menunggu Pak Budi — warna oranye final bisa disesuaikan setelah pedoman diterima. |

## Cara update warna final
Bila color palette resmi DKI sudah diterima, cukup ubah token di
`platform/app/globals.css` (`--accent`, `--accent-deep`, `--accent-soft`) — seluruh
platform ikut berubah.
