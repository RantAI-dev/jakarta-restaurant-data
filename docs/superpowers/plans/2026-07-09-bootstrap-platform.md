# Bootstrap `dispar-data-platform` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold project Next.js baru `dispar-data-platform` (terpisah dari Atlas) berisi fitur SDI yang sudah proven (katalog + detail tabel) + styling disparekraf + logo Jakarta, sampai `npm run build` sukses dan siap deploy.

**Architecture:** App Next.js 15 App Router bersih. Fitur SDI (lib + pages + API routes) disalin dari app Atlas yang sudah live (proven), lalu data sekunder diubah jadi tautan ke app Atlas (Atlas = sumber sekunder berdiri sendiri, dikonsumsi via tautan/HTTP — bukan di-import).

**Tech Stack:** Next.js 15 · React 19 RC · Tailwind CSS 3.4 · TypeScript · Bun/npm.

---

## Konteks & path

- **Project baru (dibuat plan ini):** `/home/shiro/rantai/dispar-data-platform`
- **Sumber file proven (Atlas, sudah ada):** `/home/shiro/rantai/Dinas-Pariwisata`
- Jalankan semua command **dari dalam** folder project baru kecuali disebut lain.

## Catatan verifikasi

Belum ada test runner. Verifikasi pakai:
- `npx tsc --noEmit -p tsconfig.json` → tanpa output = lolos.
- `npm run build` → harus `✓ Compiled successfully`.
- `curl` ke `npm run dev` (port 3031).

Jangan lanjut task berikutnya kalau Expected belum cocok.

## File Structure (hasil akhir)

```
dispar-data-platform/
  package.json                       (baru)
  next.config.mjs  postcss.config.mjs  tsconfig.json  globals.d.ts   (copy dari Atlas)
  tailwind.config.ts                 (baru)
  .gitignore  .env.example  README.md (baru)
  app/
    layout.tsx  globals.css  page.tsx (baru)
    sdi/page.tsx                     (copy + 2 patch)
    sdi/[slug]/page.tsx              (copy apa adanya)
    api/sdi/route.ts                 (copy apa adanya)
    api/sdi/[slug]/route.ts          (copy apa adanya)
  lib/
    sdi.ts  sdi-data.json            (copy apa adanya)
    secondary.ts                     (baru — tautan ke Atlas)
  public/logo-jakarta.png            (copy)
```

---

## Task 1: Buat folder + salin file proven dari Atlas

**Files:** membuat struktur + menyalin fitur SDI yang sudah jalan.

- [ ] **Step 1: Buat struktur folder**

Run:
```bash
mkdir -p /home/shiro/rantai/dispar-data-platform/{app/sdi/'[slug]',app/api/sdi/'[slug]',lib,public,docs/superpowers/plans}
cd /home/shiro/rantai/dispar-data-platform
```

- [ ] **Step 2: Salin file SDI proven + config dari Atlas**

Run:
```bash
SRC=/home/shiro/rantai/Dinas-Pariwisata
cp "$SRC/lib/sdi.ts"                    lib/sdi.ts
cp "$SRC/lib/sdi-data.json"             lib/sdi-data.json
cp "$SRC/app/api/sdi/route.ts"          app/api/sdi/route.ts
cp "$SRC/app/api/sdi/[slug]/route.ts"   app/api/sdi/[slug]/route.ts
cp "$SRC/app/sdi/page.tsx"              app/sdi/page.tsx
cp "$SRC/app/sdi/[slug]/page.tsx"       app/sdi/[slug]/page.tsx
cp "$SRC/public/logo-jakarta.png"       public/logo-jakarta.png
cp "$SRC/tsconfig.json"                 tsconfig.json
cp "$SRC/next.config.mjs"               next.config.mjs
cp "$SRC/postcss.config.mjs"            postcss.config.mjs
cp "$SRC/globals.d.ts"                  globals.d.ts
```

- [ ] **Step 3: Verifikasi tersalin**

Run: `ls lib app/sdi app/api/sdi public && echo "---" && test -f lib/sdi-data.json && echo "sdi-data OK"`
Expected: file-file di atas terlihat + `sdi-data OK`.

---

## Task 2: `package.json` + install dependency

**Files:**
- Create: `package.json`

- [ ] **Step 1: Tulis `package.json`**

```json
{
  "name": "dispar-data-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3031",
    "build": "next build",
    "start": "next start -p 3031",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.7",
    "react": "19.0.0-rc-66855b96-20241106",
    "react-dom": "19.0.0-rc-66855b96-20241106"
  },
  "devDependencies": {
    "@types/node": "^22",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.15",
    "typescript": "^5"
  }
}
```

- [ ] **Step 2: Install**

Run: `npm install`
Expected: selesai tanpa error; folder `node_modules` muncul.

- [ ] **Step 3: Commit belakangan** (git di-init di Task 8).

---

## Task 3: Config Tailwind + gitignore + env + README

**Files:**
- Create: `tailwind.config.ts`, `.gitignore`, `.env.example`, `README.md`

- [ ] **Step 1: `tailwind.config.ts`**

```ts
import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#0f3d7a", deep: "#0a2b57" },
        gold: "#e8a33d",
        civic: "#0e7c42",
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
} satisfies Config;
```

- [ ] **Step 2: `.gitignore`**

```
/node_modules
/.next/
/out/
next-env.d.ts
/build
.DS_Store
*.pem
npm-debug.log*
.env
.env*.local
.vercel
*.tsbuildinfo
/drizzle
```

- [ ] **Step 3: `.env.example`**

```
# Neon Postgres (fase persistence — lihat plan neon-detail-persistence)
DATABASE_URL=postgres://user:pass@host/db?sslmode=require
```

- [ ] **Step 4: `README.md`**

```markdown
# Dispar Data Platform

Dashboard visualisasi data terkonsolidasi Dinas Pariwisata & Ekonomi Kreatif
DKI Jakarta. Data primer dari Satu Data Jakarta (SDI), data sekunder dari
pendataan Jakarta Atlas (GCI).

- `/` — beranda platform
- `/sdi` — katalog data (primer SDI + sekunder Atlas), filter + search
- `/sdi/[slug]` — isi tabel per dataset SDI

Dev: `npm run dev` (port 3031). Deploy: Vercel.
```

- [ ] **Step 5: Verifikasi**

Run: `ls tailwind.config.ts .gitignore .env.example README.md`
Expected: keempat file terlihat.

---

## Task 4: `globals.css` + `layout.tsx`

**Files:**
- Create: `app/globals.css`, `app/layout.tsx`

- [ ] **Step 1: `app/globals.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  color-scheme: light;
}

html,
body {
  min-height: 100%;
  background: #f4f6fa;
  color: #0f172a;
  font-family: var(--font-sans), system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

::selection {
  background: #0f3d7a;
  color: #fff;
}
```

- [ ] **Step 2: `app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Dashboard Data Pariwisata & Ekraf — DKI Jakarta",
  description:
    "Platform visualisasi data terkonsolidasi Dinas Pariwisata & Ekonomi Kreatif Provinsi DKI Jakarta.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={sans.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

---

## Task 5: `lib/secondary.ts` (tautan ke Atlas)

**Files:**
- Create: `lib/secondary.ts`

Berbeda dari versi Atlas (yang meng-import data GCI), di platform ini data sekunder cukup **deskriptor + tautan** ke app Atlas yang live. Angka `rows` snapshot; fase lanjut ambil via API Atlas.

- [ ] **Step 1: Tulis file**

```ts
/**
 * Data sekunder — dataset pendataan Jakarta Atlas (GCI) yang melengkapi data
 * primer SDI. Atlas adalah app terpisah (jakarta-restaurant-data); di sini
 * cukup tautan. `rows` snapshot; fase lanjut ambil via API Atlas.
 */
export type SecondaryDataset = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  rows: number;
  href: string;
};

export const ATLAS_BASE = "https://jakarta-restaurant-data.vercel.app";

export function secondaryDatasets(): SecondaryDataset[] {
  return [
    {
      id: "sec-gci-resto",
      title: "Restoran & Kafe GCI Jakarta",
      description:
        "Pendataan seluruh restoran & kafe se-Jakarta (termasuk restoran hotel bintang 3–4) untuk Global City Index.",
      tags: ["gci", "restoran", "kuliner", "sekunder"],
      rows: 2577,
      href: `${ATLAS_BASE}/gci`,
    },
    {
      id: "sec-events",
      title: "Pertunjukan & Budaya GCI",
      description:
        "Pertunjukan musik internasional/nasional & acara budaya besar di Jakarta 2025–2026 (konser, festival, tari, teater, seni rupa, film) untuk Global City Index.",
      tags: ["gci", "event", "pertunjukan", "budaya", "sekunder"],
      rows: 308,
      href: `${ATLAS_BASE}/events`,
    },
    {
      id: "sec-resto-dir",
      title: "Direktori Restoran Kurasi",
      description:
        "Direktori restoran & kafe pilihan Jakarta dengan sumber sitasi publik yang terverifikasi.",
      tags: ["restoran", "kuliner", "direktori", "sekunder"],
      rows: 604,
      href: `${ATLAS_BASE}/restaurants`,
    },
    {
      id: "sec-golf",
      title: "Lapangan Golf Jakarta",
      description:
        "Pendataan lapangan & driving range golf di Jakarta dan sekitarnya.",
      tags: ["golf", "olahraga", "wisata", "sekunder"],
      rows: 14,
      href: `${ATLAS_BASE}/golf`,
    },
  ];
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

---

## Task 6: Patch katalog `app/sdi/page.tsx` (tautan sekunder = external)

File ini disalin dari Atlas. Data sekunder sekarang mengarah ke URL Atlas (bukan route internal), jadi harus buka tab baru.

**Files:**
- Modify: `app/sdi/page.tsx`

- [ ] **Step 1: Set sekunder `external: true`**

Cari blok `const sekunder: CatalogRow[] = secondaryDatasets().map((s) => ({` lalu ubah baris `external: false,` (di dalam blok itu, tepat setelah `href: s.href,`) menjadi `external: true,`.

Cari:
```ts
    size: `${s.rows.toLocaleString("id-ID")} baris`,
    href: s.href,
    external: false,
  }));
  return [...primer, ...sekunder];
```
Ganti jadi:
```ts
    size: `${s.rows.toLocaleString("id-ID")} baris`,
    href: s.href,
    external: true,
  }));
  return [...primer, ...sekunder];
```

- [ ] **Step 2: Sel Aksi bercabang internal vs external**

Cari:
```tsx
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={r.href}
                        style={{ color: NAVY }}
                        className="text-[13px] font-medium hover:underline whitespace-nowrap"
                      >
                        Lihat data →
                      </Link>
                    </td>
```
Ganti jadi:
```tsx
                    <td className="px-4 py-3 text-center">
                      {r.external ? (
                        <a
                          href={r.href}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: NAVY }}
                          className="text-[13px] font-medium hover:underline whitespace-nowrap"
                        >
                          Lihat data ↗
                        </a>
                      ) : (
                        <Link
                          href={r.href}
                          style={{ color: NAVY }}
                          className="text-[13px] font-medium hover:underline whitespace-nowrap"
                        >
                          Lihat data →
                        </Link>
                      )}
                    </td>
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

---

## Task 7: Beranda `app/page.tsx`

**Files:**
- Create: `app/page.tsx`

- [ ] **Step 1: Tulis beranda**

```tsx
import Link from "next/link";
import { SDI_DATASETS, sdiStats } from "@/lib/sdi";
import { secondaryDatasets } from "@/lib/secondary";

const NAVY = "#0f3d7a";
const NAVY_DEEP = "#0a2b57";
const GOLD = "#e8a33d";

export default function HomePage() {
  const stats = sdiStats();
  const secondary = secondaryDatasets();
  const secondaryRows = secondary.reduce((s, d) => s + d.rows, 0);

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
                Provinsi DKI Jakarta · Platform Data
              </div>
            </div>
          </div>
          <Link
            href="/sdi"
            className="text-[13px] font-medium text-white/85 hover:text-white transition-colors"
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
        <div className="mx-auto max-w-[1320px] px-6 pt-16 pb-20">
          <div className="text-[12px] font-mono uppercase tracking-widest text-white/60">
            <span style={{ color: GOLD }}>●</span> Dashboard Visualisasi Data
            Terkonsolidasi
          </div>
          <h1 className="mt-4 text-[34px] md:text-[46px] font-bold tracking-tight max-w-[20ch]">
            Data Pariwisata{" "}
            <span style={{ color: GOLD }}>&amp; Ekonomi Kreatif</span> Jakarta
          </h1>
          <p className="mt-4 text-white/75 max-w-[68ch] text-[16px]">
            Menyatukan data primer dari Satu Data Jakarta dengan data sekunder
            pendataan lapangan, diarahkan untuk memenuhi indikator Global City
            Index (GCI) &amp; GPCI.
          </p>

          <div className="mt-9 grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-[560px]">
            <Stat label="DATASET PRIMER" value={String(stats.total)} />
            <Stat label="DATASET SEKUNDER" value={String(secondary.length)} />
            <Stat
              label="BARIS DATA SEKUNDER"
              value={secondaryRows.toLocaleString("id-ID")}
            />
          </div>

          <div className="mt-10">
            <Link
              href="/sdi"
              className="inline-flex items-center gap-2 bg-white text-[15px] font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
              style={{ color: NAVY }}
            >
              Buka Katalog Data →
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-[1320px] px-6 py-10 text-[13px] text-slate-500">
        <p>
          Sumber primer: Satu Data Indonesia — Jakarta ·{" "}
          <a
            href="https://satudata.jakarta.go.id"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            satudata.jakarta.go.id
          </a>
          . Data sekunder: pendataan Jakarta Atlas (GCI).
        </p>
        <p className="mt-1 text-slate-400">
          © 2026 Dinas Pariwisata &amp; Ekonomi Kreatif Provinsi DKI Jakarta
        </p>
      </footer>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/10 border border-white/15 px-4 py-3">
      <div className="text-[11px] font-mono tracking-wider text-white/60">
        {label}
      </div>
      <div className="text-[24px] font-bold tabular-nums mt-1">{value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: tanpa output.

---

## Task 8: Build, smoke test, git init, commit

- [ ] **Step 1: Build produksi**

Run: `npm run build`
Expected: `✓ Compiled successfully` dan tabel route memuat `/`, `/sdi`, `/sdi/[slug]`, `/api/sdi`, `/api/sdi/[slug]`.

- [ ] **Step 2: Smoke test dev**

Run (background): `npm run dev` lalu:
```bash
curl -sf -o /dev/null -w "/ %{http_code}\n"     http://localhost:3031/
curl -s  http://localhost:3031/sdi | grep -oE "Data Primer|Data Sekunder" | sort -u
curl -s  http://localhost:3031/api/sdi | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log('sdi count:',JSON.parse(s).count))"
```
Expected: `/ 200`, muncul `Data Primer` & `Data Sekunder`, `sdi count: 182`.

- [ ] **Step 3: Git init + commit**

Run:
```bash
git init -q
git add -A
git commit -q -m "feat: bootstrap dispar-data-platform (SDI catalog + detail, disparekraf styling)"
git log --oneline -1
```
Expected: satu commit tercatat.

- [ ] **Step 4 (operator): Link ke Vercel + deploy**

> Butuh akun Vercel — agent boleh menyiapkan, operator konfirmasi. Buat repo GitHub baru `dispar-data-platform`, push, lalu import di Vercel (atau `vercel link` + `vercel --prod`). Ini project & domain **terpisah** dari Atlas.

---

## Definition of Done

- `npm run build` sukses; `/`, `/sdi`, `/sdi/[slug]` jalan di dev (port 3031).
- Katalog tampilkan 182 primer + 4 sekunder; sekunder buka Atlas di tab baru.
- Repo git ter-init dengan commit awal. Atlas (`jakarta-restaurant-data`) tidak tersentuh.

## Plan berikutnya (di project baru ini)

1. `2026-07-09-neon-detail-persistence.md` — persist detail dataset ke Neon (sudah ditulis).
2. Ingestion & Operasi (sync endpoint + Vercel Cron + auth) — lihat `plan-platform.md` Workstream B.
3. Katalog dari DB · Dashboard viz · KPI GCI-GPCI — Workstream C & D.
