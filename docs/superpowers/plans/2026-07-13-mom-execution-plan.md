# Rencana Eksekusi — MoM Disparekraf 13 Juli 2026

Acuan: `MoM/DISPAR-JKT/2026/VII-02`. Target tindak lanjut **19 Juli 2026**, rapat luring **20 Juli** (Artotel TIM, Cikini) dengan demo migrasi server + pembaruan visualisasi.

## A. Peta MoM → Status

| # | Keputusan / Tindak lanjut MoM | Status | Catatan |
|---|---|---|---|
| K1 | Ritme pelaporan mingguan (Kaizen) | ⏳ proses | dokumentasi rutin |
| K2 / TL1-2 | Migrasi Vercel → server on-premise Depok (Ubuntu 24.04) | ✅ **selesai** | platform jalan self-host di Portainer server (`192.168.18.187:3031`), DB sendiri, di-seed dari script. **Server real = Ubuntu 26.04**, bukan 24.04 (MoM tulis 24.04) — perlu konfirmasi. |
| K3 | Arsitektur **Lake House 3 lapis** (Bronze/Silver/Gold) berbasis **DuckDB atau ClickHouse**, fleksibel siap ke Oracle | ❌ **belum** | sekarang masih Postgres tunggal + tabel `report` (mirip Gold parsial). Belum ada tiering formal & engine lake house. |
| K4 | Prioritas indikator **GCI (competitiveness)** di atas GPCI/PDRB | ✅ selesai | badge prioritas di beranda + urutan. |
| K5 / TL3 | Data **kuliner** pakai & pisahkan **TripAdvisor** (Google belum diakui Kearney; belum ada Michelin di Jakarta) | ❌ **belum** | dataset restoran GCI existing sumbernya OSM/web umum; belum ada dataset khusus TripAdvisor yang bisa diekspor Bappeda. |
| K6 / TL4 | Tema visual **putih + oranye** (enjoy.jakarta.id) | ✅ selesai | tema + hyperlink biru. Nunggu color palette resmi (TL5, tugas Pak Budi). |
| TL3 | **Wisman**: viz per **bulan** & per **pintu masuk** (bukan cuma per negara) + **pembersihan klasifikasi negara BPS** | ❌ **belum** | data mentah Wisman sudah ke-sync ke DB (datamart), tapi belum ada agregasi/filter khusus & cleaning BPS. |
| TL3 | **Seni pertunjukan**: tabel terpisah **artis Top 10 Global Chart** (Billboard/Spotify) 5 tahun, untuk verifikasi/rekomendasi | ❌ **belum** | belum ada tabel referensi artis. |
| TL5 | Color palette resmi + update parameter GCI dgn Bappeda | 🔸 eksternal | tugas Pak Budi/Bappeda. |
| TL6 | Disiplin time-stamp harian (kesiapan audit) | ⏳ proses | bisa dibantu logging. |

**Bonus di luar MoM (sudah jalan):** datamart/reporting terisi (102 dataset primer, ~138k baris; readiness 8 ready/11 partial/9 gap), 6 dataset halal + 1 event visitor masuk katalog.

## B. Pekerjaan Outstanding (yang bisa saya kerjakan)

### 1. Lake House 3-lapis (K3) — arsitektur inti
Petakan tiering formal, engine **DuckDB** (rekomendasi) atau ClickHouse:
- **Bronze (Data Lake)** — dump mentah SDI + Atlas apa adanya (sudah ada di tabel `record`/`atlas_record`; formalkan sebagai sumber Bronze + simpan file mentah).
- **Silver (Data Warehouse)** — pembersihan & standardisasi: tipe kolom, dedup, **normalisasi klasifikasi negara BPS**, penyeragaman periode.
- **Gold (Data Mart)** — tabel siap-saji per indikator (perluasan `report`/datamart yang sudah dibangun) yang dibaca dashboard.
- Rekomendasi engine: **DuckDB** — embedded, zero-ops, cepat untuk volume ini (~140k baris), file `.duckdb` mudah dibackup, `ATTACH` ke Postgres/Parquet, dan **mudah dimigrasi ke Oracle** kalau perlu. ClickHouse = server terpisah, overkill untuk skala sekarang tapi lebih kuat untuk skala besar/real-time.

### 2. Kuliner TripAdvisor (K5, TL3)
Dataset restoran Jakarta bersumber **TripAdvisor**, dipisah dari sumber lain, dengan kolom yang bisa langsung diekspor Bappeda (nama, alamat, rating, jumlah ulasan, ranking, koordinat, URL TripAdvisor). Pola crawl+verify subagent seperti dataset halal. Michelin: catat "belum ada di Jakarta" (nol), siapkan kolomnya.

### 3. Wisman — agregasi & cleaning (TL3, Risiko)
- Bangun **data mart Wisman**: total per **bulan** dan per **pintu masuk** (Soekarno-Hatta dll.), selain per negara.
- **Pembersihan klasifikasi negara BPS** (nama negara tidak konsisten → mapping standar).
- Viz/filter khusus di dashboard indikator Wisman (CI-FV dsb.).

### 4. Seni pertunjukan — tabel artis Top Chart (TL3)
Tabel referensi **Top 10 Global Chart** (Billboard Hot 100 / Spotify Global) 5 tahun terakhir untuk verifikasi apakah event musik Jakarta menghadirkan artis yang diakui Kearney. Crawl bersumber.

### 5. Polish server (implikasi K2)
- Domain + reverse proxy + HTTPS (Caddy/Traefik) untuk server (sekarang akses IP:port).
- Cron auto-refresh datamart (`/api/admin/report`) + auto-sync.
- Logging time-stamp (TL6) untuk audit.

## C. Urutan usulan (menjelang 20 Juli)
1. **Lake House tiering (Silver/Gold) + DuckDB** — inti arsitektur MoM, plus wadah untuk cleaning Wisman.
2. **Wisman cleaning + per-pintu-masuk/bulan** (masuk Silver/Gold) — isu risiko yang disorot.
3. **TripAdvisor kuliner** — dataset baru bersumber.
4. **Tabel artis Top Chart** — cepat, pelengkap seni pertunjukan.
5. **Polish server** (domain/HTTPS, cron) — kalau sempat sebelum demo.

## D. Keputusan yang perlu dikonfirmasi sebelum eksekusi
- **Engine lake house**: DuckDB (rekomendasi) vs ClickHouse.
- **Kedalaman**: implementasi lake house penuh (engine baru) vs "tiering logis" di atas Postgres yang ada dulu (lebih cepat untuk demo 20 Juli).
- **Prioritas**: kerjakan semua berurutan, atau fokus subset untuk demo 20 Juli.
- Konfirmasi versi OS server (26.04 vs 24.04 di MoM) & apakah butuh domain/HTTPS untuk demo.
