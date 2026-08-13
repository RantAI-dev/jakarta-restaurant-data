"""Orkestrasi pipeline penuh sebagai fungsi yang bisa dipanggil.

Dipakai dua cara:
  - CLI: `python -m dispar_ingest.refresh all`
  - Dagster: tiap fungsi jadi satu asset (lihat orchestrate/).

Urutan mencerminkan ketergantungan nyata:
  bronze → lake_db → functions+dim → silver_auto → curated+gold
Ini juga persis bentuk graf lineage yang ditampilkan /lineage.
"""

from __future__ import annotations

import glob
import os
import sys

import clickhouse_connect


def _ch():
    return clickhouse_connect.get_client(
        host=os.environ.get("CH_HOST", "lake-clickhouse"),
        port=int(os.environ.get("CH_PORT", "8123")),
        username=os.environ.get("CH_USER", "dispar"),
        password=os.environ.get("CH_PASSWORD", "disparch"),
    )


def _run_sql_file(ch, path: str) -> None:
    with open(path, "r", encoding="utf-8") as f:
        sql = f.read()
    # Pisah per pernyataan; ClickHouse HTTP tidak menerima multi-statement.
    for stmt in _split_statements(sql):
        if stmt.strip():
            ch.command(stmt, settings={"allow_insert_into_iceberg": 1})


def _split_statements(sql: str) -> list[str]:
    """Pisah SQL per ';' di akhir baris, abaikan komentar '--'."""
    out, buf = [], []
    for line in sql.splitlines():
        s = line.strip()
        if s.startswith("--") or not s:
            continue
        buf.append(line)
        if s.endswith(";"):
            out.append("\n".join(buf).rstrip(";\n "))
            buf = []
    if buf:
        out.append("\n".join(buf).rstrip(";\n "))
    return out


SQL_DIR = os.environ.get("SQL_DIR", "/repo/lakehouse/clickhouse/sql")
CATALOG_DB = os.environ.get("CH_CATALOG_DB", "lake")


def recreate_lake_db(ch=None) -> str:
    """Sambungkan ulang ClickHouse ke katalog Iceberg (hilang bila container dibuat ulang)."""
    ch = ch or _ch()
    s3 = os.environ.get("S3_ACCESS_KEY", "disparlake")
    sk = os.environ.get("S3_SECRET_KEY", "disparlakesecret")
    ep = os.environ.get("S3_STORAGE_ENDPOINT", "http://lake-rustfs:9000/lakehouse")
    cat = os.environ.get("ICEBERG_CATALOG_URI", "http://lake-catalog:8181/catalog")
    wh = os.environ.get("ICEBERG_WAREHOUSE", "dispar")
    ch.command(f"DROP DATABASE IF EXISTS {CATALOG_DB}")
    ch.command(
        f"CREATE DATABASE {CATALOG_DB} "
        f"ENGINE = DataLakeCatalog('{cat}', '{s3}', '{sk}') "
        f"SETTINGS catalog_type='rest', storage_endpoint='{ep}', warehouse='{wh}'"
    )
    n = len(ch.query(f"SHOW TABLES FROM {CATALOG_DB}").result_rows)
    return f"lake tersambung: {n} tabel Bronze"


def apply_functions_dim(ch=None) -> str:
    """Fungsi konversi + dimensi (butuh Bronze untuk dim_indikator)."""
    ch = ch or _ch()
    files = ["00-functions.sql", "10-dim.sql", "11-dim-more.sql"]
    for f in files:
        _run_sql_file(ch, os.path.join(SQL_DIR, f))
    return f"terapkan {len(files)} berkas fungsi+dimensi"


def apply_curated_gold(ch=None) -> str:
    """Silver kurasi + mart Gold (butuh view Silver otomatis lebih dulu)."""
    ch = ch or _ch()
    files = sorted(
        f for f in glob.glob(os.path.join(SQL_DIR, "2*.sql")) + glob.glob(os.path.join(SQL_DIR, "3*.sql"))
    )
    for f in files:
        _run_sql_file(ch, f)
    return f"terapkan {len(files)} berkas kurasi+gold"


def run_all() -> None:
    from .run_bronze import ingest_files, ingest_sdi

    print(">>> Bronze SDI", flush=True)
    ingest_sdi()
    print(">>> Bronze berkas", flush=True)
    ingest_files()
    ch = _ch()
    print(">>>", recreate_lake_db(ch), flush=True)
    print(">>>", apply_functions_dim(ch), flush=True)
    print(">>> Silver otomatis", flush=True)
    from .silver import generate_silver

    generate_silver()
    print(">>>", apply_curated_gold(ch), flush=True)
    print(">>> Publikasi Gold → Iceberg", flush=True)
    from .publish import publish_marts

    publish_marts()
    print(">>> SELESAI", flush=True)


if __name__ == "__main__":
    perintah = sys.argv[1] if len(sys.argv) > 1 else "all"
    if perintah == "all":
        run_all()
    else:
        print(f"perintah tak dikenal: {perintah}")
        sys.exit(1)
