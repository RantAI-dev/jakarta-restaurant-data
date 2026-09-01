import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { GambarBuku } from '@/components/gambar-buku';
import { VisualMenyusul } from '@/components/visual-menyusul';

export function getMDXComponents(components?: MDXComponents) {
  return {
    ...defaultMdxComponents,
    // Dipakai langsung oleh halaman hasil impor naskah — tanpa import per berkas.
    GambarBuku,
    VisualMenyusul,
    ...components,
  } satisfies MDXComponents;
}

export const useMDXComponents = getMDXComponents;

declare global {
  type MDXProvidedComponents = ReturnType<typeof getMDXComponents>;
}
