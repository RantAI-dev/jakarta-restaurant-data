'use client';

import { npsTop10Driver as data } from '@/data/figures';
import { Figure, TabelData } from '@/components/figure';

const koef = (n: number) => n.toFixed(2).replace('.', ',');

const ARTI_SIGNIFIKANSI: Record<string, string> = {
  '***': 'signifikan pada taraf 1 persen',
  '**': 'signifikan pada taraf 5 persen',
  '*': 'signifikan pada taraf 10 persen',
  ns: 'tidak signifikan',
};

export function TabelNpsDriver() {
  return (
    <Figure
      tipe="Tabel"
      id="6.3"
      judul="Sepuluh pendorong utama skor NPS kota"
      sumber="ilustrasi berdasarkan pola survei NPS perkotaan"
      catatan="Korelasi Spearman terhadap skor NPS individual. Tanda bintang menyatakan taraf signifikansi; ns berarti hubungannya tidak berbeda nyata dari nol."
      tabel={
        <TabelData
          kolom={['#', 'Pendorong', 'Aspek', 'Korelasi Spearman', 'Signifikansi']}
          rataKanan={[0, 3]}
          baris={data.map((d) => [
            d.peringkat,
            d.driver,
            d.aspek,
            <span key="k" className="inline-flex items-center justify-end gap-2">
              <span
                aria-hidden
                className="h-1.5 rounded-full bg-fd-primary/70"
                style={{ width: `${d.korelasi_spearman * 72}px` }}
              />
              <span className="tabular-nums w-9 text-right">{koef(d.korelasi_spearman)}</span>
            </span>,
            <span key="s" title={ARTI_SIGNIFIKANSI[d.signifikan]}>
              <span className="font-mono">{d.signifikan}</span>
              <span className="sr-only"> — {ARTI_SIGNIFIKANSI[d.signifikan]}</span>
            </span>,
          ])}
        />
      }
    />
  );
}
