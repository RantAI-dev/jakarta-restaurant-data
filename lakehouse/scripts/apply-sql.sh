#!/usr/bin/env bash
# Terapkan berkas SQL di clickhouse/sql/ secara berurutan.
# Idempoten: semua pernyataan memakai CREATE OR REPLACE / IF NOT EXISTS.
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a

CH_PASSWORD="${CH_PASSWORD:-disparch}"

for f in clickhouse/sql/*.sql; do
  [ -e "$f" ] || continue
  printf '\033[1;34m==>\033[0m %s\n' "$f"
  docker exec -i lake-clickhouse clickhouse-client \
    --user dispar --password "$CH_PASSWORD" \
    --multiquery --allow_insert_into_iceberg=1 < "$f"
done

printf '\033[1;32m==>\033[0m SQL diterapkan\n'
