import { RootProvider } from 'fumadocs-ui/provider/next';
import './global.css';
import type { Metadata } from 'next';
import { Fraunces, IBM_Plex_Sans } from 'next/font/google';
import { i18nProvider } from 'fumadocs-ui/i18n';
import { appName, appSubtitle } from '@/lib/shared';
import { terjemahan } from '@/lib/terjemahan';

/** Serif bertekstur untuk judul — nada buku cetak, bukan dokumentasi perangkat lunak. */
const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
  display: 'swap',
});

/** Sans teknis untuk prosa panjang dan angka tabel. */
const body = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: appName,
    template: `%s · ${appName}`,
  },
  description: appSubtitle,
};

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="id"
      className={`${display.variable} ${body.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <RootProvider i18n={i18nProvider(terjemahan)}>{children}</RootProvider>
      </body>
    </html>
  );
}
