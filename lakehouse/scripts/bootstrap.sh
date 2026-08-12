#!/usr/bin/env bash
# Bootstrap sekali-jalan untuk stack lakehouse:
#   1. tunggu Lakekeeper siap (image-nya distroless, jadi tidak bisa healthcheck compose)
#   2. bootstrap katalog (set administrator awal)
#   3. buat bucket di RustFS
#   4. daftarkan warehouse Iceberg yang menunjuk ke bucket itu
#
# Idempoten: aman dijalankan ulang.
set -euo pipefail

cd "$(dirname "$0")/.."
[ -f .env ] && set -a && . ./.env && set +a

CATALOG_URL="${CATALOG_URL:-http://localhost:18181}"
S3_ENDPOINT_HOST="${S3_ENDPOINT_HOST:-http://localhost:19000}"
S3_ENDPOINT_INTERNAL="${S3_ENDPOINT_INTERNAL:-http://lake-rustfs:9000}"
BUCKET="${BUCKET:-lakehouse}"
WAREHOUSE="${WAREHOUSE:-dispar}"
TENANT="${TENANT:-dispar-dki}"

say() { printf '\033[1;34m==>\033[0m %s\n' "$1"; }

say "Menunggu Lakekeeper di ${CATALOG_URL}"
for i in $(seq 1 60); do
  if curl -fsS "${CATALOG_URL}/health" >/dev/null 2>&1; then break; fi
  [ "$i" = 60 ] && { echo "Lakekeeper tidak siap setelah 60 percobaan"; exit 1; }
  sleep 2
done
say "Lakekeeper siap"

say "Bootstrap katalog"
code=$(curl -s -o /tmp/lk-bootstrap.json -w '%{http_code}' -X POST \
  "${CATALOG_URL}/management/v1/bootstrap" \
  -H 'Content-Type: application/json' \
  -d '{"accept-terms-of-use": true}')
case "$code" in
  20*) say "Bootstrap berhasil" ;;
  40*) say "Katalog sudah pernah di-bootstrap (HTTP $code) — dilewati" ;;
  *)   echo "Bootstrap gagal (HTTP $code):"; cat /tmp/lk-bootstrap.json; exit 1 ;;
esac

say "Membuat bucket '${BUCKET}' di RustFS"
uv run --quiet --with boto3 python - <<PY
import boto3, botocore, os
s3 = boto3.client(
    "s3",
    endpoint_url="${S3_ENDPOINT_HOST}",
    aws_access_key_id="${S3_ACCESS_KEY}",
    aws_secret_access_key="${S3_SECRET_KEY}",
    region_name="local-01",
    config=botocore.client.Config(s3={"addressing_style": "path"}),
)
try:
    s3.create_bucket(Bucket="${BUCKET}")
    print("bucket dibuat")
except s3.exceptions.BucketAlreadyOwnedByYou:
    print("bucket sudah ada")
except botocore.exceptions.ClientError as e:
    if e.response["Error"]["Code"] in ("BucketAlreadyExists", "BucketAlreadyOwnedByYou"):
        print("bucket sudah ada")
    else:
        raise
PY

say "Mendaftarkan warehouse '${WAREHOUSE}'"
payload=$(cat <<JSON
{
  "warehouse-name": "${WAREHOUSE}",
  "storage-profile": {
    "type": "s3",
    "bucket": "${BUCKET}",
    "key-prefix": "${TENANT}",
    "endpoint": "${S3_ENDPOINT_INTERNAL}",
    "region": "local-01",
    "path-style-access": true,
    "flavor": "s3-compat",
    "sts-enabled": false
  },
  "storage-credential": {
    "type": "s3",
    "credential-type": "access-key",
    "access-key-id": "${S3_ACCESS_KEY}",
    "secret-access-key": "${S3_SECRET_KEY}"
  }
}
JSON
)
code=$(curl -s -o /tmp/lk-warehouse.json -w '%{http_code}' -X POST \
  "${CATALOG_URL}/management/v1/warehouse" \
  -H 'Content-Type: application/json' -d "$payload")
case "$code" in
  20*) say "Warehouse dibuat: $(cat /tmp/lk-warehouse.json)" ;;
  409) say "Warehouse sudah ada — dilewati" ;;
  *)   echo "Pembuatan warehouse gagal (HTTP $code):"; cat /tmp/lk-warehouse.json; exit 1 ;;
esac

say "Selesai. Katalog REST: ${CATALOG_URL}/catalog  warehouse: ${WAREHOUSE}"
