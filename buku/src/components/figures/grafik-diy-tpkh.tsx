'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { diyTpkh20192024 as mentah } from '@/data/figures';
import { Figure, TabelData } from '@/components/figure';
import { KotakTooltip, Legenda, kisiProps, sumbuProps } from './chart-parts';

const SERI = [
  { key: 'Bintang', label: 'Hotel bintang', warna: 'var(--series-1)' },
  { key: 'Nonbintang', label: 'Hotel nonbintang', warna: 'var(--series-2)' },
] as const;

/** CSV tersimpan dalam bentuk panjang (satu baris per kategori-tahun). */
const data = [...new Set(mentah.map((d) => d.tahun))].map((tahun) => ({
  tahun,
  ...Object.fromEntries(
    SERI.map((s) => [
      s.key,
      mentah.find((d) => d.tahun === tahun && d.kategori === s.key)?.TPKH_persen ?? 0,
    ]),
  ),
})) as { tahun: number; Bintang: number; Nonbintang: number }[];

const persen = (n: number) => `${n.toFixed(1).replace('.', ',')}%`;

export function GrafikDiyTpkh() {
  return (
    <Figure
      tipe="Grafik"
      id="4.5.3"
      judul="Tingkat penghunian kamar hotel DIY menurut kategori, 2019–2024 (persen)"
      sumber="BPS DIY, diolah"
      catatan="Hotel bintang jatuh lebih dalam pada 2020 dan pulih lebih cepat; selisih antar-kategori pada 2024 kembali menyerupai pola 2019."
      tabel={
        <TabelData
          kolom={['Tahun', ...SERI.map((s) => s.label)]}
          rataKanan={[1, 2]}
          baris={data.map((d) => [d.tahun, persen(d.Bintang), persen(d.Nonbintang)])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} barGap={2} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid {...kisiProps} />
          <XAxis dataKey="tahun" {...sumbuProps} />
          <YAxis
            {...sumbuProps}
            width={44}
            domain={[0, 80]}
            tickFormatter={(v: number) => `${v}%`}
          />
          <Tooltip
            cursor={{ fill: 'var(--viz-grid)', fillOpacity: 0.5 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <KotakTooltip
                  judul={label as string}
                  baris={payload.map((p) => ({
                    nama: SERI.find((s) => s.key === p.dataKey)?.label ?? String(p.dataKey),
                    nilai: persen(Number(p.value)),
                    warna: String(p.color),
                  }))}
                />
              ) : null
            }
          />
          {SERI.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              fill={s.warna}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
      <Legenda item={SERI.map((s) => ({ label: s.label, warna: s.warna }))} />
    </Figure>
  );
}
