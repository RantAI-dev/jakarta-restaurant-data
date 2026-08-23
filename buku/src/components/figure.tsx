'use client';

import { useId, useState, type ReactNode } from 'react';
import { ChartColumn, Table as TableIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FigureProps {
  /** "Grafik" atau "Tabel" — dipakai apa adanya di keterangan. */
  tipe: 'Grafik' | 'Tabel';
  /** Nomor visual sesuai naskah, mis. "4.5.1". */
  id: string;
  judul: string;
  sumber: string;
  catatan?: string;
  /** Tampilan tabel; wajib untuk grafik, jadi angkanya selalu bisa dibaca. */
  tabel: ReactNode;
  /** Bagan. Kosongkan bila visual ini memang murni tabel. */
  children?: ReactNode;
}

/**
 * Bingkai visual buku: bagan, keterangan bernomor, sumber, dan tampilan tabel.
 *
 * Tampilan tabel bukan pelengkap — ia yang menjamin angka tetap terbaca saat
 * warna gagal dibedakan (buta warna, cetak hitam-putih, mode kontras paksa).
 */
export function Figure({ tipe, id, judul, sumber, catatan, tabel, children }: FigureProps) {
  const [tampilan, setTampilan] = useState<'grafik' | 'tabel'>(
    children ? 'grafik' : 'tabel',
  );
  const panelId = useId();

  return (
    <figure className="viz my-8 not-prose">
      <div className="rounded-xl border border-fd-border bg-fd-card overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-4 pt-4">
          <p className="text-sm font-medium text-fd-foreground">
            <span className="text-fd-primary">
              {tipe} {id}
            </span>
            <span className="text-fd-muted-foreground"> · </span>
            {judul}
          </p>
          {children ? (
            <div
              role="group"
              aria-label="Tampilan data"
              className="shrink-0 flex rounded-lg border border-fd-border p-0.5"
            >
              <TombolTampilan
                aktif={tampilan === 'grafik'}
                onClick={() => setTampilan('grafik')}
                aria-controls={panelId}
              >
                <ChartColumn className="size-3.5" aria-hidden />
                Grafik
              </TombolTampilan>
              <TombolTampilan
                aktif={tampilan === 'tabel'}
                onClick={() => setTampilan('tabel')}
                aria-controls={panelId}
              >
                <TableIcon className="size-3.5" aria-hidden />
                Tabel
              </TombolTampilan>
            </div>
          ) : null}
        </div>

        <div id={panelId} className="px-2 pb-2 pt-3 sm:px-4 sm:pb-4">
          {tampilan === 'grafik' && children ? (
            children
          ) : (
            <div className="overflow-x-auto">{tabel}</div>
          )}
        </div>
      </div>

      <figcaption className="mt-2 text-xs leading-relaxed text-fd-muted-foreground">
        {catatan ? <span className="block">{catatan}</span> : null}
        <span>Sumber: {sumber}</span>
      </figcaption>
    </figure>
  );
}

function TombolTampilan({
  aktif,
  children,
  ...props
}: {
  aktif: boolean;
  children: ReactNode;
} & React.ComponentPropsWithoutRef<'button'>) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      className={cn(
        'flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
        aktif
          ? 'bg-fd-primary/10 text-fd-primary'
          : 'text-fd-muted-foreground hover:text-fd-foreground',
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Tabel data seragam untuk semua visual. */
export function TabelData({
  kolom,
  baris,
  rataKanan = [],
}: {
  kolom: string[];
  baris: ReactNode[][];
  /** Indeks kolom angka — dirata-kanan dengan angka lebar tetap. */
  rataKanan?: number[];
}) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr className="border-b border-fd-border">
          {kolom.map((k, i) => (
            <th
              key={k}
              scope="col"
              className={cn(
                'py-2 px-3 font-medium text-fd-muted-foreground text-xs',
                rataKanan.includes(i) ? 'text-right' : 'text-left',
              )}
            >
              {k}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {baris.map((r, i) => (
          <tr key={i} className="border-b border-fd-border/60 last:border-0">
            {r.map((sel, j) => (
              <td
                key={j}
                className={cn(
                  'py-1.5 px-3',
                  rataKanan.includes(j) && 'text-right tabular-nums',
                )}
              >
                {sel}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
