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
npm run pdf:build      # cetak ulang berkas PDF dari isi yang baru
npm run pdf:preview    # lihat halamannya sebelum percaya
git add content public && git commit -m "sinkronisasi naskah"
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

## Versi PDF

`npm run pdf:build` menjalankan server produksi, membuka `/cetak` (seluruh isi
buku dalam satu halaman bergaya kertas), lalu mencetaknya lewat Chromium ke
`public/buku-statistika-pariwisata-perkotaan.pdf`. Berkasnya di-commit karena
image build Vercel tidak punya Chromium.

Halaman `/pdf` menyematkan berkas itu dengan penampil bawaan peramban. Karena
PDF lahir dari halaman yang sama dengan edisi web, isinya tidak mungkin berbeda
— tetapi PDF **tidak** ikut berubah sampai `npm run pdf:build` dijalankan ulang.

### Setelah build, lihat hasilnya

```bash
npm run pdf:preview            # 13 halaman contoh → .pdf-preview/*.png
npm run pdf:preview -- 38 41   # rentang halaman tertentu
```

Cacat tata letak — kolom tabel gepeng, header hilang, gambar meluber, halaman
setengah kosong — tidak pernah terlihat dari kode. Semua cacat yang pernah
ditemukan di sini ketahuan dari memandangi PNG-nya.

### Kenapa skripnya serumit itu

Empat hal yang tidak kelihatan tetapi wajib, masing-masing pernah memakan waktu:

- **Protokol DevTools, bukan `--print-to-pdf`.** Hanya lewat `Page.printToPDF`
  header berjalan dan nomor halaman bisa dipasang.
- **`--remote-allow-origins=*`.** Sejak Chrome 111 sambungan DevTools yang
  membawa header `Origin` ditolak, dan WebSocket bawaan Node selalu
  mengirimkannya. Tanpa flag ini skrip menggantung tanpa satu pun pesan galat.
- **`transferMode: 'ReturnAsStream'`.** PDF 5 MB dikirim sebagai satu pesan
  base64 ~7 MB tidak pernah sampai; perintahnya menggantung. Dengan stream,
  cetaknya selesai dalam hitungan detik.
- **`Emulation.setEmulatedMedia` ke mode terang.** Headless mengikuti tema
  sistem; kalau sistemnya gelap, area margin PDF memakai warna kanvas gelap dan
  tiap halaman tercetak berbingkai hitam sampai ke tepi kertas.
- **Gambar `loading="eager"`.** Halaman cetak memuat seluruh buku sekaligus;
  gambar yang ditunda tidak pernah termuat dan hilang dari PDF. Skrip menolak
  mencetak bila gambar yang termuat kurang dari 32.

Daftar isi bernomor halaman butuh lintasan tambahan: halaman `/cetak` menanam
penanda tak terlihat di tiap bab dan sub-bab, skrip membaca posisinya dari
lapisan teks PDF, menuliskannya ke `.pdf-index.json`, lalu mencetak ulang.
Diulang sampai petanya tidak berubah — mengisi nomor bisa menggeser baris, dan
pergeseran itu harus ikut terhitung.

Dicetak dua kali lalu disambung dengan qpdf: bagian depan (sampul, kredit,
daftar isi) tanpa running head, sisanya dengan header dan nomor halaman.
Batasnya dihitung dari halaman pertama yang memuat pembatas "Bagian I", bukan
angka tetap yang akan basi begitu daftar isinya memanjang.

## Visual

Semua grafik dan tabel diambil dari `bab/assets/figures/` — berkas yang dirender
skrip matplotlib di repo naskah, sama persis dengan yang dipakai buku cetak.
Keterangan dan sumber sudah tercetak di dalam gambar, sehingga edisi web tidak
mengulangnya; deskripsi dari naskah dipakai sebagai teks alternatif.

Edisi web sengaja tidak menggambar ulang visualnya sendiri: setiap naskah
diperbarui, versi gambar ulang akan menyimpang dari bukunya.
