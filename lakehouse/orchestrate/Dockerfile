# Image Dagster mandiri (context = direktori lakehouse).
# Self-contained supaya buildkit tak perlu image lokal & mudah dibangun di 187.
FROM python:3.13-slim

ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=1 DAGSTER_HOME=/opt/dagster
WORKDIR /app

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Paket ingestion (dipakai aset Dagster) + Dagster.
COPY ingest/pyproject.toml ./ingest/
COPY ingest/dispar_ingest ./ingest/dispar_ingest
RUN pip install ./ingest "dagster>=1.9" "dagster-webserver>=1.9"

COPY orchestrate/dispar_orchestrate ./dispar_orchestrate
RUN mkdir -p /opt/dagster

EXPOSE 3030
CMD ["dagster-webserver", "-h", "0.0.0.0", "-p", "3030", \
     "-m", "dispar_orchestrate.definitions"]
