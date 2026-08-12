-- Tabel dimensi bersama (lapisan Silver).
-- Inilah nilai teknis inti proyek: tanpa dimensi kanonik, dataset lintas sumber
-- tak bisa di-join dan tiap indikator harus dihitung manual (kondisi lama).

CREATE DATABASE IF NOT EXISTS silver;

-- ── dim_negara ─────────────────────────────────────────────────────────────
-- Menyerap ejaan BPS yang tak konsisten (CHINA/Tiongkok, NOPEMBER, PHILIPINA…)
-- Satu baris per VARIAN; kolom kanonik dipakai untuk agregasi.
-- match_key = hasil kunci_cocok(nama_varian), dijodohkan ke data mentah.
CREATE TABLE IF NOT EXISTS silver.dim_negara (
    match_key   String,
    kode_iso3   String,
    nama_negara String,
    kawasan     String
) ENGINE = ReplacingMergeTree ORDER BY match_key;

TRUNCATE TABLE silver.dim_negara;
INSERT INTO silver.dim_negara (match_key, kode_iso3, nama_negara, kawasan)
SELECT kunci_cocok(varian) AS match_key, kode_iso3, nama_negara, kawasan
FROM (
    SELECT arrayJoin(varian_list) AS varian, kode_iso3, nama_negara, kawasan
    FROM (
        SELECT * FROM VALUES(
            'varian_list Array(String), kode_iso3 String, nama_negara String, kawasan String',
            (['amerika serikat','amerika','usa','united states','as'], 'USA', 'Amerika Serikat', 'Amerika'),
            (['australia'], 'AUS', 'Australia', 'Oseania'),
            (['bahrain'], 'BHR', 'Bahrain', 'Timur Tengah'),
            (['belanda','netherlands'], 'NLD', 'Belanda', 'Eropa'),
            (['china','cina','tiongkok','rrt','rep rakyat tiongkok','republik rakyat tiongkok'], 'CHN', 'Tiongkok', 'Asia'),
            (['hongkong','hong kong'], 'HKG', 'Hong Kong', 'Asia'),
            (['india'], 'IND', 'India', 'Asia'),
            (['inggris','united kingdom','uk','britania raya'], 'GBR', 'Inggris', 'Eropa'),
            (['jepang','japan'], 'JPN', 'Jepang', 'Asia'),
            (['jerman','germany'], 'DEU', 'Jerman', 'Eropa'),
            (['korea selatan','korsel','south korea','korea'], 'KOR', 'Korea Selatan', 'Asia'),
            (['malaysia'], 'MYS', 'Malaysia', 'Asia'),
            (['mesir','egypt'], 'EGY', 'Mesir', 'Afrika'),
            (['perancis','prancis','france'], 'FRA', 'Perancis', 'Eropa'),
            (['philipina','filipina','philippines','pilipina'], 'PHL', 'Filipina', 'Asia'),
            (['rusia','russia'], 'RUS', 'Rusia', 'Eropa'),
            (['saudi arabia','arab saudi','saudi'], 'SAU', 'Arab Saudi', 'Timur Tengah'),
            (['singapura','singapore'], 'SGP', 'Singapura', 'Asia'),
            (['taiwan'], 'TWN', 'Taiwan', 'Asia'),
            (['thailand'], 'THA', 'Thailand', 'Asia'),
            (['uni emirat arab','uea','uae','emirat arab'], 'ARE', 'Uni Emirat Arab', 'Timur Tengah'),
            (['crew wna','crew','awak kapal wna'], 'XCR', 'Crew (WNA)', 'Lainnya'),
            (['lainnya','others','other','dan lain lain','dll'], 'XXX', 'Lainnya', 'Lainnya')
        )
    )
);

-- ── dim_bulan ──────────────────────────────────────────────────────────────
-- Menyerap NOPEMBER (ejaan lama) → 11, dll.
CREATE TABLE IF NOT EXISTS silver.dim_bulan (
    match_key String, nomor UInt8, nama_bulan String
) ENGINE = ReplacingMergeTree ORDER BY match_key;

TRUNCATE TABLE silver.dim_bulan;
INSERT INTO silver.dim_bulan (match_key, nomor, nama_bulan)
SELECT kunci_cocok(varian), nomor, nama FROM (
    SELECT * FROM VALUES(
        'varian String, nomor UInt8, nama String',
        ('januari',1,'Januari'),('februari',2,'Februari'),('pebruari',2,'Februari'),
        ('maret',3,'Maret'),('april',4,'April'),('mei',5,'Mei'),('juni',6,'Juni'),
        ('juli',7,'Juli'),('agustus',8,'Agustus'),('september',9,'September'),
        ('oktober',10,'Oktober'),('november',11,'November'),('nopember',11,'November'),
        ('desember',12,'Desember')
    )
);
