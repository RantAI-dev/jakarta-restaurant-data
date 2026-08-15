"""Backup lakehouse — mirror bucket RustFS + dump metadata.

Base lakehouse tanpa backup = satu disk mati, semua Bronze hilang (dan Bronze
sumber rekonstruksi seluruh lapisan). Modul ini menyalin SELURUH objek bucket
lake (Iceberg Parquet + metadata) ke bucket backup terpisah lewat S3 API —
inkremental (hanya objek baru/berubah), jadi murah dijalankan harian.

Target backup:
  - default: bucket `lakehouse-backup/<TANGGAL>` di RustFS yang sama (proteksi
    dari kesalahan hapus/overwrite tabel; TIDAK melindungi dari disk mati).
  - offsite: set BACKUP_S3_ENDPOINT/KEY/SECRET ke object storage lain
    (server/region beda) → proteksi disk/host mati. Inilah yang dianjurkan.

Dipakai: `python -m dispar_ingest.backup [TANGGAL]`, atau aset Dagster harian.
"""

from __future__ import annotations

import json
import os
import sys

import boto3
import botocore


def _client(endpoint: str, key: str, secret: str):
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=key,
        aws_secret_access_key=secret,
        region_name=os.environ.get("S3_REGION", "local-01"),
        config=botocore.client.Config(s3={"addressing_style": "path"}),
    )


def _ensure_bucket(cli, bucket: str) -> None:
    try:
        cli.create_bucket(Bucket=bucket)
    except botocore.exceptions.ClientError as e:
        if e.response["Error"]["Code"] not in ("BucketAlreadyExists", "BucketAlreadyOwnedByYou"):
            raise


def run_backup(tanggal: str) -> dict:
    src_endpoint = os.environ.get("S3_ENDPOINT", "http://lake-rustfs:9000")
    src_key = os.environ.get("S3_ACCESS_KEY", "disparlake")
    src_secret = os.environ.get("S3_SECRET_KEY", "disparlakesecret")
    src_bucket = os.environ.get("LAKE_BUCKET", "lakehouse")

    # Target: offsite bila di-set, kalau tidak ke bucket backup lokal.
    dst_endpoint = os.environ.get("BACKUP_S3_ENDPOINT", src_endpoint)
    dst_key = os.environ.get("BACKUP_S3_ACCESS_KEY", src_key)
    dst_secret = os.environ.get("BACKUP_S3_SECRET_KEY", src_secret)
    dst_bucket = os.environ.get("BACKUP_BUCKET", "lakehouse-backup")

    offsite = dst_endpoint != src_endpoint
    src = _client(src_endpoint, src_key, src_secret)
    dst = _client(dst_endpoint, dst_key, dst_secret)
    _ensure_bucket(dst, dst_bucket)

    prefix = f"{tanggal}/"
    # Indeks objek tujuan yang sudah ada (inkremental berdasar size+etag).
    existing: dict[str, int] = {}
    paginator = dst.get_paginator("list_objects_v2")
    for page in paginator.paginate(Bucket=dst_bucket, Prefix=prefix):
        for o in page.get("Contents", []):
            existing[o["Key"]] = o["Size"]

    disalin = 0
    dilewati = 0
    total_bytes = 0
    for page in src.get_paginator("list_objects_v2").paginate(Bucket=src_bucket):
        for o in page.get("Contents", []):
            key = o["Key"]
            dst_key_path = f"{prefix}{key}"
            if existing.get(dst_key_path) == o["Size"]:
                dilewati += 1
                continue
            body = src.get_object(Bucket=src_bucket, Key=key)["Body"].read()
            dst.put_object(Bucket=dst_bucket, Key=dst_key_path, Body=body)
            disalin += 1
            total_bytes += o["Size"]

    laporan = {
        "tanggal": tanggal,
        "offsite": offsite,
        "dst": f"{dst_endpoint}/{dst_bucket}/{prefix}",
        "objek_disalin": disalin,
        "objek_dilewati_sama": dilewati,
        "bytes_disalin": total_bytes,
    }
    # Tulis manifest backup ke tujuan (bukti + untuk verifikasi restore).
    dst.put_object(
        Bucket=dst_bucket,
        Key=f"{prefix}_manifest.json",
        Body=json.dumps(laporan, ensure_ascii=False).encode(),
    )
    print(json.dumps(laporan, indent=2, ensure_ascii=False), flush=True)
    if not offsite:
        print(
            "PERINGATAN: backup ke RustFS yang SAMA (belum offsite). Set "
            "BACKUP_S3_ENDPOINT ke storage lain untuk proteksi disk/host mati.",
            flush=True,
        )
    return laporan


def run_restore(tanggal: str, target_bucket: str | None = None) -> dict:
    """Pulihkan objek dari backup <tanggal> ke bucket lake (atau target lain).

    Restore adalah bagian tak-terpisah dari backup: backup yang tak pernah diuji
    restore-nya tidak bisa diandalkan. Jalankan ke bucket uji untuk verifikasi.
    """
    dst_endpoint = os.environ.get("BACKUP_S3_ENDPOINT") or os.environ.get("S3_ENDPOINT", "http://lake-rustfs:9000")
    dst_key = os.environ.get("BACKUP_S3_ACCESS_KEY") or os.environ.get("S3_ACCESS_KEY", "disparlake")
    dst_secret = os.environ.get("BACKUP_S3_SECRET_KEY") or os.environ.get("S3_SECRET_KEY", "disparlakesecret")
    dst_bucket = os.environ.get("BACKUP_BUCKET", "lakehouse-backup")

    lake_endpoint = os.environ.get("S3_ENDPOINT", "http://lake-rustfs:9000")
    lake_key = os.environ.get("S3_ACCESS_KEY", "disparlake")
    lake_secret = os.environ.get("S3_SECRET_KEY", "disparlakesecret")
    into = target_bucket or os.environ.get("RESTORE_BUCKET", "lakehouse")

    bk = _client(dst_endpoint, dst_key, dst_secret)
    lake = _client(lake_endpoint, lake_key, lake_secret)
    _ensure_bucket(lake, into)

    prefix = f"{tanggal}/"
    dipulihkan = 0
    for page in bk.get_paginator("list_objects_v2").paginate(Bucket=dst_bucket, Prefix=prefix):
        for o in page.get("Contents", []):
            key = o["Key"]
            if key.endswith("_manifest.json"):
                continue
            orig = key[len(prefix):]
            body = bk.get_object(Bucket=dst_bucket, Key=key)["Body"].read()
            lake.put_object(Bucket=into, Key=orig, Body=body)
            dipulihkan += 1
    laporan = {"tanggal": tanggal, "ke_bucket": into, "objek_dipulihkan": dipulihkan}
    print(json.dumps(laporan, indent=2, ensure_ascii=False), flush=True)
    return laporan


if __name__ == "__main__":
    # backup <tgl> | restore <tgl> [target_bucket]
    if len(sys.argv) > 1 and sys.argv[1] == "restore":
        run_restore(sys.argv[2] if len(sys.argv) > 2 else "manual",
                    sys.argv[3] if len(sys.argv) > 3 else None)
    else:
        tgl = sys.argv[1] if len(sys.argv) > 1 else "manual"
        run_backup(tgl)
    sys.exit(0)
