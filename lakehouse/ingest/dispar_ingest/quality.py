"""Data quality gate + karantina untuk lapisan Silver.

Janji spec §9 yang belum jadi: baris yang gagal dikonversi jangan hilang
diam-diam, dan pipeline harus tahu kalau data masuk anomali.

Menulis:
  _silver_meta.karantina  — baris Silver yang punya kolom mestinya-angka/tanggal
                            tapi nilainya gagal konversi (String tersisa NULL).
  _silver_meta.quality    — hasil cek kualitas per tabel (row count, null rate,
                            freshness) + verdict pass/warn/fail.

Gate: `run_quality(fail_on_error=True)` mengembalikan exit!=0 bila ada FAIL,
sehingga aset Dagster berhenti sebelum mempublikasi Gold yang buruk.
"""

from __future__ import annotations

import json
import os
import sys

import clickhouse_connect

# Ambang: tabel yang barisnya anjlok di bawah rasio ini vs snapshot terakhir
# dianggap anomali (FAIL).
AMBANG_ANJLOK = float(os.environ.get("QUALITY_DROP_THRESHOLD", "0.5"))


def _ch():
    return clickhouse_connect.get_client(
        host=os.environ.get("CH_HOST", "lake-clickhouse"),
        port=int(os.environ.get("CH_PORT", "8123")),
        username=os.environ.get("CH_USER", "dispar"),
        password=os.environ.get("CH_PASSWORD", "disparch"),
    )


def _setup(ch) -> None:
    ch.command("CREATE DATABASE IF NOT EXISTS _silver_meta")
    ch.command(
        """CREATE TABLE IF NOT EXISTS _silver_meta.quality (
            tabel String, cek String, nilai Float64, verdict String,
            detail String, dibuat_pada DateTime DEFAULT now()
        ) ENGINE = MergeTree ORDER BY (tabel, cek, dibuat_pada)"""
    )
    # Snapshot row-count historis untuk deteksi anjlok antar-run.
    ch.command(
        """CREATE TABLE IF NOT EXISTS _silver_meta.rowcount_history (
            tabel String, baris UInt64, dibuat_pada DateTime DEFAULT now()
        ) ENGINE = MergeTree ORDER BY (tabel, dibuat_pada)"""
    )
    ch.command(
        """CREATE TABLE IF NOT EXISTS _silver_meta.karantina (
            tabel String, alasan String, contoh String, jumlah UInt64,
            dibuat_pada DateTime DEFAULT now()
        ) ENGINE = MergeTree ORDER BY (tabel, dibuat_pada)"""
    )


def _silver_tables(ch) -> list[str]:
    return [r[0] for r in ch.query("SHOW TABLES FROM silver").result_rows]


def _esc(s: str) -> str:
    return s.replace("'", "''")


def _promoted_cols(ch, tabel: str) -> list[tuple[str, str]]:
    """Kolom yang dipromosikan ke angka/tanggal (dari audit _silver_meta).
    Nama tabel dari SHOW TABLES (terkendali) → inline aman, hindari binding
    clickhouse-connect yang rewel dengan named param."""
    rows = ch.query(
        f"SELECT kolom, tipe FROM _silver_meta.kolom_tipe "
        f"WHERE tabel='{_esc(tabel)}' AND dipromosikan=1"
    ).result_rows
    return [(r[0], r[1]) for r in rows]


def run_quality(fail_on_error: bool = False) -> dict:
    ch = _ch()
    _setup(ch)
    ch.command("TRUNCATE TABLE _silver_meta.karantina")

    tabel_list = _silver_tables(ch)
    hasil = {"tabel": 0, "pass": 0, "warn": 0, "fail": 0, "karantina_baris": 0, "fails": []}

    # Baseline row-count dari snapshot sebelumnya (baris terakhir per tabel).
    prev = {
        r[0]: r[1]
        for r in ch.query(
            "SELECT tabel, argMax(baris, dibuat_pada) FROM _silver_meta.rowcount_history GROUP BY tabel"
        ).result_rows
    }

    for tabel in tabel_list:
        try:
            n = ch.query(f"SELECT count() FROM silver.`{tabel}`").result_rows[0][0]
        except Exception:  # noqa: BLE001
            continue
        hasil["tabel"] += 1

        # Cek 1: tabel kosong.
        if n == 0:
            _record(ch, tabel, "row_count", 0, "warn", "tabel kosong")
            hasil["warn"] += 1
            ch.insert("_silver_meta.rowcount_history", [[tabel, 0]], column_names=["tabel", "baris"])
            continue

        # Cek 2: anjlok drastis vs run sebelumnya.
        base = prev.get(tabel, 0)
        verdict_rc = "pass"
        if base and n < base * AMBANG_ANJLOK:
            verdict_rc = "fail"
            hasil["fails"].append(f"{tabel}: baris {n} < {AMBANG_ANJLOK:.0%} dari {base}")
        _record(ch, tabel, "row_count", n, verdict_rc, f"prev={base}")

        # Cek 3: kolom terpromosi dengan null-rate tinggi = banyak gagal konversi
        # → karantina. Bandingkan NULL di Silver vs non-kosong di Bronze.
        for kol, tipe in _promoted_cols(ch, tabel):
            try:
                nulls = ch.query(
                    f"SELECT countIf(`{kol}` IS NULL) FROM silver.`{tabel}`"
                ).result_rows[0][0]
            except Exception:  # noqa: BLE001
                continue
            rate = nulls / n if n else 0
            if rate > 0.05:  # >5% kolom terpromosi jadi NULL = gagal konversi nyata
                contoh = _contoh_gagal(ch, tabel, kol)
                ch.insert(
                    "_silver_meta.karantina",
                    [[tabel, f"{kol} ({tipe}) gagal konversi", contoh, int(nulls)]],
                    column_names=["tabel", "alasan", "contoh", "jumlah"],
                )
                hasil["karantina_baris"] += nulls
                _record(ch, tabel, f"null_rate:{kol}", round(rate, 4),
                        "warn" if rate < 0.5 else "fail",
                        f"{nulls} nilai gagal jadi {tipe}")
                if rate >= 0.5:
                    hasil["fails"].append(f"{tabel}.{kol}: {rate:.0%} gagal konversi")

        ch.insert("_silver_meta.rowcount_history", [[tabel, int(n)]], column_names=["tabel", "baris"])

    # Rekap verdict per tabel dari cek yang baru ditulis.
    verd = ch.query(
        """SELECT tabel, max(multiIf(verdict='fail',3,verdict='warn',2,1)) v
           FROM _silver_meta.quality WHERE dibuat_pada > now() - INTERVAL 5 MINUTE
           GROUP BY tabel"""
    ).result_rows
    for _, v in verd:
        hasil["fail" if v == 3 else "warn" if v == 2 else "pass"] += 1

    print(json.dumps(hasil, indent=2, ensure_ascii=False), flush=True)
    if fail_on_error and hasil["fails"]:
        print("QUALITY GATE FAIL:", "; ".join(hasil["fails"][:10]), file=sys.stderr, flush=True)
        return hasil
    return hasil


def _record(ch, tabel, cek, nilai, verdict, detail) -> None:
    ch.insert(
        "_silver_meta.quality",
        [[tabel, cek, float(nilai), verdict, detail]],
        column_names=["tabel", "cek", "nilai", "verdict", "detail"],
    )


def _contoh_gagal(ch, tabel, kol) -> str:
    try:
        rows = ch.query(
            f"SELECT count() FROM silver.`{tabel}` WHERE `{kol}` IS NULL LIMIT 1"
        ).result_rows
        return "NULL (nilai asli hilang saat konversi)" if rows and rows[0][0] else ""
    except Exception:  # noqa: BLE001
        return ""


if __name__ == "__main__":
    gate = "--gate" in sys.argv
    r = run_quality(fail_on_error=gate)
    sys.exit(1 if (gate and r["fails"]) else 0)
