# Lakehouse Implementation Plan (Tahap 1–5)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun lakehouse Bronze/Silver/Gold di atas Iceberg + ClickHouse, dengan app Next.js v2 yang membaca dari ClickHouse — menutup item K3 MoM 13 Juli.

**Architecture:** dlt menarik SDI & sumber file ke tabel Iceberg **Bronze** di RustFS (katalog Lakekeeper). SQLMesh menaikkan ke **Silver** (bertipe + dimensi bersama) lalu **Gold** (mart per indikator). ClickHouse me-mount lake lewat `DataLakeCatalog` dan menyimpan salinan MergeTree dari Gold untuk melayani app. Dagster menjadwalkan dan menampilkan lineage. App v2 (`platform-v2/`) adalah duplikat `platform/` dengan lapisan data ditukar ke ClickHouse.

**Tech Stack:** RustFS (S3), Apache Iceberg, Lakekeeper, ClickHouse, dlt, SQLMesh, Dagster OSS, Postgres (metadata), Next.js 15, `@clickhouse/client`. Semua Apache 2.0.

**Spec:** `docs/superpowers/specs/2026-08-12-lakehouse-design.md`

**Catatan eksekusi:** verifikasi dilakukan dengan menjalankan stack di mesin dev (Docker tersedia, ±11 GB RAM bebas). RisingWave dilewati (tahap 6, opsional). Deploy ke server Depok bukan bagian rencana ini — butuh kredensial Portainer yang tidak tersedia di sesi ini.

---

## File Structure

```
lakehouse/
  compose.yaml              # RustFS + Lakekeeper + ClickHouse + Postgres meta + Dagster
  .env.example
  README.md                 # cara menjalankan & menyegarkan
  clickhouse/
    config.d/lake.xml       # koneksi S3 + DataLakeCatalog
    init/01-databases.sql   # database bronze/silver/gold/serving
  ingest/                   # dlt — Python
    pyproject.toml
    dispar_ingest/
      __init__.py
      sdi.py                # source SDI (list + detail + rows)
      files.py              # source file lokal (xlsx/tsv/csv)
      iceberg.py            # helper tulis Iceberg via pyiceberg
      run_bronze.py         # entrypoint
  transform/                # SQLMesh
    config.yaml
    macros/typing.py        # makro konversi angka/tanggal Indonesia
    models/
      silver/auto/          # dibangkitkan per dataset
      silver/dim_*.sql      # tabel dimensi
      silver/curated/*.sql  # model kurasi (wisman dll)
      gold/mart_*.sql
    seeds/dim_negara.csv, dim_pintu_masuk.csv, dim_indikator.csv
    tests/                  # fixture uji model
    generate_auto_models.py # pembangkit model Silver otomatis
  orchestrate/              # Dagster
    pyproject.toml
    dispar_lakehouse/definitions.py
platform-v2/                # duplikat platform/ dengan lib/ch
  lib/ch/client.ts, gci.ts, wisman.ts, sdi.ts, atlas.ts
  ...                       # sisanya identik dengan platform/
```

---

## Task 1: Fondasi — stack naik & roundtrip Iceberg

**Files:** Create `lakehouse/compose.yaml`, `lakehouse/.env.example`, `lakehouse/clickhouse/config.d/lake.xml`, `lakehouse/clickhouse/init/01-databases.sql`

- [ ] **Step 1:** Tulis `compose.yaml` berisi `lake-rustfs` (S3, port 19000), `lake-meta` (Postgres 16, port 15433), `lake-catalog` (Lakekeeper, port 18181, backend ke `lake-meta`), `lake-clickhouse` (port 18123/19440). Setiap service diberi `mem_limit` sesuai spec §7 dan `healthcheck`.
- [ ] **Step 2:** Jalankan `docker compose -f lakehouse/compose.yaml up -d`; tunggu semua healthy.
  Verifikasi: `docker compose -f lakehouse/compose.yaml ps` — semua `healthy`/`running`.
- [ ] **Step 3:** Buat bucket `lakehouse` di RustFS (via `aws s3api create-bucket` atau API RustFS).
  Verifikasi: bucket terlihat saat `s3api list-buckets`.
- [ ] **Step 4:** Bootstrap warehouse di Lakekeeper (POST ke `/management/v1/warehouse`) menunjuk ke `s3://lakehouse/`.
  Verifikasi: `GET /catalog/v1/config` mengembalikan 200.
- [ ] **Step 5:** Tulis satu tabel Iceberg uji dari Python (`pyiceberg`) berisi 3 baris.
  Verifikasi: `GET /catalog/v1/{prefix}/namespaces/test/tables` memuat tabel itu.
- [ ] **Step 6:** Di ClickHouse, buat `DataLakeCatalog` database menunjuk Lakekeeper, lalu `SELECT * FROM lake.test_tabel`.
  Verifikasi: 3 baris terbaca. **Ini gerbang tahap 1** — kalau gagal, seluruh desain harus ditinjau ulang.
- [ ] **Step 7:** Commit.

---

## Task 2: Bronze — SDI masuk lake

**Files:** Create `lakehouse/ingest/pyproject.toml`, `lakehouse/ingest/dispar_ingest/{__init__,sdi,iceberg,run_bronze}.py`

- [ ] **Step 1:** Tulis uji untuk parser daftar dataset SDI memakai fixture respons tersimpan (bukan jaringan): memastikan 8 item/halaman terurai dan `total_data` terbaca.
- [ ] **Step 2:** Jalankan uji, pastikan gagal.
- [ ] **Step 3:** Implementasi `sdi.py`: `list_datasets()`, `dataset_detail(slug)`, `dataset_rows(slug)` dengan paginasi 1000/halaman, retry+backoff, dan rate limit. Endpoint sesuai `lib/sdi.ts` yang sudah ada.
- [ ] **Step 4:** Jalankan uji, pastikan lulus.
- [ ] **Step 5:** Implementasi `iceberg.py`: buat/gantikan tabel Iceberg dari daftar dict, semua kolom `string`, plus kolom audit `_ingested_at`, `_source_url`, `_batch_id`, `_row_hash`, `_tenant`.
- [ ] **Step 6:** Implementasi `run_bronze.py` yang mengulang semua dataset SDI dan menulis ke `bronze/sdi/{slug}`.
- [ ] **Step 7:** Jalankan terhadap SDI sungguhan.
  Verifikasi: jumlah tabel di katalog = jumlah dataset yang berhasil; untuk 3 dataset contoh, `count(*)` di ClickHouse = `total` yang dilaporkan API SDI.
- [ ] **Step 8:** Commit.

---

## Task 3: Bronze — sumber file & sekunder

**Files:** Create `lakehouse/ingest/dispar_ingest/files.py`

- [ ] **Step 1:** Uji: file TSV contoh dengan header berulang dan baris kosong → jumlah baris benar.
- [ ] **Step 2:** Jalankan uji, pastikan gagal.
- [ ] **Step 3:** Implementasi pembaca `.tsv/.csv/.xlsx` → `bronze/file/{nama}`, mencakup `data/*.tsv`, `data-*.tsv`, dan berkas event XLSX di root repo.
- [ ] **Step 4:** Jalankan uji, pastikan lulus.
- [ ] **Step 5:** Jalankan terhadap berkas sungguhan; verifikasi jumlah baris cocok dengan `wc -l`.
- [ ] **Step 6:** Commit.

---

## Task 4: Silver otomatis + dimensi

**Files:** Create `lakehouse/transform/config.yaml`, `macros/typing.py`, `generate_auto_models.py`, `seeds/dim_*.csv`, `models/silver/dim_*.sql`

- [ ] **Step 1:** Uji makro konversi: `"1.234,56"`→`1234.56`, `"1.234"`→`1234`, `"-"`/`"n/a"`/`""`→`NULL`, `"2026-07"`→`2026-07-01`.
- [ ] **Step 2:** Jalankan uji, pastikan gagal.
- [ ] **Step 3:** Implementasi makro di `macros/typing.py`.
- [ ] **Step 4:** Jalankan uji, pastikan lulus.
- [ ] **Step 5:** Implementasi `generate_auto_models.py`: untuk tiap tabel Bronze, sampel nilai kolom → tentukan tipe kandidat → hasilkan model Silver SQL. Kolom dengan **tingkat keberhasilan konversi < 95%** tetap `string` dan dicatat sebagai peringatan (spec §9).
- [ ] **Step 6:** Buat seed `dim_negara.csv` (kode ISO + nama BPS + varian ejaan), `dim_pintu_masuk.csv`, `dim_indikator.csv` (28 indikator GCI/GPCI dari `lib/gci`), dan model `dim_periode.sql`, `dim_wilayah.sql`.
- [ ] **Step 7:** `sqlmesh plan` lalu `sqlmesh run`.
  Verifikasi: tabel Silver ada untuk setiap tabel Bronze; `dim_negara` memuat ≥ jumlah negara unik yang muncul di data wisman.
- [ ] **Step 8:** Commit.

---

## Task 5: Silver kurasi

**Files:** Create `lakehouse/transform/models/silver/curated/*.sql`, `lakehouse/transform/tests/*.yaml`

- [ ] **Step 1:** Uji fixture wisman: baris dengan nama negara varian (`"Rep. Rakyat Tiongkok"`, `"China"`, `"Tiongkok"`) → satu kode kanonik.
- [ ] **Step 2:** Jalankan uji, pastikan gagal.
- [ ] **Step 3:** Tulis model kurasi: `silver_wisman` (join `dim_negara` + `dim_periode` + `dim_pintu_masuk`), `silver_kunjungan_dtw`, `silver_restoran`, `silver_event`, `silver_atlas`.
- [ ] **Step 4:** Jalankan uji, pastikan lulus.
- [ ] **Step 5:** Tambah audit SQLMesh: `not_null` pada kunci, `accepted_values` pada kode negara, dan audit "tidak ada baris hilang dibanding Bronze".
- [ ] **Step 6:** `sqlmesh run`; verifikasi audit hijau dan baris tak terpetakan masuk tabel karantina.
- [ ] **Step 7:** Commit.

---

## Task 6: Gold + serving MergeTree

**Files:** Create `lakehouse/transform/models/gold/mart_*.sql`, `lakehouse/clickhouse/init/02-serving.sql`

- [ ] **Step 1:** Tulis mart: `mart_gci_readiness`, `mart_wisman`, `mart_kunjungan_dtw`, `mart_kuliner`, `mart_atlas`, `mart_event`.
- [ ] **Step 2:** `sqlmesh run`; verifikasi tiap mart punya baris dan `mart_gci_readiness` memuat 28 indikator.
- [ ] **Step 3:** Implementasi penyalinan Gold → MergeTree di database `serving`, memakai pola tabel bayangan + `EXCHANGE TABLES` (tukar atomik, spec §6.6).
- [ ] **Step 4:** Verifikasi: `serving.mart_wisman` jumlah barisnya sama dengan Gold; jalankan penyalinan dua kali untuk memastikan idempoten.
- [ ] **Step 5:** Commit.

---

## Task 7: Dagster — orkestrasi & lineage

**Files:** Create `lakehouse/orchestrate/pyproject.toml`, `lakehouse/orchestrate/dispar_lakehouse/definitions.py`; Modify `lakehouse/compose.yaml`

- [ ] **Step 1:** Definisikan aset Dagster: satu aset per sumber Bronze, aset SQLMesh untuk Silver & Gold, aset penyalinan serving. Ketergantungan antar-aset membentuk lineage.
- [ ] **Step 2:** Tambahkan jadwal harian dan sensor gagal.
- [ ] **Step 3:** Tambah `lake-dagster` ke compose; jalankan.
  Verifikasi: UI Dagster di `:13030` menampilkan grafik aset bronze→silver→gold; materialisasi satu aset berhasil.
- [ ] **Step 4:** Commit.

---

## Task 8: App v2 di atas ClickHouse

**Files:** Create `platform-v2/` (duplikat `platform/`), `platform-v2/lib/ch/{client,gci,wisman,sdi,atlas}.ts`; Modify halaman terkait

- [ ] **Step 1:** Duplikat `platform/` → `platform-v2/` (tanpa `node_modules`, `.next`); pasang `@clickhouse/client`.
- [ ] **Step 2:** Uji: `lib/ch/client.ts` menolak query dengan interpolasi string dan menerapkan `max_execution_time` + `max_result_rows`.
- [ ] **Step 3:** Jalankan uji, pastikan gagal; implementasi klien; jalankan lagi, pastikan lulus.
- [ ] **Step 4:** Implementasi modul query per domain membaca `serving.mart_*`.
- [ ] **Step 5:** Sambungkan halaman `/sdi`, `/gci`, `/gpci`, `/atlas` ke `lib/ch`, pertahankan bentuk respons `/api/*` agar `/docs` tetap sah.
- [ ] **Step 6:** Tulis uji paritas: untuk tiap endpoint, bandingkan keluaran v1 dan v2; perbedaan harus nol atau tercatat beserta alasannya.
- [ ] **Step 7:** `npm run build` di `platform-v2` — harus lulus.
- [ ] **Step 8:** Commit.

---

## Task 9: Halaman lineage & dokumentasi

**Files:** Create `platform-v2/app/lineage/`, `lakehouse/README.md`

- [ ] **Step 1:** Endpoint yang membaca metadata SQLMesh + snapshot Iceberg → silsilah per indikator.
- [ ] **Step 2:** Halaman `/lineage` menampilkan rantai bronze→silver→gold per indikator beserta waktu tarik & jumlah baris.
- [ ] **Step 3:** `lakehouse/README.md`: cara menjalankan, menyegarkan, backup, dan memindahkan ke server Depok.
- [ ] **Step 4:** Commit.

---

## Catatan penyimpangan

Rencana ini disusun sebelum stack pernah dijalankan. Integrasi Lakekeeper↔ClickHouse (Task 1 Step 6) dan kemampuan tulis Iceberg dari Python adalah dua titik yang paling mungkin memaksa penyesuaian. Setiap penyimpangan dari rencana dicatat di bagian ini saat eksekusi, beserta alasannya.
