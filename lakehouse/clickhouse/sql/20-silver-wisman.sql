-- Silver kurasi: wisman per negara & bulan, dengan klasifikasi BPS dibersihkan
-- dan periode dinormalisasi (menutup MoM TL3).
--
-- Baris yang kebangsaan-nya tak terpetakan ke dim_negara TIDAK dibuang — masuk
-- ke silver.wisman_karantina supaya bisa ditinjau, bukan hilang diam-diam.

CREATE DATABASE IF NOT EXISTS silver;

CREATE OR REPLACE VIEW silver.wisman AS
WITH src AS (
    SELECT
        kebangsaan AS kebangsaan_asli,
        bulan      AS bulan_asli,
        wisman     AS jumlah,
        tahun_dari(periode_data) AS tahun,
        kunci_cocok(kebangsaan) AS k_negara,
        kunci_cocok(bulan)      AS k_bulan
    FROM silver.data_jumlah_kunjungan_dan_ranking_wisatawan_mancanegara_ke_provinsi_dki_jakarta_melalui_pintu_soekarno_hatta_berdasarkan_kebangsaan
    WHERE wisman IS NOT NULL
)
SELECT
    n.kode_iso3            AS kode_negara,
    n.nama_negara          AS negara,
    n.kawasan              AS kawasan,
    b.nomor                AS bulan_no,
    b.nama_bulan           AS bulan,
    src.tahun              AS tahun,
    'Soekarno-Hatta'       AS pintu_masuk,
    src.jumlah             AS jumlah,
    src.kebangsaan_asli    AS kebangsaan_asli
FROM src
INNER JOIN silver.dim_negara n ON n.match_key = src.k_negara
LEFT  JOIN silver.dim_bulan  b ON b.match_key = src.k_bulan;

-- Baris yang gagal dipetakan ke negara kanonik — untuk ditinjau, bukan dibuang.
CREATE OR REPLACE VIEW silver.wisman_karantina AS
SELECT DISTINCT kebangsaan AS kebangsaan_tak_terpetakan
FROM silver.data_jumlah_kunjungan_dan_ranking_wisatawan_mancanegara_ke_provinsi_dki_jakarta_melalui_pintu_soekarno_hatta_berdasarkan_kebangsaan
WHERE kebangsaan IS NOT NULL
  AND kunci_cocok(kebangsaan) NOT IN (SELECT match_key FROM silver.dim_negara);
