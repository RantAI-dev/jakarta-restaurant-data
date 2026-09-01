# Web Buku — Statistika Pariwisata Perkotaan

Edisi web dari buku *Statistika Pariwisata Perkotaan*, dibuat untuk Dinas
Pariwisata dan Ekonomi Kreatif. Dibangun dengan Next.js 16 + [Fumadocs], dan
di-*self-host* di server yang sama dengan platform data dan lakehouse.

[Fumadocs]: https://fumadocs.dev

## Hubungan dengan repo naskah

Naskah **tidak** tinggal di sini. Sumbernya ada di repo terpisah
`buku-statistika-pariwisata-perkotaan/`, yang di-*clone* sebagai *sibling* dari
folder ini:

```
Dinas-Pariwisata/
├── buku/                                  # aplikasi web (repo ini)
└── buku-statistika-pariwisata-perkotaan/  # naskah (repo terpisah)
    └── bab/*.md
```

`npm run import:book` membaca naskah itu dan menulis ulang isi
`content/docs/`. Hasil impor **ikut ter-commit**, sehingga build Docker tidak
perlu akses ke repo naskah.

### Memperbarui isi buku

```bash
cd ../buku-statistika-pariwisata-perkotaan && git pull
cd ../buku
npm run import:book
npm run build          # pastikan naskah baru tidak memecah MDX
git add content public/figures && git commit -m "sinkronisasi naskah"
```

Lalu deploy ulang (lihat `DEPLOY.md`).

## Apa yang dilakukan importer

`scripts/import-book.mjs`:

1. Memetakan bab ke empat bagian sesuai `bab/kerangka.md`.
2. Memecah tiap bab menjadi satu halaman per sub-bab, plus halaman pengantar.
3. Mengubah `[INSERT GRAFIK 3.1: …]` menjadi `<GambarBuku>` yang menunjuk ke
   figure resmi naskah, dicocokkan lewat penamaan berkas
   (`GRAFIK 3.1` → `grafik-3.1-moda-masuk.png`). Placeholder yang figure-nya
   belum dirender jadi kartu `VisualMenyusul` berisi rancangan visualnya.
4. Melindungi karakter yang menyalakan parser JSX (`<` dalam prosa, autolink).
5. Menyalin `bab/assets/figures/*.png` ke `public/figures/`.

Yang sengaja tidak diimpor: `*-selfedit.md`, `kerangka.md`, `placeholders.md`,
dan `state/` — semuanya dokumen kerja penyuntingan, bukan isi buku.

## Pengembangan

```bash
npm install
npm run import:book    # sekali, butuh repo naskah di sebelah
npm run dev            # http://localhost:3000
```

## Struktur

```
src/
├── app/
│   ├── (home)/page.tsx      # sampul + daftar isi
│   ├── docs/                # tata letak & halaman naskah
│   └── global.css           # tema oranye + tipografi naskah
├── components/
│   ├── gambar-buku.tsx      # bingkai figure resmi naskah
│   ├── visual-menyusul.tsx  # kartu untuk visual yang belum dirender
│   └── mdx.tsx              # registrasi komponen untuk MDX
└── lib/
content/docs/                # DIBUAT OTOMATIS dari naskah (kecuali index.mdx)
public/figures/              # DIBUAT OTOMATIS — salinan figure naskah
```

`content/docs/index.mdx` ditulis tangan — itu halaman pengantar edisi web, bukan
bagian dari naskah cetak.

## Visual

Semua grafik dan tabel diambil dari `bab/assets/figures/` — berkas yang dirender
skrip matplotlib di repo naskah, sama persis dengan yang dipakai buku cetak.
Keterangan dan sumber sudah tercetak di dalam gambar, sehingga edisi web tidak
mengulangnya; deskripsi dari naskah dipakai sebagai teks alternatif.

Edisi web sengaja tidak menggambar ulang visualnya sendiri: setiap naskah
diperbarui, versi gambar ulang akan menyimpang dari bukunya.
