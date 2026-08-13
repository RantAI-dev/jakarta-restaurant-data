"""Publikasi lapisan Gold ke Iceberg (portabilitas ke Oracle/Trino/Spark).

Gold hidup sebagai tabel MergeTree ClickHouse untuk melayani dashboard cepat.
Tapi klaim arsitektur "fleksibel siap ke Oracle" (MoM) menuntut Gold juga
tersedia dalam format tabel terbuka. Modul ini menyalin tiap serving.mart_*
menjadi tabel Iceberg di namespace `gold` — dapat dibaca engine mana pun yang
mengerti Iceberg tanpa migrasi data.

Alur: ClickHouse (baca mart, Arrow) → pyiceberg (tulis Parquet + metadata).
"""

from __future__ import annotations

import os
import sys

import clickhouse_connect
import pyarrow as pa

from .lake import get_catalog

MARTS = [
    "mart_wisman", "mart_gci_readiness", "mart_kuliner",
    "mart_kunjungan_dtw", "mart_event", "mart_atlas",
]


def _ch():
    return clickhouse_connect.get_client(
        host=os.environ.get("CH_HOST", "lake-clickhouse"),
        port=int(os.environ.get("CH_PORT", "8123")),
        username=os.environ.get("CH_USER", "dispar"),
        password=os.environ.get("CH_PASSWORD", "disparch"),
    )


def publish_marts(marts: list[str] | None = None) -> dict:
    marts = marts or MARTS
    ch = _ch()
    catalog = get_catalog()
    catalog.create_namespace_if_not_exists("gold")

    hasil = {}
    for m in marts:
        tbl: pa.Table = ch.query_arrow(f"SELECT * FROM serving.{m}")
        # pyiceberg butuh skema tanpa tipe non-nullable yang aneh; normalkan ke
        # skema Arrow apa adanya (ClickHouse Arrow sudah bertipe benar).
        ident = ("gold", m)
        if catalog.table_exists(ident):
            catalog.drop_table(ident)
        it = catalog.create_table(ident, schema=tbl.schema)
        it.append(tbl)
        n = len(it.scan().to_arrow())
        hasil[m] = n
        print(f"  gold.{m} → Iceberg: {n} baris", flush=True)
    return hasil


if __name__ == "__main__":
    laporan = publish_marts()
    print("\nGold dipublikasi ke Iceberg:", laporan, flush=True)
    sys.exit(0 if laporan else 1)
