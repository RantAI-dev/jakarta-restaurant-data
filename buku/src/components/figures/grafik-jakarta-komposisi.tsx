'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { jakartaKomposisiKunjungan2023 as mentah } from '@/data/figures';
import { Figure, TabelData } from '@/components/figure';
import { KotakTooltip, kisiProps, sumbuProps } from './chart-parts';

/** Komposisi satu keseluruhan: batang berperingkat, satu warna, label langsung. */
const data = [...mentah].sort((a, b) => b.proporsi_persen - a.proporsi_persen);

const persen = (n: number) => `${n}%`;

export function GrafikJakartaKomposisi() {
  return (
    <Figure
      tipe="Grafik"
      id="4.5.6"
      judul="Komposisi maksud kunjungan ke Jakarta, 2023 (persen)"
      sumber="BPS DKI Jakarta, Disparekraf DKI, diolah"
      catatan="Bisnis dan MICE bersama-sama menyumbang 46 persen — porsi yang jauh lebih besar daripada Bali atau DIY, dan menjelaskan mengapa lama tinggal di Jakarta lebih pendek."
      tabel={
        <TabelData
          kolom={['Maksud kunjungan', 'Proporsi']}
          rataKanan={[1]}
          baris={data.map((d) => [d.kategori, persen(d.proporsi_persen)])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={240}>
        <BarChart
          data={data as unknown as Record<string, number>[]}
          layout="vertical"
          margin={{ top: 4, right: 40, bottom: 4, left: 8 }}
        >
          <CartesianGrid {...kisiProps} vertical horizontal={false} />
          <XAxis type="number" domain={[0, 40]} hide />
          <YAxis
            type="category"
            dataKey="kategori"
            width={78}
            {...sumbuProps}
            tick={{ fill: 'var(--viz-muted)', fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: 'var(--viz-grid)', fillOpacity: 0.5 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <KotakTooltip
                  judul={String(payload[0].payload.kategori)}
                  baris={[
                    {
                      nama: 'Proporsi kunjungan',
                      nilai: persen(Number(payload[0].value)),
                      warna: 'var(--series-1)',
                    },
                  ]}
                />
              ) : null
            }
          />
          <Bar
            dataKey="proporsi_persen"
            fill="var(--series-1)"
            radius={[0, 4, 4, 0]}
            barSize={18}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="proporsi_persen"
              position="right"
              formatter={(v) => persen(Number(v))}
              style={{ fill: 'var(--viz-muted)', fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Figure>
  );
}
