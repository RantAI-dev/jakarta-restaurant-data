#!/usr/bin/env node
/**
 * Bangun grafik buku dari data yang dikumpulkan sendiri.
 *
 * Naskah menyisakan beberapa visual yang datanya tidak pernah ada. Alih-alih
 * mengarang angka, grafik di sini memakai data yang benar-benar dikumpulkan
 * dan diolah tim data Dinas Pariwisata di repo ini: kunjungan destinasi wisata
 * Jakarta, katalog event, dan hasil kurasi venue.
 *
 * Setiap gambar menyebut sumber dan cakupannya di dalam keterangan, termasuk
 * berapa baris yang tidak terpakai — supaya pembaca tahu persis apa yang
 * dilihatnya dan apa yang tidak.
 *
 * Keluaran: public/gambar/*.svg. Jalankan: npm run charts:build
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { C, W, angka, baris, keterangan, kotak, teks, tulisSvg } from './svg-kit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = path.resolve(ROOT, '..');
const OUT = path.join(ROOT, 'public', 'gambar');

const tulis = (nama, tinggi, isi) => tulisSvg(OUT, nama, tinggi, isi);

// -------------------------------------------------------------- baca sumber

function bacaTsv(berkas) {
  const teksBerkas = fs.readFileSync(path.join(REPO, berkas), 'utf8').trim();
  const [kepala, ...isi] = teksBerkas.split('\n');
  const kolom = kepala.split('\t');
  return isi.map((r) => Object.fromEntries(r.split('\t').map((v, i) => [kolom[i], v])));
}

const bacaJson = (berkas) => JSON.parse(fs.readFileSync(path.join(REPO, berkas), 'utf8'));

// ------------------------------------------------------------------ grafik

/**
 * GRAFIK 4.5.4 — kunjungan ke destinasi wisata Jakarta.
 *
 * Batang horizontal berperingkat: pertanyaannya "destinasi mana yang paling
 * banyak dikunjungi", dan namanya panjang-panjang.
 */
function kunjunganDtw() {
  const baris_ = bacaTsv('data/kunjungan-31-dtw-juli-2026-KERJA.tsv');
  const data = baris_
    .map((r) => ({ nama: r['Destinasi'], nilai: Number(r['Juli 2025 (aktual SDI)']) }))
    .filter((d) => Number.isFinite(d.nilai) && d.nilai > 0)
    .sort((a, b) => b.nilai - a.nilai);

  const tampil = data.slice(0, 15);
  const maks = tampil[0].nilai;
  const xLabel = 300;
  const lebarBatang = W - xLabel - 150;
  const tinggiBaris = 34;
  const y0 = 84;

  const bagian = [
    teks(48, 44, 'Kunjungan ke destinasi wisata Jakarta, Juli 2025', { ukuran: 19, tebal: 700 }),
  ];

  tampil.forEach((d, i) => {
    const y = y0 + i * tinggiBaris;
    const lebar = Math.max(2, (d.nilai / maks) * lebarBatang);
    bagian.push(
      teks(xLabel - 12, y + 15, d.nama, { ukuran: 13, anchor: 'end', warna: C.text }),
    );
    bagian.push(
      `<rect x="${xLabel}" y="${y}" width="${lebar}" height="20" rx="2" fill="${i === 0 ? C.accent : C.primary}"/>`,
    );
    bagian.push(
      teks(xLabel + lebar + 10, y + 15, angka(d.nilai), { ukuran: 12.5, warna: C.neutral }),
    );
  });

  const yAkhir = y0 + tampil.length * tinggiBaris + 6;
  bagian.push(
    `<line x1="${xLabel}" y1="${y0 - 6}" x2="${xLabel}" y2="${yAkhir}" stroke="${C.light}" stroke-width="1"/>`,
  );

  const ket = keterangan(
    yAkhir + 30,
    `Lima belas destinasi dengan kunjungan tertinggi, dari ${data.length} destinasi yang melaporkan angka Juli 2025; enam destinasi lain belum melaporkan. Rentangnya empat orde besaran: ${angka(
      data[0].nilai,
    )} kunjungan di puncak, ${angka(data[data.length - 1].nilai)} di dasar.`,
    'laporan pengelola destinasi via Satu Data Jakarta, dikumpulkan dan diolah tim data Dinas Pariwisata.',
  );
  bagian.push(ket.svg);
  tulis('grafik-4.5.4-kunjungan-dtw-jakarta.svg', yAkhir + 30 + ket.tinggi + 20, bagian.join('\n'));
}

/**
 * GRAFIK 4.5.5 — sebaran spasial event Jakarta.
 *
 * Peta titik di atas batas kecamatan; ukuran titik menyatakan jumlah
 * pengunjung. Proyeksi sederhana lintang/bujur sudah memadai untuk wilayah
 * sesempit Jakarta.
 */
function sebaranEvent() {
  const rows = bacaJson('platform/data/event-visitors-2026.json').rows;
  const geo = bacaJson('platform-v2/public/geo/dki-jakarta.geojson');

  const titik = rows
    .map((r) => ({
      lat: Number(r.lat),
      lon: Number(r.lon),
      pengunjung: Number(r.jumlah_pengunjung) || 0,
      kota: r.kota ?? '',
    }))
    // Kepulauan Seribu terletak jauh di utara; memasukkannya membuat daratan
    // Jakarta mengerut jadi seujung kuku.
    .filter((t) => Number.isFinite(t.lat) && Number.isFinite(t.lon) && t.lat < -5.9);

  const petak = { x: 48, y: 84, w: 700, h: 470 };
  const semuaKoordinat = geo.features.flatMap((f) =>
    (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).flatMap(
      (poly) => poly[0],
    ),
  );
  const lons = semuaKoordinat.map((k) => k[0]);
  const lats = semuaKoordinat.map((k) => k[1]);
  const batas = {
    lonMin: Math.min(...lons),
    lonMaks: Math.max(...lons),
    latMin: Math.min(...lats.filter((l) => l < -5.9)),
    latMaks: Math.max(...lats.filter((l) => l < -5.9)),
  };
  const skala = Math.min(
    petak.w / (batas.lonMaks - batas.lonMin),
    petak.h / (batas.latMaks - batas.latMin),
  );
  const px = (lon) => petak.x + (lon - batas.lonMin) * skala;
  const py = (lat) => petak.y + (batas.latMaks - lat) * skala;

  const bagian = [
    teks(48, 44, 'Sebaran event Jakarta, semester I 2026', { ukuran: 19, tebal: 700 }),
  ];

  for (const f of geo.features) {
    const poligon =
      f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const p of poligon) {
      const d = p[0]
        .filter((k) => k[1] < -5.9)
        .map((k, i) => `${i === 0 ? 'M' : 'L'}${px(k[0]).toFixed(1)} ${py(k[1]).toFixed(1)}`)
        .join(' ');
      if (d) bagian.push(`<path d="${d} Z" fill="${C.pale}" stroke="#ffffff" stroke-width="1"/>`);
    }
  }

  // Luas lingkaran sebanding dengan jumlah pengunjung, bukan jari-jarinya.
  const maksPengunjung = Math.max(...titik.map((t) => t.pengunjung));
  for (const t of titik) {
    const r = t.pengunjung > 0 ? 2.5 + Math.sqrt(t.pengunjung / maksPengunjung) * 16 : 2;
    bagian.push(
      `<circle cx="${px(t.lon).toFixed(1)}" cy="${py(t.lat).toFixed(1)}" r="${r.toFixed(1)}" fill="${C.primary}" fill-opacity="0.42" stroke="${C.primary}" stroke-opacity="0.55" stroke-width="0.6"/>`,
    );
  }

  const perKota = new Map();
  for (const r of rows) {
    const kota = (r.kota ?? '').replace(/,.*/, '').trim() || 'Tidak tercatat';
    const k = perKota.get(kota) ?? { jumlah: 0, pengunjung: 0 };
    k.jumlah += 1;
    k.pengunjung += Number(r.jumlah_pengunjung) || 0;
    perKota.set(kota, k);
  }
  const urut = [...perKota.entries()].sort((a, b) => b[1].jumlah - a[1].jumlah).slice(0, 6);

  const xTabel = 800;
  bagian.push(teks(xTabel, 104, 'Event per kota administrasi', { ukuran: 14, tebal: 700, warna: C.primary }));
  urut.forEach(([kota, k], i) => {
    const y = 136 + i * 46;
    bagian.push(teks(xTabel, y, kota, { ukuran: 13, warna: C.text }));
    bagian.push(teks(W - 48, y, `${angka(k.jumlah)} event`, { ukuran: 13, anchor: 'end', warna: C.neutral }));
    const lebar = (k.jumlah / urut[0][1].jumlah) * (W - 48 - xTabel);
    bagian.push(`<rect x="${xTabel}" y="${y + 8}" width="${lebar}" height="6" rx="3" fill="${C.secondary}"/>`);
  });

  const yLegenda = 136 + urut.length * 46 + 24;
  bagian.push(teks(xTabel, yLegenda, 'Ukuran titik: jumlah pengunjung', { ukuran: 12.5, warna: C.neutral }));

  const ket = keterangan(
    petak.y + petak.h + 46,
    `${angka(titik.length)} event dengan koordinat di daratan Jakarta, dari ${angka(rows.length)} event yang tercatat; sisanya belum berhasil digeokode, dan event Kepulauan Seribu tidak dipetakan agar daratan tidak mengerut. Titik menumpuk di koridor Sudirman–Thamrin dan Jakarta Selatan, bukan tersebar merata di lima wilayah.`,
    'katalog event Dinas Pariwisata semester I 2026, digeokode dan diolah tim data.',
  );
  bagian.push(ket.svg);
  tulis('grafik-4.5.5-sebaran-event-jakarta.svg', petak.y + petak.h + 46 + ket.tinggi + 20, bagian.join('\n'));
}

/**
 * GRAFIK 6.2 — timpangnya volume ulasan antar-kategori.
 *
 * Satu baris per kategori dengan sumbu logaritmik: sebarannya membentang tiga
 * orde besaran, dan pada sumbu linier dua kategori akan menempel di nol.
 */
function volumeUlasan() {
  const sumber = [
    { nama: 'Restoran', berkas: 'data-restoran-GCI-jakarta.tsv', platform: 'Google Maps' },
    { nama: 'Nightlife', berkas: 'data-nightlife-GPCI-jakarta.tsv', platform: 'TripAdvisor' },
    { nama: 'Toko suvenir', berkas: 'data-souvenir-GCI-jakarta.tsv', platform: 'TripAdvisor' },
  ].map((s) => {
    const nilai = bacaTsv(s.berkas)
      .map((r) => Number(String(r['Jumlah Ulasan'] ?? '').replace(/[.,\s]/g, '')))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
    return { ...s, nilai, median: nilai[Math.floor(nilai.length / 2)] };
  });

  const xKiri = 210;
  const lebar = W - xKiri - 90;
  const y0 = 110;
  const jarak = 118;
  const maks = 10000;
  const posisi = (n) => xKiri + (Math.log10(Math.max(1, n)) / Math.log10(maks)) * lebar;

  const bagian = [
    teks(48, 44, 'Jumlah ulasan per venue, tiga kategori hasil kurasi Jakarta', { ukuran: 19, tebal: 700 }),
    teks(48, 68, 'Sumbu logaritmik: satu langkah ke kanan berarti sepuluh kali lipat', {
      ukuran: 13,
      warna: C.neutral,
    }),
  ];

  [1, 10, 100, 1000, 10000].forEach((t) => {
    bagian.push(
      `<line x1="${posisi(t)}" y1="${y0 - 16}" x2="${posisi(t)}" y2="${y0 + jarak * 3 - 46}" stroke="${C.light}" stroke-width="1"/>`,
    );
    bagian.push(
      teks(posisi(t), y0 + jarak * 3 - 26, angka(t), { ukuran: 12, warna: C.neutral, anchor: 'middle' }),
    );
  });

  sumber.forEach((s, i) => {
    const y = y0 + i * jarak;
    bagian.push(teks(48, y + 4, s.nama, { ukuran: 15, tebal: 600, warna: C.primary }));
    bagian.push(teks(48, y + 24, `${s.nilai.length} venue · ${s.platform}`, { ukuran: 12, warna: C.neutral }));

    s.nilai.forEach((n, j) => {
      // Sedikit sebaran vertikal supaya titik bernilai sama tidak saling tutup.
      const geser = ((j % 7) - 3) * 4.5;
      bagian.push(
        `<circle cx="${posisi(n).toFixed(1)}" cy="${(y + geser).toFixed(1)}" r="4" fill="${C.secondary}" fill-opacity="0.55"/>`,
      );
    });

    bagian.push(
      `<line x1="${posisi(s.median)}" y1="${y - 30}" x2="${posisi(s.median)}" y2="${y + 30}" stroke="${C.accent}" stroke-width="2"/>`,
    );
    bagian.push(
      teks(posisi(s.median), y - 38, `median ${angka(s.median)}`, {
        ukuran: 12.5,
        tebal: 600,
        warna: C.accent,
        anchor: 'middle',
      }),
    );
  });

  const yAkhir = y0 + jarak * 3 - 6;
  const ket = keterangan(
    yAkhir + 20,
    `Median ulasan restoran ${angka(sumber[0].median)}, nightlife ${angka(sumber[1].median)}, toko suvenir ${angka(
      sumber[2].median,
    )} — selisih tiga orde besaran. Rata-rata rating dari ketiga kategori ini tidak sebanding: satu dihitung dari ribuan penilai, dua lainnya dari segelintir.`,
    'kurasi venue Jakarta oleh tim data Dinas Pariwisata, 2026; jumlah ulasan per platform, diolah.',
  );
  bagian.push(ket.svg);
  tulis('grafik-6.2-volume-ulasan.svg', yAkhir + 20 + ket.tinggi + 20, bagian.join('\n'));
}

/**
 * GRAFIK 2.4 — satu kategori, banyak ejaan.
 *
 * Bukti dari katalog sendiri untuk masalah yang dibahas subbab 2.4:
 * standardisasi gagal bukan karena datanya tidak ada, melainkan karena
 * nilainya ditulis bebas.
 */
function kategoriEvent() {
  const rows = bacaJson('platform/data/event-visitors-2026.json').rows;
  const hitung = new Map();
  for (const r of rows) {
    const k = (r.jenis_event ?? '').trim();
    if (k) hitung.set(k, (hitung.get(k) ?? 0) + 1);
  }
  const urut = [...hitung.entries()].sort((a, b) => b[1] - a[1]);
  const tampil = urut.slice(0, 10);
  const keluargaMusik = urut.filter(([k]) => /MUSIK|\bDJ\b/.test(k));
  const totalMusik = keluargaMusik.reduce((t, [, v]) => t + v, 0);

  const xLabel = 430;
  const lebarBatang = W - xLabel - 130;
  const tinggiBaris = 34;
  const y0 = 108;
  const maks = tampil[0][1];

  const bagian = [
    teks(48, 44, 'Satu kategori, banyak ejaan: jenis event pada katalog sendiri', { ukuran: 19, tebal: 700 }),
    teks(48, 70, `${angka(hitung.size)} nilai berbeda dipakai untuk ${angka(rows.length)} event`, {
      ukuran: 13,
      warna: C.neutral,
    }),
  ];

  tampil.forEach(([nama, jumlah], i) => {
    const y = y0 + i * tinggiBaris;
    const musik = /MUSIK|\bDJ\b/.test(nama);
    const lebar = Math.max(2, (jumlah / maks) * lebarBatang);
    bagian.push(
      teks(xLabel - 12, y + 15, nama.length > 46 ? `${nama.slice(0, 44)}…` : nama, {
        ukuran: 12.5,
        anchor: 'end',
        warna: musik ? C.accent : C.text,
        tebal: musik ? 600 : 400,
      }),
    );
    bagian.push(
      `<rect x="${xLabel}" y="${y}" width="${lebar}" height="20" rx="2" fill="${musik ? C.accent : C.neutral}"/>`,
    );
    bagian.push(teks(xLabel + lebar + 10, y + 15, angka(jumlah), { ukuran: 12.5, warna: C.neutral }));
  });

  const yKotak = y0 + tampil.length * tinggiBaris + 26;
  bagian.push(kotak(48, yKotak, W - 96, 74, { isi: C.paleAccent, garis: C.accent, tebalGaris: 1.4 }));
  bagian.push(
    teks(70, yKotak + 32, `${keluargaMusik.length} ejaan berbeda merujuk hal yang sama`, {
      ukuran: 15,
      tebal: 700,
      warna: C.accent,
    }),
  );
  bagian.push(
    teks(70, yKotak + 56, `MUSIK, HIBURAN MUSIK, PERTUNJUKAN MUSIK, PERTUNJUKAN MUSIK / DJ, dan seterusnya — bersama-sama mencakup ${angka(totalMusik)} event, ${Math.round((totalMusik / rows.length) * 100)} persen dari seluruh katalog`, {
      ukuran: 13,
      warna: C.text,
    }),
  );

  const ket = keterangan(
    yKotak + 108,
    'Kolomnya ada, terisi, dan tetap tidak bisa dijumlahkan. Selama nilainya ditulis bebas tanpa daftar kode baku, penggabungan antar-instansi akan selalu berhenti di tahap ini.',
    'katalog event Dinas Pariwisata semester I 2026, dihitung apa adanya tanpa pembersihan.',
  );
  bagian.push(ket.svg);
  tulis('grafik-2.4-kategori-event.svg', yKotak + 108 + ket.tinggi + 20, bagian.join('\n'));
}

console.log('Membangun grafik dari data sendiri:');
kunjunganDtw();
sebaranEvent();
volumeUlasan();
kategoriEvent();
console.log('\n4 grafik ditulis ke public/gambar/.');
