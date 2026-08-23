import { defineTranslations } from 'fumadocs-core/i18n';
import { uiTranslations } from 'fumadocs-ui/i18n';

/**
 * Antarmuka Fumadocs berbahasa Inggris secara bawaan. Buku ini berbahasa
 * Indonesia, jadi seluruh label yang terlihat pembaca diterjemahkan.
 */
export const terjemahan = defineTranslations()
  .extend(uiTranslations())
  .add({
    'Search(search trigger)': 'Cari',
    'Search(search dialog)': 'Cari isi buku',
    'Open Search(search trigger)(aria-label)': 'Buka pencarian',
    'Close Search(search dialog)(aria-label)': 'Tutup pencarian',
    'No results found(search dialog)': 'Tidak ada hasil',
    'On this page(table of contents)': 'Di halaman ini',
    'Table of Contents(inline table of contents)': 'Daftar isi halaman',
    'No Headings(table of contents)': 'Halaman ini tanpa subjudul',
    'Next Page(pagination)': 'Berikutnya',
    'Previous Page(pagination)': 'Sebelumnya',
    'Last updated on(page footer)': 'Terakhir diperbarui',
    'Hide Sidebar(sidebar)': 'Sembunyikan panel',
    'Show Sidebar(sidebar)': 'Tampilkan panel',
    'Open Sidebar(aria-label)': 'Buka panel samping',
    'Open Sidebar(sidebar)(aria-label)': 'Buka panel samping',
    'Close Sidebar(aria-label)': 'Tutup panel samping',
    'Close Sidebar(sidebar)(aria-label)': 'Tutup panel samping',
    'Collapse Sidebar(sidebar)(aria-label)': 'Ciutkan panel samping',
    'Toggle Menu(home layout header)(aria-label)': 'Buka menu',
    'Toggle Theme(theme switcher)(aria-label)': 'Ganti tema',
    'Light(theme switcher)(aria-label)': 'Terang',
    'Dark(theme switcher)(aria-label)': 'Gelap',
    'System(theme switcher)(aria-label)': 'Ikut sistem',
    'Copy Text(code block)(aria-label)': 'Salin',
    'Copied Text(code block)(aria-label)': 'Tersalin',
    'Copy Anchor Link(heading anchor)(aria-label)': 'Salin tautan ke bagian ini',
    'Copy Link(accordion)(aria-label)': 'Salin tautan',
    'Page Not Found(404 not found page)': 'Halaman tidak ditemukan',
    'Back to Home(404 not found page)': 'Kembali ke sampul',
    'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 not found page)':
      'Halaman yang dicari mungkin sudah dipindahkan, berganti nama, atau untuk sementara tidak tersedia.',
  });
