"""Uji pembaca berkas lokal."""

import os

from dispar_ingest.files import discover, read_delimited


def _tulis(tmp_path, nama, isi):
    p = os.path.join(tmp_path, nama)
    with open(p, "w", encoding="utf-8") as f:
        f.write(isi)
    return p


def test_read_delimited_tsv_membuang_baris_kosong(tmp_path):
    p = _tulis(
        tmp_path,
        "a.tsv",
        "nama\tjumlah\nAndi\t10\n\t\nBudi\t20\n",
    )
    rows = list(read_delimited(p))
    assert rows == [
        {"nama": "Andi", "jumlah": "10"},
        {"nama": "Budi", "jumlah": "20"},
    ]


def test_read_delimited_membuang_header_yang_terulang(tmp_path):
    p = _tulis(
        tmp_path,
        "b.tsv",
        "nama\tjumlah\nAndi\t10\nnama\tjumlah\nBudi\t20\n",
    )
    rows = list(read_delimited(p))
    assert [r["nama"] for r in rows] == ["Andi", "Budi"]


def test_read_delimited_csv_terdeteksi(tmp_path):
    p = _tulis(tmp_path, "c.csv", "a,b\n1,2\n")
    assert list(read_delimited(p)) == [{"a": "1", "b": "2"}]


def test_discover_menyaring_ekstensi_dan_berkas_kerja(tmp_path):
    for nama in [
        "bagus.tsv",
        "juga-bagus.csv",
        "abaikan.bak.xlsx",
        "data-KERJA.tsv",
        "catatan.md",
        "~$sementara.xlsx",
    ]:
        _tulis(tmp_path, nama, "a\n1\n")
    sub = os.path.join(tmp_path, "node_modules")
    os.makedirs(sub)
    _tulis(sub, "jangan.tsv", "a\n1\n")

    hasil = [os.path.basename(p) for p in discover(str(tmp_path))]
    assert hasil == ["bagus.tsv", "juga-bagus.csv"]
