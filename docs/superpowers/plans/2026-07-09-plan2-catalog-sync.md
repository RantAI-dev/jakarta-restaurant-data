# Plan 2 — Katalog dari DB + Endpoint Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
>
> **Prasyarat:** Plan 1 (versi local-first / postgres.js) SUDAH selesai — Postgres lokal jalan, `DATABASE_URL` terisi di `.env`, tabel `dataset_column`/`record`/`dataset_sync` ada, dan sebagian dataset sudah tersync.

**Goal:** Katalog dataset (list di `/sdi`) dibaca dari Postgres, bukan dari import JSON statis; dan logika sync bisa dipicu lewat endpoint HTTP ber-auth (`/api/admin/sync`), bukan hanya CLI.

**Architecture:** Tambah tabel `dataset` (katalog primer) + seed dari `lib/sdi-data.json`. Route list `/api/sdi` baca `dataset` dari DB (fallback statis). Logika sync di-extract ke `lib/sync.ts` supaya dipakai bersama oleh script CLI dan endpoint admin. Endpoint admin dilindungi header rahasia (`SYNC_SECRET`).

**Tech Stack:** Next.js 15 · Drizzle ORM · postgres.js · Bun.

---

## Catatan verifikasi

- `npx tsc --noEmit -p tsconfig.json` → tanpa output = lolos.
- `npm run build` → `✓ Compiled successfully`.
- Smoke test via `curl` ke `npm run dev` (port 3031). Bun auto-load `.env`.
- Jangan lanjut kalau Expected belum cocok.

## File Structure

- **Create** `lib/sync.ts` — fungsi `syncDataset(slug)` (extract dari script Plan 1).
- **Modify** `scripts/db-sync-dataset.ts` — pakai `lib/sync.ts` (DRY).
- **Modify** `lib/db/schema.ts` — tambah tabel `dataset`.
- **Create** `scripts/db-seed-catalog.ts` — seed katalog primer ke `dataset`.
- **Modify** `app/api/sdi/route.ts` — list baca dari DB (fallback statis).
- **Modify** `app/sdi/page.tsx` — muat katalog dari `/api/sdi` saat mount.
- **Create** `app/api/admin/sync/route.ts` — trigger sync via HTTP (auth).
- **Modify** `.env` — tambah `SYNC_SECRET`.

---

## Task 1: Extract logika sync ke `lib/sync.ts`

**Files:**
- Create: `lib/sync.ts`
- Modify: `scripts/db-sync-dataset.ts`

- [ ] **Step 1: Buat `lib/sync.ts`**

```ts
import { db, schema } from "./db";
import { eq } from "drizzle-orm";
import { fetchSdiDetail } from "./sdi-fetch";

const { datasetColumn, record, datasetSync } = schema;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/** Sync satu dataset SDI ke DB: ganti kolom + baris + metadata. Idempoten. */
export async function syncDataset(slug: string): Promise<number> {
  const d = await fetchSdiDetail(slug);

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
    let ord = 0;
    for (const batch of chunk(d.rows, 500)) {
      await db
        .insert(record)
        .values(batch.map((r) => ({ slug, ordinal: ord++, data: r })));
    }
  }

  const meta = {
    title: d.title,
    description: d.description,
    satuan: d.satuan,
    frekuensi: d.frekuensi,
    klasifikasi: d.klasifikasi ?? null,
    kontak: d.kontak ?? null,
    author: d.author ?? null,
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
```

> Jika `fetchSdiDetail` belum mengembalikan `klasifikasi/kontak/author`, tambahkan field itu di `lib/sdi-fetch.ts` (ambil dari `meta.klasifikasi_data`, `meta.kontak`, `meta.author`). Kalau sudah ada (deviasi Plan 1), lewati.

- [ ] **Step 2: Ramping-kan `scripts/db-sync-dataset.ts` agar pakai `lib/sync.ts`**

Ganti seluruh isi `scripts/db-sync-dataset.ts` menjadi:

```ts
import { syncDataset } from "../lib/sync";
import { SDI_DATASETS } from "../lib/sdi";

async function main() {
  const arg = process.argv[2];
  const slugs = arg && arg !== "all" ? [arg] : SDI_DATASETS.map((x) => x.slug);
  console.log(`Sync ${slugs.length} dataset…`);
  let ok = 0;
  for (const slug of slugs) {
    try {
      const n = await syncDataset(slug);
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

- [ ] **Step 3: Type check + uji ulang sync 1 dataset**

Run: `npx tsc --noEmit -p tsconfig.json` → tanpa output.
Run: `bun run scripts/db-sync-dataset.ts data-seni-pertunjukan-dan-visual`
Expected: `✓ data-seni-pertunjukan-dan-visual: 352 baris` lalu `Selesai: 1/1`.

- [ ] **Step 4: Commit**

```bash
git add lib/sync.ts scripts/db-sync-dataset.ts
git commit -m "refactor(db): extract syncDataset into lib/sync"
```

---

## Task 2: Tabel `dataset` (katalog)

**Files:**
- Modify: `lib/db/schema.ts`

- [ ] **Step 1: Tambah tabel di akhir `lib/db/schema.ts`**

```ts
/** Katalog dataset (untuk list /sdi). Primer = SDI; sekunder tetap statis. */
export const dataset = pgTable("dataset", {
  slug: text("slug").primaryKey(),
  sdiId: integer("sdi_id"),
  tier: text("tier").notNull(), // 'primer' | 'sekunder'
  title: text("title").notNull(),
  description: text("description").default(""),
  tags: jsonb("tags").$type<string[]>().default([]),
  source: text("source"),
  views: integer("views").notNull().default(0),
  datasetCount: integer("dataset_count").notNull().default(0),
  createdAt: text("created_at"),
  updatedAt: text("updated_at"),
});
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

- [ ] **Step 3: Push schema**

Run: `bunx drizzle-kit push`
Expected: selesai; log menyebut membuat tabel `dataset`.

- [ ] **Step 4: Commit**

```bash
git add lib/db/schema.ts
git commit -m "feat(db): add dataset catalog table"
```

---

## Task 3: Seed katalog primer

**Files:**
- Create: `scripts/db-seed-catalog.ts`

- [ ] **Step 1: Buat script seed**

```ts
import { db, schema } from "../lib/db";
import { eq } from "drizzle-orm";
import { SDI_DATASETS } from "../lib/sdi";

const { dataset } = schema;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  await db.delete(dataset).where(eq(dataset.tier, "primer"));
  const rows = SDI_DATASETS.map((d) => ({
    slug: d.slug,
    sdiId: d.id,
    tier: "primer" as const,
    title: d.title,
    description: d.description,
    tags: d.tags,
    source: "SDI · Satu Data Jakarta",
    views: d.views,
    datasetCount: d.datasetCount,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));
  for (const batch of chunk(rows, 200)) {
    await db.insert(dataset).values(batch);
  }
  console.log(`Seeded ${rows.length} dataset primer ke tabel dataset.`);
}

main();
```

- [ ] **Step 2: Type check + jalankan**

Run: `npx tsc --noEmit -p tsconfig.json` → tanpa output.
Run: `bun run scripts/db-seed-catalog.ts`
Expected: `Seeded 182 dataset primer ke tabel dataset.`

- [ ] **Step 3: Verifikasi di DB**

Run:
```bash
bun -e "import {db,schema} from './lib/db'; import {eq} from 'drizzle-orm'; const r=await db.select().from(schema.dataset).where(eq(schema.dataset.tier,'primer')); console.log('primer di DB:', r.length)"
```
Expected: `primer di DB: 182`

- [ ] **Step 4: Commit**

```bash
git add scripts/db-seed-catalog.ts
git commit -m "feat(db): seed primary catalog into dataset table"
```

---

## Task 4: List `/api/sdi` baca dari DB

**Files:**
- Modify: `app/api/sdi/route.ts`

- [ ] **Step 1: Ganti SELURUH isi `app/api/sdi/route.ts`**

```ts
import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { SDI_DATASETS, fetchSdiLive, type SdiDataset } from "@/lib/sdi";

const { dataset } = schema;

/**
 * Katalog dataset primer Dinas Pariwisata.
 * Default: baca dari DB (tabel dataset). Fallback: snapshot statis.
 * ?live=1: refresh langsung dari API SDI (list).
 */
export async function GET(req: Request) {
  const live = new URL(req.url).searchParams.get("live");

  if (live) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const datasets = await fetchSdiLive(controller.signal);
      clearTimeout(timer);
      return NextResponse.json({
        source: "live",
        count: datasets.length,
        datasets,
      });
    } catch {
      clearTimeout(timer);
      // jatuh ke DB / statis di bawah
    }
  }

  // Baca dari DB.
  try {
    const rows = await db
      .select()
      .from(dataset)
      .where(eq(dataset.tier, "primer"))
      .orderBy(desc(dataset.updatedAt));
    if (rows.length) {
      const datasets: SdiDataset[] = rows.map((r) => ({
        id: r.sdiId ?? 0,
        title: r.title,
        description: r.description ?? "",
        slug: r.slug,
        tags: r.tags ?? [],
        views: r.views,
        datasetCount: r.datasetCount,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
      return NextResponse.json({ source: "db", count: datasets.length, datasets });
    }
  } catch {
    // jatuh ke statis
  }

  return NextResponse.json({
    source: "snapshot",
    count: SDI_DATASETS.length,
    datasets: SDI_DATASETS,
  });
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

- [ ] **Step 3: Smoke test (dev :3031)**

Run:
```bash
curl -s http://localhost:3031/api/sdi | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('source:',j.source,'count:',j.count)})"
```
Expected: `source: db count: 182`

- [ ] **Step 4: Commit**

```bash
git add app/api/sdi/route.ts
git commit -m "feat(sdi): serve catalog list from DB with static fallback"
```

---

## Task 5: Katalog page muat dari DB saat mount

**Files:**
- Modify: `app/sdi/page.tsx`

Page saat ini meng-import `SDI_DATASETS` statis sebagai state awal. Tambahkan efek yang mengganti isi dengan data DB saat halaman dibuka (paint awal tetap instan dari statis).

- [ ] **Step 1: Tambah `useEffect` pemuat**

Di `app/sdi/page.tsx`, cari baris:
```tsx
  const catalog = useMemo(() => buildCatalog(rows), [rows]);
```
Tepat DI ATAS baris itu, sisipkan:
```tsx
  useEffect(() => {
    let alive = true;
    fetch("/api/sdi")
      .then((r) => r.json())
      .then((json) => {
        if (alive && json.datasets?.length) {
          setRows(json.datasets);
          setSource(json.source === "live" ? "live" : "snapshot");
        }
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);
```

- [ ] **Step 2: Pastikan `useEffect` ter-import**

Di baris import teratas, pastikan `useEffect` ada:
```tsx
import { useEffect, useMemo, useState } from "react";
```
(Jika sebelumnya `import { useMemo, useState } from "react";`, tambahkan `useEffect`.)

- [ ] **Step 3: Type check + build**

Run: `npx tsc --noEmit -p tsconfig.json` → tanpa output.
Run: `npm run build` → `✓ Compiled successfully`.

- [ ] **Step 4: Smoke test**

Run (dev :3031): buka `http://localhost:3031/sdi`, lalu:
```bash
curl -s http://localhost:3031/sdi | grep -oE "Data Primer|Data Sekunder" | sort -u
```
Expected: muncul `Data Primer` dan `Data Sekunder` (render awal dari statis; DB memuat via klien).

- [ ] **Step 5: Commit**

```bash
git add app/sdi/page.tsx
git commit -m "feat(sdi): hydrate catalog from DB on mount"
```

---

## Task 6: Endpoint admin sync (auth)

**Files:**
- Create: `app/api/admin/sync/route.ts`
- Modify: `.env`

- [ ] **Step 1: Tambah secret ke `.env`**

Tambah baris di `.env`:
```
SYNC_SECRET=ganti-dengan-string-acak-panjang
```

- [ ] **Step 2: Buat endpoint**

```ts
import { NextResponse } from "next/server";
import { syncDataset } from "@/lib/sync";
import { SDI_DATASETS } from "@/lib/sdi";

export const maxDuration = 300;

/**
 * Trigger sync dataset SDI → DB via HTTP.
 * Auth: header `x-sync-secret` harus sama dengan env SYNC_SECRET.
 * Query: ?slug=<slug> untuk 1 dataset (default). ?slug=all untuk semua
 * (hati-hati durasi; di serverless batasi per-dataset).
 */
export async function POST(req: Request) {
  const secret = process.env.SYNC_SECRET;
  if (!secret || req.headers.get("x-sync-secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const slug = new URL(req.url).searchParams.get("slug") ?? "";
  if (!slug) {
    return NextResponse.json({ error: "slug wajib diisi" }, { status: 400 });
  }

  const slugs =
    slug === "all" ? SDI_DATASETS.map((d) => d.slug) : [slug];
  const results: { slug: string; rows?: number; error?: string }[] = [];
  for (const s of slugs) {
    try {
      const rows = await syncDataset(s);
      results.push({ slug: s, rows });
    } catch (e) {
      results.push({ slug: s, error: String(e) });
    }
  }
  const ok = results.filter((r) => r.rows !== undefined).length;
  return NextResponse.json({ synced: ok, total: slugs.length, results });
}
```

- [ ] **Step 3: Type check + build**

Run: `npx tsc --noEmit -p tsconfig.json` → tanpa output.
Run: `npm run build` → `✓ Compiled successfully` dan route `/api/admin/sync` muncul.

- [ ] **Step 4: Smoke test auth + sync 1 dataset**

Muat secret dari `.env` lalu uji (dev :3031):
```bash
set -a; . ./.env; set +a
echo "tanpa secret:"; curl -s -o /dev/null -w "%{http_code}\n" -X POST "http://localhost:3031/api/admin/sync?slug=jumlah-realisasi-investasi-pariwisata"
echo "dengan secret:"; curl -s -X POST -H "x-sync-secret: $SYNC_SECRET" "http://localhost:3031/api/admin/sync?slug=jumlah-realisasi-investasi-pariwisata" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('synced:',j.synced,'/',j.total)})"
```
Expected: baris pertama `401`; baris kedua `synced: 1 / 1`.

- [ ] **Step 5: Verifikasi dataset itu kini dari DB**

```bash
curl -s http://localhost:3031/api/sdi/jumlah-realisasi-investasi-pariwisata | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log('source:',JSON.parse(s).source))"
```
Expected: `source: db` (sebelumnya `live`).

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/sync/route.ts
git commit -m "feat(admin): authed sync endpoint to ingest SDI into DB"
```

---

## Definition of Done

- `/api/sdi` → `source: "db"`, 182 dataset; katalog `/sdi` tetap tampil (primer dari DB, sekunder statis).
- `POST /api/admin/sync` menolak tanpa `x-sync-secret` (401) dan mensync dengan secret benar.
- `npx tsc` bersih; `npm run build` sukses.

## Ditunda (Vercel-later, bukan bagian plan lokal ini)

- **Vercel Cron** memanggil `/api/admin/sync` berkala → tambah `crons` di `vercel.json` saat deploy:
  ```json
  { "crons": [{ "path": "/api/admin/sync?slug=all", "schedule": "0 3 * * *" }] }
  ```
  (Cron Vercel memanggil GET; untuk itu tambah handler `GET` yang mengecek header cron / secret. Kerjakan saat fase deploy.)
- `revalidateTag` untuk invalidasi cache setelah sync (saat caching diaktifkan).
