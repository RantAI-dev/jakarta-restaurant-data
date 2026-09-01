#!/usr/bin/env node
/**
 * Cetak halaman /cetak menjadi berkas PDF buku.
 *
 * Memakai protokol DevTools, bukan `--print-to-pdf`, karena hanya lewat
 * `Page.printToPDF` header berjalan dan nomor halaman bisa dipasang.
 *
 * Dicetak dua kali: sekali tanpa header/nomor halaman untuk bagian depan
 * (sampul, kredit, daftar isi), sekali dengan, lalu keduanya disambung dengan
 * qpdf. Konvensi buku: bagian depan tidak memakai running head.
 *
 * PDF ini di-commit dan disajikan dari public/, bukan dibuat saat build di
 * Vercel — image build di sana tidak punya Chromium. Urutan kerjanya:
 *
 *   npm run import:book   # naskah → halaman
 *   npm run build         # halaman → server produksi
 *   npm run pdf:build     # /cetak → PDF
 *   npm run pdf:preview   # render PNG untuk diperiksa dengan mata
 */
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = process.env.PDF_PORT ?? '3123';
const PORT_CDP = process.env.CDP_PORT ?? '9333';
const KELUARAN = path.join(ROOT, 'public', 'buku-statistika-pariwisata-perkotaan.pdf');
// Peta nomor halaman untuk daftar isi; dibaca halaman /cetak saat dirender.
const PETA = path.join(ROOT, '.pdf-index.json');
const JUDUL = 'Statistika Pariwisata Perkotaan';

const CHROMIUM = ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome'].find(
  (bin) => spawnSync('which', [bin]).status === 0,
);

/** A4 dalam inci, margin 20–22 mm. */
const HALAMAN = {
  paperWidth: 8.27,
  paperHeight: 11.69,
  marginTop: 0.87,
  marginBottom: 0.87,
  marginLeft: 0.79,
  marginRight: 0.79,
  printBackground: true,
  preferCSSPageSize: false,
};

/**
 * Chromium hanya menerima gaya sebaris pada template ini, dan mengabaikan
 * ukuran huruf bawaan, sehingga semuanya harus disebut eksplisit.
 */
const HEADER = `
<div style="width:100%;font-size:7pt;font-family:sans-serif;color:#8a8a90;
            padding:0 20mm;margin-top:8mm;letter-spacing:0.08em;
            text-transform:uppercase;">
  ${JUDUL}
</div>`;

const FOOTER = `
<div style="width:100%;font-size:8pt;font-family:sans-serif;color:#6b6b70;
            padding:0 20mm;margin-top:7mm;text-align:center;">
  <span class="pageNumber"></span>
</div>`;

// ------------------------------------------------------------------ utilitas

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
      // belum menerima koneksi — coba lagi
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error(`Tidak siap dalam ${batasDetik} detik: ${url}`);
}

/** Klien DevTools seadanya: cukup untuk navigate + printToPDF. */
class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.menunggu = new Map();
    this.peristiwa = new Map();
    ws.addEventListener('message', (ev) => {
      const pesan = JSON.parse(ev.data);
      if (pesan.id !== undefined) {
        const p = this.menunggu.get(pesan.id);
        this.menunggu.delete(pesan.id);
        if (!p) return;
        pesan.error ? p.reject(new Error(pesan.error.message)) : p.resolve(pesan.result);
      } else {
        this.peristiwa.get(pesan.method)?.forEach((fn) => fn(pesan.params));
      }
    });
  }

  static async buka(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const batas = setTimeout(
        () => reject(new Error(`Sambungan DevTools tidak terbuka: ${url}`)),
        15000,
      );
      ws.addEventListener('open', () => (clearTimeout(batas), resolve()), { once: true });
      ws.addEventListener('error', () => {
        clearTimeout(batas);
        reject(new Error(`Gagal membuka ${url}`));
      }, { once: true });
    });
    return new Cdp(ws);
  }

  kirim(method, params = {}, sessionId) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.menunggu.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  }

  saat(method, fn) {
    if (!this.peristiwa.has(method)) this.peristiwa.set(method, []);
    this.peristiwa.get(method).push(fn);
  }

  tutup() {
    this.ws.close();
  }
}

/** Semua gambar benar-benar termuat dan huruf siap — bukan sekadar menunggu detik. */
const TUNGGU_ASET = `
  Promise.all(
    [...document.images].filter((g) => !g.complete).map(
      (g) => new Promise((r) => { g.onload = g.onerror = r; }),
    ),
  )
    .then(() => document.fonts.ready)
    .then(() => [...document.images].filter((g) => g.naturalWidth > 0).length)
`;

/**
 * Cetak `url` sekali; kembalikan isi PDF sebagai Buffer.
 *
 * Hasilnya diambil sebagai stream. Dengan transferMode bawaan, seluruh PDF
 * dikirim sebagai satu pesan base64 ~9 MB, dan pesan sebesar itu tidak pernah
 * sampai — perintahnya menggantung tanpa galat.
 */
async function cetak(cdp, url, { pakaiHeader }) {
  const { targetId } = await cdp.kirim('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.kirim('Target.attachToTarget', { targetId, flatten: true });

  try {
    await cdp.kirim('Page.enable', {}, sessionId);
    // Headless mengikuti tema sistem. Kalau sistemnya gelap, area margin PDF
    // ikut memakai warna kanvas gelap dan halaman tercetak berbingkai hitam.
    await cdp.kirim(
      'Emulation.setEmulatedMedia',
      { features: [{ name: 'prefers-color-scheme', value: 'light' }] },
      sessionId,
    );
    const selesai = new Promise((resolve) => cdp.saat('Page.loadEventFired', resolve));
    await cdp.kirim('Page.navigate', { url }, sessionId);
    await selesai;

    const aset = await cdp.kirim(
      'Runtime.evaluate',
      { expression: TUNGGU_ASET, awaitPromise: true, returnByValue: true },
      sessionId,
    );
    const jumlahGambar = aset.result?.value ?? 0;
    if (jumlahGambar < 42) {
      throw new Error(`Hanya ${jumlahGambar} gambar yang termuat; seharusnya 42 atau lebih.`);
    }

    const { stream } = await cdp.kirim(
      'Page.printToPDF',
      {
        ...HALAMAN,
        transferMode: 'ReturnAsStream',
        displayHeaderFooter: pakaiHeader,
        headerTemplate: pakaiHeader ? HEADER : '<span></span>',
        footerTemplate: pakaiHeader ? FOOTER : '<span></span>',
      },
      sessionId,
    );

    const potongan = [];
    for (;;) {
      const { data, base64Encoded, eof } = await cdp.kirim(
        'IO.read',
        { handle: stream, size: 1 << 20 },
        sessionId,
      );
      potongan.push(Buffer.from(data, base64Encoded ? 'base64' : 'utf8'));
      if (eof) break;
    }
    await cdp.kirim('IO.close', { handle: stream }, sessionId);
    return Buffer.concat(potongan);
  } finally {
    await cdp.kirim('Target.closeTarget', { targetId });
  }
}

/**
 * Baca posisi penanda `PM<id>PM` yang ditanam halaman /cetak, dan kembalikan
 * peta id → nomor halaman. Inilah yang mengisi nomor di daftar isi.
 */
function petaPenanda(berkas) {
  const total = Number(
    spawnSync('pdfinfo', [berkas], { encoding: 'utf8' }).stdout.match(/Pages:\s+(\d+)/)?.[1] ?? 0,
  );

  const peta = {};
  for (let hal = 1; hal <= total; hal++) {
    const teks =
      spawnSync('pdftotext', ['-f', String(hal), '-l', String(hal), berkas, '-'], {
        encoding: 'utf8',
      }).stdout ?? '';
    // pdftotext bisa menyisipkan pemenggalan baris di tengah token. Kunci
    // dikecilkan karena sebagian penanda berada di elemen ber-text-transform
    // uppercase, dan huruf besar itu ikut masuk ke lapisan teks PDF.
    for (const cocok of teks.replace(/\s+/g, '').matchAll(/PM([A-Za-z0-9-]+?)PM/g)) {
      const id = cocok[1].toLowerCase();
      if (!(id in peta)) peta[id] = hal;
    }
  }
  return peta;
}

/**
 * Berapa halaman bagian depan? Dihitung dari halaman pertama yang memuat
 * pembatas "Bagian I", bukan dari angka tetap yang akan basi begitu daftar
 * isinya memanjang.
 */
function halamanBagianDepan(berkas) {
  for (let hal = 1; hal <= 12; hal++) {
    const teks = spawnSync('pdftotext', ['-f', String(hal), '-l', String(hal), berkas, '-'], {
      encoding: 'utf8',
    }).stdout;
    // Barisnya harus persis "Bagian I" — di halaman pembatas nomor bagian
    // berdiri sendiri, sedangkan di daftar isi ia diikuti judul bagiannya.
    // Tanpa penanda huruf besar/kecil: teks pembatas tercetak dalam kapital.
    if (/^\s*bagian\s+i\s*$/im.test(teks ?? '')) return hal - 1;
  }
  throw new Error('Halaman pembatas "Bagian I" tidak ketemu di 12 halaman pertama.');
}

// ---------------------------------------------------------------------- alur

async function main() {
  if (!CHROMIUM) {
    console.error('Chromium tidak ditemukan. Pasang chromium atau google-chrome.');
    process.exit(1);
  }
  if (!fs.existsSync(path.join(ROOT, '.next'))) {
    console.error('Belum ada hasil build. Jalankan `npm run build` lebih dulu.');
    process.exit(1);
  }
  // Server lama di port ini akan menyajikan HTML build lama yang berkas CSS-nya
  // sudah terhapus, dan PDF-nya tercetak tanpa gaya sama sekali.
  if (await portTerpakai(PORT)) {
    console.error(`Port ${PORT} sudah dipakai. Hentikan prosesnya, atau pakai PDF_PORT lain.`);
    process.exit(1);
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'buku-pdf-'));
  const server = spawn('npm', ['run', 'start'], {
    cwd: ROOT,
    env: { ...process.env, PORT },
    stdio: 'ignore',
  });
  const browser = spawn(
    CHROMIUM,
    [
      '--headless',
      '--disable-gpu',
      `--remote-debugging-port=${PORT_CDP}`,
      // Sejak Chrome 111 koneksi DevTools yang membawa header Origin ditolak —
      // dan WebSocket bawaan Node selalu mengirimkannya. Tanpa flag ini,
      // sambungan tidak pernah terbuka dan skrip menggantung tanpa pesan.
      '--remote-allow-origins=*',
      `--user-data-dir=${path.join(tmp, 'profil')}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let cdp;
  try {
    await tungguSiap(`http://127.0.0.1:${PORT}/cetak`);
    await tungguSiap(`http://127.0.0.1:${PORT_CDP}/json/version`, 30);

    const { webSocketDebuggerUrl } = await (
      await fetch(`http://127.0.0.1:${PORT_CDP}/json/version`)
    ).json();
    cdp = await Cdp.buka(webSocketDebuggerUrl);

    const url = `http://127.0.0.1:${PORT}/cetak`;
    const isi = path.join(tmp, 'isi.pdf');

    // Daftar isi butuh nomor halaman, dan nomor halaman baru diketahui setelah
    // dicetak. Jadi: cetak, baca posisi penanda, tulis petanya, cetak lagi.
    // Diulang sampai peta tidak berubah — mengisi nomor bisa menggeser baris,
    // dan pergeseran itu harus ikut terhitung.
    let peta = {};
    for (let putaran = 1; putaran <= 4; putaran++) {
      console.log(`Lintasan ${putaran}: mencetak isi…`);
      fs.writeFileSync(isi, await cetak(cdp, url, { pakaiHeader: true }));

      const petaBaru = petaPenanda(isi);
      const jumlahBaru = Object.keys(petaBaru).length;
      if (jumlahBaru === 0) throw new Error('Tidak ada penanda daftar isi yang terbaca.');

      if (JSON.stringify(petaBaru) === JSON.stringify(peta)) {
        console.log(`Nomor halaman stabil (${jumlahBaru} entri).`);
        break;
      }
      peta = petaBaru;
      fs.writeFileSync(PETA, JSON.stringify(peta, null, 2));
      if (putaran === 4) console.log('Peringatan: nomor halaman belum stabil setelah 4 lintasan.');
    }

    console.log('Mencetak bagian depan (tanpa header)…');
    const depan = path.join(tmp, 'depan.pdf');
    fs.writeFileSync(depan, await cetak(cdp, url, { pakaiHeader: false }));

    const batas = halamanBagianDepan(depan);
    console.log(`Bagian depan: ${batas} halaman.`);

    fs.mkdirSync(path.dirname(KELUARAN), { recursive: true });
    const gabung = spawnSync(
      'qpdf',
      [
        '--empty',
        '--pages',
        depan,
        `1-${batas}`,
        isi,
        `${batas + 1}-z`,
        '--',
        KELUARAN,
      ],
      { stdio: 'inherit' },
    );
    if (gabung.status !== 0 || !fs.existsSync(KELUARAN)) {
      throw new Error('qpdf gagal menyambung kedua bagian.');
    }

    const jumlah = spawnSync('pdfinfo', [KELUARAN], { encoding: 'utf8' })
      .stdout.match(/Pages:\s+(\d+)/)?.[1];
    const mb = (fs.statSync(KELUARAN).size / 1024 / 1024).toFixed(1);
    console.log(`\nPDF ditulis: public/${path.basename(KELUARAN)} — ${jumlah} halaman, ${mb} MB`);
  } finally {
    fs.rmSync(PETA, { force: true });
    cdp?.tutup();
    browser.kill('SIGTERM');
    server.kill('SIGTERM');
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
