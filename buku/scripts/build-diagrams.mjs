#!/usr/bin/env node
/**
 * Bangun diagram buku sebagai SVG.
 *
 * Diagram berlabel dibuat dengan kode, bukan model gambar: model gambar tidak
 * bisa dipercaya menulis label — apalagi bahasa Indonesia — dan hasilnya huruf
 * palsu yang mirip kata tetapi bukan.
 *
 * Palet dan huruf mengikuti `bab/assets/theme.py` di repo naskah, supaya
 * diagram ini duduk berdampingan dengan 32 figure matplotlib tanpa terlihat
 * berasal dari dua dunia berbeda.
 *
 * Keluaran: public/gambar/*.svg — dipasang ke halaman oleh scripts/import-book.mjs.
 * Jalankan: npm run diagrams:build
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  C,
  W,
  angka,
  baris,
  keterangan,
  kotak,
  panah,
  teks,
  tulisSvg,
} from './svg-kit.mjs';

const OUT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'public',
  'gambar',
);

const tulis = (nama, tinggi, isi) => tulisSvg(OUT, nama, tinggi, isi);

/** Kartu berjudul: bilah judul di atas, isi berupa daftar butir. */
function kartu(x, y, w, { judul, butir, warnaJudul = C.primary, tinggiButir = 30, padding = 16 }) {
  const tinggiJudul = 38;
  const potongan = butir.map((b) => (typeof b === 'string' ? { teks: b } : b));
  const tinggi =
    tinggiJudul +
    padding +
    potongan.reduce(
      (t, b) => t + Math.max(1, baris(b.teks, Math.floor((w - padding * 2) / 7.4)).length) * tinggiButir,
      0,
    );

  const bagian = [
    kotak(x, y, w, tinggi, { garis: C.light }),
    `<path d="M${x} ${y + 4} a4 4 0 0 1 4 -4 h${w - 8} a4 4 0 0 1 4 4 v${tinggiJudul - 4} h-${w} z" fill="${warnaJudul}"/>`,
    teks(x + padding, y + 25, judul, { ukuran: 16, warna: '#ffffff', tebal: 700 }),
  ];

  let ky = y + tinggiJudul + padding + 8;
  for (const b of potongan) {
    const warna = b.tandai ? C.accent : C.text;
    if (b.tandai) {
      bagian.push(
        `<rect x="${x + padding - 8}" y="${ky - 16}" width="${w - padding * 2 + 16}" height="${tinggiButir - 4}" rx="3" fill="${C.paleAccent}"/>`,
      );
    }
    bagian.push(
      `<circle cx="${x + padding + 2}" cy="${ky - 5}" r="2.6" fill="${b.tandai ? C.accent : C.secondary}"/>`,
    );
    const isiBaris = baris(b.teks, Math.floor((w - padding * 2) / 7.4));
    bagian.push(
      teks(x + padding + 14, ky, isiBaris.join(' '), {
        ukuran: 14,
        warna,
        tebal: b.tandai ? 600 : 400,
        lebarKarakter: Math.floor((w - padding * 2 - 14) / 7.2),
        tinggiBaris: tinggiButir / 14,
      }),
    );
    ky += isiBaris.length * tinggiButir;
  }

  return { svg: bagian.join('\n'), tinggi };
}

/** Kotak proses dalam alur; kembalikan svg + titik sambung. */
function langkah(x, y, w, h, label, o = {}) {
  const { isi = C.pale, garis = C.secondary, warnaTeks = C.primary, ukuran = 14, tebal = 600 } = o;
  const isiBaris = baris(label, Math.floor(w / 7.6));
  const mulaiY = y + h / 2 - ((isiBaris.length - 1) * ukuran * 1.25) / 2 + 5;
  return (
    kotak(x, y, w, h, { isi, garis, tebalGaris: 1.4 }) +
    '\n' +
    teks(x + w / 2, mulaiY, label, {
      ukuran,
      warna: warnaTeks,
      tebal,
      anchor: 'middle',
      lebarKarakter: Math.floor(w / 7.6),
      tinggiBaris: 1.25,
    })
  );
}

function tabel(x, y, w, kolom, baris_, lebarKolom) {
  const tinggiKepala = 42;
  const padding = 12;
  const lebar = lebarKolom.map((f) => f * w);
  const batas = lebar.reduce((a, l) => [...a, a[a.length - 1] + l], [x]);

  const bagian = [];
  bagian.push(`<rect x="${x}" y="${y}" width="${w}" height="${tinggiKepala}" fill="${C.primary}"/>`);
  kolom.forEach((k, i) =>
    bagian.push(
      teks(batas[i] + padding, y + 27, k, { ukuran: 14, warna: '#ffffff', tebal: 700 }),
    ),
  );

  let by = y + tinggiKepala;
  baris_.forEach((r, ri) => {
    const potongan = r.map((sel, i) =>
      baris(sel, Math.floor((lebar[i] - padding * 2) / 6.6)),
    );
    const tinggi = Math.max(...potongan.map((p) => p.length)) * 21 + 18;
    if (ri % 2 === 1) {
      bagian.push(`<rect x="${x}" y="${by}" width="${w}" height="${tinggi}" fill="#f7f8fa"/>`);
    }
    r.forEach((sel, i) =>
      bagian.push(
        teks(batas[i] + padding, by + 26, sel, {
          ukuran: 13,
          warna: i === 0 ? C.primary : C.text,
          tebal: i === 0 ? 600 : 400,
          lebarKarakter: Math.floor((lebar[i] - padding * 2) / 6.6),
          tinggiBaris: 21 / 13,
        }),
      ),
    );
    bagian.push(
      `<line x1="${x}" y1="${by + tinggi}" x2="${x + w}" y2="${by + tinggi}" stroke="${C.light}" stroke-width="1"/>`,
    );
    by += tinggi;
  });

  return { svg: bagian.join('\n'), tinggi: by - y };
}

// ------------------------------------------------------------------ diagram

/** GRAFIK 1.1 — struktur dimensi tiga indeks. */
function grafik11() {
  const lebar = 352;
  const jarak = 24;
  const x0 = 48;
  const indeks = [
    {
      judul: 'Kearney Global City Index',
      butir: [
        'Business Activity',
        'Human Capital',
        'Information Exchange',
        { teks: 'Cultural Experience', tandai: true },
        'Political Engagement',
      ],
    },
    {
      judul: 'GPCI (Mori Memorial Foundation)',
      butir: [
        'Economy',
        'Research and Development',
        { teks: 'Cultural Interaction', tandai: true },
        'Livability',
        { teks: 'Accessibility', tandai: true },
        'Environment',
      ],
    },
    {
      judul: "Resonance World's Best Cities",
      butir: ['Livability', { teks: 'Lovability', tandai: true }, 'Prosperity'],
    },
  ];

  const bagian = [teks(48, 44, 'Struktur dimensi tiga pemeringkatan kota', { ukuran: 19, tebal: 700 })];
  let tinggiMaks = 0;
  indeks.forEach((ind, i) => {
    const k = kartu(x0 + i * (lebar + jarak), 70, lebar, ind);
    bagian.push(k.svg);
    tinggiMaks = Math.max(tinggiMaks, k.tinggi);
  });

  const yLegenda = 70 + tinggiMaks + 26;
  bagian.push(`<rect x="48" y="${yLegenda - 12}" width="14" height="14" rx="3" fill="${C.paleAccent}" stroke="${C.accent}"/>`);
  bagian.push(teks(70, yLegenda, 'Dimensi yang memuat komponen pariwisata secara langsung', { ukuran: 13, warna: C.neutral }));

  const ket = keterangan(
    yLegenda + 34,
    'Kearney memakai lima dimensi, GPCI enam, Resonance tiga. Pariwisata tidak berdiri sebagai dimensi tersendiri di ketiganya; ia masuk lewat dimensi budaya, konektivitas, dan reputasi.',
    'naskah subbab 1.1, diolah.',
  );
  bagian.push(ket.svg);
  tulis('grafik-1.1-struktur-tiga-indeks.svg', yLegenda + 34 + ket.tinggi + 20, bagian.join('\n'));
}

/** GRAFIK 1.2 — dari data pariwisata ke dimensi indeks. */
function grafik12() {
  const bagian = [teks(48, 44, 'Dari data pariwisata ke dimensi indeks kota', { ukuran: 19, tebal: 700 })];
  const kiri = [
    'Kunjungan dan lama tinggal',
    'Atraksi, museum, warisan budaya',
    'Akomodasi, kuliner, nightlife',
    'Ulasan daring dan media sosial',
  ];
  const kanan = [
    ['Cultural Experience', 'Kearney'],
    ['Human Capital', 'Kearney'],
    ['Cultural Interaction', 'GPCI'],
    ['Accessibility', 'GPCI'],
    ['Lovability', 'Resonance'],
  ];
  const hubungan = [
    [0, 2],
    [0, 3],
    [1, 0],
    [2, 0],
    [2, 1],
    [3, 4],
  ];

  const xKiri = 48;
  const wKiri = 300;
  const xKanan = 800;
  const wKanan = 352;
  const y0 = 86;
  const tinggiKiri = 76;
  const jarakKiri = 96;
  const tinggiKanan = 62;
  const jarakKanan = 78;

  kiri.forEach((k, i) =>
    bagian.push(langkah(xKiri, y0 + i * jarakKiri, wKiri, tinggiKiri, k, { isi: '#ffffff', garis: C.primary })),
  );
  kanan.forEach(([judul, indeks], i) => {
    const y = y0 + i * jarakKanan;
    bagian.push(kotak(xKanan, y, wKanan, tinggiKanan, { isi: C.paleAccent, garis: C.accent, tebalGaris: 1.4 }));
    bagian.push(teks(xKanan + 16, y + 26, judul, { ukuran: 14, tebal: 600, warna: C.primary }));
    bagian.push(teks(xKanan + 16, y + 46, indeks, { ukuran: 12, warna: C.neutral }));
  });

  hubungan.forEach(([a, b]) =>
    bagian.push(
      panah(
        xKiri + wKiri + 6,
        y0 + a * jarakKiri + tinggiKiri / 2,
        xKanan - 8,
        y0 + b * jarakKanan + tinggiKanan / 2,
        { warna: C.light },
      ),
    ),
  );

  const yBawah = y0 + Math.max(kiri.length * jarakKiri, kanan.length * jarakKanan) + 10;
  const ket = keterangan(
    yBawah,
    'Empat jenis data pariwisata yang dikumpulkan kota, dan dimensi indeks yang memakainya. Satu jenis data dapat menyumbang ke lebih dari satu dimensi, sehingga perbaikan satu sumber data berdampak pada beberapa skor sekaligus.',
    'naskah subbab 1.2, diolah.',
  );
  bagian.push(ket.svg);
  tulis('grafik-1.2-data-ke-dimensi.svg', yBawah + ket.tinggi + 20, bagian.join('\n'));
}

/** TABEL 1.1 — siapa menghitung apa. */
function tabel11() {
  const bagian = [teks(48, 44, 'Siapa menghitung kunjungan, dan atas dasar apa', { ukuran: 19, tebal: 700 })];
  const t = tabel(
    48,
    70,
    W - 96,
    ['Lembaga', 'Dasar penghitungan', 'Yang tidak tercakup'],
    [
      ['BPS', 'Pintu masuk imigrasi: bandara, pelabuhan, pos lintas batas', 'Pelintas jalur tidak resmi; pergerakan di dalam kota'],
      ['Kementerian Pariwisata', 'Data yang sama dengan BPS, disajikan dan dikelompokkan berbeda', 'Selisih penyajian membuat angkanya tidak selalu identik dengan BPS'],
      ['Disparekraf daerah', 'Data hotel, restoran, dan event di yurisdiksinya', 'Wisatawan yang tidak menginap di akomodasi berizin'],
      ['Operator bandara', 'Passenger throughput di terminal', 'Wisatawan yang masuk lewat moda lain; penumpang transit ikut terhitung'],
      ['OTA (Traveloka, Tiket.com)', 'Transaksi pemesanan di platform sendiri', 'Pemesanan langsung, walk-in, dan platform pesaing'],
    ],
    [0.2, 0.42, 0.38],
  );
  bagian.push(t.svg);
  const ket = keterangan(
    70 + t.tinggi + 30,
    'Tidak ada satu angka pasti untuk "kunjungan ke Kota X"; yang ada adalah rentang estimasi yang bergantung pada definisi dan metode pencatatan.',
    'naskah subbab 1.3, diolah.',
  );
  bagian.push(ket.svg);
  tulis('tabel-1.1-siapa-menghitung-apa.svg', 70 + t.tinggi + 30 + ket.tinggi + 20, bagian.join('\n'));
}

/** GRAFIK 1.3 — rantai Satu Data Indonesia. */
function grafik13() {
  const bagian = [teks(48, 44, 'Rantai Satu Data Indonesia untuk data pariwisata', { ukuran: 19, tebal: 700 })];
  const y = 90;
  const h = 92;
  const w = 236;
  const jarak = 42;
  const rantai = [
    'Produsen data\n(imigrasi, hotel, dinas)',
    'Walidata\n(BPS, Kemenpar)',
    'Portal Satu Data\nIndonesia',
    'Pengguna\n(kota, peneliti, publik)',
  ];
  rantai.forEach((r, i) => {
    const x = 48 + i * (w + jarak);
    bagian.push(langkah(x, y, w, h, r.replace('\n', ' '), { isi: i === 1 ? C.primary : C.pale, warnaTeks: i === 1 ? '#ffffff' : C.primary, garis: i === 1 ? C.primary : C.secondary }));
    if (i < rantai.length - 1) bagian.push(panah(x + w + 6, y + h / 2, x + w + jarak - 8, y + h / 2));
  });

  const ySyarat = y + h + 46;
  bagian.push(teks(48, ySyarat, 'Tiga prasyarat Perpres 39/2019', { ukuran: 15, tebal: 700, warna: C.primary }));
  ['Standar metadata', 'Walidata yang ditetapkan', 'Interoperabilitas lewat API'].forEach((s, i) => {
    const x = 48 + i * 300;
    bagian.push(kotak(x, ySyarat + 16, 276, 52, { isi: '#ffffff', garis: C.light }));
    bagian.push(teks(x + 16, ySyarat + 47, s, { ukuran: 14, warna: C.text }));
  });

  const yPutus = ySyarat + 108;
  bagian.push(teks(48, yPutus, 'Titik yang masih putus', { ukuran: 15, tebal: 700, warna: C.accent }));
  ['Metadata untuk sumber big data belum ada standarnya', 'Rilis masih bulanan atau tahunan, bukan real-time', 'Kapasitas tim data di tingkat kota timpang'].forEach((s, i) => {
    const x = 48 + i * 372;
    bagian.push(kotak(x, yPutus + 16, 348, 62, { isi: C.paleAccent, garis: C.accent, tebalGaris: 1.3 }));
    bagian.push(
      teks(x + 16, yPutus + 42, s, { ukuran: 13, warna: C.text, lebarKarakter: 44, tinggiBaris: 1.35 }),
    );
  });

  const ket = keterangan(
    yPutus + 108,
    'Kebijakan data terpadu menetapkan siapa bertanggung jawab atas data apa, sehingga angka dari kota yang berbeda bisa dibandingkan. Rantainya sudah lengkap di atas kertas; yang belum selesai ada di baris bawah.',
    'Perpres No. 39 Tahun 2019 dan naskah subbab 1.4, diolah.',
  );
  bagian.push(ket.svg);
  tulis('grafik-1.3-rantai-satu-data.svg', yPutus + 108 + ket.tinggi + 20, bagian.join('\n'));
}

/** GRAFIK 2.1 — tiga lembaga inti. */
function grafik21() {
  const bagian = [teks(48, 44, 'Tiga lembaga inti sumber data pariwisata', { ukuran: 19, tebal: 700 })];
  const lembaga = [
    {
      judul: 'BPS',
      butir: [
        'Statistik Kunjungan Wisman (tahunan, rincian bulanan dan kebangsaan)',
        'Statistik Pengeluaran Wisman, berbasis PES',
        'Statistik Hotel: TPKH per provinsi',
        { teks: 'Granularitas: nasional dan provinsi', tandai: true },
      ],
    },
    {
      judul: 'Kementerian Pariwisata',
      butir: [
        'Direktori statistik bulanan wisman',
        'Rincian asal negara dan pintu masuk',
        'Data perjalanan domestik terbatas; Survei Wisnus dikelola BPS',
        { teks: 'Granularitas: nasional', tandai: true },
      ],
    },
    {
      judul: 'Disparekraf provinsi dan kabupaten/kota',
      butir: [
        'Data hotel, restoran, dan event di wilayahnya',
        'Pemahaman pola kunjungan lokal yang lebih dalam',
        'Publikasi belum terstandar antar-daerah',
        { teks: 'Granularitas: kota dan kabupaten', tandai: true },
      ],
    },
  ];
  const lebar = 352;
  let tinggiMaks = 0;
  lembaga.forEach((l, i) => {
    const k = kartu(48 + i * (lebar + 24), 70, lebar, l);
    bagian.push(k.svg);
    tinggiMaks = Math.max(tinggiMaks, k.tinggi);
  });

  const ket = keterangan(
    70 + tinggiMaks + 34,
    'Semakin ke kanan, datanya semakin granular tetapi semakin tidak terstandar. Pertanyaan tingkat kota hampir selalu memerlukan gabungan ketiganya.',
    'naskah subbab 2.1, diolah.',
  );
  bagian.push(ket.svg);
  tulis('grafik-2.1-tiga-lembaga.svg', 70 + tinggiMaks + 34 + ket.tinggi + 20, bagian.join('\n'));
}

/** TABEL 2.1 — sumber tradisional vs big data. */
function tabel21() {
  const bagian = [teks(48, 44, 'Sumber tradisional dan big data: apa bedanya', { ukuran: 19, tebal: 700 })];
  const t = tabel(
    48,
    70,
    W - 96,
    ['Aspek', 'Sumber tradisional (survei, imigrasi)', 'Big data (MPD, transaksi, media sosial)'],
    [
      ['Cakupan', 'Pelintas dan responden formal; jalur tidak resmi luput', 'Nyaris universal di kalangan pengguna ponsel, tetapi hanya sebagian operator'],
      ['Granularitas spasial', 'Nasional dan provinsi', 'Kelurahan hingga blok, tergantung densitas menara'],
      ['Granularitas temporal', 'Bulanan untuk wisman; tahunan untuk domestik', 'Harian, bahkan per jam'],
      ['Jeda rilis', 'Beberapa minggu hingga beberapa tahun', 'Nyaris seketika'],
      ['Bias utama', 'Nonrespons dan definisi operasional yang berbeda', 'Populasi pemilik ponsel; bias merek dan pangsa operator'],
      ['Otoritas', 'Rujukan baku untuk kebijakan dan perbandingan internasional', 'Belum ada standar metadata; sulit diaudit pihak luar'],
    ],
    [0.2, 0.4, 0.4],
  );
  bagian.push(t.svg);
  const ket = keterangan(
    70 + t.tinggi + 30,
    'Keduanya bukan pengganti satu sama lain: sumber tradisional memberi angka yang bisa dipertanggungjawabkan, big data memberi kedalaman yang tidak bisa dijangkau survei.',
    'naskah subbab 2.1–2.2, diolah.',
  );
  bagian.push(ket.svg);
  tulis('tabel-2.1-tradisional-vs-bigdata.svg', 70 + t.tinggi + 30 + ket.tinggi + 20, bagian.join('\n'));
}

/** GRAFIK 2.2 — lapisan data lake daerah. */
function grafik22() {
  const bagian = [teks(48, 44, 'Lapisan data lake pariwisata daerah', { ukuran: 19, tebal: 700 })];
  const sumber = ['Imigrasi', 'Hotel dan restoran', 'Mobile positioning', 'Transaksi dan e-wallet', 'Media sosial'];
  const y0 = 84;
  const wSumber = 208;
  sumber.forEach((s, i) => {
    const y = y0 + i * 56;
    bagian.push(kotak(48, y, wSumber, 44, { isi: '#ffffff', garis: C.light }));
    bagian.push(teks(48 + 14, y + 28, s, { ukuran: 13, warna: C.text }));
    bagian.push(panah(48 + wSumber + 6, y + 22, 320, y0 + 132, { warna: C.light }));
  });

  const lapisan = [
    ['Zona mentah', 'Disimpan apa adanya: CSV, JSON, gambar, hasil scrape'],
    ['Zona terkurasi', 'Dibersihkan, distandarkan, diberi metadata'],
    ['Data mart dan dasbor', 'Siap dipakai untuk indikator dan kebijakan'],
  ];
  lapisan.forEach(([judul, isi], i) => {
    const x = 330 + i * 290;
    bagian.push(kotak(x, y0 + 84, 268, 96, { isi: i === 2 ? C.primary : C.pale, garis: C.secondary, tebalGaris: 1.4 }));
    bagian.push(teks(x + 18, y0 + 116, judul, { ukuran: 15, tebal: 700, warna: i === 2 ? '#ffffff' : C.primary }));
    bagian.push(
      teks(x + 18, y0 + 140, isi, {
        ukuran: 12.5,
        warna: i === 2 ? '#dbe4ef' : C.neutral,
        lebarKarakter: 34,
        tinggiBaris: 1.35,
      }),
    );
    if (i < 2) bagian.push(panah(x + 274, y0 + 132, x + 284, y0 + 132));
  });

  const yTata = y0 + 216;
  bagian.push(kotak(330, yTata, 828, 66, { isi: C.paleAccent, garis: C.accent, tebalGaris: 1.3 }));
  bagian.push(teks(348, yTata + 27, 'Tata kelola Satu Data Indonesia', { ukuran: 14, tebal: 700, warna: C.accent }));
  bagian.push(
    teks(348, yTata + 48, 'Walidata yang ditetapkan · standar metadata · interoperabilitas lewat API — berlaku di seluruh lapisan, bukan hanya di ujung', {
      ukuran: 12.5,
      warna: C.text,
    }),
  );

  const ket = keterangan(
    yTata + 100,
    'Data lake menyimpan sinyal dalam bentuk mentahnya, lalu mengurasinya bertahap. Tanpa tata kelola di baris bawah, ia berhenti menjadi gudang data yang tidak terurus.',
    'naskah subbab 2.3, diolah.',
  );
  bagian.push(ket.svg);
  tulis('grafik-2.2-lapisan-data-lake.svg', yTata + 100 + ket.tinggi + 20, bagian.join('\n'));
}

/** GRAFIK 2.3 — mengapa angka berbeda dan di mana didamaikan. */
function grafik23() {
  const bagian = [teks(48, 44, 'Mengapa angka berbeda, dan di mana didamaikan', { ukuran: 19, tebal: 700 })];

  const y = 84;
  bagian.push(kotak(48, y, 520, 128, { isi: '#ffffff', garis: C.primary, tebalGaris: 1.6 }));
  bagian.push(teks(70, y + 34, 'BPS Bali', { ukuran: 14, tebal: 700, warna: C.primary }));
  bagian.push(teks(70, y + 74, '6.333.360 kunjungan', { ukuran: 26, tebal: 700, warna: C.primary }));
  bagian.push(teks(70, y + 102, 'Seluruh pintu masuk Bali, rilis 3 Februari 2025', { ukuran: 12.5, warna: C.neutral }));

  bagian.push(kotak(632, y, 520, 128, { isi: C.paleAccent, garis: C.accent, tebalGaris: 1.6 }));
  bagian.push(teks(654, y + 34, 'Angka yang beredar di media', { ukuran: 14, tebal: 700, warna: C.accent }));
  bagian.push(teks(654, y + 74, '±5,98 juta kunjungan', { ukuran: 26, tebal: 700, warna: C.accent }));
  bagian.push(teks(654, y + 102, 'Hanya kedatangan langsung lewat Bandara Ngurah Rai', { ukuran: 12.5, warna: C.neutral }));

  bagian.push(teks(600, y + 74, '≠', { ukuran: 24, tebal: 700, warna: C.neutral, anchor: 'middle' }));
  bagian.push(
    teks(600, y + 158, 'Selisih ratusan ribu kunjungan bukan tanda ada yang berbohong, melainkan tanda definisi operasionalnya berbeda', {
      ukuran: 13,
      warna: C.text,
      anchor: 'middle',
    }),
  );

  const yMek = y + 196;
  bagian.push(teks(48, yMek, 'Mekanisme yang mendamaikan', { ukuran: 15, tebal: 700, warna: C.primary }));
  const mekanisme = [
    ['Forum Satu Data', 'Menyelaraskan definisi dan jadwal rilis antar-walidata'],
    ['MoU lintas lembaga', 'Menetapkan siapa bertanggung jawab atas data apa'],
    ['Audit metadata BPS', 'Memastikan data yang masuk portal memenuhi standar'],
  ];
  mekanisme.forEach(([judul, isi], i) => {
    const x = 48 + i * 372;
    bagian.push(kotak(x, yMek + 16, 348, 92, { isi: C.pale, garis: C.secondary, tebalGaris: 1.3 }));
    bagian.push(teks(x + 18, yMek + 46, judul, { ukuran: 14, tebal: 700, warna: C.primary }));
    bagian.push(teks(x + 18, yMek + 70, isi, { ukuran: 12.5, warna: C.text, lebarKarakter: 42, tinggiBaris: 1.35 }));
  });

  const yHasil = yMek + 140;
  bagian.push(kotak(48, yHasil, W - 96, 58, { isi: C.primary, garis: C.primary }));
  bagian.push(
    teks(W / 2, yHasil + 35, 'Hasilnya bukan satu angka tunggal, melainkan konsensus tentang angka mana dipakai untuk konteks apa', {
      ukuran: 14,
      tebal: 600,
      warna: '#ffffff',
      anchor: 'middle',
    }),
  );

  const ket = keterangan(
    yHasil + 92,
    'Contoh kunjungan wisman ke Bali sepanjang 2024, ketika dua angka yang sama-sama benar beredar bersamaan.',
    'BPS Bali (rilis 3 Februari 2025) dan naskah subbab 2.4, diolah.',
  );
  bagian.push(ket.svg);
  tulis('grafik-2.3-mengapa-angka-berbeda.svg', yHasil + 92 + ket.tinggi + 20, bagian.join('\n'));
}

/** GRAFIK 6.1 — pipeline pra-pemrosesan teks. */
function grafik61() {
  const bagian = [teks(48, 44, 'Pipeline pra-pemrosesan ulasan daring', { ukuran: 19, tebal: 700 })];
  const langkahnya = [
    ['Ulasan mentah', 'Teks apa adanya dari platform ulasan'],
    ['Normalisasi', 'Huruf kecil, tanda baca dibuang, ejaan diseragamkan'],
    ['Tokenisasi', 'Teks dipecah menjadi kata atau frasa'],
    ['Penghapusan stopword', '"yang", "dan", "di" dibuang'],
    ['Stemming / lemmatization', '"pergian", "pergi-pergi" → "pergi"'],
    ['Named entity recognition', 'Nama tempat, hotel, restoran, merek dikenali'],
  ];
  const w = 352;
  const h = 104;
  langkahnya.forEach(([judul, isi], i) => {
    const kolom = i % 3;
    const barisKe = Math.floor(i / 3);
    const x = 48 + kolom * (w + 24);
    const y = 80 + barisKe * (h + 62);
    bagian.push(kotak(x, y, w, h, { isi: C.pale, garis: C.secondary, tebalGaris: 1.4 }));
    bagian.push(`<circle cx="${x + 26}" cy="${y + 28}" r="13" fill="${C.primary}"/>`);
    bagian.push(teks(x + 26, y + 33, String(i + 1), { ukuran: 13, tebal: 700, warna: '#ffffff', anchor: 'middle' }));
    bagian.push(teks(x + 50, y + 33, judul, { ukuran: 14.5, tebal: 700, warna: C.primary }));
    bagian.push(teks(x + 18, y + 62, isi, { ukuran: 12.5, warna: C.text, lebarKarakter: 44, tinggiBaris: 1.35 }));
    if (kolom < 2) bagian.push(panah(x + w + 4, y + h / 2, x + w + 18, y + h / 2));
    if (kolom === 2 && barisKe === 0) {
      bagian.push(panah(x + w / 2, y + h + 4, 48 + w / 2, y + h + 50, { warna: C.light }));
    }
  });

  const yAkhir = 80 + 2 * (h + 62) + 6;
  bagian.push(kotak(48, yAkhir, W - 96, 62, { isi: C.paleAccent, garis: C.accent, tebalGaris: 1.4 }));
  bagian.push(
    teks(W / 2, yAkhir + 38, 'Keluaran: teks bersih yang siap diberi skor sentimen dan dipetakan ke aspek layanan', {
      ukuran: 14,
      tebal: 600,
      warna: C.accent,
      anchor: 'middle',
    }),
  );

  const ket = keterangan(
    yAkhir + 96,
    'Pemilihan teknik bergantung pada bahasa: ulasan berbahasa Indonesia memerlukan daftar stopword dan stemmer yang berbeda dari bahasa Inggris.',
    'naskah subbab 6.1, diolah.',
  );
  bagian.push(ket.svg);
  tulis('grafik-6.1-pipeline-text-mining.svg', yAkhir + 96 + ket.tinggi + 20, bagian.join('\n'));
}

/** GRAFIK 9.3 — alur data crowdsourcing. */
function grafik93() {
  const bagian = [teks(48, 44, 'Alur data crowdsourcing destinasi', { ukuran: 19, tebal: 700 })];
  const tahap = [
    ['Kontributor', 'Warga lokal dan wisatawan'],
    ['Platform terbuka', 'OpenStreetMap, Wikivoyage, Google Maps, aplikasi Disparekraf'],
    ['Moderasi komunitas', 'Aturan platform, tinjauan kontributor lain'],
    ['Verifikasi walidata', 'Dicocokkan dengan data resmi dan pemeriksaan lapangan'],
    ['Publikasi', 'Masuk portal data daerah sebagai data pelengkap'],
  ];
  const w = 212;
  const jarak = 26;
  const y = 84;
  const h = 118;
  tahap.forEach(([judul, isi], i) => {
    const x = 48 + i * (w + jarak);
    const utama = i === 3;
    bagian.push(kotak(x, y, w, h, { isi: utama ? C.primary : C.pale, garis: utama ? C.primary : C.secondary, tebalGaris: 1.4 }));
    bagian.push(teks(x + 16, y + 32, judul, { ukuran: 14, tebal: 700, warna: utama ? '#ffffff' : C.primary, lebarKarakter: 26 }));
    bagian.push(
      teks(x + 16, y + 62, isi, {
        ukuran: 12,
        warna: utama ? '#dbe4ef' : C.text,
        lebarKarakter: 27,
        tinggiBaris: 1.35,
      }),
    );
    if (i < tahap.length - 1) bagian.push(panah(x + w + 4, y + h / 2, x + w + jarak - 6, y + h / 2));
  });

  const yRisiko = y + h + 46;
  bagian.push(teks(48, yRisiko, 'Empat masalah kualitas yang harus ditangani di tahap moderasi dan verifikasi', { ukuran: 14, tebal: 700, warna: C.accent }));
  ['Bias kontributor: urban, kelas menengah, punya akses internet', 'Vandalisme dan kontribusi keliru', 'Cakupan tidak merata antar-wilayah', 'Akurasi lokasi dan status yang cepat basi'].forEach((r, i) => {
    const x = 48 + (i % 2) * 564;
    const yy = yRisiko + 20 + Math.floor(i / 2) * 62;
    bagian.push(kotak(x, yy, 540, 50, { isi: C.paleAccent, garis: C.accent, tebalGaris: 1.2 }));
    bagian.push(teks(x + 16, yy + 31, r, { ukuran: 13, warna: C.text }));
  });

  const ket = keterangan(
    yRisiko + 168,
    'Crowdsourcing menambal apa yang tidak tercatat agregat resmi — atraksi kecil, status real-time, event lokal — tetapi hanya berguna bila melewati verifikasi sebelum dipublikasikan.',
    'naskah subbab 9.3, diolah.',
  );
  bagian.push(ket.svg);
  tulis('grafik-9.3-alur-crowdsourcing.svg', yRisiko + 168 + ket.tinggi + 20, bagian.join('\n'));
}

console.log('Membangun diagram SVG:');
grafik11();
grafik12();
tabel11();
grafik13();
grafik21();
tabel21();
grafik22();
grafik23();
grafik61();
grafik93();
console.log(`\n10 diagram ditulis ke public/gambar/.`);
