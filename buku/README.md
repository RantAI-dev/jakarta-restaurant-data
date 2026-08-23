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
git add content src/data && git commit -m "sinkronisasi naskah"
```

Lalu redeploy stack di Portainer (lihat `DEPLOY.md`).

## Apa yang dilakukan importer

`scripts/import-book.mjs`:

1. Memetakan bab ke empat bagian sesuai `bab/kerangka.md`.
2. Memecah tiap bab menjadi satu halaman per sub-bab, plus halaman pengantar.
3. Mengubah `[INSERT GRAFIK 3.1: …]` menjadi komponen:
   - enam visual yang datanya tersedia → grafik/tabel interaktif;
   - sisanya → kartu `VisualMenyusul` berisi rancangan visual tersebut.
4. Melindungi karakter yang menyalakan parser JSX (`<` dalam prosa, autolink).
5. Menulis CSV di `bab/assets/data/` menjadi `src/data/figures.ts`, supaya
   grafik memakai angka yang sama dengan naskah.

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
│   └── global.css           # tema oranye + palet visualisasi data
├── components/
│   ├── figure.tsx           # bingkai visual + pengalih grafik/tabel
│   ├── figures/             # enam visual berbasis data
│   ├── visual-menyusul.tsx  # kartu untuk visual yang belum ada datanya
│   └── mdx.tsx              # registrasi komponen untuk MDX
├── data/figures.ts          # DIBUAT OTOMATIS dari CSV naskah
└── lib/
content/docs/                # DIBUAT OTOMATIS dari naskah (kecuali index.mdx)
```

`content/docs/index.mdx` ditulis tangan — itu halaman pengantar edisi web, bukan
bagian dari naskah cetak.

## Warna grafik

Palet visualisasi di `global.css` sudah divalidasi terhadap gate lightness,
chroma, pemisahan buta warna, ambang penglihatan normal, dan kontras — untuk
mode terang maupun gelap. Setiap grafik juga menyediakan tampilan tabel, jadi
angkanya tetap terbaca tanpa mengandalkan warna.
