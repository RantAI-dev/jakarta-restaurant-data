import type { Metadata } from 'next';
import { Download, ExternalLink } from 'lucide-react';
import { berkasPdf, appName } from '@/lib/shared';

export const metadata: Metadata = {
  title: 'Versi PDF',
  description: `Baca atau unduh ${appName} dalam satu berkas PDF.`,
};

/**
 * Pembaca PDF memakai penampil bawaan peramban lewat <iframe> — tidak ada
 * pustaka tambahan yang perlu diunduh pembaca. Peramban seluler yang menolak
 * menyematkan PDF akan menampilkan tautan cadangan di bawahnya.
 */
export default function HalamanPdf() {
  return (
    <main className="kertas flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-fd-primary">
              Versi PDF
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Satu berkas, siap cetak
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-fd-muted-foreground">
              Seluruh isi buku — sembilan bab, interlude, lampiran, dan 32 grafik
              serta tabel — dalam satu berkas A4. Isinya dihasilkan dari naskah
              yang sama dengan edisi web ini, jadi keduanya tidak pernah berbeda.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={berkasPdf}
              download
              className="inline-flex items-center gap-2 rounded-full bg-fd-primary px-4 py-2 text-sm font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              <Download className="size-4" aria-hidden />
              Unduh PDF
            </a>
            <a
              href={berkasPdf}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-fd-border px-4 py-2 text-sm font-medium transition-colors hover:bg-fd-accent"
            >
              <ExternalLink className="size-4" aria-hidden />
              Buka di tab baru
            </a>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-fd-border bg-fd-card">
          <iframe
            src={`${berkasPdf}#view=FitH`}
            title={`${appName} — versi PDF`}
            className="h-[78vh] w-full min-h-100"
          />
        </div>

        <p className="mt-3 text-xs text-fd-muted-foreground">
          Penampil tidak muncul? Sebagian peramban seluler tidak menyematkan PDF —
          pakai <a href={berkasPdf} className="underline">tautan langsung ini</a>.
        </p>
      </div>
    </main>
  );
}
