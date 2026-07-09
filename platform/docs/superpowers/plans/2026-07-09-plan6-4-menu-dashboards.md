# Plan 6 — Restrukturisasi 4 Menu (Katalog · GCI · GPCI · Atlas) + Full Analitik

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development atau executing-plans. Steps pakai checkbox.
>
> **Prasyarat:** Plan 1–5 selesai (DB terisi, engine readiness `lib/gci/*` ada). Baca `docs/HANDOFF-gci-gpci-readiness.md`.

**Goal:** Ubah platform jadi 4 dashboard besar dengan nav global — **Katalog** (`/sdi`), **GCI** (`/gci`), **GPCI** (`/gpci`), **Atlas** (`/atlas`) — dengan analitik penuh di GCI/GPCI dan Atlas dibangun ulang bergaya platform.

**Tech Stack:** Next.js 15 · postgres.js · Tailwind · komponen `BarChart` (pure CSS, sudah ada).

---

## Yang SUDAH ada (scaffold — sudah jalan, tsc OK, tiap route 200)

| File | Status |
|---|---|
| `components/Nav.tsx` | ✅ Nav global 4-menu (Katalog/GCI/GPCI/Atlas) + active state |
| `components/FrameworkView.tsx` | ✅ Kerangka dashboard framework: cards + tabel readiness **jalan**; 2 slot **TODO** (chart tren, aksi gap) |
| `app/gci/page.tsx`, `app/gpci/page.tsx` | ✅ Panggil `computeReadiness()` → filter framework → `FrameworkView` |
| `app/atlas/page.tsx` | ✅ Kerangka + kartu section; detail **TODO** |

**Tugasmu:** integrasi nav global (Task 1–2), isi 2 slot TODO framework (Task 3–4), bangun Atlas (Task 5), rapikan route lama (Task 6).

## Catatan verifikasi
- `npx tsc --noEmit -p tsconfig.json` → tanpa output.
- Smoke test `curl` ke `npm run dev` (port 3031).
- ⚠️ JANGAN `npm run build` sambil `next dev` jalan (share `.next` → korupsi). Stop dev dulu bila mau build.

---

## Task 1: Nav global (satu header untuk semua)

Sekarang tiap halaman punya `<header>` sendiri. Jadikan `Nav` global lalu buang header lama biar tak dobel.

**Files:** Modify `app/layout.tsx`; Modify `app/page.tsx`, `app/sdi/page.tsx`, `app/sdi/[slug]/page.tsx`, `app/dashboard/page.tsx`, `app/readiness/page.tsx`.

- [ ] **Step 1: Pasang Nav di layout**

`app/layout.tsx` — di dalam `<body>`, bungkus children:
```tsx
import { Nav } from "@/components/Nav";
// ...
      <body className={sans.variable}>
        <Nav />
        {children}
      </body>
```
(Sesuaikan dengan isi `<body>` yang ada; intinya render `<Nav />` sebelum `{children}`.)

- [ ] **Step 2: Buang header lama di tiap halaman**

Di kelima file di atas, **hapus blok header bar teratas** (yang berisi logo + nav lama), yaitu blok:
```tsx
<header style={{ background: NAVY }} className="text-white">
  ... (logo + link Dashboard/Katalog) ...
</header>
```
**Pertahankan** title/hero band di bawahnya. `Nav` di FrameworkView/atlas sudah ada — untuk `/gci`,`/gpci`,`/atlas` HAPUS `<Nav />` internalnya (karena kini global) supaya tidak dobel: hapus `import { Nav }` + `<Nav />` di `components/FrameworkView.tsx` dan `app/atlas/page.tsx`.

- [ ] **Step 3: Type check + smoke**

Run: `npx tsc --noEmit` → bersih.
Buka `/`, `/sdi`, `/gci`, `/gpci`, `/atlas` → hanya SATU nav bar di atas, menu aktif ter-highlight.

- [ ] **Step 4: Commit** — `git commit -m "feat(ui): global 4-menu nav"`

---

## Task 2: Beranda jadi landing 4-menu + overview

**Files:** Rewrite `app/page.tsx`.

- [ ] **Step 1: Ganti isi beranda**

Beranda = ringkasan + 4 pintu masuk. Ambil angka dari DB via `computeReadiness` (untuk GCI/GPCI) dan `sdiStats`/`secondaryDatasets`.

```tsx
import Link from "next/link";
import { SDI_DATASETS, sdiStats } from "@/lib/sdi";
import { secondaryDatasets } from "@/lib/secondary";
import { computeReadiness } from "@/lib/gci/readiness";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const s = sdiStats();
  const r = await computeReadiness();
  const gci = r.filter((x) => x.framework === "GCI");
  const gpci = r.filter((x) => x.framework === "GPCI");
  const ready = (a: typeof r) => a.filter((x) => x.status === "ready").length;

  const MENUS = [
    { href: "/sdi", title: "Katalog", desc: `${s.total} dataset primer SDI + ${secondaryDatasets().length} sekunder`, stat: `${s.total} dataset` },
    { href: "/gci", title: "GCI", desc: "Kearney Global Cities Index — readiness pariwisata", stat: `${ready(gci)}/${gci.length} ready` },
    { href: "/gpci", title: "GPCI", desc: "Mori Global Power City Index — readiness pariwisata", stat: `${ready(gpci)}/${gpci.length} ready` },
    { href: "/atlas", title: "Atlas", desc: "Data sekunder pendataan lapangan (GCI)", stat: `${secondaryDatasets().reduce((a, d) => a + d.rows, 0).toLocaleString("id-ID")} baris` },
  ];

  return (
    <main className="min-h-screen bg-[#f4f6fa]">
      <section style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` }} className="text-white">
        <div className="mx-auto max-w-[1320px] px-6 pt-16 pb-14">
          <div className="text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: GOLD }}>●</span> Dashboard Visualisasi Data Terkonsolidasi
          </div>
          <h1 className="mt-4 text-[34px] md:text-[46px] font-bold tracking-tight max-w-[20ch]">
            Data Pariwisata <span style={{ color: GOLD }}>&amp; Ekonomi Kreatif</span> Jakarta
          </h1>
        </div>
      </section>
      <section className="mx-auto max-w-[1320px] px-6 py-10 pb-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MENUS.map((m) => (
            <Link key={m.href} href={m.href} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:-translate-y-0.5 transition-transform">
              <div className="text-[18px] font-bold text-slate-800">{m.title}</div>
              <p className="text-[13px] text-slate-500 mt-1 min-h-[40px]">{m.desc}</p>
              <div className="mt-4 text-[13px] font-semibold" style={{ color: NAVY }}>{m.stat} →</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: tsc + smoke** `/` → 4 kartu menu. **Step 3: Commit.**

---

## Task 3: Chart tren per indikator (slot 1 FrameworkView)

Tambah seri tren ke tiap indikator data-ada, render `BarChart`.

**Files:** Modify `lib/gci/readiness.ts` (tambah `trend`), `components/FrameworkView.tsx` (render).

- [ ] **Step 1: Tambah `trend` di engine**

Di `lib/gci/readiness.ts`, pada `IndicatorResult` tambah field:
```ts
  trend: { label: string; value: number }[]; // seri periode→nilai (maks 24 titik)
```
Lalu di `latestValue`, kembalikan juga seri. Cara termudah: buat fungsi `trendSeries(slug, measure)` mirip `latestValue` tapi kembalikan seluruh titik terurut naik (label periode → value), ambil 24 terakhir. Isi `trend: []` untuk indikator tanpa data.

```ts
async function trendSeries(slug: string, measure: string | null) {
  const cols = await db.select().from(datasetColumn).where(eq(datasetColumn.slug, slug)).orderBy(asc(datasetColumn.ordinal));
  const rows = (await db.select().from(record).where(eq(record.slug, slug))).map((r) => r.data as Record<string, unknown>);
  if (!rows.length || !cols.length) return [];
  const labelRe = /periode|tahun|bulan|tanggal/i;
  const measureRe = measure ? new RegExp(measure, "i") : /jumlah|total|nilai|kunjungan|pengunjung|wisatawan|kamar|realisasi|persen|rata/i;
  const isNum = (k: string) => rows.filter((r) => num(r[k]) !== null).length >= rows.length * 0.9;
  const valueCol = cols.find((c) => measureRe.test(c.key) && !labelRe.test(c.key) && isNum(c.key));
  const labelCol = cols.find((c) => labelRe.test(c.key)) ?? cols[0];
  if (!valueCol) return [];
  return rows
    .map((r) => ({ label: String(r[labelCol.key] ?? ""), value: num(r[valueCol.key]) ?? 0 }))
    .filter((b) => b.label !== "")
    .sort((a, b) => a.label.localeCompare(b.label))
    .slice(-24);
}
```
Panggil di loop `computeReadiness`: `const trend = withData.length ? await trendSeries(withData[0].slug, ind.measure) : [];` dan sertakan di objek hasil.

- [ ] **Step 2: Render di FrameworkView (ganti slot TODO chart)**

Ganti `<TodoSlot title="📊 Chart tren…" .../>` dengan grid chart:
```tsx
import { BarChart } from "./BarChart";
// ...
{rows.filter((x) => x.trend && x.trend.length > 1).length > 0 && (
  <div>
    <h2 className="text-[16px] font-bold text-slate-800 mb-3">Tren indikator</h2>
    <div className="grid md:grid-cols-2 gap-5">
      {rows.filter((x) => x.trend && x.trend.length > 1).map((x) => (
        <div key={x.code} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="text-[13px] font-semibold text-slate-700 mb-3">{x.name}</div>
          <BarChart data={x.trend} />
        </div>
      ))}
    </div>
  </div>
)}
```

- [ ] **Step 3: tsc + smoke** `/gci`,`/gpci` → muncul grid chart tren. **Step 4: Commit.**

---

## Task 4: Panel aksi gap (slot 2 FrameworkView)

Ganti `<TodoSlot title="🔴 Aksi menutup gap" .../>` dengan daftar indikator Partial/Gap + `note` + `owner`.

- [ ] **Step 1: Render**
```tsx
{(() => {
  const gaps = rows.filter((x) => x.status !== "ready");
  return gaps.length ? (
    <div>
      <h2 className="text-[16px] font-bold text-slate-800 mb-3">Aksi menutup gap ({gaps.length})</h2>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
        {gaps.map((x) => (
          <div key={x.code} className="px-5 py-3 flex items-start gap-3">
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full mt-0.5" style={{ background: x.status === "gap" ? "#fdecec" : "#fff6e9", color: x.status === "gap" ? "#b3261e" : "#b5651d" }}>
              {x.status}
            </span>
            <div>
              <div className="text-[14px] font-medium text-slate-800">{x.name}</div>
              <div className="text-[12px] text-slate-500">{x.note || "—"} · <span className="text-slate-400">{x.owner}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  ) : null;
})()}
```
- [ ] **Step 2: tsc + smoke + Commit.**

---

## Task 5: Bangun Atlas di dalam platform (style seragam)

Data Atlas ada di app root (`../lib/{restaurants,gci,events,golf}.ts`) — jangan impor lintas-app. **Ekspos via API di root, konsumsi dari platform.**

**Files:** (root Atlas repo) `app/api/gci/route.ts`, `app/api/events/route.ts`, `app/api/golf/route.ts`; (platform) `app/atlas/[section]/page.tsx`.

- [ ] **Step 1 (di ROOT app `../`): tambah 3 endpoint JSON**

Contoh `app/api/gci/route.ts` di root:
```ts
import { NextResponse } from "next/server";
import { GCI_RESTAURANTS } from "@/lib/gci";
export function GET() {
  return NextResponse.json({ count: GCI_RESTAURANTS.length, rows: GCI_RESTAURANTS });
}
```
Ulangi untuk `events` (`GCI_EVENTS`) dan `golf` (`GOLF_COURSES`). (`/api/restaurants` sudah ada.)
> Ini menyentuh app Atlas yang live — additive & aman. Deploy setelah diuji.

- [ ] **Step 2 (platform): halaman detail section**

`app/atlas/[section]/page.tsx` — client component: fetch dari Atlas (base `https://jakarta-restaurant-data.vercel.app`, atau `http://localhost:3030` saat dev), render tabel bergaya platform + search. Peta section→endpoint: `restoran→/api/gci`, `pertunjukan→/api/events`, `golf→/api/golf`. Deteksi kolom otomatis dari objek baris (tampilkan subset ramah: nama, kota/lokasi, kategori). Sertakan search seperti `/sdi/[slug]`.

- [ ] **Step 3: Update kartu `/atlas`** — arahkan `href={/atlas/${s.key}}` (sudah), hapus label "(TODO Plan 6)".
- [ ] **Step 4: tsc + smoke + Commit.**

> Alternatif bila tak mau sentuh root: salin data Atlas jadi snapshot JSON di `platform/data/atlas-*.json` lalu baca lokal. Lebih cepat tapi bisa basi.

---

## Task 6: Rapikan route lama

`/readiness` dan `/dashboard` kini digantikan `/gci`+`/gpci` dan beranda.

- [ ] **Step 1: Redirect** — jadikan `app/readiness/page.tsx` redirect ke `/gci`, `app/dashboard/page.tsx` redirect ke `/` (atau hapus bila yakin tak tertaut):
```tsx
import { redirect } from "next/navigation";
export default function Page() { redirect("/gci"); }
```
- [ ] **Step 2: Bersihkan tautan** ke `/readiness`,`/dashboard` yang tersisa. **Step 3: tsc + build + Commit.**

---

## Definition of Done
- Satu nav global 4-menu di semua halaman; menu aktif ter-highlight.
- `/gci` & `/gpci`: cards + tabel readiness + **chart tren** + **panel aksi gap**.
- `/atlas`: kartu section + halaman detail tabel bergaya platform.
- Beranda = landing 4-menu + overview.
- `/readiness`,`/dashboard` redirect/retired. `npx tsc` bersih; `npm run build` sukses.
