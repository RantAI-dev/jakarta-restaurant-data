#!/usr/bin/env python3
"""Normalisasi ilustrasi sampul dan pembatas bagian sebelum dipasang ke buku.

Keluaran model gambar hampir selalu punya dua cacat yang tidak kelihatan di
layar tetapi merusak halaman cetak: latar yang tidak benar-benar putih (253–254,
sehingga tampak sebagai kotak abu-abu di atas kertas putih), dan margin kosong
lebar yang membuat ilustrasi mengecil sendiri di tengah halaman.

Masukan : docs/generation/{I,II,III,IV,judul}.png
Keluaran: public/gambar/pembatas-bagian-{1..4}.png dan sampul.png

Jalankan: npm run illustrations:build
"""

import pathlib
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Butuh Pillow: pip install --user pillow")

ROOT = pathlib.Path(__file__).resolve().parent.parent
MASUK = ROOT / "docs" / "generation"
KELUAR = ROOT / "public" / "gambar"

# Ambang putih: piksel di atas nilai ini dianggap latar, bukan tinta.
AMBANG_PUTIH = 246
# Padding akhir, dalam persen lebar gambar setelah dipangkas.
PADDING = 0.02

# Empat pembatas bagian + satu ilustrasi sampul.
SUMBER = {"I": "pembatas-bagian-1", "II": "pembatas-bagian-2", "III": "pembatas-bagian-3",
          "IV": "pembatas-bagian-4", "judul": "sampul"}


def normalisasi(masuk: pathlib.Path, keluar: pathlib.Path) -> str:
    im = Image.open(masuk).convert("RGB")
    asal = im.size

    # 1. Ratakan latar ke putih murni.
    im = im.point(lambda v: 255 if v > AMBANG_PUTIH else v)

    # 2. Buang margin kosong.
    abu = im.convert("L").point(lambda v: 0 if v > 250 else 255)
    kotak = ImageOps.invert(ImageOps.invert(abu)).getbbox()
    if kotak:
        im = im.crop(kotak)

    # 3. Padding seragam supaya ilustrasi tidak menempel ke tepi bingkai.
    pad = int(im.width * PADDING)
    im = ImageOps.expand(im, border=(pad, pad, pad, pad), fill=(255, 255, 255))

    keluar.parent.mkdir(parents=True, exist_ok=True)
    im.save(keluar, optimize=True)
    return f"{masuk.name}: {asal[0]}×{asal[1]} → {im.size[0]}×{im.size[1]}"


def main() -> None:
    if not MASUK.exists():
        sys.exit(f"Folder ilustrasi tidak ada: {MASUK}")

    print("Menormalisasi ilustrasi:")
    dibuat = 0
    for nama, keluaran in SUMBER.items():
        masuk = MASUK / f"{nama}.png"
        if not masuk.exists():
            print(f"  {nama}.png belum ada, dilewati")
            continue
        print("  " + normalisasi(masuk, KELUAR / f"{keluaran}.png"))
        dibuat += 1

    print(f"\n{dibuat} ilustrasi ditulis ke public/gambar/.")


if __name__ == "__main__":
    main()
