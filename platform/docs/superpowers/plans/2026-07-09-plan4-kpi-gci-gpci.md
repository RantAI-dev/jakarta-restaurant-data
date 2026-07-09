# Plan 4 — Engine Readiness GCI / GPCI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development atau superpowers:executing-plans. Steps pakai checkbox (`- [ ]`).
>
> **Prasyarat:** Plan 1–3 selesai (Postgres lokal, tabel `dataset`/`dataset_sync`/`record`/`dataset_column` terisi). Baca dulu draft indikator: `docs/superpowers/specs/2026-07-09-indikator-gci-gpci-draft.md`.

**Goal:** Tambah halaman `/readiness` yang menampilkan matriks kesiapan data terhadap indikator budaya/pariwisata **GCI (Cultural Experience)** & **GPCI (Cultural Interaction)** — status Ready/Partial/Gap per indikator, dataset yang mengisinya, dan nilai terbaru bila ada.

**Architecture:** Konfigurasi indikator **data-driven** di `lib/indicators.ts` (framework, dimensi, nama, status draft, kata kunci pencocokan dataset). `lib/readiness.ts` mencocokkan indikator ke tabel `dataset` (by judul), cek `dataset_sync` untuk kesiapan, dan menarik nilai terbaru dari `record`. `/readiness` = Server Component yang merender matriksnya. **Bukan** menghitung skor GCI/GPCI global — hanya kesiapan data (lihat batasan di draft).

**Tech Stack:** Next.js 15 (Server Component) · Drizzle · postgres.js · Tailwind.

> ⚠️ **Status indikator & pemetaan di `lib/indicators.ts` masih DRAFT** (dari framework publik). Angka/definisi final menunggu validasi Mas Maulana. Struktur sengaja dibuat agar cukup edit config, tanpa ubah engine.

---

## Catatan verifikasi

- `npx tsc --noEmit -p tsconfig.json` → tanpa output.
- `npm run build` → `✓ Compiled successfully` (JANGAN jalankan barengan `next dev` yang share `.next`).
- Smoke test `curl` ke `npm run dev` (:3031).

## File Structure

- **Create** `lib/indicators.ts` — katalog indikator + kata kunci pemetaan (draft).
- **Create** `lib/readiness.ts` — hitung readiness + nilai terbaru dari DB.
- **Create** `app/readiness/page.tsx` — matriks GCI/GPCI (Server Component).
- **Modify** `app/page.tsx` & `app/dashboard/page.tsx` — tautan ke `/readiness`.

---

## Task 1: Katalog indikator (`lib/indicators.ts`)

**Files:**
- Create: `lib/indicators.ts`

- [ ] **Step 1: Tulis config**

```ts
export type Readiness = "ready" | "partial" | "gap";

export type Indicator = {
  framework: "GCI" | "GPCI";
  dimension: string;
  code: string;
  name: string;
  /** Status draft dari framework publik (divalidasi Mas Maulana). */
  draftStatus: Readiness;
  /** Dataset dianggap mengisi indikator ini bila JUDUL-nya memuat salah satu
   *  frasa (lowercase, substring). Kosong = indikator gap (di luar data kita). */
  match: string[];
  /** Regex nama kolom ukuran untuk menarik nilai terbaru (opsional). */
  measure?: string;
};

/**
 * DRAFT — Kearney GCI (Cultural Experience) & Mori GPCI (Cultural Interaction).
 * Lihat docs/superpowers/specs/2026-07-09-indikator-gci-gpci-draft.md.
 */
export const INDICATORS: Indicator[] = [
  // ---- GCI · Cultural Experience ----
  {
    framework: "GCI",
    dimension: "Cultural Experience",
    code: "A1",
    name: "Kuliner beragam",
    draftStatus: "ready",
    match: ["makanan dan minuman", "restoran", "food court", "kuliner"],
    measure: "jumlah",
  },
  {
    framework: "GCI",
    dimension: "Cultural Experience",
    code: "A2",
    name: "Seni visual & pertunjukan",
    draftStatus: "ready",
    match: ["seni pertunjukan", "pertunjukan musik", "penyelenggaraan event"],
    measure: "jumlah",
  },
  {
    framework: "GCI",
    dimension: "Cultural Experience",
    code: "A3",
    name: "Wisatawan internasional",
    draftStatus: "ready",
    match: ["wisatawan mancanegara", "kunjungan wisatawan", "tic"],
    measure: "jumlah|kunjungan",
  },
  {
    framework: "GCI",
    dimension: "Cultural Experience",
    code: "A4",
    name: "Museum",
    draftStatus: "partial",
    match: ["obyek wisata", "desa wisata"],
  },
  {
    framework: "GCI",
    dimension: "Cultural Experience",
    code: "A5",
    name: "Event olahraga besar",
    draftStatus: "gap",
    match: [],
  },
  {
    framework: "GCI",
    dimension: "Cultural Experience",
    code: "A6",
    name: "Sister-city",
    draftStatus: "gap",
    match: [],
  },
  // ---- GPCI · Cultural Interaction ----
  {
    framework: "GPCI",
    dimension: "Cultural Interaction",
    code: "B1",
    name: "Jumlah wisatawan asing",
    draftStatus: "ready",
    match: ["wisatawan mancanegara", "kunjungan"],
    measure: "jumlah|kunjungan",
  },
  {
    framework: "GPCI",
    dimension: "Cultural Interaction",
    code: "B2",
    name: "Jumlah event budaya",
    draftStatus: "ready",
    match: ["event pariwisata", "seni pertunjukan", "pengunjung event"],
    measure: "jumlah",
  },
  {
    framework: "GPCI",
    dimension: "Cultural Interaction",
    code: "B3",
    name: "Jumlah kamar hotel",
    draftStatus: "ready",
    match: ["kamar hotel", "penyediaan akomodasi", "rekapitulasi usaha dan kamar"],
    measure: "kamar|jumlah",
  },
  {
    framework: "GPCI",
    dimension: "Cultural Interaction",
    code: "B4",
    name: "Konferensi internasional (MICE)",
    draftStatus: "ready",
    match: ["pertemuan", "konferensi", "pameran"],
    measure: "jumlah",
  },
  {
    framework: "GPCI",
    dimension: "Cultural Interaction",
    code: "B5",
    name: "Daya tarik belanja/kuliner",
    draftStatus: "ready",
    match: ["belanja", "pengeluaran", "kuliner"],
    measure: "persen|nilai|rata|jumlah",
  },
  {
    framework: "GPCI",
    dimension: "Cultural Interaction",
    code: "B6",
    name: "Hotel mewah / berbintang",
    draftStatus: "partial",
    match: ["hotel berbintang", "tingkat hunian", "lama menginap"],
    measure: "hunian|rata|persen",
  },
  {
    framework: "GPCI",
    dimension: "Cultural Interaction",
    code: "B7",
    name: "Resources budaya",
    draftStatus: "partial",
    match: ["obyek wisata", "desa wisata"],
  },
  {
    framework: "GPCI",
    dimension: "Cultural Interaction",
    code: "B8",
    name: "Jumlah stadion",
    draftStatus: "gap",
    match: [],
  },
];
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

- [ ] **Step 3: Commit**

```bash
git add lib/indicators.ts
git commit -m "feat(kpi): draft GCI/GPCI indicator catalog (data-driven)"
```

---

## Task 2: Engine readiness (`lib/readiness.ts`)

**Files:**
- Create: `lib/readiness.ts`

- [ ] **Step 1: Tulis engine**

```ts
import { db, schema } from "./db";
import { asc, eq, inArray } from "drizzle-orm";
import { INDICATORS, type Indicator, type Readiness } from "./indicators";

const { dataset, datasetSync, datasetColumn, record } = schema;

export type IndicatorResult = Indicator & {
  status: Readiness; // efektif dari data (bisa beda dari draftStatus)
  datasets: { slug: string; title: string; total: number }[];
  latest: { label: string; value: number; datasetSlug: string } | null;
};

const num = (v: unknown) => {
  const s = String(v ?? "").trim();
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

/** Hitung readiness semua indikator dari isi DB. Fallback aman bila DB error. */
export async function computeReadiness(): Promise<IndicatorResult[]> {
  let catalog: { slug: string; title: string }[] = [];
  let syncs: { slug: string; total: number | null }[] = [];
  try {
    catalog = await db
      .select({ slug: dataset.slug, title: dataset.title })
      .from(dataset);
    syncs = await db
      .select({ slug: datasetSync.slug, total: datasetSync.total })
      .from(datasetSync);
  } catch {
    // DB belum siap → semua gap
  }
  const syncTotal = new Map(syncs.map((s) => [s.slug, s.total ?? 0]));

  const results: IndicatorResult[] = [];
  for (const ind of INDICATORS) {
    const matched = ind.match.length
      ? catalog.filter((d) =>
          ind.match.some((kw) => d.title.toLowerCase().includes(kw))
        )
      : [];
    const withData = matched
      .map((d) => ({ ...d, total: syncTotal.get(d.slug) ?? 0 }))
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total);

    let status: Readiness;
    if (matched.length === 0) status = "gap";
    else if (withData.length > 0) status = "ready";
    else status = "partial";

    // Nilai terbaru dari dataset paling berisi.
    let latest: IndicatorResult["latest"] = null;
    if (withData.length > 0) {
      try {
        latest = await latestValue(withData[0].slug, ind.measure);
      } catch {
        latest = null;
      }
    }

    results.push({
      ...ind,
      status,
      datasets: withData.slice(0, 5).map((d) => ({
        slug: d.slug,
        title: d.title,
        total: d.total,
      })),
      latest,
    });
  }
  return results;
}

/** Ambil nilai terbaru (periode maks) dari kolom ukuran sebuah dataset. */
async function latestValue(
  slug: string,
  measure?: string
): Promise<IndicatorResult["latest"]> {
  const cols = await db
    .select()
    .from(datasetColumn)
    .where(eq(datasetColumn.slug, slug))
    .orderBy(asc(datasetColumn.ordinal));
  const rows = (
    await db.select().from(record).where(eq(record.slug, slug))
  ).map((r) => r.data as Record<string, unknown>);
  if (!rows.length || !cols.length) return null;

  const labelRe = /periode|tahun|bulan|tanggal/i;
  const measureRe = measure
    ? new RegExp(measure, "i")
    : /jumlah|total|nilai|pajak|pendapatan|kunjungan|pengunjung|wisatawan|persen|rata|kamar|realisasi/i;
  const isNum = (key: string) =>
    rows.filter((r) => num(r[key]) !== null).length >= rows.length * 0.9;

  const valueCol =
    cols.find((c) => measureRe.test(c.key) && !labelRe.test(c.key) && isNum(c.key)) ??
    cols.find((c) => !labelRe.test(c.key) && isNum(c.key));
  if (!valueCol) return null;
  const labelCol = cols.find((c) => labelRe.test(c.key)) ?? cols[0];

  // Baris dengan periode/label terbesar (asumsi periode string terurut).
  const sorted = [...rows].sort((a, b) =>
    String(b[labelCol.key] ?? "").localeCompare(String(a[labelCol.key] ?? ""))
  );
  for (const r of sorted) {
    const v = num(r[valueCol.key]);
    if (v !== null)
      return {
        label: String(r[labelCol.key] ?? ""),
        value: v,
        datasetSlug: slug,
      };
  }
  return null;
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

- [ ] **Step 3: Uji cepat via bun**

Run:
```bash
bun -e "import {computeReadiness} from './lib/readiness'; const r=await computeReadiness(); const c=(s)=>r.filter(x=>x.status===s).length; console.log('ready',c('ready'),'partial',c('partial'),'gap',c('gap')); r.filter(x=>x.latest).slice(0,3).forEach(x=>console.log(' ',x.code,x.name,'=>',x.latest.label,x.latest.value))"
```
Expected: mis. `ready 8 partial 4 gap 2` + beberapa baris nilai terbaru (mis. `A3 Wisatawan internasional => 2025xx <angka>`). Angka boleh beda.

- [ ] **Step 4: Commit**

```bash
git add lib/readiness.ts
git commit -m "feat(kpi): readiness engine (match datasets, latest value)"
```

---

## Task 3: Halaman `/readiness`

**Files:**
- Create: `app/readiness/page.tsx`

- [ ] **Step 1: Tulis halaman**

```tsx
import Link from "next/link";
import { computeReadiness, type IndicatorResult } from "@/lib/readiness";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";
const STATUS: Record<string, { label: string; bg: string; fg: string }> = {
  ready: { label: "Ready", bg: "#e8f5ee", fg: "#0e7c42" },
  partial: { label: "Partial", bg: "#fff6e9", fg: "#b5651d" },
  gap: { label: "Gap", bg: "#fdecec", fg: "#b3261e" },
};

export const dynamic = "force-dynamic";

export default async function ReadinessPage() {
  const all = await computeReadiness();
  const frameworks = ["GCI", "GPCI"] as const;
  const count = (s: string) => all.filter((x) => x.status === s).length;

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
                Readiness GCI / GPCI
              </div>
            </div>
          </div>
          <Link href="/dashboard" className="text-[13px] font-medium text-white/85 hover:text-white">
            Dashboard →
          </Link>
        </div>
      </header>

      <section
        style={{ background: `linear-gradient(180deg, ${NAVY_DEEP} 0%, ${NAVY} 100%)` }}
        className="text-white"
      >
        <div className="mx-auto max-w-[1320px] px-6 pt-8 pb-10">
          <div className="text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: GOLD }}>●</span> Kesiapan Data Indikator
          </div>
          <h1 className="mt-3 text-[28px] md:text-[34px] font-bold tracking-tight">
            Readiness GCI &amp; GPCI
          </h1>
          <p className="mt-2 text-white/70 max-w-[80ch] text-[14px]">
            Kesiapan data Dispar untuk mengisi indikator budaya/pariwisata Global
            Cities Index &amp; Global Power City Index.{" "}
            <span style={{ color: GOLD }}>Status &amp; pemetaan masih draft</span>{" "}
            — menunggu validasi indikator resmi.
          </p>
          <div className="mt-5 flex gap-3 text-[13px]">
            <Badge s="ready" n={count("ready")} />
            <Badge s="partial" n={count("partial")} />
            <Badge s="gap" n={count("gap")} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-6 py-8 pb-20 space-y-8">
        {frameworks.map((fw) => (
          <div key={fw}>
            <h2 className="text-[16px] font-bold text-slate-800 mb-3">
              {fw === "GCI"
                ? "Kearney GCI · Cultural Experience"
                : "Mori GPCI · Cultural Interaction"}
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-[14px]">
                <thead>
                  <tr style={{ background: NAVY }} className="text-white text-left text-[12px] uppercase tracking-wider">
                    <th className="px-4 py-3 font-semibold w-14">Kode</th>
                    <th className="px-4 py-3 font-semibold">Indikator</th>
                    <th className="px-4 py-3 font-semibold w-24">Status</th>
                    <th className="px-4 py-3 font-semibold">Dataset pengisi</th>
                    <th className="px-4 py-3 font-semibold w-44 text-right">Nilai terbaru</th>
                  </tr>
                </thead>
                <tbody>
                  {all
                    .filter((x) => x.framework === fw)
                    .map((x) => (
                      <Row key={x.code} x={x} />
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <p className="text-[12px] text-slate-400">
          Sumber definisi indikator: Kearney Global Cities Index & Mori Global
          Power City Index (draft pemetaan internal).
        </p>
      </section>
    </main>
  );
}

function Row({ x }: { x: IndicatorResult }) {
  const st = STATUS[x.status];
  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-4 py-3 text-slate-400 tabular-nums">{x.code}</td>
      <td className="px-4 py-3 font-medium text-slate-800">{x.name}</td>
      <td className="px-4 py-3">
        <span
          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
          style={{ background: st.bg, color: st.fg }}
        >
          {st.label}
        </span>
      </td>
      <td className="px-4 py-3">
        {x.datasets.length ? (
          <div className="flex flex-col gap-1">
            {x.datasets.map((d) => (
              <Link
                key={d.slug}
                href={`/sdi/${d.slug}`}
                className="text-[13px] text-slate-600 hover:underline"
                style={{ color: NAVY }}
              >
                {d.title}
              </Link>
            ))}
          </div>
        ) : (
          <span className="text-[13px] text-slate-400">
            — (di luar data Dispar / lintas-OPD)
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-right tabular-nums text-slate-700">
        {x.latest ? (
          <>
            <div className="font-semibold">
              {x.latest.value.toLocaleString("id-ID")}
            </div>
            <div className="text-[11px] text-slate-400">
              periode {x.latest.label}
            </div>
          </>
        ) : (
          <span className="text-slate-300">—</span>
        )}
      </td>
    </tr>
  );
}

function Badge({ s, n }: { s: string; n: number }) {
  const st = STATUS[s];
  return (
    <span
      className="px-3 py-1 rounded-full font-medium"
      style={{ background: st.bg, color: st.fg }}
    >
      {st.label}: {n}
    </span>
  );
}
```

- [ ] **Step 2: Type check + build**

Run: `npx tsc --noEmit -p tsconfig.json` → tanpa output.
Run: `npm run build` → `✓ Compiled successfully` dan route `/readiness` muncul.

- [ ] **Step 3: Smoke test**

Run (dev :3031):
```bash
curl -sf -o /dev/null -w "/readiness %{http_code}\n" http://localhost:3031/readiness
curl -s http://localhost:3031/readiness | grep -oE "Cultural Experience|Cultural Interaction|Ready|Gap" | sort -u
```
Expected: `/readiness 200` + label-label muncul.

- [ ] **Step 4: Commit**

```bash
git add app/readiness/page.tsx
git commit -m "feat(kpi): GCI/GPCI readiness matrix page"
```

---

## Task 4: Tautan ke `/readiness`

**Files:**
- Modify: `app/dashboard/page.tsx`

- [ ] **Step 1: Tambah tautan di header dashboard**

Di `app/dashboard/page.tsx`, cari `<Link href="/sdi" ...>Katalog Data →</Link>` di header, dan tepat DI ATAS-nya sisipkan:
```tsx
          <Link
            href="/readiness"
            className="text-[13px] font-medium text-white/85 hover:text-white mr-5"
          >
            Readiness GCI/GPCI
          </Link>
```

- [ ] **Step 2: Type check + build + commit**

Run: `npx tsc --noEmit` → tanpa output. `npm run build` → sukses.
```bash
git add app/dashboard/page.tsx
git commit -m "feat(nav): link to readiness from dashboard"
```

---

## Definition of Done

- `/readiness` menampilkan matriks GCI & GPCI: tiap indikator + status (Ready/Partial/Gap) + dataset pengisi (tertaut) + nilai terbaru.
- Status dihitung dari isi DB (bukan hanya draftStatus statis).
- `npx tsc` bersih; `npm run build` sukses.

## Setelah validasi Mas Maulana

- Update `lib/indicators.ts`: perbaiki `name`/`match`/`measure`/`draftStatus`
  sesuai definisi resmi; tambah indikator yang kurang.
- Kalau diminta skor gabungan berbobot: tambah `weight` per indikator +
  normalisasi (butuh data pembanding — diskusikan lingkupnya).
- Indikator Gap lintas-OPD (Dispora/Kebudayaan/Biro Kerja Sama): sepakati
  apakah ditarik datanya atau ditandai out-of-scope.
