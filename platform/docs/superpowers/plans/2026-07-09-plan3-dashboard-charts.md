# Plan 3 — Dashboard & Chart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
>
> **Prasyarat:** Plan 1 & Plan 2 selesai (Postgres lokal jalan, tabel `dataset`/`dataset_sync`/`record` terisi sebagian).

**Goal:** Tambah halaman `/dashboard` berisi ringkasan angka dari DB, dan chart batang per dataset di halaman detail — supaya data tidak hanya berupa tabel.

**Architecture:** Komponen chart batang **murni CSS/div** (tanpa library chart, agar tanpa risiko dependency). `/dashboard` = Server Component yang membaca ringkasan dari Postgres (fallback aman bila DB kosong). Halaman detail mendeteksi kolom numerik + label lalu merender chart.

**Tech Stack:** Next.js 15 (Server + Client Components) · Tailwind · postgres.js. **Tanpa** library chart.

**Catatan cakupan:** KPI / readiness GCI-GPCI **TIDAK** termasuk plan ini (ter-block definisi indikator). Ini murni visualisasi data yang sudah ada.

---

## Catatan verifikasi

- `npx tsc --noEmit -p tsconfig.json` → tanpa output.
- `npm run build` → `✓ Compiled successfully`.
- Smoke test `curl` ke `npm run dev` (:3031).

## File Structure

- **Create** `components/BarChart.tsx` — chart batang CSS murni.
- **Create** `app/dashboard/page.tsx` — ringkasan dari DB (Server Component).
- **Modify** `app/sdi/[slug]/page.tsx` — deteksi kolom → render chart.
- **Modify** `app/page.tsx` & `app/sdi/page.tsx` — tautan ke `/dashboard`.

---

## Task 1: Komponen `BarChart` (CSS murni)

**Files:**
- Create: `components/BarChart.tsx`

- [ ] **Step 1: Buat komponen**

```tsx
export type Bar = { label: string; value: number };

/** Chart batang sederhana tanpa library — tinggi bar relatif ke nilai maks. */
export function BarChart({ data }: { data: Bar[] }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-1 h-64 border-l border-b border-slate-200 pl-2">
      {data.map((d, i) => (
        <div
          key={i}
          className="flex-1 flex flex-col items-center justify-end h-full group min-w-0"
        >
          <div className="text-[10px] text-slate-500 mb-1 opacity-0 group-hover:opacity-100 whitespace-nowrap">
            {d.value.toLocaleString("id-ID")}
          </div>
          <div
            className="w-full rounded-t"
            style={{
              height: `${(d.value / max) * 100}%`,
              minHeight: 2,
              background: "#0f3d7a",
            }}
            title={`${d.label}: ${d.value.toLocaleString("id-ID")}`}
          />
          <div className="text-[10px] text-slate-500 mt-1 truncate max-w-full w-full text-center">
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

- [ ] **Step 3: Commit**

```bash
git add components/BarChart.tsx
git commit -m "feat(ui): pure-css BarChart component"
```

---

## Task 2: Halaman `/dashboard`

**Files:**
- Create: `app/dashboard/page.tsx`

- [ ] **Step 1: Buat halaman (Server Component, baca DB)**

```tsx
import Link from "next/link";
import { db, schema } from "@/lib/db";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";

export const dynamic = "force-dynamic";

async function load() {
  try {
    const datasets = await db.select().from(schema.dataset);
    const syncs = await db.select().from(schema.datasetSync);
    return { datasets, syncs };
  } catch {
    return { datasets: [], syncs: [] };
  }
}

export default async function DashboardPage() {
  const { datasets, syncs } = await load();
  const primer = datasets.filter((d) => d.tier === "primer").length;
  const totalRows = syncs.reduce((s, x) => s + (x.total ?? 0), 0);
  const lastSync = syncs
    .map((s) => s.syncedAt)
    .filter(Boolean)
    .map((d) => new Date(d as unknown as string).getTime())
    .sort((a, b) => b - a)[0];

  const recent = [...syncs]
    .sort(
      (a, b) =>
        new Date(b.syncedAt as unknown as string).getTime() -
        new Date(a.syncedAt as unknown as string).getTime()
    )
    .slice(0, 15);

  return (
    <main className="min-h-screen bg-[#f4f6fa]">
      <header style={{ background: NAVY }} className="text-white">
        <div className="mx-auto max-w-[1320px] px-6 h-[76px] flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-jakarta.png"
              alt="Logo Jakarta"
              className="h-11 w-auto bg-white rounded-md p-1"
            />
            <div className="leading-tight">
              <div className="font-semibold tracking-tight text-[15px]">
                Dinas Pariwisata &amp; Ekonomi Kreatif
              </div>
              <div className="text-[12px] text-white/70">
                Provinsi DKI Jakarta · Dashboard
              </div>
            </div>
          </div>
          <Link
            href="/sdi"
            className="text-[13px] font-medium text-white/85 hover:text-white"
          >
            Katalog Data →
          </Link>
        </div>
      </header>

      <section
        style={{
          background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)`,
        }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-8 pb-12">
          <div className="text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: GOLD }}>●</span> Ringkasan Platform
          </div>
          <h1 className="mt-3 text-[30px] md:text-[36px] font-bold tracking-tight">
            Dashboard Data
          </h1>
          <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-[760px]">
            <Stat label="DATASET PRIMER" value={String(primer)} />
            <Stat label="DATASET TERSYNC" value={String(syncs.length)} />
            <Stat
              label="TOTAL BARIS DATA"
              value={totalRows.toLocaleString("id-ID")}
            />
            <Stat
              label="SYNC TERAKHIR"
              value={
                lastSync
                  ? new Date(lastSync).toLocaleDateString("id-ID", {
                      day: "2-digit",
                      month: "short",
                    })
                  : "—"
              }
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-8 pb-20">
        <h2 className="text-[15px] font-semibold text-slate-800 mb-3">
          Dataset terakhir disinkronkan
        </h2>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-[14px]">
            <thead>
              <tr
                style={{ background: NAVY }}
                className="text-white text-left text-[12px] uppercase tracking-wider"
              >
                <th className="px-4 py-3 font-semibold">Dataset</th>
                <th className="px-4 py-3 font-semibold text-right w-28">Baris</th>
                <th className="px-4 py-3 font-semibold w-40">Sync</th>
                <th className="px-4 py-3 font-semibold w-24 text-center">Buka</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((s) => (
                <tr key={s.slug} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-slate-800">{s.title ?? s.slug}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {(s.total ?? 0).toLocaleString("id-ID")}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-[13px] tabular-nums">
                    {s.syncedAt
                      ? new Date(
                          s.syncedAt as unknown as string
                        ).toLocaleString("id-ID")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/sdi/${s.slug}`}
                      style={{ color: NAVY }}
                      className="text-[13px] font-medium hover:underline"
                    >
                      Lihat →
                    </Link>
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    Belum ada dataset tersync. Jalankan sync dulu (Plan 1/2).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 border border-white/15 px-4 py-3">
      <div className="text-[11px] font-mono tracking-wider text-white/60">
        {label}
      </div>
      <div className="text-[22px] font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Type check + build**

Run: `npx tsc --noEmit -p tsconfig.json` → tanpa output.
Run: `npm run build` → `✓ Compiled successfully` dan route `/dashboard` muncul.

- [ ] **Step 3: Smoke test**

Run (dev :3031):
```bash
curl -sf -o /dev/null -w "/dashboard %{http_code}\n" http://localhost:3031/dashboard
curl -s http://localhost:3031/dashboard | grep -oE "DATASET PRIMER|TOTAL BARIS DATA" | sort -u
```
Expected: `/dashboard 200` dan kedua label muncul.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/page.tsx
git commit -m "feat(dashboard): summary page reading from DB"
```

---

## Task 3: Chart di halaman detail dataset

**Files:**
- Modify: `app/sdi/[slug]/page.tsx`

- [ ] **Step 1: Import BarChart**

Di bagian import atas `app/sdi/[slug]/page.tsx`, tepat di bawah `import Link from "next/link";`, tambahkan:
```tsx
import { BarChart, type Bar } from "@/components/BarChart";
```

- [ ] **Step 2: Tambah deteksi data chart**

Di dalam komponen, cari:
```tsx
  const rows = useMemo(() => {
```
Tepat DI ATAS baris itu, sisipkan:
```tsx
  const chart = useMemo<Bar[] | null>(() => {
    if (!data || !data.rows.length || !columns.length) return null;
    const num = (v: unknown) => {
      const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
      return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : null;
    };
    // Kolom nilai = kolom yang mayoritas barisnya numerik.
    const valueCol = columns.find(
      (c) =>
        data.rows.filter((r) => num(r[c.key]) !== null).length >=
        data.rows.length * 0.6
    );
    if (!valueCol) return null;
    // Kolom label = kolom pertama yang bukan kolom nilai (mis. periode).
    const labelCol = columns.find((c) => c.key !== valueCol.key) ?? valueCol;
    return data.rows
      .map((r) => ({
        label: String(r[labelCol.key] ?? ""),
        value: num(r[valueCol.key]) ?? 0,
      }))
      .filter((b) => b.label !== "")
      .slice(0, 30);
  }, [data, columns]);
```

- [ ] **Step 3: Render chart sebelum tabel**

Cari blok pembuka section tabel:
```tsx
        {data && (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
```
Tepat DI ATAS `{data && (` itu, sisipkan:
```tsx
        {chart && chart.length > 1 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-6">
            <div className="text-[13px] font-semibold text-slate-700 mb-4">
              Visualisasi cepat
            </div>
            <BarChart data={chart} />
          </div>
        )}
```

- [ ] **Step 4: Type check + build**

Run: `npx tsc --noEmit -p tsconfig.json` → tanpa output.
Run: `npm run build` → `✓ Compiled successfully`.

- [ ] **Step 5: Smoke test visual**

Run (dev :3031): buka `http://localhost:3031/sdi/data-seni-pertunjukan-dan-visual`.
Expected: halaman tampil; jika dataset punya kolom numerik (mis. jumlah), muncul kotak "Visualisasi cepat" berisi batang. Dataset tanpa kolom numerik jelas: chart tidak muncul (tabel tetap ada) — itu benar.

- [ ] **Step 6: Commit**

```bash
git add app/sdi/[slug]/page.tsx
git commit -m "feat(sdi): quick bar chart on dataset detail"
```

---

## Task 4: Tautan ke `/dashboard`

**Files:**
- Modify: `app/page.tsx`, `app/sdi/page.tsx`

- [ ] **Step 1: Beranda — tambah tautan di header**

Di `app/page.tsx`, cari:
```tsx
          <Link
            href="/sdi"
            className="text-[13px] font-medium text-white/85 hover:text-white transition-colors"
          >
            Katalog Data →
          </Link>
```
Ganti jadi:
```tsx
          <nav className="flex items-center gap-5 text-[13px] font-medium text-white/85">
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/sdi" className="hover:text-white transition-colors">
              Katalog Data →
            </Link>
          </nav>
```

- [ ] **Step 2: Katalog — tambah tautan Dashboard di header**

Di `app/sdi/page.tsx`, cari `<Link href="/" className="hover:text-white transition-colors">` di dalam `<nav ...>` header, dan tepat DI ATAS-nya sisipkan:
```tsx
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
```

- [ ] **Step 3: Type check + build**

Run: `npx tsc --noEmit -p tsconfig.json` → tanpa output.
Run: `npm run build` → `✓ Compiled successfully`.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx app/sdi/page.tsx
git commit -m "feat(nav): link to dashboard from home and catalog"
```

---

## Definition of Done

- `/dashboard` tampil: 4 kartu ringkasan (primer, tersync, total baris, sync terakhir) + tabel dataset terakhir disync, dibaca dari DB.
- Halaman detail dataset menampilkan chart batang untuk dataset yang punya kolom numerik.
- Tautan Dashboard tersedia dari beranda & katalog.
- `npx tsc` bersih; `npm run build` sukses.

## Berikutnya (di luar 3 plan ini)

- **KPI / readiness GCI-GPCI** — butuh definisi indikator (Workstream C di `plan-platform.md`).
- **Deploy** — Vercel + Neon (ganti `DATABASE_URL`), aktifkan Cron. Lihat `plan-platform.md`.
