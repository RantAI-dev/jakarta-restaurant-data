import fs from 'node:fs';
import path from 'node:path';
import type { Metadata } from 'next';
import { source } from '@/lib/source';
import { getMDXComponents } from '@/components/mdx';
import { appName, appSubtitle } from '@/lib/shared';

/**
 * Seluruh isi buku dalam satu halaman, ditata untuk kertas.
 *
 * Halaman ini adalah sumber berkas PDF: `npm run pdf:build` mencetaknya lewat
 * Chromium headless ke `public/buku-statistika-pariwisata-perkotaan.pdf`.
 * Karena PDF-nya lahir dari isi yang sama dengan edisi web, keduanya tidak
 * mungkin berbeda.
 *
 * Susunannya mengikuti konvensi buku: sampul, halaman kredit, daftar isi,
 * lalu bagian → bab. Yang memulai halaman baru hanya bab, bukan tiap sub-bab —
 * kalau tiap sub-bab dipaksa pindah halaman, sebagian besar halaman jadi
 * setengah kosong.
 */
export const metadata: Metadata = {
  title: 'Versi cetak',
  robots: { index: false, follow: false },
};

// Peta nomor halaman dibaca saat permintaan datang, bukan saat build: skrip
// pencetak menulis petanya di antara dua lintasan cetak.
export const dynamic = 'force-dynamic';

type Halaman = NonNullable<ReturnType<typeof source.getPage>>;
type Bab = { label: string; judul: string; halaman: Halaman[] };
type Bagian = { judul: string; deskripsi?: string; bab: Bab[] };

const ANGKA_ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/**
 * Nomor halaman tiap entri daftar isi, hasil lintasan cetak sebelumnya.
 * Kosong pada lintasan pertama — daftar isinya dicetak tanpa nomor.
 */
function petaHalaman(): Record<string, number> {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), '.pdf-index.json'), 'utf8'));
  } catch {
    return {};
  }
}

/** Susun pohon halaman menjadi bagian → bab → halaman. */
function strukturBuku(): { bagian: Bagian[]; lampiran: Bab | null } {
  const semua = source.getPages();
  const cariHalaman = (url: string) => semua.find((p) => p.url === url);

  const halamanDari = (node: { children?: unknown[] }): Halaman[] => {
    const anak = (node.children ?? []) as { type: string; url?: string }[];
    return anak.flatMap((c) => {
      if (c.type !== 'page' || !c.url) return [];
      const page = cariHalaman(c.url);
      return page ? [page] : [];
    });
  };

  const bagian: Bagian[] = [];
  let lampiran: Bab | null = null;

  for (const node of source.getPageTree().children) {
    if (node.type !== 'folder') continue;
    const id = String(node.$id ?? '');

    if (id.includes('lampiran')) {
      lampiran = { label: '', judul: 'Lampiran', halaman: halamanDari(node) };
      continue;
    }
    if (!id.includes('bagian')) continue;

    const bab = node.children.flatMap((anak) => {
      if (anak.type !== 'folder') return [];
      const [label, ...sisa] = String(anak.name).split(' · ');
      return [{ label, judul: sisa.join(' · '), halaman: halamanDari(anak) }];
    });

    bagian.push({
      judul: String(node.name).replace(/^Bagian [IVX]+ · /, ''),
      deskripsi: node.description ? String(node.description) : undefined,
      bab,
    });
  }

  return { bagian, lampiran };
}

/**
 * Penanda posisi. Teksnya ikut tercetak di lapisan teks PDF (tanpa terlihat),
 * sehingga skrip pencetak bisa membaca di halaman berapa entri ini jatuh.
 */
function Penanda({ id }: { id: string }) {
  return <span className="cetak-penanda">{`PM${id}PM`}</span>;
}

/** Satu baris daftar isi: judul, titik-titik penuntun, nomor halaman. */
function BarisIsi({
  kelas,
  label,
  judul,
  nomor,
}: {
  kelas: string;
  label?: string;
  judul: string;
  nomor?: number;
}) {
  return (
    <p className={kelas}>
      {label ? <span className="di-label">{label}</span> : null}
      <span className="di-judul">{judul}</span>
      <span className="di-titik" aria-hidden />
      <span className="di-nomor">{nomor ?? ''}</span>
    </p>
  );
}

function IsiHalaman({
  halaman,
  sembunyikanJudul,
  penanda,
}: {
  halaman: Halaman;
  sembunyikanJudul?: boolean;
  penanda: string;
}) {
  const komponen = getMDXComponents();
  return (
    <section className="cetak-subbab">
      {sembunyikanJudul ? (
        <Penanda id={penanda} />
      ) : (
        <h2>
          <Penanda id={penanda} />
          {halaman.data.title}
        </h2>
      )}
      <halaman.data.body components={komponen} />
    </section>
  );
}

export default function HalamanCetak() {
  const { bagian, lampiran } = strukturBuku();
  const peta = petaHalaman();
  const tanggal = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Penanda diberi nomor urut yang sama saat merender daftar isi maupun isi
  // buku, jadi keduanya selalu merujuk entri yang sama.
  const idBagian = (i: number) => `g${i}`;
  const idBab = (i: number, j: number) => `g${i}b${j}`;
  const idSub = (i: number, j: number, k: number) => `g${i}b${j}s${k}`;
  const idLampiran = (k: number) => `lam${k}`;

  return (
    <main className="cetak">
      {/* ------------------------------------------------------------ sampul */}
      <section className="cetak-sampul">
        <p className="cetak-instansi">Dinas Pariwisata dan Ekonomi Kreatif</p>
        <h1>{appName}</h1>
        <p className="cetak-subjudul">{appSubtitle}</p>
        <p className="cetak-edisi">Edisi Perdana · 2026</p>
      </section>

      {/* ------------------------------------------------------------ kredit */}
      <section className="cetak-kredit">
        <h2>{appName}</h2>
        <p>Edisi Perdana, 2026</p>
        <dl>
          <dt>Disusun untuk</dt>
          <dd>Dinas Pariwisata dan Ekonomi Kreatif</dd>
          <dt>Penyusun</dt>
          <dd>RantAI</dd>
          <dt>Berkas ini dicetak</dt>
          <dd>{tanggal}</dd>
        </dl>
        <p className="cetak-catatan">
          Naskah berada pada tahap proofreading, sehingga isinya masih dapat
          berubah. Seluruh grafik dan tabel dihasilkan dari data yang sumbernya
          dicantumkan pada masing-masing visual.
        </p>
        <p className="cetak-catatan">
          Edisi web dari buku yang sama tersedia dan isinya identik dengan berkas
          ini.
        </p>
      </section>

      {/* -------------------------------------------------------- daftar isi */}
      <section className="cetak-daftar-isi">
        <h2>Daftar Isi</h2>
        {bagian.map((b, i) => (
          <div key={b.judul} className="di-blok">
            <BarisIsi
              kelas="di-bagian"
              judul={`Bagian ${ANGKA_ROMAWI[i]} · ${b.judul}`}
              nomor={peta[idBagian(i)]}
            />
            {b.bab.map((bab, j) => (
              <div key={bab.label}>
                <BarisIsi
                  kelas="di-bab"
                  label={bab.label}
                  judul={bab.judul}
                  nomor={peta[idBab(i, j)]}
                />
                {bab.halaman
                  .map((h, k) => ({ h, k }))
                  .filter(({ h }) => h.data.title !== 'Pengantar')
                  .map(({ h, k }) => (
                    <BarisIsi
                      key={h.url}
                      kelas="di-subbab"
                      judul={h.data.title}
                      nomor={peta[idSub(i, j, k)]}
                    />
                  ))}
              </div>
            ))}
          </div>
        ))}

        {lampiran ? (
          <div className="di-blok">
            <BarisIsi kelas="di-bagian" judul="Lampiran" nomor={peta.lampiran} />
            {lampiran.halaman.map((h, k) => (
              <BarisIsi
                key={h.url}
                kelas="di-subbab"
                judul={h.data.title}
                nomor={peta[idLampiran(k)]}
              />
            ))}
          </div>
        ) : null}
      </section>

      {/* --------------------------------------------------------- isi buku */}
      {bagian.map((b, i) => (
        <div key={b.judul}>
          <section className="cetak-bagian">
            {/* Ilustrasi tanpa teks; keterangannya ada pada judul di bawahnya. */}
            <img src={`/gambar/pembatas-bagian-${i + 1}.png`} alt="" />
            <p className="cetak-bagian-nomor">
              <Penanda id={idBagian(i)} />
              Bagian {ANGKA_ROMAWI[i]}
            </p>
            <h1>{b.judul}</h1>
            {b.deskripsi ? <p className="cetak-bagian-deskripsi">{b.deskripsi}</p> : null}
          </section>

          {b.bab.map((bab, j) => (
            <article key={bab.label} className="cetak-bab">
              <header className="cetak-bab-kepala">
                <p className="cetak-bab-label">
                  <Penanda id={idBab(i, j)} />
                  {bab.label}
                </p>
                <h1>{bab.judul}</h1>
              </header>
              {bab.halaman.map((h, k) => (
                <IsiHalaman
                  key={h.url}
                  halaman={h}
                  penanda={idSub(i, j, k)}
                  sembunyikanJudul={k === 0 && h.data.title === 'Pengantar'}
                />
              ))}
            </article>
          ))}
        </div>
      ))}

      {lampiran ? (
        <div>
          <section className="cetak-bagian">
            <p className="cetak-bagian-nomor">
              <Penanda id="lampiran" />
              Lampiran
            </p>
            <h1>Glosarium, Akronim, Indeks, Etika, dan Sumber</h1>
          </section>
          {lampiran.halaman.map((h, k) => (
            <article key={h.url} className="cetak-bab">
              <header className="cetak-bab-kepala">
                <h1>
                  <Penanda id={idLampiran(k)} />
                  {h.data.title}
                </h1>
              </header>
              <IsiHalaman halaman={h} penanda={`isi-${idLampiran(k)}`} sembunyikanJudul />
            </article>
          ))}
        </div>
      ) : null}
    </main>
  );
}
