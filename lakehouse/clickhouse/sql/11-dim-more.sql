-- Dimensi tambahan: periode, wilayah, indikator.

CREATE DATABASE IF NOT EXISTS silver;

-- ── dim_periode ────────────────────────────────────────────────────────────
-- Tulang punggung tanggal 2010–2030: tiap tanggal + turunan bulan/triwulan/tahun.
CREATE TABLE IF NOT EXISTS silver.dim_periode (
    tanggal Date, tahun UInt16, bulan_no UInt8, nama_bulan String,
    triwulan UInt8, semester UInt8
) ENGINE = ReplacingMergeTree ORDER BY tanggal;

TRUNCATE TABLE silver.dim_periode;
INSERT INTO silver.dim_periode
SELECT
    d AS tanggal,
    toYear(d) AS tahun,
    toMonth(d) AS bulan_no,
    ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus',
     'September','Oktober','November','Desember'][toMonth(d)] AS nama_bulan,
    toQuarter(d) AS triwulan,
    if(toMonth(d) <= 6, 1, 2) AS semester
FROM (
    SELECT toDate('2010-01-01') + toIntervalDay(number) AS d
    FROM numbers(toUInt32(toDate('2030-12-31') - toDate('2010-01-01')) + 1)
);

-- ── dim_wilayah ────────────────────────────────────────────────────────────
-- 6 kota/kabupaten administrasi DKI Jakarta + varian ejaan.
CREATE TABLE IF NOT EXISTS silver.dim_wilayah (
    match_key String, kode String, nama_wilayah String, tipe String
) ENGINE = ReplacingMergeTree ORDER BY match_key;

TRUNCATE TABLE silver.dim_wilayah;
INSERT INTO silver.dim_wilayah (match_key, kode, nama_wilayah, tipe)
SELECT kunci_cocok(varian), kode, nama, tipe FROM (
    SELECT arrayJoin(v) AS varian, kode, nama, tipe FROM (
        SELECT * FROM VALUES(
            'v Array(String), kode String, nama String, tipe String',
            (['jakarta pusat','jakpus','kota jakarta pusat'], '31.71', 'Jakarta Pusat', 'Kota'),
            (['jakarta utara','jakut','kota jakarta utara'], '31.72', 'Jakarta Utara', 'Kota'),
            (['jakarta barat','jakbar','kota jakarta barat'], '31.73', 'Jakarta Barat', 'Kota'),
            (['jakarta selatan','jaksel','kota jakarta selatan'], '31.74', 'Jakarta Selatan', 'Kota'),
            (['jakarta timur','jaktim','kota jakarta timur'], '31.75', 'Jakarta Timur', 'Kota'),
            (['kepulauan seribu','kep seribu','kabupaten kepulauan seribu','pulau seribu'], '31.01', 'Kepulauan Seribu', 'Kabupaten')
        )
    )
);

-- ── dim_indikator ──────────────────────────────────────────────────────────
-- 28 indikator GCI+GPCI dari bronze_file.gci_gpci_indicators (sumber: platform).
CREATE OR REPLACE VIEW silver.dim_indikator AS
SELECT
    bersih_teks(code)           AS kode,
    bersih_teks(framework)      AS framework,
    bersih_teks(dimension)      AS dimensi,
    bersih_teks(`group`)        AS grup,
    bersih_teks(name)           AS nama,
    bersih_teks(definition)     AS definisi,
    bersih_teks(owner)          AS pemilik,
    lower(bersih_teks(dataavailable)) IN ('true','1','ya') AS data_tersedia,
    bersih_teks(draftreadiness) AS readiness
FROM lake.`bronze_file.gci_gpci_indicators`;
