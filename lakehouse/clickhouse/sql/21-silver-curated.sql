-- Silver kurasi tambahan: restoran (kuliner), kunjungan DTW, event.
-- Masing-masing menormalkan wilayah/periode lewat dimensi bersama.

CREATE DATABASE IF NOT EXISTS silver;

-- ── silver.restoran ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW silver.restoran AS
SELECT
    bersih_teks(nama_usaha)        AS nama,
    bersih_teks(alamat_usaha)      AS alamat,
    w.nama_wilayah                 AS wilayah,
    w.kode                         AS kode_wilayah,
    bersih_teks(jenis_usaha)       AS jenis_usaha,
    bersih_teks(badan_usaha)       AS badan_usaha,
    angka_id(kapasitas)            AS kapasitas,
    tahun_dari(periode_data)           AS tahun
FROM silver.data_usaha_jasa_makanan_dan_minuman_jenis_usaha_restoran_di_dki_jakarta r
LEFT JOIN silver.dim_wilayah w ON w.match_key = kunci_cocok(r.wilayah);

-- ── silver.kunjungan_dtw ───────────────────────────────────────────────────
-- 31 destinasi wisata (DTW), sumber berkas kerja bulanan.
CREATE OR REPLACE VIEW silver.kunjungan_dtw AS
SELECT
    bersih_teks(destinasi)                       AS destinasi,
    angka_id(wisnus)                             AS wisnus,
    wisman                                       AS wisman,
    total                                        AS total,
    bersih_teks(satuan_cakupan)                  AS cakupan,
    bersih_teks(sumber_nama)                     AS sumber,
    tanggal_id(tanggal_terbit)                   AS tanggal_terbit,
    bersih_teks(periode_angka)                   AS periode
FROM silver.kunjungan_31_dtw_juli_2026_sumber_mentah
WHERE bersih_teks(destinasi) IS NOT NULL;

-- ── silver.event ───────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW silver.event AS
SELECT
    bersih_teks(nama_event)  AS nama_event,
    bersih_teks(tempat)      AS tempat,
    periode_data             AS tanggal,
    tahun_dari(periode_data)     AS tahun
FROM silver.data_event_pariwisata_dan_kebudayaan_dki_jakarta_2011_2019
WHERE bersih_teks(nama_event) IS NOT NULL;
