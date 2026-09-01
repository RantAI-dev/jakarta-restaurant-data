/**
 * Primitif SVG bersama untuk gambar buatan repo ini.
 *
 * Dipakai `build-diagrams.mjs` (diagram konseptual) dan `build-charts.mjs`
 * (grafik dari data). Palet dan huruf mengikuti `bab/assets/theme.py` di repo
 * naskah, supaya gambar dari kedua sumber duduk berdampingan tanpa terlihat
 * berasal dari dua dunia berbeda.
 */
import fs from 'node:fs';
import path from 'node:path';

export const W = 1200;

export const C = {
  primary: '#1a2b42',
  secondary: '#4a6fa5',
  accent: '#b5651d',
  neutral: '#6b7280',
  light: '#e5e7eb',
  text: '#1a1a1a',
  pale: '#eef4f9',
  paleAccent: '#f7ede2',
};

export const FONT = 'Liberation Sans, Arial, Helvetica, sans-serif';

export const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Pemenggalan baris sederhana berdasarkan perkiraan lebar karakter. */
export function baris(teksAsal, maksKarakter) {
  const kata = String(teksAsal).split(/\s+/);
  const hasil = [];
  let kini = '';
  for (const k of kata) {
    if ((kini + ' ' + k).trim().length > maksKarakter && kini) {
      hasil.push(kini);
      kini = k;
    } else {
      kini = (kini + ' ' + k).trim();
    }
  }
  if (kini) hasil.push(kini);
  return hasil;
}

export function teks(x, y, isi, o = {}) {
  const {
    ukuran = 15,
    warna = C.text,
    tebal = 400,
    anchor = 'start',
    miring = false,
    lebarKarakter,
    tinggiBaris = 1.32,
  } = o;
  const potongan = lebarKarakter ? baris(isi, lebarKarakter) : [String(isi)];
  return potongan
    .map(
      (b, i) =>
        `<text x="${x}" y="${y + i * ukuran * tinggiBaris}" font-family="${FONT}" font-size="${ukuran}" ` +
        `font-weight="${tebal}" fill="${warna}" text-anchor="${anchor}"` +
        `${miring ? ' font-style="italic"' : ''}>${esc(b)}</text>`,
    )
    .join('\n');
}

export function kotak(x, y, w, h, o = {}) {
  const { isi = '#ffffff', garis = C.light, tebalGaris = 1.2, radius = 4 } = o;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${radius}" fill="${isi}" stroke="${garis}" stroke-width="${tebalGaris}"/>`;
}

export function panah(x1, y1, x2, y2, o = {}) {
  const { warna = C.neutral, putus = false } = o;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${warna}" stroke-width="1.6" marker-end="url(#ujung)"${
    putus ? ' stroke-dasharray="5 4"' : ''
  }/>`;
}

/**
 * Keterangan dan sumber dicetak di dalam gambar, sama seperti figure
 * matplotlib naskah, supaya edisi web dan cetak tidak perlu mengulangnya.
 */
export function keterangan(y, isi, sumber) {
  const potongan = baris(`${isi} Sumber: ${sumber}`, 128);
  return {
    svg: potongan
      .map((b, i) => teks(48, y + i * 20, b, { ukuran: 13, warna: C.neutral, miring: true }))
      .join('\n'),
    tinggi: potongan.length * 20,
  };
}

export function svgDoc(tinggi, isi) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${tinggi}" width="${W}" height="${tinggi}" role="img">
<defs>
  <marker id="ujung" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0 0 L10 5 L0 10 z" fill="${C.neutral}"/>
  </marker>
</defs>
<rect width="${W}" height="${tinggi}" fill="#ffffff"/>
${isi}
</svg>
`;
}

export function tulisSvg(dir, nama, tinggi, isi) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, nama), svgDoc(tinggi, isi));
  console.log(`  ${nama}`);
}

/** Angka dengan pemisah ribuan gaya Indonesia. */
export const angka = (n) => Number(n).toLocaleString('id-ID');
