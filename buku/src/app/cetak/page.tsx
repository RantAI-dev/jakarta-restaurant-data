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
 */
export const metadata: Metadata = {
  title: 'Versi cetak',
  robots: { index: false, follow: false },
};

type Entri =
  | { jenis: 'bagian'; judul: string; deskripsi?: string }
  | { jenis: 'halaman'; page: NonNullable<ReturnType<typeof source.getPage>> };

/** Runtut isi mengikuti pohon halaman — urutannya sama dengan panel samping. */
function urutanIsi(): Entri[] {
  const hasil: Entri[] = [];

  const telusuri = (node: (typeof tree)['children'][number]) => {
    if (node.type === 'page') {
      const page = source.getPages().find((p) => p.url === node.url);
      if (page) hasil.push({ jenis: 'halaman', page });
      return;
    }
    if (node.type !== 'folder') return;
    if (node.index) telusuri(node.index);
    node.children.forEach(telusuri);
  };

  const tree = source.getPageTree();
  for (const node of tree.children) {
    if (node.type !== 'folder') continue;
    hasil.push({
      jenis: 'bagian',
      judul: String(node.name),
      deskripsi: node.description ? String(node.description) : undefined,
    });
    if (node.index) telusuri(node.index);
    node.children.forEach(telusuri);
  }

  return hasil;
}

export default function HalamanCetak() {
  const isi = urutanIsi();
  const komponen = getMDXComponents();

  return (
    <main className="cetak">
      <section className="cetak-sampul">
        <p className="cetak-instansi">Dinas Pariwisata dan Ekonomi Kreatif</p>
        <h1>{appName}</h1>
        <p className="cetak-subjudul">{appSubtitle}</p>
        <p className="cetak-edisi">Edisi Perdana · 2026</p>
      </section>

      {isi.map((entri, i) =>
        entri.jenis === 'bagian' ? (
          <section key={`bagian-${i}`} className="cetak-bagian">
            <h1>{entri.judul}</h1>
            {entri.deskripsi ? <p>{entri.deskripsi}</p> : null}
          </section>
        ) : (
          <article key={entri.page.url} className="cetak-halaman">
            <h2>{entri.page.data.title}</h2>
            <entri.page.data.body components={komponen} />
          </article>
        ),
      )}
    </main>
  );
}
