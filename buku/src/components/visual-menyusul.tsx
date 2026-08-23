import { ChartColumn, Table as TableIcon, Image as ImageIcon } from 'lucide-react';

const IKON = {
  Grafik: ChartColumn,
  Tabel: TableIcon,
  Gambar: ImageIcon,
} as const;

interface Props {
  tipe: keyof typeof IKON;
  id: string;
  deskripsi: string;
  sumber?: string;
}

/**
 * Penanda visual yang sudah dirancang di naskah tetapi datanya belum tersedia.
 *
 * Naskah menyimpannya sebagai `[INSERT GRAFIK 3.1: …]`. Menampilkannya sebagai
 * kartu — bukan menyembunyikannya — membuat pembaca tahu apa yang seharusnya ada
 * di titik itu, dan membuat sisa pekerjaan buku ini terlihat.
 */
export function VisualMenyusul({ tipe, id, deskripsi, sumber }: Props) {
  const Ikon = IKON[tipe] ?? ChartColumn;

  return (
    <div className="my-8 not-prose rounded-xl border border-dashed border-fd-border bg-fd-muted/40 p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Ikon className="size-4 text-fd-muted-foreground" aria-hidden />
        <span className="text-fd-primary">
          {tipe} {id}
        </span>
        <span className="rounded-full bg-fd-muted px-2 py-0.5 text-[11px] font-normal text-fd-muted-foreground">
          menyusul
        </span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-fd-muted-foreground">{deskripsi}</p>
      {sumber ? (
        <p className="mt-1.5 text-xs text-fd-muted-foreground">Sumber: {sumber}</p>
      ) : null}
    </div>
  );
}
