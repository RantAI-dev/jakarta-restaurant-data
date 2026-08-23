'use client';

import type { ReactNode } from 'react';

/** Sumbu resesif: tinta redup, tanpa garis centang, hairline sebagai dasar. */
export const sumbuProps = {
  tick: { fill: 'var(--viz-muted)', fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: 'var(--viz-axis)' },
} as const;

export const kisiProps = {
  stroke: 'var(--viz-grid)',
  strokeDasharray: '0',
  vertical: false,
} as const;

interface BarisTooltip {
  nama: string;
  nilai: ReactNode;
  warna: string;
}

/** Kotak tooltip seragam — nama seri memakai tinta teks, warna dibawa penanda. */
export function KotakTooltip({ judul, baris }: { judul: ReactNode; baris: BarisTooltip[] }) {
  return (
    <div className="rounded-lg border border-fd-border bg-fd-popover px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-medium text-fd-foreground">{judul}</p>
      <ul className="space-y-0.5">
        {baris.map((b) => (
          <li key={b.nama} className="flex items-center gap-2 text-fd-muted-foreground">
            <span
              aria-hidden
              className="size-2 shrink-0 rounded-[2px]"
              style={{ background: b.warna }}
            />
            <span className="flex-1">{b.nama}</span>
            <span className="font-medium tabular-nums text-fd-foreground">{b.nilai}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Legenda manual: penanda warna + label teks, tidak pernah warna saja. */
export function Legenda({ item }: { item: { label: string; warna: string }[] }) {
  return (
    <ul className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5 px-2 text-xs text-fd-muted-foreground">
      {item.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2 shrink-0 rounded-[2px]"
            style={{ background: i.warna }}
          />
          {i.label}
        </li>
      ))}
    </ul>
  );
}
