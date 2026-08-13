-- Silver kurasi: atlas — POI pariwisata terpadu dari 4 sumber sekunder
-- (restoran, souvenir, nightlife, pertunjukan) jadi satu tabel berlabel kategori.
-- Menutup mart_atlas yang sebelumnya dilewati (data atlas belum di lake).

CREATE DATABASE IF NOT EXISTS silver;

CREATE OR REPLACE VIEW silver.atlas AS
SELECT 'Restoran' AS kategori, bersih_teks(nama) AS nama,
       bersih_teks(alamat) AS alamat, bersih_teks(area) AS wilayah,
       angka_id(rating) AS rating, NULL AS koordinat
FROM lake.`bronze_file.atlas_restoran` WHERE bersih_teks(nama) IS NOT NULL
UNION ALL
SELECT 'Souvenir', bersih_teks(nama), bersih_teks(alamat),
       bersih_teks(kota_administrasi), angka_id(rating), bersih_teks(koordinat)
FROM lake.`bronze_file.atlas_souvenir` WHERE bersih_teks(nama) IS NOT NULL
UNION ALL
SELECT 'Nightlife', bersih_teks(nama), bersih_teks(alamat_kurasi),
       bersih_teks(kota_administrasi), angka_id(rating), bersih_teks(koordinat)
FROM lake.`bronze_file.atlas_nightlife` WHERE bersih_teks(nama) IS NOT NULL
UNION ALL
SELECT 'Pertunjukan', bersih_teks(nama_pertunjukan_name_of_performance),
       bersih_teks(tempat_pertunjukan_place_of_performance), NULL,
       NULL, NULL
FROM lake.`bronze_file.atlas_pertunjukan`
WHERE bersih_teks(nama_pertunjukan_name_of_performance) IS NOT NULL;
