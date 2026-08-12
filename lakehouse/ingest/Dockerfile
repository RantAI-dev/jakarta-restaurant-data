# Image ingestion: dijalankan di dalam lakenet supaya bisa menjangkau
# lake-catalog & lake-rustfs dengan nama internal (Lakekeeper mengembalikan
# URL internal dalam respons katalognya).
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY pyproject.toml ./
COPY dispar_ingest ./dispar_ingest
RUN pip install --no-cache-dir . && pip install --no-cache-dir pytest

COPY tests ./tests

CMD ["python", "-m", "dispar_ingest.run_bronze", "--help"]
