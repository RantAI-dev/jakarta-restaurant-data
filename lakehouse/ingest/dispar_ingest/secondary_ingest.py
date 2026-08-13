"""Ingest dataset SEKUNDER (data olahan/kurasi) ke lake.

Dataset sekunder adalah JSON {slug,title,description,columns,rows} di
data/sekunder/ — wisman bersih per negara/bulan/pintu, TripAdvisor, halal,
artis chart, dll. Ini DATA PROCESSED (sudah dibersihkan), yang memang mau
ditampilkan app 1:1.

Menulis:
  bronze_sec.<safe(slug)>              — baris (all-string)
  bronze_meta_sec.dataset_catalog      — slug/title/tags/tier=sekunder
  bronze_meta_sec.dataset_sync         — metadata + total
  bronze_meta_sec.dataset_column       — key_asli/key_safe/tipe/deskripsi

Store meng-UNION meta primer+sekunder; generate_silver mengetik bronze_sec
juga (silver.<safe(slug)>), sehingga tampilan memakai data processed.
"""

from __future__ import annotations

import glob
import json
import os
from datetime import datetime, timezone

import pyarrow as pa

from .lake import build_table, get_catalog, safe_name
from .meta import _replace_table

# File tanpa slug embedded → slug/title dari secondary.ts.
OVERRIDE = {
    "event-visitors-2026.json": (
        "jumlah-pengunjung-event-2026", "Jumlah Pengunjung Event 2026",
        "Estimasi jumlah pengunjung event pariwisata & kebudayaan DKI Jakarta 2026.",
        ["event", "pengunjung", "2026", "sekunder"],
    ),
    "souvenir-tripadvisor-2026.json": (
        "toko-suvenir-tripadvisor-2026", "Toko Suvenir TripAdvisor 2026",
        "Toko suvenir DKI Jakarta bersumber TripAdvisor untuk indikator GCI.",
        ["souvenir", "tripadvisor", "gci", "sekunder"],
    ),
}

TAGS = {  # tag per slug (dari secondary.ts) untuk yg tak jelas dari file
    "wisman-jakarta-per-negara": ["wisman", "mancanegara", "negara", "sekunder"],
    "wisman-jakarta-per-bulan": ["wisman", "mancanegara", "bulanan", "sekunder"],
    "wisman-jakarta-per-pintu-masuk": ["wisman", "pintu-masuk", "sekunder"],
}


def _load(path: str):
    d = json.load(open(path, encoding="utf-8"))
    fname = os.path.basename(path)
    slug = d.get("slug")
    title = d.get("title")
    desc = d.get("description") or ""
    tags = ["sekunder"]
    if fname in OVERRIDE:
        slug, title, desc, tags = OVERRIDE[fname]
    if not slug:
        slug = safe_name(fname.replace(".json", ""))
    if slug in TAGS:
        tags = TAGS[slug]
    return {
        "slug": slug,
        "title": title or slug,
        "description": desc,
        "tags": tags,
        "columns": d.get("columns") or [],
        "rows": d.get("rows") or [],
    }


def ingest_secondary(root: str = "/repo/data/sekunder", tenant: str = "dispar-dki") -> dict:
    catalog = get_catalog()
    now = datetime.now(timezone.utc)
    files = sorted(glob.glob(os.path.join(root, "*.json")))
    print(f"{len(files)} dataset sekunder di {root}\n", flush=True)

    cat = {k: [] for k in ["slug", "title", "description", "tags", "views", "updated_at", "tier", "table_name"]}
    syn = {k: [] for k in ["slug", "title", "description", "sumber_data", "frekuensi", "satuan",
                            "klasifikasi", "kontak", "author", "total", "table_name", "synced_at"]}
    col = {k: [] for k in ["slug", "ord", "key_asli", "key_safe", "tipe", "deskripsi"]}

    ok = 0
    for path in files:
        ds = _load(path)
        slug, table = ds["slug"], safe_name(ds["slug"])
        rows = ds["rows"]
        data = build_table(rows, source_url=f"file://{path}", batch_id=now.strftime("%Y%m%dT%H%M%SZ"), tenant=tenant)
        if data is None:
            print(f"  {slug}: KOSONG", flush=True)
            continue
        # Bronze sekunder di namespace terpisah.
        ident = ("bronze_sec", table)
        catalog.create_namespace_if_not_exists("bronze_sec")
        if catalog.table_exists(ident):
            catalog.drop_table(ident)
        t = catalog.create_table(ident, schema=data.schema)
        t.append(data)
        n = data.num_rows

        cat["slug"].append(slug); cat["title"].append(ds["title"])
        cat["description"].append(ds["description"]); cat["tags"].append(json.dumps(ds["tags"], ensure_ascii=False))
        cat["views"].append(0); cat["updated_at"].append(now.strftime("%Y-%m-%d"))
        cat["tier"].append("sekunder"); cat["table_name"].append(table)

        syn["slug"].append(slug); syn["title"].append(ds["title"])
        syn["description"].append(ds["description"]); syn["sumber_data"].append(json.dumps([], ensure_ascii=False))
        syn["frekuensi"].append(""); syn["satuan"].append(""); syn["klasifikasi"].append("")
        syn["kontak"].append(""); syn["author"].append("Dinas Pariwisata & Ekonomi Kreatif DKI Jakarta")
        syn["total"].append(int(n)); syn["table_name"].append(table); syn["synced_at"].append(now)

        for ord_, c in enumerate(ds["columns"]):
            key = str(c.get("key") or "")
            if not key:
                continue
            col["slug"].append(slug); col["ord"].append(ord_)
            col["key_asli"].append(key); col["key_safe"].append(safe_name(key))
            col["tipe"].append(str(c.get("type") or "")); col["deskripsi"].append(str(c.get("description") or c.get("label") or ""))
        print(f"  {slug} — {n} baris, {len(ds['columns'])} kolom", flush=True)
        ok += 1

    _replace_table(catalog, "bronze_meta_sec", "dataset_catalog", pa.table({
        "slug": pa.array(cat["slug"], pa.string()), "title": pa.array(cat["title"], pa.string()),
        "description": pa.array(cat["description"], pa.string()), "tags": pa.array(cat["tags"], pa.string()),
        "views": pa.array(cat["views"], pa.int64()), "updated_at": pa.array(cat["updated_at"], pa.string()),
        "tier": pa.array(cat["tier"], pa.string()), "table_name": pa.array(cat["table_name"], pa.string()),
    }))
    _replace_table(catalog, "bronze_meta_sec", "dataset_sync", pa.table({
        "slug": pa.array(syn["slug"], pa.string()), "title": pa.array(syn["title"], pa.string()),
        "description": pa.array(syn["description"], pa.string()), "sumber_data": pa.array(syn["sumber_data"], pa.string()),
        "frekuensi": pa.array(syn["frekuensi"], pa.string()), "satuan": pa.array(syn["satuan"], pa.string()),
        "klasifikasi": pa.array(syn["klasifikasi"], pa.string()), "kontak": pa.array(syn["kontak"], pa.string()),
        "author": pa.array(syn["author"], pa.string()), "total": pa.array(syn["total"], pa.int64()),
        "table_name": pa.array(syn["table_name"], pa.string()),
        "synced_at": pa.array(syn["synced_at"], pa.timestamp("us", tz="UTC")),
    }))
    _replace_table(catalog, "bronze_meta_sec", "dataset_column", pa.table({
        "slug": pa.array(col["slug"], pa.string()), "ord": pa.array(col["ord"], pa.int64()),
        "key_asli": pa.array(col["key_asli"], pa.string()), "key_safe": pa.array(col["key_safe"], pa.string()),
        "tipe": pa.array(col["tipe"], pa.string()), "deskripsi": pa.array(col["deskripsi"], pa.string()),
    }))
    laporan = {"dataset": ok, "katalog": len(cat["slug"]), "kolom": len(col["slug"])}
    print("\n" + json.dumps(laporan, ensure_ascii=False), flush=True)
    return laporan


if __name__ == "__main__":
    import sys
    ingest_secondary(root=sys.argv[1] if len(sys.argv) > 1 else "/repo/data/sekunder")
    sys.exit(0)
