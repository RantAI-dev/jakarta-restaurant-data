'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { npsDistribusiContoh as data } from '@/data/figures';
import { Figure, TabelData } from '@/components/figure';
import { KotakTooltip, Legenda, kisiProps, sumbuProps } from './chart-parts';

/**
 * Tiga kelompok NPS punya kutub makna (detractor ↔ promoter), sehingga warnanya
 * diambil dari pasangan diverging dengan netral abu-abu di tengah — bukan tiga
 * warna kategorikal yang setara.
 */
const KELOMPOK = {
  Detractor: { label: 'Detractor (0–6)', warna: 'var(--pole-negatif)' },
  Passive: { label: 'Passive (7–8)', warna: 'var(--pole-netral)' },
  Promoter: { label: 'Promoter (9–10)', warna: 'var(--pole-positif)' },
} as const;

const persen = (n: number) => `${n.toFixed(1).replace('.', ',')}%`;

const total = (k: keyof typeof KELOMPOK) =>
  data.filter((d) => d.kategori === k).reduce((s, d) => s + d.proporsi_persen, 0);

export function GrafikNpsDistribusi() {
  const nps = total('Promoter') - total('Detractor');

  return (
    <Figure
      tipe="Grafik"
      id="6.3"
      judul="Distribusi skor NPS wisatawan kota (contoh, persen responden)"
      sumber="ilustrasi berdasarkan pola survei NPS perkotaan"
      catatan={`Promoter ${persen(total('Promoter'))} dikurangi detractor ${persen(
        total('Detractor'),
      )} menghasilkan NPS ${nps > 0 ? '+' : ''}${nps.toFixed(1).replace('.', ',')} — passive tidak ikut dihitung, meski porsinya ${persen(total('Passive'))}.`}
      tabel={
        <TabelData
          kolom={['Skor', 'Kelompok', 'Proporsi responden']}
          rataKanan={[2]}
          baris={data.map((d) => [
            d.skor,
            KELOMPOK[d.kategori as keyof typeof KELOMPOK].label,
            persen(d.proporsi_persen),
          ])}
        />
      }
    >
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data as unknown as Record<string, number>[]}
          margin={{ top: 8, right: 16, bottom: 0, left: -8 }}
        >
          <CartesianGrid {...kisiProps} />
          <XAxis dataKey="skor" {...sumbuProps} />
          <YAxis {...sumbuProps} width={44} tickFormatter={(v: number) => `${v}%`} />
          <Tooltip
            cursor={{ fill: 'var(--viz-grid)', fillOpacity: 0.5 }}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <KotakTooltip
                  judul={`Skor ${payload[0].payload.skor}`}
                  baris={[
                    {
                      nama: KELOMPOK[payload[0].payload.kategori as keyof typeof KELOMPOK]
                        .label,
                      nilai: persen(Number(payload[0].value)),
                      warna:
                        KELOMPOK[payload[0].payload.kategori as keyof typeof KELOMPOK]
                          .warna,
                    },
                  ]}
                />
              ) : null
            }
          />
          <Bar dataKey="proporsi_persen" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell
                key={d.skor}
                fill={KELOMPOK[d.kategori as keyof typeof KELOMPOK].warna}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <Legenda item={Object.values(KELOMPOK).map((k) => ({ label: k.label, warna: k.warna }))} />
    </Figure>
  );
}
