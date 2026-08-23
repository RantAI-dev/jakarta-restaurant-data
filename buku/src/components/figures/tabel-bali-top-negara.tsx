'use client';

import { baliTopNegara2023 as data } from '@/data/figures';
import { Figure, TabelData } from '@/components/figure';

const ribu = (n: number) => n.toLocaleString('id-ID');
const persen = (n: number) => `${n.toFixed(1).replace('.', ',')}%`;

const maks = Math.max(...data.map((d) => d.pangsa_persen));

export function TabelBaliTopNegara() {
  return (
    <Figure
      tipe="Tabel"
      id="4.5.2"
      judul="Sepuluh negara asal wisman terbesar ke Bali, 2023"
      sumber="BPS Bali, diolah"
      catatan="Lima negara teratas menyumbang lebih dari 70 persen kunjungan — konsentrasi yang membuat kunjungan Bali sensitif terhadap gangguan di segelintir pasar."
      tabel={
        <TabelData
          kolom={['#', 'Negara asal', 'Kunjungan (ribu)', 'Pangsa']}
          rataKanan={[0, 2]}
          baris={data.map((d) => [
            d.peringkat,
            d.negara,
            ribu(d.kunjungan_ribu),
            <span key="pangsa" className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-1.5 rounded-full bg-fd-primary/70"
                style={{ width: `${(d.pangsa_persen / maks) * 72}px` }}
              />
              <span className="tabular-nums w-12 text-right">{persen(d.pangsa_persen)}</span>
            </span>,
          ])}
        />
      }
    />
  );
}
