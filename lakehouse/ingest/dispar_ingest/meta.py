"""Tangkap metadata dataset SDI ke lake (namespace bronze_meta).

App asli membaca metadata kaya dari Postgres (tabel dataset/datasetSync/
datasetColumn): judul, deskripsi, sumber, frekuensi, satuan, definisi kolom.
Bronze baris mentah tidak memuat ini. Modul ini memanggil /search + /detail SDI
dan menyimpan metadata sebagai 3 tabel Iceberg, supaya app v2 bisa 1:1 tanpa
Postgres.

Tabel:
  bronze_meta.dataset_catalog  — dari /search (judul, tag, views, updated_at, tier)
  bronze_meta.dataset_sync     — dari /detail (frekuensi, satuan, sumber, total, table_name)
  bronze_meta.dataset_column   — dari /detail (key_asli, key_safe, tipe, deskripsi, ord)

key_safe = safe_name(key_asli): menjodohkan definisi kolom ke nama kolom di
tabel Bronze (yang di-snake_case). key_asli dipertahankan untuk header 1:1.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone

import pyarrow as pa

from .lake import get_catalog, safe_name
from .sdi import SdiClient


def _replace_table(catalog, namespace: str, name: str, table: pa.Table) -> int:
    catalog.create_namespace_if_not_exists(namespace)
    ident = (namespace, name)
    if catalog.table_exists(ident):
        catalog.drop_table(ident)
    t = catalog.create_table(ident, schema=table.schema)
    t.append(table)
    return table.num_rows


def capture_metadata(limit: int | None = None, tenant: str = "dispar-dki") -> dict:
    client = SdiClient()
    catalog = get_catalog()
    now = datetime.now(timezone.utc)

    print("Mengambil katalog dataset SDI...", flush=True)
    datasets = client.list_datasets()
    if limit:
        datasets = datasets[:limit]

    # ── dataset_catalog ────────────────────────────────────────────────────
    cat_rows = {
        "slug": [], "title": [], "description": [], "tags": [], "views": [],
        "updated_at": [], "tier": [], "table_name": [],
    }
    for d in datasets:
        cat_rows["slug"].append(d.slug)
        cat_rows["title"].append(d.title)
        cat_rows["description"].append(d.description or "")
        cat_rows["tags"].append(json.dumps(d.tags, ensure_ascii=False))
        cat_rows["views"].append(int(d.views))
        cat_rows["updated_at"].append(d.updated_at or "")
        cat_rows["tier"].append("primer")
        cat_rows["table_name"].append(safe_name(d.slug))
    catalog_tbl = pa.table({
        "slug": pa.array(cat_rows["slug"], pa.string()),
        "title": pa.array(cat_rows["title"], pa.string()),
        "description": pa.array(cat_rows["description"], pa.string()),
        "tags": pa.array(cat_rows["tags"], pa.string()),
        "views": pa.array(cat_rows["views"], pa.int64()),
        "updated_at": pa.array(cat_rows["updated_at"], pa.string()),
        "tier": pa.array(cat_rows["tier"], pa.string()),
        "table_name": pa.array(cat_rows["table_name"], pa.string()),
    })
    n_cat = _replace_table(catalog, "bronze_meta", "dataset_catalog", catalog_tbl)
    print(f"  dataset_catalog: {n_cat} baris", flush=True)

    # ── dataset_sync + dataset_column (per dataset via /detail) ─────────────
    sync_cols: dict[str, list] = {k: [] for k in [
        "slug", "title", "description", "sumber_data", "frekuensi", "satuan",
        "klasifikasi", "kontak", "author", "total", "table_name", "synced_at"]}
    col_cols: dict[str, list] = {k: [] for k in [
        "slug", "ord", "key_asli", "key_safe", "tipe", "deskripsi"]}

    gagal = []
    for i, d in enumerate(datasets, 1):
        try:
            det = client.dataset_detail(d.slug)
        except Exception as e:  # noqa: BLE001
            gagal.append({"slug": d.slug, "error": str(e)})
            continue
        sync_cols["slug"].append(d.slug)
        sync_cols["title"].append(det.title)
        sync_cols["description"].append(det.description or "")
        sync_cols["sumber_data"].append(json.dumps(det.sumber_data, ensure_ascii=False))
        sync_cols["frekuensi"].append(det.frekuensi or "")
        sync_cols["satuan"].append(det.satuan or "")
        sync_cols["klasifikasi"].append(det.klasifikasi or "")
        sync_cols["kontak"].append(det.kontak or "")
        sync_cols["author"].append(det.author or "")
        sync_cols["total"].append(0)  # diisi belakangan dari count Bronze
        sync_cols["table_name"].append(safe_name(d.slug))
        sync_cols["synced_at"].append(now)
        for ord_, c in enumerate(det.columns):
            key_asli = str(c.get("key") or "")
            if not key_asli:
                continue
            col_cols["slug"].append(d.slug)
            col_cols["ord"].append(ord_)
            col_cols["key_asli"].append(key_asli)
            col_cols["key_safe"].append(safe_name(key_asli))
            col_cols["tipe"].append(str(c.get("type") or ""))
            col_cols["deskripsi"].append(str(c.get("description") or ""))
        if i % 30 == 0:
            print(f"  ...detail {i}/{len(datasets)}", flush=True)

    sync_tbl = pa.table({
        "slug": pa.array(sync_cols["slug"], pa.string()),
        "title": pa.array(sync_cols["title"], pa.string()),
        "description": pa.array(sync_cols["description"], pa.string()),
        "sumber_data": pa.array(sync_cols["sumber_data"], pa.string()),
        "frekuensi": pa.array(sync_cols["frekuensi"], pa.string()),
        "satuan": pa.array(sync_cols["satuan"], pa.string()),
        "klasifikasi": pa.array(sync_cols["klasifikasi"], pa.string()),
        "kontak": pa.array(sync_cols["kontak"], pa.string()),
        "author": pa.array(sync_cols["author"], pa.string()),
        "total": pa.array(sync_cols["total"], pa.int64()),
        "table_name": pa.array(sync_cols["table_name"], pa.string()),
        "synced_at": pa.array(sync_cols["synced_at"], pa.timestamp("us", tz="UTC")),
    })
    col_tbl = pa.table({
        "slug": pa.array(col_cols["slug"], pa.string()),
        "ord": pa.array(col_cols["ord"], pa.int64()),
        "key_asli": pa.array(col_cols["key_asli"], pa.string()),
        "key_safe": pa.array(col_cols["key_safe"], pa.string()),
        "tipe": pa.array(col_cols["tipe"], pa.string()),
        "deskripsi": pa.array(col_cols["deskripsi"], pa.string()),
    })
    n_sync = _replace_table(catalog, "bronze_meta", "dataset_sync", sync_tbl)
    n_col = _replace_table(catalog, "bronze_meta", "dataset_column", col_tbl)
    print(f"  dataset_sync: {n_sync} baris | dataset_column: {n_col} baris", flush=True)

    laporan = {"katalog": n_cat, "sync": n_sync, "kolom": n_col, "gagal": len(gagal)}
    print("\n" + json.dumps(laporan, ensure_ascii=False), flush=True)
    return laporan


def fill_totals() -> int:
    """Isi kolom total di bronze_meta.dataset_sync dari count baris Bronze.

    Dijalankan SETELAH Bronze + lake_db siap. Membaca sync, menghitung tiap
    tabel bronze_sdi.<table_name> via ClickHouse, lalu menulis ulang tabel sync
    dengan total terisi. Butuh env CH_HOST + katalog lake sudah tersambung.
    """
    import os

    import clickhouse_connect

    catalog = get_catalog()
    ch = clickhouse_connect.get_client(
        host=os.environ.get("CH_HOST", "lake-clickhouse"),
        port=int(os.environ.get("CH_PORT", "8123")),
        username=os.environ.get("CH_USER", "dispar"),
        password=os.environ.get("CH_PASSWORD", "disparch"),
    )
    tbl = catalog.load_table(("bronze_meta", "dataset_sync"))
    arrow = tbl.scan().to_arrow()
    slugs = arrow.column("slug").to_pylist()
    tnames = arrow.column("table_name").to_pylist()

    # Tabel yang benar-benar ada di katalog (sebagian dataset kosong/gagal).
    ada = {n.split(".", 1)[1] for n in
           (r[0] for r in ch.query("SHOW TABLES FROM lake").result_rows)
           if n.startswith("bronze_sdi.")}
    totals = []
    for tn in tnames:
        if tn in ada:
            try:
                totals.append(int(ch.query(f"SELECT count() FROM lake.`bronze_sdi.{tn}`").result_rows[0][0]))
            except Exception:  # noqa: BLE001
                totals.append(0)
        else:
            totals.append(0)

    new = arrow.set_column(arrow.schema.get_field_index("total"),
                           "total", pa.array(totals, pa.int64()))
    _replace_table(catalog, "bronze_meta", "dataset_sync", new)
    terisi = sum(1 for t in totals if t > 0)
    print(f"  total terisi untuk {terisi}/{len(totals)} dataset", flush=True)
    return terisi


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "totals":
        fill_totals()
        sys.exit(0)
    lim = int(sys.argv[1]) if len(sys.argv) > 1 else None
    capture_metadata(limit=lim)
    sys.exit(0)
