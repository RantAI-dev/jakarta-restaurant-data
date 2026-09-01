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

type Halaman = NonNullable<ReturnType<typeof source.getPage>>;
type Bab = { label: string; judul: string; halaman: Halaman[] };
type Bagian = { judul: string; deskripsi?: string; bab: Bab[] };

const ANGKA_ROMAWI = ['I', 'II', 'III', 'IV', 'V', 'VI'];

/** Susun pohon halaman menjadi bagian → bab → halaman. */
function strukturBuku(): { bagian: Bagian[]; lampiran: Bab | null } {
  const semua = source.getPages();
  const cariHalaman = (url: string) => semua.find((p) => p.url === url);

  const halamanDari = (node: { type: string; children?: unknown[] }): Halaman[] => {
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

/** Halaman "Pengantar" tidak diberi judul lagi — ia pembuka bab. */
function IsiHalaman({ halaman, sembunyikanJudul }: { halaman: Halaman; sembunyikanJudul?: boolean }) {
  const komponen = getMDXComponents();
  return (
    <section className="cetak-subbab">
      {sembunyikanJudul ? null : <h2>{halaman.data.title}</h2>}
      <halaman.data.body components={komponen} />
    </section>
  );
}

export default function HalamanCetak() {
  const { bagian, lampiran } = strukturBuku();
  const tanggal = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

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
        <ol>
          {bagian.map((b, i) => (
            <li key={b.judul}>
              <p className="di-bagian">
                Bagian {ANGKA_ROMAWI[i]} · {b.judul}
              </p>
              <ol>
                {b.bab.map((bab) => (
                  <li key={bab.label}>
                    <p className="di-bab">
                      <span>{bab.label}</span> {bab.judul}
                    </p>
                    <ol>
                      {bab.halaman
                        .filter((h) => h.data.title !== 'Pengantar')
                        .map((h) => (
                          <li key={h.url} className="di-subbab">
                            {h.data.title}
                          </li>
                        ))}
                    </ol>
                  </li>
                ))}
              </ol>
            </li>
          ))}
          {lampiran ? (
            <li>
              <p className="di-bagian">Lampiran</p>
              <ol>
                {lampiran.halaman.map((h) => (
                  <li key={h.url} className="di-subbab">
                    {h.data.title}
                  </li>
                ))}
              </ol>
            </li>
          ) : null}
        </ol>
      </section>

      {/* --------------------------------------------------------- isi buku */}
      {bagian.map((b, i) => (
        <div key={b.judul}>
          <section className="cetak-bagian">
            <p className="cetak-bagian-nomor">Bagian {ANGKA_ROMAWI[i]}</p>
            <h1>{b.judul}</h1>
            {b.deskripsi ? <p className="cetak-bagian-deskripsi">{b.deskripsi}</p> : null}
          </section>

          {b.bab.map((bab) => (
            <article key={bab.label} className="cetak-bab">
              <header className="cetak-bab-kepala">
                <p className="cetak-bab-label">{bab.label}</p>
                <h1>{bab.judul}</h1>
              </header>
              {bab.halaman.map((h, j) => (
                <IsiHalaman
                  key={h.url}
                  halaman={h}
                  sembunyikanJudul={j === 0 && h.data.title === 'Pengantar'}
                />
              ))}
            </article>
          ))}
        </div>
      ))}

      {lampiran ? (
        <div>
          <section className="cetak-bagian">
            <p className="cetak-bagian-nomor">Lampiran</p>
            <h1>Glosarium, Akronim, Indeks, Etika, dan Sumber</h1>
          </section>
          {lampiran.halaman.map((h) => (
            <article key={h.url} className="cetak-bab">
              <header className="cetak-bab-kepala">
                <h1>{h.data.title}</h1>
              </header>
              <IsiHalaman halaman={h} sembunyikanJudul />
            </article>
          ))}
        </div>
      ) : null}
    </main>
  );
}
