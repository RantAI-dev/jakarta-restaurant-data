"""Maintenance Iceberg — expire snapshot lama supaya metadata tak menggembung.

Tiap overwrite Bronze/Gold bikin snapshot baru + file lama tetap tercatat.
Tanpa maintenance, metadata & storage membengkak seiring waktu. Modul ini
meng-expire snapshot yang lebih tua dari retensi (default 7 hari) untuk semua
tabel di namespace bronze_*/gold, menyisakan minimal 1 snapshot per tabel.

Dipakai: `python -m dispar_ingest.maintenance [hari_retensi]`, atau aset Dagster
mingguan.
"""

from __future__ import annotations

import json
import os
import sys

from .lake import get_catalog

RETENSI_HARI = int(os.environ.get("ICEBERG_RETENTION_DAYS", "7"))


def run_maintenance(retensi_hari: int = RETENSI_HARI) -> dict:
    catalog = get_catalog()
    namespaces = [".".join(ns) for ns in catalog.list_namespaces()]
    hasil = {"tabel": 0, "snapshot_diexpire": 0, "gagal": 0, "detail": []}

    for ns in namespaces:
        if not (ns.startswith("bronze") or ns == "gold"):
            continue
        for ident in catalog.list_tables(ns):
            hasil["tabel"] += 1
            name = ".".join(ident)
            try:
                from datetime import datetime, timedelta, timezone
                tbl = catalog.load_table(ident)
                before = len(list(tbl.snapshots()))
                # pyiceberg 0.11: expire_snapshots().older_than(dt).commit().
                # older_than butuh datetime ber-tz; snapshot terbaru dipertahankan.
                cutoff = datetime.now(timezone.utc) - timedelta(days=retensi_hari)
                tbl.maintenance.expire_snapshots().older_than(cutoff).commit()
                after = len(list(catalog.load_table(ident).snapshots()))
                diff = max(0, before - after)
                hasil["snapshot_diexpire"] += diff
                if diff:
                    hasil["detail"].append(f"{name}: {before}→{after} snapshot")
            except Exception as e:  # noqa: BLE001 — satu tabel gagal jangan hentikan sisanya
                hasil["gagal"] += 1
                hasil["detail"].append(f"{name}: GAGAL {str(e)[:80]}")

    print(json.dumps(hasil, indent=2, ensure_ascii=False), flush=True)
    return hasil


if __name__ == "__main__":
    hari = int(sys.argv[1]) if len(sys.argv) > 1 else RETENSI_HARI
    run_maintenance(hari)
    sys.exit(0)
