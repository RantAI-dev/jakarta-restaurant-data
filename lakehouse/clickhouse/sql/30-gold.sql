-- Lapisan Gold: mart siap-saji, dimaterialisasi sebagai tabel MergeTree di
-- database `serving`. Inilah yang dibaca dashboard (app v2) — bukan view Silver,
-- yang men-scan Parquet dari object storage tiap query.
--
-- Pola tabel-bayangan + EXCHANGE (spec §6.6): dashboard tidak pernah melihat
-- tabel setengah-terisi. Publikasi balik ke Iceberg dilakukan terpisah oleh
-- langkah publish (pyiceberg), karena ClickHouse 26.7 belum bisa membuat tabel
-- di katalog REST.

CREATE DATABASE IF NOT EXISTS serving;

-- ── mart_wisman ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS serving.mart_wisman (
    kode_negara String,
    negara      String,
    kawasan     String,
    tahun       UInt16,
    bulan_no    UInt8,
    bulan       String,
    pintu_masuk String,
    jumlah      Float64
) ENGINE = MergeTree ORDER BY (tahun, kode_negara, bulan_no);

CREATE TABLE IF NOT EXISTS serving.mart_wisman_baru AS serving.mart_wisman;
TRUNCATE TABLE serving.mart_wisman_baru;

-- Bangun di tabel-bayangan dari Silver...
INSERT INTO serving.mart_wisman_baru
SELECT kode_negara, negara, kawasan,
       toUInt16(coalesce(tahun, 0)) AS tahun,
       toUInt8(coalesce(bulan_no, 0)) AS bulan_no,
       coalesce(bulan, '(tidak diketahui)') AS bulan,
       pintu_masuk, sum(jumlah) AS jumlah
FROM silver.wisman
GROUP BY kode_negara, negara, kawasan, tahun, bulan_no, bulan, pintu_masuk;

-- ...lalu tukar atomik: pembaca tak pernah melihat tabel setengah-terisi.
EXCHANGE TABLES serving.mart_wisman AND serving.mart_wisman_baru;
TRUNCATE TABLE serving.mart_wisman_baru;
