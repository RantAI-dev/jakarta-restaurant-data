#!/usr/bin/env node
/**
 * Importer naskah buku → halaman Fumadocs.
 *
 * Sumber  : ../buku-statistika-pariwisata-perkotaan/bab/*.md (repo naskah, terpisah)
 * Keluaran: content/docs/bagian-*, content/docs/lampiran (di-generate ulang tiap run)
 *
 * Yang TIDAK ikut: *-selfedit.md, kerangka.md, state/, placeholders.md — itu
 * dokumen kerja internal, bukan naskah.
 *
 * Jalankan: npm run import:book
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BOOK = path.resolve(ROOT, '..', 'buku-statistika-pariwisata-perkotaan', 'bab');
const OUT = path.join(ROOT, 'content', 'docs');

/** Peta bagian → bab, sesuai kerangka.md (tabel "Estimasi Halaman"). */
const PARTS = [
  {
    dir: 'bagian-1',
    title: 'Bagian I · Fondasi Pariwisata dan Kota Global',
    description: 'Mengapa peringkat kota global penting, dan dari mana angkanya berasal.',
    chapters: ['bab-01', 'bab-02'],
  },
  {
    dir: 'bagian-2',
    title: 'Bagian II · Metodologi dan Teknik Pengolahan Data',
    description: 'Bagaimana data kunjungan, pergerakan, dan industri pendukung diolah.',
    chapters: ['bab-03', 'bab-04', 'interlude-4-5'],
  },
  {
    dir: 'bagian-3',
    title: 'Bagian III · Indikator dan Pembobotan Global City Index',
    description: 'Apa yang sebenarnya diukur indeks, dan bagaimana bobotnya disusun.',
    chapters: ['bab-05', 'bab-06'],
  },
  {
    dir: 'bagian-4',
    title: 'Bagian IV · Aplikasi Statistika, Pemodelan, dan Kebijakan',
    description: 'Memakai angka untuk memodelkan, memvisualkan, dan mengambil keputusan.',
    chapters: ['bab-07', 'bab-08', 'bab-09'],
  },
];

/** Metadata per bab: file sumber + label sidebar. */
const CHAPTERS = {
  'bab-01': { file: 'bab-01-draft.md', label: 'Bab 1' },
  'bab-02': { file: 'bab-02-draft.md', label: 'Bab 2' },
  'bab-03': { file: 'bab-03-draft.md', label: 'Bab 3' },
  'bab-04': { file: 'bab-04-draft.md', label: 'Bab 4' },
  'interlude-4-5': { file: 'bab-04-interlude-4.5-draft.md', label: 'Interlude 4.5' },
  'bab-05': { file: 'bab-05-draft.md', label: 'Bab 5' },
  'bab-06': { file: 'bab-06-draft.md', label: 'Bab 6' },
  'bab-07': { file: 'bab-07-draft.md', label: 'Bab 7' },
  'bab-08': { file: 'bab-08-draft.md', label: 'Bab 8' },
  'bab-09': { file: 'bab-09-draft.md', label: 'Bab 9' },
};

const FIGURES_SRC = path.join(BOOK, 'assets', 'figures');
const FIGURES_OUT = path.join(ROOT, 'public', 'figures');
const DIAGRAM_DIR = path.join(ROOT, 'public', 'gambar');

/**
 * Diagram yang dibuat di repo ini (scripts/build-diagrams.mjs), bukan di repo
 * naskah — untuk bab yang sama sekali tidak punya visual.
 *
 * Naskah tidak memuat placeholder untuk visual ini, jadi posisinya ditentukan
 * di sini: disisipkan tepat setelah sub-bagian yang dirujuk `setelah`.
 * Begitu naskah kelak memuat placeholder sendiri, entri terkait tinggal dihapus.
 */
const DIAGRAM = [
  {
    bab: 'bab-01',
    setelah: 'Resonance: Perspektif Berbeda',
    tipe: 'Grafik',
    id: '1.1',
    berkas: 'grafik-1.1-struktur-tiga-indeks.svg',
    alt: 'Perbandingan dimensi Kearney Global City Index, GPCI, dan Resonance; dimensi yang memuat komponen pariwisata ditandai.',
  },
  {
    bab: 'bab-01',
    setelah: 'Accessibility: Lebih dari Bandara Besar',
    tipe: 'Grafik',
    id: '1.2',
    berkas: 'grafik-1.2-data-ke-dimensi.svg',
    alt: 'Alur empat jenis data pariwisata menuju dimensi indeks kota yang memakainya.',
  },
  {
    bab: 'bab-01',
    setelah: 'Multi-Sumber, Multi-Definisi',
    tipe: 'Tabel',
    id: '1.1',
    berkas: 'tabel-1.1-siapa-menghitung-apa.svg',
    alt: 'Dasar penghitungan kunjungan menurut BPS, Kementerian Pariwisata, Disparekraf daerah, operator bandara, dan OTA, beserta yang tidak tercakup masing-masing.',
  },
  {
    bab: 'bab-01',
    setelah: 'SDI dan Implikasinya untuk Statistik Pariwisata',
    tipe: 'Grafik',
    id: '1.3',
    berkas: 'grafik-1.3-rantai-satu-data.svg',
    alt: 'Rantai Satu Data Indonesia dari produsen data ke pengguna, tiga prasyarat Perpres 39/2019, dan titik yang masih putus.',
  },
  {
    bab: 'bab-02',
    setelah: 'Tiga Lembaga Inti',
    tipe: 'Grafik',
    id: '2.1',
    berkas: 'grafik-2.1-tiga-lembaga.svg',
    alt: 'Terbitan, frekuensi, dan granularitas data dari BPS, Kementerian Pariwisata, dan Disparekraf daerah.',
  },
  {
    bab: 'bab-02',
    setelah: 'Apa yang Bisa Dilakukan dengan Big Data, dan Apa yang Tidak',
    tipe: 'Tabel',
    id: '2.1',
    berkas: 'tabel-2.1-tradisional-vs-bigdata.svg',
    alt: 'Perbandingan sumber tradisional dan big data pada cakupan, granularitas, jeda rilis, bias, dan otoritas.',
  },
  {
    bab: 'bab-02',
    setelah: 'Satu Data Indonesia sebagai Kerangka Kebijakan',
    tipe: 'Grafik',
    id: '2.2',
    berkas: 'grafik-2.2-lapisan-data-lake.svg',
    alt: 'Lapisan data lake pariwisata daerah dari zona mentah ke data mart, dengan tata kelola Satu Data Indonesia yang melingkupinya.',
  },
  {
    bab: 'bab-02',
    setelah: 'Mekanisme Validasi yang Ada',
    tipe: 'Grafik',
    id: '2.3',
    berkas: 'grafik-2.3-mengapa-angka-berbeda.svg',
    alt: 'Dua angka kunjungan wisman Bali 2024 yang sama-sama benar, dan tiga mekanisme yang mendamaikannya.',
  },
  {
    bab: 'bab-06',
    setelah: 'Pra-Pemrosesan Teks',
    tipe: 'Grafik',
    id: '6.1',
    berkas: 'grafik-6.1-pipeline-text-mining.svg',
    alt: 'Enam langkah pra-pemrosesan ulasan daring, dari teks mentah sampai siap diberi skor sentimen.',
  },
  {
    bab: 'bab-09',
    setelah: 'Platform yang Bisa Dipakai',
    tipe: 'Grafik',
    id: '9.3',
    berkas: 'grafik-9.3-alur-crowdsourcing.svg',
    alt: 'Alur data crowdsourcing dari kontributor sampai publikasi, dengan empat masalah kualitas yang ditangani saat moderasi dan verifikasi.',
  },
  {
    bab: 'bab-02',
    setelah: 'Apa yang Masih Perlu Diperbaiki',
    tipe: 'Grafik',
    id: '2.4',
    berkas: 'grafik-2.4-kategori-event.svg',
    alt: 'Sepuluh nilai jenis event terbanyak pada katalog event Dinas Pariwisata; lima ejaan berbeda merujuk kategori musik yang sama.',
  },
  {
    bab: 'interlude-4-5',
    setelah: 'Peran MICE dan Korporat',
    tipe: 'Grafik',
    id: '4.5.4',
    berkas: 'grafik-4.5.4-kunjungan-dtw-jakarta.svg',
    alt: 'Lima belas destinasi wisata Jakarta dengan kunjungan tertinggi pada Juli 2025.',
  },
  {
    bab: 'interlude-4-5',
    setelah: 'Overtourism Tersegmentasi: Sudirman–Thamrin vs Kampung Kota',
    tipe: 'Grafik',
    id: '4.5.5',
    berkas: 'grafik-4.5.5-sebaran-event-jakarta.svg',
    alt: 'Peta sebaran event Jakarta semester I 2026 di atas batas kecamatan, dengan jumlah event per kota administrasi.',
  },
  {
    bab: 'bab-06',
    setelah: 'Limitasi dan Etika',
    tipe: 'Grafik',
    id: '6.2',
    berkas: 'grafik-6.2-volume-ulasan.svg',
    alt: 'Sebaran jumlah ulasan per venue untuk restoran, nightlife, dan toko suvenir Jakarta pada sumbu logaritmik, dengan median masing-masing kategori.',
  },
];

// ---------------------------------------------------------------- utilities

/** Buang penanda emphasis Markdown — judul frontmatter harus teks polos. */
function plainText(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(s) {
  return plainText(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s.-]/g, '')
    .replace(/\./g, '-')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Slug sub-bab: nomor + maksimal 6 kata pertama, biar URL tetap pendek. */
function sectionSlug(heading) {
  const m = plainText(heading).match(/^([0-9]+(?:\.[0-9]+)*)\s+(.*)$/);
  if (!m) return slugify(heading).slice(0, 60);
  const nomor = m[1].replace(/\./g, '-');
  const kata = m[2].split(/\s+/).slice(0, 6).join(' ');
  return `${nomor}-${slugify(kata)}`;
}

function yamlString(s) {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function jsxAttr(s) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * Jalankan `fn` hanya pada bagian di luar code fence, supaya isi blok kode
 * tidak ikut diutak-atik.
 */
function outsideCodeFences(md, fn) {
  return md
    .split(/(```[\s\S]*?```)/g)
    .map((chunk) => (chunk.startsWith('```') ? chunk : fn(chunk)))
    .join('');
}

// ------------------------------------------------------------ transformasi

/**
 * Berkas figure yang sudah dirender naskah, dikunci ke nomor visualnya.
 * Penamaannya konsisten: `grafik-3.1-moda-masuk.png`, `tabel-4.5.2-....png`.
 * Tanda hubung di akhir awalan penting agar 4.5 tidak menangkap 4.5.1.
 */
function petaFigure() {
  if (!fs.existsSync(FIGURES_SRC)) return new Map();

  return new Map(
    fs
      .readdirSync(FIGURES_SRC)
      .filter((f) => f.endsWith('.png'))
      .map((file) => {
        const m = file.match(/^(grafik|tabel|gambar)-([0-9]+(?:\.[0-9]+)*)-/);
        return m ? [`${m[1].toUpperCase()} ${m[2]}`, file] : null;
      })
      .filter(Boolean),
  );
}

/** Baca lebar & tinggi PNG dari header IHDR — hindari pergeseran tata letak. */
function ukuranPng(file) {
  const buf = fs.readFileSync(file);
  return { lebar: buf.readUInt32BE(16), tinggi: buf.readUInt32BE(20) };
}

/**
 * `[INSERT GRAFIK 3.1: deskripsi ...; sumber: BPS].` → gambar figure resmi
 * dari naskah, atau kartu "menyusul" bila figure-nya belum dirender.
 */
function transformPlaceholders(md, figures) {
  return md.replace(
    /\[INSERT\s+(GRAFIK|TABEL|GAMBAR)\s+([0-9]+(?:\.[0-9]+)*)\s*:\s*([\s\S]*?)\]\.?/g,
    (_full, tipe, id, isi) => {
      const teksPenuh = plainText(isi.replace(/\s+/g, ' ').trim());
      const label = tipe.charAt(0) + tipe.slice(1).toLowerCase();
      const berkas = figures.get(`${tipe} ${id}`);

      if (berkas) {
        // Keterangan dan sumber sudah tercetak di dalam gambar; di sini
        // dipakai sebagai teks alternatif untuk pembaca layar.
        const { lebar, tinggi } = ukuranPng(path.join(FIGURES_SRC, berkas));
        return `<GambarBuku tipe="${label}" id="${id}" src="/figures/${berkas}" lebar={${lebar}} tinggi={${tinggi}} alt="${jsxAttr(
          teksPenuh,
        )}" />`;
      }

      const teks = isi.replace(/\s+/g, ' ').trim();
      const m = teks.match(/^(.*?);\s*sumber:\s*(.*?)\.?$/i);
      const deskripsi = plainText(m ? m[1] : teks);
      const sumber = m ? plainText(m[2]) : '';

      return `<VisualMenyusul tipe="${label}" id="${id}" deskripsi="${jsxAttr(
        deskripsi,
      )}"${sumber ? ` sumber="${jsxAttr(sumber)}"` : ''} />`;
    },
  );
}

/** Peta figure dibaca sekali, dipakai semua halaman. */
let FIGURES = new Map();

/** Ukuran SVG dibaca dari atribut width/height pada elemen akarnya. */
function ukuranSvg(file) {
  const kepala = fs.readFileSync(file, 'utf8').slice(0, 400);
  return {
    lebar: Number(kepala.match(/\bwidth="(\d+)"/)?.[1] ?? 1200),
    tinggi: Number(kepala.match(/\bheight="(\d+)"/)?.[1] ?? 800),
  };
}

/**
 * Sisipkan diagram buatan repo ini ke akhir sub-bagian yang dirujuk.
 *
 * Dicocokkan dengan teks judul apa adanya; kalau judulnya berubah di naskah,
 * impor berhenti dengan galat alih-alih diam-diam menghilangkan diagram.
 */
function sisipkanDiagram(md, chapterId) {
  const untukBab = DIAGRAM.filter((d) => d.bab === chapterId);
  if (untukBab.length === 0) return md;

  let baris = md.split('\n');

  for (const d of untukBab) {
    const indeksJudul = baris.findIndex(
      (l) => l.startsWith('#') && plainText(l.replace(/^#+\s*/, '')) === d.setelah,
    );
    if (indeksJudul === -1) continue;

    // Akhir sub-bagian: judul berikutnya pada tingkat mana pun.
    let akhir = baris.findIndex((l, i) => i > indeksJudul && /^#{2,4}\s/.test(l));
    if (akhir === -1) akhir = baris.length;

    const { lebar, tinggi } = ukuranSvg(path.join(DIAGRAM_DIR, d.berkas));
    const markup = `<GambarBuku tipe="${d.tipe}" id="${d.id}" src="/gambar/${d.berkas}" lebar={${lebar}} tinggi={${tinggi}} alt="${jsxAttr(d.alt)}" />`;

    baris = [...baris.slice(0, akhir), '', markup, '', ...baris.slice(akhir)];
    d.terpasang = true;
  }

  return baris.join('\n');
}

function transformBody(md) {
  let out = md;

  // Autolink `<https://...>` bukan JSX yang sah di MDX — jadikan tautan biasa.
  out = outsideCodeFences(out, (c) => c.replace(/<(https?:\/\/[^>\s]+)>/g, '[$1]($1)'));

  // Sisa `<` adalah tanda "lebih kecil" dalam prosa (mis. `p<0,01`). MDX
  // membacanya sebagai awal JSX, jadi harus dilindungi. Dilakukan sebelum
  // komponen visual disisipkan, supaya JSX buatan sendiri tidak ikut kena.
  out = outsideCodeFences(out, (c) =>
    c
      .split(/(`[^`\n]*`)/g)
      .map((seg) => (seg.startsWith('`') ? seg : seg.replace(/</g, '&lt;')))
      .join(''),
  );

  out = transformPlaceholders(out, FIGURES);

  // Garis pemisah adalah penanda pergantian halaman cetak; tidak relevan di web.
  out = out.replace(/^---\s*$/gm, '');

  // Naikkan satu tingkat: H3 → H2, dst. Judul halaman sudah dari frontmatter,
  // sehingga daftar isi samping mulai dari H2.
  out = outsideCodeFences(out, (c) =>
    c.replace(/^(#{3,6})\s/gm, (_m, hashes) => '#'.repeat(hashes.length - 1) + ' '),
  );

  return out.replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

function page({ title, description, body }) {
  const fm = ['---', `title: ${yamlString(title)}`];
  if (description) fm.push(`description: ${yamlString(description)}`);
  fm.push('---', '');
  return fm.join('\n') + '\n' + body;
}

/** Pecah naskah bab jadi: intro (sebelum H2 pertama) + satu entri per H2. */
function splitChapter(raw) {
  const lines = raw.split('\n');
  const h1 = lines.findIndex((l) => l.startsWith('# '));
  const title = plainText(lines[h1].replace(/^#\s+/, ''));

  const sections = [];
  let intro = [];
  let current = null;

  for (const line of lines.slice(h1 + 1)) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current);
      current = { heading: plainText(line.replace(/^##\s+/, '')), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      intro.push(line);
    }
  }
  if (current) sections.push(current);

  return { title, intro: intro.join('\n'), sections };
}

// ------------------------------------------------------------------- tulis

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function writeMeta(dir, meta) {
  write(path.join(dir, 'meta.json'), JSON.stringify(meta, null, 2) + '\n');
}

function buildChapter(partDir, chapterId) {
  const cfg = CHAPTERS[chapterId];
  const raw = fs.readFileSync(path.join(BOOK, cfg.file), 'utf8');
  const { title, intro, sections } = splitChapter(raw);
  const dir = path.join(partDir, chapterId);

  const pages = ['index'];
  write(
    path.join(dir, 'index.mdx'),
    page({ title: 'Pengantar', description: title, body: transformBody(intro) }),
  );

  for (const s of sections) {
    const slug = sectionSlug(s.heading);
    pages.push(slug);
    write(
      path.join(dir, `${slug}.mdx`),
      page({
        title: s.heading,
        body: sisipkanDiagram(transformBody(s.lines.join('\n')), chapterId),
      }),
    );
  }

  writeMeta(dir, { title: `${cfg.label} · ${stripLabel(title, cfg.label)}`, pages });
  return { title, sections: sections.length };
}

/** "Bab 1: Konseptualisasi …" → "Konseptualisasi …" (label sudah di depan). */
function stripLabel(title, label) {
  return title
    .replace(/^Bab\s+[0-9]+\s*[:.]\s*/i, '')
    .replace(/^Interlude\s+[0-9.]+\s*[:.]\s*/i, '')
    .trim();
}

function buildLampiran() {
  const raw = fs.readFileSync(path.join(BOOK, 'lampiran.md'), 'utf8');
  const { sections } = splitChapter(raw);
  const dir = path.join(OUT, 'lampiran');

  const pages = [];
  for (const s of sections) {
    const slug = slugify(s.heading.replace(/^A\.([0-9]+)\s+/, 'a-$1 '));
    pages.push(slug);
    write(
      path.join(dir, `${slug}.mdx`),
      page({ title: s.heading, body: transformBody(s.lines.join('\n')) }),
    );
  }
  writeMeta(dir, { title: 'Lampiran', pages });
  return sections.length;
}

/**
 * Salin figure hasil render naskah ke public/, supaya edisi web memakai visual
 * yang persis sama dengan naskah cetak — bukan versi gambar ulang yang bisa
 * menyimpang setiap naskah diperbarui.
 */
function salinFigure() {
  fs.rmSync(FIGURES_OUT, { recursive: true, force: true });
  if (!fs.existsSync(FIGURES_SRC)) {
    console.log('figure: folder assets/figures tidak ada, dilewati');
    return;
  }

  fs.mkdirSync(FIGURES_OUT, { recursive: true });
  const files = fs.readdirSync(FIGURES_SRC).filter((f) => f.endsWith('.png'));
  for (const f of files) {
    fs.copyFileSync(path.join(FIGURES_SRC, f), path.join(FIGURES_OUT, f));
  }
  console.log(`figure: ${files.length} PNG → public/figures/`);
}

function main() {
  if (!fs.existsSync(BOOK)) {
    console.error(`Naskah tidak ditemukan di ${BOOK}`);
    console.error('Clone repo naskah sebagai sibling dari folder buku/ ini.');
    process.exit(1);
  }

  // Regenerasi bersih — halaman lama dari nama sub-bab yang berubah ikut hilang.
  for (const p of [...PARTS.map((p) => p.dir), 'lampiran']) {
    fs.rmSync(path.join(OUT, p), { recursive: true, force: true });
  }

  salinFigure();
  FIGURES = petaFigure();

  let totalHalaman = 0;
  for (const part of PARTS) {
    const partDir = path.join(OUT, part.dir);
    for (const c of part.chapters) {
      const { sections } = buildChapter(partDir, c);
      totalHalaman += sections + 1;
    }
    writeMeta(partDir, {
      title: part.title,
      description: part.description,
      pages: part.chapters,
    });
    console.log(`${part.dir}: ${part.chapters.length} bab`);
  }

  totalHalaman += buildLampiran();
  console.log(`lampiran: ok`);

  const luput = DIAGRAM.filter((d) => !d.terpasang);
  if (luput.length) {
    console.error(
      `\nDiagram tidak terpasang karena judul rujukannya tidak ada di naskah:\n` +
        luput.map((d) => `  ${d.tipe} ${d.id} → "${d.setelah}"`).join('\n'),
    );
    process.exit(1);
  }
  console.log(`diagram: ${DIAGRAM.length} SVG terpasang`);

  writeMeta(OUT, {
    title: 'Statistika Pariwisata Perkotaan',
    pages: ['index', ...PARTS.map((p) => p.dir), 'lampiran'],
  });

  console.log(`\n${totalHalaman} halaman naskah ditulis ke content/docs/.`);
}

main();
