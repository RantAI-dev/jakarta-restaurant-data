"""Definisi Dagster: pipeline lakehouse sebagai graf aset.

Graf aset inilah bukti visual arsitektur Bronze→Silver→Gold yang diminta MoM —
ketergantungan antar-aset menghasilkan lineage otomatis di UI Dagster.

    bronze_sdi ─┐
                ├─► lake_db ─► functions_dim ─► silver_auto ─► curated_gold
    bronze_files┘
"""

from __future__ import annotations

from dagster import (
    Definitions,
    ScheduleDefinition,
    asset,
    define_asset_job,
)

from dispar_ingest import refresh
from dispar_ingest.run_bronze import ingest_files, ingest_sdi
from dispar_ingest.silver import generate_silver


@asset(group_name="bronze", description="Tarik 183 dataset SDI ke Iceberg (all-string + audit)")
def bronze_sdi(context) -> None:
    laporan = ingest_sdi()
    context.add_output_metadata({"berhasil": laporan["berhasil"], "baris": laporan["baris_total"]})


@asset(group_name="bronze", description="Tarik berkas lokal (TSV/CSV/XLSX/JSON) ke Iceberg")
def bronze_files(context) -> None:
    laporan = ingest_files()
    context.add_output_metadata({"berhasil": laporan["berhasil"], "baris": laporan["baris_total"]})


@asset(group_name="silver", deps=[bronze_sdi, bronze_files],
       description="Sambungkan ClickHouse ke katalog Iceberg")
def lake_db(context) -> None:
    context.log.info(refresh.recreate_lake_db())


@asset(group_name="silver", deps=[lake_db],
       description="Fungsi konversi Indonesia + dimensi (negara/bulan/wilayah/periode/indikator)")
def functions_dim(context) -> None:
    context.log.info(refresh.apply_functions_dim())


@asset(group_name="silver", deps=[functions_dim],
       description="Inferensi tipe otomatis → 180+ view Silver bertipe")
def silver_auto(context) -> None:
    generate_silver()


@asset(group_name="gold", deps=[silver_auto],
       description="Silver kurasi (wisman/restoran/dtw/event) + mart Gold MergeTree")
def curated_gold(context) -> None:
    context.log.info(refresh.apply_curated_gold())


refresh_job = define_asset_job("refresh_lakehouse", selection="*")

# Refresh harian 02:00 — data SDI bulanan, jadi tak perlu lebih sering.
daily = ScheduleDefinition(job=refresh_job, cron_schedule="0 2 * * *")

defs = Definitions(
    assets=[bronze_sdi, bronze_files, lake_db, functions_dim, silver_auto, curated_gold],
    jobs=[refresh_job],
    schedules=[daily],
)
