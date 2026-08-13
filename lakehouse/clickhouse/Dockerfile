# ClickHouse dengan config di-bake ke image (bukan bind-mount).
# Alasan: endpoint Docker Portainer bisa remote — file repo tidak tersedia untuk
# di-bind-mount di daemon-nya. Build mengirim config sebagai bagian image.
FROM clickhouse/clickhouse-server:latest

# User & profil (dispar, dispar_app) + flag Iceberg eksperimental.
COPY users-dispar.xml /etc/clickhouse-server/users.d/dispar.xml
