import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { VisualMenyusul } from '@/components/visual-menyusul';
import { GrafikBaliWisman } from '@/components/figures/grafik-bali-wisman';
import { GrafikDiyTpkh } from '@/components/figures/grafik-diy-tpkh';
import { GrafikJakartaKomposisi } from '@/components/figures/grafik-jakarta-komposisi';
import { GrafikNpsDistribusi } from '@/components/figures/grafik-nps-distribusi';
import { TabelBaliTopNegara } from '@/components/figures/tabel-bali-top-negara';
import { TabelNpsDriver } from '@/components/figures/tabel-nps-driver';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    // Dipakai langsung oleh halaman hasil impor naskah — tanpa import per berkas.
    VisualMenyusul,
    GrafikBaliWisman,
    GrafikDiyTpkh,
    GrafikJakartaKomposisi,
    GrafikNpsDistribusi,
    TabelBaliTopNegara,
    TabelNpsDriver,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
