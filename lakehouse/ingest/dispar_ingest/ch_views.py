"""Bikin view ClickHouse yang membungkus tabel Iceberg Bronze.

Kenapa perlu: tabel di database DataLakeCatalog bernama `bronze_sdi.nama_tabel`
— titiknya bagian dari NAMA, bukan pemisah database. Setiap query harus
menulis lake.`bronze_sdi.x`, yang menyulitkan SQLMesh dan mudah salah kutip.

View ini memberi setiap tabel Bronze alamat SQL biasa: bronze_sdi.nama_tabel.
Tidak menyalin data — hanya alias.
"""

from __future__ import annotations

import os
import sys

import clickhouse_connect

CATALOG_DB = os.environ.get("CH_CATALOG_DB", "lake")


def client():
    return clickhouse_connect.get_client(
        host=os.environ.get("CH_HOST", "lake-clickhouse"),
        port=int(os.environ.get("CH_PORT", "8123")),
        username=os.environ.get("CH_USER", "dispar"),
        password=os.environ.get("CH_PASSWORD", "disparch"),
    )


def catalog_tables(ch) -> list[tuple[str, str]]:
    """Daftar (namespace, tabel) dari database katalog."""
    hasil = []
    for (nama,) in ch.query(f"SHOW TABLES FROM {CATALOG_DB}").result_rows:
        if "." not in nama:
            continue
        ns, _, tbl = nama.partition(".")
        hasil.append((ns, tbl))
    return sorted(hasil)


def refresh_views(ch=None) -> dict[str, int]:
    ch = ch or client()
    tabel = catalog_tables(ch)

    namespaces = sorted({ns for ns, _ in tabel})
    for ns in namespaces:
        ch.command(f"CREATE DATABASE IF NOT EXISTS {ns}")

    dibuat = 0
    gagal: list[str] = []
    for ns, tbl in tabel:
        src = f"{CATALOG_DB}.`{ns}.{tbl}`"
        try:
            ch.command(f"CREATE OR REPLACE VIEW {ns}.{tbl} AS SELECT * FROM {src}")
            dibuat += 1
        except Exception as e:  # noqa: BLE001 — satu tabel rusak tidak boleh
            # menghentikan pembuatan view yang lain.
            print(f"  view {ns}.{tbl} GAGAL: {e}", file=sys.stderr, flush=True)
            gagal.append(f"{ns}.{tbl}")

    return {"tabel": len(tabel), "view_dibuat": dibuat, "gagal": len(gagal)}


if __name__ == "__main__":
    laporan = refresh_views()
    print(laporan, flush=True)
    sys.exit(1 if laporan["view_dibuat"] == 0 else 0)
