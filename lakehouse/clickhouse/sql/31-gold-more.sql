-- Gold mart tambahan → database `serving` (MergeTree, dibaca dashboard).
-- Pola tabel-bayangan + EXCHANGE (tukar atomik) seperti mart_wisman.

CREATE DATABASE IF NOT EXISTS serving;

-- ── mart_gci_readiness ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS serving.mart_gci_readiness (
    kode String, framework String, dimensi String, grup String, nama String,
    definisi String, pemilik String, data_tersedia UInt8, readiness String,
    readiness_urut UInt8
) ENGINE = MergeTree ORDER BY (framework, kode);
CREATE TABLE IF NOT EXISTS serving.mart_gci_readiness_baru AS serving.mart_gci_readiness;
TRUNCATE TABLE serving.mart_gci_readiness_baru;
INSERT INTO serving.mart_gci_readiness_baru
SELECT kode, framework, dimensi, grup, nama, definisi, pemilik,
       toUInt8(data_tersedia) AS data_tersedia, readiness,
       multiIf(readiness='ready',2, readiness='partial',1, 0) AS readiness_urut
FROM silver.dim_indikator WHERE kode IS NOT NULL;
EXCHANGE TABLES serving.mart_gci_readiness AND serving.mart_gci_readiness_baru;
TRUNCATE TABLE serving.mart_gci_readiness_baru;

-- ── mart_kuliner ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS serving.mart_kuliner (
    wilayah String, kode_wilayah String, jenis_usaha String, tahun UInt16,
    jumlah_usaha UInt32, total_kapasitas Float64
) ENGINE = MergeTree ORDER BY (tahun, wilayah, jenis_usaha);
CREATE TABLE IF NOT EXISTS serving.mart_kuliner_baru AS serving.mart_kuliner;
TRUNCATE TABLE serving.mart_kuliner_baru;
INSERT INTO serving.mart_kuliner_baru
SELECT
    coalesce(wilayah, '(tidak diketahui)') AS wilayah,
    coalesce(kode_wilayah, '') AS kode_wilayah,
    coalesce(jenis_usaha, '(tidak diketahui)') AS jenis_usaha,
    toUInt16(coalesce(tahun, 0)) AS tahun,
    count() AS jumlah_usaha,
    sum(coalesce(kapasitas, 0)) AS total_kapasitas
FROM silver.restoran
GROUP BY wilayah, kode_wilayah, jenis_usaha, tahun;
EXCHANGE TABLES serving.mart_kuliner AND serving.mart_kuliner_baru;
TRUNCATE TABLE serving.mart_kuliner_baru;

-- ── mart_kunjungan_dtw ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS serving.mart_kunjungan_dtw (
    destinasi String, periode String, wisnus Float64, wisman Float64,
    total Float64, sumber String, tanggal_terbit Nullable(Date)
) ENGINE = MergeTree ORDER BY destinasi;
CREATE TABLE IF NOT EXISTS serving.mart_kunjungan_dtw_baru AS serving.mart_kunjungan_dtw;
TRUNCATE TABLE serving.mart_kunjungan_dtw_baru;
INSERT INTO serving.mart_kunjungan_dtw_baru
SELECT destinasi, coalesce(periode,'') AS periode,
       coalesce(wisnus,0), coalesce(wisman,0), coalesce(total,0),
       coalesce(sumber,''), tanggal_terbit
FROM silver.kunjungan_dtw;
EXCHANGE TABLES serving.mart_kunjungan_dtw AND serving.mart_kunjungan_dtw_baru;
TRUNCATE TABLE serving.mart_kunjungan_dtw_baru;

-- ── mart_atlas ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS serving.mart_atlas (
    kategori String, jumlah_poi UInt32, rata_rating Float64, ada_koordinat UInt32
) ENGINE = MergeTree ORDER BY kategori;
CREATE TABLE IF NOT EXISTS serving.mart_atlas_baru AS serving.mart_atlas;
TRUNCATE TABLE serving.mart_atlas_baru;
INSERT INTO serving.mart_atlas_baru
SELECT kategori, count() AS jumlah_poi,
       round(avgIf(rating, rating IS NOT NULL), 2) AS rata_rating,
       countIf(koordinat IS NOT NULL) AS ada_koordinat
FROM silver.atlas GROUP BY kategori;
EXCHANGE TABLES serving.mart_atlas AND serving.mart_atlas_baru;
TRUNCATE TABLE serving.mart_atlas_baru;

-- ── mart_event ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS serving.mart_event (
    tahun UInt16, jumlah_event UInt32
) ENGINE = MergeTree ORDER BY tahun;
CREATE TABLE IF NOT EXISTS serving.mart_event_baru AS serving.mart_event;
TRUNCATE TABLE serving.mart_event_baru;
INSERT INTO serving.mart_event_baru
SELECT toUInt16(coalesce(tahun,0)) AS tahun, count() AS jumlah_event
FROM silver.event GROUP BY tahun;
EXCHANGE TABLES serving.mart_event AND serving.mart_event_baru;
TRUNCATE TABLE serving.mart_event_baru;
