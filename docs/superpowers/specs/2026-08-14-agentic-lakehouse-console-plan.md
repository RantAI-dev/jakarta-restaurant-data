# Rencana: RantAI Lakehouse Console → Agentic Lakehouse (di atas engine kita)

**Tanggal:** 14 Agustus 2026
**Status:** proposal untuk didiskusikan
**Repo UI:** https://github.com/RantAI-dev/RantAI-Lakehouse (Next.js 16, shadcn, navy OKLCH, dark)
**Engine (nyata, jalan):** lakehouse kita di 187 — RustFS+Iceberg+Lakekeeper+ClickHouse+dlt+SQLMesh+Dagster (lihat [[lakehouse-architecture]])

---

## 1. Situasi

**Yang ada di repo UI (RantAI-Lakehouse):** konsol lakehouse enterprise yang **rapi & terstruktur bagus**, tapi **100% mock**. Dokumen mereka sendiri jujur soal ini:

> "All product data paths are **mock adapters** behind typed service contracts. There is no real data engine, query engine, pipeline runner, vector database, streaming engine, governance enforcer, identity provider, agent runtime, or observability backend in this repository."

Cakupan halaman sangat luas (7 grup IA): Overview, Data (catalog/storage/connectors), Build (pipelines/streaming/query-studio), Intelligence (agents/knowledge/semantic-search/vector), Governance (policies/lineage/audit/residency), Operations (observability/usage), Administration (users/roles/tenants). Ada editor SQL CodeMirror, query studio NL+SQL, agent workflows, digital employees, approvals — semua fasad tanpa isi.

**Yang ada di sisi kita:** lakehouse **beneran jalan** — SDI→Bronze→Silver→Gold di Iceberg/ClickHouse, katalog metadata, lineage, Dagster terjadwal, app dispar sebagai konsumen. Plus **LLM node** (llm-node, Ryzen AI + Radeon 890M) untuk lapisan agentic.

**Ketidakcocokan yang mau dibalik:** UI mereka mengarang fitur dari imajinasi produk. Kita punya kapabilitas nyata. **Fitur kita yang harus nge-drive** — bukan mock mereka.

## 2. Wawasan kunci (kenapa ini justru mudah)

UI mereka **tidak perlu dirombak**. Arsitekturnya sudah menyiapkan titik-swap yang persis kita butuhkan:

```
Page (features/*) → useService() → services/index.ts (registry)
                                 → services/mock/*   ← GANTI INI
                                 → services/clients/* ← DENGAN INI (backend nyata)
```

Dokumen mereka: *"When wiring a real backend: add `services/clients/*` implementing the same contract and point `services/index.ts` at it. **Pages should not need redesign.**"*

Jadi rencananya **bukan** "bikin UI baru". Rencananya: **implementasi `services/clients/*` yang nembak lakehouse nyata kita, kontrak demi kontrak** — dan di mana bentuk mock mereka bohong/tak sesuai realita, **kita yang bentuk ulang kontraknya** (fitur kita drive).

## 3. Pemetaan: service contract mereka → backend nyata kita

Registry mereka: `overview, asset, pipeline, streaming, query, knowledge, agent, governance, ops, identity, connector, storage`.

| Service (kontrak UI) | Backend nyata kita | Realita sekarang |
|---|---|---|
| **query** (Query Studio NL+SQL, plan, metrics) | **ClickHouse** — eksekusi SQL nyata; `durationMs`/`scannedBytes`/`engine` dari `system.query_log`. NL→SQL via **llm-node** | 🟢 bisa nyata SEKARANG (nilai tertinggi) |
| **asset** (catalog, data assets) | `bronze_meta.dataset_catalog` + `silver.*` + `serving.mart_*` | 🟢 nyata sekarang |
| **storage** (tier Hot/Warm/Cold/AI) | ClickHouse MergeTree (Hot) + Iceberg/Parquet @ RustFS (Warm/Cold) | 🟢 nyata sekarang |
| **pipeline** (runs, cancel, retry) | **Dagster** (GraphQL API) + dlt | 🟢 nyata sekarang |
| **ops** (observability, usage) | Dagster runs + `system.query_log`/`system.parts` ClickHouse | 🟢 nyata sekarang |
| **governance/lineage** | `_silver_meta.kolom_tipe` + snapshot Iceberg + graf SQLMesh/Dagster | 🟡 nyata sebagian |
| **connector** | source dlt (SDI, file, JSON) | 🟡 nyata sebagian |
| **identity** (users/roles/tenants) | kolom `_tenant` (fondasi multi-tenant sudah ada) | 🟡 perlu IdP nyata |
| **streaming** | RisingWave (sengaja ditunda) | 🔴 mock/nanti |
| **knowledge / vector / semantic-search / embeddings** | **BANGUN** — pgvector + embedding via llm-node | 🔴 lapisan data agentic (baru) |
| **agent** (workflows/employees/tools/approvals) | **BANGUN** — runtime agent di atas llm-node + tool lakehouse | 🔴 the north star |

**Temuan penting:** 5 service teratas (query, asset, storage, pipeline, ops) **bisa jadi nyata sekarang** dengan yang sudah kita punya. Itu langsung mengubah konsol mock jadi **UI operator lakehouse yang beneran** — tanpa nyentuh desain halaman.

## 4. Arsitektur integrasi

Konsol butuh cara bicara ke engine. Ikuti pola yang sudah terbukti di `platform-v2` (app dispar baca ClickHouse langsung dari server Next):

```
RantAI-Lakehouse (Next.js console)
  services/clients/*  ── server-side ──►  ClickHouse HTTP (:18123)   [query, asset, storage, ops]
                                      ►  Dagster GraphQL (:13030)   [pipeline, ops runs]
                                      ►  Lakekeeper REST (:18181)   [catalog, lineage, snapshot]
                                      ►  RustFS S3 (:19000)         [storage objek]
                                      ►  Postgres meta              [identity, saved query, audit]
                                      ►  llm-node /v1 + pgvector    [query NL→SQL, knowledge, agent]
```

Tidak perlu API gateway terpisah dulu — `services/clients/*` = fungsi server Next yang manggil endpoint di atas (persis cara `lib/ch/store.ts` dispar). Nanti kalau perlu, diangkat jadi service API sendiri.

**Akun ClickHouse read-only** untuk query pengguna (sudah ada profil `app_readonly`); tulis hanya lewat pipeline.

## 5. Positioning (rekomendasi)

Ini **dua produk berbeda di atas satu engine**, jangan digabung:

- **RantAI Lakehouse Console** (repo ini, navy/dark) = **UI operator platform** — orang data/engineer mengelola pipeline, katalog, query, agent. Generik, multi-tenant.
- **Dispar app** (`platform-v2`, putih/oranye) = **data product / konsumen** — dashboard publik pariwisata untuk satu tenant.

Keduanya duduk di lakehouse yang sama. Konsol *mengoperasikan*; dispar *mengonsumsi*. Jangan paksa satu tema/kode. Dispar jadi contoh "tenant workspace" pertama di konsol.

## 6. Fase (urutan di-drive oleh apa yang sudah nyata)

**Fase 0 — Fondasi (jadikan konsol nyala di atas engine kita).**
Fork/clone repo, jalankan, buat `services/clients/clickhouse.ts` + koneksi env ke 187. Reconcile satu contract sederhana (overview/health) end-to-end sebagai bukti swap. Rapikan claim "mock" → tandai mana yang sudah nyata.

**Fase 1 — "Nyatakan yang sudah nyata" (nilai tertinggi, cepat).**
Ganti mock → client nyata untuk **query, asset, storage, pipeline, ops**:
- **Query Studio**: editor SQL → eksekusi ClickHouse sungguhan, metrics dari `system.query_log`, hasil tabel. Ini fitur paling "wow" dan paling nyata.
- **Catalog/Assets**: dari `bronze_meta` + `silver`/`gold` (185+ dataset asli).
- **Storage**: tier fisik nyata (MergeTree vs Iceberg@RustFS) + ukuran dari `system.parts`.
- **Pipelines**: daftar/run/trigger via Dagster GraphQL (job `refresh_lakehouse` sudah ada).
- **Observability/Usage**: metrik dari Dagster + ClickHouse system tables.
*Hasil:* konsol mock jadi operator UI lakehouse sungguhan.

**Fase 2 — Governance & lineage nyata.**
Lineage dari `_silver_meta` + snapshot Iceberg + graf Dagster; data-quality dari audit inferensi tipe kita (rasio konversi, karantina); classification (tier primer/sekunder, tag). Residency/policy menyusul.

**Fase 3 — Lapisan agentic (the differentiator, target utama).**
1. **Semantic search + embeddings**: index katalog + kolom + deskripsi ke **pgvector**, embedding via **llm-node**. Halaman semantic-search & knowledge jadi nyata.
2. **Tool registry**: bungkus kapabilitas lakehouse jadi tool agent — `run_sql`, `search_catalog`, `describe_dataset`, `trigger_pipeline`, `read_lineage`.
3. **Runtime agent**: agen yang benar-benar jalan di atas llm-node — **text-to-SQL** ("berapa wisman Tiongkok 2026?" → SQL → ClickHouse → jawaban), **catalog Q&A**, **pipeline authoring assistant**. Dengan budget/autonomy/approvals sesuai kontrak `DigitalEmployee` mereka.
*Inilah "agentic lakehouse":* agen yang mengoperasikan lakehouse, bukan sekadar chatbot.

**Fase 4 — Produktisasi multi-tenant.**
IdP nyata (users/roles), isolasi tenant (fondasi `_tenant` sudah ada), streaming (RisingWave) bila perlu, billing/usage.

## 7. Keputusan yang perlu dikonfirmasi

1. **Titik mulai konkret:** gw langsung kerjakan **Fase 0 + Query Studio nyata** (paling cepat kelihatan hasil), atau lu mau plan ini disetujui/direvisi dulu?
2. **Repo:** kerja langsung di fork `RantAI-Lakehouse` (gw perlu akses push / bikin branch), atau gw siapkan `services/clients/*` sebagai patch untuk orang UI-nya terapkan?
3. **Batas peran orang UI:** mereka lanjut poles UX/pattern, kita isi backend nyata + kontrak yang di-reshape — sepakat pembagian ini?
4. **Agentic scope Fase 3:** mulai dari **text-to-SQL + catalog Q&A** (paling konkret & langsung berguna), setuju?

---

## Lampiran: aset nyata yang siap dipakai (per 14 Agustus 2026)

- ClickHouse 26.7 @ 187:18123 — `serving.mart_*`, `silver.*` (213 view), `lake.bronze_*` (Iceberg), `system.query_log`
- Dagster @ 187:13030 — job `refresh_lakehouse` (7 aset), jadwal harian aktif, GraphQL
- Lakekeeper @ 187:18181 — katalog Iceberg REST (snapshot/lineage)
- RustFS @ 187:19000 — objek Iceberg/Parquet
- Katalog metadata — `bronze_meta.dataset_catalog` (183 primer) + `bronze_meta_sec` (16 sekunder) + `dataset_column`/`dataset_sync`
- llm-node — endpoint OpenAI-compatible `/v1/chat/completions` (+ kandidat embedding)
- Pola swap terbukti — `platform-v2/lib/ch/*` (client read-only ClickHouse berparameter)
