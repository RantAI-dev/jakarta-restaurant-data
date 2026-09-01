#!/usr/bin/env node
/**
 * Render halaman PDF menjadi PNG supaya hasilnya bisa benar-benar dilihat.
 *
 * Loop verifikasi visual ini yang menangkap cacat tata letak — kolom gepeng,
 * header hilang, gambar meluber — yang tidak pernah terlihat dari kode.
 *
 *   npm run pdf:preview             # 12 halaman contoh yang tersebar
 *   npm run pdf:preview -- 3 9      # halaman 3 sampai 9
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PDF = path.join(ROOT, 'public', 'buku-statistika-pariwisata-perkotaan.pdf');
const KELUAR = path.join(ROOT, '.pdf-preview');

if (!fs.existsSync(PDF)) {
  console.error('Belum ada PDF. Jalankan `npm run pdf:build` lebih dulu.');
  process.exit(1);
}

const total = Number(
  spawnSync('pdfinfo', [PDF], { encoding: 'utf8' }).stdout.match(/Pages:\s+(\d+)/)?.[1] ?? 0,
);

fs.rmSync(KELUAR, { recursive: true, force: true });
fs.mkdirSync(KELUAR, { recursive: true });

const [dari, sampai] = process.argv.slice(2).map(Number);
const halaman =
  Number.isFinite(dari) && Number.isFinite(sampai)
    ? Array.from({ length: sampai - dari + 1 }, (_, i) => dari + i)
    : // Contoh yang tersebar: bagian depan lengkap, lalu tiap ~1/8 isi buku.
      [1, 2, 3, 4, 5, ...Array.from({ length: 8 }, (_, i) => Math.round((total * (i + 1)) / 9))];

for (const h of [...new Set(halaman)].filter((h) => h >= 1 && h <= total)) {
  spawnSync('pdftoppm', ['-png', '-r', '60', '-f', String(h), '-l', String(h), PDF,
    path.join(KELUAR, 'hal')], { stdio: 'inherit' });
}

console.log(`${total} halaman total. PNG contoh ada di .pdf-preview/`);
