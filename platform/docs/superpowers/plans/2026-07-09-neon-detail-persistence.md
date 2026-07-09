# Neon Detail Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simpan kolom + baris tiap dataset SDI ke Neon Postgres, dan layani halaman detail (`/sdi/[slug]`) dari DB (bukan fetch live ke SDI tiap request), dengan fallback live kalau dataset belum tersync.

**Architecture:** Tambah 3 tabel Neon (`dataset_column`, `record`, `dataset_sync`) via Drizzle ORM. Sebuah script `bun` offline men-sync dataset dari API SDI ke DB. Route `/api/sdi/[slug]` baca DB dulu; kalau kosong, fallback ke fetch live SDI yang sudah ada.

**Tech Stack:** Next.js 15 (App Router) · Drizzle ORM · **postgres.js** · Bun (script runner) · Postgres (lokal via Docker; Neon ditunda).

---

## ⚠️ UPDATE — Local-first (postgres.js), Neon ditunda

Versi awal plan ini pakai Neon + `neon-http`. **Kita jalan LOKAL dulu.** Perubahan yang MENGGANTI bagian di bawah:

- **Driver:** ganti `@neondatabase/serverless` + `drizzle-orm/neon-http` → **`postgres`** (postgres.js) + `drizzle-orm/postgres-js`. Alasan: `neon-http` hanya bisa ke endpoint HTTP Neon, **tidak** ke Postgres lokal. `postgres.js` jalan di lokal **dan** Neon → pindah ke Neon nanti = **ganti `DATABASE_URL` saja**, tanpa ubah kode.
- **`lib/db/index.ts`** pakai lazy + **memoized** Proxy (hindari throw & koneksi saat `next build`).
- **`datasetSync`** memuat kolom metadata tambahan `klasifikasi`, `kontak`, `author`.

### Task 0 (REVISI) — Postgres lokal via Docker (agent boleh kerjakan, bukan operator)

Run:
```bash
docker run -d --name dispar-pg -e POSTGRES_PASSWORD=dispar \
  -e POSTGRES_DB=dispar -p 5432:5432 postgres:16
```
Isi `.env`:
```
DATABASE_URL=postgres://postgres:dispar@localhost:5432/dispar
```
Verifikasi: `docker ps | grep dispar-pg` (baris muncul) dan `grep -q '^DATABASE_URL=' .env && echo OK` → `OK`.
(Tanpa Docker: pakai Postgres native Arch, buat DB `dispar`, sesuaikan URL.)

### Task 1 (REVISI) — deps

Run: `npm install drizzle-orm postgres` lalu `npm install -D drizzle-kit`.
(`@neondatabase/serverless` boleh dibiarkan terpasang; tidak dipakai.)

### Task 3 (REVISI) — `lib/db/index.ts`

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function makeDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum di-set (lihat Task 0).");
  const client = postgres(url, { prepare: false });
  return drizzle(client, { schema });
}

// Lazy + memoized: error/koneksi baru muncul saat handler query,
// bukan saat module-load (memecah `next build` collect page data).
let _db: ReturnType<typeof makeDb> | null = null;
const getDb = () => (_db ??= makeDb());

export const db = new Proxy({} as ReturnType<typeof makeDb>, {
  get(_t, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[
      prop as string
    ];
  },
});
export { schema };
```

### Schema (REVISI) — `datasetSync` + metadata

Pada `datasetSync` (Task 2) tambahkan kolom: `description: text("description")`, `satuan: text("satuan")`, `frekuensi: text("frekuensi")`, `klasifikasi: text("klasifikasi")`, `kontak: text("kontak")`, `author: text("author")`, `sumberData: jsonb("sumber_data").$type<string[]>().default([])`. `fetchSdiDetail`, script sync, dan route mengembalikan field ini; halaman detail boleh menampilkan `klasifikasi/kontak/author` sebagai 3 baris `<Meta>` tambahan (opsional).

> Selain 4 poin di atas, **seluruh Task 2 dan Task 4–7 tetap berlaku apa adanya** (hanya kata "Neon" dibaca "Postgres lokal").

---

## Catatan verifikasi (baca dulu)

Repo ini **belum punya test runner** (tidak ada vitest/jest). Skill writing-plans normalnya TDD; di sini kita adaptasi ke verifikasi yang tetap deterministik dan mudah dicek agent lemah:
- **Type check:** `npx tsc --noEmit -p tsconfig.json` → harus **tanpa output** (berarti lolos).
- **Script runnable:** `bun run scripts/<x>.ts` → cek output persis.
- **Smoke test HTTP:** `npm run dev` (port 3030) lalu `curl` endpoint, cek field di JSON.
- **Build:** `npm run build` → harus ada `✓ Compiled successfully`.

Bun **otomatis membaca `.env`**, jadi `bun run` dan `bunx` dapat `DATABASE_URL` tanpa export manual.

Jangan lanjut ke task berikutnya kalau verifikasi task sekarang belum sesuai "Expected".

---

## File Structure

Yang dibuat / diubah plan ini:

- **Create** `lib/db/schema.ts` — definisi 3 tabel Drizzle.
- **Create** `lib/db/index.ts` — koneksi Neon + instance Drizzle.
- **Create** `drizzle.config.ts` — config drizzle-kit (untuk `push`).
- **Create** `scripts/db-sync-dataset.ts` — sync 1 atau semua dataset SDI → DB.
- **Create** `lib/sdi-fetch.ts` — helper fetch detail+rows dari SDI (dipakai script & route fallback; memindah logika yang sekarang inline di route).
- **Modify** `app/api/sdi/[slug]/route.ts` — baca DB dulu, fallback live.
- **Modify** `.env` — tambah `DATABASE_URL` (lokal).
- **Modify** `package.json` — tambah dependency.

---

## Task 0 (PREREQUISITE — dikerjakan operator/manusia, bukan agent)

Agent **tidak bisa** provision Neon (butuh login akun). Operator lakukan ini dulu:

1. Vercel Dashboard → project `jakarta-restaurant-data` → **Storage / Marketplace** → tambah **Neon Postgres** (plan **Free**).
2. Vercel akan meng-inject env `DATABASE_URL` (dan turunannya) ke project.
3. Ambil connection string (pooled) dan taruh di **local `.env`**:
   ```
   DATABASE_URL=postgres://<user>:<pass>@<host>/<db>?sslmode=require
   ```

- [ ] **Verifikasi prasyarat (agent boleh jalankan ini sebelum mulai):**

Run: `node -e "console.log(process.env.DATABASE_URL ? 'DATABASE_URL OK' : 'MISSING')" ` setelah `set -a; . ./.env; set +a`
Atau cukup: `grep -q '^DATABASE_URL=' .env && echo "DATABASE_URL OK" || echo "MISSING"`
Expected: `DATABASE_URL OK`

> Kalau `MISSING`, STOP — minta operator selesaikan Task 0. Jangan lanjut.

---

## Task 1: Pasang dependency Drizzle + Neon

**Files:**
- Modify: `package.json` (via installer)

- [ ] **Step 1: Install runtime + tooling deps**

Run:
```bash
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit
```
Expected: selesai tanpa error; `package.json` `dependencies` memuat `drizzle-orm` & `@neondatabase/serverless`, `devDependencies` memuat `drizzle-kit`.

- [ ] **Step 2: Verifikasi terpasang**

Run: `node -e "require('drizzle-orm'); require('@neondatabase/serverless'); console.log('deps ok')"`
Expected: `deps ok`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json bun.lock 2>/dev/null; git add package.json
git commit -m "chore(db): add drizzle-orm + neon serverless deps"
```

---

## Task 2: Definisi schema Neon (3 tabel)

**Files:**
- Create: `lib/db/schema.ts`

- [ ] **Step 1: Tulis schema**

Buat `lib/db/schema.ts` dengan isi persis:

```ts
import {
  pgTable,
  serial,
  integer,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Definisi kolom bermakna sebuah dataset (dari komponen_data_table SDI). */
export const datasetColumn = pgTable(
  "dataset_column",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    key: text("key").notNull(),
    label: text("label"),
    type: text("type"),
    description: text("description"),
    ordinal: integer("ordinal").notNull().default(0),
  },
  (t) => ({
    slugKey: uniqueIndex("dataset_column_slug_key").on(t.slug, t.key),
  })
);

/** Satu baris data tabel sebuah dataset (isi mentah get-table-data). */
export const record = pgTable(
  "record",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    ordinal: integer("ordinal").notNull(),
    data: jsonb("data").notNull(),
    syncedAt: timestamp("synced_at").notNull().defaultNow(),
  },
  (t) => ({
    slugIdx: index("record_slug_idx").on(t.slug),
  })
);

/** Ringkasan status sync + metadata per dataset. */
export const datasetSync = pgTable("dataset_sync", {
  slug: text("slug").primaryKey(),
  title: text("title"),
  description: text("description"),
  satuan: text("satuan"),
  frekuensi: text("frekuensi"),
  sumberData: jsonb("sumber_data").$type<string[]>().default([]),
  total: integer("total").notNull().default(0),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
});
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output (lolos).

- [ ] **Step 3: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat(db): neon schema for dataset columns, records, sync"
```

---

## Task 3: Koneksi DB + config drizzle-kit

**Files:**
- Create: `lib/db/index.ts`
- Create: `drizzle.config.ts`

- [ ] **Step 1: Tulis client DB**

Buat `lib/db/index.ts`:

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL belum di-set (lihat Task 0).");
}

const sql = neon(connectionString);
export const db = drizzle(sql, { schema });
export { schema };
```

- [ ] **Step 2: Tulis config drizzle-kit**

Buat `drizzle.config.ts`:

```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
} satisfies Config;
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

- [ ] **Step 4: Push schema ke Neon**

Run: `bunx drizzle-kit push`
Expected: prompt konfirmasi (jawab yes bila diminta) lalu selesai; log menyebut membuat tabel `dataset_column`, `record`, `dataset_sync`. Bun otomatis memuat `DATABASE_URL` dari `.env`.

- [ ] **Step 5: Verifikasi tabel ada**

Buat sementara & jalankan cek:
```bash
bun -e "import {db,schema} from './lib/db'; const r=await db.select().from(schema.datasetSync); console.log('dataset_sync rows:', r.length)"
```
Expected: `dataset_sync rows: 0` (tabel ada, masih kosong).

- [ ] **Step 6: Commit**

```bash
git add lib/db/index.ts drizzle.config.ts
git commit -m "feat(db): neon client + drizzle-kit config"
```

> Catatan: folder `drizzle/` (kalau tergenerate) boleh di-commit atau di-ignore; `push` tidak wajib butuh file migrasi.

---

## Task 4: Helper fetch SDI (dipakai script & route)

**Files:**
- Create: `lib/sdi-fetch.ts`

Ini memindahkan logika fetch detail+rows (sekarang inline di route) ke satu tempat, supaya dipakai bersama oleh script sync dan route fallback (DRY).

- [ ] **Step 1: Tulis helper**

Buat `lib/sdi-fetch.ts`:

```ts
const BACKEND = "https://satudata.jakarta.go.id/backend/api/v2/satudata";

async function post(ep: string, body: unknown, signal?: AbortSignal) {
  const res = await fetch(`${BACKEND}/${ep}`, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${ep} ${res.status}`);
  return res.json();
}

export type SdiColumn = {
  key: string;
  label: string | null;
  type: string | null;
  description: string | null;
};

export type SdiDetail = {
  slug: string;
  title: string;
  description: string;
  sumberData: string[];
  frekuensi: string | null;
  satuan: string | null;
  columns: SdiColumn[];
  rows: Record<string, unknown>[];
  total: number;
};

/** Ambil metadata + kolom + seluruh baris satu dataset dari SDI. */
export async function fetchSdiDetail(
  slug: string,
  signal?: AbortSignal
): Promise<SdiDetail> {
  const detail = await post(
    "detail",
    {
      kategori: "dataset",
      page_url: slug,
      data_no: 1,
      per_page: 10,
      table_params: {
        page: 1,
        per_page: 10,
        sort_field: null,
        sort_order: null,
        filters: {},
      },
    },
    signal
  );

  const table = await post(
    "get-table-data",
    {
      page_url: slug,
      kategori: "dataset",
      page: 1,
      per_page: 1000,
      sort_field: null,
      sort_order: "asc",
      filters: {},
    },
    signal
  );

  const meta = detail?.data ?? {};
  const komponen: {
    header_komponen: string;
    tipe_data_komponen?: string;
    desc_komponen?: string;
  }[] = Array.isArray(meta.komponen_data_table)
    ? meta.komponen_data_table
    : [];

  return {
    slug,
    title: meta.title ?? slug,
    description: meta.desc ?? "",
    sumberData: meta.sumber_data ?? [],
    frekuensi: meta.frekuensi_penerbitan ?? null,
    satuan: meta.satuan ?? null,
    columns: komponen.map((k) => ({
      key: k.header_komponen,
      label: null,
      type: k.tipe_data_komponen ?? null,
      description: k.desc_komponen ?? null,
    })),
    rows: Array.isArray(table?.data) ? table.data : [],
    total: table?.total ?? 0,
  };
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

- [ ] **Step 3: Commit**

```bash
git add lib/sdi-fetch.ts
git commit -m "feat(sdi): extract shared fetchSdiDetail helper"
```

---

## Task 5: Script sync dataset → Neon

**Files:**
- Create: `scripts/db-sync-dataset.ts`

- [ ] **Step 1: Tulis script**

Buat `scripts/db-sync-dataset.ts`:

```ts
import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";
import { fetchSdiDetail } from "../lib/sdi-fetch";
import { SDI_DATASETS } from "../lib/sdi";

const { datasetColumn, record, datasetSync } = schema;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Sync satu dataset: ganti kolom + baris + ringkasan. */
async function syncOne(slug: string): Promise<number> {
  const d = await fetchSdiDetail(slug);

  // Ganti data lama (idempoten).
  await db.delete(datasetColumn).where(eq(datasetColumn.slug, slug));
  await db.delete(record).where(eq(record.slug, slug));

  if (d.columns.length) {
    await db.insert(datasetColumn).values(
      d.columns.map((c, i) => ({
        slug,
        key: c.key,
        label: c.label,
        type: c.type,
        description: c.description,
        ordinal: i,
      }))
    );
  }

  if (d.rows.length) {
    // Insert per 500 baris agar tidak melebihi batas ukuran query.
    let ord = 0;
    for (const batch of chunk(d.rows, 500)) {
      await db.insert(record).values(
        batch.map((r) => ({ slug, ordinal: ord++, data: r }))
      );
    }
  }

  const meta = {
    title: d.title,
    description: d.description,
    satuan: d.satuan,
    frekuensi: d.frekuensi,
    sumberData: d.sumberData,
    total: d.rows.length,
  };
  await db
    .insert(datasetSync)
    .values({ slug, ...meta })
    .onConflictDoUpdate({
      target: datasetSync.slug,
      set: { ...meta, syncedAt: new Date() },
    });

  return d.rows.length;
}

async function main() {
  const arg = process.argv[2];
  const slugs =
    arg && arg !== "all" ? [arg] : SDI_DATASETS.map((x) => x.slug);
  console.log(`Sync ${slugs.length} dataset…`);
  let ok = 0;
  for (const slug of slugs) {
    try {
      const n = await syncOne(slug);
      ok++;
      console.log(`  ✓ ${slug}: ${n} baris`);
    } catch (e) {
      console.log(`  ✗ ${slug}: ${String(e)}`);
    }
  }
  console.log(`Selesai: ${ok}/${slugs.length} dataset tersync.`);
}

main();
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

- [ ] **Step 3: Sync satu dataset (uji cepat)**

Run: `bun run scripts/db-sync-dataset.ts data-seni-pertunjukan-dan-visual`
Expected: baris seperti `✓ data-seni-pertunjukan-dan-visual: 352 baris` lalu `Selesai: 1/1 dataset tersync.` (jumlah baris bisa berubah bila SDI update.)

- [ ] **Step 4: Verifikasi masuk DB**

Run:
```bash
bun -e "import {db,schema} from './lib/db'; import {eq} from 'drizzle-orm'; const c=await db.select().from(schema.datasetColumn).where(eq(schema.datasetColumn.slug,'data-seni-pertunjukan-dan-visual')); const r=await db.select().from(schema.record).where(eq(schema.record.slug,'data-seni-pertunjukan-dan-visual')); console.log('kolom:',c.map(x=>x.key).join(','),'| baris:',r.length)"
```
Expected: `kolom: periode_data,nama_event,lokasi_venue,nama_venue | baris: 352`

- [ ] **Step 5: Commit**

```bash
git add scripts/db-sync-dataset.ts
git commit -m "feat(db): script to sync SDI dataset detail into neon"
```

---

## Task 6: Route detail baca DB dulu, fallback live

**Files:**
- Modify: `app/api/sdi/[slug]/route.ts`

- [ ] **Step 1: Ganti isi route**

Ganti **seluruh** isi `app/api/sdi/[slug]/route.ts` dengan:

```ts
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { asc, eq } from "drizzle-orm";
import { fetchSdiDetail } from "@/lib/sdi-fetch";

const { datasetColumn, record, datasetSync } = schema;

/**
 * Detail + isi tabel satu dataset SDI.
 * Baca dari Neon dulu; kalau dataset belum tersync, fallback fetch live SDI.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1) Coba dari DB.
  try {
    const cols = await db
      .select()
      .from(datasetColumn)
      .where(eq(datasetColumn.slug, slug))
      .orderBy(asc(datasetColumn.ordinal));

    if (cols.length) {
      const rows = await db
        .select()
        .from(record)
        .where(eq(record.slug, slug))
        .orderBy(asc(record.ordinal));
      const sync = await db
        .select()
        .from(datasetSync)
        .where(eq(datasetSync.slug, slug));

      return NextResponse.json({
        source: "db",
        slug,
        title: sync[0]?.title ?? slug,
        description: sync[0]?.description ?? "",
        sumberData: sync[0]?.sumberData ?? [],
        frekuensi: sync[0]?.frekuensi ?? null,
        satuan: sync[0]?.satuan ?? null,
        columns: cols.map((c) => ({
          key: c.key,
          desc: c.description,
          type: c.type,
        })),
        rows: rows.map((r) => r.data),
        total: sync[0]?.total ?? rows.length,
      });
    }
  } catch {
    // DB error → jatuh ke fallback live di bawah.
  }

  // 2) Fallback: fetch live dari SDI.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const d = await fetchSdiDetail(slug, controller.signal);
    clearTimeout(timer);
    return NextResponse.json({
      source: "live",
      slug,
      title: d.title,
      description: d.description,
      sumberData: d.sumberData,
      frekuensi: d.frekuensi,
      satuan: d.satuan,
      columns: d.columns.map((c) => ({
        key: c.key,
        desc: c.description,
        type: c.type,
      })),
      rows: d.rows,
      total: d.total,
    });
  } catch (e) {
    clearTimeout(timer);
    return NextResponse.json(
      { error: "Gagal mengambil data dari SDI", detail: String(e) },
      { status: 502 }
    );
  }
}
```

> Bentuk JSON (field `columns`, `rows`, `title`, dst.) **sama persis** dengan route lama, jadi halaman `app/sdi/[slug]/page.tsx` tidak perlu diubah.

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

- [ ] **Step 3: Jalankan dev server**

Run (background): `npm run dev`
Tunggu sampai: `curl -sf -o /dev/null -w "%{http_code}" http://localhost:3030/` → `200`

- [ ] **Step 4: Smoke test — dataset TERSYNC → dari DB**

Run:
```bash
curl -s http://localhost:3030/api/sdi/data-seni-pertunjukan-dan-visual | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('source:',j.source,'| cols:',j.columns.map(c=>c.key).join(','),'| rows:',j.rows.length)})"
```
Expected: `source: db | cols: periode_data,nama_event,lokasi_venue,nama_venue | rows: 352`

- [ ] **Step 5: Smoke test — dataset BELUM tersync → fallback live**

Run:
```bash
curl -s http://localhost:3030/api/sdi/jumlah-realisasi-investasi-pariwisata | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('source:',j.source,'| rows:',j.rows.length)})"
```
Expected: `source: live | rows: 1` (belum disync, jadi ambil live — tetap tampil).

- [ ] **Step 6: Build produksi**

Run: `npm run build`
Expected: `✓ Compiled successfully` dan route `/api/sdi/[slug]` muncul di tabel route.

- [ ] **Step 7: Commit**

```bash
git add app/api/sdi/[slug]/route.ts
git commit -m "feat(sdi): serve dataset detail from neon with live fallback"
```

---

## Task 7: Sync seluruh dataset (opsional, jalankan saat siap)

**Files:** — (hanya menjalankan script)

- [ ] **Step 1: Sync semua 182 dataset ke DB**

Run: `bun run scripts/db-sync-dataset.ts all`
Expected: 182 baris log `✓ <slug>: N baris` (beberapa boleh `✗` bila dataset kosong/berubah), diakhiri `Selesai: X/182 dataset tersync.` dengan X mendekati 182.

- [ ] **Step 2: Verifikasi jumlah dataset tersync**

Run:
```bash
bun -e "import {db,schema} from './lib/db'; const r=await db.select().from(schema.datasetSync); console.log('dataset tersync:', r.length, '| total baris:', r.reduce((s,x)=>s+x.total,0))"
```
Expected: `dataset tersync: <≈182> | total baris: <angka>` (jumlah > 0).

> Tidak ada commit di task ini — ini operasi data, bukan perubahan kode.

---

## Definition of Done (seluruh plan)

- `GET /api/sdi/<slug-tersync>` mengembalikan `source: "db"` dengan kolom + baris benar.
- `GET /api/sdi/<slug-belum-sync>` tetap jalan via `source: "live"` (tidak pernah 502 selama SDI hidup).
- `npx tsc --noEmit` bersih; `npm run build` sukses.
- Halaman `/sdi/[slug]` tampil sama seperti sebelumnya (tanpa perubahan file page).

## Catatan untuk fase berikutnya (di luar plan ini)

- **Ingestion & Operasi:** ubah script sync jadi endpoint `/api/admin/sync` + Vercel Cron; tambah auth; `revalidateTag` untuk invalidasi cache. (lihat `plan-platform.md` Workstream B)
- **Katalog dari DB:** pindahkan sumber `/api/sdi` (list) ke DB juga.
- **KPI & Dashboard:** tabel `kpi_value` + `/dashboard`. (Workstream C & D)
