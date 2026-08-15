# Lakehouse Platform Data Dispar

Arsitektur Lake House 3-lapis (Bronze/Silver/Gold) untuk data pariwisata DKI —
menutup item K3 MoM 13 Juli. Seluruh komponen **Apache 2.0** (lihat
`../docs/superpowers/specs/2026-08-12-lakehouse-design.md`).

```
SDI + berkas  →  dlt  →  Iceberg @ RustFS  →  ClickHouse  →  (app v2)
                        (katalog Lakekeeper)   query engine
                Bronze  ──►  Silver  ──►  Gold (serving MergeTree)
```

## Komponen (semua Apache 2.0)

| Service | Host port | Peran |
|---|---|---|
| `lake-rustfs` | 19000 / 19001 | object storage S3 (single-node) |
| `lake-catalog` (Lakekeeper) | 18181 | katalog Iceberg REST |
| `lake-clickhouse` | 18123 / 19440 | **satu-satunya query engine** + serving |
| `lake-meta` (Postgres) | 15433 | metadata katalog/SQLMesh/Dagster |
| `lake-ingest` (profil `tools`) | — | dlt ingestion, on-demand |

## Menjalankan dari nol

```bash
cd lakehouse
cp .env.example .env          # ganti sandi sebelum produksi
docker compose up -d          # naikkan RustFS + Lakekeeper + ClickHouse + meta
./scripts/bootstrap.sh        # bootstrap katalog + buat bucket + daftarkan warehouse

# Bronze: tarik data mentah ke Iceberg
docker compose --profile tools build lake-ingest
docker compose --profile tools run --rm lake-ingest python -m dispar_ingest.run_bronze sdi
docker compose --profile tools run --rm lake-ingest python -m dispar_ingest.run_bronze files

# Sambungkan ClickHouse ke katalog (sekali; hilang bila container dibuat ulang)
docker exec lake-clickhouse clickhouse-client --user dispar --password "$CH_PASSWORD" -q "
  CREATE DATABASE IF NOT EXISTS lake
  ENGINE = DataLakeCatalog('http://lake-catalog:8181/catalog', '\$S3_ACCESS_KEY', '\$S3_SECRET_KEY')
  SETTINGS catalog_type='rest', storage_endpoint='http://lake-rustfs:9000/lakehouse', warehouse='dispar'"

# Silver + Gold
./scripts/apply-sql.sh                                   # fungsi konversi + dimensi + mart wisman
cd transform && uv run --with clickhouse-connect python generate_silver.py   # 180 view Silver otomatis
```

## Lapisan

- **Bronze** (`lake.\`bronze_sdi.*\``, `bronze_file.*`) — Iceberg, semua kolom
  String, apa adanya + kolom audit (`_ingested_at`, `_source_url`, `_batch_id`,
  `_row_hash`, `_tenant`). Append/overwrite per batch; riwayat di snapshot Iceberg.
- **Silver** (`silver.*`) — view ClickHouse bertipe. Inferensi otomatis
  (`generate_silver.py`, ambang 95% konversi) + kurasi tangan (`clickhouse/sql/`)
  + dimensi bersama (`dim_negara`, `dim_bulan`) yang membersihkan klasifikasi BPS.
- **Gold** (`serving.mart_*`) — tabel MergeTree teragregasi, dibaca dashboard.
  Pola tabel-bayangan + `EXCHANGE TABLES` (tukar atomik).

## Regenerasi harian

`./scripts/apply-sql.sh` idempoten (semua `CREATE OR REPLACE`). Untuk refresh
penuh: ulang ingest Bronze → `apply-sql.sh` → `generate_silver.py`.

## Operasional base (backup, quality, maintenance, alert)

Aset Dagster grup `ops` + gate kualitas di alur utama. Semua bisa dijalankan
manual lewat image ingest juga.

**Backup** (`dispar_ingest.backup`) — mirror inkremental bucket Iceberg (S3→S3).
Default ke bucket `lakehouse-backup` di RustFS yang sama (proteksi salah-hapus).
Untuk **proteksi disk/host mati**, set `BACKUP_S3_ENDPOINT/KEY/SECRET` ke object
storage lain. Restore: `python -m dispar_ingest.backup restore <tgl> [bucket]`.
Jadwal: aset `backup_lake`, harian 04:00.

**Quality gate + karantina** (`dispar_ingest.quality`) — aset `quality_gate`
(antara Silver & Gold): karantina baris gagal-konversi → `_silver_meta.karantina`,
deteksi anomali (row-count anjlok >50%, null-rate kolom terpromosi >5%) →
`_silver_meta.quality`. Manual gate: `python -m dispar_ingest.quality --gate`.

**Iceberg maintenance** (`dispar_ingest.maintenance`) — expire snapshot lama
(retensi default 7 hari, `ICEBERG_RETENTION_DAYS`) supaya metadata/storage tak
menggembung. Jadwal: aset `iceberg_maintenance`, harian 04:00.

**Alerting** (`dispar_ingest.notify`) — sensor Dagster `alert_on_failure` kirim
webhook saat run gagal; `quality_gate` juga alert saat menemukan masalah. Set
`ALERT_WEBHOOK_URL` (Slack/Discord/generic). Kosong = hanya log.

## Catatan penting

- **ClickHouse 26.7 hanya BISA MEMBACA** tabel Iceberg dari katalog REST dan
  menyisipkan ke tabel yang sudah ada (di balik flag `allow_insert_into_iceberg`,
  masih beta). Ia **belum bisa MEMBUAT** tabel di katalog. Karena itu Silver/Gold
  dimaterialisasi sebagai tabel/tampilan native ClickHouse; publikasi Gold balik
  ke Iceberg (untuk portabilitas Oracle/Trino) dilakukan lewat pyiceberg — belum
  diimplementasi (lihat plan tahap lanjutan).
- **RustFS single-node**: mode terdistribusi masih "under testing" di 1.0.0-rc.
  Ketahanan dari backup, bukan cluster. Backup: `rclone sync` volume `lake_data`.

## Deploy ke server 187 (Portainer)

Stack ini dirancang untuk berjalan di server Depok (`192.168.18.187`, Portainer
endpoint 3) berdampingan dengan `dispar-platform`. Port host di atas sudah dicek
tidak bentrok dengan container yang ada di sana. Deploy sebagai Portainer Git
stack menunjuk `lakehouse/compose.yaml`, atau `docker compose up -d` langsung di
host. Verifikasi RAM bebas sebelum menaikkan (stack idle ±1–2 GB, batas ±8 GB).
