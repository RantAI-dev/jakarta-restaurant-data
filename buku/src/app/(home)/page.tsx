import Link from 'next/link';
import { ArrowRight, BookOpen, FileText } from 'lucide-react';
import { source } from '@/lib/source';
import { appName, appSubtitle, mulaiBacaHref } from '@/lib/shared';

const ANGKA_ROMAWI = ['I', 'II', 'III', 'IV', 'V'];

/** Daftar isi diambil dari pohon halaman, jadi tidak pernah beda dengan naskah. */
function daftarBagian() {
  return source.getPageTree().children.flatMap((node) => {
    if (node.type !== 'folder' || !String(node.$id ?? '').includes('bagian')) return [];

    const bab = node.children.flatMap((anak) => {
      if (anak.type !== 'folder') return [];
      // Halaman pengantar bab: sebagai index folder, atau anak pertama.
      const awal = anak.index ?? anak.children.find((c) => c.type === 'page');
      if (!awal || awal.type !== 'page') return [];

      // Judul folder bab berbentuk "Bab 1 · Konseptualisasi …".
      const [label, ...sisa] = String(anak.name).split(' · ');
      return [{ label, judul: sisa.join(' · '), url: awal.url }];
    });

    return [{ judul: String(node.name), deskripsi: node.description, bab }];
  });
}

export default function HomePage() {
  const bagian = daftarBagian();
  const jumlahBab = bagian.reduce((n, b) => n + b.bab.length, 0);

  return (
    <main className="kertas flex-1">
      <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
        {/* ---------------------------------------------------------- sampul */}
        <section className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-fd-primary">
              Buku · Edisi Perdana 2026
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.6rem,6.5vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.025em] text-balance">
              Statistika
              <br />
              Pariwisata
              <br />
              <span className="text-fd-primary">Perkotaan</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-fd-muted-foreground">
              {appSubtitle} Ditulis untuk pembaca awam: setiap angka dibongkar sampai
              ke cara pengumpulannya, lengkap dengan bias dan batasnya.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={mulaiBacaHref}
                className="inline-flex items-center gap-2 rounded-full bg-fd-primary px-5 py-2.5 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
              >
                Mulai baca
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-full border border-fd-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
              >
                <BookOpen className="size-4" aria-hidden />
                Daftar isi
              </Link>
              <Link
                href="/pdf"
                className="inline-flex items-center gap-2 rounded-full border border-fd-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-fd-accent"
              >
                <FileText className="size-4" aria-hidden />
                Versi PDF
              </Link>
            </div>

            <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4 text-sm">
              {[
                ['4', 'bagian'],
                [String(jumlahBab), 'bab & interlude'],
                ['±214', 'halaman cetak'],
                ['5', 'lampiran'],
              ].map(([nilai, label]) => (
                <div key={label}>
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-display text-2xl font-semibold tabular-nums">
                    {nilai}
                    <span className="ml-1.5 font-sans text-xs font-normal uppercase tracking-wider text-fd-muted-foreground">
                      {label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Sampul buku — komposisi tipografis, bukan gambar. */}
          <div className="hidden lg:block">
            <div className="relative w-[248px] rotate-[-1.5deg] rounded-r-md rounded-l-sm border border-fd-border bg-fd-card shadow-[0_24px_48px_-24px_rgba(0,0,0,0.35)]">
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 w-2.5 rounded-l-sm bg-fd-primary"
              />
              <div className="flex h-[352px] flex-col justify-between p-6 pl-8">
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-fd-muted-foreground">
                  Dinas Pariwisata
                  <br />
                  dan Ekonomi Kreatif
                </p>
                <p className="font-display text-[26px] font-semibold leading-[1.12] tracking-tight">
                  Statistika Pariwisata Perkotaan
                </p>
                <div>
                  <span aria-hidden className="mb-3 block h-px w-12 bg-fd-primary" />
                  <p className="text-[11px] leading-relaxed text-fd-muted-foreground">
                    Metodologi, indikator, dan pembobotan
                    <br />
                    Global City Index
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ daftar isi */}
        <section className="mt-24">
          <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-fd-muted-foreground">
            Isi buku
          </h2>

          <ol className="mt-6">
            {bagian.map((b, i) => (
              <li key={b.judul} className="rule-tipis py-7 last:border-b last:border-fd-border">
                {/* Ilustrasi pembatas bagian yang sama dengan versi cetak. */}
                <img
                  src={`/gambar/pembatas-bagian-${i + 1}.png`}
                  alt=""
                  className="mb-6 h-24 w-full rounded-lg bg-white object-contain p-2 sm:h-32"
                />
                <div className="grid gap-4 sm:grid-cols-[3rem_1fr]">
                  <span
                    aria-hidden
                    className="font-display text-2xl font-semibold text-fd-primary/70 tabular-nums"
                  >
                    {ANGKA_ROMAWI[i]}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold tracking-tight">
                      {b.judul.replace(/^Bagian [IVX]+ · /, '')}
                    </h3>
                    {b.deskripsi ? (
                      <p className="mt-1 text-sm text-fd-muted-foreground">{b.deskripsi}</p>
                    ) : null}
                    <ul className="mt-4 space-y-1.5">
                      {b.bab.map((bab) => (
                        <li key={bab.url}>
                          <Link
                            href={bab.url}
                            className="group flex gap-3 text-[15px] transition-colors hover:text-fd-primary"
                          >
                            <span className="w-28 shrink-0 text-fd-muted-foreground transition-colors group-hover:text-fd-primary">
                              {bab.label}
                            </span>
                            <span className="text-pretty">{bab.judul}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* ---------------------------------------------------------- catatan */}
        <section className="mt-16 rounded-xl border border-fd-border bg-fd-card/60 p-6">
          <h2 className="font-display text-base font-semibold">Tentang edisi web ini</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fd-muted-foreground">
            Naskah masih dalam tahap proofreading, sehingga isinya dapat berubah.
            Seluruh 32 grafik dan tabel memakai berkas yang sama persis dengan
            naskah cetak, jadi angka yang dibaca di sini identik dengan yang ada
            di bukunya.
          </p>
          <p className="mt-4 text-xs text-fd-muted-foreground">
            {appName} · disiapkan RantAI untuk Dinas Pariwisata dan Ekonomi Kreatif.
          </p>
        </section>
      </div>
    </main>
  );
}
