/**
 * Basemap bersama untuk seluruh peta Atlas (Direktori Restoran, Toko Suvenir,
 * GMTI).
 *
 * Kenapa pindah dari CARTO Voyager: sejak CARTO mewajibkan API key, tile yang
 * diminta tanpa key dikirim dengan cap "API KEY REQUIRED" melintang di seluruh
 * peta. Verifikasi: ambil satu tile Voyager tanpa key, capnya kelihatan.
 *
 * Penggantinya Esri Light Gray Canvas — tanpa key, tanpa cap, dan alas abu-abu
 * mudanya justru membuat poligon kepadatan serta pin berwarna kita lebih
 * menonjol dibanding Voyager yang ramai. Label dipisah ke layer "Reference"
 * (overlay transparan) supaya nama jalan & tempat tetap ada seperti dulu.
 *
 * Alternatif yang ditolak: Esri World Street Map (jalannya oranye, bentrok
 * dengan warna aksen dan pin kita) dan OSM standar (gaya warna-warni bikin
 * choropleth susah dibaca, plus kebijakan pemakaiannya melarang trafik berat).
 */
import L, { type Map as LeafletMap } from "leaflet";

const ESRI =
  "https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray";

/**
 * Esri hanya menyediakan tile Light Gray Canvas sampai z16; di atas itu server
 * mengirim tile bertuliskan "Map data not yet available". Karena itu
 * maxNativeZoom dikunci di 16 dan Leaflet yang memperbesar tile z16 untuk zoom
 * 17–18 — pengguna tetap bisa zoom dalam tanpa melihat papan abu-abu.
 *
 * Batasnya 18, bukan 20 seperti Voyager dulu: di atas itu alasnya sudah terlalu
 * buram untuk berguna. Konsekuensi yang disadari — pada zoom sangat dalam peta
 * dasar kalah tajam dibanding Voyager. Untuk detail setingkat jalan, tiap pin
 * tetap punya tautan "Buka di Maps".
 */
const MAX_NATIVE_ZOOM = 16;
const MAX_ZOOM = 18;

const ATTRIBUTION =
  'Peta © <a href="https://www.esri.com">Esri</a> — sumber: Esri, HERE, Garmin, ' +
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

/**
 * Pasang alas + label ke peta Leaflet. Panggil sekali saat peta dibuat,
 * sebelum layer data ditambahkan.
 */
export function addBasemap(map: LeafletMap): void {
  L.tileLayer(`${ESRI}_Base/MapServer/tile/{z}/{y}/{x}`, {
    maxNativeZoom: MAX_NATIVE_ZOOM,
    maxZoom: MAX_ZOOM,
    attribution: ATTRIBUTION,
  }).addTo(map);

  // Label dipasang terpisah supaya nama jalan tetap terbaca di atas poligon
  // choropleth yang digambar belakangan.
  L.tileLayer(`${ESRI}_Reference/MapServer/tile/{z}/{y}/{x}`, {
    maxNativeZoom: MAX_NATIVE_ZOOM,
    maxZoom: MAX_ZOOM,
    pane: "shadowPane",
  }).addTo(map);
}

export const BASEMAP_MAX_ZOOM = MAX_ZOOM;
