#!/usr/bin/env node
/**
 * Cetak halaman /cetak menjadi berkas PDF buku.
 *
 * PDF ini di-commit dan disajikan dari public/, bukan dibuat saat build di
 * Vercel — image build di sana tidak punya Chromium. Jadi urutannya:
 *
 *   npm run import:book   # naskah → halaman
 *   npm run pdf:build     # halaman → PDF
 *   git commit            # keduanya ikut
 *
 * Jalankan setelah `npm run build`, karena skrip ini memakai server produksi.
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PDF_PORT ?? '3123';
const KELUARAN = path.join(ROOT, 'public', 'buku-statistika-pariwisata-perkotaan.pdf');

const CHROMIUM = ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome'].find(
  (bin) => spawnSync('which', [bin]).status === 0,
);

async function portTerpakai(port) {
  try {
    await fetch(`http://127.0.0.1:${port}/`);
    return true;
  } catch {
    return false;
  }
}

async function tungguSiap(url, batasDetik = 90) {
  for (let i = 0; i < batasDetik; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // server belum menerima koneksi — coba lagi
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Server tidak siap dalam ${batasDetik} detik: ${url}`);
}

async function main() {
  if (!CHROMIUM) {
    console.error('Chromium tidak ditemukan. Pasang chromium atau google-chrome.');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(ROOT, '.next'))) {
    console.error('Belum ada hasil build. Jalankan `npm run build` lebih dulu.');
    process.exit(1);
  }

  // Server lama yang masih hidup di port ini akan menyajikan HTML build lama;
  // berkas CSS yang dirujuknya sudah terhapus, dan PDF-nya tercetak tanpa gaya
  // sama sekali. Lebih baik berhenti daripada menghasilkan PDF yang salah.
  if (await portTerpakai(PORT)) {
    console.error(`Port ${PORT} sudah dipakai proses lain. Hentikan dulu, atau`);
    console.error('jalankan ulang dengan PDF_PORT lain.');
    process.exit(1);
  }

  const server = spawn('npm', ['run', 'start'], {
    cwd: ROOT,
    env: { ...process.env, PORT },
    stdio: 'ignore',
  });

  try {
    await tungguSiap(`http://127.0.0.1:${PORT}/cetak`);

    fs.mkdirSync(path.dirname(KELUARAN), { recursive: true });
    const hasil = spawnSync(
      CHROMIUM,
      [
        '--headless',
        '--disable-gpu',
        '--no-pdf-header-footer',
        // Butuh waktu untuk memuat 32 gambar figure sebelum dicetak.
        '--virtual-time-budget=60000',
        `--print-to-pdf=${KELUARAN}`,
        `http://127.0.0.1:${PORT}/cetak`,
      ],
      { stdio: 'inherit' },
    );

    if (hasil.status !== 0 || !fs.existsSync(KELUARAN)) {
      throw new Error('Chromium gagal mencetak PDF.');
    }

    const mb = (fs.statSync(KELUARAN).size / 1024 / 1024).toFixed(1);
    console.log(`\nPDF ditulis: public/${path.basename(KELUARAN)} (${mb} MB)`);
  } finally {
    server.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
