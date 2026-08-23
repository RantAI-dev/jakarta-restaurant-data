'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { baliWisman20192024 as data } from '@/data/figures';
import { Figure, TabelData } from '@/components/figure';
import { KotakTooltip, Legenda, kisiProps, sumbuProps } from './chart-parts';

const SERI = [
  { key: 'Australia', label: 'Australia', warna: 'var(--series-1)' },
  { key: 'RRC', label: 'RRC', warna: 'var(--series-2)' },
  { key: 'India', label: 'India', warna: 'var(--series-3)' },
  { key: 'Korea_Selatan', label: 'Korea Selatan', warna: 'var(--series-4)' },
  { key: 'Jepang', label: 'Jepang', warna: 'var(--series-5)' },
  { key: 'lainnya', label: 'Lainnya', warna: 'var(--series-6)' },
] as const;

const juta = (n: number) => n.toFixed(2).replace('.', ',');

export function GrafikBaliWisman() {
  return (
    <Figure
      tipe="Grafik"
      id="4.5.1"
      judul="Kunjungan wisman ke Bali per negara asal, 2019–2024 (juta kunjungan)"
      sumber="BPS Bali, diolah"
      catatan="Lonjakan 2022–2024 memulihkan volume 2019, tetapi komposisi negara asalnya berubah: RRC belum kembali ke tingkat prapandemi, sementara India naik lebih dari dua kali lipat."
      tabel={
        <TabelData
          kolom={['Tahun', 'Total', ...SERI.map((s) => s.label)]}
          rataKanan={[1, 2, 3, 4, 5, 6, 7]}
          baris={data.map((d) => [
            d.tahun,
            juta(d.total_juta),
            ...SERI.map((s) => juta(d[s.key])),
          ])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data as unknown as Record<string, number>[]} margin={{ top: 8, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid {...kisiProps} />
          <XAxis dataKey="tahun" {...sumbuProps} />
          {/* Satuan sudah disebut di judul visual, jadi sumbu tidak perlu label lagi. */}
          <YAxis {...sumbuProps} width={44} tickFormatter={(v: number) => juta(v)} />
          <Tooltip
            cursor={{ stroke: 'var(--viz-axis)', strokeWidth: 1 }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <KotakTooltip
                  judul={label as string}
                  baris={payload
                    .slice()
                    .sort((a, b) => Number(b.value) - Number(a.value))
                    .map((p) => ({
                      nama: SERI.find((s) => s.key === p.dataKey)?.label ?? String(p.dataKey),
                      nilai: `${juta(Number(p.value))} juta`,
                      warna: String(p.color),
                    }))}
                />
              ) : null
            }
          />
          {SERI.map((s) => (
            <Line
              key={s.key}
              // Linear, bukan monotone: data tahunan, lengkungan akan mengarang
              // nilai antar-titik yang tidak diukur.
              type="linear"
              dataKey={s.key}
              stroke={s.warna}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--viz-surface)' }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <Legenda item={SERI.map((s) => ({ label: s.label, warna: s.warna }))} />
    </Figure>
  );
}
